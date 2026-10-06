/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { Helmet } from "react-helmet-async";
import {
  Plus,
  Car as CarIcon,
  CheckCircle2,
  FileText,
  Phone,
  Mail,
  ChevronRight,
  ShieldCheck,
  Zap,
  X,
  Info,
  Calendar,
  Fuel,
  Settings,
  Palette,
  ListChecks,
  Banknote,
  HandCoins,
  ArrowRight,
} from "lucide-react";
import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { loadPublished } from "./lib/siteData";
import { Car as CarType } from "./types";
import { faqs } from "./faqs";

const homepageFaqs = faqs.filter((f) => !f.hideOnHomepage);
import { LANDING_PAGES } from "./landingConfig";
import { IS_PREVIEW } from "./lib/siteEnv";
import { submitLead } from "./lib/leads";
import { formatCzk, installmentTerms } from "./lib/installment";
import {
  SiteHeader,
  SiteFooter,
  WhatsAppButton,
  ConsentCheckbox,
  SubmitSuccess,
  SUBMIT_ERROR,
  PHONE_DISPLAY,
  PHONE_HREF,
  EMAIL,
  ContactCards,
} from "./components/site/Chrome";

// Code-splitting: tyto části se stáhnou až když jsou skutečně potřeba.
const AdminDashboard = lazy(() => import("./components/AdminDashboard"));
const LandingPage = lazy(() => import("./components/LandingPage"));
const PrivacyPage = lazy(() => import("./components/PrivacyPage"));
const NotFound = lazy(() => import("./components/NotFound"));
const Blog = lazy(() => import("./components/Blog"));
const CashCarsPage = lazy(() => import("./components/CashCarsPage"));
const SaleCarDetailPage = lazy(() => import("./components/SaleCarDetailPage"));
const BuyoutPage = lazy(() => import("./components/BuyoutPage"));
const ContactPage = lazy(() => import("./components/ContactPage"));

const PageLoader = () => (
  <div className="min-h-screen bg-paper flex items-center justify-center">
    <div className="w-10 h-10 border-2 border-line border-t-brand rounded-full animate-spin" />
  </div>
);

const steps = [
  {
    icon: <CarIcon className="w-7 h-7 text-brand-deep" />,
    title: "Vyberte si vůz",
    description: "Zvolte si auto z naší nabídky dostupných vozů, které máme skladem.",
  },
  {
    icon: <FileText className="w-7 h-7 text-brand-deep" />,
    title: "Schválení do 30 min",
    description: "Nekontrolujeme registry ani doložení příjmů. Stačí Vám dva doklady.",
  },
  {
    icon: <Zap className="w-7 h-7 text-brand-deep" />,
    title: "Odjíždíte ihned",
    description: "Po podpisu smlouvy odjíždíte ve voze.",
  },
];

const HOME_TITLE = "Auta na splátky bez registru a bez příjmů | AUFIN AUTO Praha";
const HOME_DESCRIPTION =
  "Auto na splátky bez registru a bez doložení příjmů. Pronájem s možností odkupu: počáteční platba a měsíční nájemné předem u každého vozu. Schválení do 30 minut, AUFIN AUTO Praha.";

