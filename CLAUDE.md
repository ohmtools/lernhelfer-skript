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

- Was das Design teilt, ist eine unveränderte Kopie aus `ohmtools/design`
  (`npx --yes github:ohmtools/design add --force <name>…`, erste Zeile mit
  der Quelle, nie hier bearbeiten, auch nicht vom Formatierer oder Linter):
  `components.json`, das ganze CSS des Designs in `src/styles/ohmtools.css`
  (Theme, Stufen, `popup-glass`, View Transitions, reduzierte Bewegung),
  shadcns Komponenten in `src/components/ui/` außer `badge`, `radio-group`,
  `slider` und `table` (`NOTES.md` dort), `src/components/ohmtools/`
  (`SettingsDialog`, `SettingsPage`, `PanelSheet`, `PanelHeader`,
  `ResponsivePopover` mit `PhoneDrawer`) und `src/lib/ohmtools/`
  (`steps.ts`, `motion.ts`). `src/index.css` importiert das Stylesheet und
  enthält nur eigenes CSS (Shiki- und Mafs-Variablen auf Tokens,
  Formelnummern, `erscheinen`). Die Elementgruppen `AppShell`, `Panel`,
  `Area` und `Views` benutzt die Seite nicht, weil ihre Schale nach
  „Reading pages“ anders ist (Kapitel links, 280 px rechts, Einstellungen als
  Tab ohne Pfeil zurück), `Popup` nicht, weil es Menü, Auswahl und Rückfrage
  mitbringt (etwa 80 kB mehr in der einen Datei); sie baut sich aus den
  Teilen darunter. `theme-provider.tsx` bleibt eigen, weil er beim Drucken
  hell schaltet.
- Rot heißt „ergänzt“: Jede Ergänzung ist ein Block im Text (nie am Rand)
  mit rotem Badge „Ergänzung“, Titel und roter Linie darunter, am Ende eine
  rote Linie mit „Ende der Ergänzung“ (Farbe nie einziger Hinweis), keine
  Kästen; `:anm` unterstreicht das Wort davor rot
  gepunktet und öffnet die Anmerkung, ab kompakt als Popover, am Handy als
  Drawer von unten (`ResponsivePopover`; DESIGN.md, „Elements by step“:
  keine Popups am Handy). Originaltext bleibt ohne Rot. Die erste
  Kurve eines Graphen in `--kurve` (chart-3 hell, chart-2 dunkel), weitere
  in anderer Farbe und Strichart, Namen an der Kurve statt einer Legende,
  Millimeterpapier wie im Übungsblatt.
- Kopf (56 px, auf niedrigen Querformat-Bildschirmen `short:` 48 px, dazu der
  sichere Bereich oben): Titel, „Kapitel 2 / 3“ (erst ab `md:`, darunter
  über der Seite, sonst passt die Zeile nicht), Tabs „Mit Ergänzungen | Nur
  Original“ und die Knöpfe „Inhalt“ (nur kompakt), „Auf dieser Seite“ (nicht
  bei den Wiederholungsfragen, die keine Abschnitte haben) und
  „Einstellungen“. Drei Stufen wie in den Apps (Entscheidung des Nutzers,
  2026-10-25; `useStep()` aus `src/lib/ohmtools/steps.ts` mit denselben
  Abfragen wie `compact:` und `wide:`, breit ab 64rem und 700 px Höhe):
  - breit (`wide:`): drei Spalten in einem Viewport, jede scrollt für sich
    (Suche und Kapitel 280 px, Seite höchstens 720 px mit 56 px Rand, rechts
    „Auf dieser Seite“ 280 px, schließbar, beim Start erst ab 80rem offen).
  - kompakt (`compact:`): eine Spalte (Seite höchstens 720 px mit 24 px
    Rand), alles in der Kopfzeile, keine Leiste. „Inhalt“ (Suche und
    Kapitel wie am Handy) und „Auf dieser Seite“ sind ein Blatt von rechts,
    380 px (`PanelSheet` mit `PanelHeader`); eine Wahl darin schließt es
    und geht dorthin.
  - schmal: eine Spalte und die Leiste „Skript | Inhalt | Einstellungen“
    (Tabs); die Seite bleibt beim Tabwechsel eingehängt.
