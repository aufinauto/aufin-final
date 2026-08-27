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
  Clock, 
  FileText, 
  Phone, 
  Mail, 
  MapPin, 
  ChevronRight, 
  ShieldCheck,
  Zap,
  Star,
  Key,
  X,
  Info,
  Calendar,
  Fuel,
  Settings,
  Palette,
  ListChecks,
  ChevronLeft
} from "lucide-react";
import React, { useState, useEffect, lazy, Suspense } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './lib/firebase';
import emailjs from '@emailjs/browser';
import { Car as CarType } from './types';
import { faqs } from "./faqs";
import { LANDING_PAGES } from "./landingConfig";

// Code-splitting: tyto části se stáhnou až když jsou skutečně potřeba.
const AdminDashboard = lazy(() => import("./components/AdminDashboard"));
const LandingPage = lazy(() => import("./components/LandingPage"));
const PrivacyPage = lazy(() => import("./components/PrivacyPage"));
const NotFound = lazy(() => import("./components/NotFound"));
const Blog = lazy(() => import("./components/Blog"));

const PageLoader = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="w-10 h-10 border-2 border-white/10 border-t-gold rounded-full animate-spin" />
  </div>
);

const STATIC_CARS: CarType[] = [
  {
    id: "1",
    name: "ŠKODA Fabia II",
    brand: "Škoda",
    pickupPrice: 24000,
    priceValue: 5500,
    price: "od 5 500 Kč / měsíc",
    image: "https://lh3.googleusercontent.com/d/1u9bhM8Tt8vukokViy3HH_zTs58yGb5eu",
    description: "Kompaktní a spolehlivý vůz ideální pro každodenní ježdění. Nízké provozní náklady a snadné parkování. Vůz je ve velmi dobrém stavu.",
    details: {
      fuel: "Benzín",
      engine: "1.2 TSI",
      power: "63 kW",
      transmission: "Manuální 5st.",
      year: "2011",
      color: "Světle modrá"
    },
    equipment: "✔ obuto na letních pneumatikách\n✔ bez nutnosti dalších investic\n✔ po čerstvém servisu\n✔ nízké provozní náklady\n✔ velmi dobrá spotřeba",
    gallery: [
      "https://lh3.googleusercontent.com/d/180EKXfFFX2GKr183hiuhv3BBvE6KyFOM",
      "https://lh3.googleusercontent.com/d/1_Q_iaTK3e6y75CfhOOxSwPpGuoNYwo0E",
      "https://lh3.googleusercontent.com/d/1dxCv567-twigjaD7p4XIj0unx4dQvdu4",
      "https://lh3.googleusercontent.com/d/1CijnUMJ4mJAPvPbOJ7uZmsEZtOVEE0tt",
      "https://lh3.googleusercontent.com/d/1o8LvB28hdsDExe0iRbi6QmIgIYwnTq4Q",
      "https://lh3.googleusercontent.com/d/1gJRg9WZQL4YSrD626XpkSW0mXNY3XRKR",
      "https://lh3.googleusercontent.com/d/1IOB_RdCVwCfPUEZcHixFCTjp2T0x25u_",
      "https://lh3.googleusercontent.com/d/15dTmqEDYlnbqzjC6yhtMReCIFxEa5sSS",
      "https://lh3.googleusercontent.com/d/15-Nz-5XOjw87gsQVrwt6jpFjPydNAKX-"
    ]
  },
  {
    id: "2",
    name: "ŠKODA Fabia III STYLE",
    brand: "Škoda",
    pickupPrice: 36000,
    priceValue: 7600,
    price: "od 7 600 Kč / měsíc",
    image: "https://lh3.googleusercontent.com/d/1oPz8ej-z5UR_w6qGc_ziXCqqMNXRNy_z",
    description: "✔ vozidlo po servisu\n✔ připraveno k okamžitému používání\n✔ výbava style",
    details: {
      fuel: "Nafta",
      engine: "1.4 TDI",
      power: "77 kW",
      transmission: "Manuální 5st.",
      year: "2015",
      color: "Bílá"
    },
    equipment: "vyhřívané sedačky, vyhřívané přední a zadní okno, Apple CarPlay, Android Auto, Bluetooth, navigace, el. okna, el. zrcátka, klimatizace, autorádio, palubní počítač, posilovač řízení, ABS, centrální zamykání, ISOFIX",
    gallery: [
      "https://lh3.googleusercontent.com/d/1kFs6IO28ZZmnq-XyGyHsF2w5IMqUW4Hv",
      "https://lh3.googleusercontent.com/d/1VMI_tAkTj72VpbT_lGyVS0PZu8w4_DOy",
      "https://lh3.googleusercontent.com/d/11Fg2ZfeeSo7qhAtPHnCSvJ3kBu4iIiYy",
      "https://lh3.googleusercontent.com/d/1rZsi6jSR8I5D4HrJJ3EeFC5_-liwChYa",
      "https://lh3.googleusercontent.com/d/1mKMwrUgH0DUQv1Vd4-fsl-7Enj-1gILX",
      "https://lh3.googleusercontent.com/d/1X-tYbhu9YZm_DKkcATP0rkgKD_0EaPt2",
      "https://lh3.googleusercontent.com/d/1yXyrFwAPozxFO8Kuwv5tKpAMYmfjWRqy",
      "https://lh3.googleusercontent.com/d/1aM55TlwmnpM9C1QMh3uuvomQ3K2pFLZ5",
      "https://lh3.googleusercontent.com/d/1IA2-9bCbrZT7Ek916b6cf9Zf4faOkbZI"
    ]
  }
];

