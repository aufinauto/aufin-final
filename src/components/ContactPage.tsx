/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * /kontakt – jednoduchá kontaktní stránka: kontakty + obecný formulář (typ poptávky „contact“).
 * Záměrně bez adresy provozovny a otevírací doby (provozovna pro zákazníky není).
 */

import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { ChevronRight } from "lucide-react";
import { SITE_URL } from "../lib/siteEnv";
import { submitLead } from "../lib/leads";
import { SiteHeader, SiteFooter, WhatsAppButton, ConsentCheckbox, SubmitSuccess, SUBMIT_ERROR, PHONE_DISPLAY, EMAIL, ContactCards } from "./site/Chrome";

const TITLE = "Kontakt | AUFIN AUTO";
const DESCRIPTION =
  "Kontaktujte AUFIN AUTO – auta na splátky bez registru, auta k prodeji a výkup aut. Zavolejte, napište na WhatsApp nebo vyplňte krátký formulář.";
const CANONICAL = `${SITE_URL}/kontakt`;

const EMPTY = { name: "", phone: "", email: "", message: "" };

export default function ContactPage() {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<null | { preview: boolean }>(null);

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await submitLead({ type: "contact", ...form, car: "", details: { Zdroj: "Stránka Kontakt" } });
      setSubmitted(result);
      setForm(EMPTY);
    } catch (err) {
      console.error("Chyba při odesílání z kontaktní stránky:", err);
      alert(SUBMIT_ERROR);
    } finally {
      setSubmitting(false);
    }
  };

  const schema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    url: CANONICAL,
    name: TITLE,
    mainEntity: {
      "@type": "Organization",
      name: "AUFIN AUTO",
      legalName: "AUFI s.r.o.",
      url: SITE_URL,
      telephone: PHONE_DISPLAY.replace(/\s/g, ""),
      email: EMAIL,
    },
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Domů", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Kontakt", item: CANONICAL },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink selection:bg-brand selection:text-ink">
      <Helmet>
        <html lang="cs" />
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <link rel="canonical" href={CANONICAL} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:url" content={CANONICAL} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <SiteHeader active="kontakt" />

      {/* Krátká stránka – obsah vyplní volnou výšku, aby patička zůstala dole */}
      <main className="flex-1 flex items-center">
        <section className="w-full py-10 md:py-16 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-8 lg:gap-12 lg:items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Kontakt</h1>
              <p className="text-ink/70 text-lg mb-8">Máte dotaz nebo zájem o některou z našich služeb? Zavolejte nám, napište nebo využijte kontaktní formulář.</p>
              <ContactCards waText="Dobrý den, mám dotaz na AUFIN AUTO." trackLabel="contact_page" />
            </div>

            <div className="bg-card rounded-3xl border border-line p-5 sm:p-8 shadow-sm">
              {submitted ? (
                <SubmitSuccess preview={submitted.preview} onReset={() => setSubmitted(null)}>
                  Děkujeme za zprávu. Ozveme se vám co nejdříve.
                </SubmitSuccess>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="k-name" className="field-label">Jméno a příjmení</label>
                      <input id="k-name" required autoComplete="name" placeholder="Jan Novák" className="field" value={form.name} onChange={set("name")} />
                    </div>
                    <div>
                      <label htmlFor="k-phone" className="field-label">Telefon</label>
                      <input id="k-phone" type="tel" required autoComplete="tel" placeholder="+420 123 456 789" className="field" value={form.phone} onChange={set("phone")} />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="k-email" className="field-label">E-mail</label>
                      <input id="k-email" type="email" required autoComplete="email" placeholder="jan.novak@email.cz" className="field" value={form.email} onChange={set("email")} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="k-message" className="field-label">Zpráva <span className="font-normal text-ink/50">(volitelné)</span></label>
                    <textarea id="k-message" rows={4} placeholder="S čím vám můžeme pomoci?" className="field resize-none" value={form.message} onChange={set("message")} />
                  </div>

                  <ConsentCheckbox id="k-privacy" />

                  <button type="submit" disabled={submitting} className="btn-primary w-full text-lg">
                    {submitting ? <span className="w-6 h-6 border-2 border-ink/20 border-t-ink rounded-full animate-spin" /> : <>Odeslat zprávu <ChevronRight className="w-5 h-5" /></>}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      <WhatsAppButton text="Dobrý den, mám dotaz na AUFIN AUTO." />
    </div>
  );
}
