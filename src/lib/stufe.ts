import { useSyncExternalStore } from "react";

// Die drei Stufen des Designs (DESIGN.md, „App shell“) im Skript, mit genau
// den Abfragen der Varianten `compact:` und `wide:` in `src/index.css`, wie
// zeiteisens `@/lib/media`. Gebraucht, wo das Skript wissen muss, in welchen
// Behälter etwas kommt (Leiste, Blatt, Spalte, Dialog).
export const KOMPAKT = "(width >= 40rem), (height < 600px) and (orientation: landscape)";
export const BREIT = "(width >= 64rem) and (height >= 600px)";

/** Schmal: Handy hochkant. Kompakt: eine Kopfzeile, Panels als Blatt. Breit: drei Spalten. */
export type Stufe = "schmal" | "kompakt" | "breit";

function passt(abfrage: string): boolean {
  try {
    return matchMedia(abfrage).matches;
  } catch {
    return false;
  }
}

function jetzt(): Stufe {
  if (passt(BREIT)) return "breit";
  return passt(KOMPAKT) ? "kompakt" : "schmal";
}

function beobachten(aendern: () => void): () => void {
  let abfragen: MediaQueryList[] = [];
  try {
    abfragen = [matchMedia(BREIT), matchMedia(KOMPAKT)];
  } catch {
    return () => {};
  }
  for (const a of abfragen) a.addEventListener("change", aendern);
  return () => {
    for (const a of abfragen) a.removeEventListener("change", aendern);
  };
}

/** Die Stufe des Fensters, auch wenn es sich dreht oder größer wird. */
export function useStufe(): Stufe {
  return useSyncExternalStore(beobachten, jetzt, () => "breit");
}
