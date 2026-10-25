import { cn } from "cn";
import { ErgaenzungBadge } from "@/primitiven/ergaenzungen";
import { FRAGENSEITE, KAPITEL, nummerUndTitel } from "@/lib/kapitel";
import type { Ort } from "@/lib/navigation";

// Kapitel als Knöpfe wie in shadcns Sidebar (DESIGN.md, „Reading pages“):
// Nummer klein in Geist Mono, das offene Kapitel mit `accent` gefüllt,
// darunter seine Abschnitte ohne Nummer und die Wiederholungsfragen mit dem
// roten Badge. Am Handy (`gross`) 44 px hohe Zeilen.
export function Kapitelbaum({
  ort,
  aktiv,
  onGehe,
  gross = false,
}: {
  ort: Ort;
  aktiv?: string;
  onGehe: (ort: Ort) => void;
  gross?: boolean;
}) {
  const knopf = cn(
    "flex w-full items-center gap-2.5 rounded-md px-2 text-left text-sm text-muted-foreground hover:bg-accent/60 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
    gross ? "min-h-11" : "min-h-8",
  );
  return (
    <nav aria-label="Kapitel">
      <p className="px-2 pb-1.5 text-xs font-medium text-muted-foreground">Kapitel</p>
      <ul className="flex flex-col gap-0.5">
        {KAPITEL.map((k) => {
          const offen = k.schluessel === ort.kapitel;
          const { nummer, titel } = nummerUndTitel(k.titel);
          const abschnitte = k.gliederung.filter((g) => !g.ergaenzung && g.tiefe === 2);
          const fragen = offen && ort.abschnitt === FRAGENSEITE;
          return (
            <li key={k.schluessel}>
              <button
                type="button"
                aria-current={offen && !fragen ? "page" : undefined}
                className={cn(
                  knopf,
                  offen && !fragen && "bg-accent font-medium text-foreground",
                  offen && fragen && "font-medium text-foreground",
                )}
                onClick={() => onGehe({ kapitel: k.schluessel })}
              >
                <span className="w-3.5 shrink-0 font-mono text-xs">{nummer}</span>
                <span className="py-1.5">{titel}</span>
              </button>
              {offen && (abschnitte.length > 0 || k.fragen > 0) && (
                <ul className="mt-0.5 flex flex-col gap-0.5">
                  {abschnitte.map((g) => (
                    <li key={g.id}>
                      <button
                        type="button"
                        aria-current={!fragen && aktiv === g.id ? "location" : undefined}
                        className={cn(
                          knopf,
                          "pl-8",
                          !fragen && aktiv === g.id && "text-foreground",
                        )}
                        onClick={() => onGehe({ kapitel: k.schluessel, abschnitt: g.id })}
                      >
                        <span className="py-1.5">{nummerUndTitel(g.titel).titel}</span>
                      </button>
                    </li>
                  ))}
                  {k.fragen > 0 && (
                    <li>
                      <button
                        type="button"
                        aria-current={fragen ? "page" : undefined}
                        className={cn(
                          knopf,
                          "justify-between pl-8",
                          fragen && "bg-accent font-medium text-foreground",
                        )}
                        onClick={() => onGehe({ kapitel: k.schluessel, abschnitt: FRAGENSEITE })}
                      >
                        <span className="py-1.5">Wiederholungsfragen</span>
                        <ErgaenzungBadge />
                      </button>
                    </li>
                  )}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
