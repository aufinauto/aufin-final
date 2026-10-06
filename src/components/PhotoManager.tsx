/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Editor fotek vozu v administraci: až 25 fotek, první = hlavní, pořadí šipkami.
 * Ukládá se až s autem (viz lib/vehiclePhotos.ts).
 */

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, Star, X } from "lucide-react";
import { MAX_PHOTOS, preparePhoto, type PhotoItem } from "../lib/vehiclePhotos";

export default function PhotoManager({
  photos,
  onChange,
  loading = false,
}: {
  photos: PhotoItem[];
  onChange: (next: PhotoItem[] | ((prev: PhotoItem[]) => PhotoItem[])) => void;
  loading?: boolean;
}) {
  const [busy, setBusy] = useState(0);

  const add = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from<File>(e.target.files ?? []).filter((f) => f.type.startsWith("image/"));
    e.target.value = "";
    const room = MAX_PHOTOS - photos.length;
    if (files.length > room) alert(`Auto může mít nejvýše ${MAX_PHOTOS} fotek – přidám prvních ${Math.max(room, 0)}.`);
    const chosen = files.slice(0, Math.max(room, 0));
    setBusy(chosen.length);
    for (const file of chosen) {
      try {
        const data = await preparePhoto(file);
        onChange((prev) => [...prev, { data }]);
      } catch {
        alert(`Fotku „${file.name}“ se nepodařilo zpracovat.`);
      }
      setBusy((n) => n - 1);
    }
  };

  const move = (i: number, dir: -1 | 1) =>
    onChange((prev) => {
      const next = [...prev];
      [next[i], next[i + dir]] = [next[i + dir], next[i]];
      return next;
    });

  const makeMain = (i: number) => onChange((prev) => [prev[i], ...prev.filter((_, j) => j !== i)]);
  const remove = (i: number) => onChange((prev) => prev.filter((_, j) => j !== i));

  const btn = "w-7 h-7 rounded-lg bg-black/70 hover:bg-gold hover:text-black text-white flex items-center justify-center";

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
          Fotky {photos.length}/{MAX_PHOTOS} · první je hlavní
        </span>
        {(busy > 0 || loading) && (
          <span className="text-xs text-gold flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" /> {loading ? "Načítám fotky…" : `Zpracovávám ${busy}…`}
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {photos.map((p, i) => (
          <div key={p.id ?? `new-${i}-${p.data.length}`} className={`relative aspect-[4/3] rounded-xl overflow-hidden border ${i === 0 ? "border-gold" : "border-white/10"}`}>
            <img src={p.data} alt={`Fotka ${i + 1}`} className="w-full h-full object-cover" />
            {i === 0 && <span className="absolute top-1 left-1 px-2 py-0.5 rounded-md bg-gold text-black text-[10px] font-bold">HLAVNÍ</span>}
            <div className="absolute top-1 right-1">
              <button type="button" onClick={() => remove(i)} title="Odebrat" className={`${btn} hover:!bg-red-500 hover:!text-white`}><X className="w-4 h-4" /></button>
            </div>
            <div className="absolute bottom-1 inset-x-1 flex justify-between">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} title="Posunout doleva" className={`${btn} disabled:opacity-0`}><ChevronLeft className="w-4 h-4" /></button>
              {i > 0 && <button type="button" onClick={() => makeMain(i)} title="Nastavit jako hlavní" className={btn}><Star className="w-3.5 h-3.5" /></button>}
              <button type="button" onClick={() => move(i, 1)} disabled={i === photos.length - 1} title="Posunout doprava" className={`${btn} disabled:opacity-0`}><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        {photos.length < MAX_PHOTOS && (
          <label className="aspect-[4/3] rounded-xl border border-dashed border-white/20 flex flex-col items-center justify-center gap-1 text-white/40 hover:border-gold hover:text-gold cursor-pointer text-xs font-bold">
            <ImagePlus className="w-6 h-6" />
            Přidat fotky
            <input type="file" accept="image/*" multiple className="sr-only" onChange={add} />
          </label>
        )}
      </div>
    </div>
  );
}
