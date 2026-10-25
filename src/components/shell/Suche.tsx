import { useMemo, useState, type ReactNode, type Ref } from "react";
import MiniSearch from "minisearch";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAnsicht } from "@/lib/ansicht";
import { FRAGENSEITE, KAPITEL, nummerUndTitel } from "@/lib/kapitel";
import type { Ort } from "@/lib/navigation";
import { ErgaenzungBadge } from "@/primitiven/ergaenzungen";

type Dokument = {
  id: string;
  kapitel: string;
  kapitelTitel: string;
  abschnitt: string;
  titel: string;
  text: string;
  ergaenzung: boolean;
};

// Volltextsuche über alle Kapitel, Original und Ergänzungen getrennt. Der
// Text kommt beim Bauen aus den MDX-Dateien (Export `suchtext`).
function index() {
  const suche = new MiniSearch<Dokument>({
    fields: ["titel", "text"],
    storeFields: ["kapitel", "kapitelTitel", "abschnitt", "titel", "text", "ergaenzung"],
    searchOptions: { prefix: true, fuzzy: 0.15, boost: { titel: 3 }, combineWith: "AND" },
    processTerm: (t) => t.toLowerCase().normalize("NFC"),
  });
  suche.addAll(
    KAPITEL.flatMap((k) =>
      k.suchtext.map((a, i) => ({
        id: `${k.schluessel}/${i}`,
        kapitel: k.schluessel,
        kapitelTitel: k.titel,
        abschnitt: a.id,
        titel: a.titel || k.titel,
        text: a.text,
        ergaenzung: !!a.ergaenzung,
      })),
    ),
  );
  return suche;
}

/** Der Satz um den ersten Treffer, die gefundenen Wörter fett und unterstrichen. */
function Ausschnitt({ text, begriffe }: { text: string; begriffe: string[] }) {
  const klein = text.toLowerCase();
  const pos = Math.max(
    0,
    Math.min(...begriffe.map((b) => klein.indexOf(b)).filter((p) => p >= 0), text.length),
  );
  const start = Math.max(0, pos - 50);
  const stueck =
    (start > 0 ? "…" : "") +
    text.slice(start, start + 140) +
    (start + 140 < text.length ? "…" : "");
  const muster = begriffe.length
    ? new RegExp(
        `(${begriffe.map((b) => b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
        "gi",
      )
    : null;
  if (!muster) return <>{stueck}</>;
  return (
    <>
      {stueck.split(muster).map((teil, i) =>
        i % 2 ? (
          <b key={i} className="font-semibold text-foreground underline underline-offset-2">
            {teil}
          </b>
        ) : (
          teil
        ),
      )}
    </>
  );
}

/**
 * Suchfeld; ohne Anfrage zeigt es `children` (die Kapitel). Ein Treffer
 * nennt den Abschnitt, in Ergänzungen mit dem roten Badge. Bei „Nur
 * Original“ sucht es nur im Original.
 */
export function Suche({
  onGehe,
  feldRef,
  spalte = false,
  children,
}: {
  onGehe: (ort: Ort) => void;
  feldRef?: Ref<HTMLInputElement>;
  /** In der linken Spalte: Suchfeld in einem eigenen Abschnitt mit Linie darunter. */
  spalte?: boolean;
  children?: ReactNode;
}) {
  const suche = useMemo(() => index(), []);
  const { mitErgaenzungen } = useAnsicht();
  const [anfrage, setAnfrage] = useState("");
  const treffer =
    anfrage.trim().length >= 2
      ? suche
          .search(anfrage, mitErgaenzungen ? undefined : { filter: (t) => !t.ergaenzung })
          .slice(0, 20)
      : [];
  return (
    <div>
      <div className={spalte ? "border-b p-4" : undefined}>
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            ref={feldRef}
            type="search"
            enterKeyHint="search"
            aria-label="Im Skript suchen"
            placeholder="Im Skript suchen"
            value={anfrage}
            onChange={(e) => setAnfrage(e.target.value)}
            className="pl-8.5"
          />
        </div>
      </div>
      {anfrage.trim().length < 2 ? (
        <div className={spalte ? "px-2 py-4" : "mt-4"}>{children}</div>
      ) : (
        <ul className={spalte ? "px-2 py-2" : "mt-2"} aria-label="Suchergebnisse">
          {treffer.length === 0 && (
            <li className="py-3 text-sm text-muted-foreground">Nichts gefunden.</li>
          )}
          {treffer.map((t) => {
            const fragen = t.abschnitt === FRAGENSEITE;
            const ort = fragen
              ? `${nummerUndTitel(t.kapitelTitel).nummer ?? ""} Wiederholungsfragen`.trim()
              : t.titel;
            return (
              <li key={t.id} className="border-b last:border-b-0">
                <button
                  type="button"
                  className="w-full rounded-md px-2 py-2.5 text-left text-sm leading-5 text-muted-foreground hover:bg-accent/60"
                  onClick={() => {
                    onGehe({ kapitel: t.kapitel, abschnitt: t.abschnitt || undefined });
                    setAnfrage("");
                  }}
                >
                  <span className="flex items-center gap-2 text-xs">
                    {ort}
                    {t.ergaenzung && <ErgaenzungBadge />}
                  </span>
                  <span className="mt-1 block text-foreground/80">
                    <Ausschnitt text={t.text} begriffe={t.terms} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
