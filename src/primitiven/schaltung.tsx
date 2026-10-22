import type { ReactNode } from "react";
import { useWert, type Wertbar } from "@/primitiven/experiment";
import {
  EINHEIT as U,
  Flaeche,
  TextBei,
  useFlaeche,
  type Anker,
  type P,
} from "@/primitiven/flaeche";
import { Pfeilspitze } from "@/primitiven/zeichnung";

// Schaltpläne nach DIN EN 60617, wie im Übungsblatt des Lernhelfers: Spule
// als gefülltes Rechteck, gerade Spannungspfeile, OPV als Rechteck mit ▷∞,
// Gatter in Rechteckform mit Negationskreis. Zweipole liegen wie in circuitikz
// zwischen zwei Rasterpunkten (`von`, `nach`), Mehrpole an einem Punkt (`bei`)
// mit festen Anschlüssen (ANLEITUNG.md, Kapitel „Schaltungen“).

export function Schaltung({
  breite,
  hoehe,
  beschriftung,
  children,
}: {
  breite: number;
  hoehe: number;
  beschriftung?: string;
  children: ReactNode;
}) {
  return (
    <Flaeche breite={breite} hoehe={hoehe} beschriftung={beschriftung}>
      {children}
    </Flaeche>
  );
}

const sieht = (t: string) => /[\\_^{}]/.test(t) && !t.includes("$");
// Ein einzelner Buchstabe oder ein Zeichen mit Index ist ein Formelzeichen
// (kursiv), „LED“ oder „OPV“ bleiben Text.
const alsText = (t?: string) => (t ? (sieht(t) || /^\p{L}$/u.test(t) ? `$${t}$` : t) : "");

function ankerFuer([nx, ny]: P): Anker {
  if (ny < -0.5) return "oben";
  if (ny > 0.5) return "unten";
  return nx < 0 ? "links" : "rechts";
}

const plus = (a: P, b: P): P => [a[0] + b[0], a[1] + b[1]];
const mal = (a: P, k: number): P => [a[0] * k, a[1] * k];

export type ZweipolProps = {
  von: Wertbar<P>;
  nach: Wertbar<P>;
  /** Formelzeichen, z.B. `R_1`. */
  name?: Wertbar<string>;
  /** Wert hinter dem Namen, z.B. „4,7 kΩ“. */
  wert?: Wertbar<string>;
  /** Seite der Beschriftung in Richtung von → nach. */
  seite?: "links" | "rechts";
  /** Spannungspfeil auf der anderen Seite, von `von` nach `nach`. */
  spannung?: Wertbar<string>;
  spannungUmkehren?: boolean;
  /** Strompfeil auf der Leitung, von `von` nach `nach`. */
  strom?: Wertbar<string>;
  stromUmkehren?: boolean;
  akzent?: Wertbar<boolean>;
};

type Koerper = { laenge: number; halb: number; zeichnen: (l: number) => ReactNode };

