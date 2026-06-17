import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { LANDING_PAGES } from "./src/landingConfig";
import { STATIC_POSTS } from "./src/blogPosts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_URL = "https://www.aufinauto.cz";

interface RouteMeta {
  title: string;
  description: string;
  canonical: string;
  robots?: string;
}

// Mapa reálných HTML rout → SEO meta. Server tyto hodnoty vkládá do
// index.html ještě před spuštěním Reactu, takže je crawler vidí i bez JS.
const ROUTE_META: Record<string, RouteMeta> = {
  "/": {
    title: "Auta na splátky bez registru a bez příjmů | AUFIN AUTO Praha",
    description:
      "Auto na splátky bez registru, bez akontace a bez doložení příjmů. Schválení do 30 minut – registry ani exekuci neřešíme. AUFIN AUTO Praha, vozy skladem.",
    canonical: `${SITE_URL}/`,
  },
};
for (const cfg of Object.values(LANDING_PAGES)) {
  ROUTE_META[`/${cfg.slug}`] = {
    title: cfg.title,
    description: cfg.description,
    canonical: `${SITE_URL}/${cfg.slug}`,
  };
}
ROUTE_META["/ochrana-osobnich-udaju"] = {
  title: "Ochrana osobních údajů (GDPR) | AUFIN AUTO",
  description:
    "Zásady zpracování a ochrany osobních údajů společnosti AUFI s.r.o. (AUFIN AUTO) v souladu s GDPR.",
  canonical: `${SITE_URL}/ochrana-osobnich-udaju`,
  robots: "noindex, follow",
};
ROUTE_META["/blog"] = {
  title: "Blog – rádce o autech na splátky | AUFIN AUTO",
  description:
    "Rádce a praktické články o autech na splátky bez registru – podmínky, insolvence, smlouvy a tipy, jak na financování vozu.",
  canonical: `${SITE_URL}/blog`,
};

const NOT_FOUND_META: RouteMeta = {
  title: "Stránka nenalezena (404) | AUFIN AUTO",
  description: "Požadovaná stránka neexistuje.",
  canonical: SITE_URL,
  robots: "noindex, follow",
};

const escapeAttr = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

interface SitemapUrl {
  loc: string;
  priority: string;
  changefreq: string;
}

// Lazy inicializace Firestore – jen pro generování sitemap.xml.
let firestore: ReturnType<typeof getFirestore> | null = null;
function getDb() {
  if (!firestore) {
    const cfg = JSON.parse(
      fs.readFileSync(path.join(__dirname, "firebase-applet-config.json"), "utf-8")
    );
    firestore = getFirestore(initializeApp(cfg), cfg.firestoreDatabaseId);
  }
  return firestore;
}

/** Sesbírá URL blogových článků a detailů vozů (Firestore + statické fallbacky). */
async function getDynamicUrls(): Promise<SitemapUrl[]> {
  const urls: SitemapUrl[] = [];

  // Blogové články – deduplikováno podle slugu.
  const postSlugs = new Set<string>();
  try {
    const snap = await getDocs(collection(getDb(), "posts"));
    snap.forEach((d) => {
      const p = d.data() as any;
      if (p.slug && p.isPublished !== false) postSlugs.add(p.slug);
    });
  } catch {
    /* offline / chybí oprávnění – použijí se jen statické články */
  }
  for (const p of STATIC_POSTS) if (p.isPublished !== false) postSlugs.add(p.slug);
  postSlugs.forEach((slug) =>
    urls.push({ loc: `${SITE_URL}/blog/${slug}`, priority: "0.7", changefreq: "monthly" })
  );

  // Detaily vozů.
  try {
    const snap = await getDocs(collection(getDb(), "cars"));
    snap.forEach((d) => {
      const c = d.data() as any;
      if (c.isVisible === false) return;
      const slug = c.seo?.slug || slugify(c.name || "");
      if (slug) urls.push({ loc: `${SITE_URL}/auto/${slug}`, priority: "0.6", changefreq: "weekly" });
    });
  } catch {
    /* offline – detaily vozů se do sitemapy nepřidají */
  }
  return urls;
}

