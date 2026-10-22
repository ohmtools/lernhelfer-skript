// Prüft die Kapitel in src/inhalt vor dem Bauen:
// 1. skript.json hat einen Titel, alle Angaben sind Text;
// 2. jedes Kapitel lässt sich übersetzen (Markierungen, Formeln, Bilder);
// 3. jedes Kapitel lässt sich rendern (Bausteine, Funktionen in Experimenten).
//
//   npm run pruefen
import fs from "node:fs";
import path from "node:path";
import { compile } from "@mdx-js/mdx";
import { createServer } from "vite";
import { visit } from "unist-util-visit";
import { VFile } from "vfile";
import { rehypePlugins, remarkPlugins, remarkRehypeOptions } from "../plugins/pipeline.mjs";

const WURZEL = path.resolve(import.meta.dirname, "..");
const INHALT = path.join(WURZEL, "src/inhalt");
const fehler = [];

// 1. skript.json
try {
  const skript = JSON.parse(fs.readFileSync(path.join(INHALT, "skript.json"), "utf8"));
  if (typeof skript.titel !== "string" || !skript.titel.trim())
    fehler.push("skript.json: „titel“ fehlt.");
  for (const [k, v] of Object.entries(skript)) {
    if (!["titel", "fach", "autor", "quelle", "umfang"].includes(k))
      fehler.push(`skript.json: unbekannte Angabe „${k}“.`);
    else if (typeof v !== "string") fehler.push(`skript.json: „${k}“ muss Text sein.`);
  }
} catch (e) {
  fehler.push(`skript.json: ${e.message}`);
}

// 2. Übersetzen, Bilder vorhanden
const kapitel = fs
  .readdirSync(INHALT)
  .filter((d) => d.endsWith(".mdx"))
  .sort();
if (!kapitel.length) fehler.push("src/inhalt enthält kein Kapitel (.mdx).");
const bilderPruefen = () => (tree, file) => {
  visit(tree, "image", (node) => {
    if (/^(https?:|data:)/.test(node.url)) file.message(`Bild aus dem Internet: ${node.url}`, node);
    else if (!fs.existsSync(path.resolve(path.dirname(file.path), node.url)))
      file.message(`Bild fehlt: ${node.url}`, node);
  });
};
let uebersetzt = true;
for (const name of kapitel) {
  const datei = path.join(INHALT, name);
  const file = new VFile({ path: datei, value: fs.readFileSync(datei, "utf8") });
  try {
    await compile(file, {
      remarkPlugins: [...remarkPlugins, bilderPruefen],
      rehypePlugins,
      remarkRehypeOptions,
    });
    for (const m of file.messages)
      if (m.source !== "rehype-katex")
        fehler.push(`${name}${m.line ? `, Zeile ${m.line}` : ""}: ${m.reason}`);
  } catch (e) {
    uebersetzt = false;
    fehler.push(`${name}: ${e.reason ?? e.message}`);
  }
}

// 3. Rendern auf dem Server (nur wenn alles übersetzt)
if (uebersetzt && kapitel.length) {
  const server = await createServer({
    root: WURZEL,
    logLevel: "error",
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: "custom",
    ssr: { noExternal: ["mafs"] },
  });
  try {
    const { kapitelRendern } = await server.ssrLoadModule("/src/pruefen.tsx");
    for (const r of kapitelRendern()) {
      if (!r.ok)
        fehler.push(`${r.kapitel}.mdx („${r.titel}“) lässt sich nicht anzeigen: ${r.fehler}`);
    }
  } catch (e) {
    fehler.push(`Rendern: ${e.message}`);
  } finally {
    await server.close();
  }
}

if (fehler.length) {
  console.log(`Gefunden (${fehler.length}):`);
  for (const f of fehler) console.log(`- ${f}`);
  process.exit(1);
}
console.log(`Alles in Ordnung: ${kapitel.length} Kapitel übersetzt und gerendert.`);
