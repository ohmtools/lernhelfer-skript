import { useMemo, useState, type ReactNode } from "react";
import MiniSearch from "minisearch";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { KAPITEL } from "@/lib/kapitel";
import type { Ort } from "@/lib/navigation";

type Dokument = {
  id: string;
  kapitel: string;
  kapitelTitel: string;
  abschnitt: string;
  titel: string;
  text: string;
};

// Volltextsuche über alle Kapitel, Original und Ergänzungen. Der Text kommt
// beim Bauen aus den MDX-Dateien (Export `suchtext`).
function index() {
  const suche = new MiniSearch<Dokument>({
    fields: ["titel", "text"],
    storeFields: ["kapitel", "kapitelTitel", "abschnitt", "titel", "text"],
    searchOptions: { prefix: true, fuzzy: 0.15, boost: { titel: 3 }, combineWith: "AND" },
    processTerm: (t) => t.toLowerCase().normalize("NFC"),
  });
  suche.addAll(
    KAPITEL.flatMap((k) =>
      k.suchtext.map((a, i) => ({
        id: `${k.schluessel}/${a.id || i}`,
        kapitel: k.schluessel,
        kapitelTitel: k.titel,
        abschnitt: a.id,
        titel: a.titel || k.titel,
        text: a.text,
      })),
    ),
  );
  return suche;
}

function ausschnitt(text: string, begriffe: string[]) {
  const klein = text.toLowerCase();
  const pos = Math.max(
    0,
    Math.min(...begriffe.map((b) => klein.indexOf(b)).filter((p) => p >= 0), text.length),
  );
  const start = Math.max(0, pos - 40);
  return (
    (start > 0 ? "…" : "") + text.slice(start, start + 120) + (start + 120 < text.length ? "…" : "")
  );
}

/** Suchfeld; ohne Anfrage zeigt es `children` (den Kapitelbaum). */
export function Suche({ onGehe, children }: { onGehe: (ort: Ort) => void; children?: ReactNode }) {
  const suche = useMemo(() => index(), []);
  const [anfrage, setAnfrage] = useState("");
  const treffer = anfrage.trim().length >= 2 ? suche.search(anfrage).slice(0, 20) : [];
  return (
    <div>
      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-0 size-3.5 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="text"
          enterKeyHint="search"
          aria-label="Im Skript suchen"
          placeholder="Im Skript suchen"
          value={anfrage}
          onChange={(e) => setAnfrage(e.target.value)}
          className="pl-6"
        />
      </div>
      {anfrage.trim().length < 2 ? (
        <div className="mt-6">{children}</div>
      ) : (
        <ul className="mt-4 space-y-3" aria-label="Suchergebnisse">
          {treffer.length === 0 && (
            <li className="text-sm text-muted-foreground">Nichts gefunden.</li>
          )}
          {treffer.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                className="w-full text-left text-sm hover:text-primary"
                onClick={() => {
                  onGehe({ kapitel: t.kapitel, abschnitt: t.abschnitt || undefined });
                  setAnfrage("");
                }}
              >
                <span className="block font-medium">{t.titel}</span>
                {t.titel !== t.kapitelTitel && (
                  <span className="block text-xs text-muted-foreground">{t.kapitelTitel}</span>
                )}
                <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                  {ausschnitt(t.text, t.terms)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
