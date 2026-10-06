/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Administrace skladu „Auta k prodeji“ (Firestore `saleCars`).
 * Záměrně oddělená od splátkových vozů (`cars`) – vůz se nekopíruje mezi sklady.
 */

import React, { useEffect, useState } from "react";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { Edit, Eye, EyeOff, Plus, Save, Trash2, X } from "lucide-react";
import { db } from "../lib/firebase";
import { deleteVehiclePhotos, loadVehiclePhotos, makeThumbnail, saveVehiclePhotos, type PhotoItem } from "../lib/vehiclePhotos";
import PhotoManager from "./PhotoManager";
import { saleCarPath } from "../lib/saleCars";
import type { SaleCar } from "../types";

const EMPTY: Omit<SaleCar, "id"> = {
  name: "",
  brand: "",
  price: 0,
  image: "",
  gallery: [],
  description: "",
  equipment: "",
  details: { year: "", mileage: "", fuel: "", engine: "", power: "", transmission: "", color: "", body: "" },
  isVisible: true,
  isSold: false,
};

const DETAIL_LABELS: Record<keyof SaleCar["details"], string> = {
  body: "Karoserie",
  year: "Rok",
  mileage: "Nájezd (km)",
  fuel: "Palivo",
  engine: "Motor",
  power: "Výkon",
  transmission: "Převodovka",
  color: "Barva",
};

const DETAIL_PLACEHOLDERS: Partial<Record<keyof SaleCar["details"], string>> = {
  body: "např. Hatchback, Kombi, Sedan",
};

const input = "w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold text-sm";

