# SEO Strategie — AUFIN AUTO (aufinauto.cz)

> 3měsíční plán pro web na pronájem/prodej aut na splátky bez registru.
> Vypracováno: 15. 5. 2026 · Data: Semrush (databáze CZ) + audit kódu.

---

## 1. Výchozí stav (audit)

### Co ukázal Semrush

| Metrika | Stav |
|---|---|
| Organická viditelnost `aufinauto.cz` | **0 klíčových slov v TOP 100** — web Semrush vůbec nezná |
| Organická návštěvnost | 0 |
| Authority Score | nezměřitelné (web není indexovaný / je nový) |

**Závěr:** Web je z pohledu vyhledávačů prakticky neviditelný. Nestartujeme z optimalizace — startujeme z nuly. To je zároveň dobrá zpráva: každé zlepšení je čistý zisk.

### Technické problémy v kódu (audit `src/`, `server.ts`, `index.html`)

1. **Čistý client-side rendering (SPA).** React + `react-helmet-async` mění `<title>`/meta až v prohlížeči. Google to dnes většinou zvládne, ale pomalu a nespolehlivě — Seznam.cz (klíčový český vyhledávač) JS renderuje hůř.
2. **Detail vozu nemá vlastní stránku.** URL `/auto/<slug>` existuje jen v JS routeru. `server.ts` na něj vrací holé `index.html`. Crawler nedostane unikátní obsah ani meta.
3. **Sitemap je téměř prázdná** — 3 URL, navíc hash kotvy (`/#nabidka-aut`), které nejsou samostatné stránky.
4. **Jediná reálná URL** = jedna landing page. Není kam cílit desítky relevantních klíčových slov.
5. **Tenký obsah.** Žádná textová sekce o procesu, podmínkách, žádné FAQ — pro konkurenční dotazy ("bez registru", "bez akontace") chybí obsah k zaindexování.
6. **H1 je `sr-only`**, viditelný nadpis je `<div>`. Detail vozu používá druhé `<h1>` → nekonzistentní struktura.
7. **Chybí FAQ a Breadcrumb schema.** `AutoRental` + `Vehicle` schema jsou OK, ale nevyužitý potenciál rich snippetů.
8. **`og:image` (`https://aufinauto.cz/og-image.jpg`) reálně neexistuje** — sdílení na sítích bude bez náhledu.
9. **Obrázky z Google Drive (`lh3.googleusercontent.com`)** — pomalé, bez `width/height` → layout shift (CLS), bez optimalizace formátu.
10. **`console.log` ve filtru** běží i v produkci.
11. **Meta `keywords`** — zastaralé, Google ignoruje (neškodí, ale lze smazat).
12. **www vs. non-www** — kanonická URL je `https://www.aufinauto.cz`, je potřeba 301 redirect z non-www.

---

## 2. Klíčová slova (Semrush, databáze CZ)

### Primární — vysoký objem, komerční záměr

| Klíčové slovo | Měs. objem | KD/Konkurence | Cíl |
|---|---|---|---|
| auta na splátky | 2 400 | 0.82 | Homepage (sekundárně) |
| auta na splátky bez registru | 880 | 0.70 | **Hlavní landing page** |
| auto na splátky bez akontace | 480 | 0.80 | Landing page / sekce |
| auto na splátky s exekucí bez akontace | 480 | 0.86 | Dedikovaná stránka |
| auto na splátky registry neřešíme | 390 | 0.80 | Sekce / FAQ |
| auto na splátky všem | 210 | 0.75 | Sekce |
| auto na splátky v insolvenci | 170 | 0.68 | Dedikovaná stránka / článek |
| auto na splátky bez navýšení | 170 | 0.77 | FAQ / sekce |
| auta na splátky bez registrů a příjmů | 170 | 0.89 | Hlavní landing page |
| přenechám auto na splátky | 140 | 0.57 | (jiný záměr — přeskočit) |

### Lokální — nízký objem, nízká konkurence, rychlé výhry

`auto na splátky bez registru brno` (KD 0.06!), `... ostrava`, `... olomouc`, `auta na splátky bez registrů liberec`, `auta na splátky bruntál` — každé ~30/měs. Brno má konkurenci jen 0.06 → reálná šance na TOP 3 rychle.

### Informační / dlouhý ocas — obsah pro blog

`auto na splátky podmínky`, `kupní smlouva auto na splátky (vzor)`, `kalkulačka auto na splátky`, `auto na splátky recenze`, `auto na splátky diskuze`, `auto na splátky na mateřské`, `auto na splátky po insolvenci`.

### Strategický závěr ke klíčovým slovům

Záměr uživatelů se silně přesouvá od *koupě* k řešení **obtížné finanční situace** (exekuce, insolvence, registry, bez příjmu). To je přesně nabídka AUFIN AUTO → web musí tuto řeč doslova používat v nadpisech a textech.

---

## 3. Cílová architektura webu

Z jedné SPA udělat **vícestránkový web** s vlastními indexovatelnými URL:

```
/                                  Homepage — "auta na splátky bez registru"
/auta-na-splatky-bez-registru       Hlavní landing (880/měs)
/auto-na-splatky-bez-akontace       Landing (480/měs)
/auto-na-splatky-s-exekuci          Landing (480/měs)
/auto-na-splatky-v-insolvenci       Landing (170/měs)
/auto/<slug>                        Detail vozu — reálná stránka, ne jen JS
/jak-to-funguje                     Proces + důvěra
/caste-dotazy                       FAQ stránka (+ FAQ schema)
/blog/...                           Informační obsah (long-tail)
/kontakt                            Kontakt + LocalBusiness
```

