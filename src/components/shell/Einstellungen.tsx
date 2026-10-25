import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ChevronRight, ExternalLink, Eye, Info, X, type LucideIcon } from "lucide-react";
import { PanelKopf } from "@/components/shell/PanelKopf";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { hereinschieben } from "@/lib/bewegung";
import { ERSTELLT, SKRIPT } from "@/lib/kapitel";

// Die Einstellungen wie in den Apps (DESIGN.md, „App shell“, „Settings“, und
// „Reading pages“, „Shell“; zeiteisens `SettingsPage.tsx`): ab `compact:` ein
// Dialog mit den Abschnitten links (`EinstellungenDialog`), am Handy im Tab
// „Einstellungen“ eine Seite mit der Liste der Abschnitte, jeder eine Seite
// für sich (`EinstellungenSeite`). Zwei Abschnitte, überall dieselben.

const VORLAGE = "https://github.com/ohmtools/lernhelfer-skript";

type Abschnitt = "ansicht" | "ueber";

const ABSCHNITTE: readonly { wert: Abschnitt; icon: LucideIcon; titel: string }[] = [
  { wert: "ansicht", icon: Eye, titel: "Ansicht" },
  { wert: "ueber", icon: Info, titel: "Über dieses Skript" },
];

const titelVon = (a: Abschnitt) => ABSCHNITTE.find((x) => x.wert === a)?.titel ?? "";

const ANSICHTEN = [
  {
    wert: "mit",
    titel: "Mit Ergänzungen",
    text: "Originaltext und alles, was der Lernhelfer ergänzt",
  },
  { wert: "original", titel: "Nur Original", text: "Der Text des Skripts, Wort für Wort" },
];

type AnsichtProps = { mitErgaenzungen: boolean; onChange: (mit: boolean) => void };

