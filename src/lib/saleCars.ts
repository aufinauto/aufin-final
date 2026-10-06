/**
 * Adresy detailů „Auta k prodeji“: /auta-k-prodeji/<název-rok>-<id>.
 * Krátký kus ID zaručí jedinečnost i u dvou stejných modelů a URL se nezmění,
 * když se upraví cena nebo popis. Používá web, server i prerender (seo.ts).
 */

export const SALE_BASE_PATH = "/auta-k-prodeji";

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export function saleCarSlug(car: { id: string; name?: string; details?: { year?: string } }): string {
  const base = slugify([car.name, car.details?.year].filter(Boolean).join(" ")) || "auto";
  return `${base}-${car.id.slice(0, 6).toLowerCase()}`;
}

export const saleCarPath = (car: { id: string; name?: string; details?: { year?: string } }) =>
  `${SALE_BASE_PATH}/${saleCarSlug(car)}`;

/** „122000“ → „122 000 km“; text, který není číslo, nechá být. */
export function formatKm(mileage?: string | number): string {
  if (mileage === undefined || mileage === null || mileage === "") return "";
  const digits = String(mileage).replace(/\s/g, "");
  return /^\d+$/.test(digits) ? `${Number(digits).toLocaleString("cs-CZ")} km` : `${mileage}`;
}
