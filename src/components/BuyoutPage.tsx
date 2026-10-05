/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * /vykup-auta – poptávka výkupu vozu: kontakt, značka/model, rok, nájezd,
 * očekávaná cena a fotky. Fotky se v prohlížeči zmenší a každá se uloží jako
 * samostatný dokument (Firestore `inquiryPhotos`, navázaný na poptávku v `inquiries`).
 */

import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { ArrowRight, Banknote, Camera, ChevronRight, FileCheck, ImagePlus, Mail, Phone, Plus, RefreshCw, Trash2 } from "lucide-react";
import { SITE_URL } from "../lib/siteEnv";
import { submitLead } from "../lib/leads";
import { compressImage, dataUrlBytes } from "../lib/images";
import { SiteHeader, SiteFooter, WhatsAppButton, ConsentCheckbox, SubmitSuccess, SUBMIT_ERROR, PHONE_DISPLAY, PHONE_HREF, EMAIL, ContactCards } from "./site/Chrome";

const TITLE = "Výkup aut Praha – vykoupíme váš vůz | AUFIN AUTO";
const DESCRIPTION =
  "Chcete prodat auto? Vykoupíme váš vůz rychle a bez zbytečných starostí. Férová nabídka, rychlé vyřízení a možnost protiúčtu. Výkup aut Praha – AUFIN AUTO.";
const CANONICAL = `${SITE_URL}/vykup-auta`;

// Každá fotka se ukládá jako samostatný dokument (limit 1 MB na kus), počet je jen pojistka proti zneužití.
const MAX_PHOTOS = 20;
const MAX_PHOTO_BYTES = 400 * 1024;
const CURRENT_YEAR = new Date().getFullYear();

/** Časté dotazy jen o výkupu – záměrně bez témat splátek, ať stránka nekonkuruje hlavní stránce. */
const BUYOUT_FAQS: { q: string; a: string; link?: { href: string; label: string } }[] = [
  {
    q: "Jak probíhá výkup auta?",
    a: "Pošlete nám základní údaje o voze přes formulář, nebo nám zavolejte. Připravíme vám nabídku a po případné prohlídce vozu ji s vámi doladíme. Když se dohodneme, podepíšeme kupní smlouvu, vyřídíme převod a vyplatíme vám peníze.",
    link: { href: "#formular-vykup", label: "Poslat údaje k výkupu" },
  },
  {
    q: "Jak rychle dostanu peníze za auto?",
    a: "Po dohodě a podpisu kupní smlouvy vám peníze vyplatíme bez zbytečného čekání – můžete je mít na účtu ještě ten samý den.",
  },
  {
    q: "Jaké vozy vykupujete?",
    a: "Vykupujeme osobní vozy různých značek, stáří i stavu. Každý vůz posoudíme individuálně a nabídneme vám férovou výkupní cenu.",
  },
  {
    q: "Vykoupíte i vůz, který je financovaný úvěrem nebo leasingem?",
    a: "Ano, i takový vůz můžeme vykoupit. Každý případ posoudíme individuálně podle způsobu financování a zbývající částky k doplacení.",
  },
  {
    q: "Co potřebuji k výkupu auta?",
    a: "K výkupu budete potřebovat doklady k vozidlu, platný doklad totožnosti a všechny klíče od vozu. Pokud máte servisní knížku, faktury nebo jiné doklady k servisní historii, vezměte je také s sebou.",
  },
  {
    q: "Mohu svůj vůz použít na protiúčet?",
    a: "Ano. Hodnotu vašeho vozu můžeme započítat proti kupní ceně jiného auta z naší nabídky.",
    link: { href: "/auta-k-prodeji", label: "Prohlédnout auta k prodeji" },
  },
  {
    q: "Musím s nabídkou na výkup souhlasit?",
    a: "Ne. Odeslání formuláře ani naše nabídka vás k ničemu nezavazují. O prodeji vozu se rozhodnete až vy.",
  },
];

const EMPTY = { name: "", phone: "", email: "", model: "", year: "", mileage: "", expectedPrice: "", message: "" };

