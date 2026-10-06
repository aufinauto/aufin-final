/**
 * Veřejná data webu (auta, auta k prodeji, články) se čtou ze souborů /data/*.json,
 * které vytvoří build (scripts/prerender.ts). Návštěvníci tak nečtou Firestore
 * a nevyčerpávají denní limit. Změny z administrace se na web dostanou tlačítkem
 * „Publikovat změny na web“ (nový build na Vercelu).
 *
 * Když soubor neexistuje (lokální náhled bez buildu), načte se kolekce přímo z Firestore.
 */
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "./firebase";

const FILES = { cars: "cars", saleCars: "sale-cars", posts: "posts" } as const;
type Name = keyof typeof FILES;

const cache = new Map<Name, Promise<any[]>>();

async function fromFile(name: Name): Promise<any[] | null> {
  try {
    // no-cache = prohlížeč si soubor ověří (ETag), takže po publikování hned uvidí nová data.
    const res = await fetch(`/data/${FILES[name]}.json`, { cache: "no-cache" });
    if (!res.ok || !res.headers.get("content-type")?.includes("json")) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fromFirestore(name: Name): Promise<any[]> {
  const snap = await getDocs(collection(db, name));
  const items: any[] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  // Fotky v samostatných dokumentech (vehiclePhotos) – doplnit jako image + gallery.
  for (const item of items) {
    if (!item.photoIds?.length) continue;
    const photos = await Promise.all(item.photoIds.map((id: string) => getDoc(doc(db, "vehiclePhotos", id))));
    const list = photos.filter((p) => p.exists()).map((p) => (p.data() as { data: string }).data);
    item.image = list[0] ?? item.image;
    item.gallery = list.slice(1);
  }
  return items;
}

/** Načte publikovaná data (jednou za návštěvu stránky). Při chybě vyhodí výjimku. */
export function loadPublished<T>(name: Name): Promise<T[]> {
  if (!cache.has(name)) {
    const p = fromFile(name).then((items) => items ?? fromFirestore(name));
    p.catch(() => cache.delete(name));
    cache.set(name, p);
  }
  return cache.get(name)! as Promise<T[]>;
}
