import type { ComponentType } from "react";
import type { MDXProps } from "mdx/types";
import skriptJson from "@/inhalt/skript.json";

export type Gliederungseintrag = { tiefe: number; titel: string; id: string };
export type Suchabschnitt = { id: string; titel: string; text: string };

export type Kapitel = {
  /** Dateiname ohne Endung, z.B. `01-grundbegriffe`; Teil der Adresse. */
  schluessel: string;
  titel: string;
  gliederung: Gliederungseintrag[];
  seiten: [number, number] | null;
  suchtext: Suchabschnitt[];
  Inhalt: ComponentType<MDXProps>;
};

type Modul = {
  default: ComponentType<MDXProps>;
  titel: string;
  gliederung: Gliederungseintrag[];
  seiten: [number, number] | null;
  suchtext: Suchabschnitt[];
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
