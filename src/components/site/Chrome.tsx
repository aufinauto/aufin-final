/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Společné prvky veřejného webu: logo, hlavička s menu, patička,
 * lišta náhledu a plovoucí WhatsApp tlačítko.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Banknote, Car, ChevronRight, KeyRound, Mail, Menu, MessageCircle, Phone, X, type LucideIcon } from "lucide-react";
import { IS_PREVIEW } from "../../lib/siteEnv";
import { OPEN_COOKIE_SETTINGS } from "./CookieBanner";

export const PHONE_DISPLAY = "+420 731 562 211";
export const PHONE_HREF = "tel:+420731562211";
export const EMAIL = "aufin.auto@gmail.com";

export type NavKey = "splatky" | "hotove" | "vykup" | "kontakt" | null;

export const NAV_ITEMS: { key: Exclude<NavKey, null>; label: string; href: string }[] = [
  { key: "splatky", label: "Auta na splátky", href: "/#nabidka-aut" },
  { key: "hotove", label: "Auta k prodeji", href: "/auta-k-prodeji" },
  { key: "vykup", label: "Výkup auta", href: "/vykup-auta" },
  { key: "kontakt", label: "Kontakt", href: "/kontakt" },
];

/** Ikony a krátké podtitulky položek v mobilním menu. */
const NAV_ICONS: Record<Exclude<NavKey, null>, LucideIcon> = {
  splatky: KeyRound,
  hotove: Car,
  vykup: Banknote,
  kontakt: MessageCircle,
};
const NAV_HINTS: Record<Exclude<NavKey, null>, string> = {
  splatky: "Bez nahlížení do registrů",
  hotove: "Prověřené ojeté vozy",
  vykup: "Rychlé nacenění vašeho vozu",
  kontakt: "Telefon, WhatsApp, e-mail",
};

const track = (event: string, label: string) =>
  (window as any).gtag?.("event", event, { event_category: "contact", event_label: label });

