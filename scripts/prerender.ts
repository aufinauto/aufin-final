/**
 * Po `vite build`: připraví statický web pro Vercel (hosting bez Node serveru).
 *
 *  - jednou přečte z Firestore auta, auta k prodeji a články a uloží je do webu
 *    jako dist/data/*.json – návštěvníci pak databázi vůbec nečtou (denní limit),
 *  - fotky uložené v databázi jako text (data URL) převede na běžné obrázky dist/img/*,
 *  - pro každou stránku vlastní HTML se správným title/description/canonical
 *    (dist/kontakt.html → /kontakt díky `cleanUrls` ve vercel.json),
 *  - 404.html (Vercel ji vrací se skutečným HTTP 404), robots.txt a sitemap.xml.
 *
 * Když se auta z databáze přečíst nepodaří, build SKONČÍ CHYBOU – Vercel pak nechá
 * běžet předchozí verzi webu, místo aby nasadil web bez nabídky.
 * (Lokálně lze vynutit pokračování: ALLOW_MISSING_DATA=1 npm run build,
 *  nebo test nad uloženými daty: SITE_DATA_JSON=data.json npm run build.)
 *
 * Indexace náhledů (*.vercel.app) se řeší podle domény: hlavička X-Robots-Tag
 * ve vercel.json + skript v index.html – nic z toho se nepřepíná ručně.
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { ROUTE_META, NOT_FOUND_META, ROBOTS_TXT, injectMeta, getDynamicPages, buildSitemapXml, loadSiteData } from "../seo";

const dist = path.join(process.cwd(), "dist");
const template = fs.readFileSync(path.join(dist, "index.html"), "utf-8");

// ---- 1) Data z Firestore ----
// SITE_DATA_JSON=soubor.json – lokální test buildu nad uloženými daty (bez čtení Firestore).
const data = process.env.SITE_DATA_JSON
  ? { errors: {}, ...JSON.parse(fs.readFileSync(process.env.SITE_DATA_JSON, "utf-8")) }
  : await loadSiteData();
const required = ["cars", "saleCars"].filter((k) => data.errors[k]);
if (required.length) {
  const msg = `Nepodařilo se načíst ${required.map((k) => `${k} (${data.errors[k]})`).join(", ")} z Firestore.`;
  if (process.env.ALLOW_MISSING_DATA !== "1") {
    console.error(`\n✘ ${msg}\n  Build se zastavil, aby se nenasadil web bez nabídky aut. Zkuste nasazení zopakovat později.\n`);
    process.exit(1);
  }
  console.warn(`⚠ ${msg} Pokračuji bez nich (ALLOW_MISSING_DATA=1).`);
}
if (data.errors.posts) console.warn(`⚠ Články z Firestore nenačteny (${data.errors.posts}) – použijí se statické.`);

// ---- 2) Fotky z databáze → soubory (název podle obsahu = bezpečné dlouhé cachování) ----
const imgDir = path.join(dist, "img");
fs.mkdirSync(imgDir, { recursive: true });
let imageCount = 0;
function toFile(src: unknown): unknown {
  if (typeof src !== "string") return src;
  const m = src.match(/^data:image\/(jpeg|jpg|png|webp|gif);base64,(.+)$/s);
  if (!m) return src; // běžná URL zůstává
  const buf = Buffer.from(m[2], "base64");
  const name = `${crypto.createHash("sha1").update(buf).digest("hex").slice(0, 16)}.${m[1] === "jpeg" ? "jpg" : m[1]}`;
  const file = path.join(imgDir, name);
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, buf);
    imageCount++;
  }
  return `/img/${name}`;
}
const withFiles = (item: any) => ({
  ...item,
  ...(item.image !== undefined ? { image: toFile(item.image) } : {}),
  ...(item.coverImage !== undefined ? { coverImage: toFile(item.coverImage) } : {}),
  ...(Array.isArray(item.gallery) ? { gallery: item.gallery.map(toFile) } : {}),
});

// ---- 3) Veřejná data pro web (jen viditelné / publikované položky) ----
const byNumber = (k: string) => (a: any, b: any) => (Number(a[k]) || 0) - (Number(b[k]) || 0);
const byDateDesc = (a: any, b: any) => String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
const publicData = {
  cars: data.cars.filter((c) => c.isVisible !== false).map(withFiles).sort(byNumber("priceValue")),
  "sale-cars": data.saleCars.filter((c) => c.isVisible !== false).map(withFiles),
  posts: data.posts.filter((p) => p.isPublished !== false).map(withFiles).sort(byDateDesc),
};
const dataDir = path.join(dist, "data");
fs.mkdirSync(dataDir, { recursive: true });
for (const [name, items] of Object.entries(publicData)) fs.writeFileSync(path.join(dataDir, `${name}.json`), JSON.stringify(items));
fs.writeFileSync(path.join(dataDir, "meta.json"), JSON.stringify({ builtAt: new Date().toISOString() }));

// ---- 4) HTML stránky, 404, robots, sitemap ----
function write(route: string, html: string) {
  const file = route === "/" ? "index.html" : `${route.replace(/^\//, "")}.html`;
  const target = path.join(dist, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, html);
  return file;
}

const written: string[] = [];
for (const [route, meta] of Object.entries(ROUTE_META)) written.push(write(route, injectMeta(template, meta)));

const dynamic = await getDynamicPages(data);
for (const page of dynamic) written.push(write(page.path, injectMeta(template, page.meta)));

fs.writeFileSync(path.join(dist, "404.html"), injectMeta(template, NOT_FOUND_META));
fs.writeFileSync(path.join(dist, "robots.txt"), ROBOTS_TXT);
fs.writeFileSync(path.join(dist, "sitemap.xml"), await buildSitemapXml(dynamic));

console.log(
  `Data: ${publicData.cars.length} aut na splátky, ${publicData["sale-cars"].length} aut k prodeji, ${publicData.posts.length} článků z databáze, ${imageCount} fotek → dist/img`
);
console.log(`Prerender: ${written.length} stránek (${dynamic.length} článků/vozů) + 404.html, robots.txt, sitemap.xml`);
// Firestore drží otevřené spojení – build musí skončit.
process.exit(0);
