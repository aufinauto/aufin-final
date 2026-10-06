/**
 * GET /api/sauto?url=<odkaz na inzerát Sauto>
 * Načte výbavu (a karoserii) z inzerátu na Sauto.cz pro administraci „Auta k prodeji“.
 *
 * Prohlížeč nemůže číst Sauto přímo (CORS), proto to dělá tato serverová funkce (Vercel).
 * Bezpečnost: z odkazu se bere jen číselné ID inzerátu a dotaz jde vždy na pevnou
 * adresu www.sauto.cz – funkci nejde použít ke stahování jiných stránek.
 */

// Pořadí a názvy kategorií jako na Sautu; neznámé kategorie skončí v „Další výbava“.
const CATEGORIES: [string, string][] = [
  ["safety", "Bezpečnostní systémy"],
  ["assist", "Asistenční systémy"],
  ["security", "Zabezpečení vozidla"],
  ["interior", "Vnitřní výbava a komfort"],
  ["systems", "Palubní systémy a konektivita"],
  ["seats", "Sedadla"],
  ["lights", "Světelná technika"],
  ["exterior", "Vnější výbava"],
  ["drive", "Pohon"],
];
const OTHER = "Další výbava";

export interface SautoEquipment {
  name: string;
  body: string;
  groups: { title: string; items: string[] }[];
}

/** Z odkazu (nebo samotného čísla) vytáhne ID inzerátu. */
export function sautoId(input: string): string | null {
  const s = input.trim();
  if (/^\d{5,12}$/.test(s)) return s;
  let url: URL;
  try {
    url = new URL(s);
  } catch {
    return null;
  }
  if (!/(^|\.)sauto\.cz$/i.test(url.hostname)) return null;
  const m = url.pathname.match(/\/(\d{5,12})\/?$/);
  return m ? m[1] : null;
}

export async function fetchSautoEquipment(input: string): Promise<SautoEquipment> {
  const id = sautoId(input);
  if (!id) throw new Error("Neplatný odkaz – vložte adresu inzerátu ze Sauto.cz (končí číslem inzerátu).");
  const res = await fetch(`https://www.sauto.cz/api/v1/items/${id}`, {
    headers: { "User-Agent": "Mozilla/5.0 (AUFIN AUTO admin)", Accept: "application/json" },
  });
  if (res.status === 404) throw new Error("Inzerát na Sautu nebyl nalezen (mohl být smazán).");
  if (!res.ok) throw new Error(`Sauto odpovědělo chybou ${res.status}.`);
  const json: any = await res.json();
  const item = json?.result ?? json;
  const list: { equipment_category?: string; name?: string }[] = Array.isArray(item?.equipment_cb) ? item.equipment_cb : [];

  const byCat = new Map<string, string[]>();
  for (const e of list) {
    if (!e?.name) continue;
    const title = CATEGORIES.find(([code]) => code === e.equipment_category)?.[1] ?? OTHER;
    byCat.set(title, [...(byCat.get(title) ?? []), e.name]);
  }
  const order = [...CATEGORIES.map(([, t]) => t), OTHER];
  const groups = order
    .filter((t) => byCat.has(t))
    .map((title) => ({ title, items: byCat.get(title)!.sort((a, b) => a.localeCompare(b, "cs")) }));

  return { name: item?.name ?? "", body: item?.vehicle_body_cb?.name ?? "", groups };
}

/** Vercel serverless funkce. */
export default async function handler(req: any, res: any) {
  const url = String(req.query?.url ?? "");
  try {
    const data = await fetchSautoEquipment(url);
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(data);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || "Výbavu se nepodařilo načíst." });
  }
}
