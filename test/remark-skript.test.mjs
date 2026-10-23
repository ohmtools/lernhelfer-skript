import assert from "node:assert/strict";
import { test } from "node:test";
import { lesen, originalWoerter } from "../plugins/original.mjs";
import { visit } from "unist-util-visit";
import { zuMdx } from "../scripts/mdx.mjs";

const woerter = (text, endung = ".md") =>
  originalWoerter(`probe${endung}`, { inhalt: text }).map((w) => w.text);

test("„10:30“ und „Port:A“ bleiben Original", () => {
  assert.deepEqual(woerter("Um 10:30 liegt Port:A an."), [
    "Um",
    "10",
    ":",
    "30",
    "liegt",
    "Port",
    ":",
    "A",
    "an",
    ".",
  ]);
});

test("Text in Ergänzungen gehört nicht zum Original, Bildunterschriften schon", () => {
  const md =
    "Vorher.\n\n:::anmerkung[Titel]\nErklärung.\n:::\n\n![Abb. 1: Bild](bilder/a.png)\n\nSatz:anm[Hinweis] Ende.";
  assert.deepEqual(woerter(md), ["Vorher", ".", "Abb", ".", "1", ":", "Bild", "Satz", "Ende", "."]);
});

test("unbekannte Markierung und JSX außerhalb von Grafiken brechen ab", () => {
  assert.throws(() => lesen("a.md", ":::foo\nx\n:::"), /Unbekannte Markierung „:::foo“/);
  assert.throws(() => lesen("a.mdx", "Text <Widerstand />"), /JSX und \{…\} nur in :::grafik/);
  assert.doesNotThrow(() => lesen("a.mdx", ":::grafik\n<Widerstand />\n:::"));
});

test("Fragen brauchen Frage und Lösung", () => {
  assert.throws(() => lesen("a.md", ":::frage\nLösung\n:::"), /braucht die Frage/);
  assert.throws(
    () => lesen("a.md", ":::auswahl[F?]\n- a\n- b\n:::"),
    /ohne Liste mit \[ \] und \[x\]/,
  );
  assert.throws(
    () => lesen("a.md", ":::rechnen[F?]{toleranz=1}\nWeg\n:::"),
    /braucht \{ergebnis=…\}/,
  );
});

test("Seiten aufsteigend, Formeln ohne Farben", () => {
  assert.throws(() => lesen("a.md", "::seite[3]\n\n::seite[2]"), /Seiten aufsteigend/);
  assert.throws(() => lesen("a.md", "$\\color{red}x$"), /ohne \\color/);
});

test("Umwandlung nach MDX maskiert { } < im Text, nicht in Formeln und Code", () => {
  const md = "Menge {1, 2} und a < b, $\\{x\\}$, `a<b`, <https://example.org>\n\n<!-- weg -->\n";
  const mdx = zuMdx(md);
  assert.match(
    mdx,
    /Menge \\\{1, 2\\\} und a \\< b, \$\\\{x\\\}\$, `a<b`, \[https:\/\/example\.org\]\(https:\/\/example\.org\)/,
  );
  assert.doesNotMatch(mdx, /weg/);
  assert.doesNotThrow(() => lesen("a.mdx", mdx));
});

test("Teilbilder: erst ihre Unterschriften, dann die gemeinsame, alles Original", () => {
  const md =
    ":::abbildung[Abb. 3: Beide]\n![(a) Links](bilder/a.png)\n\n![(b) Rechts](bilder/b.png)\n:::";
  assert.deepEqual(woerter(md), [
    "(",
    "a",
    ")",
    "Links",
    "(",
    "b",
    ")",
    "Rechts",
    "Abb",
    ".",
    "3",
    ":",
    "Beide",
  ]);
  assert.throws(() => lesen("a.md", ":::abbildung[A]\n![x](a.png)\n:::"), /mindestens zwei/);
  assert.throws(
    () => lesen("a.md", ":::abbildung[A]\n![x](a.png)\n\nText\n\n![y](b.png)\n:::"),
    /nur Bilder/,
  );
});

test("Auswahl: eingerückte Absätze unter einer Option sind ihre Erklärung", () => {
  const { tree } = lesen(
    "a.md",
    ":::auswahl[F?]\n- [x] Richtig\n- [ ] Falsch\n\n  Weil es so ist.\n\nFür alle.\n:::",
  );
  const optionen = [];
  visit(tree, (k) => {
    if (k.data?.hName === "Option") optionen.push(k);
  });
  assert.equal(optionen.length, 2);
  assert.equal(optionen[0].children.at(-1).data?.hName, undefined);
  assert.equal(optionen[1].children.at(-1).data?.hName, "Optionserklaerung");
});
