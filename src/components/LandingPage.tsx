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
import { SiteHeader, SiteFooter, PHONE_DISPLAY, PHONE_HREF } from "./site/Chrome";

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
    <div className="min-h-screen bg-paper text-ink selection:bg-brand selection:text-ink">
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

      <SiteHeader />

      {/* Hero */}
      <section className="relative pt-12 md:pt-20 pb-14 px-4 sm:px-6 overflow-hidden bg-sand">
                <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span className="inline-block px-3 py-1 rounded-full bg-brand-soft text-brand-deep text-xs font-bold tracking-wider uppercase mb-5">
              {config.badge}
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-[1.05]">
              {config.h1}
            </h1>
            <p className="text-lg md:text-xl text-ink/75 max-w-2xl mx-auto mb-8">
              {config.lead}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="/#nabidka-aut" className="btn-primary w-full sm:w-auto text-lg">
                Prohlédnout auta na splátky <ChevronRight className="w-5 h-5" />
              </a>
              <a href="#kontakt" className="btn-secondary w-full sm:w-auto text-lg">
                Nezávazná poptávka
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Výhody */}
      <section className="py-12 md:py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
          {config.benefits.map((b, i) => (
            <div key={i} className="flex items-start gap-4 bg-card p-5 rounded-2xl border border-line">
              <CheckCircle2 className="w-6 h-6 text-brand-deep shrink-0" />
              <span className="text-ink/85">{b}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Textové sekce */}
      <section className="py-12 md:py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-14">
          {config.sections.map((s, i) => (
            <div key={i}>
              <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-5">{s.h2}</h2>
              <div className="space-y-4 text-ink/75 text-[17px] leading-relaxed">
                {s.paragraphs.map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Rychlé schválení */}
      <section className="py-12 md:py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-card p-6 md:p-8 rounded-2xl border border-line flex gap-5 items-start">
            <div className="w-12 h-12 rounded-full bg-brand-soft flex items-center justify-center shrink-0">
              <Clock className="text-brand-deep w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Schválení do 30 minut</h3>
              <p className="text-ink/70">Nečekáte na vyjádření banky. Po podpisu smlouvy a uhrazení počáteční platby můžete odjet ještě týž den.</p>
            </div>
          </div>
          <div className="bg-card p-6 md:p-8 rounded-2xl border border-line flex gap-5 items-start">
            <div className="w-12 h-12 rounded-full bg-brand-soft flex items-center justify-center shrink-0">
              <ShieldCheck className="text-brand-deep w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Individuální posouzení</h3>
              <p className="text-ink/70">Každého klienta posuzujeme zvlášť podle aktuální situace – ne podle starých záznamů.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      {pageFaqs.length > 0 && (
        <section className="py-12 md:py-16 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-8 text-center">Časté dotazy</h2>
            <div className="space-y-3">
              {pageFaqs.map((faq, i) => (
                <div key={i} className="bg-card rounded-2xl border border-line overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between gap-4 p-5 text-left"
                  >
                    <span className="font-bold text-[17px]">{faq.q}</span>
                    <Plus className={`w-5 h-5 text-brand-deep shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-45" : ""}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-5 text-ink/75 leading-relaxed">{faq.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA / Kontakt */}
      <section id="kontakt" className="py-16 md:py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto bg-sand rounded-3xl border border-line p-6 sm:p-12 text-center">
          <span className="text-brand-deep font-bold tracking-wider text-sm uppercase mb-2 block">Kontaktujte nás</span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">Nezávazná poptávka</h2>
          <p className="text-ink/70 mb-8 max-w-xl mx-auto">
            Vyplňte nezávaznou poptávku na hlavní stránce nebo nám rovnou zavolejte. Ozveme se vám zpět do 30 minut.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/#formular" className="btn-primary w-full sm:w-auto text-lg">
              Odeslat poptávku <ChevronRight className="w-5 h-5" />
            </a>
            <a href={PHONE_HREF} className="btn-secondary w-full sm:w-auto text-lg">
              <Phone className="w-5 h-5" /> {PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
