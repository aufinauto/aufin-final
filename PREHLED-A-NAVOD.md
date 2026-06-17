# Přehled změn a návod k webu — AUFIN AUTO

> Co bylo na webu uděláno, co se zlepšilo a jak web spravovat (zejména přidávání článků).
> Aktualizováno: 15. 5. 2026.

---

## ČÁST 1 — Co bylo uděláno a zlepšeno

### Optimalizace pro vyhledávače (SEO)

**Titulky a popisky stránek**
- Každá stránka (homepage, landing pages, blog, články) má vlastní `<title>` a popisek cílený na konkrétní klíčové slovo.
- Server vkládá tyto údaje do stránky **ještě před spuštěním aplikace** — vyhledávač je vidí spolehlivě.

**Nové stránky cílené na klíčová slova**
- `/auta-na-splatky-bez-registru` — cíl „auta na splátky bez registru" (880 hledání/měs)
- `/auto-na-splatky-bez-akontace` — cíl „auto na splátky bez akontace" (480/měs)
- `/auto-na-splatky-s-exekuci` — cíl „auto na splátky s exekucí" (480/měs)
- Každá má unikátní text 600+ slov, výhody, FAQ a výzvu k akci.

**Blog**
- Nová sekce `/blog` s výpisem článků a detailem `/blog/<adresa-clanku>`.
- 3 startovní články jsou připravené. Další se přidávají z administrace (návod níže).
- Články mají strukturovaná data `Article` — mohou se v Googlu zobrazit bohatěji.

**Obsah a struktura**
- Na homepage přibyla sekce „Časté dotazy" s textem a 6 otázkami.
- Správná struktura nadpisů (jeden hlavní `H1` na stránku).
- Vnitřní prolinkování mezi homepage, landing pages a blogem.

**Strukturovaná data (schema.org)**
- Firma (`AutoRental`), nabídka vozů, jednotlivé vozy, časté dotazy (`FAQPage`), drobečková navigace, články — vše strojově čitelné pro Google.

**Technické**
- `robots.txt` a **dynamická `sitemap.xml`** — automaticky obsahuje homepage, landing pages, blog, všechny články i všechny vozy z databáze.
- Stránka 404 pro neexistující adresy (vrací správný stavový kód).
- Náhledový obrázek pro sdílení na sociálních sítích (`og-image.jpg`) + ikona webu.
- Rychlost: kód rozdělen do menších částí — první načtení je výrazně rychlejší (hlavní soubor zmenšen z ~907 kB na ~256 kB).
- Stránka ochrany osobních údajů (`/ochrana-osobnich-udaju`).

### Co je ještě potřeba

Web je obsahově a technicky připraven. Před spuštěním zbývají kroky popsané v souboru **`SEO-AKCNI-KROKY.md`** (hosting, e-maily z formuláře, registrace do Search Console a Seznam Webmaster, analytika).

---

## ČÁST 2 — Jak web spravovat

### Přihlášení do administrace

1. Otevřete web a sjeďte úplně dolů do **patičky**.
2. Vpravo dole je **neviditelné tlačítko** (malá oblast vedle textu o autorských právech) — klikněte na něj.
3. Otevře se přihlášení. Přihlaste se Google účtem **schillerjirka@gmail.com** (jen tento účet má přístup).
4. Zobrazí se administrace se záložkami **Vozidla**, **Klienti & poptávky** a **Blog**.

> Změna administrátorského účtu: e-mail je nastaven na dvou místech — v souboru `src/components/AdminDashboard.tsx` a v bezpečnostních pravidlech `firestore.rules`. Změnu provede vývojář.

### Jak přidat nový článek na blog

1. V administraci otevřete záložku **BLOG**.
2. Klikněte na **NOVÝ ČLÁNEK**.
3. Vyplňte pole:
   - **Titulek článku** — nadpis, ideálně s klíčovým slovem.
   - **URL slug** — adresa článku (např. `auto-na-splatky-bez-akontace`). Tlačítkem **GENEROVAT** se vytvoří automaticky z titulku. Bez diakritiky a mezer.
   - **Cílové klíčové slovo** — jen pro váš přehled, na webu se nezobrazuje.
   - **Perex** — 1–2 věty do výpisu článků (cca 160 znaků).
   - **Tělo článku** — hlavní text. Formátování:
     - prázdný řádek = nový odstavec,
     - řádek začínající `## ` = podnadpis,
     - řádek začínající `- ` = odrážka seznamu.
   - **Náhledový obrázek** — nahrajte soubor, nebo vložte webovou adresu obrázku.
   - **Kategorie** a **Autor** — volitelné.
   - **SEO titulek / popisek** — volitelné; když necháte prázdné, použije se titulek a perex.
4. Přepínač **PUBLIKOVÁNO / KONCEPT** určuje, zda je článek na webu vidět.
5. Klikněte **ULOŽIT ČLÁNEK**.

Článek se ihned objeví na `/blog` a získá vlastní adresu `/blog/<slug>`. Automaticky se přidá i do `sitemap.xml`.

> **Důležité:** dokud nepřidáte první vlastní článek, web zobrazuje 3 startovní články. Jakmile přidáte vlastní, startovní zmizí — počítejte tedy s tím, že si případně 3 startovní články do administrace přepíšete také (jejich texty jsou v souboru `src/blogPosts.ts`).

### Jak upravit nebo smazat článek

V záložce **BLOG** u každého článku: **UPRAVIT** otevře editor, ikona koše článek smaže (nevratně).

### Jak spravovat vozidla

Záložka **VOZIDLA**: tlačítko **NOVÝ VŮZ** přidá vůz, **UPRAVIT** ho změní, ikona oka skryje/zobrazí na webu. Vyplňte ceny, fotky, parametry a v sekci **SEO** adresu (slug), titulek a popisek. Každý viditelný vůz se automaticky přidá do `sitemap.xml`.

### Jak spravovat poptávky

Záložka **KLIENTI & POPTÁVKY**: každé odeslání formuláře se sem uloží. Lze měnit stav (Nová → Kontaktováno → …), psát interní poznámky a klientovi přímo volat či psát.

---

## ČÁST 3 — Pro vývojáře (technické poznámky)

**Spuštění lokálně:** `npm install`, pak `npm run dev` (běží na portu 3000, lze změnit přes `PORT`).
**Produkční build:** `npm run build`, server spustit s `NODE_ENV=production`.

**Důležité soubory:**
- `server.ts` — Express server, SEO meta na úrovni rout, `robots.txt`, dynamická `sitemap.xml`.
- `src/App.tsx` — homepage + směrování (routing) podle adresy.
- `src/components/LandingPage.tsx` + `src/landingConfig.ts` — SEO landing pages a jejich obsah.
- `src/components/Blog.tsx` + `src/blogPosts.ts` — blog a startovní články.
- `src/components/AdminDashboard.tsx` — administrace (vozidla, poptávky, blog).
- `firestore.rules` — bezpečnostní pravidla databáze (kolekce `cars`, `inquiries`, `posts`).

**Přidání další landing page:** stačí přidat záznam do `src/landingConfig.ts` — routing, meta i sitemap se napojí automaticky.

**Související dokumenty:** `SEO-STRATEGY.md`, `SEO-ANALYZA-TRHU.md`, `SEO-AKCNI-KROKY.md`, `BLOG-KALENDAR.md`.
