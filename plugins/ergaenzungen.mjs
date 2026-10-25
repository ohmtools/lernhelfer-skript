// Die einzige Liste der Markierungen. Webseite (remark-skript.mjs), Prüfung
// des Wortlauts (scripts/wortlaut.mjs), Umwandlung (scripts/mdx.mjs) und
// Tests lesen sie von hier; ANLEITUNG.md beschreibt dieselben Namen.

// Alles, was Claude ergänzt. Text darin gehört nicht zum Original.
// `label`: was das Label in eckigen Klammern ist ("titel" als Text,
// "frage" als formatierter Inhalt), `attribute`: erlaubte {…}-Angaben,
// `titel`: Name in „Auf dieser Seite“, wenn das Label keinen gibt.
export const ERGAENZUNGEN = {
  anmerkung: {
    art: "containerDirective",
    komponente: "Anmerkung",
    label: "titel",
    titel: "Anmerkung",
  },
  variablen: {
    art: "containerDirective",
    komponente: "Variablen",
    label: "titel",
    titel: "Variablen",
  },
  denkanstoss: {
    art: "containerDirective",
    komponente: "Denkanstoss",
    label: "frage",
    titel: "Denkanstoß",
  },
  grafik: { art: "containerDirective", komponente: "Grafik", label: "titel", titel: "Grafik" },
  interaktiv: {
    art: "containerDirective",
    komponente: "Interaktiv",
    label: "titel",
    titel: "Interaktiv",
  },
  frage: { art: "containerDirective", komponente: "Frage", label: "frage", gruppe: true },
  auswahl: { art: "containerDirective", komponente: "Auswahlfrage", label: "frage", gruppe: true },
  rechnen: {
    art: "containerDirective",
    komponente: "Rechenfrage",
    label: "frage",
    gruppe: true,
    attribute: ["ergebnis", "toleranz", "einheit"],
  },
  anm: { art: "textDirective", komponente: "AnmInline" },
};

// Marken gehören weder zum Original noch zu den Ergänzungen: `::seite[12]`
// zeigt, wo im Original-PDF eine Seite beginnt.
export const MARKEN = {
  seite: { art: "leafDirective", komponente: "Seite" },
};

// Blöcke des Originals: Ihr Text gehört zum Original. `:::abbildung[Gemeinsame
// Bildunterschrift]` fasst Teilbilder (a), (b) … mit eigenen Unterschriften
// zusammen.
export const BLOECKE = {
  abbildung: { art: "containerDirective", komponente: "Abbildungen" },
};

// Aufeinanderfolgende Fragen fasst die Webseite zu einem Block zusammen. Sie
// stehen auf einer eigenen Seite nach dem Kapitel, Adresse
// `#/{kapitel}/wiederholungsfragen`.
export const FRAGENGRUPPE = "Fragen";
export const FRAGENSEITE = "wiederholungsfragen";

// Nur in diesen Ergänzungen dürfen JSX-Bausteine stehen.
export const CONTAINER = ["grafik", "interaktiv"];
