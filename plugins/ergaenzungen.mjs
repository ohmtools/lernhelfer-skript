// Die einzige Liste der Markierungen. Webseite (remark-skript.mjs), Prüfung
// des Wortlauts (scripts/wortlaut.mjs), Umwandlung (scripts/mdx.mjs) und
// Tests lesen sie von hier; ANLEITUNG.md beschreibt dieselben Namen.

// Alles, was Claude ergänzt. Text darin gehört nicht zum Original.
// `label`: was das Label in eckigen Klammern ist ("titel" als Text,
// "frage" als formatierter Inhalt), `attribute`: erlaubte {…}-Angaben.
export const ERGAENZUNGEN = {
  anmerkung: { art: "containerDirective", komponente: "Anmerkung", label: "titel" },
  variablen: { art: "containerDirective", komponente: "Variablen", label: "titel" },
  denkanstoss: { art: "containerDirective", komponente: "Denkanstoss", label: "frage" },
  grafik: { art: "containerDirective", komponente: "Grafik", label: "titel" },
  interaktiv: { art: "containerDirective", komponente: "Interaktiv", label: "titel" },
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

// Aufeinanderfolgende Fragen fasst die Webseite zu einem Block zusammen.
export const FRAGENGRUPPE = "Fragen";

// Nur in diesen Ergänzungen dürfen JSX-Bausteine stehen.
export const CONTAINER = ["grafik", "interaktiv"];
