import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import { isProductionHost } from "./src/lib/siteEnv";
import {
  ROUTE_META,
  NOT_FOUND_META,
  PREVIEW_ROBOTS,
  ROBOTS_TXT,
  PREVIEW_ROBOTS_TXT,
  injectMeta,
  buildSitemapXml,
} from "./seo";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SEO data (ROUTE_META, sitemap, robots) jsou ve sdíleném ./seo.ts – stejná data
// používá i statický build pro Vercel (scripts/prerender.ts).

/**
 * Náhled vs. ostrý web podle skutečné domény požadavku (za proxy X-Forwarded-Host).
 * Mimo PRODUCTION_HOSTS je vše noindex – nic se nepřepíná ručně, takže
 * omezení náhledu nemůže omylem zůstat zapnuté na aufinauto.cz.
 */
function isPreviewRequest(req: express.Request): boolean {
  const host = (req.headers["x-forwarded-host"] as string) || req.headers.host;
  return !isProductionHost(host);
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === "production";

  app.use(express.json());

  // Náhled (jiná než produkční doména): zákaz indexace hlavičkou pro VŠECHNY odpovědi.
  app.use((req, res, next) => {
    if (isPreviewRequest(req)) res.setHeader("X-Robots-Tag", PREVIEW_ROBOTS);
    next();
  });

  // SEO: robots.txt
  app.get("/robots.txt", (req, res) => {
    res.type("text/plain");
    res.send(isPreviewRequest(req) ? PREVIEW_ROBOTS_TXT : ROBOTS_TXT);
  });

  // SEO: sitemap.xml — homepage, landing pages, blog (výpis i články) a detaily
  // vozů. Blog/vozy se načítají z Firestore, se statickými články jako fallback.
  app.get("/sitemap.xml", async (_req, res) => {
    res.type("application/xml");
    res.send(await buildSitemapXml());
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
    // Náhled nesmí posílat e-maily majiteli ani klientům.
    if (isPreviewRequest(req)) {
      console.log("[NÁHLED] /api/contact – e-mail neodeslán.");
      res.json({ success: true, preview: true });
      return;
    }
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
          .send(injectMeta(html, ROUTE_META[req.path], isPreviewRequest(req)));
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
        !!meta || req.path.startsWith("/auto/") || req.path.startsWith("/blog/") || req.path.startsWith("/auta-k-prodeji/");
      if (isKnown) {
        res.status(200).type("html").send(injectMeta(indexHtml, meta || ROUTE_META["/"], isPreviewRequest(req)));
      } else {
        // Skutečný HTTP 404 – žádné soft-404.
        res.status(404).type("html").send(injectMeta(indexHtml, NOT_FOUND_META, isPreviewRequest(req)));
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
