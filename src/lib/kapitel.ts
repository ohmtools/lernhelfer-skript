import type { ComponentType } from "react";
import type { MDXProps } from "mdx/types";
import skriptJson from "@/inhalt/skript.json";

/** Abschnitt (`tiefe` 2, 3 …) oder Ergänzung als Block (`ergaenzung`, `tiefe` 0). */
export type Gliederungseintrag = {
  tiefe: number;
  titel: string;
  id: string;
  ergaenzung?: boolean;
};
/** Text eines Abschnitts für die Suche, Original und Ergänzungen getrennt. */
export type Suchabschnitt = { id: string; titel: string; text: string; ergaenzung?: boolean };

export type Kapitel = {
  /** Dateiname ohne Endung, z.B. `01-grundbegriffe`; Teil der Adresse. */
  schluessel: string;
  titel: string;
  gliederung: Gliederungseintrag[];
  seiten: [number, number] | null;
  suchtext: Suchabschnitt[];
  /** Zahl der Wiederholungsfragen; mit Fragen folgt dem Kapitel ihre Seite. */
  fragen: number;
  Inhalt: ComponentType<MDXProps>;
};

type Modul = {
  default: ComponentType<MDXProps>;
  titel: string;
  gliederung: Gliederungseintrag[];
  seiten: [number, number] | null;
  suchtext: Suchabschnitt[];
  fragen: number;
};

// Jedes .mdx in src/inhalt ist ein Kapitel, sortiert nach Dateiname
// (01-…, 02-…). Alle sind in der einen HTML-Datei, gezeigt wird eins.
const module = import.meta.glob<Modul>("/src/inhalt/*.mdx", { eager: true });

export const KAPITEL: Kapitel[] = Object.entries(module)
  .sort(([a], [b]) => a.localeCompare(b, "de", { numeric: true }))
  .map(([pfad, m]) => ({
    schluessel: pfad.replace(/^.*\//, "").replace(/\.mdx$/, ""),
    titel: m.titel,
    gliederung: m.gliederung,
    seiten: m.seiten,
    suchtext: m.suchtext,
    fragen: m.fragen,
    Inhalt: m.default,
  }));

export type Skript = {
  titel: string;
  fach?: string;
  autor?: string;
  quelle?: string;
  umfang?: string;
};

export const SKRIPT: Skript = skriptJson;
export const ERSTELLT = __ERSTELLT__;

/** Adresse der Seite mit den Wiederholungsfragen: `#/{kapitel}/wiederholungsfragen`. */
export const FRAGENSEITE = "wiederholungsfragen";

/** „2 Das RC-Glied“ → Nummer „2“ und Titel „Das RC-Glied“; ohne Nummer nur der Titel. */
export function nummerUndTitel(text: string): { nummer?: string; titel: string } {
  const m = /^(\d+(?:\.\d+)*)\.?\s+(.+)$/.exec(text);
  return m ? { nummer: m[1], titel: m[2] } : { titel: text };
}

/** Eine Seite der Webseite: ein Kapitel oder seine Wiederholungsfragen. */
export type Seite = { kapitel: Kapitel; fragen: boolean; titel: string };

export const SEITEN: Seite[] = KAPITEL.flatMap((k) => [
  { kapitel: k, fragen: false, titel: nummerUndTitel(k.titel).titel },
  ...(k.fragen ? [{ kapitel: k, fragen: true, titel: "Wiederholungsfragen" }] : []),
]);
