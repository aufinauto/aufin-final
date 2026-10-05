/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Zásady ochrany osobních údajů (GDPR).
 */

import { Helmet } from "react-helmet-async";
import { SiteHeader, SiteFooter } from "./site/Chrome";

const BASE_URL = "https://www.aufinauto.cz";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-paper text-ink selection:bg-brand selection:text-ink">
      <Helmet>
        <html lang="cs" />
        <title>Ochrana osobních údajů (GDPR) | AUFIN AUTO</title>
        <meta
          name="description"
          content="Zásady zpracování a ochrany osobních údajů společnosti AUFI s.r.o. (AUFIN AUTO) v souladu s GDPR."
        />
        <link rel="canonical" href={`${BASE_URL}/ochrana-osobnich-udaju`} />
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <SiteHeader />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 md:pt-16 pb-20">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
          Ochrana osobních údajů
        </h1>
        <p className="text-ink/60 mb-10">Účinné od 15. 5. 2026</p>

        <div className="space-y-10 text-ink/80 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-ink mb-3">1. Správce osobních údajů</h2>
            <p>
              Správcem osobních údajů je společnost <strong className="text-ink">AUFI s.r.o.</strong>,
              IČO: 24398071, se sídlem Humpolecká 1886/26, Krč, 140 00 Praha. Kontaktní e-mail:{" "}
              <a href="mailto:aufin.auto@gmail.com" className="text-brand-deep underline underline-offset-2">aufin.auto@gmail.com</a>,
              telefon: +420 731 562 211.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-ink mb-3">2. Jaké údaje zpracováváme</h2>
            <p>
              Prostřednictvím kontaktního formuláře na tomto webu zpracováváme tyto údaje, které nám sami
              poskytnete: jméno a příjmení, e-mailovou adresu, telefonní číslo, údaj o voze, o který máte
              zájem, a text vaší zprávy. U poptávky výkupu vozu dále údaje o nabízeném voze (značka a model,
              rok výroby, nájezd, očekávaná cena) a fotografie, které k poptávce přiložíte.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-ink mb-3">3. Účel a právní základ zpracování</h2>
            <p>
              Údaje zpracováváme výhradně za účelem zpětného kontaktování s nezávaznou nabídkou a vyřízení
              vaší poptávky. Právním základem je váš souhlas udělený odesláním formuláře (čl. 6 odst. 1 písm. a
              GDPR), případně jednání o uzavření smlouvy (čl. 6 odst. 1 písm. b GDPR).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-ink mb-3">4. Doba uložení</h2>
            <p>
              Osobní údaje uchováváme po dobu nezbytnou k vyřízení poptávky, nejdéle však 12 měsíců od
              posledního kontaktu, pokud nedojde k uzavření smlouvy. Po uplynutí této doby údaje vymažeme.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-ink mb-3">5. Příjemci a zpracovatelé</h2>
            <p>
              Údaje z formuláře jsou ukládány v cloudové databázi Google Firebase (Google Ireland Limited),
              která vystupuje jako zpracovatel. Údaje nepředáváme dalším třetím stranám pro marketingové
              účely a neprodáváme je.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-ink mb-3">6. Vaše práva</h2>
            <p>
              Máte právo na přístup ke svým údajům, jejich opravu nebo výmaz, na omezení zpracování, vznesení
              námitky a na přenositelnost údajů. Souhlas se zpracováním můžete kdykoli odvolat zasláním
              e-mailu na aufin.auto@gmail.com. Rovněž máte právo podat stížnost u Úřadu pro ochranu osobních
              údajů (uoou.gov.cz).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-ink mb-3">7. Cookies a analytika</h2>
            <p>
              Web používá nezbytné technické cookies pro svůj provoz. Pro měření návštěvnosti používáme
              Google Analytics (Google Ireland Ltd.), který při návštěvě webu ukládá analytické cookies.
              Cookies můžete kdykoli smazat nebo zablokovat v nastavení svého prohlížeče.
            </p>
          </section>
        </div>

        <div className="mt-16 text-center">
          <a href="/" className="btn-primary">
            ← Zpět na hlavní stránku
          </a>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