- Einstellungen wie in den Apps (`Einstellungen.tsx`): breit der Dialog
  bis 1000 × 720 mit den Abschnitten links (`SettingsDialog`), kompakt eine
  Seite über Kopf und Spalten (`SettingsPage`, der Rest `inert`, sie kommt
  von rechts und geht dorthin zurück), am Handy im Tab dieselbe Liste ohne
  Pfeil zurück, denn sie ist die Wurzel des Tabs; jeder Abschnitt eine Seite
  mit Pfeil zurück. Abschnitte „Ansicht“ (Mit Ergänzungen / Nur Original,
  Hinweis zu hell und dunkel) und „Über dieses Skript“.
- Eine Seite pro Kapitel mit „Zurück/Weiter“ (Wunsch des Nutzers), danach
  eine eigene Seite „Wiederholungsfragen“ (`#/{kapitel}/wiederholungsfragen`):
  `KapitelSeite` rendert dort das ganze Kapitel und zeigt nur den Block
  `Fragen` (`data-fragen`). Suche über alle Kapitel (minisearch, Export
  `suchtext`: Original und Ergänzungen getrennt, die Fragen als eigener
  Abschnitt).
- Bewegung wie in den Apps, ohne Bibliothek (`transition()` und Kurve aus
  `src/lib/ohmtools/motion.ts`, `hereinschieben` in `src/lib/bewegung.ts`,
  `erscheinen` in `src/index.css`): die nächste Seite oder der Tab rechts
  davon kommt von rechts, die vorige von links (Web Animations API, `main`
  schneidet dabei seitlich ab); „Mit Ergänzungen | Nur Original“ blendet
  die Seite neu ein; „Auf dieser Seite“ gleitet breit per View Transition
  herein und hinaus, Blatt und Dialog bewegen sich wie in den Apps
  (`ui/sheet.tsx`, `ui/dialog.tsx`), die Seite der Einstellungen (kompakt)
  und ihre Abschnitte kommen von rechts und gehen nach rechts zurück; ein
  Sprung innerhalb der Seite scrollt sanft; Aufgedecktes (Antworten, Urteile, Rückmeldungen) und die Abschnitte
  im Kapitelbaum erscheinen mit `erscheinen`. Bei `prefers-reduced-motion`
  bewegt sich nichts.
- Sprung zu einem Abschnitt einer anderen Seite: `festhalten` in `App.tsx`
  richtet ihn höchstens eine Sekunde lang neu aus, bis sich die Seite gesetzt
  hat (Zeichenflächen und Graphen werden nach dem Einhängen kleiner), und
  hört auf, sobald der Nutzer scrollt. Jede scrollende Spalte und jeder
  waagrecht scrollende Block darin (Formeln, Tabellen, Code) ist `relative`,
  sonst verlängern absolut gesetzte Elemente (`sr-only`) das Dokument und
  `scrollIntoView` schiebt den Kopf weg.
- Weil die Seite eine Datei ohne eigene CSP ist, steht das
  Dunkelmodus-Skript inline in `index.html` (DESIGN.md, „Light and dark“).
  Die Oberfläche ist nur Deutsch, weil die Skripte deutsch sind; kein Logo
  und keine Version (die Seite ist ein Dokument, keine App).
- Prüfung: `npx --yes github:ohmtools/design check src/index.css src/styles/ohmtools.css components.json src/components/ui/*.tsx src/components/ohmtools/*.tsx src/components/shell/*.tsx src/lib/ohmtools/*.ts src/primitiven/*.tsx` (läuft in der CI).
- Sichtbare Änderungen bei 360, 400, 568 × 320, 768 × 1024, 834 × 1194,
  844 × 390 und 1440 px, hell und dunkel prüfen
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
