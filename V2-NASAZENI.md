# AUFIN AUTO V2 – nasazení

> Stav k 5. 10. 2026. V2 **zatím nikde nasazená** – běží jen lokálně (`PORT=3002 npx tsx server.ts`).
> Živý web www.aufinauto.cz běží na **Vercelu jako statický web** (bez Node serveru).

## Co V2 přináší

- Stránky: hlavní (auta na splátky), `/auta-k-prodeji` (samostatný sklad `saleCars`), `/vykup-auta` (formulář s fotkami), `/kontakt`, 3 landing pages, blog, GDPR, 404.
- Všechny formuláře → Firestore `inquiries` + EmailJS + Telegram + GA (stejně jako dosud), typ poptávky: Na splátky / Auta k prodeji / Výkup auta / Obecný dotaz.
- Poctivé texty k počáteční platbě („bez akontace“ už neslibuje odjezd bez platby).
- **Oprava SEO pro Vercel:** na současném webu vrací všechny podstránky při přímém otevření **HTTP 404** (landing pages, blog, GDPR, robots.txt) a sitemap obsahuje neexistující URL. V2 při buildu vytvoří pro každou stránku vlastní HTML se správným title/description/canonical (`scripts/prerender.ts`), `404.html`, `robots.txt` a aktuální `sitemap.xml`. Nastavení je ve `vercel.json`.

## Publikování obsahu (auta, auta k prodeji, články)

Návštěvníci **nečtou Firestore** – auta a články se při buildu uloží do webu (`dist/data/*.json`, fotky jako soubory `dist/img/*`). Změny z administrace se proto na web dostanou až tlačítkem **„Publikovat změny na web“** v administraci (spustí nový build na Vercelu, 1–3 min).

- Tlačítko používá **Deploy Hook** z Vercelu (Settings → Git → Deploy Hooks). Adresa se vloží v administraci přes ozubené kolečko u tlačítka a uloží do Firestore `settings/site` (čte jen admin).
- Když se při buildu nepodaří načíst auta z Firestore, **build skončí chybou** a na webu zůstane předchozí verze (nenasadí se web bez nabídky). Stačí nasazení zopakovat.
- Administrace dál čte a zapisuje Firestore přímo (poptávky jen posledních 100).
- **Fotky vozů** (splátky i k prodeji): až 25 na auto, každá jako samostatný dokument v kolekci `vehiclePhotos` (limit 1 MB platí na fotku, ne na auto). Auto drží pořadí v `photoIds` (první = hlavní) a malý náhled v `image`. Starší auta s fotkami v dokumentu fungují dál a při dalším uložení se převedou.

## Ochrana náhledu (automatická, podle domény)

| | aufinauto.cz / www.aufinauto.cz | jiná doména (localhost, *.vercel.app) |
|---|---|---|
| robots meta | index, follow | noindex, nofollow (skript v `index.html`) |
| `X-Robots-Tag` | – | noindex, nofollow (`vercel.json`, `missing host`) |
| Formuláře | odesílají | **nic neodesílají** |
| Google Analytics | běží | vypnuto |
| Administrace | funguje | vypnutá |

## Postup nasazení

1. **Firestore pravidla** (Firebase konzole → Firestore → databáze `ai-studio-…` → Security): bloky `saleCars`, `inquiryPhotos`, `settings`, `posts` (nasazeno 6. 10. 2026) a `vehiclePhotos` (fotky vozů) podle `firestore.rules`.
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
