# Anleitung: Vorlage `lernhelfer-skript`

Diese Anleitung richtet sich an **KI-Modelle**, die ein Skript als Webseite
aufbereiten. Aussehen, Navigation, Suche, hellen und dunklen Modus und das
Bauen zu einer einzigen HTML-Datei erledigt die Vorlage. Deine Aufgabe ist der
**Inhalt**: der Originaltext und deine Ergänzungen, ausgedrückt mit den
Bausteinen aus dieser Anleitung.

---

## Inhalt

1. [Dateien und Bauen](#1-dateien-und-bauen)
2. [Goldene Regeln](#2-goldene-regeln)
3. [Grundgerüst eines Kapitels](#3-grundgerüst-eines-kapitels)
4. [Angaben zum Skript](#4-angaben-zum-skript)
5. [Originaltext](#5-originaltext)
6. [Formeln](#6-formeln)
7. [Ergänzungen](#7-ergänzungen)
8. [Fragen](#8-fragen)
9. [Eigene Grafiken: Zeichnung und Zeitdiagramm](#9-eigene-grafiken-zeichnung-und-zeitdiagramm)
10. [Schaltungen](#10-schaltungen)
11. [Funktionsgraphen und Zeigerdiagramme](#11-funktionsgraphen-und-zeigerdiagramme)
12. [Interaktive Elemente](#12-interaktive-elemente)
13. [Welcher Baustein für welchen Inhalt?](#13-welcher-baustein-für-welchen-inhalt)
14. [Häufige Fehler](#14-häufige-fehler)
15. [Checkliste](#15-checkliste)

---

## 1. Dateien und Bauen

Du schreibst nur in `src/inhalt/`:

| Datei | Inhalt |
|---|---|
| `src/inhalt/skript.json` | Angaben zum Skript (Kapitel 4) |
| `src/inhalt/01-name.mdx`, `02-…` | Ein Kapitel pro Datei, sortiert nach der Nummer im Namen |
| `src/inhalt/bilder/` | Abbildungen des Originals (PNG oder JPEG), Namen klein, ohne Leerzeichen, z.B. `s12-1.png` |

Alles andere bleibt unverändert. Die Befehle laufen im Ordner der Vorlage:

| Befehl | Was er tut |
|---|---|
| `npm ci --omit=dev` | Installiert die Pakete (einmal, braucht Internet). |
| `npm run mdx -- <entwurf-ordner> --ersetzen` | Macht aus Entwürfen (`.md`) Kapitel (`.mdx`) in `src/inhalt/`, maskiert dabei `{`, `}` und `<` im Text und kopiert `<entwurf-ordner>/bilder/`. `--ersetzen` löscht vorher das Beispiel. |
| `npm run wortlaut -- <dateien> --gegen <referenz>` | Vergleicht den Originaltext Wort für Wort (Kapitel 2, Regel 1). |
| `npm run pruefen` | Übersetzt und rendert jedes Kapitel, meldet Fehler mit Datei und Zeile. |
| `npm run build` | Erzeugt `dist/index.html`, eine Datei mit allem darin (wenige Sekunden bis eine Minute). |
| `npm run quelle -- <ziel.zip>` | Packt den Quellcode ohne `node_modules` und `dist`, zum Weitermachen in einem neuen Chat. |
| `npm run ausschnitt -- <pdf> <seite> <links> <oben> <rechts> <unten> <ziel.png>` | Schneidet eine Abbildung aus einer PDF-Seite aus (Kapitel 5). |

Das Beispiel in `src/inhalt/` (drei Kapitel) benutzt **jeden** Baustein. Ist
dir einer unklar, lies dort die Stelle, die ihn benutzt.

---

## 2. Goldene Regeln

1. **Der Originaltext bleibt Wort für Wort stehen.** Du ordnest ihn nur mit
   Markdown (Überschriften, Absätze, Listen, Tabellen) und setzt Formeln in
   LaTeX. Du korrigierst, kürzt und ergänzt darin nichts, auch keine
   Tippfehler. `npm run wortlaut` prüft das.
2. **Alles, was du hinzufügst, steht in einer Ergänzung** (Kapitel 7 und 8).
   Text außerhalb einer Ergänzung gilt als Original.
3. **Nur die Bausteine aus dieser Anleitung.** Kein HTML, keine Klassen, keine
   Farben, keine Abstände. JSX (`<Baustein />`) steht nur in `:::grafik` und
   `:::interaktiv`.
4. **Abbildungen des Originals bleiben Bilder.** Eine eigene, gezeichnete
   oder interaktive Fassung kommt zusätzlich als `:::grafik` oder
   `:::interaktiv`, nie statt des Bilds.
5. **Ergänzungen sind knapp und lassen Denken übrig.** Eine Anmerkung hat
   höchstens etwa fünf Sätze. Wo der Leser etwas selbst herausfinden kann,
   nimm `:::denkanstoss` statt einer fertigen Erklärung.
6. **Jede Ergänzung stimmt.** Rechne Zahlen nach, bevor sie in eine
   Ergänzung kommen, und nenne zu fachlichen Aussagen die Fundstelle, z.B.
   `(skript.pdf, S. 12)`.

---

## 3. Grundgerüst eines Kapitels

```markdown
# 2 Das RC-Glied

::seite[3]

Originaltext der Seite 3 …

## 2.1 Aufladen

Weiter im Original …

:::frage[Was beschreibt die Zeitkonstante?]
Wie schnell der Kondensator lädt: Nach τ ist er zu etwa 63 % geladen.
:::

::seite[4]

## 2.2 Wechselspannung
```

- Jedes Kapitel beginnt mit **genau einer** Überschrift `#`, dem Kapiteltitel
  des Originals. Sie steht im Kapitelbaum.
- Abschnitte sind `##`, Unterabschnitte `###`. Sie stehen unter „Auf dieser
  Seite“ und im Kapitelbaum. Überschriften nur aus dem Original, nie in
  Ergänzungen.
- `::seite[12]` steht dort, wo im Original-PDF Seite 12 beginnt (Seite wie im
  PDF-Programm gezählt, ab 1). Die Zahlen steigen. Die Seite zeigt daraus
  „Seite 12 im Original“ und den Seitenbereich des Kapitels.
- Wiederholungsfragen stehen am Ende jedes Abschnitts (`##`), vor der
  nächsten Überschrift.

---

## 4. Angaben zum Skript

`src/inhalt/skript.json`, alle Werte Text, nur `titel` ist Pflicht:

```json
{
  "titel": "Grundlagen der Elektrotechnik",
  "fach": "Elektrotechnik 1",
  "autor": "Prof. Dr. Muster, TH Beispielstadt",
  "quelle": "skript.pdf",
  "umfang": "Seiten 1–40"
}
```

`titel` ist der Titel des Originals (Titelblatt), `autor` sein Autor,
`quelle` der Dateiname, `umfang` die aufbereiteten Seiten. Das Datum setzt das
Bauen selbst.

---

## 5. Originaltext

| Im Original | In MDX |
|---|---|
| Absatz | Absatz, eine Leerzeile dazwischen |
| Aufzählung, Nummerierung | `- …`, `1. …` |
| Tabelle | Markdown-Tabelle mit Kopfzeile |
| Hervorhebung | `*kursiv*`, `**fett**`, wie im Original |
| Code, Konsolenausgabe | Codeblock mit Sprache, z.B. ` ```c `; Sprachen: `python`, `c`, `cpp`, `asm`, `riscv`, `verilog`, `vhdl`, `matlab`, `java`, `javascript`, `bash`, `text` |
| Fußnote | `Text[^1]` und am Ende des Absatzes `[^1]: Fußnotentext` |
| Abbildung | `![Abb. 3.2: Bildunterschrift des Originals](bilder/s12-1.png)` |

- Kopf- und Fußzeilen, Seitenzahlen und Silbentrennung am Zeilenende des PDFs
  übernimmst du nicht.
- **Abbildungen:** Der Text in den eckigen Klammern ist die Bildunterschrift
  des Originals, wortgleich (die Prüfung zählt ihn mit). Hat die Abbildung
  keine, schreib `![](bilder/…)`. Ein Bild steht allein in seinem Absatz.
  Ist es eine schwarze Strichzeichnung auf Weiß, häng `"invertieren"` an:
  `![Abb. 1.1: Stromkreis](bilder/s1-1.png "invertieren")`, dann erscheint
  es im dunklen Modus hell auf dunkel. Bei Fotos und farbigen Bildern nie.
- **Ausschneiden:** Rastergrafiken einer Seite liefert
  `pdfimages -f 12 -l 12 -png skript.pdf bilder/s12`. Gezeichnete
  Abbildungen schneidest du aus der Seite aus, mit Angaben von 0 bis 1
  relativ zur Seite (links, oben, rechts, unten):
  `npm run ausschnitt -- skript.pdf 12 0.1 0.35 0.9 0.7 bilder/s12-1.png`.
  Sieh dir jeden Ausschnitt an und korrigiere die Angaben, bis die ganze
  Abbildung samt Beschriftung drin ist, aber nicht ihre Bildunterschrift
  (die steht als Text darunter). `--grau` macht die Datei kleiner, `--dpi 200`
  schärfer. Größe pro Bild am besten unter 200 KB, die Seite enthält alle
  Bilder.

---

## 6. Formeln

- Im Text `$U = R \cdot I$`, abgesetzt:

  ```markdown
  $$
  U = R \cdot I \tag{1.1}
  $$
  ```

- Die Nummer des Originals kommt mit `\tag{…}` an den rechten Rand.
- Setz Formeln so, wie sie im Original stehen, nur sauber in LaTeX: gleiche
  Zeichen, gleiche Reihenfolge. Variablen kursiv (Standard), Indizes, die
  Wörter sind, aufrecht: `U_\mathrm{eff}`, `R_\mathrm{ges}`.
- Einheiten mit `\mathrm{}` und schmalem Abstand: `12\,\mathrm{V}`,
  `4{,}7\,\mathrm{k\Omega}` (Dezimalkomma als `{,}`).
- Verboten: `\color`, `\textcolor`, `\colorbox`, `\href`. Farben kommen nur
  aus dem Design.
- Eine Formel, die sich nicht setzen lässt, bricht `npm run pruefen` mit Zeile
  und Fehler ab.

---

## 7. Ergänzungen

Ergänzungen schreibst du als Markierungen mit drei Doppelpunkten. Sie
erscheinen mit einer roten Linie links und der Beschriftung „Ergänzung · …“
und lassen sich mit „Nur Original“ ausblenden. Innen steht normales Markdown
mit Formeln.

| Markierung | Wofür |
|---|---|
| `:::variablen` | Direkt nach jeder Gleichung, deren Symbole der Text dort nicht erklärt: jedes Symbol mit Bedeutung und Einheit. |
| `:::anmerkung[Titel]` | Fehlender Zwischenschritt, Anschauung, Zusammenhang, Erklärung einer Abbildung (Titel z.B. „Zur Abbildung 3.2“). Titel freiwillig. |
| `:::denkanstoss[Frage]` | Eine Frage zum Selbstdenken; der Inhalt ist die Auflösung, verdeckt bis „Auflösung zeigen“. |
| `:::grafik[Titel]` | Eine eigene Grafik aus Bausteinen (Kapitel 9 bis 11), darunter ein, zwei Sätze. |
| `:::interaktiv[Titel]` | Etwas zum Ausprobieren mit Reglern (Kapitel 12), darunter ein Satz „Probier: …“. |
| `:anm[…]` | Ein kurzer Hinweis mitten im Satz, z.B. `Widerstand:anm[der Wert R, nicht das Bauteil]`. |

```markdown
$$
\tau = R C \tag{2.2}
$$

:::variablen
- $\tau$: Zeitkonstante, in s
- $R$: Widerstand, in Ω
- $C$: Kapazität, in F
:::

:::anmerkung[Warum steigt die Kurve immer langsamer?]
Je voller der Kondensator, desto kleiner die Spannung am Widerstand und damit
der Ladestrom. (skript.pdf, S. 3)
:::

:::denkanstoss[Was passiert, wenn R gegen null geht?]
$\tau \to 0$: Der Kondensator wäre sofort geladen, der Ladestrom unendlich groß.
:::
```

- Eine Markierung endet mit `:::` in einer eigenen Zeile.
- `:anm` hängt direkt am Wort davor (ohne Leerzeichen) oder steht nach einem
  Leerzeichen; der Text darin ist kurz und ohne Formeln mit `]`.
- Andere Namen gibt es nicht; `npm run pruefen` meldet unbekannte.

---

## 8. Fragen

Wiederholungsfragen fragen das gerade Gelesene aus dem Gedächtnis ab: kurz,
ohne neues Wissen, nicht trivial. Fragen hintereinander erscheinen als ein
Block „Wiederholungsfragen“, nummeriert. Die Antwort bleibt verdeckt, bis der
Leser sie aufdeckt.

```markdown
:::frage[Was passiert mit dem Strom, wenn sich der Widerstand verdoppelt?]
Er halbiert sich, denn $I = U/R$.
:::

:::auswahl[Welche Aussagen über einen ohmschen Widerstand stimmen?]
- [x] Seine Kennlinie ist eine Gerade durch den Ursprung.
- [ ] Sein Widerstand steigt mit der Spannung.
- [x] Doppelte Spannung bedeutet doppelten Strom.

Bei einem ohmschen Widerstand ist $R$ konstant.
:::

:::rechnen[An 4,7 kΩ liegen 12 V. Wie groß ist der Strom in mA?]{ergebnis=2.55 toleranz=0.02 einheit="mA"}
$I = U/R = 12\,\mathrm{V} / 4{,}7\,\mathrm{k\Omega} \approx 2{,}55\,\mathrm{mA}$
:::
```

- `:::frage[Frage]`: Der Inhalt ist die Musterantwort. Der Leser kann vorher
  eine eigene Antwort tippen.
- `:::auswahl[Frage]`: eine Liste mit `[x]` (richtig) und `[ ]` (falsch),
  mindestens eine richtig; eine richtige Antwort → Optionsfelder, mehrere →
  Kästchen. Text nach der Liste ist die Erklärung nach dem Prüfen. Jede
  falsche Option steht für eine echte Fehlvorstellung.
- `:::rechnen[Frage]{ergebnis=… toleranz=… einheit="…"}`: `ergebnis` und
  `toleranz` mit Punkt als Dezimalzeichen in der Einheit der Frage, `toleranz`
  absolut (±). Der Inhalt ist der Lösungsweg. Rechne das Ergebnis nach.

---

## 9. Eigene Grafiken: Zeichnung und Zeitdiagramm

Alle Zeichenflächen (`Zeichnung`, `Schaltung`) rechnen in **Rastereinheiten**:
Ursprung unten links, x nach rechts, y nach oben, eine Einheit sind 40 px.
`breite` und `hoehe` geben den Bereich an; rundherum bleibt eine Einheit Rand
für Beschriftungen. Auf schmalen Bildschirmen verkleinert sich die ganze
Fläche. Punkte sind `[x, y]`.

### `Zeichnung`

```mdx
:::grafik[Feld im Plattenkondensator]
<Zeichnung breite={6} hoehe={3}>
  <Rechteck von={[1, 0]} nach={[1.2, 3]} gefuellt />
  <Pfeil von={[1.3, 1.5]} nach={[4.7, 1.5]} stil="akzent" text="$\vec{E}$" />
  <Linie punkte={[[1.2, -0.3], [4.8, -0.3]]} stil="hilfslinie" />
  <Beschriftung bei={[3, -0.3]} text="$d$" anker="unten" />
  <Kreis mitte={[3, 1]} radius={0.08} gefuellt />
</Zeichnung>
Das Feld zeigt von der positiven zur negativen Platte.
:::
```

| Baustein | Angaben |
|---|---|
| `Zeichnung` | `breite`, `hoehe`, `beschriftung` (Bildunterschrift, freiwillig) |
| `Linie` | `punkte` (Liste), `pfeil` (Spitze am Ende), `geschlossen`, `stil` |
| `Pfeil` | `von`, `nach`, `text` (in der Mitte), `anker`, `stil` |
| `Kreis` | `mitte`, `radius` (in Einheiten), `gefuellt`, `stil` |
| `Rechteck` | `von`, `nach` (gegenüberliegende Ecken), `gefuellt`, `stil` |
| `Beschriftung` | `bei`, `text`, `anker`, `stil` |

- `stil`: `akzent` (rot, für das Wichtige, z.B. Feldlinien), `hilfslinie`
  (dünn, gestrichelt, grau), sonst normal. Keine anderen Farben.
- `text`: Formeln zwischen `$…$`, z.B. `"$U_0$ = 12 V"`. Ein Text wie `U_0`
  ohne `$` gilt ganz als Formel.
- `anker`: wo der Text vom Punkt aus steht: `oben`, `unten`, `links`,
  `rechts`, `oben links`, `oben rechts`, `unten links`, `unten rechts`,
  `mitte`.

### `Zeitdiagramm`

```mdx
<Zeitdiagramm signale={[["CLK", "L 8{C}"], ["D", "2L 3H 2L 2H"], ["Bus", "2D{0x00} 4D{0x3F} 3X"]]} />
```

Eine Zeile pro Signal, `[Name, Folge]`, mit den Zeichen des Übungsblatts:
`L` low, `H` high, `C` Taktflanke (wechselt jedes Mal), `Z` hochohmig, `X`
undefiniert, `U` unbekannt, `S` leer, `D{Text}` Datenwort. Eine Zahl davor ist
die Länge: `3H`, `8{C}` (acht Taktwechsel). Alle Zeilen gleich lang.

---

## 10. Schaltungen

Schaltzeichen nach DIN EN 60617 (Spule als gefülltes Rechteck, gerade
Spannungspfeile, OPV als Rechteck, Gatter in Rechteckform). Zweipole liegen
zwischen zwei Rasterpunkten `von` und `nach`, verbunden mit `Leitung`.

```mdx
:::grafik[Reihenschaltung mit Zählpfeilen]
<Schaltung breite={7} hoehe={3}>
  <Spannungsquelle von={[0, 0]} nach={[0, 3]} spannung="U" spannungUmkehren />
  <Widerstand von={[0, 3]} nach={[7, 3]} name="R" strom="I" spannung="U_R" />
  <Lampe von={[7, 3]} nach={[7, 0]} name="L" spannung="U_L" />
  <Leitung punkte={[[7, 0], [0, 0]]} />
</Schaltung>
:::
```

### Zweipole

`Widerstand`, `VerstellbarerWiderstand`, `Kondensator`, `Spule`,
`Spannungsquelle`, `Stromquelle`, `Wechselquelle`, `Batterie` (lange Platte,
+, bei `von`), `Diode` (Anode bei `von`), `ZDiode`, `LED`, `Lampe`,
`Sicherung`, `Schalter` (`geschlossen`), `Messgeraet` (`art="A"`, `"V"` …).

| Angabe | Bedeutung |
|---|---|
| `von`, `nach` | Anschlüsse; dazwischen sitzt das Zeichen, der Rest ist Leitung |
| `name` | Formelzeichen, z.B. `R_1` (ein Buchstabe oder mit Index wird kursiv; „LED“ bleibt Text) |
| `wert` | Text hinter dem Namen, z.B. `"4,7 kΩ"` → „R₁ = 4,7 kΩ“ |
| `seite` | `"rechts"` setzt die Beschriftung auf die andere Seite (in Richtung von → nach gesehen) |
| `spannung` | Spannungspfeil auf der anderen Seite, von `von` nach `nach`; `spannungUmkehren` dreht ihn |
| `strom` | Strompfeil auf der Leitung, von `von` nach `nach`; `stromUmkehren` dreht ihn |
| `akzent` | zeichnet den Zweipol rot |

### Leitungen und Punkte

`Leitung punkte={[[0, 0], [3, 0], [3, 2]]}` (rechtwinklig über Eckpunkte),
`Knoten bei={[3, 0]}` (Verbindungspunkt), `Klemme bei={[0, 2]} name="A"`
(offener Anschluss), `Masse bei={[3, 0]}` (zeigt nach unten). `Pfeil` und
`Beschriftung` aus Kapitel 9 gehen auch in einer Schaltung.

### Mehrpole

Ein Bezugspunkt `bei={[x, y]}`; die Anschlüsse liegen fest daneben
(Rastereinheiten relativ zu `bei`). Verbinde sie mit `Leitung`.

| Baustein | Anschlüsse |
|---|---|
| `OPV` | − bei (−1,5 \| +0,5), + bei (−1,5 \| −0,5), Ausgang bei (+1,5 \| 0); `plusOben` tauscht + und − |
| `Transistor typ="npn"` (oder `"pnp"`) | Basis (−1 \| 0), Kollektor (+0,5 \| +1), Emitter (+0,5 \| −1) |
| `MOSFET typ="n"` (oder `"p"`) | Gate (−1 \| 0), Drain (+0,5 \| +1), Source (+0,5 \| −1) |
| `Transformator` | A1 (−1 \| +1), A2 (−1 \| −1), B1 (+1 \| +1), B2 (+1 \| −1) |
| `Gatter typ="und"` | Eingänge (−1,2 \| +0,5) und (−1,2 \| −0,5), Ausgang (+1,2 \| 0) |

`Gatter`: `typ` ist `und` (&), `oder` (≥1), `xor` (=1), `nicht` (1, ein
Eingang bei (−1,2 | 0)), `nand`, `nor`, `xnor` (mit Negationskreis);
`eingaenge={3}` gibt drei Eingänge bei +0,6, 0 und −0,6. Alle Mehrpole nehmen
`name` und `akzent`.

---

## 11. Funktionsgraphen und Zeigerdiagramme

```mdx
<Funktionsgraph x={[0, 5]} y={[0, 1.1]} xText="$t$ in ms" yText="$u_C / U_0$">
  <Kurve f={(t) => 1 - Math.exp(-t)} name="$u_C/U_0$" />
  <Kurve f={(t) => Math.exp(-t)} name="$i/I_0$" />
  <Punkt x={1} y={0.632} text="$\tau$" />
</Funktionsgraph>
```

- `x`, `y`: sichtbare Bereiche; `xText`, `yText`: Achsen mit Einheit;
  `xSchritt`, `ySchritt`: Rasterabstand (sonst automatisch); `hoehe` in px
  (Standard 280); `beschriftung`.
- `Kurve f={(x) => …}`: eine Funktion in JavaScript (`Math.exp`, `Math.sin`,
  `Math.sqrt`, `Math.PI` …), Bogenmaß. `name` kommt in die Legende,
  `bereich={[a, b]}` begrenzt sie. Kurven unterscheiden sich von selbst in
  Farbe und Strichart, setze keine Farben.
- `Punkt x y text anker`: ein markierter Punkt.
- Ohne Kurven ist es ein leeres Koordinatensystem.
- Logarithmische Achsen gibt es nicht: rechne in Zehnerpotenzen und
  beschrifte die Achse entsprechend, z.B. `xText="$\log_{10}(f/\mathrm{Hz})$"`.

```mdx
<Zeigerdiagramm x={[-0.5, 3]} y={[-0.5, 3]}>
  <Zeiger nach={[2.5, 0]} name="$\underline{U}_C$" />
  <Zeiger betrag={2} winkel={90} name="$\underline{I}_C$" />
</Zeigerdiagramm>
```

- Gleicher Maßstab auf beiden Achsen, Achsen „Re“ und „Im“ (`xText`, `yText`
  ändern sie, `achsen={false}` blendet sie aus).
- `Zeiger`: `nach={[x, y]}` oder `betrag` und `winkel` in Grad, `von`
  (Standard Ursprung, z.B. für Zeiger hintereinander), `name`.

---

## 12. Interaktive Elemente

In `:::interaktiv` stellt der Leser Werte mit `Regler` ein. Jeder Baustein im
selben Block nimmt statt einer festen Angabe auch eine **Funktion der Werte**:
`({ R, C }) => …`. Bei `Kurve` kommen die Werte als zweites Argument:
`f={(t, { R, C }) => …}`.

```mdx
:::interaktiv[Aufladen des Kondensators]
<Regler name="R" min={100} max={10000} start={1000} einheit="Ω" skala="log" />
<Regler name="C" min={0.0000001} max={0.00001} start={0.000001} einheit="F" skala="log" />
<Wert tex="\tau = RC" wert={({ R, C }) => R * C} einheit="s" />
<Funktionsgraph x={[0, 0.05]} y={[0, 1.1]} xText="$t$ in s" yText="$u_C / U_0$">
  <Kurve f={(t, { R, C }) => 1 - Math.exp(-t / (R * C))} name="$u_C/U_0$" />
  <Punkt x={({ R, C }) => R * C} y={0.632} text="$\tau$" />
</Funktionsgraph>
Probier: Verdopple $R$ oder $C$. Wohin wandert der Punkt bei $\tau$?
:::
```

| Baustein | Angaben |
|---|---|
| `Regler` | `name` (unter dem ihn andere lesen), `tex` (Anzeige, sonst `name`), `min`, `max`, `start`, `schritt`, `einheit`, `skala="log"` für Werte über mehrere Zehnerpotenzen |
| `Regler art="schalter"` | zwei Zustände 0 und 1, beschriftet mit `aus` und `an` (z.B. `aus="offen" an="geschlossen"`) |
| `Wert` | `tex` (linke Seite), `wert` (Zahl oder Funktion), `einheit`, `stellen` (gültige Ziffern, Standard 3) |

- Werte in **SI-Grundeinheiten** (Ω, F, s, V, A); die Anzeige setzt selbst
  Vorsätze und Dezimalkomma: 0.000001 F → „1 µF“.
- Werte, die auf Regler reagieren: `Schalter geschlossen={({ S }) => S === 1}`,
  `strom`, `spannung`, `name`, `wert`, `akzent` der Schaltzeichen, `punkte`
  von `Linie`, `x`/`y` von `Punkt`, Zeiger, Signalfolgen eines
  `Zeitdiagramm`.
- Halte Experimente klein: zwei, drei Regler und eine Darstellung, die zeigt,
  worauf es ankommt. Schreib darunter, was der Leser ausprobieren und
  entdecken soll, ohne das Ergebnis zu verraten.
- Eine Funktion, die einen Fehler wirft, zeigt `npm run pruefen` mit den
  Startwerten an.

---

## 13. Welcher Baustein für welchen Inhalt?

| Inhalt | Baustein |
|---|---|
| Gleichung des Originals | `$$ … \tag{} $$`, danach `:::variablen` |
| Fehlender Zwischenschritt, Anschauung | `:::anmerkung` |
| Abbildung des Originals erklären | `:::anmerkung[Zur Abbildung …]` |
| Etwas, das der Leser selbst herausfinden kann | `:::denkanstoss` |
| Kurzer Begriff im Satz | `:anm[…]` |
| Abschnittsende | `:::frage`, `:::auswahl`, `:::rechnen` |
| Schaltung zeichnen, Zählpfeile ergänzen | `:::grafik` mit `Schaltung` |
| Logikschaltung | `Schaltung` mit `Gatter` |
| Funktion, Kennlinie, Ladekurve | `Funktionsgraph` |
| Zeigerdiagramm | `Zeigerdiagramm` |
| Signalverläufe, Takt, Bus | `Zeitdiagramm` |
| Aufbau, Feldbild, Geometrie | `Zeichnung` |
| Zusammenhang zum Ausprobieren | `:::interaktiv` mit `Regler` und einer Darstellung |

---

## 14. Häufige Fehler

| Meldung oder Problem | Ursache, Lösung |
|---|---|
| `Unexpected character` / `Could not parse expression` | `{`, `}` oder `<` im Text: `\{`, `\}`, `\<` schreiben (`npm run mdx` erledigt das für Entwürfe). In Formeln und Code nicht nötig. |
| `JSX und {…} nur in :::grafik oder :::interaktiv` | Ein Baustein außerhalb dieser Ergänzungen, oder ein `<` im Text. |
| `Unbekannte Markierung „:::…“` | Tippfehler im Namen oder ein Name, den es nicht gibt (Kapitel 7, 8). |
| Uhrzeit oder `R:C` verschwindet | Kann nicht passieren: Unbekannte `:wort` bleiben Text. |
| `Expected component … to be defined` | Ein Baustein, den es nicht gibt, oder ein Tippfehler im Namen. |
| `Formel lässt sich nicht setzen` | LaTeX-Fehler; Zeile steht dabei. |
| `Bild fehlt: bilder/…` | Datei nicht in `src/inhalt/bilder/` oder anders geschrieben. |
| `Nur eine Überschrift # pro Kapitel` | Zweiter Kapiteltitel in derselben Datei: Kapitel teilen. |
| `Keine Überschriften in Ergänzungen` | Überschrift in einer Markierung: als fetten Text schreiben. |
| Wortlaut: „fehlt / steht stattdessen“ | Originaltext geändert oder vergessen; mit dem Original vergleichen und korrigieren. |
| Wortlaut: „Kurze Auslassungen“ | Meist Formeltext oder Text in Abbildungen aus pdftotext: nur durchsehen. |
| Beschriftungen überlappen in einer Schaltung | `seite="rechts"`, größere Abstände zwischen den Bauteilen oder größere `breite`. |

---

## 15. Checkliste

- [ ] Jedes Kapitel: eine `#`, `::seite[n]` an jedem Seitenanfang, Seiten
      aufsteigend.
- [ ] Originaltext wortgleich: `npm run wortlaut` ohne Fehler.
- [ ] Jede Gleichung mit unerklärten Symbolen hat `:::variablen`.
- [ ] Jede Abbildung des Originals als Bild mit Originalunterschrift, dazu
      eine Erklärung.
- [ ] Jeder Abschnitt endet mit zwei bis vier Wiederholungsfragen.
- [ ] Ergänzungen knapp, nachgerechnet, mit Fundstelle.
- [ ] `npm run pruefen` ohne Fehler, `npm run build` erzeugt `dist/index.html`.