export default function SaleCarsAdmin() {
  const [cars, setCars] = useState<SaleCar[]>([]);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<SaleCar, "id">>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [importing, setImporting] = useState(false);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);

  /** Výbava (a prázdná karoserie) z inzerátu na Sautu přes serverovou funkci /api/sauto. */
  const importFromSauto = async () => {
    if (!form.sautoUrl) return;
    if (form.equipment?.trim() && !confirm("Nahradit současnou výbavu výbavou ze Sauta?")) return;
    setImporting(true);
    try {
      const res = await fetch(`/api/sauto?url=${encodeURIComponent(form.sautoUrl)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Chyba ${res.status}`);
      if (!data.groups?.length) throw new Error("Inzerát na Sautu nemá vyplněnou výbavu.");
      const equipment = data.groups.map((g: { title: string; items: string[] }) => `${g.title}: ${g.items.join(", ")}`).join("\n");
      setForm((prev) => ({
        ...prev,
        equipment,
        details: { ...prev.details, body: prev.details.body || data.body || "" },
      }));
    } catch (err: any) {
      alert("Výbavu se nepodařilo načíst: " + err.message);
    } finally {
      setImporting(false);
    }
  };

  useEffect(() => {
    return onSnapshot(
      collection(db, "saleCars"),
      (snap) => { setCars(snap.docs.map((d) => ({ id: d.id, ...d.data() } as SaleCar))); setError(""); },
      (err) => setError(`Sklad „Auta k prodeji“ nelze načíst: ${err.message}. Zkontrolujte pravidla Firestore pro kolekci saleCars.`)
    );
  }, []);

  /** Otevře editor; fotky auta se načtou zvlášť (každá je samostatný dokument). */
  const openEditor = async (car: SaleCar | null) => {
    setPhotos([]);
    if (!car) {
      setForm(EMPTY);
      setEditing("new");
      return;
    }
    const { id, ...rest } = car;
    setForm({ ...EMPTY, ...rest, details: { ...EMPTY.details, ...rest.details } });
    setEditing(id);
    setPhotosLoading(true);
    try {
      setPhotos(await loadVehiclePhotos(car));
    } catch (err: any) {
      alert("Fotky se nepodařilo načíst: " + err.message);
    } finally {
      setPhotosLoading(false);
    }
  };

  const save = async () => {
    if (!form.name || !form.brand || !(form.price > 0)) {
      alert("Název, značka a cena jsou povinné.");
      return;
    }
    if (photosLoading) return;
    setBusy(true);
    try {
      // Fotky jsou samostatné dokumenty – v autě zůstane jen jejich pořadí a malý náhled.
      const id = editing === "new" ? (await addDoc(collection(db, "saleCars"), { name: form.name, isVisible: false, createdAt: serverTimestamp() })).id : editing!;
      const photoIds = await saveVehiclePhotos(`saleCars/${id}`, photos, form.photoIds);
      const image = photos[0] ? await makeThumbnail(photos[0].data) : "";
      await updateDoc(doc(db, "saleCars", id), { ...form, image, gallery: [], photoIds, updatedAt: serverTimestamp() });
      setEditing(null);
    } catch (err: any) {
      alert("Chyba při ukládání: " + err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (car: SaleCar) => {
    if (!confirm(`Opravdu smazat „${car.name}“? Akce je nevratná.`)) return;
    try { await deleteDoc(doc(db, "saleCars", car.id)); await deleteVehiclePhotos(car.photoIds); } catch (err: any) { alert("Chyba při mazání: " + err.message); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold">Auta k prodeji</h2>
          <p className="text-white/40 text-sm mt-1">Samostatný sklad pro přímý prodej. Na webu: /auta-k-prodeji. Splátkové vozy spravujte v záložce Vozidla.</p>
        </div>
        <button onClick={() => openEditor(null)} className="bg-gold text-black px-6 py-4 rounded-2xl font-bold hover:bg-white transition-all flex items-center gap-2 shrink-0">
          <Plus className="w-5 h-5" /> NOVÝ VŮZ
        </button>
      </div>
      {error && <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cars.map((car) => (
          <div key={car.id} className="bg-dark-card border border-white/5 rounded-3xl overflow-hidden flex flex-col">
            <div className="aspect-video bg-white/5">{car.image && <img src={car.image} alt="" className="w-full h-full object-cover" />}</div>
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="text-xl font-bold mb-1">{car.name}</h3>
              <p className="text-white/40 text-sm mb-4">{car.brand} • {car.details?.year} • {car.details?.mileage} km</p>
              <div className="text-gold font-bold text-lg mb-2">{car.price?.toLocaleString("cs-CZ")} Kč {car.isSold && <span className="text-xs text-red-400 ml-2">PRODÁNO</span>}</div>
              <a href={saleCarPath(car)} target="_blank" rel="noopener" className="text-sm text-white/50 hover:text-gold underline underline-offset-2 mb-4 break-all">
                Stránka na webu: {saleCarPath(car)}
              </a>
              <div className="flex gap-2 mt-auto">
                <button onClick={() => openEditor(car)}
                  className="flex-1 bg-white/5 hover:bg-white/10 rounded-xl h-12 font-bold flex items-center justify-center gap-2"><Edit className="w-4 h-4" /> UPRAVIT</button>
                <button onClick={() => updateDoc(doc(db, "saleCars", car.id), { isVisible: car.isVisible === false })}
                  title={car.isVisible !== false ? "Viditelné na webu" : "Skryté"}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${car.isVisible !== false ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                  {car.isVisible !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => remove(car)} title="Smazat" className="w-12 h-12 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
        {!cars.length && !error && <p className="text-white/40">Zatím žádné vozy k prodeji.</p>}
      </div>

      {editing && (
        <div className="fixed inset-0 z-[150] bg-black/90 overflow-y-auto p-3 md:p-8">
          <div className="max-w-3xl mx-auto bg-dark-card rounded-3xl border border-white/10 p-5 md:p-8 space-y-5">
            <div className="flex justify-between items-center">
              <h2 className="text-xl md:text-2xl font-bold">{editing === "new" ? "Nový vůz k prodeji" : form.name}</h2>
              <button onClick={() => setEditing(null)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="space-y-1 block"><span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Název modelu</span>
                <input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
              <label className="space-y-1 block"><span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Výrobce</span>
                <input className={input} value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></label>
              <label className="space-y-1 block sm:col-span-2"><span className="text-[10px] uppercase tracking-widest text-gold font-bold">Kupní cena (Kč)</span>
                <input type="number" className={input} value={form.price || ""} onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })} /></label>
              {(Object.keys(DETAIL_LABELS) as (keyof SaleCar["details"])[]).map((k) => (
                <label key={k} className="space-y-1 block"><span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{DETAIL_LABELS[k]}</span>
                  <input className={input} placeholder={DETAIL_PLACEHOLDERS[k]} value={form.details[k] ?? ""} onChange={(e) => setForm({ ...form, details: { ...form.details, [k]: e.target.value } })} /></label>
              ))}
            </div>
            <label className="space-y-1 block"><span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Popis</span>
              <textarea className={`${input} h-28 resize-none`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
            <div className="space-y-2 p-4 rounded-2xl border border-gold/20 bg-gold/5">
              <span className="text-[10px] uppercase tracking-widest text-gold font-bold">Výbava ze Sauto.cz</span>
              <div className="flex flex-col sm:flex-row gap-2">
                <input className={input} placeholder="https://www.sauto.cz/osobni/detail/…/123456789" value={form.sautoUrl ?? ""}
                  onChange={(e) => setForm({ ...form, sautoUrl: e.target.value })} />
                <button type="button" onClick={importFromSauto} disabled={importing || !form.sautoUrl}
                  className="shrink-0 px-5 py-3 rounded-xl bg-gold text-black font-bold text-sm disabled:opacity-50">
                  {importing ? "Načítám…" : "Načíst výbavu"}
                </button>
              </div>
              <p className="text-xs text-white/40">Vložte odkaz na inzerát tohoto auta na Sautu. Výbava se doplní do pole níže, kde ji můžete upravit.</p>
            </div>
            <label className="space-y-1 block"><span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Výbava</span>
              <textarea className={`${input} h-48 resize-y`} placeholder={"Bezpečnostní systémy: ABS, ESP\nSedadla: Isofix, Vyhřívaná sedadla"} value={form.equipment} onChange={(e) => setForm({ ...form, equipment: e.target.value })} /></label>
            <PhotoManager photos={photos} onChange={setPhotos} loading={photosLoading} />
            <div className="flex flex-wrap gap-6 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.isVisible !== false} onChange={(e) => setForm({ ...form, isVisible: e.target.checked })} /> Zobrazit na webu</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.isSold} onChange={(e) => setForm({ ...form, isSold: e.target.checked })} /> Prodáno</label>
            </div>
            <button onClick={save} disabled={busy} className="w-full bg-gold text-black font-bold py-4 rounded-2xl hover:bg-white transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              <Save className="w-5 h-5" /> {busy ? "PRACUJI…" : "ULOŽIT VŮZ"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
