/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Fotky k poptávce výkupu (Firestore `inquiryPhotos`). Načítají se až po kliknutí,
 * aby výpis poptávek zbytečně nečerpal denní limit čtení.
 */

import { useState } from "react";
import { collection, deleteDoc, getDocs, query, where } from "firebase/firestore";
import { Image as ImageIcon } from "lucide-react";
import { db } from "../lib/firebase";

interface Photo {
  id: string;
  index: number;
  data: string;
}

async function loadPhotos(inquiryId: string): Promise<Photo[]> {
  const snap = await getDocs(query(collection(db, "inquiryPhotos"), where("inquiryId", "==", inquiryId)));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as { index: number; data: string }) })).sort((a, b) => a.index - b.index);
}

/** Smaže fotky poptávky (volá se při mazání poptávky). */
export async function deleteInquiryPhotos(inquiryId: string) {
  const snap = await getDocs(query(collection(db, "inquiryPhotos"), where("inquiryId", "==", inquiryId)));
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}

export default function InquiryPhotos({ inquiryId, count }: { inquiryId: string; count: number }) {
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const show = async () => {
    setLoading(true);
    setError("");
    try {
      setPhotos(await loadPhotos(inquiryId));
    } catch (err: any) {
      setError("Fotky se nepodařilo načíst: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!photos) {
    return (
      <div className="mb-4">
        <button
          type="button"
          onClick={show}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-sm font-bold disabled:opacity-50"
        >
          <ImageIcon className="w-4 h-4" /> {loading ? "Načítám…" : `Zobrazit fotky (${count})`}
        </button>
        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
      {photos.map((p, i) => (
        <a key={p.id} href={p.data} target="_blank" rel="noopener" download={`vykup-${inquiryId}-${i + 1}.jpg`} className="aspect-square rounded-lg overflow-hidden block">
          <img src={p.data} alt={`Fotka ${i + 1}`} className="w-full h-full object-cover" />
        </a>
      ))}
      {photos.length < count && <p className="col-span-full text-xs text-white/40">Načteno {photos.length} z {count} fotek.</p>}
    </div>
  );
}