Lokální dotazy zatím řešit sekcemi na hlavní landing page ("Auta na splátky bez registru — Praha, Brno, Ostrava…"), samostatné city stránky až ve fázi 3, pokud bude kapacita.

---

## 4. 3měsíční plán

### Měsíc 1 — Technický základ a indexace

**Cíl: web se vůbec dostane do indexu a začne sbírat data.**

- [ ] Zavést **prerendering nebo SSR** detailů a landing pages (např. `vite-plugin-ssr`/`react-router` + statická pregenerace, nebo prerender služba). Bez tohoto kroku nic dalšího nezabere.
- [ ] Vytvořit reálné routy v `server.ts` pro `/auto/:slug` a landing pages s vlastními `<title>`, `meta description`, `canonical`.
- [ ] Opravit **sitemap.xml** — dynamicky generovat ze seznamu vozů + landing pages, bez hash kotev. Přidat `<lastmod>`.
- [ ] Ověřit `robots.txt` (už existuje, OK) a přidat web do **Google Search Console** i **Seznam Webmaster**.
- [ ] Doplnit chybějící **`og-image.jpg`** (1200×630) na root.
- [ ] Opravit nadpisovou strukturu: jeden viditelný `<h1>` na stránku, detail vozu = `<h1>` jen v rámci své routy.
- [ ] Přidat `width`/`height` (nebo `aspect-ratio`) k obrázkům → odstranit CLS.
- [ ] Odstranit `console.log` z produkce, smazat meta `keywords`.
- [ ] Nastavit 301 redirect non-www → www (nebo opačně, hlavně konzistentně).
- [ ] Přidat **FAQ schema** a **BreadcrumbList schema**.

**KPI konce M1:** web indexovaný (GSC: „Pokrytí" > 5 URL), 0 kritických chyb v GSC, PageSpeed mobil > 80.

### Měsíc 2 — Obsah a landing pages

**Cíl: mít stránku pro každý hlavní komerční dotaz.**

- [ ] Spustit landing page **`/auta-na-splatky-bez-registru`** — 600+ slov, H1 s frází, sekce "Jak to funguje", "Pro koho", FAQ, CTA formulář.
- [ ] Landing **`/auto-na-splatky-bez-akontace`** a **`/auto-na-splatky-s-exekuci`**.
- [ ] Rozšířit homepage o **textovou sekci** (300+ slov) s přirozeným výskytem "auta na splátky", "bez registru", "bez doložení příjmů" + lokality.
- [ ] Vytvořit stránku **`/caste-dotazy`** pokrývající: podmínky, jak probíhá schválení, co když mám exekuci/insolvenci, je potřeba akontace, jaké doklady, předčasný odkup. Každá otázka = cíl long-tail dotazu.
- [ ] Přidat **interní prolinkování**: homepage → landing pages → detaily vozů → formulář.
- [ ] Doplnit detailům vozů unikátní `meta description` (admin už pole `seo` má — využít ho).
- [ ] Sjednotit obsah s reálnou řečí zákazníka ("registry neřešíme", "i s exekucí").

**KPI konce M2:** 8–12 indexovaných URL, první klíčová slova v TOP 50, první imprese v GSC.

### Měsíc 3 — Obsah long-tail, lokál a autorita

**Cíl: růst pozic a získání prvních organických poptávek.**

- [ ] Spustit **blog** se 3–4 články: "Auto na splátky při exekuci — jak na to", "Kupní smlouva na auto na splátky (+ vzor ke stažení)", "Auto na splátky bez doložení příjmu — podmínky 2026", "Auto na splátky na mateřské".
- [ ] Lokální sekce/stránky pro **Brno** (KD 0.06 — priorita!), Ostravu, Olomouc.
- [ ] Založit a vyplnit **Google Business Profile** (adresa Humpolecká 1886/26, Praha) — propojit s `LocalBusiness` schema.
- [ ] Zápisy do **českých katalogů** (Firmy.cz, Najisto, místní autobazarové portály) → první zpětné odkazy.
- [ ] Přidat **recenze/reference** zákazníků na web (+ `Review`/`AggregateRating` schema).
- [ ] Optimalizovat na základě GSC dat — dotáhnout stránky z pozic 11–20 do TOP 10 (rozšíření obsahu, prolinkování).

**KPI konce M3:** 3–5 klíčových slov v TOP 10, 100+ organických návštěv/měs, první organické poptávky z formuláře.

---

## 5. Měření

| Nástroj | Co sledovat |
|---|---|
| Google Search Console | indexace, imprese, pozice, CTR, chyby |
| Seznam Webmaster | indexace ve vyhledávači Seznam |
| Semrush (Position Tracking) | týdenní sledování ~30 klíčových slov |
| Google Analytics 4 | organická návštěvnost, konverze (odeslání formuláře) |
| PageSpeed Insights | Core Web Vitals (LCP, CLS, INP) — mobil |

**Hlavní byznys KPI:** počet organických poptávek z formuláře `/api/contact`.

---

## 6. Priority — co dělat jako první

1. **Prerendering/SSR** — bez něj je veškerá další SEO práce neúčinná.
2. **Reálné landing pages** pro "bez registru", "bez akontace", "s exekucí".
3. **Textový obsah a FAQ** — momentálně web nemá co zaindexovat.
4. **GSC + Seznam Webmaster + sitemap** — aby se výsledky vůbec daly měřit.
5. **Lokální SEO (Brno first)** — nejrychlejší výhra při minimální konkurenci.