/** Ab `compact:`: ein Dialog bis 1000 × 720, links die Abschnitte, rechts der gewählte. */
export function EinstellungenDialog({
  offen,
  onSchliessen,
  ...ansicht
}: AnsichtProps & { offen: boolean; onSchliessen: () => void }) {
  // Bleibt beim gewählten Abschnitt, solange die Seite offen ist.
  const [abschnitt, setAbschnitt] = useState<Abschnitt>("ansicht");
  return (
    <Dialog
      open={offen}
      onOpenChange={(neu) => {
        if (!neu) onSchliessen();
      }}
    >
      <DialogContent
        showCloseButton={false}
        // Bis 1000 × 720, mindestens 24 px vom Rand; auf `short:` 12 px über
        // und unter dem Dialog, innerhalb der sicheren Bereiche.
        className="flex h-[min(45rem,calc(100dvh-3rem))] gap-0 overflow-hidden p-0 short:top-[calc(50%+env(safe-area-inset-top)/2-env(safe-area-inset-bottom)/2)] short:h-[calc(100dvh-1.5rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] compact:max-w-[min(62.5rem,calc(100%-3rem-env(safe-area-inset-left)-env(safe-area-inset-right)))] compact:p-0"
      >
        <nav
          aria-label="Einstellungen"
          className="relative flex w-60 shrink-0 flex-col gap-0.5 overflow-y-auto border-r px-3 py-5 short:w-46 short:px-2 short:py-3"
        >
          <DialogTitle className="mb-3.5 px-2.5 pt-1.5 text-base leading-6 font-semibold short:mb-2">
            Einstellungen
          </DialogTitle>
          {ABSCHNITTE.map(({ wert, icon: Icon, titel }) => (
            <Button
              key={wert}
              variant="ghost"
              aria-current={wert === abschnitt ? "page" : undefined}
              className="w-full justify-start px-2.5 aria-[current=page]:bg-accent aria-[current=page]:font-semibold"
              onClick={() => setAbschnitt(wert)}
            >
              <Icon data-icon="inline-start" className="text-muted-foreground" />
              <span>{titel}</span>
            </Button>
          ))}
        </nav>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center justify-between gap-2 pt-5 pr-4 pl-6 short:pt-3 short:pr-2 short:pl-5">
            <h3 className="pt-1.5 text-base leading-6 font-semibold">{titelVon(abschnitt)}</h3>
            <DialogClose
              render={<Button variant="ghost" size="icon" aria-label="Einstellungen schließen" />}
            >
              <X />
            </DialogClose>
          </div>
          <div className="relative flex min-h-0 flex-1 flex-col divide-y overflow-y-auto px-6 short:px-5">
            <AbschnittInhalt abschnitt={abschnitt} {...ansicht} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Am Handy, im Tab „Einstellungen“: die Abschnitte als Zeilen mit dem, was
 * gerade eingestellt ist, jeder eine Seite eine Ebene tiefer mit Pfeil
 * zurück. Die Seite kommt von rechts, zurück von links (`hereinschieben`).
 */
export function EinstellungenSeite(ansicht: AnsichtProps) {
  const [abschnitt, setAbschnitt] = useState<Abschnitt | null>(null);
  const seite = useRef<HTMLDivElement>(null);
  const erstes = useRef(true);
  useLayoutEffect(() => {
    if (erstes.current) {
      erstes.current = false;
      return;
    }
    const el = seite.current;
    const rahmen = el?.closest("main");
    rahmen?.scrollTo({ top: 0 });
    if (el) hereinschieben(el, abschnitt ? 1 : -1, rahmen);
  }, [abschnitt]);

  const wert: Record<Abschnitt, ReactNode> = {
    ansicht: ansicht.mitErgaenzungen ? "Mit Ergänzungen" : "Nur Original",
    ueber: null,
  };

  return (
    <div ref={seite}>
      {abschnitt === null ? (
        <>
          <PanelKopf titel="Einstellungen" />
          <nav aria-label="Einstellungen" className="pt-2">
            <ul>
              {ABSCHNITTE.map(({ wert: a, icon: Icon, titel }) => (
                <li key={a} className="group">
                  <button
                    type="button"
                    className="flex h-14 w-full items-center gap-3.5 pl-4 text-left text-sm font-medium outline-none hover:bg-accent focus-visible:bg-accent active:bg-accent"
                    onClick={() => setAbschnitt(a)}
                  >
                    <Icon aria-hidden className="size-5 shrink-0 text-muted-foreground" />
                    <span className="flex h-full min-w-0 flex-1 items-center gap-2 border-b pr-4 group-last:border-b-0">
                      <span className="flex-1">{titel}</span>
                      {wert[a] && (
                        <span className="shrink-0 text-xs font-normal text-muted-foreground">
                          {wert[a]}
                        </span>
                      )}
                      <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </>
      ) : (
        <>
          <PanelKopf titel={titelVon(abschnitt)} onZurueck={() => setAbschnitt(null)} />
          <div className="flex flex-col divide-y px-4 pb-[env(safe-area-inset-bottom)]">
            <AbschnittInhalt abschnitt={abschnitt} {...ansicht} />
          </div>
        </>
      )}
    </div>
  );
}

/** Der Inhalt eines Abschnitts, in Dialog und Seite derselbe. */
function AbschnittInhalt({
  abschnitt,
  mitErgaenzungen,
  onChange,
}: AnsichtProps & { abschnitt: Abschnitt }) {
  if (abschnitt === "ansicht")
    return (
      <Gruppe>
        <RadioGroup
          aria-label="Ansicht"
          className="gap-2.5"
          value={mitErgaenzungen ? "mit" : "original"}
          onValueChange={(wert) => onChange(wert === "mit")}
        >
          {ANSICHTEN.map((a) => (
            <label key={a.wert} className="flex cursor-pointer items-start gap-2.5">
              <RadioGroupItem value={a.wert} className="mt-0.5" />
              <span>
                <span className="block font-medium">{a.titel}</span>
                <span className="block text-muted-foreground">{a.text}</span>
              </span>
            </label>
          ))}
        </RadioGroup>
        <Hinweis>Hell oder dunkel folgt dem Gerät.</Hinweis>
      </Gruppe>
    );

  const datei = SKRIPT.quelle?.split("/").at(-1);
  const zeilen: [string, string | undefined, boolean][] = [
    ["Fach", SKRIPT.fach, false],
    ["Original von", SKRIPT.autor, false],
    ["Original", datei, true],
    ["Umfang", SKRIPT.umfang, false],
    ["Erstellt", ERSTELLT, true],
  ];
  return (
    <Gruppe>
      <p className="font-medium">{SKRIPT.titel}</p>
      <table className="w-full border-collapse">
        <tbody>
          {zeilen
            .filter(([, w]) => w)
            .map(([k, w, mono]) => (
              <tr key={k} className="border-b last:border-b-0">
                <th scope="row" className="h-9 pr-4 text-left font-normal text-muted-foreground">
                  {k}
                </th>
                <td className={mono ? "text-right font-mono text-xs" : "text-right"}>{w}</td>
              </tr>
            ))}
        </tbody>
      </table>
      <Hinweis>
        Der Originaltext steht Wort für Wort da; alles mit dem roten Badge „Ergänzung“ hat der
        Lernhelfer hinzugefügt. Der Originaltext gehört seinem Autor, diese Fassung ist nur für den
        eigenen Gebrauch.
      </Hinweis>
      <a
        href={VORLAGE}
        target="_blank"
        rel="noreferrer"
        className={buttonVariants({ variant: "outline", size: "sm", className: "w-fit" })}
      >
        <ExternalLink aria-hidden />
        Vorlage auf GitHub
      </a>
    </Gruppe>
  );
}

/** Eine Gruppe in einem Abschnitt; Linien zwischen Gruppen, 24 px darum (wie zeiteisen). */
function Gruppe({ children }: { children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 py-6 first:pt-2 compact:first:pt-4">{children}</section>
  );
}

function Hinweis({ children }: { children: ReactNode }) {
  return <p className="text-xs text-muted-foreground">{children}</p>;
}