function Zweipol({ props, koerper }: { props: ZweipolProps; koerper: Koerper }) {
  const { px } = useFlaeche();
  const a = px(useWert(props.von));
  const b = px(useWert(props.nach));
  const name = useWert(props.name ?? "");
  const wert = useWert(props.wert ?? "");
  const spannung = useWert(props.spannung ?? "");
  const strom = useWert(props.strom ?? "");
  const akzent = useWert(props.akzent ?? false);

  const d: P = [b[0] - a[0], b[1] - a[1]];
  const L = Math.hypot(...d) || 1;
  const u: P = [d[0] / L, d[1] / L];
  const links: P = [u[1], -u[0]];
  const n = props.seite === "rechts" ? mal(links, -1) : links;
  const bl = Math.min(koerper.laenge, L - 8);
  const start = plus(a, mal(u, (L - bl) / 2));
  const ende = plus(start, mal(u, bl));
  const mitte = plus(a, mal(d, 0.5));
  const winkel = (Math.atan2(u[1], u[0]) * 180) / Math.PI;

  const beschriftung = [alsText(name), wert].filter(Boolean).join(" = ");

  // Spannungspfeil gegenüber der Beschriftung, Strompfeil auf der längeren Zuleitung.
  const sAbstand = koerper.halb + 10;
  const sRichtung = props.spannungUmkehren ? -1 : 1;
  const s1 = plus(plus(mitte, mal(n, -sAbstand)), mal(u, (-sRichtung * (bl + 16)) / 2));
  const s2 = plus(plus(mitte, mal(n, -sAbstand)), mal(u, (sRichtung * (bl + 16)) / 2));
  const zuleitung1 = (L - bl) / 2;
  const iOrt =
    zuleitung1 >= 14 ? plus(a, mal(u, zuleitung1 / 2)) : plus(ende, mal(u, zuleitung1 / 2));
  const iRichtung = props.stromUmkehren ? -1 : 1;

  return (
    <g className={akzent ? "text-primary" : undefined}>
      <path
        d={`M${a[0]},${a[1]} L${start[0]},${start[1]} M${ende[0]},${ende[1]} L${b[0]},${b[1]}`}
      />
      <g transform={`translate(${mitte[0]},${mitte[1]}) rotate(${winkel})`}>
        {koerper.zeichnen(bl)}
      </g>
      {beschriftung && (
        <TextBei
          px={plus(mitte, mal(n, koerper.halb + 2))}
          text={beschriftung}
          anker={ankerFuer(n)}
        />
      )}
      {spannung && (
        <>
          <path d={`M${s1[0]},${s1[1]} L${s2[0]},${s2[1]}`} strokeWidth={1.2} />
          <Pfeilspitze von={s1} nach={s2} groesse={7} />
          <TextBei
            px={plus(mitte, mal(n, -sAbstand - 2))}
            text={alsText(spannung)}
            anker={ankerFuer(mal(n, -1))}
          />
        </>
      )}
      {strom && (
        <>
          <Pfeilspitze
            von={plus(iOrt, mal(u, -iRichtung * 6))}
            nach={plus(iOrt, mal(u, iRichtung * 4))}
            groesse={8}
          />
          <TextBei px={plus(iOrt, mal(n, 6))} text={alsText(strom)} anker={ankerFuer(n)} />
        </>
      )}
    </g>
  );
}

const zweipol = (koerper: Koerper) => (props: ZweipolProps) => (
  <Zweipol props={props} koerper={koerper} />
);

export const Widerstand = zweipol({
  laenge: U,
  halb: 7,
  zeichnen: (l) => <rect x={-l / 2} y={-7} width={l} height={14} />,
});

export const VerstellbarerWiderstand = zweipol({
  laenge: U,
  halb: 14,
  zeichnen: (l) => (
    <>
      <rect x={-l / 2} y={-7} width={l} height={14} />
      <path d="M-14,14 L14,-14" />
      <Pfeilspitze von={[-14, 14]} nach={[16, -16]} groesse={7} />
    </>
  ),
});

export const Kondensator = zweipol({
  laenge: 8,
  halb: 12,
  zeichnen: () => <path d="M-4,-12 L-4,12 M4,-12 L4,12" strokeWidth={2} />,
});

export const Spule = zweipol({
  laenge: U,
  halb: 6,
  zeichnen: (l) => <rect x={-l / 2} y={-6} width={l} height={12} fill="currentColor" />,
});

export const Spannungsquelle = zweipol({
  laenge: 28,
  halb: 14,
  zeichnen: () => (
    <>
      <circle r={14} />
      <path d="M-14,0 L14,0" />
    </>
  ),
});

export const Stromquelle = zweipol({
  laenge: 28,
  halb: 14,
  zeichnen: () => (
    <>
      <circle r={14} />
      <path d="M0,-14 L0,14" />
    </>
  ),
});

export const Wechselquelle = zweipol({
  laenge: 28,
  halb: 14,
  zeichnen: () => (
    <>
      <circle r={14} />
      <path d="M-8,0 C-5,-8 -3,-8 0,0 S5,8 8,0" />
    </>
  ),
});

/** Lange Platte (+) auf der Seite von `von`. */
export const Batterie = zweipol({
  laenge: 10,
  halb: 12,
  zeichnen: () => (
    <>
      <path d="M-5,-12 L-5,12" />
      <path d="M5,-6 L5,6" strokeWidth={4} strokeLinecap="butt" />
    </>
  ),
});

/** Anode bei `von`, Kathode bei `nach`. */
export const Diode = zweipol({
  laenge: 22,
  halb: 10,
  zeichnen: () => (
    <path d="M-11,-10 L-11,10 L9,0 Z M9,-10 L9,10" fill="currentColor" fillOpacity={0} />
  ),
});

export const ZDiode = zweipol({
  laenge: 22,
  halb: 12,
  zeichnen: () => <path d="M-11,-10 L-11,10 L9,0 Z M5,-12 L9,-10 L9,10 L13,12" />,
});