export default function BuyoutPage() {
  const [form, setForm] = useState(EMPTY);
  const [photos, setPhotos] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<null | { preview: boolean }>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const addPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from<File>(e.target.files ?? []).filter((f) => f.type.startsWith("image/"));
    e.target.value = "";
    setPhotoError("");
    if (!files.length) return;
    const room = MAX_PHOTOS - photos.length;
    if (files.length > room) setPhotoError(`Přiložit lze nejvýše ${MAX_PHOTOS} fotografií.`);
    setProcessing(true);
    try {
      const next = [...photos];
      for (const file of files.slice(0, Math.max(room, 0))) {
        if (file.size > 25 * 1024 * 1024) { setPhotoError("Některá fotka je větší než 25 MB a byla vynechána."); continue; }
        let img = await compressImage(file, 1600, 0.75);
        if (dataUrlBytes(img) > MAX_PHOTO_BYTES) img = await compressImage(file, 1200, 0.6);
        if (dataUrlBytes(img) > MAX_PHOTO_BYTES) img = await compressImage(file, 1000, 0.5);
        next.push(img);
      }
      setPhotos(next);
    } catch {
      setPhotoError("Fotku se nepodařilo zpracovat. Zkuste jiný soubor (JPG nebo PNG).");
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await submitLead({
        type: "buyout",
        name: form.name,
        phone: form.phone,
        email: form.email,
        car: form.model,
        message: form.message,
        details: {
          "Značka a model": form.model,
          "Rok výroby": form.year,
          "Nájezd (km)": form.mileage,
          "Očekávaná cena (Kč)": form.expectedPrice || "neuvedeno",
        },
        photos,
      });
      setSubmitted(result);
      setForm(EMPTY);
      setPhotos([]);
    } catch (err) {
      console.error("Chyba při odesílání poptávky výkupu:", err);
      alert(SUBMIT_ERROR);
    } finally {
      setSubmitting(false);
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Domů", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Výkup auta", item: CANONICAL },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: BUYOUT_FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <div className="min-h-screen bg-paper text-ink selection:bg-brand selection:text-ink">
      <Helmet>
        <html lang="cs" />
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <link rel="canonical" href={CANONICAL} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:url" content={CANONICAL} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <SiteHeader active="vykup" />

      <main>
        <section className="bg-sand">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-16">
            <nav aria-label="Drobečková navigace" className="text-sm text-ink/60 mb-4">
              <a href="/" className="hover:text-ink">Domů</a> <span aria-hidden="true">/</span> <span className="text-ink">Výkup auta</span>
            </nav>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Výkup auta</h1>
            <p className="text-lg text-ink/75 max-w-2xl mb-6">
              Prodejte své auto rychle a bez zbytečných starostí. O výkup se postaráme od nabídky až po vyplacení.
            </p>
            {/* Postup ve 3 krocích – čísla v kolečkách propojená linkou */}
            <ol className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 max-w-3xl mx-auto w-fit sm:w-full">
              {["Pošlete údaje o voze", "Připravíme nabídku", "Vůz vykoupíme"].map((t, i) => (
                <li key={t} className="flex items-center sm:flex-1 last:sm:flex-none">
                  <span className="w-9 h-9 rounded-full bg-brand text-on-brand font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <span className="ml-3 font-semibold whitespace-nowrap">{t}</span>
                  {i < 2 && <span aria-hidden="true" className="hidden sm:block flex-1 h-px bg-line mx-4 min-w-6" />}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Hlavní výhody výkupu */}
        <section className="px-4 sm:px-6 pt-12 md:pt-16">
          <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-4">
            {[
              { icon: Banknote, t: "Rychlé vyplacení", d: "Po dokončení výkupu vám kupní cenu vyplatíme bez zbytečného čekání." },
              { icon: FileCheck, t: "Vše vyřídíme za vás", d: "Postaráme se o potřebnou administrativu spojenou s výkupem." },
              { icon: RefreshCw, t: "Možnost protiúčtu", d: "Hodnotu vašeho vozu můžete využít při koupi jiného auta z naší nabídky." },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t} className="p-5 rounded-2xl border border-line">
                <div className="w-11 h-11 rounded-xl bg-brand-soft flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-brand-deep" />
                </div>
                <div className="font-bold mb-1">{t}</div>
                <p className="text-ink/70 text-[15px]">{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="formular-vykup" className="py-12 md:py-16 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-8 lg:gap-12 lg:items-start">
            {/* Kontakt – na počítači drží při posouvání dlouhého formuláře na místě */}
            <div className="lg:sticky lg:top-28">
              <span className="text-brand-deep font-bold tracking-wider text-sm uppercase mb-2 block">Rychlé nacenění</span>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">Nechte si nacenit svůj vůz</h2>
              <p className="text-ink/70 text-lg mb-8">Vyplňte krátký formulář, nebo nám rovnou zavolejte či napište.</p>
              <ContactCards waText="Dobrý den, chci nabídnout auto k výkupu." trackLabel="buyout_contact" />
            </div>

            <div>
            <div className="bg-card rounded-3xl border border-line p-5 sm:p-8 shadow-sm">
              {submitted ? (
                <SubmitSuccess preview={submitted.preview} onReset={() => setSubmitted(null)}>
                  Děkujeme, údaje o voze jsme přijali. Ozveme se vám s nabídkou.
                </SubmitSuccess>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <fieldset className="space-y-4">
                    <legend className="text-lg font-bold mb-1">Kontakt</legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="b-name" className="field-label">Jméno a příjmení *</label>
                        <input id="b-name" required autoComplete="name" className="field" value={form.name} onChange={set("name")} />
                      </div>
                      <div>
                        <label htmlFor="b-phone" className="field-label">Telefon *</label>
                        <input id="b-phone" type="tel" required autoComplete="tel" className="field" value={form.phone} onChange={set("phone")} />
                      </div>
                      <div className="sm:col-span-2">
                        <label htmlFor="b-email" className="field-label">E-mail *</label>
                        <input id="b-email" type="email" required autoComplete="email" className="field" value={form.email} onChange={set("email")} />
                      </div>
                    </div>
                  </fieldset>

                  <fieldset className="space-y-4">
                    <legend className="text-lg font-bold mb-1">Vůz</legend>
                    <div>
                      <label htmlFor="b-model" className="field-label">Značka a model *</label>
                      <input id="b-model" required placeholder="např. Škoda Octavia 1.6 TDI" className="field" value={form.model} onChange={set("model")} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="b-year" className="field-label">Rok výroby *</label>
                        <input id="b-year" type="number" inputMode="numeric" required min={1950} max={CURRENT_YEAR} placeholder="2015" className="field" value={form.year} onChange={set("year")} />
                      </div>
                      <div>
                        <label htmlFor="b-mileage" className="field-label">Nájezd (km) *</label>
                        <input id="b-mileage" type="number" inputMode="numeric" required min={0} max={2000000} placeholder="180000" className="field" value={form.mileage} onChange={set("mileage")} />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="b-price" className="field-label">Očekávaná cena (Kč)</label>
                      <input id="b-price" type="number" inputMode="numeric" min={0} placeholder="např. 150000" className="field" value={form.expectedPrice} onChange={set("expectedPrice")} />
                    </div>
                  </fieldset>

                  <fieldset>
                    <legend className="text-lg font-bold mb-1">Fotografie vozu <span className="text-sm font-normal text-ink/50">(volitelné)</span></legend>
                    <p className="text-sm text-ink/60 mb-3">Nahrajte fotografie vozu – exteriér, interiér, tachometr a případná poškození.</p>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
                      {photos.map((p, i) => (
                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-line">
                          <img src={p} alt={`Přiložená fotka ${i + 1}`} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setPhotos(photos.filter((_, j) => j !== i))} aria-label={`Odebrat fotku ${i + 1}`}
                            className="absolute top-1 right-1 w-7 h-7 rounded-full bg-card/95 flex items-center justify-center shadow">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    {photos.length < MAX_PHOTOS && (
                      <label className={`flex items-center justify-center gap-2 w-full py-5 rounded-xl border-2 border-dashed border-line hover:border-brand cursor-pointer text-ink/75 font-semibold ${processing ? "opacity-60 pointer-events-none" : ""}`}>
                        {processing ? <Camera className="w-5 h-5 animate-pulse" /> : <ImagePlus className="w-5 h-5" />}
                        {processing ? "Zpracovávám fotky…" : "Přidat fotky"}
                        <input type="file" accept="image/*" multiple className="sr-only" onChange={addPhotos} />
                      </label>
                    )}
                    {photoError && <p role="alert" className="text-sm text-red-700 mt-2">{photoError}</p>}
                  </fieldset>

                  <div>
                    <label htmlFor="b-message" className="field-label">Poznámka <span className="font-normal text-ink/50">(volitelné)</span></label>
                    <textarea id="b-message" rows={3} placeholder="Stav vozu, servisní historie, výbava…" className="field resize-none" value={form.message} onChange={set("message")} />
                  </div>

                  <ConsentCheckbox id="b-privacy" />

                  <button type="submit" disabled={submitting || processing} className="btn-primary w-full text-lg">
                    {submitting ? <span className="w-6 h-6 border-2 border-ink/20 border-t-ink rounded-full animate-spin" /> : <>Odeslat k nacenění <ChevronRight className="w-5 h-5" /></>}
                  </button>
                </form>
              )}
            </div>
            </div>
          </div>
        </section>

        {/* Časté dotazy */}
        <section id="caste-dotazy" className="py-12 md:py-20 bg-sand px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <span className="text-brand-deep font-bold tracking-wider text-sm uppercase mb-2 block">Časté dotazy</span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Výkup auta – odpovědi</h2>
            </div>
            <div className="space-y-3">
              {BUYOUT_FAQS.map((faq, i) => (
                <div key={i} className="bg-card rounded-2xl border border-line overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                    className="w-full flex items-center justify-between gap-4 p-5 text-left"
                  >
                    <span className="font-bold text-[17px]">{faq.q}</span>
                    <Plus className={`w-5 h-5 text-brand-deep shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-45" : ""}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-5 text-ink/75 leading-relaxed">
                      {faq.a}
                      {faq.link && (
                        <a href={faq.link.href} className="mt-2 flex items-center gap-1 font-semibold text-brand-deep hover:underline underline-offset-4 w-fit">
                          {faq.link.label} <ArrowRight className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      <WhatsAppButton text="Dobrý den, chci nabídnout auto k výkupu." />
    </div>
  );
}
