import { cn } from "cn";
import type { Kapitel } from "@/lib/kapitel";
import type { Ort } from "@/lib/navigation";

/** Rechte Spalte: Abschnitte des aktuellen Kapitels, der sichtbare markiert. */
export function AufDieserSeite({
  kapitel,
  aktiv,
  onGehe,
}: {
  kapitel: Kapitel;
  aktiv?: string;
  onGehe: (ort: Ort) => void;
}) {
  if (!kapitel.gliederung.length) return null;
  return (
    <nav aria-label="Auf dieser Seite">
      <p className="mb-3 text-xs font-semibold">Auf dieser Seite</p>
      <ul className="space-y-1">
        {kapitel.gliederung.map((g) => (
          <li key={g.id}>
            <button
              type="button"
              aria-current={aktiv === g.id ? "location" : undefined}
              className={cn(
                "w-full border-l-2 py-0.5 text-left text-xs leading-snug hover:text-foreground",
                g.tiefe > 2 ? "pl-6" : "pl-3",
                aktiv === g.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground",
              )}
              onClick={() => onGehe({ kapitel: kapitel.schluessel, abschnitt: g.id })}
            >
              {g.titel}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
