import { cn } from "cn";
import { useAnsicht } from "@/lib/ansicht";
import type { Kapitel } from "@/lib/kapitel";
import type { Ort } from "@/lib/navigation";

/**
 * Rechte Spalte (`wide:`) oder Blatt (`compact:`): Abschnitte des Kapitels
 * und darunter eingerückt seine Ergänzungen mit rotem Punkt; der Abschnitt,
 * in dem man liest, schwarz mit eigener Linie. Im Blatt steht der Titel im
 * Kopf des Blatts, und die Zeilen sind für den Finger höher.
 */
export function AufDieserSeite({
  kapitel,
  aktiv,
  onGehe,
  imBlatt = false,
}: {
  kapitel: Kapitel;
  aktiv?: string;
  onGehe: (ort: Ort) => void;
  imBlatt?: boolean;
}) {
  const { mitErgaenzungen } = useAnsicht();
  const eintraege = kapitel.gliederung.filter((g) => mitErgaenzungen || !g.ergaenzung);
  if (!eintraege.length) return null;
  return (
    <nav aria-label="Auf dieser Seite" className="text-sm">
      {!imBlatt && <h2 className="mb-3 font-medium">Auf dieser Seite</h2>}
      <ul className="flex flex-col border-l">
        {eintraege.map((g) => (
          <li key={g.id}>
            <button
              type="button"
              aria-current={aktiv === g.id ? "location" : undefined}
              className={cn(
                "-ml-px flex w-full items-center gap-2 border-l text-left leading-5 transition-colors hover:text-foreground",
                imBlatt ? "min-h-10 py-2" : "py-1",
                g.ergaenzung ? "pl-6" : g.tiefe > 2 ? "pl-6" : "pl-3",
                aktiv === g.id
                  ? "border-foreground font-medium text-foreground"
                  : "border-transparent text-muted-foreground",
              )}
              onClick={() => onGehe({ kapitel: kapitel.schluessel, abschnitt: g.id })}
            >
              {g.ergaenzung && (
                <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-red" />
              )}
              {g.ergaenzung && <span className="sr-only">Ergänzung:</span>}
              {g.titel}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
