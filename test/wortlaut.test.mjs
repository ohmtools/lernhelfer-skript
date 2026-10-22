import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { pruefeWortlaut } from "../scripts/wortlaut.mjs";

const WURZEL = path.resolve(import.meta.dirname, "..");
const INHALT = path.join(WURZEL, "src/inhalt");
const REFERENZ = path.join(WURZEL, "beispiel/original.txt");
const fehler = (liste) => liste.filter((a) => a.fehler);

function kopie(ersetzen) {
  const ordner = fs.mkdtempSync(path.join(os.tmpdir(), "wortlaut-"));
  for (const d of fs.readdirSync(INHALT).filter((d) => d.endsWith(".mdx"))) {
    let text = fs.readFileSync(path.join(INHALT, d), "utf8");
    if (d.startsWith("01")) text = ersetzen(text);
    fs.writeFileSync(path.join(ordner, d), text);
  }
  return ordner;
}

test("das Beispiel stimmt mit seinem Original überein", () => {
  assert.deepEqual(fehler(pruefeWortlaut([INHALT], REFERENZ)), []);
});

test("ein geändertes Wort im Original fällt auf", () => {
  const ordner = kopie((t) =>
    t.replace("treibt den elektrischen Strom", "schiebt den elektrischen Strom"),
  );
  const f = fehler(pruefeWortlaut([ordner], REFERENZ));
  assert.equal(f.length, 1);
  assert.match(f[0].weg, /treibt$/);
  assert.equal(f[0].neu, "schiebt");
});

test("ein eingefügtes Wort im Original fällt auf", () => {
  const ordner = kopie((t) =>
    t.replace("Ohne Spannung fließt kein Strom.", "Ohne Spannung fließt sicher kein Strom."),
  );
  assert.equal(fehler(pruefeWortlaut([ordner], REFERENZ))[0].neu, "sicher");
});

test("ein geändertes Wort in einer Ergänzung zählt nicht", () => {
  const ordner = kopie((t) => t.replace("Er halbiert sich", "Er wird halb so groß"));
  assert.deepEqual(fehler(pruefeWortlaut([ordner], REFERENZ)), []);
});

test("Kapitel gegen Entwurf: auch Formeln müssen gleich sein", () => {
  const entwurf = fs.mkdtempSync(path.join(os.tmpdir(), "entwurf-"));
  const datei = path.join(INHALT, "01-grundbegriffe.mdx");
  fs.writeFileSync(
    path.join(entwurf, "01.md"),
    fs.readFileSync(datei, "utf8").replace(/^<[\s\S]*?^<\/Schaltung>\n/m, "Schaltung in Worten.\n"),
  );
  assert.deepEqual(pruefeWortlaut([datei], entwurf), []);
  fs.writeFileSync(
    path.join(entwurf, "01.md"),
    fs.readFileSync(datei, "utf8").replace("U = R \\cdot I \\tag{1.1}", "U = R I \\tag{1.1}"),
  );
  assert.equal(pruefeWortlaut([datei], entwurf).length, 1);
});
