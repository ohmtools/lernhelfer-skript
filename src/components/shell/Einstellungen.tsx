import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ChevronRight, ExternalLink, Eye, Info } from "lucide-react";
import { PanelHeader } from "@/components/ohmtools/panel-header";
import { SettingsDialog, SettingsPage, type SettingsSection } from "@/components/ohmtools/settings";
import { buttonVariants } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { hereinschieben } from "@/lib/bewegung";
import { ERSTELLT, SKRIPT } from "@/lib/kapitel";

// Die Einstellungen wie in den Apps (DESIGN.md, „App shell“, „Settings“, und
// „Reading pages“, „Shell“), aus den geteilten Teilen des Designs: breit der
// Dialog `SettingsDialog`, kompakt die Seite `SettingsPage` an Stelle der
// Ansicht (`EinstellungenSeite`), am Handy im Tab „Einstellungen“ dieselbe
// Liste ohne Pfeil zurück, denn sie ist die Wurzel des Tabs
// (`EinstellungenTab`). Zwei Abschnitte, überall dieselben.

const VORLAGE = "https://github.com/ohmtools/lernhelfer-skript";

const ANSICHTEN = [
  {
    wert: "mit",
    titel: "Mit Ergänzungen",
    text: "Originaltext und alles, was der Lernhelfer ergänzt",
  },
  { wert: "original", titel: "Nur Original", text: "Der Text des Skripts, Wort für Wort" },
];

type AnsichtProps = { mitErgaenzungen: boolean; onChange: (mit: boolean) => void };

/** Die Abschnitte, in Dialog, Seite und Tab dieselben. */
function abschnitte({ mitErgaenzungen, onChange }: AnsichtProps): SettingsSection[] {
  return [
    {
      key: "ansicht",
      icon: Eye,
      label: "Ansicht",
      value: mitErgaenzungen ? "Mit Ergänzungen" : "Nur Original",
      content: <Ansicht mitErgaenzungen={mitErgaenzungen} onChange={onChange} />,
    },
    { key: "ueber", icon: Info, label: "Über dieses Skript", content: <Ueber /> },
  ];
}

/** Breit: ein Dialog bis 1000 × 720, links die Abschnitte, rechts der gewählte. */
export function EinstellungenDialog({
  offen,
  onSchliessen,
  ...ansicht
}: AnsichtProps & { offen: boolean; onSchliessen: () => void }) {
  return (
    <SettingsDialog
      open={offen}
      onClose={onSchliessen}
      title="Einstellungen"
      closeLabel="Einstellungen schließen"
      sections={abschnitte(ansicht)}
    />
  );
}

/**
 * Kompakt: eine Seite an Stelle der Ansicht, über Kopf und Spalten, mit der
 * Liste der Abschnitte, jeder eine Seite eine Ebene tiefer; der Pfeil zurück
 * der Liste schließt die Einstellungen. Wie die Gruppe `Area` des Designs,
 * die das Skript nicht benutzt, weil es kein `AppShell` hat.
 */
export function EinstellungenSeite({
  onSchliessen,
  ...ansicht
}: AnsichtProps & { onSchliessen: () => void }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-background pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]">
      <SettingsPage
        onClose={onSchliessen}
        title="Einstellungen"
        backLabel="Zurück"
        sections={abschnitte(ansicht)}
      />
    </div>
  );
}

/**
 * Am Handy, im Tab „Einstellungen“: die Abschnitte als Zeilen wie in
 * `SettingsPage`, mit dem, was gerade eingestellt ist, jeder eine Seite eine
 * Ebene tiefer mit Pfeil zurück. Die Liste selbst hat keinen, sie ist die
 * Wurzel des Tabs. Die Seite kommt von rechts, zurück von links
 * (`hereinschieben`).
 */
export function EinstellungenTab(ansicht: AnsichtProps) {
  const [schluessel, setSchluessel] = useState<string | null>(null);
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
    if (el) hereinschieben(el, schluessel ? 1 : -1, rahmen);
  }, [schluessel]);

  const liste = abschnitte(ansicht);
  const abschnitt = liste.find((a) => a.key === schluessel);

  return (
    <div ref={seite}>
      {!abschnitt ? (
        <>
          <PanelHeader title="Einstellungen" />
          <nav aria-label="Einstellungen" className="pt-2">
            <ul>
              {liste.map(({ key, icon: Icon, label, value }) => (
                <li key={key} className="group">
                  <button
                    type="button"
                    className="flex h-14 w-full items-center gap-3.5 pl-4 text-left text-[0.9375rem] font-medium outline-none hover:bg-accent focus-visible:bg-accent active:bg-accent"
                    onClick={() => setSchluessel(key)}
                  >
                    <Icon aria-hidden className="size-5 shrink-0 text-muted-foreground" />
                    <span className="flex h-full min-w-0 flex-1 items-center gap-2 border-b pr-4 group-last:border-b-0">
                      <span className="flex-1">{label}</span>
                      {value && (
                        <span className="shrink-0 text-[0.8125rem] font-normal text-muted-foreground">
                          {value}
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
          <PanelHeader
            title={abschnitt.label}
            onBack={() => setSchluessel(null)}
            backLabel="Zurück"
          />
          <div className="flex flex-col divide-y px-4 pb-[env(safe-area-inset-bottom)]">
            {abschnitt.content}
          </div>
        </>
      )}
    </div>
  );
}

function Ansicht({ mitErgaenzungen, onChange }: AnsichtProps) {
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
}

function Ueber() {
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
