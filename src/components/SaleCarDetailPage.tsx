/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * /auta-k-prodeji/<slug> – samostatná stránka jednoho vozu k prodeji
 * (galerie, parametry, cena, poptávka). Data z Firestore `saleCars`.
 */

import React, { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, ArrowRight, BadgeCheck, Calendar, CarFront, ChevronLeft, ChevronRight, Fuel, Gauge, Palette, Phone, RefreshCw, Settings, ShieldCheck, Wrench, Zap } from "lucide-react";
import { loadPublished } from "../lib/siteData";
import { SITE_URL } from "../lib/siteEnv";
import { submitLead } from "../lib/leads";
import { formatCzk } from "../lib/installment";
import { SALE_BASE_PATH, formatKm, saleCarPath, saleCarSlug } from "../lib/saleCars";
import type { SaleCar } from "../types";
import { SiteHeader, SiteFooter, WhatsAppButton, SubmitSuccess, SUBMIT_ERROR, PHONE_DISPLAY, PHONE_HREF, ContactCards } from "./site/Chrome";

const EMPTY = { name: "", phone: "", email: "", message: "" };

/** Šířka kartičky parametru: poslední neúplný řádek vyplní celou šířku. */
function specSpan(i: number, n: number): string {
  const desktopRest = n % 3; // počet karet v posledním řádku na počítači (0 = plný)
  const lastRowDesktop = desktopRest && i >= n - desktopRest;
  const desktop = !lastRowDesktop ? "sm:col-span-2" : desktopRest === 2 ? "sm:col-span-3" : "sm:col-span-6";
  const mobile = n % 2 === 1 && i === n - 1 ? "col-span-2" : "";
  return `${mobile} ${desktop}`;
}

/**
 * Výbava: řádky „Kategorie: položka, položka“ (formát importu ze Sauta) jako tabulka,
 * ostatní řádky jako běžný text.
 */
