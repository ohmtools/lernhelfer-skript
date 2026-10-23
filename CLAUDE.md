# lernhelfer-skript — Hinweise für Claude Code

Vorlage der Fähigkeit „Skript verbessern“ des Lernhelfers
(`ohmtools/claude-plugins`, `lernhelfer/skills/lernen/faehigkeiten/skript-verbessern.md`).
Eine andere Claude-Instanz in Claude.ai klont dieses Repository
(`git clone --depth 1`, Hauptzweig), installiert mit `npm ci --omit=dev`,
schreibt nur `src/inhalt/` und baut eine einzige HTML-Datei, die sie als
Artefakt zeigt. Sie kennt nur `ANLEITUNG.md` und die Fähigkeit, nicht diese
Datei.

## Unverhandelbar

- **Wortlaut:** Alles außerhalb einer Ergänzung ist Originaltext, auch in
  Blöcken des Originals wie `:::abbildung` (Teilbilder). Die Listen der
  Ergänzungen, Blöcke und Marken stehen nur in `plugins/ergaenzungen.mjs`; Webseite
  (`plugins/remark-skript.mjs`), Prüfung (`scripts/wortlaut.mjs`,
  `plugins/original.mjs`), Umwandlung (`scripts/mdx.mjs`) und Tests lesen sie
  von dort.
- **Eine Datei, kein Netz:** Alles wird in `dist/index.html` eingebettet
  (`vite-plugin-singlefile`), die Seite lädt nichts nach. Ein Artefakt in
  Claude.ai darf weder Speicher noch Adresse brauchen: `localStorage` gibt es
  nicht, die Adresse (`#/kapitel/abschnitt`) nur in try/catch.
- **Breaking Changes:** Die Syntax der Ergänzungen, die Namen der Bausteine
  und ihrer Angaben, `skript.json` und die Befehle (`npm run mdx`, `wortlaut`,
  `pruefen`, `build`, `quelle`, `ausschnitt`) stehen auch in der Fähigkeit im
  Plugin, und Nutzer haben Quell-ZIPs alter Seiten, die sie in einem neuen
  Chat weiterbauen. Wer etwas davon umbenennt oder entfernt, fragt den
  Nutzer und ändert die Fähigkeit mit.
- `ANLEITUNG.md` beschreibt jeden Baustein, und das Beispiel in
  `src/inhalt/` benutzt jeden. Ein neuer Baustein kommt in
  `src/primitiven/index.ts`, `ANLEITUNG.md` und das Beispiel.

## Design

Folgt dem ohmtools-Design: https://github.com/ohmtools/design, Regeln in dessen
DESIGN.md (shadcn base-sera, Red auf Neutral, Inter; keine Großbuchstaben,
keine Boxen, kein Umschalter für das Farbschema). Farben nur über dessen
Tokens. Vor jeder sichtbaren Änderung DESIGN.md lesen; eine Regel, die sich
ändern soll, wird zuerst dort geändert, für alle Apps. Referenz ist
`ohmtools/zeiteisen`.

- `components.json` und der Theme-Teil von `src/index.css` sind unveränderte
  Kopien aus `ohmtools/design`; eigenes CSS (Shiki- und Mafs-Variablen auf
  Tokens, Formelnummern) steht am Ende von `src/index.css`.
- Ergänzungen: rote Linie links und „Ergänzung · …“ (Farbe nie einziger
  Hinweis), keine Kästen; Kurven in Graphen unterscheiden sich in Farbe und
  Strichart.
- Desktop (`desktop:`): drei Spalten in einem Viewport, jede scrollt für sich
  (Kapitel und Suche, Kapitel, ab `xl` „Auf dieser Seite“). Darunter
  Tab-Leiste „Skript | Inhalt | Einstellungen“ wie zeiteisen (Wunsch des
  Nutzers: fumadocs-artig am Desktop, ohmtools-Regeln am Handy).
- Ein Kapitel pro Seite mit „Zurück/Weiter“ (Wunsch des Nutzers), Suche über
  alle Kapitel (minisearch, Text aus dem Export `suchtext` jedes Kapitels).
