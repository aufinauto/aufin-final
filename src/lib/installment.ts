/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Výpočty podmínek splátkového vozu. Nic se nedopočítává odhadem:
 * celková částka se zobrazí jen tehdy, když má vůz vyplněnou délku nájmu.
 */

import type { Car } from "../types";

export const formatCzk = (n: number) => `${Math.round(n).toLocaleString("cs-CZ")} Kč`;

/** Měsíční nájemné – z textu ceny (tak ho zadává administrace), jinak z priceValue. */
export function monthlyRent(car: Car): number {
  const fromText = parseInt(car.price?.replace(/\D/g, "") || "", 10);
  return fromText > 0 ? fromText : Number(car.priceValue) || 0;
}

/** Je nájemné uvedené jako „od …“? Pak je i celková částka jen „od“. */
export const isFromPrice = (car: Car) => /\bod\b/i.test(car.price || "");

export interface InstallmentTerms {
  pickup: number;          // počáteční platba při převzetí
  monthly: number;         // měsíční nájemné
  isFrom: boolean;
  termMonths: number | null;
  buyoutPrice: number | null;
  /** Počáteční platba + nájemné za celou dobu (+ odkupní platba, je-li zadaná). null = chybí údaje. */
  total: number | null;
}

export function installmentTerms(car: Car): InstallmentTerms {
  const pickup = Number(car.pickupPrice) || 0;
  const monthly = monthlyRent(car);
  const termMonths = Number(car.termMonths) > 0 ? Number(car.termMonths) : null;
  const buyoutPrice = Number(car.buyoutPrice) > 0 ? Number(car.buyoutPrice) : null;
  const total = termMonths && monthly > 0 ? pickup + monthly * termMonths + (buyoutPrice || 0) : null;
  return { pickup, monthly, isFrom: isFromPrice(car), termMonths, buyoutPrice, total };
}
