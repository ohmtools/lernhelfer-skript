# lernhelfer-skript

> **Hinweis:** Dieses Projekt wurde größtenteils mit KI generiert: Code,
> Konfiguration und Dokumentation sind mit
> [Claude Code](https://claude.com/claude-code) entstanden.

Vorlage für die Fähigkeit „Skript verbessern“ des
[Lernhelfers](https://github.com/ohmtools/claude-plugins): Claude macht aus
Seiten oder Kapiteln eines Skripts eine interaktive Webseite in **einer
einzigen HTML-Datei**. Der Originaltext bleibt Wort für Wort stehen, alles,
was Claude ergänzt (Erklärungen, Variablen zu jeder Gleichung, Erklärungen zu
Abbildungen, eigene Grafiken, interaktive Elemente, Wiederholungsfragen), ist
mit einer roten Linie markiert und lässt sich ausblenden.

Der Lernhelfer klont dieses Repository in Claude.ai, schreibt den Inhalt nach
`src/inhalt/` und baut die Seite. Die Bausteine für den Inhalt beschreibt
[ANLEITUNG.md](ANLEITUNG.md); das Beispiel in `src/inhalt/` benutzt jeden.

## Selbst benutzen

```sh
npm ci                 # Node 22 oder neuer
npm run dev            # Vorschau mit dem Beispiel
npm run pruefen        # Kapitel übersetzen und rendern
npm run build          # dist/index.html
```

Aussehen nach dem [ohmtools-Design](https://github.com/ohmtools/design),
gebaut mit Vite, React, shadcn/ui, MDX, KaTeX und Mafs.

## Lizenz

BSD-3-Clause, siehe [LICENSE](LICENSE). Das gilt für die Vorlage, nicht für
Skripte, die jemand damit aufbereitet: Deren Text gehört seinem Autor.
