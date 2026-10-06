/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Lišta „Publikovat změny na web“ v administraci.
 * Web čte auta a články ze souborů vytvořených při buildu (lib/siteData.ts), takže
 * změny z administrace se projeví až po novém buildu na Vercelu. Tlačítko ho spustí
 * přes Deploy Hook. Adresa hooku je ve Firestore `settings/site` (čte jen admin),
 * takže není veřejně v kódu webu.
 */

import { useEffect, useRef, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { CheckCircle2, Loader2, Rocket, Settings2, TriangleAlert } from "lucide-react";
import { db } from "../lib/firebase";

type Status = "idle" | "sending" | "building" | "done" | "error";

const fmt = (iso?: string) =>
  iso ? new Date(iso).toLocaleString("cs-CZ", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

async function fetchBuiltAt(): Promise<string | undefined> {
  try {
    const res = await fetch(`/data/meta.json?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok || !res.headers.get("content-type")?.includes("json")) return undefined;
    return (await res.json()).builtAt;
  } catch {
    return undefined;
  }
}

export default function PublishBar() {
  const [hook, setHook] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [builtAt, setBuiltAt] = useState<string>();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const poll = useRef<number>();

  useEffect(() => {
    getDoc(doc(db, "settings", "site"))
      .then((snap) => setHook((snap.data()?.deployHook as string) || ""))
      .catch(() => setHook(""));
    fetchBuiltAt().then(setBuiltAt);
    return () => window.clearInterval(poll.current);
  }, []);

  const saveHook = async () => {
    const url = draft.trim();
    if (!/^https:\/\/api\.vercel\.com\/v1\/integrations\/deploy\//.test(url)) {
      alert("Vložte adresu Deploy Hooku z Vercelu (začíná https://api.vercel.com/v1/integrations/deploy/…).");
      return;
    }
    try {
      await setDoc(doc(db, "settings", "site"), { deployHook: url }, { merge: true });
      setHook(url);
      setEditing(false);
    } catch (err: any) {
      alert("Uložení se nepovedlo: " + err.message + "\nZkontrolujte, že jsou ve Firebase pravidla pro kolekci settings.");
    }
  };

  const publish = async () => {
    if (!hook) return setEditing(true);
    setStatus("sending");
    setMessage("");
    const before = builtAt;
    try {
      // no-cors: Vercel hook nevrací CORS hlavičky; požadavek se odešle, odpověď jen nevidíme.
      await fetch(hook, { method: "POST", mode: "no-cors" });
    } catch (err: any) {
      setStatus("error");
      setMessage("Nepodařilo se spustit publikování: " + err.message);
      return;
    }
    setStatus("building");
    const started = Date.now();
    window.clearInterval(poll.current);
    poll.current = window.setInterval(async () => {
      const now = await fetchBuiltAt();
      if (now && now !== before) {
        window.clearInterval(poll.current);
        setBuiltAt(now);
        setStatus("done");
      } else if (Date.now() - started > 8 * 60_000) {
        window.clearInterval(poll.current);
        setStatus("error");
        setMessage("Web se do 8 minut neaktualizoval. Podívejte se do Vercelu (Deployments), jestli build neskončil chybou.");
      }
    }, 15_000);
  };

  return (
    <div className="mb-8 rounded-2xl border border-gold/30 bg-gold/5 p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="font-bold text-white">Změny v autech a článcích se na web dostanou až po publikování.</div>
        <div className="text-sm text-white/50">
          Web naposledy aktualizován: <span className="text-white/80">{fmt(builtAt)}</span>
          {status === "building" && <> · <span className="text-gold">probíhá publikování (1–3 min)…</span></>}
          {status === "done" && <> · <span className="text-green-400">hotovo, web je aktuální</span></>}
        </div>
        {status === "error" && <div className="text-sm text-red-400 mt-1 flex items-center gap-1"><TriangleAlert className="w-4 h-4" /> {message}</div>}
        {editing && (
          <div className="mt-3 flex flex-col sm:flex-row gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="https://api.vercel.com/v1/integrations/deploy/…"
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white"
            />
            <button onClick={saveHook} className="px-4 py-2.5 rounded-xl bg-white text-black font-bold text-sm">Uložit</button>
            <button onClick={() => setEditing(false)} className="px-4 py-2.5 rounded-xl bg-white/5 text-white text-sm">Zrušit</button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => { setDraft(hook || ""); setEditing(!editing); }}
          title="Nastavit Deploy Hook"
          className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center"
        >
          <Settings2 className="w-5 h-5 text-white/60" />
        </button>
        <button
          onClick={publish}
          disabled={hook === null || status === "sending" || status === "building"}
          className="h-12 px-5 rounded-xl bg-gold text-black font-bold flex items-center gap-2 disabled:opacity-60"
        >
          {status === "sending" || status === "building" ? <Loader2 className="w-5 h-5 animate-spin" /> : status === "done" ? <CheckCircle2 className="w-5 h-5" /> : <Rocket className="w-5 h-5" />}
          {hook === "" ? "Nastavit publikování" : "Publikovat změny na web"}
        </button>
      </div>
    </div>
  );
}
