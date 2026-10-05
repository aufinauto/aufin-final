/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Rozlišení ostrého webu a náhledu (V2 / lokál / testovací hosting).
 *
 * Režim se NEnastavuje přepínačem ani proměnnou prostředí, ale podle
 * skutečné domény, na které web běží:
 *   - na PRODUCTION_HOSTS (aufinauto.cz) se web indexuje, formuláře odesílají
 *     poptávky a běží analytika,
 *   - kdekoli jinde (localhost, náhledové URL…) je web „noindex“, formuláře
 *     nic neodesílají a administrace se neotevře.
 * Díky tomu nemůže omezení náhledu omylem „přejít“ do ostrého webu spolu
 * s kódem nebo .env souborem. Stejný seznam domén je i v index.html.
 */

export const SITE_URL = "https://www.aufinauto.cz";

export const PRODUCTION_HOSTS = ["www.aufinauto.cz", "aufinauto.cz"];

export function isProductionHost(host?: string | null): boolean {
  if (!host) return false;
  const hostname = host.split(",")[0].trim().toLowerCase().replace(/:\d+$/, "");
  return PRODUCTION_HOSTS.includes(hostname);
}

/** true = náhled (nic se neodesílá, noindex). Mimo prohlížeč vždy true. */
export const IS_PREVIEW =
  typeof window === "undefined" ? true : !isProductionHost(window.location.hostname);
