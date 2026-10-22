import { renderToString } from "react-dom/server";
import { AnsichtContext } from "@/lib/ansicht";
import { KAPITEL } from "@/lib/kapitel";
import { komponenten } from "@/primitiven";

// Nur für `npm run pruefen`: rendert jedes Kapitel auf dem Server, damit
// fehlende Bausteine und Fehler in Funktionen auffallen, bevor die Seite
// jemand öffnet. Gehört nicht zur Webseite.
export function kapitelRendern() {
  return KAPITEL.map((k) => {
    try {
      const html = renderToString(
        <AnsichtContext.Provider value={{ mitErgaenzungen: true }}>
          <k.Inhalt components={komponenten} />
        </AnsichtContext.Provider>,
      );
      return { kapitel: k.schluessel, titel: k.titel, ok: true as const, laenge: html.length };
    } catch (fehler) {
      return {
        kapitel: k.schluessel,
        titel: k.titel,
        ok: false as const,
        fehler: (fehler as Error).message,
      };
    }
  });
}