/** Logo AUFIN AUTO (původní kresba; písmo v barvě textu – „dark“ = podle tématu, „light“ = bílé). */
export function Logo({ className = "w-28 md:w-32", tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  const ink = "currentColor";
  return (
    <svg viewBox="0 0 300 120" className={`h-auto ${tone === "dark" ? "text-ink" : "text-white"} ${className}`} role="img" aria-label="AUFIN AUTO">
      <path d="M50 45 Q 150 5, 250 45" fill="none" stroke={ink} strokeWidth="5" strokeLinecap="round" />
      <g transform="translate(-10, 95)">
        <path d="M60 0 L85-40 L110 0" fill="none" stroke="#FF6600" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
        <text x="120" y="0" fill={ink} fontSize="55" fontWeight="900" fontFamily="sans-serif" style={{ letterSpacing: "4px" }}>UFIN</text>
      </g>
      <g transform="translate(0, 115)">
        <line x1="85" y1="-7" x2="115" y2="-7" stroke="#FF6600" strokeWidth="3" strokeLinecap="round" />
        <text x="150" y="0" fill={ink} fontSize="22" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" style={{ letterSpacing: "8px" }}>AUTO</text>
        <line x1="185" y1="-7" x2="215" y2="-7" stroke="#FF6600" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/** Viditelné upozornění, že běží náhled (jen mimo produkční doménu). */
const THEME_KEY = "aufin-preview-theme";

export function PreviewBanner() {
  const [dark, setDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.dataset.theme === "dark"
  );
  if (!IS_PREVIEW) return null;

  // Vyzkoušení tmavého vzhledu – jen v náhledu, ostrý web zůstává světlý.
  const toggle = () => {
    const next = !dark;
    setDark(next);
    if (next) document.documentElement.dataset.theme = "dark";
    else delete document.documentElement.dataset.theme;
    try { localStorage.setItem(THEME_KEY, next ? "dark" : "light"); } catch { /* soukromé okno */ }
  };

  return (
    <div className="bg-night text-white text-xs sm:text-sm px-4 py-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
      <span><strong className="text-brand">NÁHLED V2</strong> · neindexuje se · formuláře nic neodesílají</span>
      <button type="button" onClick={toggle} className="px-3 py-0.5 rounded-full border border-white/30 hover:border-brand hover:text-brand">
        {dark ? "☀ Světlý vzhled" : "☾ Tmavý vzhled"}
      </button>
    </div>
  );
}

export function SiteHeader({ active = null }: { active?: NavKey }) {
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  // Menu vyplní přesně prostor pod hlavičkou (nad ní může být lišta náhledu)
  const [menuTop, setMenuTop] = useState(64);
  useEffect(() => {
    if (!open) return;
    const measure = () => setMenuTop(Math.round(headerRef.current?.firstElementChild?.getBoundingClientRect().bottom ?? 64));
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    // Plovoucí WhatsApp tlačítko by překrylo kontaktní tlačítka v menu
    if (open) document.body.dataset.menu = "open"; else delete document.body.dataset.menu;
    return () => { document.body.style.overflow = ""; delete document.body.dataset.menu; };
  }, [open]);

  return (
    <>
      <PreviewBanner />
      <header ref={headerRef} className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 md:h-20 flex items-center justify-between gap-4">
          <a href="/" aria-label="AUFIN AUTO – úvodní stránka" className="shrink-0 -translate-y-0.5">
            <Logo className="w-24 md:w-28" />
          </a>

          <nav aria-label="Hlavní menu" className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.key}
                href={item.href}
                aria-current={active === item.key ? "page" : undefined}
                className={`px-4 py-2 rounded-full text-[15px] font-semibold transition-colors ${
                  active === item.key ? "bg-brand-soft text-brand-deep" : "text-ink/75 hover:text-ink hover:bg-sand"
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={PHONE_HREF}
              onClick={() => track("click_phone", "navbar")}
              className="hidden sm:inline-flex items-center gap-2 bg-brand text-on-brand px-5 py-2.5 rounded-full text-sm font-bold hover:bg-[#ff7d26] transition-colors"
            >
              <Phone className="w-4 h-4" /> {PHONE_DISPLAY}
            </a>
            <a
              href={PHONE_HREF}
              onClick={() => track("click_phone", "navbar_mobile")}
              aria-label={`Zavolat ${PHONE_DISPLAY}`}
              className="sm:hidden w-11 h-11 rounded-full bg-brand text-on-brand flex items-center justify-center"
            >
              <Phone className="w-5 h-5" />
            </a>
            <button
              type="button"
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Zavřít menu" : "Otevřít menu"}
              className="lg:hidden w-11 h-11 rounded-full border border-line flex items-center justify-center"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.nav
              id="mobile-menu"
              aria-label="Mobilní menu"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              style={{ height: `calc(100dvh - ${menuTop}px)` }}
              className="lg:hidden border-t border-line bg-card overflow-y-auto flex flex-col"
            >
              <ul className="px-4 pt-4 space-y-2">
                {NAV_ITEMS.map((item, i) => {
                  const Icon = NAV_ICONS[item.key];
                  const isActive = active === item.key;
                  return (
                    <motion.li
                      key={item.key}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.04 * i + 0.05, duration: 0.25, ease: "easeOut" }}
                    >
                      <a
                        href={item.href}
                        onClick={() => setOpen(false)}
                        aria-current={isActive ? "page" : undefined}
                        className={`flex items-center gap-4 p-3 rounded-2xl border transition-colors active:scale-[0.99] ${
                          isActive ? "border-brand/40 bg-brand-soft" : "border-line hover:bg-sand"
                        }`}
                      >
                        <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${isActive ? "bg-brand text-on-brand" : "bg-sand text-brand-deep"}`}>
                          <Icon className="w-5 h-5" />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className={`block text-[17px] font-bold ${isActive ? "text-brand-deep" : "text-ink"}`}>{item.label}</span>
                          <span className="block text-sm text-ink/55">{NAV_HINTS[item.key]}</span>
                        </span>
                        <ChevronRight className={`w-5 h-5 shrink-0 ${isActive ? "text-brand-deep" : "text-ink/30"}`} />
                      </a>
                    </motion.li>
                  );
                })}
              </ul>

              {/* Rychlý kontakt dole – palcem nejlépe dosažitelné místo */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.25, ease: "easeOut" }}
                className="mt-auto px-4 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
              >
                <div className="grid grid-cols-2 gap-3">
                  <a href={PHONE_HREF} onClick={() => track("click_phone", "mobile_menu")}
                    className="flex items-center justify-center gap-2 h-14 rounded-2xl bg-brand text-on-brand font-bold">
                    <Phone className="w-5 h-5" /> Zavolat
                  </a>
                  <a href={whatsappHref("Dobrý den, mám dotaz na AUFIN AUTO.")} target="_blank" rel="noopener noreferrer" onClick={() => track("click_whatsapp", "mobile_menu")}
                    className="flex items-center justify-center gap-2 h-14 rounded-2xl text-white font-bold" style={{ background: "#25D366" }}>
                    <svg viewBox="0 0 32 32" className="w-5 h-5 fill-white" aria-hidden="true"><path d={WHATSAPP_ICON_PATH} /></svg> WhatsApp
                  </a>
                </div>
                <a href={`mailto:${EMAIL}`} onClick={() => track("click_email", "mobile_menu")}
                  className="mt-3 flex items-center justify-center gap-2 text-sm text-ink/60 hover:text-ink">
                  <Mail className="w-4 h-4" /> {EMAIL}
                </a>
              </motion.div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}