- Abweichungen von DESIGN.md, weil die Seite eine Datei ist: Das
  Dunkelmodus-Skript steht inline in `index.html` (DESIGN.md will
  `public/dark.js` wegen der CSP, die es im Artefakt nicht gibt). Die
  Oberfläche ist nur Deutsch, weil die Skripte deutsch sind; kein Logo und
  keine Version (die Seite ist ein Dokument, keine App).
- Prüfung: `npx --yes github:ohmtools/design check src/index.css components.json src/components/ui/*.tsx src/components/shell/*.tsx src/primitiven/*.tsx` (läuft in der CI).
- Sichtbare Änderungen bei 360, 400 und 1440 px, hell und dunkel prüfen
  (Playwright mit Chromium, `dist/index.html` über `file://`).

## Aufbau

- `plugins/`: einfaches JavaScript, damit Node es ohne TypeScript ausführt
  (Prüfung, Umwandlung, Tests). `pipeline.mjs` sind die Plugins für
  `@mdx-js/rollup`: remark-gfm (`singleTilde: false`), remark-math,
  remark-directive, `remark-skript.mjs`; rehype-katex (Fehler brechen ab),
  jede Formel als ein HTML-Text (`Formel`, spart Größe), Bilder als Imports,
  Shiki mit dem Thema „css-variables“.
- `remark-skript.mjs`: unbekannte `:wort`/`::wort` bleiben Text („10:30“),
  unbekannte `:::wort` brechen ab; Ergänzungen werden Komponenten (großer
  Anfangsbuchstabe, fehlende brechen in MDX ab statt still ein `div` zu
  werden), Fragen hintereinander ein Block `Fragen`, ein Bild allein in einem
  Absatz eine `Abbildung`, `:::abbildung` die Teilbilder (`Abbildungen`,
  `Teilbild`, gemeinsame `Bildunterschrift` zuletzt, wie im PDF; so zählt
  sie auch `original.mjs`); Absätze unter einer Option von `:::auswahl` sind
  ihre `Optionserklaerung`; Exporte `titel`, `gliederung`, `seiten`,
  `suchtext`.
- `src/primitiven/`: alle Bausteine, `index.ts` ist die Liste für jedes
  Kapitel. `flaeche.tsx` ist die Zeichenfläche für `Zeichnung` und
  `Schaltung` (Raster 40 px, y nach oben, Beschriftungen als HTML mit KaTeX
  per Portal über dem SVG, kein foreignObject), auf schmalen Bildschirmen
  verkleinert. Schaltzeichen nach DIN EN 60617 wie im Übungsblatt des
  Lernhelfers (Spule gefüllt, gerade Spannungspfeile, OPV als Rechteck).
  Graphen mit Mafs (gepinnt, unverändert seit 2024; nur `graph.tsx` benutzt
  es; `Hilfslinie` mit `Line` von Mafs). `experiment.tsx`: Werte der Regler
  eines `:::interaktiv`, Startwerte aus dem Baum, damit schon das erste Bild
  und die Prüfung auf dem Server mit ihnen rechnen, danach die `Rechnung`en
  der Reihe nach (Werte oder Funktionen). `Regler art="zeit"` spielt erst
  auf Knopfdruck ab, nie von selbst (prefers-reduced-motion).
- `src/pruefen.tsx` rendert jedes Kapitel für `npm run pruefen` auf dem
  Server (Vite im Middleware-Modus); Mafs rendert dort nichts, deshalb
  rechnen `Kurve` und `Zeiger` auf dem Server ihre Funktionen nur nach.
- `vite.config.ts`: KaTeX-Schriften nur als woff2, Inter ohne Kyrillisch,
  Vietnamesisch und erweitertes Griechisch (`nurEinbetten`), Titel aus
  `skript.json`, Erstellungszeit in deutscher Zeit. Ziel unter 2,5 MB ohne
  Bilder (CI).

## Befehle

```sh
npm ci && npm run dev
npm run typecheck && npm run lint && npm test
npm run pruefen && npm run build
npm run wortlaut -- src/inhalt --gegen beispiel/original.txt
npm run fmt            # oxfmt; .md und .mdx sind ausgenommen (.oxfmtrc.json),
                       # er bricht sonst die Markierungen der Ergänzungen um
```

`beispiel/original.txt` ist das Original des Beispiels, wie pdftotext es
liefern würde (mit Kopfzeilen, Seitenzahlen und Silbentrennung).
