/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Sdílená data častých dotazů – používá homepage i SEO landing pages.
 */

export interface Faq {
  q: string;
  a: string;
}

export const faqs: Faq[] = [
  {
    q: "Potřebuji k autu na splátky doložit příjem?",
    a: "Ne. Auto na splátky u nás získáte bez doložení příjmů. Nepožadujeme potvrzení od zaměstnavatele ani daňové přiznání – stačí vaše čestné prohlášení a dva doklady totožnosti.",
  },
  {
    q: "Co když jsem v registru dlužníků nebo mám exekuci?",
    a: "Není to překážka. Auto na splátky bez registru znamená, že registry dlužníků nenahlížíme a neřešíme. Posuzujeme každého klienta individuálně, vstřícní jsme i k lidem s exekucí či po insolvenci.",
  },
  {
    q: "Jak rychle proběhne schválení?",
    a: "Schválení zvládneme zpravidla do 30 minut. Po podpisu smlouvy můžete vozem odjet ještě týž den.",
  },
  {
    q: "Kolik zaplatím při převzetí vozu?",
    a: "Při převzetí vozidla skládáte jednorázovou částku uvedenou u každého vozu. Měsíční nájemné a cena při převzetí jsou vždy transparentně uvedené v detailu konkrétního auta.",
  },
  {
    q: "Jaké doklady k vyřízení potřebuji?",
    a: "K vyřízení auta na splátky vám stačí dva platné doklady totožnosti (např. občanský průkaz a řidičský průkaz). Žádné další potvrzení nepožadujeme.",
  },
  {
    q: "Mohu vůz po skončení splátek odkoupit?",
    a: "Ano. Jde o pronájem vozidla s možností odkupu – po uhrazení splátek vůz přechází do vašeho vlastnictví.",
  },
];
