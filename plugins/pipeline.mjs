// Plugins und Optionen für @mdx-js/rollup (vite.config.ts) und für die
// Prüfung beim Bauen (scripts/pruefen.mjs).
import rehypeShiki from "@shikijs/rehype";
import { toHtml } from "hast-util-to-html";
import rehypeKatex from "rehype-katex";
import rehypeMdxImportMedia from "rehype-mdx-import-media";
import { createCssVariablesTheme } from "shiki";
import { SKIP, visit } from "unist-util-visit";
import remarkSkript from "./remark-skript.mjs";
import { syntax } from "./syntax.mjs";

// Sprachen wie im Übungsblatt des Lernhelfers und ein paar mehr; andere
// erscheinen als Text ohne Hervorhebung.
export const SPRACHEN = [
  "python",
  "c",
  "cpp",
  "asm",
  "riscv",
  "verilog",
  "vhdl",
  "matlab",
  "java",
  "javascript",
  "bash",
  "text",
];

const thema = createCssVariablesTheme({
  name: "ohmtools",
  variablePrefix: "--shiki-",
  fontStyle: true,
});

/** rehype-katex meldet Fehler nur und setzt roten Text: hier bricht das Bauen ab. */
function formelfehler() {
  return (_tree, file) => {
    const fehler = file.messages.find((m) => m.source === "rehype-katex");
    if (fehler)
      file.fail(
        `Formel lässt sich nicht setzen (${fehler.place ? `Zeile ${fehler.place.line ?? fehler.place.start?.line}` : "?"}): ${fehler.cause?.message ?? fehler.reason}`,
      );
  };
}

/**
 * Jede gesetzte Formel als ein HTML-Text statt hunderter React-Elemente:
 * kleinere Datei, schnellerer Aufbau. Die Komponente `Formel` setzt ihn ein.
 */
function formelnAlsHtml() {
  return (tree) => {
    visit(tree, "element", (node, index, parent) => {
      const klassen = node.properties?.className ?? [];
      if (!parent || index == null) return;
      const block = klassen.includes("katex-display");
      if (!block && !klassen.includes("katex")) return;
      parent.children[index] = {
        type: "element",
        tagName: "Formel",
        properties: { html: toHtml(node), block },
        children: [],
      };
      return SKIP;
    });
  };
}

export const remarkPlugins = [...syntax, [remarkSkript, { mdx: true }]];

export const rehypePlugins = [
  [rehypeKatex, { strict: "ignore" }],
  formelfehler,
  formelnAlsHtml,
  rehypeMdxImportMedia,
  [
    rehypeShiki,
    { theme: thema, langs: SPRACHEN, defaultLanguage: "text", fallbackLanguage: "text" },
  ],
];

export const remarkRehypeOptions = {
  footnoteLabel: "Fußnoten",
  footnoteBackLabel: "Zurück zum Text",
};
