import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import { KAPITEL, SKRIPT, type Kapitel } from "@/lib/kapitel";
import type { Ort } from "@/lib/navigation";
import { komponenten } from "@/primitiven";

/** Ein Kapitel mit Hinweis zum Original oben und „Zurück/Weiter“ unten. */
export function KapitelSeite({
  kapitel,
  mitErgaenzungen,
  onGehe,
}: {
  kapitel: Kapitel;
  mitErgaenzungen: boolean;
  onGehe: (ort: Ort) => void;
}) {
  const i = KAPITEL.indexOf(kapitel);
  const zurueck = KAPITEL[i - 1];
  const weiter = KAPITEL[i + 1];
  const { Inhalt } = kapitel;
  return (
    <article className="mx-auto w-full max-w-[44rem] px-6 py-6">
      <p className="mb-6 border-b pb-6 text-xs leading-relaxed text-muted-foreground">
        {SKRIPT.titel}
        {kapitel.seiten &&
          (kapitel.seiten[0] === kapitel.seiten[1]
            ? ` · Seite ${kapitel.seiten[0]} im Original`
            : ` · Seiten ${kapitel.seiten[0]}–${kapitel.seiten[1]} im Original`)}
        <br />
        {mitErgaenzungen
          ? "Der Originaltext steht unverändert da. Ergänzungen von Claude tragen eine rote Linie links."
          : "Nur der Originaltext. Die Ergänzungen sind ausgeblendet."}
      </p>
      <Inhalt components={komponenten} />
      {(zurueck || weiter) && (
        <nav aria-label="Kapitel blättern" className="mt-10 grid grid-cols-2 gap-4 border-t pt-6">
          {zurueck ? (
            <button
              type="button"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-auto flex-col items-start gap-1 py-3 text-left whitespace-normal",
              )}
              onClick={() => onGehe({ kapitel: zurueck.schluessel })}
            >
              <span className="flex items-center gap-1 text-muted-foreground">
                <ChevronLeft aria-hidden /> Zurück
              </span>
              <span className="text-sm font-medium">{zurueck.titel}</span>
            </button>
          ) : (
            <span />
          )}
          {weiter && (
            <button
              type="button"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "col-start-2 h-auto flex-col items-end gap-1 py-3 text-right whitespace-normal",
              )}
              onClick={() => onGehe({ kapitel: weiter.schluessel })}
            >
              <span className="flex items-center gap-1 text-muted-foreground">
                Weiter <ChevronRight aria-hidden />
              </span>
              <span className="text-sm font-medium">{weiter.titel}</span>
            </button>
          )}
        </nav>
      )}
    </article>
  );
}
