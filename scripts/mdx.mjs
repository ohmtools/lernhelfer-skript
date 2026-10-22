// Macht aus den Entwürfen (.md) Kapitel (.mdx) in src/inhalt, ohne den Text
// neu zu schreiben: Zeichen, die in MDX etwas bedeuten ({ } <), bekommen im
// Fließtext einen Backslash, <https://…> wird ein Link, HTML-Kommentare
// fallen weg. Bilder aus <entwurf>/bilder kommen nach src/inhalt/bilder.
//
//   npm run mdx -- <entwurf-ordner|datei.md>… [--ersetzen]
//
// --ersetzen löscht vorher alle Kapitel und Bilder in src/inhalt (das
// Beispiel der Vorlage), skript.json bleibt.
import fs from "node:fs";
import path from "node:path";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { syntax } from "../plugins/syntax.mjs";

const INHALT = path.resolve(import.meta.dirname, "../src/inhalt");

/** Ersetzungen im Quelltext, von hinten nach vorn angewendet. */
export function zuMdx(quelle) {
  const tree = unified().use(remarkParse).use(syntax).parse(quelle);
  const ersetzungen = [];
  visit(tree, (node) => {
    const p = node.position;
    if (!p) return;
    const [von, bis] = [p.start.offset, p.end.offset];
    if (node.type === "text") {
      const roh = quelle.slice(von, bis);
      const neu = roh.replace(/(?<!\\)([{}<])/g, "\\$1");
      if (neu !== roh) ersetzungen.push([von, bis, neu]);
    } else if (node.type === "link" && quelle[von] === "<") {
      ersetzungen.push([von, bis, `[${node.url}](${node.url})`]);
      return "skip";
    } else if (node.type === "html") {
      const roh = quelle.slice(von, bis);
      ersetzungen.push([
        von,
        bis,
        /^<!--[\s\S]*-->$/.test(roh.trim()) ? "" : roh.replace(/([{}<])/g, "\\$1"),
      ]);
    }
  });
  let mdx = quelle;
  for (const [von, bis, neu] of ersetzungen.sort((a, b) => b[0] - a[0]))
    mdx = mdx.slice(0, von) + neu + mdx.slice(bis);
  return mdx;
}

function main() {
  const args = process.argv.slice(2);
  const ersetzen = args.includes("--ersetzen");
  const angaben = args.filter((a) => a !== "--ersetzen");
  if (!angaben.length) {
    console.error("Aufruf: npm run mdx -- <entwurf-ordner|datei.md>… [--ersetzen]");
    process.exit(2);
  }
  if (ersetzen) {
    for (const d of fs.readdirSync(INHALT)) if (d.endsWith(".mdx")) fs.rmSync(path.join(INHALT, d));
    fs.rmSync(path.join(INHALT, "bilder"), { recursive: true, force: true });
    fs.rmSync(path.join(INHALT, "komponenten"), { recursive: true, force: true });
  }
  let fehler = 0;
  for (const angabe of angaben) {
    const istOrdner = fs.statSync(angabe).isDirectory();
    const dateien = istOrdner
      ? fs
          .readdirSync(angabe)
          .filter((d) => d.endsWith(".md"))
          .map((d) => path.join(angabe, d))
      : [angabe];
    const bilder = path.join(istOrdner ? angabe : path.dirname(angabe), "bilder");
    if (fs.existsSync(bilder)) fs.cpSync(bilder, path.join(INHALT, "bilder"), { recursive: true });
    for (const datei of dateien) {
      const ziel = path.join(INHALT, path.basename(datei).replace(/\.md$/, ".mdx"));
      const mdx = zuMdx(fs.readFileSync(datei, "utf8"));
      fs.writeFileSync(ziel, mdx);
      try {
        unified().use(remarkParse).use(remarkMdx).use(syntax).parse(mdx);
        console.log(`${path.relative(process.cwd(), ziel)}`);
      } catch (e) {
        fehler++;
        console.error(`${path.relative(process.cwd(), ziel)}: ${e.message}`);
      }
    }
  }
  process.exit(fehler ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
