/**
 * Fotky vozů (auta na splátky i k prodeji) – každá fotka je samostatný dokument
 * v kolekci `vehiclePhotos` (limit Firestore je 1 MB na dokument, ne na auto).
 * Auto si drží jen seřazený seznam `photoIds`; první fotka je hlavní.
 *
 * Starší auta mají fotky přímo v dokumentu (`image` + `gallery`) – načtou se také
 * a při příštím uložení se převedou sem.
 */
import { addDoc, collection, deleteDoc, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { compressImage, dataUrlBytes } from "./images";

export const MAX_PHOTOS = 25;
const MAX_PHOTO_BYTES = 900 * 1024;

/** Fotka v editoru: `id` = už uložená v `vehiclePhotos`, bez `id` = nová / ze starého formátu. */
export interface PhotoItem {
  id?: string;
  data: string;
}

/** Zmenší fotku do ostrého, ale bezpečně malého JPEG (pod limit dokumentu). */
export async function preparePhoto(file: File): Promise<string> {
  let img = await compressImage(file, 1920, 0.82);
  if (dataUrlBytes(img) > MAX_PHOTO_BYTES) img = await compressImage(file, 1600, 0.72);
  if (dataUrlBytes(img) > MAX_PHOTO_BYTES) img = await compressImage(file, 1280, 0.6);
  return img;
}

/**
 * Malý náhled hlavní fotky (~30 kB) – ukládá se do dokumentu auta jako `image`,
 * aby měl výpis v administraci co ukázat bez načítání všech fotek.
 */
export async function makeThumbnail(dataUrl: string): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob();
  return compressImage(new File([blob], "thumb.jpg", { type: blob.type }), 480, 0.7);
}

/** Fotky auta pro editor (nové `photoIds` i starý formát `image` + `gallery`). */
export async function loadVehiclePhotos(car: { photoIds?: string[]; image?: string; gallery?: string[] }): Promise<PhotoItem[]> {
  if (car.photoIds?.length) {
    const snaps = await Promise.all(car.photoIds.map((id) => getDoc(doc(db, "vehiclePhotos", id))));
    return snaps.filter((s) => s.exists()).map((s) => ({ id: s.id, data: (s.data() as { data: string }).data }));
  }
  return [car.image, ...(car.gallery || [])].filter((x): x is string => !!x).map((data) => ({ data }));
}

/**
 * Uloží fotky auta: nové zapíše jako dokumenty, odebrané smaže.
 * Vrací seřazené `photoIds` pro dokument auta.
 */
export async function saveVehiclePhotos(owner: string, items: PhotoItem[], previousIds: string[] = []): Promise<string[]> {
  const ids: string[] = [];
  for (const item of items) {
    if (item.id) {
      ids.push(item.id);
    } else {
      const ref = await addDoc(collection(db, "vehiclePhotos"), { owner, data: item.data, createdAt: serverTimestamp() });
      item.id = ref.id;
      ids.push(ref.id);
    }
  }
  await deleteVehiclePhotos(previousIds.filter((id) => !ids.includes(id)));
  return ids;
}

export async function deleteVehiclePhotos(ids: string[] = []) {
  await Promise.all(ids.map((id) => deleteDoc(doc(db, "vehiclePhotos", id)).catch(() => {})));
}
