import type { ReactNode } from "react";
import { ExternalLink, Info } from "lucide-react";
import { SettingsDialog, SettingsPage, type SettingsSection } from "@/components/ohmtools/settings";
import { buttonVariants } from "@/components/ui/button";
import { ERSTELLT, SKRIPT } from "@/lib/kapitel";

// Die Einstellungen wie in den Apps (DESIGN.md, „App shell“, „Settings“, und
// die Gruppe „Area“ unter „Which group“), aus den geteilten Teilen des
// Designs: breit der Dialog `SettingsDialog`, kompakt und am Handy die Seite
// `SettingsPage` über Kopf und Spalten (`EinstellungenSeite`). Die Ansicht
// „Mit Ergänzungen | Nur Original“ steht nicht hier: Sie ist eine Gruppe
// „View“, Tabs im Kopf und am Handy in der Leiste unten (`AnsichtTabs`).

const VORLAGE = "https://github.com/ohmtools/lernhelfer-skript";

/** Die Abschnitte, im Dialog und auf der Seite dieselben. */
const ABSCHNITTE: SettingsSection[] = [
  { key: "ueber", icon: Info, label: "Über dieses Skript", content: <Ueber /> },
];

/** Breit: ein Dialog bis 1000 × 720, links die Abschnitte, rechts der gewählte. */
export function EinstellungenDialog({
  offen,
  onSchliessen,
}: {
  offen: boolean;
  onSchliessen: () => void;
}) {
  return (
    <SettingsDialog
      open={offen}
      onClose={onSchliessen}
      title="Einstellungen"
      closeLabel="Einstellungen schließen"
      sections={ABSCHNITTE}
    />
  );
}

/**
 * Kompakt und am Handy: eine Seite an Stelle der Ansicht, über Kopf und Spalten, mit der
 * Liste der Abschnitte, jeder eine Seite eine Ebene tiefer; der Pfeil zurück
 * der Liste schließt die Einstellungen. Wie die Gruppe `Area` des Designs,
 * die das Skript nicht benutzt, weil es kein `AppShell` hat.
 */
export function EinstellungenSeite({ onSchliessen }: { onSchliessen: () => void }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-background pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]">
      <SettingsPage
        onClose={onSchliessen}
        title="Einstellungen"
        backLabel="Zurück"
        sections={ABSCHNITTE}
      />
    </div>
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
      <Hinweis>Hell oder dunkel folgt dem Gerät.</Hinweis>
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