const steps = [
  {
    icon: <CarIcon className="w-8 h-8 text-gold" />,
    title: "Vyberte si vůz",
    description: "Zvolte si auto z naší nabídky dostupných vozů, které máme skladem."
  },
  {
    icon: <FileText className="w-8 h-8 text-gold" />,
    title: "Schválení do 30 min",
    description: "Nekontrolujeme registry ani doložení příjmů. Stačí vám dva doklady."
  },
  {
    icon: <Zap className="w-8 h-8 text-gold" />,
    title: "Odjíždíte ihned",
    description: "Po podpisu smlouvy odjíždíte ve voze."
  }
];

export default function App() {
  const [cars, setCars] = useState<CarType[]>([]);
  const [carsLoading, setCarsLoading] = useState(true);
  const [isAdminMode, setIsAdminMode] = useState(() => {
    return sessionStorage.getItem('isAdminMode') === 'true';
  });

  const toggleAdminMode = (val: boolean) => {
    setIsAdminMode(val);
    if (val) {
      sessionStorage.setItem('isAdminMode', 'true');
    } else {
      sessionStorage.removeItem('isAdminMode');
    }
  };
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    car: "",
    message: ""
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [filters, setFilters] = useState({
    brand: "",
    maxPrice: 12000
  });

  const [selectedCar, setSelectedCar] = useState<CarType | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Deep linking: check URL on load
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      if (path.startsWith('/auto/')) {
        const slug = path.split('/auto/')[1];
        const car = cars.find(c => c.seo?.slug === slug || generateSlug(c.name) === slug);
        if (car && car.isVisible !== false) {
          setSelectedCar(car);
        }
      } else if (path === '/' || path === '') {
        setSelectedCar(null);
      }
    };

    if (!carsLoading) {
      handleLocationChange();
    }
    
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, [cars, carsLoading]);

  // Sync URL with selected car
  useEffect(() => {
    if (selectedCar) {
      const slug = selectedCar.seo?.slug || generateSlug(selectedCar.name);
      const newPath = `/auto/${slug}`;
      if (window.location.pathname !== newPath) {
        window.history.pushState({ carId: selectedCar.id }, selectedCar.name, newPath);
      }
    } else {
      // Reset URL pouze pokud jsme na detailu vozu – landing pages /auta-* necháváme být.
      if (window.location.pathname.startsWith('/auto/') && !isAdminMode) {
        window.history.pushState({}, 'AUFIN AUTO', '/');
      }
    }
  }, [selectedCar, isAdminMode]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  useEffect(() => {
    const q = query(collection(db, 'cars'), orderBy('priceValue', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setCars(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CarType)));
      }
      setCarsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedCar || activeImageIndex !== null || isAdminMode) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [selectedCar, activeImageIndex]);

  const filteredCars = cars.filter(car => {
    // Hidden cars are strictly excluded from the frontend listing
    if (car.isVisible === false) return false;
    
    const matchesBrand = filters.brand === "" || car.brand === filters.brand;
    
    // Get numeric monthly price for filtering - preferring the value shown in the "price" string
    const carPriceMatch = car.price?.replace(/\s/g, '').match(/\d+/);
    const carMonthlyPrice = carPriceMatch ? parseInt(carPriceMatch[0]) : (Number(car.priceValue) || 0);
    
    // STRICT FILTERING: Hide anything above the maxPrice selected
    const matchesPrice = carMonthlyPrice <= filters.maxPrice;

    return matchesBrand && matchesPrice;
  });

  const publicCars = cars.filter(c => c.isVisible !== false);
  const brands = Array.from(new Set(publicCars.map(c => c.brand).filter(b => b !== "")));
  
  // Calculate price limits based on actual visible cars
  const prices = publicCars.map(c => {
    const match = c.price?.replace(/\s/g, '').match(/\d+/);
    return match ? parseInt(match[0]) : (Number(c.priceValue) || 0);
  });
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPriceLimit = prices.length > 0 ? Math.max(...prices) : 50000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Uložit poptávku do Firebase
      await addDoc(collection(db, 'inquiries'), {
        ...formData,
        createdAt: serverTimestamp()
      });

      // 2. Odeslat e-mail přes EmailJS
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          from_name: formData.name,
          from_email: formData.email || "(nevyplněn)",
          phone: formData.phone,
          car: formData.car && formData.car !== "other"
            ? formData.car
            : "Nespecifikováno / individuální",
          message: formData.message || "(bez zprávy)",
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );

      // 3. Úspěch — oba kroky prošly
      (window as any).gtag?.('event', 'form_submit', { event_category: 'lead', event_label: formData.car || 'unspecified' });
      setIsSubmitted(true);
      setFormData({ name: "", email: "", phone: "", car: "", message: "" });
      setTimeout(() => setIsSubmitted(false), 5000);
    } catch (error) {
      console.error("Chyba při odesílání poptávky:", error);
      alert("Omlouváme se, poptávku se nepodařilo odeslat. Prosím kontaktujte nás přímo na +420 731 562 211 nebo aufin.auto@gmail.com.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCarDetail = (car: typeof cars[0]) => {
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
    const element = document.getElementById('formular');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const schemaOrgData = {
    "@context": "https://schema.org",
    "@type": "AutoRental",
    "name": "AUFIN AUTO",
    "image": "https://aufinauto.cz/og-image.jpg",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Humpolecká 1886/26, Krč",
      "addressLocality": "Praha",
      "postalCode": "140 00",
      "addressCountry": "CZ"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 50.0401,
      "longitude": 14.4447
    },
    "url": "https://www.aufinauto.cz",
    "telephone": "+420731562211",
    "priceRange": "$$$",
    "description": "Auta na splátky po celé ČR. Specialista na vozy bez registru a bez doložení příjmů. Působíme v Praze."
  };

  const carListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": filteredCars.map((car, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `https://www.aufinauto.cz/auto/${car.seo?.slug || generateSlug(car.name)}`,
      "name": car.name,
      "image": car.image
    }))
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a }
    }))
  };

  const breadcrumbSchema = selectedCar ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Domů", "item": "https://www.aufinauto.cz" },
      { "@type": "ListItem", "position": 2, "name": "Nabídka aut", "item": "https://www.aufinauto.cz/#nabidka-aut" },
      {
        "@type": "ListItem", "position": 3, "name": selectedCar.name,
        "item": `https://www.aufinauto.cz/auto/${selectedCar.seo?.slug || generateSlug(selectedCar.name)}`
      }
    ]
  } : null;

  const selectedCarSchema = selectedCar ? {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    "name": selectedCar.name,
    "brand": selectedCar.brand,
    "image": selectedCar.image,
    "description": selectedCar.description,
    "fuelType": selectedCar.details.fuel,
    "vehicleEngine": selectedCar.details.engine,
    "modelDate": selectedCar.details.year,
    "color": selectedCar.details.color,
    "offers": {
      "@type": "Offer",
      "price": selectedCar.priceValue || 0,
      "priceCurrency": "CZK",
      "availability": "https://schema.org/InStock"
    }
  } : null;

  // Routování podle URL (Měsíc 2 SEO strategie)
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const cleanPath = pathname.replace(/^\/+|\/+$/g, '');

  if (!isAdminMode) {
    // SEO landing pages – vlastní URL cílené na konkrétní klíčová slova
    if (LANDING_PAGES[cleanPath]) {
      return <Suspense fallback={<PageLoader />}><LandingPage config={LANDING_PAGES[cleanPath]} /></Suspense>;
    }
    // GDPR / ochrana osobních údajů
    if (cleanPath === 'ochrana-osobnich-udaju') {
      return <Suspense fallback={<PageLoader />}><PrivacyPage /></Suspense>;
    }
    // Blog – výpis i detail článku
    if (cleanPath === 'blog' || pathname.startsWith('/blog/')) {
      return <Suspense fallback={<PageLoader />}><Blog /></Suspense>;
    }
    // 404 – cokoli, co není homepage ani detail vozu
    const isKnownRoute = cleanPath === '' || pathname.startsWith('/auto/');
    if (!isKnownRoute) {
      return <Suspense fallback={<PageLoader />}><NotFound /></Suspense>;
    }
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-gold selection:text-black">
      <Helmet>
        <title>{selectedCar ? (selectedCar.seo?.title || `${selectedCar.name} na splátky | AUFIN AUTO`) : "Auta na splátky bez registru Praha | AUFIN AUTO"}</title>
        <meta name="description" content={selectedCar ? (selectedCar.seo?.description || selectedCar.description.substring(0, 160)) : "Hledáte auto na splátky? Nabízíme vozy bez registru a bez doložení příjmů. Snadné a rychlé vyřízení v Praze. Odjeďte vozem ještě dnes!"} />
        <link rel="canonical" href={selectedCar ? `https://www.aufinauto.cz/auto/${selectedCar.seo?.slug || generateSlug(selectedCar.name)}` : "https://www.aufinauto.cz"} />
        
        {/* Open Graph */}
        <meta property="og:title" content={selectedCar ? (selectedCar.seo?.title || selectedCar.name) : "AUFIN AUTO - Auta na splátky bez registru"} />
        <meta property="og:description" content={selectedCar ? (selectedCar.seo?.description || selectedCar.description.substring(0, 160)) : "Profesionální pronájem vozů s opcí odkupu. Bez doložení příjmů a registrů."} />
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
      {/* Navigation */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-50">
        <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[32px] px-4 md:px-8 h-16 md:h-20 flex items-center justify-between shadow-2xl shadow-gold/10 transition-all duration-500">
          <a href="#" className="flex items-center group relative h-full -translate-y-1">
            <svg viewBox="0 0 300 120" className="w-24 md:w-32 h-auto group-hover:scale-105 transition-transform duration-500">
              {/* Car silhouette curve */}
              <path 
                d="M50 45 Q 150 5, 250 45" 
                fill="none" 
                stroke="white" 
                strokeWidth="3.5" 
                strokeLinecap="round" 
                className="opacity-90"
              />
              {/* AUFIN - A is orange caret */}
              <g transform="translate(-10, 95)">
                <path 
                  d="M60 0 L85-40 L110 0" 
                  fill="none" 
                  stroke="#FF6600" 
                  strokeWidth="12" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
                <text 
                  x="120" 
                  y="0" 
                  fill="white" 
                  fontSize="55" 
                  fontWeight="900" 
                  fontFamily="sans-serif"
                  style={{ letterSpacing: '4px' }}
                >UFIN</text>
              </g>
              {/* AUTO with dashes */}
              <g transform="translate(0, 115)">
                <line x1="85" y1="-7" x2="115" y2="-7" stroke="#FF6600" strokeWidth="3" strokeLinecap="round" />
                <text 
                  x="150" 
                  y="0" 
                  fill="white" 
                  fontSize="22" 
                  fontWeight="bold" 
                  fontFamily="sans-serif"
                  textAnchor="middle"
                  style={{ letterSpacing: '8px' }}
                >AUTO</text>
                <line x1="185" y1="-7" x2="215" y2="-7" stroke="#FF6600" strokeWidth="3" strokeLinecap="round" />
              </g>
            </svg>
            <div className="absolute inset-0 bg-gold/5 blur-3xl rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium uppercase tracking-widest text-white/70">
            <a href="#nabidka-aut" className="hover:text-gold transition-colors">Nabídka aut</a>
            <a href="#jak-to-funguje" className="hover:text-gold transition-colors">Jak to funguje</a>
            <a href="#caste-dotazy" className="hover:text-gold transition-colors">Časté dotazy</a>
            {/* Blog – dočasně skryto; odstraňte komentář pro zobrazení */}
            {/* <a href="/blog" className="hover:text-gold transition-colors">Blog</a> */}
            <a href="#formular" className="hover:text-gold transition-colors">Kontakt</a>
          </div>

          <a
            href="tel:+420731562211"
            onClick={() => (window as any).gtag?.('event', 'click_phone', { event_category: 'contact', event_label: 'navbar' })}
            className="bg-gold text-black px-6 py-2.5 rounded-full text-sm font-bold hover:bg-white transition-all duration-300"
          >
            +420 731 562 211
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-32 pb-20 md:py-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/20 z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/10 z-10" />
          <img
            src="/hero.png"
            alt="Auto na splátky bez registru – AUFIN AUTO Praha"
            fetchPriority="high"
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover scale-110 animate-slow-zoom"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-bold tracking-[0.2em] uppercase mb-6">
              Dostupné auto pro každého
            </span>
            <h1 className="text-5xl md:text-8xl font-bold tracking-tight mb-8 leading-[0.9]">
              Auta na splátky <br />
              <span className="text-gold">bez registru a příjmů</span>
            </h1>
            <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-12 font-light">
              Pronájem vozu s možností odkupu – bez doložení příjmů, bez akontace a bez nahlížení do registrů. Schválení do 30 minut, odjedete ještě dnes.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a 
                href="#nabidka-aut" 
                className="w-full sm:w-auto bg-white text-black px-10 py-4 rounded-full font-bold text-lg hover:bg-gold transition-all duration-300 flex items-center justify-center gap-2"
              >
                NABÍDKA AUT <ChevronRight className="w-5 h-5" />
              </a>
              <a 
                href="#jak-to-funguje" 
                className="w-full sm:w-auto border border-white/20 hover:border-gold px-10 py-4 rounded-full font-bold text-lg transition-all duration-300"
              >
                JAK TO FUNGUJE?
              </a>
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 animate-bounce opacity-50 hidden md:flex">
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-white rounded-full" />
          </div>
        </div>
      </section>

      {/* Nabídka aut */}
      <section id="nabidka-aut" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <span className="text-gold font-bold tracking-widest text-sm uppercase mb-4 block">Aktuální nabídka</span>
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight">Nabídka aut</h2>
            </div>
            <p className="text-white/50 max-w-md font-light">
              Všechny vozy procházejí důkladnou technickou kontrolou. Nabízíme prověřená auta za dostupné ceny.
            </p>
          </div>

          {/* Filters */}
          <div className="mb-12 p-6 bg-dark-card rounded-2xl border border-white/5 flex flex-wrap gap-6 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2 ml-1">Značka</label>
              <select 
                value={filters.brand}
                onChange={(e) => setFilters({...filters, brand: e.target.value})}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 focus:border-gold outline-none transition-colors appearance-none"
              >
                <option value="">Všechny značky</option>
                {brands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2 ml-1">Měsíčně: {filters.maxPrice.toLocaleString('cs-CZ')} Kč</label>
              <input 
                type="range" 
                min="1000" 
                max="12000" 
                step="500"
                value={filters.maxPrice}
                onChange={(e) => setFilters({...filters, maxPrice: parseInt(e.target.value)})}
                className="w-full accent-gold"
              />
            </div>
            <button 
              onClick={() => setFilters({ brand: "", maxPrice: 12000 })}
              className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-white/40 hover:text-gold transition-colors"
            >
              Resetovat
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {carsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden bg-white/5 animate-pulse">
                  <div className="h-48 bg-white/10" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-white/10 rounded w-3/4" />
                    <div className="h-3 bg-white/10 rounded w-1/2" />
                    <div className="h-8 bg-white/10 rounded mt-4" />
                  </div>
                </div>
              ))
            ) : filteredCars.map((car, i) => (
              <motion.div 
                key={car.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`group bg-dark-card rounded-2xl overflow-hidden border border-white/5 transition-all duration-500 ${car.isComingSoon ? 'opacity-50 grayscale cursor-default' : 'hover:border-gold/30 cursor-pointer'}`}
                onClick={() => !car.isComingSoon && openCarDetail(car)}
              >
                <div className="relative h-64 md:h-64 overflow-hidden bg-white/5 flex items-center justify-center">
                  {!car.image && (
                    <div className="flex flex-col items-center gap-2 opacity-20">
                      <CarIcon className="w-8 h-8" />
                      <span className="text-[10px] uppercase font-bold tracking-widest">Načítání...</span>
                    </div>
                  )}
                  <img
                    src={car.image}
                    alt={`${car.name} – auto na splátky bez registru, ${car.details?.year}`}
                    width={640}
                    height={480}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                    onLoad={(e) => (e.currentTarget.parentElement as HTMLElement).classList.remove('bg-white/5')}
                  />
                  {car.isComingSoon && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="px-4 py-2 bg-gold text-black text-[10px] font-black uppercase tracking-widest rounded-full">Již brzy</span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-1">{car.name}</h3>
                  <div className="text-[10px] uppercase tracking-widest text-white/30 font-medium mb-6">
                    {car.brand} • {car.details?.year}
                  </div>
                  
                  <div className="mt-auto pt-6 border-t border-white/10">
                    <div className="flex items-center justify-between group-hover:translate-x-1 transition-transform duration-300">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-gold tracking-widest mb-1 opacity-60 italic">měsíčně od</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black text-white tracking-tighter leading-none">
                            {parseInt(car.price.replace(/\D/g, '') || "0").toLocaleString('cs-CZ')}
                          </span>
                          <span className="text-xs font-bold text-gold/60 uppercase">Kč</span>
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-gold group-hover:text-black transition-all duration-500 border border-white/5 group-hover:border-gold">
                        <ChevronRight className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 text-center">
          </div>
        </div>
      </section>

      {/* Jak to funguje */}
      <section id="jak-to-funguje" className="py-32 bg-dark-surface relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gold/5 blur-[120px] -z-10" />
        
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <span className="text-gold font-bold tracking-widest text-sm uppercase mb-4 block">Jednoduchý proces</span>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">Jak to funguje?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2" />
            
            {steps.map((step, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative z-10 flex flex-col items-center text-center group"
              >
                <div className="w-20 h-20 rounded-2xl bg-black border border-white/10 flex items-center justify-center mb-8 group-hover:border-gold transition-colors duration-500 gold-glow">
                  {step.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                <p className="text-white/50 font-light leading-relaxed">
                  {step.description}
                </p>
                <div className="mt-6 text-gold font-mono text-sm opacity-20 group-hover:opacity-100 transition-opacity">
                  0{i + 1}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-24 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-dark-card p-10 rounded-3xl border border-white/5 flex gap-6 items-start">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="text-green-500 w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xl font-bold mb-2">Bez nahlížení do registrů</h4>
                <p className="text-white/50 font-light">Měli jste v minulosti problémy se splácením? U nás to není překážka. Posuzujeme každého individuálně.</p>
              </div>
            </div>
            <div className="bg-dark-card p-10 rounded-3xl border border-white/5 flex gap-6 items-start">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="text-blue-500 w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xl font-bold mb-2">Bez doložení příjmů</h4>
                <p className="text-white/50 font-light">Nepožadujeme potvrzení od zaměstnavatele ani daňová přiznání. Stačí nám vaše čestné prohlášení.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Formular */}
      <section id="formular" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-[40px] overflow-hidden flex flex-col lg:flex-row">
            <div className="lg:w-1/2 p-12 lg:p-20 bg-black border-r border-white/10">
              <span className="text-gold font-bold tracking-widest text-sm uppercase mb-4 block">Kontaktujte nás</span>
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-8">Získejte auto <br /> ještě dnes!</h2>
              <p className="text-white/50 mb-12 font-light text-lg">
                Vyplňte formulář a my se Vám ozveme zpět do 30 minut s nezávaznou nabídkou.
              </p>

              <div className="space-y-8">
                <a href="tel:+420731562211" target="_top" onClick={() => (window as any).gtag?.('event', 'click_phone', { event_category: 'contact', event_label: 'contact_section' })} className="flex items-center gap-4 md:gap-6 group cursor-pointer">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-gold transition-colors shrink-0">
                    <Phone className="text-white group-hover:text-black w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div>
                    <div className="text-[10px] md:text-xs uppercase tracking-widest text-white/40 mb-1">Zavolejte nám</div>
                    <div className="text-lg md:text-xl font-bold group-hover:text-gold transition-colors whitespace-nowrap">+420 731 562 211</div>
                  </div>
                </a>
                <a href="mailto:aufin.auto@gmail.com" target="_top" onClick={() => (window as any).gtag?.('event', 'click_email', { event_category: 'contact', event_label: 'contact_section' })} className="flex items-center gap-4 md:gap-6 group cursor-pointer">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-gold transition-colors shrink-0">
                    <Mail className="text-white group-hover:text-black w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div>
                    <div className="text-[10px] md:text-xs uppercase tracking-widest text-white/40 mb-1">Napište nám</div>
                    <div className="text-base md:text-xl font-bold group-hover:text-gold transition-colors break-all">aufin.auto@gmail.com</div>
                  </div>
                </a>
              </div>
            </div>

            <div className="lg:w-1/2 p-12 lg:p-20 bg-dark-card relative overflow-hidden">
              <motion.div
                initial={false}
                animate={isSubmitted ? { opacity: 0, scale: 0.95, filter: "blur(10px)" } : { opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.4 }}
              >
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-white/40 font-bold ml-1">Jméno a příjmení</label>
                      <input 
                        type="text" 
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Jan Novák"
                        className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 focus:border-gold outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-white/40 font-bold ml-1">Email</label>
                      <input 
                        type="email" 
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="jan.novak@email.cz"
                        className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 focus:border-gold outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-white/40 font-bold ml-1">Telefonní číslo</label>
                      <input 
                        type="tel" 
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="+420 123 456 789"
                        className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 focus:border-gold outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-white/40 font-bold ml-1">Mám zájem o vůz</label>
                      <select 
                        value={formData.car}
                        onChange={(e) => setFormData({...formData, car: e.target.value})}
                        className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 focus:border-gold outline-none transition-colors appearance-none"
                      >
                        <option value="">Vyberte model (volitelné)</option>
                        {cars.filter(car => !car.isComingSoon).map(car => (
                          <option key={car.id} value={car.name}>{car.name}</option>
                        ))}
                        <option value="other">Jiný model / Individuální poptávka</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-white/40 font-bold ml-1">Zpráva</label>
                    <textarea 
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      placeholder="Mám zájem o více informací ohledně..."
                      className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 focus:border-gold outline-none transition-colors resize-none"
                    />
                  </div>
                  
                  <div className="flex flex-start gap-3 py-4">
                    <input type="checkbox" required className="mt-1 accent-gold" id="privacy" />
                    <label htmlFor="privacy" className="text-xs text-white/40 leading-relaxed">
                      Souhlasím se zpracováním osobních údajů za účelem kontaktování s nabídkou. Více v{" "}
                      <a href="/ochrana-osobnich-udaju" target="_blank" rel="noopener" className="text-gold hover:text-white transition-colors">zásadách ochrany osobních údajů</a>.
                    </label>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gold text-black font-bold py-5 rounded-2xl hover:bg-white transition-all duration-300 text-lg shadow-lg shadow-gold/10 flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    ) : (
                      <>ODESLAT POPTÁVKU <ChevronRight className="w-5 h-5" /></>
                    )}
                  </button>
                </form>
              </motion.div>

              {/* Success Message Overlay */}
              {isSubmitted && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-dark-card/80 backdrop-blur-sm z-30"
                >
                  <div className="w-20 h-20 bg-gold rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-black" />
                  </div>
                  <h3 className="text-3xl font-bold mb-4">Odesláno!</h3>
                  <p className="text-white/60 font-light max-w-xs">
                    Děkujeme za Váš zájem. Ozveme se Vám zpět do 30 minut.
                  </p>
                  <button 
                    onClick={() => setIsSubmitted(false)}
                    className="mt-8 text-gold font-bold text-sm uppercase tracking-widest hover:text-white transition-colors"
                  >
                    Poslat další dotaz
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ + SEO obsah */}
      <section id="caste-dotazy" className="py-32 bg-dark-surface relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-1/2 h-full bg-gold/5 blur-[120px] -z-10" />
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-gold font-bold tracking-widest text-sm uppercase mb-4 block">Časté dotazy</span>
          </div>


          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-dark-card rounded-2xl border border-white/5 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-6 text-left"
                >
                  <span className="font-bold text-lg">{faq.q}</span>
                  <Plus className={`w-5 h-5 text-gold shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-45' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6 text-white/50 font-light leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <a href="#formular" className="inline-flex items-center gap-2 bg-gold text-black px-8 py-4 rounded-full font-bold hover:bg-white transition-all duration-300">
              MÁM DOTAZ – KONTAKTUJTE MĚ <ChevronRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/10 bg-black">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
            <a href="/" className="flex items-center group relative h-full">
              <svg viewBox="0 0 300 120" className="w-24 h-auto group-hover:scale-105 transition-transform duration-500">
                <path d="M50 45 Q 150 5, 250 45" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" className="opacity-90" />
                <g transform="translate(-10, 95)">
                  <path d="M60 0 L85-40 L110 0" fill="none" stroke="#FF6600" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
                  <text x="120" y="0" fill="white" fontSize="55" fontWeight="900" fontFamily="sans-serif" style={{ letterSpacing: '4px' }}>UFIN</text>
                </g>
                <g transform="translate(0, 115)">
                  <line x1="85" y1="-7" x2="115" y2="-7" stroke="#FF6600" strokeWidth="3" strokeLinecap="round" />
                  <text x="150" y="0" fill="white" fontSize="22" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" style={{ letterSpacing: '8px' }}>AUTO</text>
                  <line x1="185" y1="-7" x2="215" y2="-7" stroke="#FF6600" strokeWidth="3" strokeLinecap="round" />
                </g>
              </svg>
            </a>

            <div className="flex flex-col md:flex-row gap-12 md:gap-24">
              <div className="space-y-4">
                <div className="text-xs uppercase tracking-widest font-bold text-gold">Právní informace</div>
                <div className="flex flex-col gap-2 text-sm text-white/40">
                  <a href="/ochrana-osobnich-udaju" className="hover:text-gold transition-colors">Ochrana osobních údajů</a>
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-xs uppercase tracking-widest font-bold text-gold">Provozovatel</div>
                <div className="text-sm text-white/40 space-y-1 font-light">
                  <p className="font-bold text-white/60">AUFI s.r.o.</p>
                  <p>IČO: 24398071</p>
                  <p>Humpolecká 1886/26, Krč, 140 00 Praha</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 text-center md:text-left text-white/20 text-xs font-light flex flex-col md:flex-row justify-between items-center gap-4">
            <span>© {new Date().getFullYear()} AUFI s.r.o. Všechna práva vyhrazena.</span>
            <div className="flex gap-6">
              <button 
                onClick={() => toggleAdminMode(true)}
                className="w-12 h-12 opacity-0 hover:opacity-[0.01] cursor-default"
                aria-hidden="true"
              >
                .
              </button>
            </div>
          </div>
        </div>
      </footer>
      
      {isAdminMode && (
        <Suspense fallback={<PageLoader />}>
          <AdminDashboard onClose={() => toggleAdminMode(false)} />
        </Suspense>
      )}
      {/* Car Detail Modal */}
      {selectedCar && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            onClick={closeCarDetail}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-5xl bg-dark-card rounded-[32px] border border-white/10 overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            <button 
              onClick={closeCarDetail}
              className="absolute top-6 right-6 z-10 w-12 h-12 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center hover:bg-gold hover:text-black transition-all"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex flex-col lg:flex-row">
              <div className="lg:w-1/2">
                <div 
                  className="aspect-[4/3] relative cursor-pointer group"
                  onClick={() => setActiveImageIndex(0)}
                >
                  <img 
                    src={selectedCar.image} 
                    alt={selectedCar.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-gold text-black px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2">
                      <Palette className="w-4 h-4" /> VÍCE FOTEK ({allImages.length})
                    </div>
                  </div>
                </div>
                {selectedCar.gallery && selectedCar.gallery.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 p-4 border-t border-white/5">
                    {selectedCar.gallery.slice(0, 4).map((img, idx) => (
                      <div 
                        key={idx} 
                        className="aspect-video rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative"
                        onClick={() => setActiveImageIndex(idx + 1)}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        {idx === 3 && selectedCar.gallery.length > 4 && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-xs font-bold">
                            +{selectedCar.gallery.length - 4}
                          </div>
                        )}
                      </div>
                    ))}
                    {/* Desktop hidden 5th item */}
                    {selectedCar.gallery.length >= 5 && (
                      <div 
                        className="hidden sm:block aspect-video rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative"
                        onClick={() => setActiveImageIndex(5)}
                      >
                        <img src={selectedCar.gallery[4]} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        {selectedCar.gallery.length > 5 && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-xs font-bold">
                            +{selectedCar.gallery.length - 5}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="lg:w-1/2 p-8 md:p-12">
                <div className="flex items-center gap-2 text-gold font-bold tracking-widest text-xs uppercase mb-4">
                  <Info className="w-4 h-4" /> Detail vozu
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-10">{selectedCar.name} na splátky bez registru</h2>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                      <Fuel className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-white/40 font-bold">Palivo</div>
                      <div className="text-sm font-bold">{selectedCar.details.fuel}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                      <Info className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-white/40 font-bold">Motor</div>
                      <div className="text-sm font-bold">{selectedCar.details.engine}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-white/40 font-bold">Výkon</div>
                      <div className="text-sm font-bold">{selectedCar.details.power}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                      <Settings className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-white/40 font-bold">Převodovka</div>
                      <div className="text-sm font-bold">{selectedCar.details.transmission}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-white/40 font-bold">Rok</div>
                      <div className="text-sm font-bold">{selectedCar.details.year}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                      <Palette className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-white/40 font-bold">Barva</div>
                      <div className="text-sm font-bold">{selectedCar.details.color}</div>
                    </div>
                  </div>
                </div>

                <div className="mb-10">
                  <div className="flex items-center gap-2 text-gold font-bold tracking-widest text-[10px] uppercase mb-4">
                    <ListChecks className="w-4 h-4" /> Výhody & Výbava
                  </div>
                  <div className="text-white/60 text-sm font-light leading-relaxed whitespace-pre-line">
                    {selectedCar.equipment}
                  </div>
                </div>

                <div className="mb-10">
                  <div className="flex items-center gap-2 text-gold font-bold tracking-widest text-[10px] uppercase mb-4">
                    <FileText className="w-4 h-4" /> Popis vozu
                  </div>
                  <p className="text-white/60 text-sm font-light leading-relaxed whitespace-pre-line">
                    {selectedCar.description}
                  </p>
                </div>

                <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                    <div className="text-xs uppercase tracking-widest text-white/40 font-bold mb-2">Měsíční nájemné</div>
                    <div className="text-3xl font-bold text-gold">
                      od {parseInt(selectedCar.price.replace(/\D/g, '') || "0").toLocaleString('cs-CZ')} Kč 
                    </div>
                  </div>
                  <div className="bg-gold/10 rounded-2xl p-6 border border-gold/20">
                    <div className="text-xs uppercase tracking-widest text-gold font-bold mb-2">Při převzetí vozidla</div>
                    <div className="text-3xl font-bold text-white">
                      {selectedCar.pickupPrice?.toLocaleString('cs-CZ')} Kč
                    </div>
                  </div>
                </div>
                <div className="text-[10px] uppercase tracking-widest text-white/10 font-medium text-left mt-2 mb-6 opacity-60">
                  Cena nezahrnuje pojištění
                </div>
                <button
                  onClick={() => {
                    (window as any).gtag?.('event', 'click_car_inquiry', { event_category: 'lead', event_label: selectedCar.name });
                    handleCarInquiry(selectedCar.name);
                  }}
                  className="w-full bg-gold text-black font-bold py-5 rounded-2xl hover:bg-white transition-all duration-300 text-lg mt-6"
                >
                  MÁM ZÁJEM O TENTO VŮZ
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      {/* Lightbox */}
      {activeImageIndex !== null && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-sm">
          <button 
            onClick={() => setActiveImageIndex(null)}
            className="absolute top-6 right-6 z-10 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all"
          >
            <X className="w-6 h-6" />
          </button>
          
          <button 
            onClick={prevImage}
            className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/5 flex items-center justify-center hover:bg-gold hover:text-black transition-all"
          >
            <ChevronRight className="w-8 h-8 rotate-180" />
          </button>
          
          <button 
            onClick={nextImage}
            className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/5 flex items-center justify-center hover:bg-gold hover:text-black transition-all"
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          <div className="max-w-7xl max-h-[80vh] px-20">
            <motion.img 
              key={activeImageIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              src={allImages[activeImageIndex]} 
              alt="" 
              className="w-full h-full object-contain rounded-xl"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50 font-mono">
              {activeImageIndex + 1} / {allImages.length}
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp plovoucí tlačítko */}
      <a
        href="https://wa.me/420731562211?text=Dobr%C3%BD%20den%2C%20m%C3%A1m%20z%C3%A1jem%20o%20financov%C3%A1n%C3%AD%20vozu%20z%20AUFIN%20AUTO."
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => (window as any).gtag?.('event', 'click_whatsapp', { event_category: 'contact', event_label: 'floating_button' })}
        aria-label="Napsat na WhatsApp"
        className="fixed bottom-6 right-6 z-[300] w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-110"
        style={{ background: '#25D366' }}
      >
        <svg viewBox="0 0 32 32" className="w-8 h-8 fill-white">
          <path d="M16 3C9.373 3 4 8.373 4 15c0 2.385.668 4.61 1.832 6.505L4 29l7.694-1.807A11.94 11.94 0 0 0 16 27c6.627 0 12-5.373 12-12S22.627 3 16 3zm0 21.75a9.725 9.725 0 0 1-5.003-1.38l-.36-.213-3.724.875.909-3.618-.234-.371A9.715 9.715 0 0 1 6.25 15c0-5.376 4.374-9.75 9.75-9.75S25.75 9.624 25.75 15 21.376 24.75 16 24.75zm5.293-7.02c-.29-.146-1.716-.847-1.981-.944-.265-.097-.458-.146-.651.146-.193.292-.748.944-.917 1.138-.169.194-.338.219-.628.073-.29-.146-1.224-.451-2.332-1.438-.862-.768-1.443-1.717-1.612-2.007-.169-.29-.018-.447.127-.592.13-.13.29-.34.435-.51.146-.169.194-.29.292-.483.097-.194.048-.364-.024-.51-.073-.146-.651-1.57-.892-2.15-.234-.562-.473-.486-.651-.495l-.554-.01c-.194 0-.51.073-.777.364-.265.29-1.014.99-1.014 2.414s1.038 2.8 1.183 2.993c.146.194 2.043 3.12 4.95 4.376.692.299 1.232.477 1.653.61.695.22 1.328.189 1.828.115.558-.083 1.716-.702 1.957-1.38.242-.677.242-1.257.17-1.38-.073-.121-.265-.194-.556-.34z" />
        </svg>
      </a>
    </div>
  );
}
