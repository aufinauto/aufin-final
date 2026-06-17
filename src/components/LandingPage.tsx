/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * SEO landing page – samostatná URL cílená na jedno klíčové slovo.
 */

import { useState } from "react";
import { motion } from "motion/react";
import { Helmet } from "react-helmet-async";
import { CheckCircle2, ChevronRight, Phone, Plus, Clock, ShieldCheck } from "lucide-react";
import { LandingConfig } from "../landingConfig";
import { faqs } from "../faqs";

const BASE_URL = "https://www.aufinauto.cz";

export default function LandingPage({ config }: { config: LandingConfig }) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const canonical = `${BASE_URL}/${config.slug}`;
  const pageFaqs = config.faqSlugs.map((i) => faqs[i]).filter(Boolean);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Domů", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: config.h1, item: canonical },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: pageFaqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: config.h1,
    serviceType: "Pronájem vozu s možností odkupu",
    provider: {
      "@type": "AutoRental",
      name: "AUFIN AUTO",
      telephone: "+420731562211",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Humpolecká 1886/26, Krč",
        addressLocality: "Praha",
        postalCode: "140 00",
        addressCountry: "CZ",
      },
    },
    areaServed: "CZ",
    description: config.description,
    url: canonical,
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-gold selection:text-black">
      <Helmet>
        <html lang="cs" />
        <title>{config.title}</title>
        <meta name="description" content={config.description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={config.title} />
        <meta property="og:description" content={config.description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={`${BASE_URL}/og-image.jpg`} />
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(serviceSchema)}</script>
        {pageFaqs.length > 0 && (
          <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        )}
      </Helmet>

      {/* Navigace */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-50">
        <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[32px] px-6 md:px-8 h-16 md:h-20 flex items-center justify-between shadow-2xl shadow-gold/10">
          <a href="/" className="flex flex-col leading-none">
            <span className="text-xl font-black tracking-tighter uppercase">AUFIN</span>
            <span className="text-gold text-xs font-bold tracking-[0.3em]">AUTO</span>
          </a>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium uppercase tracking-widest text-white/70">
            <a href="/#nabidka-aut" className="hover:text-gold transition-colors">Nabídka aut</a>
            <a href="/#jak-to-funguje" className="hover:text-gold transition-colors">Jak to funguje</a>
            <a href="/#caste-dotazy" className="hover:text-gold transition-colors">Časté dotazy</a>
          </div>
          <a href="#kontakt" className="bg-gold text-black px-6 py-2.5 rounded-full text-sm font-bold hover:bg-white transition-all duration-300">
            CHCI AUTO
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-40 md:pt-52 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gold/5 blur-[140px] -z-10" />
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-bold tracking-[0.2em] uppercase mb-6">
              {config.badge}
            </span>
            <h1 className="text-4xl md:text-7xl font-bold tracking-tight mb-8 leading-[0.95]">
              {config.h1}
            </h1>
            <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 font-light">
              {config.lead}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="/#nabidka-aut" className="w-full sm:w-auto bg-white text-black px-10 py-4 rounded-full font-bold text-lg hover:bg-gold transition-all duration-300 flex items-center justify-center gap-2">
                PROHLÉDNOUT VOZY <ChevronRight className="w-5 h-5" />
              </a>
              <a href="#kontakt" className="w-full sm:w-auto border border-white/20 hover:border-gold px-10 py-4 rounded-full font-bold text-lg transition-all duration-300">
                NEZÁVAZNÁ POPTÁVKA
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Výhody */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
          {config.benefits.map((b, i) => (
            <div key={i} className="flex items-start gap-4 bg-dark-card p-6 rounded-2xl border border-white/5">
              <CheckCircle2 className="w-6 h-6 text-gold shrink-0" />
              <span className="text-white/80 font-light">{b}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Textové sekce */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto space-y-14">
          {config.sections.map((s, i) => (
            <div key={i}>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">{s.h2}</h2>
              <div className="space-y-4 text-white/60 font-light leading-relaxed">
                {s.paragraphs.map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Rychlé schválení */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-dark-card p-10 rounded-3xl border border-white/5 flex gap-6 items-start">
            <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
              <Clock className="text-gold w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Schválení do 30 minut</h3>
              <p className="text-white/50 font-light">Nečekáte na vyjádření banky. Vyřízení je rychlé a po podpisu smlouvy odjíždíte ještě dnes.</p>
            </div>
          </div>
          <div className="bg-dark-card p-10 rounded-3xl border border-white/5 flex gap-6 items-start">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="text-green-500 w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Individuální posouzení</h3>
              <p className="text-white/50 font-light">Každého klienta posuzujeme zvlášť podle aktuální situace – ne podle starých záznamů.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      {pageFaqs.length > 0 && (
        <section className="py-16 px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-10 text-center">Časté dotazy</h2>
            <div className="space-y-3">
              {pageFaqs.map((faq, i) => (
                <div key={i} className="bg-dark-card rounded-2xl border border-white/5 overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between gap-4 p-6 text-left"
                  >
                    <span className="font-bold text-lg">{faq.q}</span>
                    <Plus className={`w-5 h-5 text-gold shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-45" : ""}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-6 text-white/50 font-light leading-relaxed">{faq.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA / Kontakt */}
      <section id="kontakt" className="py-24 px-6">
        <div className="max-w-3xl mx-auto bg-dark-card rounded-[40px] border border-white/5 p-12 md:p-16 text-center">
          <span className="text-gold font-bold tracking-widest text-sm uppercase mb-4 block">Kontaktujte nás</span>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Získejte auto ještě dnes</h2>
          <p className="text-white/50 font-light mb-10 max-w-xl mx-auto">
            Vyplňte nezávaznou poptávku na hlavní stránce nebo nám rovnou zavolejte. Ozveme se vám zpět do 30 minut.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/#formular" className="w-full sm:w-auto bg-gold text-black px-10 py-4 rounded-full font-bold text-lg hover:bg-white transition-all duration-300 flex items-center justify-center gap-2">
              ODESLAT POPTÁVKU <ChevronRight className="w-5 h-5" />
            </a>
            <a href="tel:+420731562211" className="w-full sm:w-auto border border-white/20 hover:border-gold px-10 py-4 rounded-full font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2">
              <Phone className="w-5 h-5" /> +420 731 562 211
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-white/10 bg-black px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8 text-sm text-white/40 font-light">
          <div className="flex flex-col leading-none">
            <span className="text-xl font-black tracking-tighter uppercase text-white">AUFIN</span>
            <span className="text-gold text-sm font-bold tracking-[0.2em]">AUTO</span>
          </div>
          <div className="space-y-1">
            <p className="font-bold text-white/60">AUFI s.r.o.</p>
            <p>IČO: 24398071</p>
            <p>Humpolecká 1886/26, Krč, 140 00 Praha</p>
          </div>
          <nav className="flex flex-col gap-2">
            <a href="/auta-na-splatky-bez-registru" className="hover:text-gold transition-colors">Auta na splátky bez registru</a>
            <a href="/auto-na-splatky-bez-akontace" className="hover:text-gold transition-colors">Auto na splátky bez akontace</a>
            <a href="/auto-na-splatky-s-exekuci" className="hover:text-gold transition-colors">Auto na splátky i s exekucí</a>
          </nav>
        </div>
        <div className="max-w-7xl mx-auto pt-8 mt-8 border-t border-white/5 text-white/20 text-xs">
          © {new Date().getFullYear()} AUFI s.r.o. Všechna práva vyhrazena.
        </div>
      </footer>
    </div>
  );
}
