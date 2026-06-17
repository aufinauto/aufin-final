/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Konfigurace SEO landing pages (Měsíc 2 SEO strategie).
 * Každý záznam = jedna reálná URL cílená na konkrétní klíčové slovo.
 */

export interface LandingSection {
  h2: string;
  paragraphs: string[];
}

export interface LandingConfig {
  slug: string;            // cesta bez úvodního lomítka
  keyword: string;         // hlavní klíčové slovo
  title: string;           // <title>
  description: string;     // meta description
  badge: string;
  h1: string;
  lead: string;            // úvodní odstavec pod H1
  benefits: string[];      // "pro koho / výhody"
  sections: LandingSection[];
  faqSlugs: number[];      // indexy do pole faqs v App.tsx
}

export const LANDING_PAGES: Record<string, LandingConfig> = {
  "auta-na-splatky-bez-registru": {
    slug: "auta-na-splatky-bez-registru",
    keyword: "auta na splátky bez registru",
    title: "Auta na splátky bez registru | AUFIN AUTO Praha",
    description:
      "Auta na splátky bez registru a bez doložení příjmů. Registry dlužníků nenahlížíme, schválení do 30 minut. Prověřené vozy skladem – AUFIN AUTO Praha.",
    badge: "Registry neřešíme",
    h1: "Auta na splátky bez registru",
    lead:
      "Hledáte auto na splátky a bojíte se, že vás kvůli záznamu v registru dlužníků nikde neschválí? U AUFIN AUTO registry nenahlížíme. Vyberete si prověřený vůz, schválení vyřídíme do 30 minut a odjíždíte ještě dnes.",
    benefits: [
      "Bez nahlížení do registrů dlužníků (SOLUS, BRKI, NRKI)",
      "Bez doložení příjmů a potvrzení od zaměstnavatele",
      "Schválení do 30 minut, vozy ihned k odjezdu",
      "Pronájem vozu s možností pozdějšího odkupu",
    ],
    sections: [
      {
        h2: "Jak fungují auta na splátky bez registru",
        paragraphs: [
          "Klasické autobazary a leasingové společnosti při žádosti o financování vždy nahlížejí do registrů dlužníků. Jediný negativní záznam pak často znamená zamítnutí – i když je dnes vaše situace stabilní. AUFIN AUTO funguje jinak: registry neřešíme a každého klienta posuzujeme individuálně podle jeho aktuální situace.",
          "Nejde o úvěr, ale o pronájem vozu s možností odkupu. Vyberete si auto z naší nabídky, podepíšeme smlouvu a vy platíte měsíční nájemné. Po uhrazení splátek vůz přechází do vašeho vlastnictví.",
        ],
      },
      {
        h2: "Co k autu na splátky bez registru potřebujete",
        paragraphs: [
          "K vyřízení vám stačí dva platné doklady totožnosti – typicky občanský a řidičský průkaz. Nepožadujeme výpis z registru, potvrzení o příjmu ani ručitele. Stačí vaše čestné prohlášení.",
          "Při převzetí vozidla skládáte jednorázovou částku uvedenou u každého auta a dále hradíte měsíční nájemné. Obě částky jsou vždy transparentně uvedené v detailu konkrétního vozu, žádné skryté poplatky.",
        ],
      },
      {
        h2: "Auta na splátky bez registru po celé ČR",
        paragraphs: [
          "Sídlíme v Praze, na adrese Humpolecká 1886/26, Krč. Vozy ale předáváme zákazníkům z celé České republiky – z Brna, Ostravy, Olomouce, Plzně i menších měst. Stačí se ozvat přes formulář nebo telefonicky a domluvíme termín předání.",
        ],
      },
    ],
    faqSlugs: [0, 1, 2, 4, 5],
  },

  "auto-na-splatky-bez-akontace": {
    slug: "auto-na-splatky-bez-akontace",
    keyword: "auto na splátky bez akontace",
    title: "Auto na splátky bez akontace | AUFIN AUTO",
    description:
      "Auto na splátky bez akontace a bez doložení příjmů. Žádná vysoká počáteční platba navíc – platíte jen za převzetí vozu. Schválení do 30 minut.",
    badge: "Bez akontace navíc",
    h1: "Auto na splátky bez akontace",
    lead:
      "Nemáte stranou desítky tisíc na akontaci? U AUFIN AUTO ji navíc neplatíte. Skládáte pouze transparentní částku za převzetí vozu a dál hradíte měsíční nájemné. Žádná skrytá počáteční platba.",
    benefits: [
      "Bez klasické akontace jako u leasingu",
      "Jasná částka za převzetí, žádné skryté poplatky",
      "Bez registrů a bez doložení příjmů",
      "Schválení do 30 minut",
    ],
    sections: [
      {
        h2: "Co znamená auto na splátky bez akontace",
        paragraphs: [
          "Akontace je počáteční platba, kterou u běžného leasingu skládáte předem – často 10 až 30 % ceny vozu. Pro řadu lidí je to nepřekonatelná překážka. AUFIN AUTO tuto akontaci nepožaduje.",
          "Místo ní platíte jasně danou částku za převzetí vozidla, která je vždy uvedená přímo u konkrétního auta. Žádné dopočítávání, žádné překvapení ve smlouvě.",
        ],
      },
      {
        h2: "Kolik zaplatíte na začátku",
        paragraphs: [
          "U každého vozu v naší nabídce najdete dvě čísla: měsíční nájemné a částku při převzetí vozidla. To je vše, co na startu řešíte. Po podpisu smlouvy odjíždíte a dál hradíte pouze pravidelné měsíční splátky.",
          "Cena nezahrnuje pojištění – to si sjednáváte samostatně, abyste měli plnou kontrolu nad jeho rozsahem.",
        ],
      },
    ],
    faqSlugs: [3, 0, 1, 2, 5],
  },

  "auto-na-splatky-s-exekuci": {
    slug: "auto-na-splatky-s-exekuci",
    keyword: "auto na splátky s exekucí",
    title: "Auto na splátky i s exekucí a po insolvenci | AUFIN AUTO",
    description:
      "Auto na splátky i s exekucí nebo po insolvenci. Posuzujeme individuálně, registry nenahlížíme. Pronájem vozu s odkupem, schválení do 30 minut.",
    badge: "I s exekucí",
    h1: "Auto na splátky i s exekucí",
    lead:
      "Exekuce ani insolvence v minulosti pro nás nejsou automatickým důvodem k zamítnutí. AUFIN AUTO posuzuje každého klienta individuálně podle aktuální situace – ne podle starých záznamů.",
    benefits: [
      "Vstřícní i ke klientům s exekucí",
      "Řešení i pro lidi po insolvenci",
      "Registry dlužníků nenahlížíme",
      "Bez doložení příjmů, schválení do 30 minut",
    ],
    sections: [
      {
        h2: "Auto na splátky, když máte exekuci",
        paragraphs: [
          "Probíhající nebo nedávná exekuce obvykle znamená, že vám klasické financování vozu nikde neschválí. AUFIN AUTO k tomu přistupuje jinak. Nabízíme pronájem vozu s možností odkupu, u kterého neřešíme registry dlužníků a posuzujeme vaši konkrétní situaci.",
          "Vždy hledáme reálné řešení – ozvěte se nám a probereme možnosti otevřeně a bez závazku.",
        ],
      },
      {
        h2: "Auto na splátky po insolvenci",
        paragraphs: [
          "Pokud máte insolvenci za sebou nebo procházíte oddlužením, auto je často nutnost – do práce, pro rodinu, za doktorem. Právě pro tyto situace je naše služba určená. Nepožadujeme potvrzení o příjmu ani výpis z registru.",
          "Po skončení splátek vůz přechází do vašeho vlastnictví. Žádné nahlížení do vaší minulosti, žádné zbytečné překážky.",
        ],
      },
    ],
    faqSlugs: [1, 0, 2, 3, 5],
  },
};
