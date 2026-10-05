/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Informační cookies lišta. Nic nezapíná ani nevypíná – Google Analytics běží
 * vždy (index.html), lišta o tom jen pravdivě informuje a po „Rozumím“ zmizí.
 * Fixní dole: nezakrývá obsah, neposouvá layout a nic nestahuje → nekazí SEO.
 */

import { useEffect, useState } from "react";

const NOTICE_KEY = "aufin-cookie-notice";
const NOTICE_MAX_AGE_DAYS = 365;
/** Událost pro znovuotevření lišty (odkaz „Cookies“ v patičce). */
export const OPEN_COOKIE_SETTINGS = "aufin:cookie-settings";

function wasAcknowledged(): boolean {
  try {
    const at = Number(localStorage.getItem(NOTICE_KEY));
    return at > 0 && Date.now() - at < NOTICE_MAX_AGE_DAYS * 864e5;
  } catch {
    return false;
  }
}

export default function CookieBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(!wasAcknowledged());
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_COOKIE_SETTINGS, reopen);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS, reopen);
  }, []);

  const acknowledge = () => {
    try {
      localStorage.setItem(NOTICE_KEY, String(Date.now()));
    } catch {
      /* soukromé okno – lišta se zobrazí znovu při další návštěvě */
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div role="region" aria-label="Informace o cookies" className="fixed inset-x-0 bottom-0 z-[70] p-3 sm:p-4 pointer-events-none">
      <div className="pointer-events-auto max-w-4xl mx-auto bg-card text-ink border border-line rounded-2xl shadow-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center gap-4">
        <p className="text-sm text-ink/80 leading-relaxed flex-1">
          Tento web používá cookies, včetně analytických cookies Google Analytics pro měření návštěvnosti.{" "}
          <a href="/ochrana-osobnich-udaju" className="text-brand-deep underline underline-offset-2">Více informací</a>
        </p>
        <button type="button" onClick={acknowledge} className="btn-primary px-6 py-2.5 text-sm shrink-0">
          Rozumím
        </button>
      </div>
    </div>
  );
}
