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
import { compressImage } from "../lib/images";
import type { SaleCar } from "../types";

const EMPTY: Omit<SaleCar, "id"> = {
  name: "",
  brand: "",
  price: 0,
  image: "",
  gallery: [],
  description: "",
  equipment: "",
  details: { year: "", mileage: "", fuel: "", engine: "", power: "", transmission: "", color: "" },
  isVisible: true,
  isSold: false,
};

const DETAIL_LABELS: Record<keyof SaleCar["details"], string> = {
  year: "Rok",
  mileage: "Nájezd (km)",
  fuel: "Palivo",
  engine: "Motor",
  power: "Výkon",
  transmission: "Převodovka",
  color: "Barva",
};

const input = "w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold text-sm";

export default function SaleCarsAdmin() {
  const [cars, setCars] = useState<SaleCar[]>([]);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<SaleCar, "id">>(EMPTY);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return onSnapshot(
      collection(db, "saleCars"),
      (snap) => { setCars(snap.docs.map((d) => ({ id: d.id, ...d.data() } as SaleCar))); setError(""); },
      (err) => setError(`Sklad „Auta k prodeji“ nelze načíst: ${err.message}. Zkontrolujte pravidla Firestore pro kolekci saleCars.`)
    );
  }, []);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>, target: "main" | "gallery") => {
    const files = Array.from<File>(e.target.files ?? []);
    e.target.value = "";
    setBusy(true);
    try {
      for (const f of files) {
        const img = await compressImage(f);
        setForm((prev) => (target === "main" ? { ...prev, image: img } : { ...prev, gallery: [...prev.gallery, img] }));
      }
    } catch {
      alert("Chyba při zpracování obrázku.");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!form.name || !form.brand || !(form.price > 0)) {
      alert("Název, značka a cena jsou povinné.");
      return;
    }
    if (new Blob([JSON.stringify(form)]).size > 1_000_000) {
      alert("Inzerát je větší než 1 MB (limit databáze). Odeberte některé fotky.");
      return;
    }
    setBusy(true);
    try {
      if (editing === "new") {
        await addDoc(collection(db, "saleCars"), { ...form, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      } else if (editing) {
        await updateDoc(doc(db, "saleCars", editing), { ...form, updatedAt: serverTimestamp() });
      }
      setEditing(null);
    } catch (err: any) {
      alert("Chyba při ukládání: " + err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (car: SaleCar) => {
    if (!confirm(`Opravdu smazat „${car.name}“? Akce je nevratná.`)) return;
    try { await deleteDoc(doc(db, "saleCars", car.id)); } catch (err: any) { alert("Chyba při mazání: " + err.message); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold">Auta k prodeji</h2>
          <p className="text-white/40 text-sm mt-1">Samostatný sklad pro přímý prodej. Na webu: /auta-k-prodeji. Splátkové vozy spravujte v záložce Vozidla.</p>
        </div>
        <button onClick={() => { setForm(EMPTY); setEditing("new"); }} className="bg-gold text-black px-6 py-4 rounded-2xl font-bold hover:bg-white transition-all flex items-center gap-2 shrink-0">
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
              <div className="text-gold font-bold text-lg mb-4">{car.price?.toLocaleString("cs-CZ")} Kč {car.isSold && <span className="text-xs text-red-400 ml-2">PRODÁNO</span>}</div>
              <div className="flex gap-2 mt-auto">
                <button onClick={() => { const { id, ...rest } = car; setForm({ ...EMPTY, ...rest, details: { ...EMPTY.details, ...rest.details } }); setEditing(id); }}
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
                  <input className={input} value={form.details[k]} onChange={(e) => setForm({ ...form, details: { ...form.details, [k]: e.target.value } })} /></label>
              ))}
            </div>
            <label className="space-y-1 block"><span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Popis</span>
              <textarea className={`${input} h-28 resize-none`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
            <label className="space-y-1 block"><span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Výbava</span>
              <textarea className={`${input} h-24 resize-none`} value={form.equipment} onChange={(e) => setForm({ ...form, equipment: e.target.value })} /></label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block p-4 rounded-xl border border-dashed border-white/20 cursor-pointer text-sm text-white/60">
                Hlavní fotka {form.image ? "✔" : ""}<input type="file" accept="image/*" className="sr-only" onChange={(e) => upload(e, "main")} />
              </label>
              <label className="block p-4 rounded-xl border border-dashed border-white/20 cursor-pointer text-sm text-white/60">
                Galerie ({form.gallery.length}) – přidat<input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => upload(e, "gallery")} />
              </label>
            </div>
            {form.gallery.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {form.gallery.map((g, i) => (
                  <button key={i} type="button" onClick={() => setForm({ ...form, gallery: form.gallery.filter((_, j) => j !== i) })} title="Odebrat" className="aspect-square rounded-lg overflow-hidden relative">
                    <img src={g} alt="" className="w-full h-full object-cover" /><span className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center"><Trash2 className="w-4 h-4" /></span>
                  </button>
                ))}
              </div>
            )}
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