export function SiteFooter({ onAdmin }: { onAdmin?: () => void }) {
  return (
    <footer className="bg-night text-white/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 grid grid-cols-[0.8fr_1.2fr] sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-10 text-sm">
        <div className="col-span-2 sm:col-span-1">
          {/* Logo má v kresbě levý okraj – posun zarovná písmena s textem pod ním */}
          <a href="/" aria-label="AUFIN AUTO – úvodní stránka" className="inline-block -ml-[18px]">
            <Logo tone="light" className="w-28" />
          </a>
          <p className="mt-3 max-w-[16rem] leading-relaxed">
            Auta na splátky bez nahlížení do registrů. Pronájem s možností odkupu.
          </p>
        </div>
        <div>
          <div className="text-white font-semibold mb-3">Služby</div>
          <ul className="space-y-2">
            <li><a href="/#nabidka-aut" className="hover:text-brand">Auta na splátky</a></li>
            <li><a href="/auta-k-prodeji" className="hover:text-brand">Auta k prodeji</a></li>
            <li><a href="/vykup-auta" className="hover:text-brand">Výkup auta</a></li>
          </ul>
        </div>
        <div>
          <div className="text-white font-semibold mb-3">Kontakt</div>
          <ul className="space-y-2">
            <li>
              <a href={PHONE_HREF} onClick={() => track("click_phone", "footer")} className="inline-flex items-center gap-2 hover:text-brand">
                <Phone className="w-4 h-4 text-brand" /> {PHONE_DISPLAY}
              </a>
            </li>
            <li>
              <a href={`https://wa.me/420731562211`} target="_blank" rel="noopener noreferrer" onClick={() => track("click_whatsapp", "footer")} className="inline-flex items-center gap-2 hover:text-brand">
                <MessageCircle className="w-4 h-4 text-brand" /> WhatsApp
              </a>
            </li>
            <li>
              <a href={`mailto:${EMAIL}`} onClick={() => track("click_email", "footer")} className="inline-flex items-center gap-2 hover:text-brand break-all">
                <Mail className="w-4 h-4 text-brand shrink-0" /> {EMAIL}
              </a>
            </li>
          </ul>
        </div>
        <div className="col-span-2 sm:col-span-1 space-y-1">
          <div className="text-white font-semibold mb-3">Provozovatel</div>
          <p className="text-white">AUFI s.r.o.</p>
          <p>IČO: 24398071</p>
          <p>Humpolecká 1886/26, Krč, 140 00 Praha</p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-white/50">
          <span>
            © {new Date().getFullYear()} AUFI s.r.o. Všechna práva vyhrazena.
            {/* Skrytý vstup do administrace: malé šedé kolečko za textem */}
            {onAdmin && (
              <button
                type="button"
                onClick={onAdmin}
                title="Administrace"
                aria-label="Administrace"
                className="group ml-1 p-1.5 align-middle cursor-pointer"
              >
                <span className="block w-2 h-2 rounded-full bg-white/35 group-hover:bg-brand transition-colors" />
              </button>
            )}
          </span>
          {/* Interní odkazy na SEO stránky a GDPR – zachovávají prolinkování z každé stránky */}
          <nav aria-label="Další odkazy" className="flex flex-wrap gap-x-4 gap-y-1">
            <a href="/auta-na-splatky-bez-registru" className="hover:text-white">Auta na splátky bez registru</a>
            <a href="/auto-na-splatky-bez-akontace" className="hover:text-white">Bez akontace</a>
            <a href="/auto-na-splatky-s-exekuci" className="hover:text-white">I s exekucí</a>
            <a href="/ochrana-osobnich-udaju" className="hover:text-white">Ochrana osobních údajů</a>
            <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS))} className="hover:text-white">
              Cookies
            </button>
          </nav>
        </div>
      </div>
    </footer>
  );
}

