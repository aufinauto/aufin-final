/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * /auta-k-prodeji – přímý prodej vozů za celou cenu (hotově nebo převodem).
 * Samostatný sklad: Firestore kolekce `saleCars`, oddělená od splátkových `cars`.
 * Splátkové vozy se zde nezobrazují a u vozů se neuvádí splátková varianta.
 * Každý vůz má vlastní stránku /auta-k-prodeji/<slug> (SaleCarDetailPage).
 */

import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { ArrowRight, BadgeCheck, ChevronRight, Plus, RefreshCw, ShieldCheck } from "lucide-react";
import { loadPublished } from "../lib/siteData";
import { SITE_URL } from "../lib/siteEnv";
import { submitLead } from "../lib/leads";
import { formatCzk } from "../lib/installment";
import { formatKm, saleCarPath } from "../lib/saleCars";
import type { SaleCar } from "../types";
import { SiteHeader, SiteFooter, WhatsAppButton, SubmitSuccess, SUBMIT_ERROR, PHONE_DISPLAY, PHONE_HREF, EMAIL, ContactCards } from "./site/Chrome";

const TITLE = "Ojetá auta na prodej Praha | AUFIN AUTO";
const DESCRIPTION =
  "Ojetá auta na prodej v Praze. Prohlédněte si aktuální nabídku vozů AUFIN AUTO. Prověřené vozy, férové ceny a možnost rychlého převzetí.";
const CANONICAL = `${SITE_URL}/auta-k-prodeji`;

/** Časté dotazy jen o prodeji – záměrně bez témat splátek, ať stránka nekonkuruje hlavní stránce. */
const SALE_FAQS: { q: string; a: string; link?: { href: string; label: string } }[] = [
  {
    q: "Jak vozy před prodejem prověřujete?",
    a: "Každý vůz před zařazením do nabídky kontrolujeme – zaměřujeme se na jeho technický stav a doklady. Podrobnosti o stavu a historii konkrétního auta vám rádi sdělíme.",
  },
  {
    q: "Můžu si vůz před koupí prohlédnout a vyzkoušet?",
    a: "Ano. Prohlídku i zkušební jízdu si s vámi rádi předem domluvíme. Stačí nás kontaktovat a společně vybereme vhodný termín.",
  },
  {
    q: "Můžu dát své auto na protiúčet?",
    a: "Ano. Váš současný vůz můžete použít protiúčtem při koupi auta z naší nabídky.",
  },
  {
    q: "Vykoupíte moje auto, i když si u vás jiné nekoupím?",
    a: "Ano. Váš vůz vykoupíme i bez nákupu jiného auta. Postaráme se o celý proces a peníze můžete mít na účtu ještě tentýž den.",
    link: { href: "/vykup-auta", label: "Poslat údaje k výkupu" },
  },
  {
    q: "Pomůžete mi sjednat pojištění vozu?",
    a: "Ano. Pomůžeme vám sjednat povinné ručení i havarijní pojištění přímo při koupi vozu.",
  },
  {
    q: "Jak můžu za vůz zaplatit?",
    a: "Kupní cenu můžete uhradit bankovním převodem nebo v hotovosti.",
  },
  {
    q: "Co znamená „auto na klíč“?",
    a: "Nenašli jste v naší nabídce vhodný vůz? Napište nám, jaké auto hledáte, váš rozpočet a požadavky, nebo nám zavolejte. Vhodný vůz pro vás vyhledáme, prověříme a ozveme se vám s konkrétní nabídkou.",
    link: { href: "#poptavka", label: "Poptat vůz na klíč" },
  },
];