export const LED = zweipol({
  laenge: 22,
  halb: 22,
  zeichnen: () => (
    <>
      <path d="M-11,-10 L-11,10 L9,0 Z M9,-10 L9,10" />
      <path d="M-2,-12 L6,-20 M4,-10 L12,-18" strokeWidth={1.2} />
      <Pfeilspitze von={[-2, -12]} nach={[7, -21]} groesse={5} />
      <Pfeilspitze von={[4, -10]} nach={[13, -19]} groesse={5} />
    </>
  ),
});

export const Lampe = zweipol({
  laenge: 24,
  halb: 12,
  zeichnen: () => (
    <>
      <circle r={12} />
      <path d="M-8.5,-8.5 L8.5,8.5 M-8.5,8.5 L8.5,-8.5" />
    </>
  ),
});

export const Sicherung = zweipol({
  laenge: 32,
  halb: 6,
  zeichnen: (l) => (
    <>
      <rect x={-l / 2} y={-6} width={l} height={12} />
      <path d={`M${-l / 2},0 L${l / 2},0`} />
    </>
  ),
});

/** Schalter, `geschlossen` darf von einem Regler abhängen. */
export function Schalter({
  geschlossen = false,
  ...props
}: ZweipolProps & { geschlossen?: Wertbar<boolean> }) {
  const zu = useWert(geschlossen);
  return (
    <Zweipol
      props={props}
      koerper={{
        laenge: 30,
        halb: 12,
        zeichnen: () => (
          <>
            <path d={zu ? "M-15,0 L15,0" : "M-15,0 L12,-12"} />
            <circle cx={-15} r={2} fill="currentColor" />
            <circle cx={15} r={2} fill="currentColor" />
          </>
        ),
      }}
    />
  );
}

/** Messgerät, `art` z.B. „A“ (Strom) oder „V“ (Spannung). */
export function Messgeraet({ art = "V", ...props }: ZweipolProps & { art?: string }) {
  return (
    <Zweipol
      props={props}
      koerper={{
        laenge: 26,
        halb: 13,
        zeichnen: () => (
          <>
            <circle r={13} />
            <text
              textAnchor="middle"
              dominantBaseline="central"
              fill="currentColor"
              stroke="none"
              fontSize={13}
              fontWeight={600}
            >
              {art}
            </text>
          </>
        ),
      }}
    />
  );
}

// Leitungen und Punkte

