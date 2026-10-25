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
  `src/primitiven/index.ts`, `ANLEITUNG.md` und das Beispiel. Ausnahme:
  `:::denkanstoss` bleibt nur für alte Quell-ZIPs, die Anleitung sagt, ihn
  nicht mehr zu schreiben, und das Beispiel benutzt ihn nicht.
- Fragen stehen nur gesammelt am Kapitelende, so viele, dass sie etwa ein
  Drittel der Lese- und Bearbeitungszeit des Kapitels brauchen (Richtwerte
  in `ANLEITUNG.md`, Kapitel 8, und in der Fähigkeit). Ergänzungen helfen
  beim Verstehen, ohne Randinformationen. Das Beispiel hält sich daran.

## Design

Folgt dem ohmtools-Design: https://github.com/ohmtools/design, Regeln in dessen
DESIGN.md (shadcn base-vega, zeiteisens Theme, Geist; keine Großbuchstaben,
keine Boxen, kein Umschalter für das Farbschema; Abschnitt „Reading pages“
für diese Seite, Vorbild die Zeichenfläche „Übungsblatt und Skript“, Seite
„A3 Datenblatt“). Farben nur über dessen
Tokens. Vor jeder sichtbaren Änderung DESIGN.md lesen; eine Regel, die sich
ändern soll, wird zuerst dort geändert, für alle Apps. Referenz ist
`ohmtools/zeiteisen`.

- `components.json` und der Theme-Teil von `src/index.css` sind unveränderte
  Kopien aus `ohmtools/design`; eigenes CSS (Shiki- und Mafs-Variablen auf
  Tokens, Formelnummern) steht am Ende von `src/index.css`.
- Rot heißt „ergänzt“: Jede Ergänzung ist ein Block im Text (nie am Rand)
  mit rotem Badge „Ergänzung“, Titel und roter Linie darunter, am Ende eine
  rote Linie mit „Ende der Ergänzung“ (Farbe nie einziger Hinweis), keine
  Kästen; `:anm` unterstreicht das Wort davor rot
  gepunktet und öffnet ein Popover. Originaltext bleibt ohne Rot. Die erste
  Kurve eines Graphen in `--kurve` (chart-3 hell, chart-2 dunkel), weitere
  in anderer Farbe und Strichart, Namen an der Kurve statt einer Legende,
  Millimeterpapier wie im Übungsblatt.
- Kopf (56 px, auf niedrigen Querformat-Bildschirmen `short:` 48 px, dazu der
  sichere Bereich oben): Titel, „Kapitel 2 / 3“ (erst ab `md:`, darunter
  über der Seite, sonst passt die Zeile nicht), Tabs „Mit Ergänzungen | Nur
  Original“ und die Knöpfe „Inhalt“ (nur kompakt), „Auf dieser Seite“ (nicht
  bei den Wiederholungsfragen, die keine Abschnitte haben) und
  „Einstellungen“. Drei Stufen wie in den Apps (Entscheidung des Nutzers,
  2026-10-25; `src/lib/stufe.ts` mit denselben Abfragen wie `compact:` und
  `wide:`):
  - breit (`wide:`): drei Spalten in einem Viewport, jede scrollt für sich
    (Suche und Kapitel 280 px, Seite höchstens 720 px mit 56 px Rand, rechts
    „Auf dieser Seite“ 280 px, schließbar, beim Start erst ab 80rem offen).
  - kompakt (`compact:`): eine Spalte (Seite höchstens 720 px mit 24 px
    Rand), alles in der Kopfzeile, keine Leiste. „Inhalt“ (Suche und
    Kapitel wie am Handy) und „Auf dieser Seite“ sind ein Blatt von rechts,
    380 px (`Blatt.tsx` wie zeiteisens `PanelSheet`); eine Wahl darin
    schließt es und geht dorthin.
  - schmal: eine Spalte und die Leiste „Skript | Inhalt | Einstellungen“
    (Tabs); die Seite bleibt beim Tabwechsel eingehängt.
