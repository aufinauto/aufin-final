#!/usr/bin/env node
/**
 * Kontrola před nasazením V2 – hlídá, aby omezení náhledu nepřešlo do ostrého webu.
 *
 *   npm run check:release                      → kontrola zdrojů a dist/ (po `npm run build`)
 *   npm run check:release -- https://www.aufinauto.cz   → navíc kontrola živého webu
 *
 * Skončí chybou (exit 1), pokud najde problém.
 */
import fs from "node:fs";

const errors = [];
const ok = (msg) => console.log("  ✔", msg);
const fail = (msg) => { errors.push(msg); console.log("  ✘", msg); };

const PROD_HOSTS = ["www.aufinauto.cz", "aufinauto.cz"];

console.log("1) Zdrojové soubory");
const siteEnv = fs.readFileSync("src/lib/siteEnv.ts", "utf8");
const indexHtml = fs.readFileSync("index.html", "utf8");
for (const h of PROD_HOSTS) {
  siteEnv.includes(`"${h}"`) ? ok(`siteEnv.ts obsahuje ${h}`) : fail(`siteEnv.ts neobsahuje ${h}`);
  indexHtml.includes(`"${h}"`) ? ok(`index.html obsahuje ${h}`) : fail(`index.html neobsahuje ${h}`);
}
/<meta name="robots" content="index, follow/.test(indexHtml)
  ? ok("index.html má výchozí robots „index, follow“")
  : fail("index.html nemá výchozí robots „index, follow“ – noindex nesmí být natvrdo v šabloně");

console.log("2) Build (dist/)");
if (fs.existsSync("dist/index.html")) {
  const dist = fs.readFileSync("dist/index.html", "utf8");
  /<meta name="robots" content="index, follow/.test(dist) ? ok("dist/index.html: index, follow") : fail("dist/index.html nemá „index, follow“");
  dist.includes("__AUFIN_PROD__") ? ok("dist/index.html obsahuje přepínač podle domény") : fail("dist/index.html je ze staré verze – spusťte npm run build");
  // Vercel = statický hosting: každá stránka musí mít vlastní HTML se správným canonical.
  for (const p of ["auta-k-prodeji", "vykup-auta", "kontakt", "auta-na-splatky-bez-registru", "blog"]) {
    const f = `dist/${p}.html`;
    fs.existsSync(f) && fs.readFileSync(f, "utf8").includes(`href="https://www.aufinauto.cz/${p}"`)
      ? ok(`${f} má vlastní canonical`)
      : fail(`${f} chybí nebo nemá správný canonical (prerender)`);
  }
  for (const f of ["dist/404.html", "dist/robots.txt", "dist/sitemap.xml"]) fs.existsSync(f) ? ok(`${f} existuje`) : fail(`${f} chybí`);
  if (fs.existsSync("dist/robots.txt") && /Disallow:\s*\/\s*$/m.test(fs.readFileSync("dist/robots.txt", "utf8"))) fail("dist/robots.txt zakazuje celý web");
} else {
  fail("dist/index.html neexistuje – spusťte npm run build");
}

const vercel = JSON.parse(fs.readFileSync("vercel.json", "utf8"));
vercel.cleanUrls === true ? ok("vercel.json: cleanUrls") : fail("vercel.json: chybí cleanUrls – podstránky by vracely 404");
const noindexRule = (vercel.headers || []).find((h) => h.headers?.some((x) => x.key === "X-Robots-Tag"));
noindexRule?.missing?.some((m) => m.type === "host" && /aufinauto/.test(m.value))
  ? ok("vercel.json: noindex jen mimo aufinauto.cz")
  : fail("vercel.json: pravidlo X-Robots-Tag musí platit jen MIMO produkční doménu");

const url = process.argv[2];
if (url) {
  console.log(`3) Živý web ${url}`);
  const paths = ["/", "/auta-k-prodeji", "/vykup-auta", "/kontakt", "/auta-na-splatky-bez-registru", "/robots.txt"];
  for (const p of paths) {
    try {
      const res = await fetch(new URL(p, url), { redirect: "follow" });
      const tag = res.headers.get("x-robots-tag") || "";
      const body = await res.text();
      if (res.status !== 200) fail(`${p}: HTTP ${res.status}`);
      else if (/noindex/i.test(tag)) fail(`${p}: hlavička X-Robots-Tag „${tag}“`);
      else if (p === "/robots.txt" && /Disallow:\s*\/\s*$/m.test(body)) fail("robots.txt zakazuje celý web");
      else if (/<meta name="robots" content="[^"]*noindex/i.test(body)) fail(`${p}: meta robots noindex v HTML`);
      else ok(`${p}: indexovatelné (HTTP 200)`);
    } catch (e) {
      fail(`${p}: ${e.message}`);
    }
  }
}

console.log(errors.length ? `\nNALEZENO PROBLÉMŮ: ${errors.length}` : "\nVše v pořádku.");
process.exit(errors.length ? 1 : 0);
