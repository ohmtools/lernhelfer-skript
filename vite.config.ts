import fs from "node:fs";
import path from "node:path";
import mdx from "@mdx-js/rollup";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { rehypePlugins, remarkPlugins, remarkRehypeOptions } from "./plugins/pipeline.mjs";

// Schriften, die nicht in die HTML-Datei kommen: Browser nehmen woff2 und
// fragen nie nach woff/ttf; Inter ohne Kyrillisch, Vietnamesisch und
// erweitertes Griechisch. Ihre @font-face-Einträge entfernt `nurEinbetten`.
const NICHT_EINBETTEN = /\.(woff|ttf)$|inter-(cyrillic|cyrillic-ext|greek-ext|vietnamese)-/;

/** Entfernt Verweise auf nicht eingebettete Dateien aus dem CSS und die Dateien selbst. */
function nurEinbetten(): Plugin {
  return {
    name: "nur-einbetten",
    apply: "build",
    generateBundle(_, bundle) {
      const weg = Object.keys(bundle).filter((name) => NICHT_EINBETTEN.test(name));
      for (const datei of Object.values(bundle)) {
        if (datei.type !== "asset" || !datei.fileName.endsWith(".css")) continue;
        let css = String(datei.source);
        for (const name of weg) {
          const base = path.basename(name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          // Ein ganzer Eintrag, wenn er nur diese Datei nennt (Inter-Teilmengen) …
          css = css.replace(new RegExp(`@font-face\\{[^}]*url\\([^)]*${base}\\)[^}]*\\}`, "g"), (block) =>
            /url\(data:/.test(block) ? block : "",
          );
          // … sonst nur die Ausweichformate (KaTeX: woff, ttf).
          css = css.replace(new RegExp(`,\\s*url\\([^)]*${base}\\)\\s*format\\("[^"]*"\\)`, "g"), "");
        }
        datei.source = css;
      }
      for (const name of weg) delete bundle[name];
    },
  };
}

/** Titel und Sprache der Seite aus src/inhalt/skript.json. */
function skriptHtml(): Plugin {
  return {
    name: "skript-html",
    transformIndexHtml(html) {
      const skript = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, "src/inhalt/skript.json"), "utf8"));
      const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
      return html.replace("%TITEL%", escape(String(skript.titel ?? "Skript")));
    },
  };
}

/** Datum und Uhrzeit des Bauens in deutscher Zeit, für „Erstellt am …“. */
function jetztInBerlin() {
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());
}

export default defineConfig({
  base: "./",
  define: {
    __ERSTELLT__: JSON.stringify(jetztInBerlin()),
  },
  plugins: [
    { enforce: "pre", ...mdx({ remarkPlugins, rehypePlugins, remarkRehypeOptions }) },
    react({ include: /\.(mdx|ts|tsx)$/ }),
    tailwindcss(),
    skriptHtml(),
    nurEinbetten(),
    viteSingleFile({ useRecommendedBuildConfig: false, removeViteModuleLoader: true }),
  ],
  build: {
    assetsInlineLimit: (datei: string) => !NICHT_EINBETTEN.test(datei),
    cssCodeSplit: false,
    assetsDir: "",
    modulePreload: { polyfill: false },
    chunkSizeWarningLimit: 100_000,
    reportCompressedSize: false,
    rolldownOptions: { output: { codeSplitting: false } },
  },
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
});
