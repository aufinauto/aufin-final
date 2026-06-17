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
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 text-center selection:bg-gold selection:text-black">
      <Helmet>
        <html lang="cs" />
        <title>Stránka nenalezena (404) | AUFIN AUTO</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <span className="text-gold font-black text-7xl md:text-9xl tracking-tighter mb-4">404</span>
      <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
        Tuto stránku jsme nenašli
      </h1>
      <p className="text-white/50 font-light max-w-md mb-10">
        Odkaz je nejspíš neplatný nebo stránka už neexistuje. Vraťte se na hlavní
        stránku a vyberte si auto na splátky z naší aktuální nabídky.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <a href="/" className="bg-gold text-black px-8 py-4 rounded-full font-bold hover:bg-white transition-all duration-300 flex items-center justify-center gap-2">
          NA HLAVNÍ STRÁNKU <ChevronRight className="w-5 h-5" />
        </a>
        <a href="/#nabidka-aut" className="border border-white/20 hover:border-gold px-8 py-4 rounded-full font-bold transition-all duration-300">
          NABÍDKA AUT
        </a>
      </div>
    </div>
  );
}
