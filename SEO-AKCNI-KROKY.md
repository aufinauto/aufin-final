# Akční kroky — jak dostat web na Google a začít se zobrazovat

> Návod pro majitele. Postupujte odshora dolů. U každého kroku je uvedeno,
> zda jej zvládnete sami, nebo budete potřebovat vývojáře.

---

## FÁZE 1 — Než web zveřejníte (nutné)

### 1.1 Spustit web na doméně aufinauto.cz
**Kdo:** vývojář.
Web je hotová aplikace (Node.js + Express). Nasaďte ji na hosting podporující Node — např. **Google Cloud Run, Render, Railway** nebo VPS. Poté nasměrujte doménu `aufinauto.cz`. Statický hosting (typu „nahraju HTML") nestačí — web má serverovou část.

### 1.2 Zapnout HTTPS a přesměrování
**Kdo:** vývojář / hosting.
Web musí běžet na `https://`. Nastavte trvalé přesměrování (301) z `aufinauto.cz` na `https://www.aufinauto.cz` (to je zvolená hlavní varianta).

### 1.3 Zprovoznit odesílání e-mailů z formuláře
**Kdo:** vývojář.
Kontaktní formulář dnes ukládá poptávky do databáze (vidíte je v administraci), ale **neposílá e-mail**. Doplňte e-mailovou službu (Resend, SendGrid nebo SMTP) tak, aby každá nová poptávka přišla na `aufin.auto@gmail.com`.

### 1.4 Zkontrolovat obsah
**Kdo:** majitel.
Projděte texty, ceny u vozů, telefon a adresu. Co je na webu, to uvidí i Google.

---

## FÁZE 2 — Zařazení do vyhledávačů (nejdůležitější pro „být na Googlu")

### 2.1 Google Search Console
**Kdo:** majitel (cca 15 minut).
1. Otevřete <https://search.google.com/search-console> a přihlaste se Google účtem.
2. Přidejte web — zvolte typ **Doména** a `aufinauto.cz`.
3. Ověřte vlastnictví přidáním TXT záznamu do DNS domény (Search Console vás provede; s DNS pomůže vývojář nebo registrátor domény).
4. V sekci **Sitemapy** zadejte `sitemap.xml` a odešlete.
5. U hlavních stránek použijte **Kontrola URL → Požádat o indexaci** (homepage + 3 landing pages + blog).

### 2.2 Seznam.cz Webmaster
**Kdo:** majitel (cca 10 minut).
Seznam tvoří zhruba čtvrtinu českého vyhledávání — nevynechávejte ho.
1. Otevřete <https://search.seznam.cz/wmt> a přihlaste se.
2. Přidejte `aufinauto.cz`, ověřte (HTML soubor nebo meta tag — s vložením pomůže vývojář).
3. Odešlete `sitemap.xml`.

### 2.3 Ověření, že sitemap funguje
**Kdo:** majitel.
Otevřete `https://www.aufinauto.cz/sitemap.xml` — musíte vidět seznam adres (homepage, landing pages, blog, články, vozy). Pokud ano, je vše v pořádku.

---

## FÁZE 3 — Měření (zapnout hned na startu)

### 3.1 Google Analytics 4
**Kdo:** vývojář (vy si jen založíte účet).
Založte si GA4 na <https://analytics.google.com>, získáte **Measurement ID** (tvar `G-XXXXXXX`) a předejte ho vývojáři k vložení do webu. Bez analytiky neuvidíte, kolik lidí chodí z vyhledávání.

### 3.2 Cookies lišta
**Kdo:** vývojář.
Jakmile poběží GA4, je podle zákona potřeba cookies lišta se souhlasem. Zatím není nasazená.

### 3.3 Google Business Profile (firemní profil)
**Kdo:** majitel.
Založte <https://business.google.com> na adresu Humpolecká 1886/26, Praha. Pomůže to zobrazování v mapách a u lokálních dotazů („auto na splátky Praha"). Doplňte fotky, telefon, otevírací dobu.

---

## FÁZE 4 — Růst (průběžně, první 3 měsíce)

- **Publikujte články** podle souboru `BLOG-KALENDAR.md` — pravidelnost je důležitější než dokonalost.
- **Zpětné odkazy:** zapište firmu do katalogů Firmy.cz, Najisto.cz a podobných. Každý odkaz pomáhá důvěryhodnosti.
- **Reference zákazníků:** sbírejte recenze (Google profil) — zvyšují důvěru i pozice.
- **Sledujte Search Console** jednou týdně: kolik zobrazení, na jaká slova, jaké pozice. Co je na pozici 11–20, má smysl vylepšit (delší text, prolinkování).

---

## Časový odhad výsledků

| Kdy | Co očekávat |
|---|---|
| 1–2 týdny | Web zaindexovaný, objeví se na značkové dotazy („aufin auto"). |
| 1–2 měsíce | První zobrazení v Search Console na komerční i informační fráze, pozice 20–50. |
| 3 měsíce | První slova v TOP 10 (hlavně lokální a long-tail), první organické poptávky. |
| 6+ měsíců | Postupný posun na konkurenčních frázích typu „auta na splátky bez registru". |

SEO je dlouhodobá práce. Prvních pár týdnů se „nic neděje" — to je normální, web sbírá důvěru. Vytrvejte.
