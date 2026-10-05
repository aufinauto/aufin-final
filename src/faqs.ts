/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Sdílená data častých dotazů – používá homepage i SEO landing pages.
 */

export interface Faq {
  q: string;
  a: string;
  /** true = jen na landing pages, ne na hlavní stránce */
  hideOnHomepage?: boolean;
}

export const faqs: Faq[] = [
  {
    q: "Potřebuji k autu na splátky doložit příjem?",
    a: "Ne. Auto na splátky u nás získáte bez doložení příjmů. Nepožadujeme potvrzení od zaměstnavatele ani daňové přiznání – stačí řidičské oprávnění a doklad totožnosti.",
  },
  {
    q: "Co když jsem v registru dlužníků nebo mám exekuci?",
    a: "Není to překážka. Auto na splátky bez registru znamená, že registry dlužníků nenahlížíme a neřešíme. Posuzujeme každého klienta individuálně, vstřícní jsme i k lidem s exekucí či insolvencí.",
  },
  {
    q: "Jak rychle proběhne schválení?",
    a: "Schválení zvládneme zpravidla do 30 minut. Po podpisu smlouvy a uhrazení počáteční platby můžete vozem odjet ještě týž den.",
  },
  {
    q: "Kolik zaplatím při převzetí vozu?",
    a: "Při převzetí vozidla skládáte jednorázovou počáteční platbu uvedenou u každého vozu. Měsíční nájemné a počáteční platba jsou vždy uvedené v detailu konkrétního auta.",
  },
  {
    q: "Jaké doklady k vyřízení potřebuji?",
    a: "K vyřízení auta na splátky vám stačí řidičské oprávnění a platný doklad totožnosti (např. řidičský průkaz). Žádné další potvrzení nepožadujeme.",
  },
  {
    q: "Mohu vůz po skončení splátek odkoupit?",
    a: "Ano. Jde o pronájem vozidla s možností odkupu – po uhrazení splátek vůz přechází do vašeho vlastnictví.",
  },
  // Nové dotazy přidávejte na konec – landing pages odkazují na indexy výše.
  {
    q: "Je auto opravdu bez akontace?",
    hideOnHomepage: true,
    a: "Neplatíte klasickou akontaci jako u leasingu, tedy procento z ceny vozu. Při převzetí ale skládáte počáteční platbu, jejíž výše je předem uvedená u každého vozu – bez ní vůz předat nelze. Dál platíte měsíční nájemné.",
  },
  {
    q: "Je v měsíčním nájemném pojištění?",
    hideOnHomepage: true,
    a: "Ne. Pojistné se platí zvlášť, mimo měsíční nájemné.",
  },
];