export function Leitung({ punkte, akzent }: { punkte: Wertbar<P[]>; akzent?: Wertbar<boolean> }) {
  const { px } = useFlaeche();
  const pts = useWert(punkte).map(px);
  const hervor = useWert(akzent ?? false);
  return (
    <path
      className={hervor ? "text-primary" : undefined}
      d={pts.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ")}
    />
  );
}

export function Knoten({
  bei,
  name: nameAngabe,
  anker = "oben rechts",
}: {
  bei: P;
  name?: Wertbar<string>;
  anker?: Anker;
}) {
  const { px } = useFlaeche();
  const name = useWert(nameAngabe ?? "");
  const [x, y] = px(bei);
  return (
    <>
      <circle cx={x} cy={y} r={3} fill="currentColor" stroke="none" />
      {name && <TextBei px={[x, y]} text={alsText(name)} anker={anker} />}
    </>
  );
}

export function Klemme({
  bei,
  name: nameAngabe,
  anker = "links",
}: {
  bei: P;
  name?: Wertbar<string>;
  anker?: Anker;
}) {
  const { px } = useFlaeche();
  const name = useWert(nameAngabe ?? "");
  const [x, y] = px(bei);
  return (
    <>
      <circle cx={x} cy={y} r={3.5} fill="var(--background)" />
      {name && <TextBei px={[x, y]} text={alsText(name)} anker={anker} abstand={8} />}
    </>
  );
}

export function Masse({ bei }: { bei: P }) {
  const { px } = useFlaeche();
  const [x, y] = px(bei);
  return (
    <path
      d={`M${x},${y} L${x},${y + 10} M${x - 10},${y + 10} L${x + 10},${y + 10} M${x - 6.5},${y + 14} L${x + 6.5},${y + 14} M${x - 3},${y + 18} L${x + 3},${y + 18}`}
    />
  );
}

// Mehrpole: fester Bezugspunkt `bei`, Anschlüsse in Rastereinheiten daneben.

function Mehrpol({
  bei,
  name: nameAngabe,
  akzent,
  children,
  namePos,
}: {
  bei: P;
  name?: Wertbar<string>;
  akzent?: Wertbar<boolean>;
  children: (q: (dx: number, dy: number) => P) => ReactNode;
  namePos?: [number, number, Anker];
}) {
  const { px } = useFlaeche();
  const name = useWert(nameAngabe ?? "");
  const hervor = useWert(akzent ?? false);
  const q = (dx: number, dy: number) => px([bei[0] + dx, bei[1] + dy]);
  const [nx, ny, anker] = namePos ?? [0, 1.1, "oben"];
  return (
    <g className={hervor ? "text-primary" : undefined}>
      {children(q)}
      {name && <TextBei px={q(nx, ny)} text={alsText(name)} anker={anker} />}
    </g>
  );
}

const linie = (...pts: P[]) => pts.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");

/** Operationsverstärker: − bei (−1,5|+0,5), + bei (−1,5|−0,5), Ausgang bei (+1,5|0). */
export function OPV({
  bei,
  name,
  akzent,
  plusOben = false,
}: {
  bei: P;
  name?: Wertbar<string>;
  akzent?: Wertbar<boolean>;
  plusOben?: boolean;
}) {
  const oben = plusOben ? "+" : "−";
  const unten = plusOben ? "−" : "+";
  return (
    <Mehrpol bei={bei} name={name} akzent={akzent} namePos={[0, 1.05, "oben"]}>
      {(q) => {
        const [x1, y1] = q(-0.8, 1);
        const [x2, y2] = q(0.8, -1);
        return (
          <>
            <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1} />
            <path
              d={`${linie(q(-1.5, 0.5), q(-0.8, 0.5))} ${linie(q(-1.5, -0.5), q(-0.8, -0.5))} ${linie(q(0.8, 0), q(1.5, 0))}`}
            />
            <text
              x={q(-0.6, 0.5)[0]}
              y={q(0, 0.5)[1]}
              dominantBaseline="central"
              fill="currentColor"
              stroke="none"
              fontSize={14}
            >
              {oben}
            </text>
            <text
              x={q(-0.6, -0.5)[0]}
              y={q(0, -0.5)[1]}
              dominantBaseline="central"
              fill="currentColor"
              stroke="none"
              fontSize={14}
            >
              {unten}
            </text>
            <text
              x={q(0.1, 0)[0]}
              y={q(0, 0.55)[1]}
              textAnchor="middle"
              dominantBaseline="central"
              fill="currentColor"
              stroke="none"
              fontSize={13}
            >
              ▷ ∞
            </text>
          </>
        );
      }}
    </Mehrpol>
  );
}

/** Bipolartransistor: Basis bei (−1|0), Kollektor bei (+0,5|+1), Emitter bei (+0,5|−1). */
export function Transistor({
  bei,
  typ = "npn",
  name,
  akzent,
}: {
  bei: P;
  typ?: "npn" | "pnp";
  name?: Wertbar<string>;
  akzent?: Wertbar<boolean>;
}) {
  return (
    <Mehrpol bei={bei} name={name} akzent={akzent} namePos={[0.7, 0, "rechts"]}>
      {(q) => {
        const e1 = q(-0.25, -0.2);
        const e2 = q(0.5, -0.6);
        return (
          <>
            <path
              d={`${linie(q(-1, 0), q(-0.25, 0))} ${linie(q(-0.25, 0.2), q(0.5, 0.6), q(0.5, 1))} ${linie(e1, e2, q(0.5, -1))}`}
            />
            <path d={linie(q(-0.25, 0.45), q(-0.25, -0.45))} strokeWidth={3} strokeLinecap="butt" />
            {typ === "npn" ? (
              <Pfeilspitze von={e1} nach={e2} groesse={8} />
            ) : (
              <Pfeilspitze von={e2} nach={e1} groesse={8} />
            )}
          </>
        );
      }}
    </Mehrpol>
  );
}

/** MOSFET (Anreicherung): Gate bei (−1|0), Drain bei (+0,5|+1), Source bei (+0,5|−1). */
export function MOSFET({
  bei,
  typ = "n",
  name,
  akzent,
}: {
  bei: P;
  typ?: "n" | "p";
  name?: Wertbar<string>;
  akzent?: Wertbar<boolean>;
}) {
  return (
    <Mehrpol bei={bei} name={name} akzent={akzent} namePos={[0.7, 0, "rechts"]}>
      {(q) => {
        const innen = q(-0.2, 0);
        const aussen = q(0.5, 0);
        return (
          <>
            <path d={`${linie(q(-1, 0), q(-0.4, 0))} ${linie(q(-0.4, -0.45), q(-0.4, 0.45))}`} />
            <path
              d={`${linie(q(-0.2, 0.25), q(-0.2, 0.45))} ${linie(q(-0.2, -0.1), q(-0.2, 0.1))} ${linie(q(-0.2, -0.45), q(-0.2, -0.25))}`}
              strokeWidth={2.5}
              strokeLinecap="butt"
            />
            <path
              d={`${linie(q(-0.2, 0.35), q(0.5, 0.35), q(0.5, 1))} ${linie(q(-0.2, -0.35), q(0.5, -0.35), q(0.5, -1))} ${linie(innen, aussen, q(0.5, -0.35))}`}
            />
            {typ === "n" ? (
              <Pfeilspitze von={aussen} nach={innen} groesse={7} />
            ) : (
              <Pfeilspitze von={innen} nach={q(0.25, 0)} groesse={7} />
            )}
          </>
        );
      }}
    </Mehrpol>
  );
}