export default function CashCarsPage() {
  const [cars, setCars] = useState<SaleCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", phone: "", email: "", car: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<null | { preview: boolean }>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    // Publikovaná nabídka ze souboru /data/sale-cars.json (bez čtení Firestore), viz lib/siteData.ts.
    let alive = true;
    loadPublished<SaleCar>("saleCars")
      .then((all) => {
        if (!alive) return;
        setCars(
          all
            .filter((c) => c.isVisible !== false)
            .sort((a, b) => Number(!!a.isSold) - Number(!!b.isSold) || (a.price || 0) - (b.price || 0))
        );
      })
      // Při chybě se zobrazí prázdná nabídka s kontaktem.
      .catch((err) => console.error("Nabídku aut k prodeji se nepodařilo načíst:", err))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await submitLead({
        type: "cash",
        name: form.name,
        phone: form.phone,
        email: form.email,
        car: form.car,
        message: form.message,
      });
      setSubmitted(result);
      setForm({ name: "", phone: "", email: "", car: "", message: "" });
    } catch (err) {
      console.error("Chyba při odesílání poptávky:", err);
      alert(SUBMIT_ERROR);
    } finally {
      setSubmitting(false);
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: SALE_FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Domů", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Auta k prodeji", item: CANONICAL },
    ],
  };

  const available = cars.filter((c) => !c.isSold);

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

      <SiteHeader active="hotove" />

      <main>
        <section className="bg-sand">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-16">
            <nav aria-label="Drobečková navigace" className="text-sm text-ink/60 mb-4">
              <a href="/" className="hover:text-ink">Domů</a> <span aria-hidden="true">/</span> <span className="text-ink">Auta k prodeji</span>
            </nav>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Auta k prodeji</h1>
            <p className="text-lg text-ink/75 max-w-2xl mb-6">
              Prověřené ojeté vozy k prodeji. Vyberte si z aktuální nabídky.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="#nabidka" className="btn-primary">
                Prohlédnout nabídku <ChevronRight className="w-5 h-5" />
              </a>
              <a href="/#nabidka-aut" className="btn-secondary">
                Hledáte auto na splátky? <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>

        <section id="nabidka" className="py-12 md:py-16 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-6">Nabídka vozů k prodeji</h2>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-80 rounded-2xl bg-sand animate-pulse" />
                ))}
              </div>
            ) : cars.length === 0 ? (
              <div className="p-8 rounded-2xl border border-line bg-sand text-center">
                <p className="text-lg font-semibold mb-2">Momentálně nemáme zveřejněné vozy k prodeji.</p>
                <p className="text-ink/70 mb-5">Napište nám, jaké auto hledáte, nebo nám zavolejte na {PHONE_DISPLAY}.</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a href="#poptavka" className="btn-primary">Poslat poptávku</a>
                  <a href={PHONE_HREF} className="btn-secondary">Zavolat</a>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {cars.map((car) => (
                  <article key={car.id} className={`bg-card rounded-2xl border border-line overflow-hidden flex flex-col ${car.isSold ? "opacity-60" : "hover:shadow-lg transition-shadow"}`}>
                    <a href={car.isSold ? undefined : saleCarPath(car)} aria-disabled={car.isSold || undefined} className="flex flex-col flex-1">
                      <div className="relative aspect-[4/3] bg-sand overflow-hidden">
                        {car.image && <img src={car.image} alt={`${car.name}, ${car.details?.year}`} loading="lazy" className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
                        {car.isSold && <span className="absolute top-3 left-3 px-3 py-1 bg-night text-white text-xs font-bold uppercase rounded-full">Prodáno</span>}
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="text-lg font-bold">{car.name}</h3>
                        <div className="text-sm text-ink/60 mb-4">
                          {[car.details?.year, formatKm(car.details?.mileage), car.details?.fuel, car.details?.transmission].filter(Boolean).join(" · ")}
                        </div>
                        <div className="mt-auto pt-4 border-t border-line flex items-end justify-between gap-3">
                          <div>
                            <div className="text-xs text-ink/60">Cena</div>
                            <div className="text-2xl font-extrabold">{car.price ? formatCzk(car.price) : "Na dotaz"}</div>
                          </div>
                          {!car.isSold && <span className="text-sm font-bold text-brand-deep inline-flex items-center">Detail <ChevronRight className="w-4 h-4" /></span>}
                        </div>
                      </div>
                    </a>
                  </article>
                ))}
              </div>
            )}
            {!loading && cars.length > 0 && available.length === 0 && (
              <p className="mt-4 text-ink/70">Všechny zveřejněné vozy jsou prodané – pošlete nám poptávku a ozveme se, až budeme mít další.</p>
            )}
          </div>
        </section>

        <section className="px-4 sm:px-6 pb-4">
          <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-4">
            {[
              { icon: BadgeCheck, t: "Prověřené vozy", d: "Každý vůz před zařazením do nabídky kontrolujeme." },
              { icon: RefreshCw, t: "Výkup a protiúčet", d: "Váš současný vůz vykoupíme nebo ho můžete využít protiúčtem při koupi nového auta.", href: "/vykup-auta" },
              { icon: ShieldCheck, t: "Pojištění vozu", d: "Pomůžeme vám sjednat povinné ručení i havarijní pojištění přímo při koupi vozu." },
            ].map(({ icon: Icon, t, d, href }) => {
              const inner = (
                <>
                  <div className="w-11 h-11 rounded-xl bg-brand-soft flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-brand-deep" />
                  </div>
                  <div className="font-bold mb-1 flex items-center gap-1.5">
                    {t}
                    {href && <ArrowRight className="w-4 h-4 text-brand-deep transition-transform group-hover:translate-x-1" aria-hidden="true" />}
                  </div>
                  <p className="text-ink/70 text-[15px]">{d}</p>
                </>
              );
              return href ? (
                <a key={t} href={href} className="group p-5 rounded-2xl border border-line hover:border-brand hover:bg-brand-soft/40 transition-colors">{inner}</a>
              ) : (
                <div key={t} className="p-5 rounded-2xl border border-line">{inner}</div>
              );
            })}
          </div>
        </section>

        <section id="poptavka" className="py-12 md:py-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-8 lg:gap-12 lg:items-center">
            <div>
              <span className="text-brand-deep font-bold tracking-wider text-sm uppercase mb-2 block">Pomůžeme vám s výběrem</span>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">Hledáte konkrétní vůz?</h2>
              <p className="text-ink/70 text-lg mb-8">Napište nám, co hledáte, a ozveme se vám s nabídkou.</p>
              <ContactCards waText="Dobrý den, mám zájem o auto k prodeji od AUFIN AUTO." trackLabel="sale_contact" />
            </div>
            <div className="bg-card rounded-3xl border border-line p-5 sm:p-8 shadow-sm">
              {submitted ? (
                <SubmitSuccess preview={submitted.preview} onReset={() => setSubmitted(null)}>
                  Děkujeme, poptávku jsme přijali a ozveme se vám.
                </SubmitSuccess>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="c-name" className="field-label">Jméno a příjmení</label>
                      <input id="c-name" required autoComplete="name" placeholder="Jan Novák" className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                      <label htmlFor="c-phone" className="field-label">Telefon</label>
                      <input id="c-phone" type="tel" required autoComplete="tel" placeholder="+420 123 456 789" className="field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    </div>
                    <div>
                      <label htmlFor="c-email" className="field-label">E-mail</label>
                      <input id="c-email" type="email" required autoComplete="email" placeholder="jan.novak@email.cz" className="field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <div>
                      <label htmlFor="c-car" className="field-label">Mám zájem o vůz</label>
                      <select id="c-car" required className="field" value={form.car} onChange={(e) => setForm({ ...form, car: e.target.value })}>
                        <option value="">Vyberte vůz</option>
                        {available.map((c) => (
                          <option key={c.id} value={c.name}>{c.name}{c.price ? ` – ${formatCzk(c.price)}` : ""}</option>
                        ))}
                        <option value="Auto na klíč">Auto na klíč – najdeme vůz podle vašich přání</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="c-message" className="field-label">Zpráva <span className="font-normal text-ink/50">(volitelné)</span></label>
                    <textarea id="c-message" rows={3} placeholder="Napište nám, jaký vůz hledáte nebo co vás zajímá…" className="field resize-none" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                  </div>
                  <p className="text-sm text-ink/60">
                    Odesláním formuláře berete na vědomí{" "}
                    <a href="/ochrana-osobnich-udaju" target="_blank" rel="noopener" className="text-brand-deep underline underline-offset-2">zásady ochrany osobních údajů</a>.
                  </p>
                  <button type="submit" disabled={submitting} className="btn-primary w-full text-lg">
                    {submitting ? <span className="w-6 h-6 border-2 border-ink/20 border-t-ink rounded-full animate-spin" /> : <>Odeslat poptávku <ArrowRight className="w-5 h-5" /></>}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* Časté dotazy */}
        <section id="caste-dotazy" className="py-12 md:py-20 bg-sand px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <span className="text-brand-deep font-bold tracking-wider text-sm uppercase mb-2 block">Časté dotazy</span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Koupě ojetého auta – odpovědi</h2>
            </div>
            <div className="space-y-3">
              {SALE_FAQS.map((faq, i) => (
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
                        <a
                          href={faq.link.href}
                          // Odkaz na formulář rovnou předvyplní „Auto na klíč“
                          onClick={() => faq.link?.href === "#poptavka" && setForm((prev) => ({ ...prev, car: "Auto na klíč" }))}
                          className="mt-2 flex items-center gap-1 font-semibold text-brand-deep hover:underline underline-offset-4 w-fit">
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
      <WhatsAppButton text="Dobrý den, mám zájem o auto k prodeji od AUFIN AUTO." />
    </div>
  );
}
