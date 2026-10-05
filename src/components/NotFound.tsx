/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 404 – stránka nenalezena.
 */

import { Helmet } from "react-helmet-async";
import { ChevronRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col items-center justify-center px-4 sm:px-6 text-center selection:bg-brand selection:text-ink">
      <Helmet>
        <html lang="cs" />
        <title>Stránka nenalezena (404) | AUFIN AUTO</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <span className="text-brand-deep font-black text-7xl md:text-9xl tracking-tighter mb-4">404</span>
      <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
        Tuto stránku jsme nenašli
      </h1>
      <p className="text-ink/70 max-w-md mb-10">
        Odkaz je nejspíš neplatný nebo stránka už neexistuje. Vraťte se na hlavní
        stránku a vyberte si auto na splátky z naší aktuální nabídky.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <a href="/" className="btn-primary">
          Na hlavní stránku <ChevronRight className="w-5 h-5" />
        </a>
        <a href="/#nabidka-aut" className="btn-secondary">
          Auta na splátky
        </a>
      </div>
    </div>
  );
}