/** Transformator: A1 (−1|+1), A2 (−1|−1) links, B1 (+1|+1), B2 (+1|−1) rechts. */
export function Transformator({
  bei,
  name,
  akzent,
}: {
  bei: P;
  name?: Wertbar<string>;
  akzent?: Wertbar<boolean>;
}) {
  return (
    <Mehrpol bei={bei} name={name} akzent={akzent} namePos={[0, 1.1, "oben"]}>
      {(q) => {
        const spule = (x: number) => {
          const [x1, y1] = q(x - 0.1, 0.8);
          const [x2, y2] = q(x + 0.1, -0.8);
          return <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1} fill="currentColor" />;
        };
        return (
          <>
            {spule(-0.35)}
            {spule(0.35)}
            <path
              d={`${linie(q(-0.06, 0.9), q(-0.06, -0.9))} ${linie(q(0.06, 0.9), q(0.06, -0.9))}`}
            />
            <path
              d={`${linie(q(-1, 1), q(-0.35, 1), q(-0.35, 0.8))} ${linie(q(-1, -1), q(-0.35, -1), q(-0.35, -0.8))} ${linie(q(1, 1), q(0.35, 1), q(0.35, 0.8))} ${linie(q(1, -1), q(0.35, -1), q(0.35, -0.8))}`}
            />
          </>
        );
      }}
    </Mehrpol>
  );
}

const GATTER = {
  und: { zeichen: "&", negiert: false },
  oder: { zeichen: "≥1", negiert: false },
  xor: { zeichen: "=1", negiert: false },
  nicht: { zeichen: "1", negiert: true },
  nand: { zeichen: "&", negiert: true },
  nor: { zeichen: "≥1", negiert: true },
  xnor: { zeichen: "=1", negiert: true },
} as const;

function gatterEingaenge(anzahl: number) {
  return anzahl === 1 ? [0] : anzahl === 2 ? [0.5, -0.5] : [0.6, 0, -0.6].slice(0, anzahl);
}

/**
 * Gatter in Rechteckform: Eingänge bei (−1,2|+0,5) und (−1,2|−0,5) (bei drei:
 * +0,6, 0, −0,6; bei `nicht` einer bei (−1,2|0)), Ausgang bei (+1,2|0).
 */
export function Gatter({
  bei,
  typ,
  eingaenge,
  name,
  akzent,
}: {
  bei: P;
  typ: keyof typeof GATTER;
  eingaenge?: 1 | 2 | 3;
  name?: Wertbar<string>;
  akzent?: Wertbar<boolean>;
}) {
  const { zeichen, negiert } = GATTER[typ];
  const anzahl = typ === "nicht" ? 1 : (eingaenge ?? 2);
  const h = anzahl === 3 ? 1 : 0.8;
  return (
    <Mehrpol bei={bei} name={name} akzent={akzent} namePos={[0, h + 0.1, "oben"]}>
      {(q) => {
        const [x1, y1] = q(-0.6, h);
        const [x2, y2] = q(0.6, -h);
        const r = 0.12 * U;
        const [ax, ay] = q(0.6, 0);
        return (
          <>
            <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1} />
            <text
              x={q(0, 0)[0]}
              y={y1 + 14}
              textAnchor="middle"
              dominantBaseline="central"
              fill="currentColor"
              stroke="none"
              fontSize={13}
            >
              {zeichen}
            </text>
            <path
              d={gatterEingaenge(anzahl)
                .map((dy) => linie(q(-1.2, dy), q(-0.6, dy)))
                .join(" ")}
            />
            {negiert && <circle cx={ax + r} cy={ay} r={r} />}
            <path d={linie([ax + (negiert ? 2 * r : 0), ay], q(1.2, 0))} />
          </>
        );
      }}
    </Mehrpol>
  );
}
