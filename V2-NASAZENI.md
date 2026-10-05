# AUFIN AUTO V2 – nasazení

> Stav k 5. 10. 2026. V2 **zatím nikde nasazená** – běží jen lokálně (`PORT=3002 npx tsx server.ts`).
> Živý web www.aufinauto.cz běží na **Vercelu jako statický web** (bez Node serveru).

## Co V2 přináší

- Stránky: hlavní (auta na splátky), `/auta-k-prodeji` (samostatný sklad `saleCars`), `/vykup-auta` (formulář s fotkami), `/kontakt`, 3 landing pages, blog, GDPR, 404.
- Všechny formuláře → Firestore `inquiries` + EmailJS + Telegram + GA (stejně jako dosud), typ poptávky: Na splátky / Auta k prodeji / Výkup auta / Obecný dotaz.
- Poctivé texty k počáteční platbě („bez akontace“ už neslibuje odjezd bez platby).
- **Oprava SEO pro Vercel:** na současném webu vrací všechny podstránky při přímém otevření **HTTP 404** (landing pages, blog, GDPR, robots.txt) a sitemap obsahuje neexistující URL. V2 při buildu vytvoří pro každou stránku vlastní HTML se správným title/description/canonical (`scripts/prerender.ts`), `404.html`, `robots.txt` a aktuální `sitemap.xml`. Nastavení je ve `vercel.json`.

## Ochrana náhledu (automatická, podle domény)

| | aufinauto.cz / www.aufinauto.cz | jiná doména (localhost, *.vercel.app) |
|---|---|---|
| robots meta | index, follow | noindex, nofollow (skript v `index.html`) |
| `X-Robots-Tag` | – | noindex, nofollow (`vercel.json`, `missing host`) |
| Formuláře | odesílají | **nic neodesílají** |
| Google Analytics | běží | vypnuto |
| Administrace | funguje | vypnutá |

## Postup nasazení

1. **Firestore pravidla** (Firebase konzole → Firestore → Pravidla): porovnat s `firestore.rules` a nasadit. Přibyly kolekce `saleCars` (veřejné čtení) a `inquiryPhotos` (fotky z výkupu). Bez toho bude „Auta k prodeji“ prázdná a fotky z výkupu se neuloží.
2. `npm run build` → `npm run check:release` (musí skončit „Vše v pořádku“).
3. **Nejdřív náhledové nasazení na Vercelu** (ne produkce) a na jeho adrese *.vercel.app zkontrolovat:
   - `/kontakt`, `/vykup-auta`, `/blog/auto-na-splatky-podminky` → stránka se načte (ne 404),
   - `/neexistuje` → stránka 404,
   - hlavička `X-Robots-Tag: noindex` je přítomna (náhled se neindexuje), formuláře nic neodešlou.
4. **Povýšit na produkci** (Promote to Production).
5. `npm run check:release -- https://www.aufinauto.cz` – ověří, že živé stránky jsou indexovatelné (HTTP 200, bez noindex).
6. **Jedna skutečná testovací poptávka z každého formuláře** (hlavní, auta k prodeji, výkup s fotkou, kontakt) – zkontrolovat e-mail, Telegram a administraci, pak testy smazat.
7. Search Console: odeslat `https://www.aufinauto.cz/sitemap.xml`, požádat o indexaci nových stránek, za 2–4 týdny zkontrolovat pozice.
8. Návrat zpět v případě problému: ve Vercelu „Instant Rollback“ na předchozí nasazení.

## Poznámky

- **Firestore – denní limit čtení (free tier) se opakovaně vyčerpává** (naposledy 5. 10. 2026) → nabídka aut se návštěvníkům nenačte. Doporučeno přepnout projekt na tarif Blaze s rozpočtovým upozorněním (čtení stojí zlomky haléřů). Detaily vozů se do sitemap/prerenderu přidají jen při buildu s dostupným Firestore; vozy přidané později se do sitemap dostanou dalším nasazením (stránky samotné fungují vždy).
- Token Telegram bota je v kódu prohlížeče (`src/lib/leads.ts`) – doporučeno přesunout na server a token vyměnit.
- Pravidla `inquiries` povolují zápis komukoli bez validace (`allow create: if true`) – stejné jako dnes.
- Google Analytics se načítá bez souhlasu (jako dosud), cookie lišta je jen informační – právní riziko je na rozhodnutí majitele.
- Odpovědi v FAQ a sliby („do 30 minut“, „peníze ten samý den“, výkup aut na úvěr/leasing) – musí odpovídat skutečné praxi.
- `server.ts` se na Vercelu nepoužívá (slouží pro lokální náhled); SEO data sdílí s buildem přes `seo.ts`.
