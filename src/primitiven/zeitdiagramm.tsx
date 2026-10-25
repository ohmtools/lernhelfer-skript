import { Gemischt } from "@/primitiven/flaeche";
import { useWert, type Wertbar } from "@/primitiven/experiment";

// Digitale Signalverläufe mit denselben Zeichen wie das Übungsblatt
// (tikz-timing): L low, H high, C Taktflanke (wechselt jedes Mal), Z
// hochohmig, X undefiniert, U unbekannt, S leer, D{Text} Datenwort; eine Zahl
// davor ist die Länge, `8{C}` sind acht Taktwechsel.

type Abschnitt = { art: "L" | "H" | "Z" | "X" | "U" | "S" | "D"; laenge: number; text?: string };

const MUSTER = /(\d+(?:\.\d+)?)?\s*(?:\{([A-Z])\}|D\{([^}]*)\}|([LHCZXUSD]))/g;

export function zerlege(folge: string): Abschnitt[] {
  const teile: Abschnitt[] = [];
  let pegel: "L" | "H" = "L";
  for (const m of folge.matchAll(MUSTER)) {
    const n = m[1] ? Number(m[1]) : 1;
    const zeichen = m[2] ?? (m[3] != null ? "D" : m[4]);
    if (zeichen === "C") {
      for (let i = 0; i < n; i++) {
        pegel = pegel === "L" ? "H" : "L";
        teile.push({ art: pegel, laenge: 1 });
      }
    } else if (zeichen === "D") {
      teile.push({ art: "D", laenge: n, text: m[3] ?? "" });
    } else {
      if (zeichen === "L" || zeichen === "H") pegel = zeichen;
      teile.push({ art: zeichen as Abschnitt["art"], laenge: n });
    }
  }
  return teile;
}

const B = 28; // Breite einer Zeiteinheit in px
const H = 22; // Höhe eines Signals
const ABSTAND = 14;

function Signal({ folge, breite }: { folge: string; breite: number }) {
  const teile = zerlege(folge);
  const y = (art: string) => (art === "H" ? 0 : art === "L" ? H : H / 2);
  const pfade: string[] = [];
  const muster: string[] = [];
  const texte: { x: number; text: string }[] = [];
  let x = 0;
  let vorher: Abschnitt | null = null;
  for (const t of teile) {
    const w = t.laenge * B;
    if (t.art === "L" || t.art === "H" || t.art === "Z") {
      const yy = y(t.art);
      if (vorher && vorher.art !== "S")
        pfade.push(
          `M${x},${y(vorher.art === "D" || vorher.art === "X" || vorher.art === "U" ? "Z" : vorher.art)} L${x},${yy}`,
        );
      pfade.push(`M${x},${yy} L${x + w},${yy}`);
    } else if (t.art === "D" || t.art === "X" || t.art === "U") {
      const s = 4;
      pfade.push(
        `M${x},${H / 2} L${x + s},0 L${x + w - s},0 L${x + w},${H / 2} L${x + w - s},${H} L${x + s},${H} Z`,
      );
      if (t.art !== "D")
        muster.push(
          `M${x + s},0 L${x + w - s},0 L${x + w},${H / 2} L${x + w - s},${H} L${x + s},${H} L${x},${H / 2} Z`,
        );
      if (t.art === "D") texte.push({ x: x + w / 2, text: t.text ?? "" });
    }
    x += w;
    vorher = t;
  }
  return (
    <svg
      width={breite * B}
      height={H}
      className="overflow-visible"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinejoin="round"
    >
      {muster.map((d, i) => (
        <path key={`m${i}`} d={d} fill="currentColor" fillOpacity={0.12} stroke="none" />
      ))}
      <path d={pfade.join(" ")} />
      {texte.map(({ x: tx, text }, i) => (
        <text
          key={i}
          x={tx}
          y={H / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill="currentColor"
          stroke="none"
          fontSize={11}
        >
          {text}
        </text>
      ))}
    </svg>
  );
}

/** Eine Zeile pro Signal: `signale={[["CLK", "L 8{C}"], ["D", "2L 3H 2L 2H"]]}`. */
export function Zeitdiagramm({
  signale,
  beschriftung,
}: {
  signale: Wertbar<[string, string][]>;
  beschriftung?: string;
}) {
  const zeilen = useWert(signale);
  const breite = Math.max(
    ...zeilen.map(([, f]) => zerlege(f).reduce((s, t) => s + t.laenge, 0)),
    1,
  );
  return (
    <figure className="my-4">
      <div className="relative overflow-x-auto">
        <div
          className="mx-auto grid w-max grid-cols-[auto_auto] items-center gap-x-4 text-sm"
          style={{ rowGap: ABSTAND }}
        >
          {zeilen.map(([name, folge], i) => (
            <div key={i} className="contents">
              <span className="text-right">
                <Gemischt text={name} />
              </span>
              <Signal folge={folge} breite={breite} />
            </div>
          ))}
          <span />
          <svg
            width={breite * B}
            height={8}
            aria-hidden
            className="text-border"
            stroke="currentColor"
          >
            {Array.from({ length: breite + 1 }, (_, i) => (
              <line key={i} x1={i * B} x2={i * B} y1={0} y2={6} />
            ))}
          </svg>
        </div>
      </div>
      {beschriftung && (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground">
          {beschriftung}
        </figcaption>
      )}
    </figure>
  );
}
