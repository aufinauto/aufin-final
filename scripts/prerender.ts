/**
 * Po `vite build`: připraví statický web pro Vercel (hosting bez Node serveru).
 *
 *  - pro každou stránku vlastní HTML se správným title/description/canonical
 *    (dist/kontakt.html → /kontakt díky `cleanUrls` ve vercel.json),
 *  - články blogu a detaily vozů, které existují v době buildu,
 *  - 404.html (Vercel ji vrací se skutečným HTTP 404),
 *  - robots.txt a sitemap.xml.
 *
 * Indexace náhledů (*.vercel.app) se řeší podle domény: hlavička X-Robots-Tag
 * ve vercel.json + skript v index.html – nic z toho se nepřepíná ručně.
 */
import fs from "fs";
import path from "path";
import { ROUTE_META, NOT_FOUND_META, ROBOTS_TXT, injectMeta, getDynamicPages, buildSitemapXml } from "../seo";

const dist = path.join(process.cwd(), "dist");
const template = fs.readFileSync(path.join(dist, "index.html"), "utf-8");

function write(route: string, html: string) {
  const file = route === "/" ? "index.html" : `${route.replace(/^\//, "")}.html`;
  const target = path.join(dist, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, html);
  return file;
}

const written: string[] = [];
for (const [route, meta] of Object.entries(ROUTE_META)) written.push(write(route, injectMeta(template, meta)));

const dynamic = await getDynamicPages();
for (const page of dynamic) written.push(write(page.path, injectMeta(template, page.meta)));

fs.writeFileSync(path.join(dist, "404.html"), injectMeta(template, NOT_FOUND_META));
fs.writeFileSync(path.join(dist, "robots.txt"), ROBOTS_TXT);
fs.writeFileSync(path.join(dist, "sitemap.xml"), await buildSitemapXml(dynamic));

console.log(`Prerender: ${written.length} stránek (${dynamic.length} článků/vozů) + 404.html, robots.txt, sitemap.xml`);
// Firestore drží otevřené spojení – build musí skončit.
process.exit(0);