export default function App() {
  const [cars, setCars] = useState<CarType[]>([]);
  const [carsLoading, setCarsLoading] = useState(true);
  const [carsError, setCarsError] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(() => {
    // V náhledu se administrace neotevírá – zapisovala by do produkční databáze.
    return !IS_PREVIEW && sessionStorage.getItem("isAdminMode") === "true";
  });

  const toggleAdminMode = (val: boolean) => {
    if (val && IS_PREVIEW) {
      alert("Administrace je v náhledu V2 vypnutá, protože by zapisovala do produkční databáze.");
      return;
    }
    setIsAdminMode(val);
    if (val) {
      sessionStorage.setItem("isAdminMode", "true");
    } else {
      sessionStorage.removeItem("isAdminMode");
    }
  };
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    car: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState<null | { preview: boolean }>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [filters, setFilters] = useState({
    brand: "",
    maxPrice: 12000,
  });

  const [selectedCar, setSelectedCar] = useState<CarType | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Nabídka: na počítači max. 2 řádky vozů, zbytek po kliknutí na „Zobrazit vše“.
  const [showAllCars, setShowAllCars] = useState(false);
  const [gridCols, setGridCols] = useState(3);
  useEffect(() => {
    // Stejné zlomy jako mřížka: sm 640 = 2, lg 1024 = 3, xl 1280 = 4 sloupce
    const update = () => {
      const w = window.innerWidth;
      setGridCols(w >= 1280 ? 4 : w >= 1024 ? 3 : w >= 640 ? 2 : 1);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  // Na mobilu (1 sloupec) by 2 řádky byly jen 2 vozy – ukážeme aspoň 4.
  const carLimit = Math.max(gridCols * 2, 4);

  // Deep linking: check URL on load
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      if (path.startsWith("/auto/")) {
        const slug = path.split("/auto/")[1];
        const car = cars.find((c) => c.seo?.slug === slug || generateSlug(c.name) === slug);
        if (car && car.isVisible !== false) {
          setSelectedCar(car);
        }
      } else if (path === "/" || path === "") {
        setSelectedCar(null);
      }
    };

    if (!carsLoading) {
      handleLocationChange();
    }

    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, [cars, carsLoading]);

  // Sync URL with selected car
  const hadSelectedCar = useRef(false);
  useEffect(() => {
    if (selectedCar) {
      hadSelectedCar.current = true;
      const slug = selectedCar.seo?.slug || generateSlug(selectedCar.name);
      const newPath = `/auto/${slug}`;
      if (window.location.pathname !== newPath) {
        window.history.pushState({ carId: selectedCar.id }, selectedCar.name, newPath);
      }
    } else {
      // Reset URL jen po zavření detailu – ne při prvním načtení /auto/…, kdy se vozy
      // teprve načítají (jinak přímý odkaz na vůz skončil na hlavní stránce).
      if (hadSelectedCar.current && window.location.pathname.startsWith("/auto/") && !isAdminMode) {
        window.history.pushState({}, "AUFIN AUTO", "/");
      }
    }
  }, [selectedCar, isAdminMode]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  useEffect(() => {
    // Publikovaná nabídka ze souboru /data/cars.json (bez čtení Firestore), viz lib/siteData.ts.
    let alive = true;
    loadPublished<CarType>("cars")
      .then((list) => {
        if (!alive) return;
        setCars([...list].sort((x, y) => (Number(x.priceValue) || 0) - (Number(y.priceValue) || 0)));
        setCarsLoading(false);
      })
      .catch((err) => {
        // Neukazovat „aktualizujeme“, ale nabídnout kontakt.
        console.error("Nabídku vozů se nepodařilo načíst:", err);
        if (!alive) return;
        setCarsError(true);
        setCarsLoading(false);
      });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (selectedCar || activeImageIndex !== null || isAdminMode) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [selectedCar, activeImageIndex, isAdminMode]);

  const filteredCars = cars.filter((car) => {
    // Hidden cars are strictly excluded from the frontend listing
    if (car.isVisible === false) return false;

    const matchesBrand = filters.brand === "" || car.brand === filters.brand;

    // Get numeric monthly price for filtering - preferring the value shown in the "price" string
    const carPriceMatch = car.price?.replace(/\s/g, "").match(/\d+/);
    const carMonthlyPrice = carPriceMatch ? parseInt(carPriceMatch[0]) : Number(car.priceValue) || 0;

    // STRICT FILTERING: Hide anything above the maxPrice selected
    const matchesPrice = carMonthlyPrice <= filters.maxPrice;

    return matchesBrand && matchesPrice;
  });

  const publicCars = cars.filter((c) => c.isVisible !== false);
  const brands = Array.from(new Set(publicCars.map((c) => c.brand).filter((b) => b !== "")));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await submitLead({ type: "installment", ...formData });
      setSubmitted(result);
      setFormData({ name: "", email: "", phone: "", car: "", message: "" });
    } catch (error) {
      console.error("Chyba při odesílání poptávky:", error);
      alert(SUBMIT_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCarDetail = (car: (typeof cars)[0]) => {
    setSelectedCar(car);
  };

  const closeCarDetail = () => {
    setSelectedCar(null);
    setActiveImageIndex(null);
  };

  const allImages = selectedCar ? [selectedCar.image, ...(selectedCar.gallery || [])] : [];

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeImageIndex !== null) {
      setActiveImageIndex((activeImageIndex + 1) % allImages.length);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeImageIndex !== null) {
      setActiveImageIndex((activeImageIndex - 1 + allImages.length) % allImages.length);
    }
  };

  const handleCarInquiry = (carName: string) => {
    setFormData({ ...formData, car: carName });
    setSelectedCar(null);
    const element = document.getElementById("formular");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const schemaOrgData = {
    "@context": "https://schema.org",
    "@type": "AutoRental",
    name: "AUFIN AUTO",
    image: "https://aufinauto.cz/og-image.jpg",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Humpolecká 1886/26, Krč",
      addressLocality: "Praha",
      postalCode: "140 00",
      addressCountry: "CZ",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 50.0401,
      longitude: 14.4447,
    },
    url: "https://www.aufinauto.cz",
    telephone: "+420731562211",
    priceRange: "$$$",
    description: "Auta na splátky po celé ČR. Specialista na vozy bez registru a bez doložení příjmů. Působíme v Praze.",
  };

  const carListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: filteredCars.map((car, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `https://www.aufinauto.cz/auto/${car.seo?.slug || generateSlug(car.name)}`,
      name: car.name,
      image: car.image,
    })),
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: homepageFaqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const breadcrumbSchema = selectedCar
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Domů", item: "https://www.aufinauto.cz" },
          { "@type": "ListItem", position: 2, name: "Auta na splátky", item: "https://www.aufinauto.cz/#nabidka-aut" },
          {
            "@type": "ListItem",
            position: 3,
            name: selectedCar.name,
            item: `https://www.aufinauto.cz/auto/${selectedCar.seo?.slug || generateSlug(selectedCar.name)}`,
          },
        ],
      }
    : null;

  const selectedCarSchema = selectedCar
    ? {
        "@context": "https://schema.org",
        "@type": "Vehicle",
        name: selectedCar.name,
        brand: selectedCar.brand,
        image: selectedCar.image,
        description: selectedCar.description,
        fuelType: selectedCar.details.fuel,
        vehicleEngine: selectedCar.details.engine,
        modelDate: selectedCar.details.year,
        color: selectedCar.details.color,
        offers: {
          "@type": "Offer",
          price: selectedCar.priceValue || 0,
          priceCurrency: "CZK",
          availability: "https://schema.org/InStock",
        },
      }
    : null;

  // Routování podle URL (Měsíc 2 SEO strategie)
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
  const cleanPath = pathname.replace(/^\/+|\/+$/g, "");

  if (!isAdminMode) {
    // SEO landing pages – vlastní URL cílené na konkrétní klíčová slova
    if (LANDING_PAGES[cleanPath]) {
      return <Suspense fallback={<PageLoader />}><LandingPage config={LANDING_PAGES[cleanPath]} /></Suspense>;
    }
    // Doplňkové služby – samostatné stránky a samostatný sklad
    if (cleanPath.startsWith("auta-k-prodeji/")) {
      return <Suspense fallback={<PageLoader />}><SaleCarDetailPage slug={cleanPath.slice("auta-k-prodeji/".length)} /></Suspense>;
    }
    if (cleanPath === "auta-k-prodeji") {
      return <Suspense fallback={<PageLoader />}><CashCarsPage /></Suspense>;
    }
    if (cleanPath === "vykup-auta") {
      return <Suspense fallback={<PageLoader />}><BuyoutPage /></Suspense>;
    }
    if (cleanPath === "kontakt") {
      return <Suspense fallback={<PageLoader />}><ContactPage /></Suspense>;
    }
    // GDPR / ochrana osobních údajů
    if (cleanPath === "ochrana-osobnich-udaju") {
      return <Suspense fallback={<PageLoader />}><PrivacyPage /></Suspense>;
    }
    // Blog – výpis i detail článku
    if (cleanPath === "blog" || pathname.startsWith("/blog/")) {
      return <Suspense fallback={<PageLoader />}><Blog /></Suspense>;
    }
    // 404 – cokoli, co není homepage ani detail vozu
    const isKnownRoute = cleanPath === "" || pathname.startsWith("/auto/");
    if (!isKnownRoute) {
      return <Suspense fallback={<PageLoader />}><NotFound /></Suspense>;
    }
  }

  const detailTerms = selectedCar ? installmentTerms(selectedCar) : null;

  return (
    <div className="min-h-screen bg-paper text-ink selection:bg-brand selection:text-ink">
      <Helmet>
        <title>{selectedCar ? selectedCar.seo?.title || `${selectedCar.name} na splátky | AUFIN AUTO` : HOME_TITLE}</title>
        <meta
          name="description"
          content={selectedCar ? selectedCar.seo?.description || selectedCar.description.substring(0, 160) : HOME_DESCRIPTION}
        />
        <link
          rel="canonical"
          href={selectedCar ? `https://www.aufinauto.cz/auto/${selectedCar.seo?.slug || generateSlug(selectedCar.name)}` : "https://www.aufinauto.cz/"}
        />

        {/* Open Graph */}
        <meta property="og:title" content={selectedCar ? selectedCar.seo?.title || selectedCar.name : "AUFIN AUTO - Auta na splátky bez registru"} />
        <meta
          property="og:description"
          content={selectedCar ? selectedCar.seo?.description || selectedCar.description.substring(0, 160) : "Pronájem vozů s možností odkupu. Bez doložení příjmů a bez nahlížení do registrů."}
        />
        <meta property="og:image" content={selectedCar?.image || "https://aufinauto.cz/og-image.jpg"} />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="website" />

        {/* Schema.org Structured Data */}
        <script type="application/ld+json">{JSON.stringify(schemaOrgData)}</script>
        <script type="application/ld+json">{JSON.stringify(carListSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        {selectedCarSchema && <script type="application/ld+json">{JSON.stringify(selectedCarSchema)}</script>}
        {breadcrumbSchema && <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>}
      </Helmet>

      <SiteHeader active="splatky" />

      <main>
        {/* Úvod */}
        <section className="relative overflow-hidden bg-sand">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-20 grid lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-14 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="inline-block px-3 py-1 rounded-full bg-brand-soft text-brand-deep text-xs font-bold tracking-wider uppercase mb-5">
                Pronájem s možností odkupu
              </span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.05] mb-5">
                Auta na splátky <span className="text-brand-deep">bez registru a příjmů</span>
              </h1>
              <p className="text-lg text-ink/75 max-w-xl mb-6 leading-relaxed">
                Vyberte si auto a odjeďte bez kontroly registrů a dokládání příjmů. Vyřízení zvládneme do 30 minut.
              </p>

              <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5 mb-8 text-[15px]">
                {[
                  "Bez kontroly registrů",
                  "Bez dokládání příjmů",
                  "Vyřízení do 30 minut",
                  "Možnost odkupu vozidla",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-brand-deep shrink-0" /> {t}
                  </li>
                ))}
              </ul>

              <a href="#nabidka-aut" className="btn-primary w-full sm:w-auto text-lg px-8">
                Prohlédnout auta na splátky <ChevronRight className="w-5 h-5" />
              </a>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink/70">
                <a href="/auta-k-prodeji" className="inline-flex items-center gap-1 whitespace-nowrap hover:text-brand-deep underline-offset-4 hover:underline">
                  Chcete koupit auto rovnou? <strong className="text-ink">Auta k prodeji</strong> <ArrowRight className="w-4 h-4" />
                </a>
                <a href="/vykup-auta" className="inline-flex items-center gap-1 whitespace-nowrap hover:text-brand-deep underline-offset-4 hover:underline">
                  Chcete prodat své auto? <strong className="text-ink">Výkup vozů</strong> <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </motion.div>

            <div className="relative">
              <img
                src="/hero.png"
                alt="Auto na splátky bez registru – AUFIN AUTO Praha"
                fetchPriority="high"
                loading="eager"
                decoding="async"
                className="w-full aspect-[4/3] object-cover rounded-3xl shadow-xl"
              />
            </div>
          </div>
        </section>

        {/* Aktuální auta na splátky */}
        <section id="nabidka-aut" className="py-16 md:py-24 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div>
                <span className="text-brand-deep font-bold tracking-wider text-sm uppercase mb-2 block">Aktuální nabídka</span>
                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">Nabídka aut</h2>
              </div>
              <p className="text-ink/70 max-w-md">
                Vyberte si auto, které vám vyhovuje.<br className="hidden sm:block" /> Jednoduché vyřízení a můžete odjet ještě dnes.
              </p>
            </div>

            {/* Filtry */}
            <div className="mb-8 p-4 sm:p-5 bg-sand rounded-2xl border border-line grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-4 sm:gap-6 items-end">
              <div>
                <label htmlFor="filter-brand" className="field-label">Značka</label>
                <select
                  id="filter-brand"
                  value={filters.brand}
                  onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
                  className="field"
                >
                  <option value="">Všechny značky</option>
                  {brands.map((brand) => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="filter-price" className="field-label">Nájemné do {filters.maxPrice.toLocaleString("cs-CZ")} Kč / měsíc</label>
                <input
                  id="filter-price"
                  type="range"
                  min="1000"
                  max="12000"
                  step="500"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: parseInt(e.target.value) })}
                  className="w-full accent-brand h-11"
                />
              </div>
              <button onClick={() => setFilters({ brand: "", maxPrice: 12000 })} className="btn-secondary py-3">
                Resetovat
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
              {carsLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-2xl overflow-hidden bg-sand animate-pulse">
                      <div className="h-48 bg-line/60" />
                      <div className="p-5 space-y-3">
                        <div className="h-4 bg-line rounded w-3/4" />
                        <div className="h-3 bg-line rounded w-1/2" />
                        <div className="h-8 bg-line rounded mt-4" />
                      </div>
                    </div>
                  ))
                : (showAllCars ? filteredCars : filteredCars.slice(0, carLimit)).map((car, i) => {
                    const t = installmentTerms(car);
                    return (
                      <motion.article
                        key={car.id}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: Math.min(i, 6) * 0.06 }}
                        className={`group bg-card rounded-2xl overflow-hidden border border-line flex flex-col transition-shadow ${
                          car.isComingSoon ? "opacity-60" : "hover:shadow-lg"
                        }`}
                      >
                        <button
                          type="button"
                          disabled={car.isComingSoon}
                          onClick={() => !car.isComingSoon && openCarDetail(car)}
                          className="text-left flex flex-col flex-1 disabled:cursor-default"
                          aria-label={`Detail vozu ${car.name}`}
                        >
                          <div className="relative aspect-[4/3] overflow-hidden bg-sand">
                            <img
                              src={car.image}
                              alt={`${car.name} – auto na splátky bez registru, ${car.details?.year}`}
                              width={640}
                              height={480}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              referrerPolicy="no-referrer"
                            />
                            {car.isComingSoon && (
                              <span className="absolute top-3 left-3 px-3 py-1 bg-night text-white text-xs font-bold uppercase tracking-wider rounded-full">
                                Již brzy
                              </span>
                            )}
                          </div>
                          <div className="p-5 flex flex-col flex-1">
                            <h3 className="text-lg font-bold leading-snug">{car.name}</h3>
                            <div className="text-sm text-ink/60 mb-4">
                              {[car.brand, car.details?.year, car.details?.color].filter(Boolean).join(" · ")}
                            </div>
                            <div className="mt-auto pt-4 border-t border-line">
                              <div className="text-xs text-ink/60">měsíčně od</div>
                              <div className="text-2xl font-extrabold">{t.monthly ? formatCzk(t.monthly) : "—"}</div>
                            </div>
                            {!car.isComingSoon && (
                              <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-brand-deep">
                                Podmínky a detail <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                              </span>
                            )}
                          </div>
                        </button>
                      </motion.article>
                    );
                  })}
            </div>

            {!carsLoading && filteredCars.length > carLimit && (
              <div className="mt-8 text-center">
                <button
                  type="button"
                  aria-expanded={showAllCars}
                  onClick={() => {
                    if (showAllCars) {
                      // Po sbalení vrátit pohled na začátek nabídky, ať uživatel nezůstane „pod“ ní.
                      document.getElementById("nabidka-aut")?.scrollIntoView({ behavior: "smooth" });
                    }
                    setShowAllCars(!showAllCars);
                  }}
                  className="btn-secondary"
                >
                  {showAllCars ? (
                    <>Zobrazit méně <ChevronRight className="w-5 h-5 -rotate-90" /></>
                  ) : (
                    <>Zobrazit vše ({filteredCars.length}) <ChevronRight className="w-5 h-5 rotate-90" /></>
                  )}
                </button>
              </div>
            )}

            {!carsLoading && filteredCars.length === 0 && (
              <div className="text-center py-12 px-6 bg-sand rounded-2xl border border-line">
                <p className="text-lg font-semibold mb-2">
                  {publicCars.length
                    ? "Filtru neodpovídá žádný vůz."
                    : carsError
                      ? "Nabídku vozů se teď nepodařilo načíst."
                      : "Nabídku vozů právě aktualizujeme."}
                </p>
                <p className="text-ink/70 mb-5">
                  {carsError && !publicCars.length
                    ? `Zkuste stránku obnovit později, nebo nám zavolejte na ${PHONE_DISPLAY} – aktuální vozy vám řekneme.`
                    : "Napište nám, jaké auto hledáte – ozveme se s aktuální nabídkou."}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {publicCars.length > 0 && (
                    <button onClick={() => setFilters({ brand: "", maxPrice: 12000 })} className="btn-secondary">Zrušit filtr</button>
                  )}
                  <a href="#formular" className="btn-primary">Poslat poptávku</a>
                </div>
              </div>
            )}

            {/* Doplňkové služby – menší bloky */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
              <a href="/auta-k-prodeji" className="group flex items-start gap-4 p-5 rounded-2xl border border-line hover:border-ink/30 bg-card transition-colors">
                <div className="w-11 h-11 rounded-xl bg-sand flex items-center justify-center shrink-0">
                  <Banknote className="w-5 h-5 text-brand-deep" />
                </div>
                <div className="flex-1">
                  <div className="font-bold mb-0.5">Auta k prodeji</div>
                  <p className="text-sm text-ink/70">Prohlédněte si vozy dostupné ke klasickému prodeji.</p>
                </div>
                <ChevronRight className="w-5 h-5 text-ink/40 group-hover:text-brand-deep self-center" />
              </a>
              <a href="/vykup-auta" className="group flex items-start gap-4 p-5 rounded-2xl border border-line hover:border-ink/30 bg-card transition-colors">
                <div className="w-11 h-11 rounded-xl bg-sand flex items-center justify-center shrink-0">
                  <HandCoins className="w-5 h-5 text-brand-deep" />
                </div>
                <div className="flex-1">
                  <div className="font-bold mb-0.5">Výkup auta</div>
                  <p className="text-sm text-ink/70">Chcete prodat svůj vůz? Pošlete nám základní údaje a připravíme nabídku.</p>
                </div>
                <ChevronRight className="w-5 h-5 text-ink/40 group-hover:text-brand-deep self-center" />
              </a>
            </div>
          </div>
        </section>

        {/* Jak to funguje */}
        <section id="jak-to-funguje" className="py-16 md:py-24 bg-sand px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-brand-deep font-bold tracking-wider text-sm uppercase mb-2 block">Jednoduchý proces</span>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">Jak to funguje?</h2>
            </div>

            <ol className="relative grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 mb-16">
              {/* Spojovací linka mezi kroky (desktop) */}
              <div aria-hidden="true" className="hidden md:block absolute top-10 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-line to-transparent" />
              {steps.map((step, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="relative flex flex-col items-center text-center group"
                >
                  <div className="w-20 h-20 rounded-2xl bg-card border border-line flex items-center justify-center mb-6 shadow-[0_0_28px_rgba(255,102,0,0.18)] group-hover:border-brand transition-colors">
                    {step.icon}
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold mb-3">{step.title}</h3>
                  <p className="text-ink/70 leading-relaxed max-w-xs">{step.description}</p>
                  <span className="mt-4 font-mono text-sm text-brand-deep/60">0{i + 1}</span>
                </motion.li>
              ))}
            </ol>


            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-card p-6 md:p-8 rounded-2xl border border-line flex gap-4 items-start">
                <ShieldCheck className="text-brand-deep w-7 h-7 shrink-0" />
                <div>
                  <h3 className="text-lg font-bold mb-1">Bez nahlížení do registrů</h3>
                  <p className="text-ink/70">Měli jste v minulosti problémy se splácením? U nás to není překážka. Posuzujeme každého individuálně.</p>
                </div>
              </div>
              <div className="bg-card p-6 md:p-8 rounded-2xl border border-line flex gap-4 items-start">
                <CheckCircle2 className="text-brand-deep w-7 h-7 shrink-0" />
                <div>
                  <h3 className="text-lg font-bold mb-1">Bez doložení příjmů</h3>
                  <p className="text-ink/70">Nepožadujeme potvrzení od zaměstnavatele ani daňová přiznání. Stačí nám vaše čestné prohlášení.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Formulář */}
        <section id="formular" className="py-16 md:py-24 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-8 lg:gap-12 lg:items-center">
            <div>
              <span className="text-brand-deep font-bold tracking-wider text-sm uppercase mb-2 block">Kontaktujte nás</span>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">Získejte auto ještě dnes!</h2>
              <p className="text-ink/70 text-lg mb-8">
                Vyplňte krátký formulář a ozveme se vám do 30 minut s nezávaznou nabídkou.
              </p>

              <ContactCards waText="Dobrý den, mám zájem o auto na splátky od AUFIN AUTO." trackLabel="contact_section" />
            </div>

            <div className="bg-card rounded-3xl border border-line p-5 sm:p-8 shadow-sm">
              {submitted ? (
                <SubmitSuccess preview={submitted.preview} onReset={() => setSubmitted(null)}>
                  Děkujeme za váš zájem. Ozveme se vám zpět do 30 minut.
                </SubmitSuccess>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="f-name" className="field-label">Jméno a příjmení</label>
                      <input id="f-name" type="text" required autoComplete="name" value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Jan Novák" className="field" />
                    </div>
                    <div>
                      <label htmlFor="f-phone" className="field-label">Telefon</label>
                      <input id="f-phone" type="tel" required autoComplete="tel" value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+420 123 456 789" className="field" />
                    </div>
                    <div>
                      <label htmlFor="f-email" className="field-label">E-mail</label>
                      <input id="f-email" type="email" required autoComplete="email" value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="jan.novak@email.cz" className="field" />
                    </div>
                    <div>
                      <label htmlFor="f-car" className="field-label">Mám zájem o vůz</label>
                      <select id="f-car" value={formData.car}
                        onChange={(e) => setFormData({ ...formData, car: e.target.value })}
                        className="field">
                        <option value="">Vyberte model (volitelné)</option>
                        {cars.filter((car) => !car.isComingSoon && car.isVisible !== false).map((car) => (
                          <option key={car.id} value={car.name}>{car.name}</option>
                        ))}
                        <option value="other">Jiný model / individuální poptávka</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="f-message" className="field-label">Zpráva <span className="font-normal text-ink/50">(volitelné)</span></label>
                    <textarea id="f-message" rows={4} value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Mám zájem o více informací ohledně…" className="field resize-none" />
                  </div>

                  <ConsentCheckbox id="privacy" />

                  <button type="submit" disabled={isSubmitting} className="btn-primary w-full text-lg">
                    {isSubmitting ? (
                      <span className="w-6 h-6 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
                    ) : (
                      <>Odeslat poptávku <ChevronRight className="w-5 h-5" /></>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="caste-dotazy" className="py-16 md:py-24 bg-sand px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <span className="text-brand-deep font-bold tracking-wider text-sm uppercase mb-2 block">Časté dotazy</span>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">Auta na splátky – odpovědi</h2>
            </div>

            <div className="space-y-3">
              {homepageFaqs.map((faq, i) => (
                <div key={i} className="bg-card rounded-2xl border border-line overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                    className="w-full flex items-center justify-between gap-4 p-5 text-left"
                  >
                    <span className="font-bold text-[17px]">{faq.q}</span>
                    <Plus className={`w-5 h-5 text-brand-deep shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-45" : ""}`} />
                  </button>
                  {openFaq === i && <div className="px-5 pb-5 text-ink/75 leading-relaxed">{faq.a}</div>}
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <a href="#formular" className="btn-primary">
                Mám dotaz – kontaktujte mě <ChevronRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter onAdmin={() => toggleAdminMode(true)} />

      {isAdminMode && (
        <Suspense fallback={<PageLoader />}>
          <AdminDashboard onClose={() => toggleAdminMode(false)} />
        </Suspense>
      )}

      {/* Detail vozu */}
      {selectedCar && detailTerms && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="car-detail-title">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-night/70 backdrop-blur-sm" onClick={closeCarDetail} />
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative w-full max-w-5xl bg-card rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[92dvh] overflow-y-auto"
          >
            <button
              onClick={closeCarDetail}
              aria-label="Zavřít detail"
              className="absolute top-4 right-4 z-10 w-11 h-11 rounded-full bg-card/90 shadow flex items-center justify-center hover:bg-brand transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col lg:flex-row">
              <div className="lg:w-1/2">
                <button type="button" className="block w-full aspect-[4/3] relative group" onClick={() => setActiveImageIndex(0)} aria-label="Zobrazit fotky">
                  <img src={selectedCar.image} alt={selectedCar.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <span className="absolute bottom-3 left-3 bg-card/95 text-ink px-3 py-1.5 rounded-full font-semibold text-sm flex items-center gap-2 shadow">
                    <Palette className="w-4 h-4" /> Fotky ({allImages.length})
                  </span>
                </button>
                {selectedCar.gallery && selectedCar.gallery.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 p-3">
                    {selectedCar.gallery.slice(0, 4).map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="aspect-video rounded-lg overflow-hidden relative hover:opacity-80 transition-opacity"
                        onClick={() => setActiveImageIndex(idx + 1)}
                        aria-label={`Fotka ${idx + 2}`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        {idx === 3 && selectedCar.gallery.length > 4 && (
                          <span className="absolute inset-0 bg-night/70 text-white flex items-center justify-center text-xs font-bold">
                            +{selectedCar.gallery.length - 4}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="lg:w-1/2 p-5 sm:p-8">
                <h2 id="car-detail-title" className="text-2xl md:text-3xl font-extrabold mb-6 pr-10">{selectedCar.name}</h2>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  {[
                    { icon: Fuel, label: "Palivo", value: selectedCar.details.fuel },
                    { icon: Info, label: "Motor", value: selectedCar.details.engine },
                    { icon: Zap, label: "Výkon", value: selectedCar.details.power },
                    { icon: Settings, label: "Převodovka", value: selectedCar.details.transmission },
                    { icon: Calendar, label: "Rok", value: selectedCar.details.year },
                    { icon: Palette, label: "Barva", value: selectedCar.details.color },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sand flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-brand-deep" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-ink/60">{label}</div>
                        <div className="text-sm font-bold">{value || "—"}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mb-8">
                  <h3 className="flex items-center gap-2 font-bold mb-2">
                    <ListChecks className="w-4 h-4 text-brand-deep" /> Výhody a výbava
                  </h3>
                  <div className="text-ink/75 text-[15px] leading-relaxed whitespace-pre-line">
                    {selectedCar.equipment?.trim() || "Podrobnosti o výbavě vám rádi sdělíme telefonicky nebo e-mailem."}
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="flex items-center gap-2 font-bold mb-2">
                    <FileText className="w-4 h-4 text-brand-deep" /> Popis vozu
                  </h3>
                  <p className="text-ink/75 text-[15px] leading-relaxed whitespace-pre-line">
                    {selectedCar.description?.trim() || "Popis vozu připravujeme. Pro více informací nás kontaktujte."}
                  </p>
                </div>

                {/* Cena */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-line bg-sand p-5">
                    <div className="text-sm text-ink/60 mb-1">Měsíční nájemné</div>
                    <div className="text-2xl font-extrabold whitespace-nowrap">
                      {detailTerms.monthly ? `od ${formatCzk(detailTerms.monthly)}` : "Na dotaz"}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-brand/40 bg-brand-soft p-5">
                    <div className="text-sm text-brand-deep font-semibold mb-1">Při převzetí vozidla</div>
                    <div className="text-2xl font-extrabold whitespace-nowrap">
                      {detailTerms.pickup ? formatCzk(detailTerms.pickup) : "Na dotaz"}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-ink/50 mt-2 mb-6">Cena nezahrnuje pojištění.</p>

                <button
                  onClick={() => {
                    (window as any).gtag?.("event", "click_car_inquiry", { event_category: "lead", event_label: selectedCar.name });
                    handleCarInquiry(selectedCar.name);
                  }}
                  className="btn-primary w-full text-lg"
                >
                  Mám zájem o tento vůz
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Lightbox */}
      {activeImageIndex !== null && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95" role="dialog" aria-modal="true" aria-label="Fotogalerie">
          <button
            onClick={() => setActiveImageIndex(null)}
            aria-label="Zavřít galerii"
            className="absolute top-4 right-4 z-10 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white hover:text-black transition-all"
          >
            <X className="w-6 h-6" />
          </button>
          <button
            onClick={prevImage}
            aria-label="Předchozí fotka"
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-brand hover:text-on-brand transition-all"
          >
            <ChevronRight className="w-7 h-7 rotate-180" />
          </button>
          <button
            onClick={nextImage}
            aria-label="Další fotka"
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-brand hover:text-on-brand transition-all"
          >
            <ChevronRight className="w-7 h-7" />
          </button>

          <div className="max-w-7xl max-h-[80vh] px-4 sm:px-20">
            <motion.img
              key={activeImageIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              src={allImages[activeImageIndex]}
              alt=""
              className="w-full h-full max-h-[80vh] object-contain rounded-xl"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/70 font-mono">
              {activeImageIndex + 1} / {allImages.length}
            </div>
          </div>
        </div>
      )}

      <WhatsAppButton />
    </div>
  );
}