const WHATSAPP_ICON_PATH = "M16 3C9.373 3 4 8.373 4 15c0 2.385.668 4.61 1.832 6.505L4 29l7.694-1.807A11.94 11.94 0 0 0 16 27c6.627 0 12-5.373 12-12S22.627 3 16 3zm0 21.75a9.725 9.725 0 0 1-5.003-1.38l-.36-.213-3.724.875.909-3.618-.234-.371A9.715 9.715 0 0 1 6.25 15c0-5.376 4.374-9.75 9.75-9.75S25.75 9.624 25.75 15 21.376 24.75 16 24.75zm5.293-7.02c-.29-.146-1.716-.847-1.981-.944-.265-.097-.458-.146-.651.146-.193.292-.748.944-.917 1.138-.169.194-.338.219-.628.073-.29-.146-1.224-.451-2.332-1.438-.862-.768-1.443-1.717-1.612-2.007-.169-.29-.018-.447.127-.592.13-.13.29-.34.435-.51.146-.169.194-.29.292-.483.097-.194.048-.364-.024-.51-.073-.146-.651-1.57-.892-2.15-.234-.562-.473-.486-.651-.495l-.554-.01c-.194 0-.51.073-.777.364-.265.29-1.014.99-1.014 2.414s1.038 2.8 1.183 2.993c.146.194 2.043 3.12 4.95 4.376.692.299 1.232.477 1.653.61.695.22 1.328.189 1.828.115.558-.083 1.716-.702 1.957-1.38.242-.677.242-1.257.17-1.38-.073-.121-.265-.194-.556-.34z";

export const whatsappHref = (text: string) => `https://wa.me/420731562211?text=${encodeURIComponent(text)}`;