- Einstellungen wie in den Apps (`Einstellungen.tsx`, zeiteisens
  `SettingsPage.tsx`): ab kompakt ein Dialog bis 1000 × 720 mit den
  Abschnitten links, am Handy im Tab eine Seite mit den Abschnitten als
  Zeilen, jeder eine Seite mit Pfeil zurück. Abschnitte „Ansicht“ (Mit
  Ergänzungen / Nur Original, Hinweis zu hell und dunkel) und „Über dieses
  Skript“.
- Eine Seite pro Kapitel mit „Zurück/Weiter“ (Wunsch des Nutzers), danach
  eine eigene Seite „Wiederholungsfragen“ (`#/{kapitel}/wiederholungsfragen`):
  `KapitelSeite` rendert dort das ganze Kapitel und zeigt nur den Block
  `Fragen` (`data-fragen`). Suche über alle Kapitel (minisearch, Export
  `suchtext`: Original und Ergänzungen getrennt, die Fragen als eigener
  Abschnitt).
- Bewegung wie in zeiteisen, ohne Bibliothek (`src/lib/bewegung.ts`, CSS am
  Ende von `src/index.css`): die nächste Seite oder der Tab rechts davon
  kommt von rechts, die vorige von links (Web Animations API, `main` schneidet
  dabei seitlich ab); „Mit Ergänzungen | Nur Original“ blendet die Seite neu
  ein; „Auf dieser Seite“ gleitet breit per View Transition herein und
  hinaus, Blatt und Dialog bewegen sich wie in den Apps (`ui/sheet.tsx`,
  `ui/dialog.tsx`), die Abschnitte der Einstellungen am Handy kommen von
  rechts und gehen nach links zurück; ein Sprung innerhalb der Seite scrollt
  sanft; Aufgedecktes (Antworten, Urteile, Rückmeldungen) und die Abschnitte
  im Kapitelbaum erscheinen mit `erscheinen`. Bei `prefers-reduced-motion`
  bewegt sich nichts.
- Sprung zu einem Abschnitt einer anderen Seite: `festhalten` in `App.tsx`
  richtet ihn höchstens eine Sekunde lang neu aus, bis sich die Seite gesetzt
  hat (Zeichenflächen und Graphen werden nach dem Einhängen kleiner), und
  hört auf, sobald der Nutzer scrollt. Jede scrollende Spalte und jeder
  waagrecht scrollende Block darin (Formeln, Tabellen, Code) ist `relative`,
  sonst verlängern absolut gesetzte Elemente (`sr-only`) das Dokument und
  `scrollIntoView` schiebt den Kopf weg.
- Abweichungen von DESIGN.md, weil die Seite eine Datei ist: Das
  Dunkelmodus-Skript steht inline in `index.html` (DESIGN.md will
  `public/dark.js` wegen der CSP, die es im Artefakt nicht gibt). Die
  Oberfläche ist nur Deutsch, weil die Skripte deutsch sind; kein Logo und
  keine Version (die Seite ist ein Dokument, keine App).
- Prüfung: `npx --yes github:ohmtools/design check src/index.css components.json src/components/ui/*.tsx src/components/shell/*.tsx src/primitiven/*.tsx` (läuft in der CI).
- Sichtbare Änderungen bei 360, 400, 568 × 320, 768 × 1024, 844 × 390 und
  1440 px, hell und dunkel prüfen
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
  ihre `Optionserklaerung`; Exporte `titel`, `gliederung` (Abschnitte und
  Ergänzungen als Block, diese mit Anker für „Auf dieser Seite“), `seiten`,
  `suchtext`, `fragen` (Zahl der Wiederholungsfragen). Nur für die Webseite
  (`mdx: true`) wandert das Wort vor `:anm` als `AnmWort` in die Anmerkung;
  die Prüfung des Wortlauts sieht den Baum ohne diesen Schritt.
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
- `vite.config.ts`: KaTeX-Schriften nur als woff2, Geist und Geist Mono ohne
  Kyrillisch und Vietnamesisch (`nurEinbetten`), Titel aus
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
