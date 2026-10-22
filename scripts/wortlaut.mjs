// Prüft, dass der Originaltext wortgleich übernommen ist: vergleicht die
// Wörter außerhalb der Ergänzungen mit einer Referenz.
//
//   npm run wortlaut -- <datei|ordner>… --gegen <referenz>
//
// Referenz `.txt` (pdftotext -enc UTF-8, Phase 1, Entwurf gegen das PDF):
// Formeln zählen nicht, Kopf- und Fußzeilen und Seitenzahlen fallen weg.
// Fehler sind eingefügte oder geänderte Wörter und ausgelassene Stellen ab
// fünf Wörtern; kürzere Auslassungen (Formeltext, Text in Abbildungen) stehen
// nur zur Durchsicht da.
// Referenz `.md`/`.mdx` (Phase 2, Kapitel gegen den Entwurf): jede Abweichung
// ist ein Fehler, auch in Formeln.
import fs from "node:fs";
import path from "node:path";
import { diffArrays } from "diff";
import { originalWoerter, pdfText, woerter } from "../plugins/original.mjs";

function dateienAus(angaben) {
  return angaben.flatMap((a) => {
    if (!fs.existsSync(a)) throw new Error(`Nicht gefunden: ${a}`);
    if (!fs.statSync(a).isDirectory()) return [a];
    return fs
      .readdirSync(a)
      .filter((d) => /\.mdx?$/.test(d))
      .sort((x, y) => x.localeCompare(y, "de", { numeric: true }))
      .map((d) => path.join(a, d));
  });
}

/** Vergleicht und liefert die Abweichungen; wirft bei Syntaxfehlern. */
export function pruefeWortlaut(angaben, referenz) {
  const streng = !referenz.endsWith(".txt");
  const ist = dateienAus(angaben).flatMap((d) => originalWoerter(d, { formeln: streng }));
  const soll = streng
    ? dateienAus([referenz]).flatMap((d) => originalWoerter(d, { formeln: true }))
    : woerter(pdfText(fs.readFileSync(referenz, "utf8"))).map((text) => ({ text }));

  const teile = diffArrays(soll, ist, { comparator: (a, b) => a.text === b.text });
  const abweichungen = [];
  let posIst = 0;
  for (let i = 0; i < teile.length; i++) {
    const t = teile[i];
    if (!t.added && !t.removed) {
      posIst += t.count;
      continue;
    }
    // Ein entfernter und ein eingefügter Teil hintereinander sind eine Änderung.
    const weg = t.removed ? t.value : [];
    const neu = t.added ? t.value : teile[i + 1]?.added ? teile[i + 1].value : [];
    if (t.removed && teile[i + 1]?.added) i++;
    const ort = ist[Math.min(posIst, ist.length - 1)] ?? {};
    const vorher = ist
      .slice(Math.max(0, posIst - 6), posIst)
      .map((w) => w.text)
      .join(" ");
    posIst += neu.length;
    const a = weg.map((w) => w.text).join(" ");
    const b = neu.map((w) => w.text).join(" ");
    // Silbentrennung: ohne Bindestriche und Leerzeichen gleich.
    if (a.replace(/[-\s]/g, "") === b.replace(/[-\s]/g, "")) continue;
    const lang = weg.filter((w) => /\p{L}{3}/u.test(w.text)).length >= 3 && weg.length >= 5;
    const fehler = streng || neu.length > 0 || lang;
    // Einzelne Formelzeichen („U“, „R · I“) aus pdftotext nicht aufzählen.
    if (!fehler && !weg.some((w) => /\p{L}{3}/u.test(w.text))) continue;
    abweichungen.push({
      fehler,
      weg: a,
      neu: b,
      vorher,
      datei: ort.datei,
      zeile: ort.zeile,
      seite: ort.seite,
    });
  }
  return abweichungen;
}

function ausgabe(abweichungen) {
  const fehler = abweichungen.filter((a) => a.fehler);
  const durchsicht = abweichungen.filter((a) => !a.fehler);
  const zeile = (a) => {
    const ort = [
      a.datei && path.basename(a.datei),
      a.zeile && `Zeile ${a.zeile}`,
      a.seite && `nach Seite ${a.seite}`,
    ]
      .filter(Boolean)
      .join(", ");
    const teile = [];
    if (a.weg) teile.push(`fehlt: „${a.weg}“`);
    if (a.neu) teile.push(`${a.weg ? "steht stattdessen" : "zusätzlich"}: „${a.neu}“`);
    return `- ${ort || "?"}: …${a.vorher.slice(-60)} | ${teile.join(" | ")}`;
  };
  if (fehler.length) {
    console.log(`Abweichungen vom Original (${fehler.length}), bitte beheben:`);
    for (const a of fehler.slice(0, 80)) console.log(zeile(a));
    if (fehler.length > 80) console.log(`… und ${fehler.length - 80} weitere.`);
  }
  if (durchsicht.length) {
    console.log(
      `\nKurze Auslassungen (${durchsicht.length}), nur durchsehen (meist Formeltext, Text in Abbildungen):`,
    );
    for (const a of durchsicht.slice(0, 40)) console.log(zeile(a));
    if (durchsicht.length > 40) console.log(`… und ${durchsicht.length - 40} weitere.`);
  }
  if (!abweichungen.length) console.log("Wortlaut stimmt: keine Abweichungen vom Original.");
  else if (!fehler.length) console.log("\nKeine Fehler im Wortlaut.");
  return fehler.length ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const i = args.indexOf("--gegen");
  if (i === -1 || !args[i + 1] || i === 0) {
    console.error(
      "Aufruf: npm run wortlaut -- <datei|ordner>… --gegen <referenz.txt|.md|.mdx|ordner>",
    );
    process.exit(2);
  }
  try {
    process.exit(ausgabe(pruefeWortlaut([...args.slice(0, i), ...args.slice(i + 2)], args[i + 1])));
  } catch (fehler) {
    console.error(`Fehler: ${fehler.message}`);
    process.exit(2);
  }
}
