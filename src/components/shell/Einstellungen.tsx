import { ExternalLink, X } from "lucide-react";
import { cn } from "cn";
import { Button, buttonVariants } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ERSTELLT, SKRIPT } from "@/lib/kapitel";
import { RAND_X } from "@/lib/rand";

const VORLAGE = "https://github.com/ohmtools/lernhelfer-skript";

const ANSICHTEN = [
  {
    wert: "mit",
    titel: "Mit Ergänzungen",
    text: "Originaltext und alles, was der Lernhelfer ergänzt",
  },
  { wert: "original", titel: "Nur Original", text: "Der Text des Skripts, Wort für Wort" },
];

/**
 * Panel „Einstellungen“: am Desktop an Stelle von „Auf dieser Seite“, am
 * Handy der Tab. Abschnitte durch Linien getrennt (DESIGN.md, „Settings
 * panel“).
 */
export function Einstellungen({
  mitErgaenzungen,
  onChange,
  onSchliessen,
}: {
  mitErgaenzungen: boolean;
  onChange: (mit: boolean) => void;
  onSchliessen?: () => void;
}) {
  const datei = SKRIPT.quelle?.split("/").at(-1);
  const zeilen: [string, string | undefined, boolean][] = [
    ["Fach", SKRIPT.fach, false],
    ["Original von", SKRIPT.autor, false],
    ["Original", datei, true],
    ["Umfang", SKRIPT.umfang, false],
    ["Erstellt", ERSTELLT, true],
  ];
  return (
    <div className="text-sm">
      {onSchliessen && (
        <div className="flex h-14 items-center justify-between border-b px-6">
          <h2 className="text-base font-semibold">Einstellungen</h2>
          <Button
            variant="ghost"
            size="icon-sm"
            className="-mr-2 text-muted-foreground"
            aria-label="Einstellungen schließen"
            onClick={onSchliessen}
          >
            <X />
          </Button>
        </div>
      )}
      <section className={cn("border-b py-4 compact:py-6", RAND_X)}>
        <h3 id="einstellungen-ansicht" className="font-medium">
          Ansicht
        </h3>
        <RadioGroup
          aria-labelledby="einstellungen-ansicht"
          className="mt-3 gap-2.5"
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
      </section>
      <section className={cn("border-b py-4 compact:py-6", RAND_X)}>
        <h3 className="font-medium">Darstellung</h3>
        <p className="mt-2 text-muted-foreground">Hell oder dunkel folgt dem Gerät.</p>
      </section>
      <section className={cn("py-4 compact:py-6", RAND_X)}>
        <h3 className="font-medium">Über dieses Skript</h3>
        <p className="mt-1 font-medium">{SKRIPT.titel}</p>
        <table className="mt-2 w-full border-collapse">
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
        <p className="mt-3 text-muted-foreground">
          Der Originaltext steht Wort für Wort da; alles mit dem roten Badge „Ergänzung“ hat der
          Lernhelfer hinzugefügt. Der Originaltext gehört seinem Autor, diese Fassung ist nur für
          den eigenen Gebrauch.
        </p>
        <a
          href={VORLAGE}
          target="_blank"
          rel="noreferrer"
          className={buttonVariants({ variant: "outline", size: "sm", className: "mt-4" })}
        >
          <ExternalLink aria-hidden />
          Vorlage auf GitHub
        </a>
      </section>
    </div>
  );
}
