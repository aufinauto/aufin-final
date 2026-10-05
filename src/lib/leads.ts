/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Odeslání poptávky ze všech formulářů webu (splátky, auta k prodeji, výkup, kontakt).
 * Na ostrém webu: uložení do Firestore `inquiries` + EmailJS + Telegram
 * (stejně jako dosud). V náhledu (viz siteEnv) se NIC neodesílá.
 */

import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import emailjs from "@emailjs/browser";
import { db } from "./firebase";
import { IS_PREVIEW } from "./siteEnv";
import type { InquiryType } from "../types";

export interface LeadInput {
  type: InquiryType;
  name: string;
  email: string;
  phone: string;
  car: string;
  message: string;
  /** Doplňující údaje (výkup: rok, nájezd, očekávaná cena…; auta k prodeji: způsob platby). */
  details?: Record<string, string>;
  /** Fotky jako JPEG data URL (jen výkup). */
  photos?: string[];
}

export const LEAD_TYPE_LABELS: Record<InquiryType, string> = {
  installment: "Na splátky",
  cash: "Auta k prodeji",
  buyout: "Výkup auta",
  contact: "Obecný dotaz",
};

const carLabel = (car: string) =>
  car && car !== "other" ? car : "Nespecifikováno / individuální";

/** Poptávka převedená na čitelný text pro e-mail a Telegram. */
function summary(lead: LeadInput) {
  const detailLines = Object.entries(lead.details || {})
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`);
  if (lead.photos?.length) detailLines.push(`Fotky: ${lead.photos.length} ks (v administraci)`);
  return [...detailLines, lead.message || "(bez zprávy)"].join("\n");
}

/**
 * Vrací `{ preview: true }`, pokud běží náhled a nic se neodeslalo.
 * Při chybě uložení/e-mailu vyhodí výjimku (formulář zobrazí kontakt).
 */
export async function submitLead(lead: LeadInput): Promise<{ preview: boolean }> {
  const typeLabel = LEAD_TYPE_LABELS[lead.type];

  if (IS_PREVIEW) {
    console.info("[NÁHLED] Poptávka NEBYLA odeslána (Firestore/EmailJS/Telegram vypnuto):", {
      ...lead,
      photos: lead.photos?.map((p) => `${Math.round(p.length / 1024)} kB`),
    });
    await new Promise((r) => setTimeout(r, 400));
    return { preview: true };
  }

  // 1. Uložit poptávku do Firebase (fotky zvlášť, viz níže – limit 1 MB na dokument)
  const inquiryRef = await addDoc(collection(db, "inquiries"), {
    type: lead.type,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    car: lead.car,
    message: lead.message,
    ...(lead.details ? { details: lead.details } : {}),
    ...(lead.photos?.length ? { photoCount: lead.photos.length } : {}),
    createdAt: serverTimestamp(),
  });

  // 1b. Každá fotka jako samostatný dokument navázaný na poptávku (bez limitu počtu na 1 MB).
  if (lead.photos?.length) {
    const photoResults = await Promise.allSettled(
      lead.photos.map((data, index) =>
        addDoc(collection(db, "inquiryPhotos"), { inquiryId: inquiryRef.id, index, data, createdAt: serverTimestamp() })
      )
    );
    const failed = photoResults.filter((r) => r.status === "rejected").length;
    if (failed) console.error(`Nepodařilo se uložit ${failed} z ${lead.photos.length} fotek.`);
  }

  // 2. Odeslat e-mail přes EmailJS (šablona zná jen tato pole – typ je v „car“)
  const carText = lead.type === "installment" ? carLabel(lead.car) : `[${typeLabel.toUpperCase()}] ${carLabel(lead.car)}`;
  await emailjs.send(
    import.meta.env.VITE_EMAILJS_SERVICE_ID,
    import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
    {
      from_name: lead.name,
      from_email: lead.email || "(nevyplněn)",
      phone: lead.phone,
      car: carText,
      message: lead.type === "installment" ? lead.message || "(bez zprávy)" : summary(lead),
    },
    import.meta.env.VITE_EMAILJS_PUBLIC_KEY
  );

  // 3. Telegram notifikace
  const tgText = `🚗 Nová poptávka AUFIN AUTO – ${typeLabel}\n\n👤 ${lead.name}\n📧 ${lead.email || "—"}\n📞 ${lead.phone}\n🚘 ${lead.car || "—"}\n💬 ${summary(lead)}`;
  fetch(`https://api.telegram.org/bot8936858090:AAFwNGfDf_tQbBsTcW_8y4l41VViXtUZo1A/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: "1655849882", text: tgText }),
  }).catch(() => {});

  // 4. Analytika
  (window as any).gtag?.("event", "form_submit", {
    event_category: "lead",
    event_label: lead.type === "installment" ? lead.car || "unspecified" : lead.type,
  });

  return { preview: false };
}
