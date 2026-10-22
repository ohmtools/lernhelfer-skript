// Liest Entwurf (.md) oder Kapitel (.mdx) wie die Webseite und liefert den
// Originaltext als Wortliste: alles außerhalb der Ergänzungen. Grundlage der
// Prüfung des Wortlauts (scripts/wortlaut.mjs).
import fs from "node:fs";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { VFile } from "vfile";
import { ERGAENZUNGEN, FRAGENGRUPPE } from "./ergaenzungen.mjs";
import remarkSkript from "./remark-skript.mjs";
import { syntax } from "./syntax.mjs";

/** Gemeinsame Schreibweise: Ligaturen, Anführungszeichen, Striche, weiche Trennstriche. */
export function normalisieren(text) {
  return text
    .normalize("NFKC")
    .replace(/­/g, "")
    .replace(/[„“”«»″]/g, '"')
    .replace(/[‚‘’‹›′`´]/g, "'")
    .replace(/[‐‑‒–—―−]/g, "-")
    .replace(/[•▪◦●■□►▶∙]/g, " ")
    .replace(/…/g, "...");
}

export function woerter(text) {
  return normalisieren(text).match(/[\p{L}\p{N}]+|[^\s\p{L}\p{N}]/gu) ?? [];
}

/** Baum einer Datei, wie ihn remark-skript für die Webseite sieht. */
export function lesen(pfad, inhalt = fs.readFileSync(pfad, "utf8")) {
  const file = new VFile({ path: pfad, value: inhalt });
  const prozessor = unified().use(remarkParse);
  if (pfad.endsWith(".mdx")) prozessor.use(remarkMdx);
  prozessor.use(syntax).use(remarkSkript, { mdx: false });
  const tree = prozessor.runSync(prozessor.parse(file), file);
  return { tree, file };
}

/**
 * Wörter des Originals mit Herkunft. `formeln: true` nimmt jede Formel als
 * ein Wort `$…$` auf (Vergleich Entwurf ↔ Kapitel), sonst bleiben Formeln
 * weg (Vergleich mit pdftotext, das Formeln nicht lesen kann).
 */
export function originalWoerter(pfad, { formeln = false, inhalt } = {}) {
  const { tree } = lesen(pfad, inhalt);
  const liste = [];
  let seite = null;
  const dazu = (text, node) => {
    for (const w of woerter(text))
      liste.push({ text: w, datei: pfad, zeile: node.position?.start?.line, seite });
  };
  const gehe = (node) => {
    if (
      (node.type === "containerDirective" || node.type === "textDirective") &&
      ERGAENZUNGEN[node.name]
    )
      return;
    if (node.type === "skriptTeil" && node.data?.hName === FRAGENGRUPPE) return;
    if (node.type === "leafDirective" && node.name === "seite") {
      seite = Number(node.data?.hProperties?.nr) || seite;
      return;
    }
    if (node.type === "mdxjsEsm") return;
    if (node.type === "text" || node.type === "inlineCode" || node.type === "code")
      dazu(node.value, node);
    else if (node.type === "image") dazu(node.alt ?? "", node);
    else if (node.type === "math" || node.type === "inlineMath") {
      if (formeln)
        liste.push({
          text: `$${node.value.replace(/\s+/g, " ").trim()}$`,
          datei: pfad,
          zeile: node.position?.start?.line,
          seite,
        });
    }
    for (const kind of node.children ?? []) gehe(kind);
  };
  gehe(tree);
  return liste;
}

/**
 * Text von pdftotext (`-enc UTF-8`, Seiten durch \f getrennt) ohne Kopf- und
 * Fußzeilen (Zeilen, die auf drei oder mehr Seiten gleich vorkommen, bei zwei
 * Seiten auf beiden; Ziffern egal), ohne Zeilen nur aus Seitenzahlen und mit zusammengefügter
 * Silbentrennung am Zeilenende.
 */
export function pdfText(text) {
  const seiten = text.split("\f");
  const schluessel = (z) => z.trim().replace(/\d+/g, "#");
  const zaehler = new Map();
  for (const s of seiten) {
    for (const k of new Set(s.split("\n").map(schluessel).filter(Boolean)))
      zaehler.set(k, (zaehler.get(k) ?? 0) + 1);
  }
  const schwelle = Math.min(3, seiten.filter((x) => x.trim()).length);
  const wiederholt = (z) => schwelle >= 2 && (zaehler.get(schluessel(z)) ?? 0) >= schwelle;
  return seiten
    .map((s) =>
      s
        .split("\n")
        .filter(
          (z) =>
            z.trim() && !/^\s*(seite\s*)?\d+(\s*(\/|von)\s*\d+)?\s*$/i.test(z) && !wiederholt(z),
        )
        .join("\n"),
    )
    .join("\n")
    .replace(/(\p{L})-\n(\p{Ll})/gu, "$1$2");
}
