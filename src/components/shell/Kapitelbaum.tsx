import { cn } from "cn";
import { KAPITEL } from "@/lib/kapitel";
import type { Ort } from "@/lib/navigation";

// Kapitel des Skripts, beim aktuellen auch seine Abschnitte. Das aktive
// Kapitel und der aktive Abschnitt tragen eine rote Linie (ohmtools-Design:
// aktive Marke in primary, kein gefüllter Knopf).
export function Kapitelbaum({
  ort,
  aktiv,
  onGehe,
}: {
  ort: Ort;
  aktiv?: string;
  onGehe: (ort: Ort) => void;
}) {
  return (
    <ul className="space-y-1 text-sm" aria-label="Kapitel">
      {KAPITEL.map((k) => {
        const offen = k.schluessel === ort.kapitel;
        return (
          <li key={k.schluessel}>
            <button
              type="button"
              aria-current={offen ? "page" : undefined}
              className={cn(
                "w-full border-l-2 py-1 pl-3 text-left leading-snug hover:text-foreground",
                offen
                  ? "border-primary font-semibold text-foreground"
                  : "border-transparent text-muted-foreground",
              )}
              onClick={() => onGehe({ kapitel: k.schluessel })}
            >
              {k.titel}
            </button>
            {offen && k.gliederung.length > 0 && (
              <ul className="mt-1 mb-2 space-y-0.5">
                {k.gliederung.map((g) => (
                  <li key={g.id}>
                    <button
                      type="button"
                      aria-current={aktiv === g.id ? "location" : undefined}
                      className={cn(
                        "w-full border-l-2 py-0.5 text-left text-xs leading-snug hover:text-foreground",
                        g.tiefe > 2 ? "pl-8" : "pl-5",
                        aktiv === g.id
                          ? "border-primary text-foreground"
                          : "border-transparent text-muted-foreground",
                      )}
                      onClick={() => onGehe({ kapitel: k.schluessel, abschnitt: g.id })}
                    >
                      {g.titel}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