function EquipmentList({ text }: { text: string }) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const rows = lines.map((l) => {
    const m = l.match(/^([^:]{2,60}):\s*(.+)$/);
    return m ? { title: m[1].trim(), items: m[2].trim() } : { title: "", items: l };
  });
  return (
    <dl className="rounded-2xl border border-line bg-card divide-y divide-line">
      {rows.map((r, i) => (
        <div key={i} className="grid sm:grid-cols-[14rem_1fr] gap-1 sm:gap-6 px-4 sm:px-5 py-3.5">
          {r.title && <dt className="text-ink/55 text-[15px]">{r.title}</dt>}
          <dd className={`text-ink/85 text-[15px] leading-relaxed ${r.title ? "" : "sm:col-span-2"}`}>{r.items}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function SaleCarDetailPage({ slug }: { slug: string }) {
  const [car, setCar] = useState<SaleCar | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [active, setActive] = useState(0);
  const touchX = useRef<number | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<null | { preview: boolean }>(null);

  useEffect(() => {
    // Publikovaná data ze souboru /data/sale-cars.json (bez čtení Firestore), viz lib/siteData.ts.
    loadPublished<SaleCar>("saleCars")
      .then((all) => {
        const found = all.find((c) => c.isVisible !== false && saleCarSlug(c) === slug);
        setCar(found ?? null);
        setState(found ? "ready" : "missing");
      })
      .catch((err) => {
        console.error("Vůz se nepodařilo načíst:", err);
        setState("error");
      });
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!car) return;
    setSubmitting(true);
    try {
      const result = await submitLead({
        type: "cash",
        ...form,
        car: car.price ? `${car.name} – ${formatCzk(car.price)}` : car.name,
        details: { "Odkaz na vůz": `${SITE_URL}${saleCarPath(car)}` },
      });
      setSubmitted(result);
      setForm(EMPTY);
    } catch (err) {
      console.error("Chyba při odesílání poptávky:", err);
      alert(SUBMIT_ERROR);
    } finally {
      setSubmitting(false);
    }
  };

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const canonical = car ? `${SITE_URL}${saleCarPath(car)}` : `${SITE_URL}${SALE_BASE_PATH}/${slug}`;
  const images = car ? [...new Set([car.image, ...(car.gallery || [])].filter(Boolean))] : [];
  const go = (dir: 1 | -1) => setActive((i) => (images.length ? (i + dir + images.length) % images.length : 0));

  // Šipky na klávesnici přepínají fotky (jen když se nepíše do formuláře).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof Element && e.target.closest("input, textarea, select")) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const summary = car
    ? [car.details?.year, formatKm(car.details?.mileage), car.details?.fuel, car.details?.transmission].filter(Boolean).join(" · ")
    : "";
  const title = car ? `${car.name}${car.details?.year ? ` (${car.details.year})` : ""} na prodej | AUFIN AUTO` : "Auto k prodeji | AUFIN AUTO";
  const description = car
    ? `${car.name} na prodej v Praze${summary ? ` – ${summary}` : ""}. Cena ${car.price ? formatCzk(car.price) : "na dotaz"}. Prověřený vůz od AUFIN AUTO.`
    : "Detail vozu k prodeji od AUFIN AUTO.";

  const schema = car && {
    "@context": "https://schema.org",
    "@type": "Car",
    name: car.name,
    brand: { "@type": "Brand", name: car.brand },
    image: images,
    url: canonical,
    ...(car.details?.year ? { vehicleModelDate: car.details.year } : {}),
    ...(car.details?.fuel ? { fuelType: car.details.fuel } : {}),
    ...(car.details?.transmission ? { vehicleTransmission: car.details.transmission } : {}),
    ...(car.details?.color ? { color: car.details.color } : {}),
    ...(car.details?.body ? { bodyType: car.details.body } : {}),
    ...(car.details?.mileage
      ? { mileageFromOdometer: { "@type": "QuantitativeValue", value: String(car.details.mileage).replace(/\D/g, ""), unitCode: "KMT" } }
      : {}),
    ...(car.price
      ? {
          offers: {
            "@type": "Offer",
            price: car.price,
            priceCurrency: "CZK",
            availability: car.isSold ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
            url: canonical,
          },
        }
      : {}),
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Domů", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Auta k prodeji", item: `${SITE_URL}${SALE_BASE_PATH}` },
      ...(car ? [{ "@type": "ListItem", position: 3, name: car.name, item: canonical }] : []),
    ],
  };

  const specs = car
    ? [
        { icon: Calendar, label: "Rok výroby", value: car.details?.year },
        { icon: Gauge, label: "Nájezd", value: formatKm(car.details?.mileage) },
        { icon: Fuel, label: "Palivo", value: car.details?.fuel },
        { icon: Wrench, label: "Motor", value: car.details?.engine },
        { icon: Zap, label: "Výkon", value: car.details?.power },
        { icon: Settings, label: "Převodovka", value: car.details?.transmission },
        { icon: Palette, label: "Barva", value: car.details?.color },
        { icon: CarFront, label: "Karoserie", value: car.details?.body },
      ].filter((s) => s.value)
    : [];

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink selection:bg-brand selection:text-ink">
      <Helmet>
        <html lang="cs" />
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        {/* Prodaný, neexistující nebo nenačtený vůz do vyhledávání nepatří */}
        {(state !== "ready" || car?.isSold) && <meta name="robots" content="noindex, follow" />}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="product" />
        {images[0] && <meta property="og:image" content={images[0]} />}
        {schema && <script type="application/ld+json">{JSON.stringify(schema)}</script>}
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <SiteHeader active="hotove" />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 md:pt-10">
          <nav aria-label="Drobečková navigace" className="text-sm text-ink/60 mb-6 truncate">
            <a href="/" className="hover:text-ink">Domů</a> <span aria-hidden="true">/</span>{" "}
            <a href={SALE_BASE_PATH} className="hover:text-ink">Auta k prodeji</a>
            {car && <> <span aria-hidden="true">/</span> <span className="text-ink">{car.name}</span></>}
          </nav>
        </div>

        {state === "loading" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 grid lg:grid-cols-[1.4fr_1fr] gap-8">
            <div className="aspect-[4/3] rounded-3xl bg-sand animate-pulse" />
            <div className="h-80 rounded-3xl bg-sand animate-pulse" />
          </div>
        )}

        {(state === "missing" || state === "error") && (
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-3">
              {state === "missing" ? "Tento vůz už v nabídce není" : "Vůz se teď nepodařilo načíst"}
            </h1>
            <p className="text-ink/70 text-lg mb-8">
              {state === "missing"
                ? "Mohl být mezitím prodán. Podívejte se na aktuální nabídku, nebo nám napište, jaké auto hledáte."
                : `Zkuste stránku obnovit později, nebo nám zavolejte na ${PHONE_DISPLAY}.`}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href={SALE_BASE_PATH} className="btn-primary">Aktuální nabídka <ArrowRight className="w-5 h-5" /></a>
              <a href={PHONE_HREF} className="btn-secondary"><Phone className="w-4 h-4" /> Zavolat</a>
            </div>
          </div>
        )}

        {state === "ready" && car && (
          <>
            <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 grid lg:grid-cols-[1.4fr_1fr] gap-8 lg:gap-x-10 lg:items-start">
              {/* Galerie */}
              <div className="min-w-0 order-1 lg:order-none lg:col-start-1 lg:row-start-1">
                <div
                  className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-sand border border-line group touch-pan-y select-none"
                  onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
                  onTouchEnd={(e) => {
                    // Přejetí prstem doleva/doprava = další/předchozí fotka
                    if (touchX.current === null) return;
                    const dx = e.changedTouches[0].clientX - touchX.current;
                    touchX.current = null;
                    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
                  }}
                >
                  {images[active] && (
                    <img src={images[active]} alt={`${car.name} – fotka ${active + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" draggable={false} />
                  )}
                  {images.length > 1 && (
                    <>
                      <button type="button" onClick={() => go(-1)} aria-label="Předchozí fotka"
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 md:w-12 md:h-12 rounded-full bg-night/70 hover:bg-brand text-white hover:text-on-brand flex items-center justify-center backdrop-blur transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button type="button" onClick={() => go(1)} aria-label="Další fotka"
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 md:w-12 md:h-12 rounded-full bg-night/70 hover:bg-brand text-white hover:text-on-brand flex items-center justify-center backdrop-blur transition-colors">
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}
                  {car.isSold && <span className="absolute top-4 left-4 px-4 py-1.5 bg-night text-white text-sm font-bold uppercase rounded-full">Prodáno</span>}
                  {images.length > 1 && (
                    <span className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-night/80 text-white text-sm font-semibold">
                      {active + 1} / {images.length}
                    </span>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-3">
                    {images.map((src, i) => (
                      <button
                        key={src}
                        type="button"
                        onClick={() => setActive(i)}
                        aria-label={`Zobrazit fotku ${i + 1}`}
                        aria-current={i === active}
                        className={`aspect-[4/3] rounded-xl overflow-hidden border-2 transition-colors ${i === active ? "border-brand" : "border-transparent hover:border-line"}`}
                      >
                        <img src={src} alt="" loading="lazy" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Parametry, výbava, popis – na mobilu až pod cenou */}
              <div className="min-w-0 order-3 lg:order-none lg:col-start-1 lg:row-start-2">
                {specs.length > 0 && (
                  <div className="lg:mt-2">
                    <h2 className="text-2xl font-extrabold mb-5">Parametry vozu</h2>
                    {/* Neúplný poslední řádek se roztáhne na celou šířku, ať je mřížka symetrická
                        (počítač: 3 sloupce v 6dílné mřížce, mobil: 2 sloupce). */}
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                      {specs.map(({ icon: Icon, label, value }, i) => (
                        <div key={label} className={`flex items-center gap-3 p-4 rounded-2xl border border-line bg-card ${specSpan(i, specs.length)}`}>
                          <div className="w-10 h-10 rounded-xl bg-brand-soft flex items-center justify-center shrink-0"><Icon className="w-5 h-5 text-brand-deep" /></div>
                          <div className="min-w-0"><div className="text-xs text-ink/60">{label}</div><div className="font-bold break-words">{value}</div></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {car.equipment?.trim() && (
                  <div className="mt-10">
                    <h2 className="text-2xl font-extrabold mb-4">Výbava vozu</h2>
                    <EquipmentList text={car.equipment} />
                  </div>
                )}
                {car.description && (
                  <div className="mt-10">
                    <h2 className="text-2xl font-extrabold mb-4">Popis vozu</h2>
                    <p className="text-ink/75 leading-relaxed whitespace-pre-line">{car.description}</p>
                  </div>
                )}
              </div>

              {/* Cena a akce – na počítači drží při posouvání na místě */}
              <aside className="order-2 lg:order-none lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-start lg:sticky lg:top-28 bg-card rounded-3xl border border-line p-5 sm:p-7 shadow-sm">
                <div className="text-brand-deep font-bold text-xs uppercase tracking-wider mb-2">Auto k prodeji</div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">{car.name}</h1>
                {summary && <p className="text-ink/60 mb-6">{summary}</p>}
                <div className="rounded-2xl bg-brand-soft p-5 mb-6">
                  <div className="text-sm text-ink/70">Cena</div>
                  <div className="text-4xl font-extrabold whitespace-nowrap">{car.price ? formatCzk(car.price) : "Na dotaz"}</div>
                </div>
                {car.isSold ? (
                  <div className="rounded-2xl border border-line p-4 mb-6 text-ink/75">
                    Tento vůz je již prodaný. <a href={SALE_BASE_PATH} className="font-semibold text-brand-deep hover:underline">Podívejte se na aktuální nabídku</a>.
                  </div>
                ) : (
                  <div className="grid gap-3 mb-6">
                    <a href="#poptavka-vozu" className="btn-primary w-full text-lg">Mám zájem o tento vůz <ArrowRight className="w-5 h-5" /></a>
                    <a href={PHONE_HREF} className="btn-secondary w-full"><Phone className="w-4 h-4" /> {PHONE_DISPLAY}</a>
                  </div>
                )}
                <ul className="space-y-3 text-[15px]">
                  <li className="flex items-center gap-3"><BadgeCheck className="w-5 h-5 text-brand-deep shrink-0" /> Prověřený vůz</li>
                  <li className="flex items-center gap-3"><ShieldCheck className="w-5 h-5 text-brand-deep shrink-0" /> Pomůžeme se sjednáním pojištění</li>
                  <li>
                    <a href="/vykup-auta" className="flex items-center gap-3 hover:text-brand-deep">
                      <RefreshCw className="w-5 h-5 text-brand-deep shrink-0" /> Možnost protiúčtu vašeho vozu <ArrowRight className="w-4 h-4" />
                    </a>
                  </li>
                </ul>
              </aside>
            </section>

            {!car.isSold && (
              <section id="poptavka-vozu" className="py-12 md:py-16 px-4 sm:px-6 bg-sand">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-8 lg:gap-12 lg:items-center">
                  <div>
                    <span className="text-brand-deep font-bold tracking-wider text-sm uppercase mb-2 block">Máte zájem?</span>
                    <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">Domluvte si prohlídku</h2>
                    <p className="text-ink/70 text-lg mb-8">Nechte nám kontakt a ozveme se vám, nebo nám rovnou zavolejte či napište.</p>
                    <ContactCards waText={`Dobrý den, mám zájem o vůz ${car.name} (${SITE_URL}${saleCarPath(car)}).`} trackLabel="sale_detail_contact" />
                  </div>
                  <div className="bg-card rounded-3xl border border-line p-5 sm:p-8 shadow-sm">
                    {submitted ? (
                      <SubmitSuccess preview={submitted.preview} onReset={() => setSubmitted(null)}>
                        Děkujeme, poptávku jsme přijali a ozveme se vám.
                      </SubmitSuccess>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="rounded-xl border border-line px-4 py-3 text-sm">
                          <span className="text-ink/60">Vůz:</span> <strong>{car.name}</strong>
                          {car.price ? <span className="text-ink/60"> · {formatCzk(car.price)}</span> : null}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="d-name" className="field-label">Jméno a příjmení</label>
                            <input id="d-name" required autoComplete="name" placeholder="Jan Novák" className="field" value={form.name} onChange={set("name")} />
                          </div>
                          <div>
                            <label htmlFor="d-phone" className="field-label">Telefon</label>
                            <input id="d-phone" type="tel" required autoComplete="tel" placeholder="+420 123 456 789" className="field" value={form.phone} onChange={set("phone")} />
                          </div>
                          <div className="sm:col-span-2">
                            <label htmlFor="d-email" className="field-label">E-mail</label>
                            <input id="d-email" type="email" required autoComplete="email" placeholder="jan.novak@email.cz" className="field" value={form.email} onChange={set("email")} />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="d-message" className="field-label">Zpráva <span className="font-normal text-ink/50">(volitelné)</span></label>
                          <textarea id="d-message" rows={3} placeholder="Kdy by se vám hodila prohlídka?" className="field resize-none" value={form.message} onChange={set("message")} />
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
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
              <a href={SALE_BASE_PATH} className="inline-flex items-center gap-2 font-semibold hover:text-brand-deep">
                <ArrowLeft className="w-4 h-4" /> Zpět na všechna auta k prodeji
              </a>
            </div>
          </>
        )}
      </main>

      <SiteFooter />
      <WhatsAppButton text={car ? `Dobrý den, mám zájem o vůz ${car.name}.` : "Dobrý den, mám zájem o auto k prodeji od AUFIN AUTO."} />
    </div>
  );
}
