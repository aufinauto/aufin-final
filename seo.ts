/**
 * Sdílené SEO pro server.ts (lokální běh) i scripts/prerender.ts (build pro Vercel).
 * Jediné místo, kde jsou title/description/canonical jednotlivých stránek,
 * robots.txt a sitemap – server i statický build tak nemůžou mít jiná data.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { LANDING_PAGES } from "./src/landingConfig";
import { STATIC_POSTS } from "./src/blogPosts";
import { formatKm, saleCarPath } from "./src/lib/saleCars";
import { formatCzk } from "./src/lib/installment";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const SITE_URL = "https://www.aufinauto.cz";

export interface RouteMeta {
  title: string;
  description: string;
  canonical: string;
  robots?: string;
}

// Mapa reálných HTML rout → SEO meta. Hodnoty se vkládají do index.html ještě
// před spuštěním Reactu, takže je crawler vidí i bez JS.
export const ROUTE_META: Record<string, RouteMeta> = {
  "/": {
    title: "Auta na splátky bez registru a bez příjmů | AUFIN AUTO Praha",
    description:
      "Auto na splátky bez registru a bez doložení příjmů. Pronájem s možností odkupu: počáteční platba a měsíční nájemné předem u každého vozu. Schválení do 30 minut, AUFIN AUTO Praha.",
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
ROUTE_META["/auta-k-prodeji"] = {
  title: "Ojetá auta na prodej Praha | AUFIN AUTO",
  description:
    "Ojetá auta na prodej v Praze. Prohlédněte si aktuální nabídku vozů AUFIN AUTO. Prověřené vozy, férové ceny a možnost rychlého převzetí.",
  canonical: `${SITE_URL}/auta-k-prodeji`,
};
ROUTE_META["/vykup-auta"] = {
  title: "Výkup aut Praha – vykoupíme váš vůz | AUFIN AUTO",
  description:
    "Chcete prodat auto? Vykoupíme váš vůz rychle a bez zbytečných starostí. Férová nabídka, rychlé vyřízení a možnost protiúčtu. Výkup aut Praha – AUFIN AUTO.",
  canonical: `${SITE_URL}/vykup-auta`,
};
ROUTE_META["/kontakt"] = {
  title: "Kontakt | AUFIN AUTO",
  description:
    "Kontaktujte AUFIN AUTO – auta na splátky bez registru, auta k prodeji a výkup aut. Zavolejte, napište na WhatsApp nebo vyplňte krátký formulář.",
  canonical: `${SITE_URL}/kontakt`,
};
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

export const NOT_FOUND_META: RouteMeta = {
  title: "Stránka nenalezena (404) | AUFIN AUTO",
  description: "Požadovaná stránka neexistuje.",
  canonical: SITE_URL,
  robots: "noindex, follow",
};

export const PREVIEW_ROBOTS = "noindex, nofollow";

export const ROBOTS_TXT =
  "User-agent: *\n" + "Allow: /\n" + "Disallow: /api/\n" + `Sitemap: ${SITE_URL}/sitemap.xml\n`;
export const PREVIEW_ROBOTS_TXT = "# Náhled – neindexovat\nUser-agent: *\nDisallow: /\n";

const escapeAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

/** Vloží do HTML šablony per-route <title>, description, canonical a OG tagy. */
export function injectMeta(html: string, meta: RouteMeta, preview = false): string {
  if (preview) meta = { ...meta, robots: PREVIEW_ROBOTS };
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
    .replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${meta.canonical}" />\n    ${og}`);
  if (meta.robots) {
    out = out.replace(
      /<meta name="robots" content="[^"]*"\s*\/>/,
      `<meta name="robots" content="${escapeAttr(meta.robots)}" />`
    );
  }
  return out;
}

// Lazy inicializace Firestore – jen pro čtení článků a vozů (sitemap, prerender).
let firestore: ReturnType<typeof getFirestore> | null = null;
function getDb() {
  if (!firestore) {
    const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, "firebase-applet-config.json"), "utf-8"));
    firestore = getFirestore(initializeApp(cfg), cfg.firestoreDatabaseId);
  }
  return firestore;
}

export interface DynamicPage {
  path: string;
  meta: RouteMeta;
  priority: string;
  changefreq: string;
}

/** Data webu z Firestore. `errors` = kolekce, které se nepodařilo přečíst. */
export interface SiteData {
  cars: any[];
  saleCars: any[];
  posts: any[];
  errors: Record<string, string>;
}

/** Firestore Timestamp → ISO text (aby šel uložit do JSON). */
function plain(value: any): any {
  if (value && typeof value.toDate === "function") return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(plain);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, plain(v)]));
  return value;
}