/** Kontaktní karty vedle formulářů (hlavní stránka, auta k prodeji, výkup) – všude stejné. */
export function ContactCards({ waText, trackLabel }: { waText: string; trackLabel: string }) {
  const card = "flex items-center gap-4 p-4 rounded-2xl border border-line hover:border-ink/30 transition-colors";
  const icon = "w-12 h-12 rounded-full bg-brand text-on-brand flex items-center justify-center shrink-0";
  return (
    <div className="space-y-4">
      <a href={PHONE_HREF} onClick={() => track("click_phone", trackLabel)} className={card}>
        <div className={icon}><Phone className="w-5 h-5" /></div>
        <div>
          <div className="text-sm text-ink/60">Zavolejte nám</div>
          <div className="text-lg font-bold whitespace-nowrap">{PHONE_DISPLAY}</div>
        </div>
      </a>
      <a href={whatsappHref(waText)} target="_blank" rel="noopener noreferrer" onClick={() => track("click_whatsapp", trackLabel)} className={card}>
        <div className={icon}>
          <svg viewBox="0 0 32 32" className="w-6 h-6 fill-current" aria-hidden="true"><path d={WHATSAPP_ICON_PATH} /></svg>
        </div>
        <div>
          <div className="text-sm text-ink/60">Napište na WhatsApp</div>
          <div className="text-lg font-bold whitespace-nowrap">{PHONE_DISPLAY}</div>
        </div>
      </a>
      <a href={`mailto:${EMAIL}`} onClick={() => track("click_email", trackLabel)} className={card}>
        <div className={icon}><Mail className="w-5 h-5" /></div>
        <div className="min-w-0">
          <div className="text-sm text-ink/60">Napište nám</div>
          <div className="text-lg font-bold break-all">{EMAIL}</div>
        </div>
      </a>
    </div>
  );
}

export function WhatsAppButton({ text = "Dobrý den, mám zájem o financování vozu z AUFIN AUTO." }: { text?: string }) {
  return (
    <a
      href={whatsappHref(text)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track("click_whatsapp", "floating_button")}
      aria-label="Napsat na WhatsApp"
      className="[body[data-menu=open]_&]:hidden fixed bottom-5 right-5 lg:bottom-8 lg:right-8 z-[60] w-14 h-14 lg:w-[72px] lg:h-[72px] rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-110"
      style={{ background: "#25D366" }}
    >
      <svg viewBox="0 0 32 32" className="w-7 h-7 lg:w-9 lg:h-9 fill-white" aria-hidden="true">
        <path d={WHATSAPP_ICON_PATH} />
      </svg>
    </a>
  );
}

/** Souhlas se zpracováním osobních údajů – stejné znění na všech formulářích. */
export function ConsentCheckbox({ id }: { id: string }) {
  return (
    <div className="flex items-start gap-3">
      <input type="checkbox" required id={id} className="mt-1 w-5 h-5 accent-brand shrink-0" />
      <label htmlFor={id} className="text-sm text-ink/70 leading-relaxed">
        Souhlasím se zpracováním osobních údajů za účelem kontaktování s nabídkou. Více v{" "}
        <a href="/ochrana-osobnich-udaju" target="_blank" rel="noopener" className="text-brand-deep underline underline-offset-2">
          zásadách ochrany osobních údajů
        </a>.
      </label>
    </div>
  );
}

/** Potvrzení po odeslání formuláře (v náhledu jasně uvede, že se nic neodeslalo). */
export function SubmitSuccess({ preview, onReset, children }: { preview: boolean; onReset: () => void; children: ReactNode }) {
  return (
    <div role="status" className="rounded-2xl border border-line bg-sand p-8 text-center">
      <div className="text-2xl font-bold mb-2">{preview ? "Náhled: formulář funguje" : "Odesláno, děkujeme!"}</div>
      <p className="text-ink/70 mb-6">
        {preview ? "V náhledu V2 se poptávka nikam neodeslala ani neuložila. Data jsou jen v konzoli prohlížeče." : children}
      </p>
      <button type="button" onClick={onReset} className="btn-secondary">Odeslat další dotaz</button>
    </div>
  );
}

/** Chybová hláška s náhradním kontaktem. */
export const SUBMIT_ERROR = `Omlouváme se, poptávku se nepodařilo odeslat. Kontaktujte nás prosím přímo na ${PHONE_DISPLAY} nebo ${EMAIL}.`;
