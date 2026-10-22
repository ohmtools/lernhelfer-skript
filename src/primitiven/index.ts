import type { MDXComponents } from "mdx/types";
import * as prosa from "@/primitiven/prosa";
import {
  Anmerkung,
  AnmInline,
  Antwort,
  Denkanstoss,
  Fragen,
  Fragetext,
  Grafik,
  Interaktiv,
  Variablen,
} from "@/primitiven/ergaenzungen";
import { Auswahlfrage, Frage, Option, Optionen, Rechenfrage } from "@/primitiven/fragen";
import { Funktionsgraph, Kurve, Punkt, Zeiger, Zeigerdiagramm } from "@/primitiven/graph";
import { Regler, Wert } from "@/primitiven/regler";
import * as schaltung from "@/primitiven/schaltung";
import { Formel, Tex } from "@/primitiven/Tex";
import { Zeitdiagramm } from "@/primitiven/zeitdiagramm";
import { Beschriftung, Kreis, Linie, Pfeil, Rechteck, Zeichnung } from "@/primitiven/zeichnung";

// Alle Komponenten, die ein Kapitel benutzen darf. Jedes Kapitel bekommt
// diese Liste; fehlt ein Name, bricht MDX mit einer Meldung ab, statt ihn
// still als HTML-Element zu setzen. ANLEITUNG.md beschreibt jeden Baustein.
const { Schaltung, ...schaltzeichen } = schaltung;

export const komponenten = {
  ...prosa,
  Formel,
  // Ergänzungen (plugins/ergaenzungen.mjs)
  Anmerkung,
  AnmInline,
  Variablen,
  Denkanstoss,
  Grafik,
  Interaktiv,
  Fragen,
  Frage,
  Fragetext,
  Antwort,
  Auswahlfrage,
  Optionen,
  Option,
  Rechenfrage,
  // Bausteine in :::grafik und :::interaktiv
  Tex,
  Zeichnung,
  Linie,
  Pfeil,
  Kreis,
  Rechteck,
  Beschriftung,
  Schaltung,
  ...schaltzeichen,
  Funktionsgraph,
  Kurve,
  Punkt,
  Zeigerdiagramm,
  Zeiger,
  Zeitdiagramm,
  Regler,
  Wert,
} satisfies MDXComponents;