/** Jedno čtení všech veřejných kolekcí – používá build (data pro web, prerender, sitemap) i server. */
export async function loadSiteData(): Promise<SiteData> {
  const data: SiteData = { cars: [], saleCars: [], posts: [], errors: {} };
  for (const name of ["cars", "saleCars", "posts"] as const) {
    try {
      const snap = await getDocs(collection(getDb(), name));
      data[name] = snap.docs.map((d) => plain({ id: d.id, ...d.data() }));
    } catch (err: any) {
      data.errors[name] = err?.code || err?.message || String(err);
    }
  }

  // Fotky vozů jsou samostatné dokumenty (vehiclePhotos) – doplní se do image + gallery
  // ve stejném tvaru, jaký web zná (první fotka = hlavní).
  const needsPhotos = [...data.cars, ...data.saleCars].some((c) => c.photoIds?.length);
  if (needsPhotos) {
    try {
      const snap = await getDocs(collection(getDb(), "vehiclePhotos"));
      const byId = new Map(snap.docs.map((d) => [d.id, (d.data() as any).data as string]));
      for (const car of [...data.cars, ...data.saleCars]) {
        if (!car.photoIds?.length) continue;
        const list = car.photoIds.map((id: string) => byId.get(id)).filter(Boolean);
        car.image = list[0] ?? "";
        car.gallery = list.slice(1);
      }
    } catch (err: any) {
      // Bez fotek by se nasadila auta bez obrázků – build se zastaví (viz prerender.ts).
      data.errors.cars = data.errors.cars || `vehiclePhotos: ${err?.code || err?.message || err}`;
    }
  }
  return data;
}

/** Blogové články (Firestore + statické), detaily vozů a auta k prodeji – pro sitemap i prerender. */
export async function getDynamicPages(data?: SiteData): Promise<DynamicPage[]> {
  const { cars, saleCars, posts: dbPosts } = data ?? (await loadSiteData());
  const pages: DynamicPage[] = [];

  // Blogové články – deduplikováno podle slugu, Firestore má přednost.
  const posts = new Map<string, any>();
  for (const p of dbPosts) if (p.slug && p.isPublished !== false) posts.set(p.slug, p);
  for (const p of STATIC_POSTS) if (p.isPublished !== false && !posts.has(p.slug)) posts.set(p.slug, p);
  posts.forEach((p, slug) =>
    pages.push({
      path: `/blog/${slug}`,
      meta: {
        title: p.seo?.title || `${p.title} | AUFIN AUTO`,
        description: p.seo?.description || p.excerpt || ROUTE_META["/blog"].description,
        canonical: `${SITE_URL}/blog/${slug}`,
      },
      priority: "0.7",
      changefreq: "monthly",
    })
  );

  // Detaily vozů na splátky.
  for (const c of cars) {
    if (c.isVisible === false) continue;
    const slug = c.seo?.slug || slugify(c.name || "");
    if (!slug) continue;
    pages.push({
      path: `/auto/${slug}`,
      meta: {
        // Stejně jako v App.tsx (Helmet), ať se meta po načtení Reactu nemění.
        title: c.seo?.title || `${c.name} na splátky | AUFIN AUTO`,
        description: c.seo?.description || (c.description ? String(c.description).substring(0, 160) : ROUTE_META["/"].description),
        canonical: `${SITE_URL}/auto/${slug}`,
      },
      priority: "0.6",
      changefreq: "weekly",
    });
  }

  // Auta k prodeji – vlastní stránky; prodané vozy se do sitemap nedávají (jsou noindex).
  for (const c of saleCars) {
    if (c.isVisible === false || c.isSold) continue;
    const summary = [c.details?.year, formatKm(c.details?.mileage), c.details?.fuel, c.details?.transmission].filter(Boolean).join(" · ");
    // Stejně jako v SaleCarDetailPage (Helmet), ať se meta po načtení Reactu nemění.
    pages.push({
      path: saleCarPath(c),
      meta: {
        title: `${c.name}${c.details?.year ? ` (${c.details.year})` : ""} na prodej | AUFIN AUTO`,
        description: `${c.name} na prodej v Praze${summary ? ` – ${summary}` : ""}. Cena ${c.price ? formatCzk(c.price) : "na dotaz"}. Prověřený vůz od AUFIN AUTO.`,
        canonical: `${SITE_URL}${saleCarPath(c)}`,
      },
      priority: "0.5",
      changefreq: "weekly",
    });
  }

  // Dva vozy se stejným názvem by měly stejnou URL – do sitemap/prerenderu jen jednou.
  const seen = new Set<string>();
  return pages.filter((p) => !seen.has(p.path) && seen.add(p.path));
}

/** Celá sitemap.xml – statické stránky + články + vozy. */
export async function buildSitemapXml(dynamic?: DynamicPage[]): Promise<string> {
  const today = new Date().toISOString().split("T")[0];
  const urls = [
    { loc: `${SITE_URL}/`, priority: "1.0", changefreq: "weekly" },
    ...Object.values(LANDING_PAGES).map((c) => ({ loc: `${SITE_URL}/${c.slug}`, priority: "0.9", changefreq: "monthly" })),
    { loc: `${SITE_URL}/auta-k-prodeji`, priority: "0.6", changefreq: "weekly" },
    { loc: `${SITE_URL}/vykup-auta`, priority: "0.6", changefreq: "monthly" },
    { loc: `${SITE_URL}/kontakt`, priority: "0.5", changefreq: "yearly" },
    { loc: `${SITE_URL}/blog`, priority: "0.8", changefreq: "weekly" },
    ...(dynamic ?? (await getDynamicPages())).map((p) => ({ loc: p.meta.canonical, priority: p.priority, changefreq: p.changefreq })),
  ];
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map(
        (u) =>
          `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${today}</lastmod>\n` +
          `    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
      )
      .join("\n") +
    `\n</urlset>\n`
  );
}
