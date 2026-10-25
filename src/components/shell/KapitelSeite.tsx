import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FRAGENSEITE, KAPITEL, SEITEN, nummerUndTitel, type Seite } from "@/lib/kapitel";
import { useAnsicht } from "@/lib/ansicht";
import type { Ort } from "@/lib/navigation";
import { komponenten } from "@/primitiven";
import { ErgaenzungBadge, FragenseiteContext } from "@/primitiven/ergaenzungen";

const ortVon = (s: Seite): Ort => ({
  kapitel: s.kapitel.schluessel,
  abschnitt: s.fragen ? FRAGENSEITE : undefined,
});

/** Die Kapitelnummer als Badge „Kapitel 2 / 3“, Zahlen in Geist Mono. */
export function KapitelBadge({ seite }: { seite: Seite }) {
  return (
    <Badge variant="outline">
      Kapitel{" "}
      <span className="font-mono">
        {KAPITEL.indexOf(seite.kapitel) + 1} / {KAPITEL.length}
      </span>
    </Badge>
  );
}

/**
 * Eine Seite: ein Kapitel (der Text mit seinen Ergänzungen) oder seine
 * Wiederholungsfragen. Darüber eine Zeile zum Original, am Ende „Zurück“
 * und „Weiter“ zu den Nachbarseiten.
 */
export function KapitelSeite({ seite, onGehe }: { seite: Seite; onGehe: (ort: Ort) => void }) {
  const i = SEITEN.indexOf(seite);
  const zurueck = SEITEN[i - 1];
  const weiter = SEITEN[i + 1];
  const { kapitel } = seite;
  const { Inhalt } = kapitel;
  const nummer = nummerUndTitel(kapitel.titel);
  const { mitErgaenzungen } = useAnsicht();
  return (
    <article className="w-full max-w-180 px-4 pt-5 pb-10 compact:px-14 compact:pt-10 compact:pb-18">
      {seite.fragen ? (
        <>
          <p className="flex flex-wrap items-center gap-2.5 text-sm text-muted-foreground">
            <ErgaenzungBadge />
            <span>
              Zu Kapitel {nummer.nummer && <span className="font-mono">{nummer.nummer}</span>}
              {nummer.nummer && " · "}
              {nummer.titel}
            </span>
          </p>
          <h2 className="mt-2 border-b pb-2 text-[26px] leading-8 font-semibold tracking-tight compact:text-3xl compact:leading-9">
            Wiederholungsfragen
          </h2>
          <p className="mt-4 text-base leading-[26px] text-muted-foreground compact:text-lg compact:leading-7">
            Antworte erst selbst, dann vergleiche. Die Fragen stammen nicht aus dem Original.
          </p>
          {mitErgaenzungen ? (
            // Das ganze Kapitel, sichtbar nur der Block der Fragen (`data-fragen`)
            <div className="[&>:not([data-fragen])]:hidden">
              <FragenseiteContext.Provider value={true}>
                <Inhalt components={komponenten} />
              </FragenseiteContext.Provider>
            </div>
          ) : (
            <p className="mt-8 text-sm text-muted-foreground">
              Die Fragen sind Ergänzungen. Unter „Mit Ergänzungen“ stehen sie hier.
            </p>
          )}
        </>
      ) : (
        <>
          <p className="flex flex-wrap items-center gap-2 text-xs leading-5 text-muted-foreground compact:text-sm">
            <span className="compact:hidden">
              <KapitelBadge seite={seite} />
            </span>
            {kapitel.seiten &&
              (kapitel.seiten[0] === kapitel.seiten[1] ? (
                <span>
                  Seite <span className="font-mono">{kapitel.seiten[0]}</span> im Original
                </span>
              ) : (
                <span>
                  Seiten{" "}
                  <span className="font-mono">
                    {kapitel.seiten[0]}–{kapitel.seiten[1]}
                  </span>{" "}
                  im Original
                </span>
              ))}
          </p>
          <Inhalt components={komponenten} />
        </>
      )}
      {(zurueck || weiter) && (
        <nav
          aria-label="Blättern"
          className="mt-12 flex flex-wrap justify-between gap-3 border-t pt-6"
        >
          {zurueck ? (
            <Button variant="outline" onClick={() => onGehe(ortVon(zurueck))}>
              <ChevronLeft aria-hidden />
              <span className="sr-only">Zurück: </span>
              {zurueck.titel}
            </Button>
          ) : (
            <span />
          )}
          {weiter && (
            <Button className="ml-auto" onClick={() => onGehe(ortVon(weiter))}>
              <span className="sr-only">Weiter: </span>
              {weiter.titel}
              <ChevronRight aria-hidden />
            </Button>
          )}
        </nav>
      )}
    </article>
  );
}