/** Vloží do HTML šablony per-route <title>, description, canonical a OG tagy. */
function injectMeta(html: string, meta: RouteMeta): string {
  const og =
    `<meta property="og:title" content="${escapeAttr(meta.title)}" />\n    ` +
    `<meta property="og:description" content="${escapeAttr(meta.description)}" />\n    ` +
    `<meta property="og:url" content="${meta.canonical}" />`;
  let out = html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeAttr(meta.title)}</title>`)
    .replace(
      /<meta name="description" content="[^"]*"\s*\/>/,
      `<meta name="description" content="${escapeAttr(meta.description)}" />`
    )
    .replace(
      /<link rel="canonical" href="[^"]*"\s*\/>/,
      `<link rel="canonical" href="${meta.canonical}" />\n    ${og}`
    );
  if (meta.robots) {
    out = out.replace(
      /<meta name="robots" content="[^"]*"\s*\/>/,
      `<meta name="robots" content="${escapeAttr(meta.robots)}" />`
    );
  }
  return out;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === "production";

  app.use(express.json());

  // SEO: robots.txt
  app.get("/robots.txt", (req, res) => {
    res.type("text/plain");
    res.send(
      "User-agent: *\n" +
        "Allow: /\n" +
        "Disallow: /api/\n" +
        `Sitemap: ${SITE_URL}/sitemap.xml\n`
    );
  });

  // SEO: sitemap.xml — homepage, landing pages, blog (výpis i články) a detaily
  // vozů. Blog/vozy se načítají z Firestore, se statickými články jako fallback.
  app.get("/sitemap.xml", async (req, res) => {
    const today = new Date().toISOString().split("T")[0];
    const urls: SitemapUrl[] = [
      { loc: `${SITE_URL}/`, priority: "1.0", changefreq: "weekly" },
      ...Object.values(LANDING_PAGES).map((c) => ({
        loc: `${SITE_URL}/${c.slug}`,
        priority: "0.9",
        changefreq: "monthly",
      })),
      { loc: `${SITE_URL}/blog`, priority: "0.8", changefreq: "weekly" },
      ...(await getDynamicUrls()),
    ];
    res.type("application/xml");
    res.send(
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
        urls
          .map(
            (u) =>
              `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${today}</lastmod>\n` +
              `    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
          )
          .join("\n") +
        `\n</urlset>`
    );
  });

  // Nodemailer transporter – inicializuje se jednou při startu serveru.
  // Vyžaduje GMAIL_USER a GMAIL_APP_PASSWORD v .env
  const gmailUser = process.env.GMAIL_USER ?? "";
  const gmailPass = process.env.GMAIL_APP_PASSWORD ?? "";
  if (!gmailUser || !gmailPass) {
    console.warn(
      "⚠️  UPOZORNĚNÍ: GMAIL_USER nebo GMAIL_APP_PASSWORD není nastaven v .env – e-maily se nebudou odesílat."
    );
  }
  const mailer = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
  });

  // API: kontaktní formulář
  app.post("/api/contact", async (req, res) => {
    const { name, email, phone, car, message } = req.body;

    const now = new Date().toLocaleString("cs-CZ", { timeZone: "Europe/Prague" });
    const carLabel = car && car !== "other" ? car : "Nespecifikováno / individuální";

    console.log(`----- NOVÁ POPTÁVKA [${now}] -----`);
    console.log(`Jméno: ${name} | Email: ${email} | Telefon: ${phone}`);
    console.log(`Vůz: ${carLabel}`);
    console.log(`Zpráva: ${message || "(bez zprávy)"}`);

    // E-mail majiteli
    const ownerMail = {
      from: `"AUFIN AUTO web" <${gmailUser}>`,
      to: "aufin.auto@gmail.com",
      subject: `🚗 Nová poptávka – ${name}`,
      text: [
        "Přišla nová poptávka z webu aufinauto.cz",
        "",
        `Jméno:    ${name}`,
        `Telefon:  ${phone}`,
        `E-mail:   ${email || "(nevyplněn)"}`,
        `Zájem o:  ${carLabel}`,
        `Zpráva:   ${message || "(bez zprávy)"}`,
        "",
        `Odesláno: ${now}`,
      ].join("\n"),
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#fff;border-radius:12px;overflow:hidden">
          <div style="background:#D4AF37;padding:24px 32px">
            <h1 style="margin:0;font-size:20px;color:#000">🚗 Nová poptávka z webu</h1>
          </div>
          <div style="padding:32px">
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px 0;color:#999;width:110px">Jméno</td><td style="padding:8px 0;font-weight:bold">${name}</td></tr>
              <tr><td style="padding:8px 0;color:#999">Telefon</td><td style="padding:8px 0;font-weight:bold;font-size:18px"><a href="tel:${phone}" style="color:#D4AF37;text-decoration:none">${phone}</a></td></tr>
              <tr><td style="padding:8px 0;color:#999">E-mail</td><td style="padding:8px 0">${email ? `<a href="mailto:${email}" style="color:#D4AF37">${email}</a>` : "(nevyplněn)"}</td></tr>
              <tr><td style="padding:8px 0;color:#999">Zájem o</td><td style="padding:8px 0">${carLabel}</td></tr>
              ${message ? `<tr><td style="padding:8px 0;color:#999;vertical-align:top">Zpráva</td><td style="padding:8px 0">${message}</td></tr>` : ""}
            </table>
            <p style="margin-top:24px;color:#666;font-size:13px">Odesláno: ${now}</p>
          </div>
        </div>
      `,
    };

    // Autoresponder klientovi (jen pokud vyplnil email)
    const clientMail = email
      ? {
          from: `"AUFIN AUTO" <${gmailUser}>`,
          to: email,
          subject: "Vaše poptávka byla přijata – AUFIN AUTO",
          text: [
            `Dobrý den ${name},`,
            "",
            "přijali jsme vaši poptávku a brzy se vám ozveme zpět.",
            "Standardně reagujeme do 30 minut v pracovní době.",
            "",
            "Pokud máte zájem o rychlé vyřízení, neváhejte nás rovnou zavolat:",
            "📞 +420 731 562 211",
            "",
            "S pozdravem",
            "Tým AUFIN AUTO",
            "www.aufinauto.cz",
          ].join("\n"),
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#fff;border-radius:12px;overflow:hidden">
              <div style="background:#D4AF37;padding:24px 32px">
                <h1 style="margin:0;font-size:20px;color:#000">AUFIN AUTO – Potvrzení poptávky</h1>
              </div>
              <div style="padding:32px">
                <p style="font-size:16px">Dobrý den <strong>${name}</strong>,</p>
                <p style="color:#ccc;line-height:1.7">přijali jsme vaši poptávku a brzy se vám ozveme zpět. Standardně reagujeme do <strong style="color:#D4AF37">30 minut</strong> v pracovní době.</p>
                <p style="color:#ccc;line-height:1.7">Pokud máte zájem o rychlé vyřízení nebo chcete zjistit, zda splňujete podmínky, neváhejte nás rovnou zavolat:</p>
                <div style="text-align:center;margin:32px 0">
                  <a href="tel:+420731562211" style="display:inline-block;background:#D4AF37;color:#000;font-weight:bold;font-size:22px;padding:16px 40px;border-radius:50px;text-decoration:none">📞 +420 731 562 211</a>
                </div>
                <p style="color:#666;font-size:13px;margin-top:32px">S pozdravem,<br><strong style="color:#fff">Tým AUFIN AUTO</strong><br><a href="https://www.aufinauto.cz" style="color:#D4AF37">www.aufinauto.cz</a></p>
              </div>
            </div>
          `,
        }
      : null;

    try {
      await mailer.sendMail(ownerMail);
      if (clientMail) await mailer.sendMail(clientMail);
    } catch (err) {
      console.error("Chyba při odesílání e-mailu:", err);
      // Vrátíme úspěch i při chybě e-mailu – poptávka je uložena ve Firebase
    }

    res.json({ success: true, message: "Poptávka byla úspěšně odeslána." });
  });

  if (!isProd) {
    // DEV: Vite v middleware módu + per-route injekce SEO meta.
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });

    app.get(Object.keys(ROUTE_META), async (req, res, next) => {
      try {
        const templatePath = path.join(__dirname, "index.html");
        let html = fs.readFileSync(templatePath, "utf-8");
        html = await vite.transformIndexHtml(req.originalUrl, html);
        res
          .status(200)
          .type("html")
          .send(injectMeta(html, ROUTE_META[req.path]));
      } catch (err) {
        vite.ssrFixStacktrace(err as Error);
        next(err);
      }
    });

    app.use(vite.middlewares);
  } else {
    // PROD: statické soubory z dist/ + per-route injekce SEO meta.
    const distPath = path.join(process.cwd(), "dist");
    const indexHtml = fs.readFileSync(
      path.join(distPath, "index.html"),
      "utf-8"
    );
    app.use(express.static(distPath, { index: false }));
    app.get("*", (req, res) => {
      const meta = ROUTE_META[req.path];
      const isKnown =
        !!meta || req.path.startsWith("/auto/") || req.path.startsWith("/blog/");
      if (isKnown) {
        res.status(200).type("html").send(injectMeta(indexHtml, meta || ROUTE_META["/"]));
      } else {
        // Skutečný HTTP 404 – žádné soft-404.
        res.status(404).type("html").send(injectMeta(indexHtml, NOT_FOUND_META));
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
