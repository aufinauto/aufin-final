/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Startovní (statické) články blogu. Slouží jako fallback, dokud nejsou
 * v databázi Firestore vlastní příspěvky – pak je nahradí. Sdílí je
 * komponenta Blog i server (pro generování sitemap.xml).
 *
 * Formát pole `content`: prázdný řádek = nový odstavec, řádek začínající
 * "## " = podnadpis, řádek začínající "- " = položka odrážkového seznamu.
 */

import { BlogPost } from "./types";

export const STATIC_POSTS: BlogPost[] = [
  {
    id: "static-1",
    slug: "auto-na-splatky-podminky",
    title: "Auto na splátky: jaké jsou podmínky a co budete potřebovat",
    keyword: "auto na splátky podmínky",
    category: "Rádce",
    author: "AUFIN AUTO",
    isPublished: true,
    coverImage:
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=1200",
    excerpt:
      "Přehledně vysvětlujeme, jaké podmínky musíte splnit pro auto na splátky bez registru – jaké doklady potřebujete a jak celý proces probíhá.",
    seo: {
      title: "Auto na splátky – podmínky a potřebné doklady | AUFIN AUTO",
      description:
        "Jaké jsou podmínky pro auto na splátky bez registru? Vysvětlujeme doklady, akontaci i průběh schválení krok za krokem.",
    },
    content: `Pořídit si auto na splátky bývá u běžných autobazarů a leasingových společností spojené s řadou podmínek – doložení příjmu, čistý registr dlužníků, vysoká akontace. U AUFIN AUTO jsou podmínky výrazně jednodušší. V tomto článku si je projdeme bod po bodu.

## Kdo může auto na splátky získat

Naše služba je určená prakticky každému dospělému člověku s platnými doklady. Nevadí nám záznam v registru dlužníků, probíhající ani ukončená exekuce nebo insolvence. Každého klienta posuzujeme individuálně podle jeho aktuální situace, ne podle starých záznamů.

## Jaké doklady budete potřebovat

K vyřízení vám stačí dva platné doklady totožnosti – nejčastěji občanský a řidičský průkaz. Nepožadujeme:

- potvrzení o příjmu od zaměstnavatele
- daňové přiznání ani výpis z účtu
- výpis z registru dlužníků
- ručitele nebo spoludlužníka

## Akontace a platba při převzetí

Klasickou akontaci, jakou znáte z leasingu, u nás neplatíte. Skládáte pouze jednorázovou částku za převzetí vozidla, která je vždy transparentně uvedená přímo u konkrétního auta. Druhým číslem je měsíční nájemné. Žádné skryté poplatky, žádné dopočítávání.

## Jak probíhá schválení

Celý proces je rychlý. Vyberete si vůz z naší nabídky, ozvete se nám přes formulář nebo telefonicky a my obvykle do 30 minut potvrdíme schválení. Poté podepíšeme smlouvu o pronájmu vozu s možností odkupu a vy odjíždíte – klidně ještě týž den.

## Co je dobré vědět předem

Jde o pronájem vozidla s možností odkupu. Po uhrazení všech splátek vůz přechází do vašeho vlastnictví. Cena nezahrnuje povinné ani havarijní pojištění – to si sjednáváte samostatně, abyste měli plnou kontrolu nad jeho rozsahem.

Pokud si nejste jistí, zda podmínky splníte, nejjednodušší je se nezávazně zeptat. Projdeme s vámi vaši situaci otevřeně a najdeme reálné řešení.`,
  },
  {
    id: "static-2",
    slug: "auto-na-splatky-po-insolvenci",
    title: "Auto na splátky po insolvenci: je to vůbec možné?",
    keyword: "auto na splátky po insolvenci",
    category: "Rádce",
    author: "AUFIN AUTO",
    isPublished: true,
    coverImage:
      "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=1200",
    excerpt:
      "Prošli jste insolvencí nebo oddlužením a potřebujete auto? Vysvětlujeme, proč to u AUFIN AUTO jde i tehdy, když vás banka odmítla.",
    seo: {
      title: "Auto na splátky po insolvenci a v oddlužení | AUFIN AUTO",
      description:
        "Auto na splátky i po insolvenci nebo během oddlužení. Registry nenahlížíme, posuzujeme individuálně. Jak to funguje?",
    },
    content: `Insolvence a oddlužení dnes nejsou nic výjimečného – prochází jím tisíce lidí ročně. Problém nastává ve chvíli, kdy potřebujete auto. Do práce, pro děti, k lékaři. A banka i běžný autobazar vás kvůli záznamu odmítnou. Existuje řešení?

## Proč vás banky odmítají

Při žádosti o úvěr nebo leasing finanční instituce vždy nahlížejí do registrů dlužníků. Záznam o insolvenci v nich zůstává i několik let po jejím skončení. Pro automatické scoringové systémy bank je to obvykle důvod k zamítnutí – bez ohledu na to, jak vypadá vaše současná situace.

## Jak to řeší AUFIN AUTO

Nefungujeme jako banka. Nabízíme pronájem vozu s možností odkupu, u kterého registry dlužníků nenahlížíme. Místo automatického scoringu posuzujeme každého klienta osobně a individuálně. Zajímá nás vaše aktuální situace – ne záznam starý několik let.

To znamená, že auto na splátky u nás můžete získat i v případě, že:

- jste insolvenci úspěšně ukončili
- aktuálně procházíte oddlužením
- máte za sebou exekuci nebo v ní stále jste

## Co budete potřebovat

Stejně jako u ostatních klientů vám stačí dva doklady totožnosti. Nepožadujeme potvrzení o příjmu ani výpis z registru. Schválení vyřídíme zpravidla do 30 minut.

## Na co dát pozor

I když jsme vstřícní, je férové připomenout, že splátky je potřeba zvládnout splácet. Doporučujeme si předem reálně spočítat měsíční rozpočet a vybrat vůz, jehož nájemné pro vás bude dlouhodobě udržitelné. Rádi vám s výběrem poradíme tak, aby auto bylo pomoc, ne další zátěž.

## Jak začít

Vyberte si vůz z naší nabídky a ozvěte se nám. Probereme spolu vaši situaci bez závazku a otevřeně vám řekneme, jaké máte možnosti. Insolvence v minulosti pro nás není automatické „ne“.`,
  },
  {
    id: "static-3",
    slug: "kupni-smlouva-auto-na-splatky-vzor",
    title: "Kupní smlouva na auto na splátky: co má obsahovat (a na co si dát pozor)",
    keyword: "kupní smlouva auto na splátky vzor",
    category: "Rádce",
    author: "AUFIN AUTO",
    isPublished: true,
    coverImage:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=1200",
    excerpt:
      "Co nesmí chybět ve smlouvě na auto na splátky, jaký je rozdíl oproti pronájmu s odkupem a na které body si dát pozor před podpisem.",
    seo: {
      title: "Kupní smlouva na auto na splátky – co má obsahovat | AUFIN AUTO",
      description:
        "Co má obsahovat smlouva na auto na splátky a na co si dát pozor před podpisem. Praktický přehled náležitostí.",
    },
    content: `Než podepíšete jakoukoli smlouvu na auto na splátky, je dobré vědět, co v ní hledat. V tomto článku shrneme základní náležitosti a upozorníme na body, kterým je dobré věnovat pozornost.

## Pronájem s odkupem vs. klasická kupní smlouva

Důležité je rozlišit dva modely. U klasické koupě na splátky se stáváte vlastníkem hned a vůz je často v zástavě. U pronájmu vozidla s možností odkupu – což je model AUFIN AUTO – vůz po dobu splácení formálně užíváte na základě nájemní smlouvy a do vašeho vlastnictví přechází po uhrazení všech plateb. Oba modely jsou legální, jen mají jiné smluvní náležitosti.

## Co by ve smlouvě nemělo chybět

- přesná identifikace obou stran (jméno, adresa, IČO u firmy)
- jednoznačná identifikace vozidla (značka, model, VIN, SPZ, stav tachometru)
- výše a termín platby při převzetí vozu
- výše měsíční splátky a počet splátek
- celková částka, kterou nakonec zaplatíte
- podmínky odkupu a okamžik přechodu vlastnictví
- ujednání o pojištění a odpovědnosti za škodu
- postup při prodlení nebo předčasném ukončení

## Na co si dát pozor

Vždy si ověřte, že čísla ve smlouvě odpovídají tomu, co vám bylo slíbeno – zejména částku při převzetí, měsíční splátku a celkovou cenu. Pozornost věnujte i tomu, kdo hradí pojištění a co se stane v případě, že nezvládnete některou splátku zaplatit včas.

## Náš přístup

V AUFIN AUTO držíme smlouvy srozumitelné a bez skrytých poplatků. Měsíční nájemné i částku při převzetí máte uvedené předem u každého vozu. Před podpisem vám vše v klidu vysvětlíme a zodpovíme dotazy.

Konkrétní vzor smlouvy připravujeme vždy na míru danému vozu. Chcete-li si projít smlouvu k autu, o které máte zájem, ozvěte se nám – pošleme vám ji k prostudování ještě před schůzkou.`,
  },
];
