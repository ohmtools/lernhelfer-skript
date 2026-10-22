import { ERSTELLT, SKRIPT } from "@/lib/kapitel";

const OHMTOOLS = "https://github.com/ohmtools";

/** Angaben zum Skript: in den Einstellungen am Handy und im Info-Fenster am Desktop. */
export function Ueber() {
  const zeilen: [string, string | undefined][] = [
    ["Fach", SKRIPT.fach],
    ["Original von", SKRIPT.autor],
    ["Quelle", SKRIPT.quelle],
    ["Umfang", SKRIPT.umfang],
    ["Erstellt am", ERSTELLT],
  ];
  return (
    <div className="space-y-3 text-sm">
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1">
        {zeilen
          .filter(([, w]) => w)
          .map(([k, w]) => (
            <div key={k} className="contents">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="break-words">{w}</dd>
            </div>
          ))}
      </dl>
      <p className="leading-relaxed text-muted-foreground">
        Der Originaltext steht unverändert da. Alles mit roter Linie und „Ergänzung“ hat Claude
        hinzugefügt. Der Originaltext gehört seinem Autor; diese Fassung ist nur für den eigenen
        Gebrauch.
      </p>
      <p className="text-muted-foreground">
        Erstellt mit dem Lernhelfer von{" "}
        <a
          href={OHMTOOLS}
          target="_blank"
          rel="noreferrer"
          className="text-primary underline underline-offset-4"
        >
          OhmTools
        </a>
        .
      </p>
    </div>
  );
}
