import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Coordinates, Line, Mafs, Plot, Point, Vector } from "mafs";
import { cn } from "cn";
import { zahl } from "@/lib/format";
import { useExperiment, useWert, type Werte, type Wertbar } from "@/primitiven/experiment";
import { Gemischt, type Anker } from "@/primitiven/flaeche";

// Funktionsgraphen und Zeigerdiagramme mit Mafs auf Millimeterpapier
// (DESIGN.md, „Interactive parts and graphs“). Die erste Kurve in --kurve,
// 2,5 px; weitere unterscheiden sich in Farbe UND Strichart (Farbe ist nie
// der einzige Hinweis), etwa eine Bezugslinie grau gestrichelt. Keine
// Legende: Der Name steht am Ende der Kurve. Beschriftungen sind HTML mit
// KaTeX über dem Graphen.

const STILE = [
  { farbe: "var(--kurve)", strich: undefined, breite: 2.5 },
  { farbe: "var(--muted-foreground)", strich: "6 4", breite: 1.5 },
  { farbe: "var(--foreground)", strich: "2 4", breite: 2 },
  { farbe: "var(--muted-foreground)", strich: "9 4 2 4", breite: 1.5 },
];
const ZEIGER = [
  { farbe: "var(--kurve)", strich: undefined, breite: 2.5 },
  { farbe: "var(--foreground)", strich: "7 5", breite: 2 },
  { farbe: "var(--muted-foreground)", strich: "2 4", breite: 2 },
];

type Achse = { min: number; max: number };
type Graph = {
  x: Achse;
  y: Achse;
  /** Rechtes Ende des gewünschten Bereichs (ohne Rand), für die Namen der Kurven. */
  xEnde: number;
  breite: number;
  hoehe: number;
  ebene: HTMLDivElement | null;
};
const GraphContext = createContext<Graph | null>(null);

function px(g: Graph, [x, y]: [number, number]): [number, number] {
  return [
    ((x - g.x.min) / (g.x.max - g.x.min)) * g.breite,
    ((g.y.max - y) / (g.y.max - g.y.min)) * g.hoehe,
  ];
}

/** Ein schöner Rasterabstand für etwa sechs Linien. */
function schritt(spanne: number) {
  const roh = spanne / 6;
  const zehner = 10 ** Math.floor(Math.log10(roh));
  return [1, 2, 2.5, 5, 10].map((f) => f * zehner).find((s) => s >= roh) ?? roh;
}

/** Klasse für Namen an Bezugslinien: Wörter und Zahlen in Geist Mono 12 px, Formeln bleiben. */
const BEZUG = (text: string) =>
  !text.includes("$") && !/[\\_^{}]/.test(text)
    ? "font-mono text-xs leading-none"
    : "[&>span:not(:has(.katex))]:font-mono [&>span:not(:has(.katex))]:text-xs [&>span:not(:has(.katex))]:leading-none";

function GraphText({
  bei,
  text,
  anker = "oben rechts",
  farbe,
  bezug = false,
}: {
  bei: [number, number];
  text: string;
  anker?: Anker;
  farbe?: string;
  /** Name einer Bezugslinie (`Hilfslinie`, gestrichelte `Kurve`): in Mono. */
  bezug?: boolean;
}) {
  const g = useContext(GraphContext);
  if (!g?.ebene) return null;
  const [x, y] = px(g, bei);
  const verschiebung: Record<string, string> = {
    mitte: "-50%,-50%",
    oben: "-50%,-100%",
    unten: "-50%,0",
    links: "-100%,-50%",
    rechts: "0,-50%",
    "oben links": "-100%,-100%",
    "oben rechts": "0,-100%",
    "unten links": "-100%,0",
    "unten rechts": "0,0",
  };
  const dx = anker.includes("links") ? -5 : anker.includes("rechts") ? 5 : 0;
  const dy = anker.includes("oben") ? -5 : anker.includes("unten") ? 5 : 0;
  return createPortal(
    <span
      className={cn("absolute leading-none whitespace-nowrap", bezug && BEZUG(text))}
      style={{
        left: x + dx,
        top: y + dy,
        transform: `translate(${verschiebung[anker]})`,
        color: farbe,
      }}
    >
      <Gemischt text={text} />
    </span>,
    g.ebene,
  );
}

function Rahmen({
  x,
  y,
  hoehe,
  gleicherMassstab,
  beschriftung,
  oben,
  unten,
  children,
}: {
  x: [number, number];
  y: [number, number];
  hoehe?: number;
  gleicherMassstab?: boolean;
  beschriftung?: string;
  oben?: ReactNode;
  unten?: ReactNode;
  children: (g: Graph) => ReactNode;
}) {
  const huelle = useRef<HTMLDivElement>(null);
  const [breite, setBreite] = useState(0);
  const [ebene, setEbene] = useState<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const el = huelle.current;
    if (!el) return;
    const beobachter = new ResizeObserver(() => setBreite(Math.round(el.clientWidth)));
    beobachter.observe(el);
    setBreite(Math.round(el.clientWidth));
    return () => beobachter.disconnect();
  }, []);
  const h =
    gleicherMassstab && breite
      ? Math.min(320, (breite * (y[1] - y[0])) / (x[1] - x[0]))
      : (hoehe ?? 280);
  // Bei gleichem Maßstab und begrenzter Höhe wird die x-Spanne größer.
  const xSpanne = gleicherMassstab && breite ? ((y[1] - y[0]) * breite) / h : x[1] - x[0];
  const xMitte = (x[0] + x[1]) / 2;
  // Etwas Rand, damit die Zahlen an Achsen auf dem Rand sichtbar bleiben.
  const rx = gleicherMassstab ? 0 : 0.06 * (x[1] - x[0]);
  const ry = gleicherMassstab ? 0 : 0.08 * (y[1] - y[0]);
  const g: Graph = {
    x: gleicherMassstab
      ? { min: xMitte - xSpanne / 2, max: xMitte + xSpanne / 2 }
      : { min: x[0] - rx, max: x[1] + rx / 3 },
    y: { min: y[0] - ry, max: y[1] },
    xEnde: x[1],
    breite,
    hoehe: h,
    ebene,
  };
  return (
    <figure className="my-4">
      {oben}
      <div ref={huelle} className="relative w-full text-sm" style={{ height: h }}>
        {breite > 0 && !import.meta.env.SSR && (
          <GraphContext.Provider value={g}>
            <Mafs
              width={breite}
              height={h}
              pan={false}
              zoom={false}
              preserveAspectRatio={false}
              viewBox={{ x: [g.x.min, g.x.max], y: [g.y.min, g.y.max], padding: 0 }}
            >
              {children(g)}
            </Mafs>
          </GraphContext.Provider>
        )}
        <div ref={setEbene} className="pointer-events-none absolute inset-0" />
      </div>
      {unten}
      {beschriftung && (
        <figcaption className="mt-2 text-sm text-muted-foreground">{beschriftung}</figcaption>
      )}
    </figure>
  );
}

type KurveProps = {
  /** y = f(x, Werte der Regler). */
  f: (x: number, werte: Werte) => number;
  name?: string;
  /** Nur zwischen diesen x-Werten zeichnen. */
  bereich?: [number, number];
  nummer?: number;
};

/** Eine Kurve in einem `Funktionsgraph`; ihr Name steht an ihrem Ende. */
export function Kurve({ f, name, bereich, nummer = 0 }: KurveProps) {
  const { werte } = useExperiment();
  const g = useContext(GraphContext);
  const stil = STILE[nummer % STILE.length];
  if (import.meta.env.SSR) {
    // Auf dem Server (npm run pruefen) nur prüfen, dass f rechnet.
    for (const t of [0, 0.5, 1])
      f((bereich?.[0] ?? 0) + t * ((bereich?.[1] ?? 1) - (bereich?.[0] ?? 0)), werte);
    return null;
  }
  const ende = Math.min(bereich?.[1] ?? Infinity, g?.xEnde ?? Infinity);
  const yEnde = Number.isFinite(ende) ? f(ende, werte) : NaN;
  return (
    <>
      <Plot.OfX
        y={(x) => f(x, werte)}
        domain={bereich}
        color={stil.farbe}
        weight={stil.breite}
        svgPathProps={stil.strich ? { strokeDasharray: stil.strich } : undefined}
      />
      {name && Number.isFinite(yEnde) && (
        <GraphText
          bei={[ende, yEnde]}
          text={name}
          anker="oben links"
          farbe={stil.farbe}
          bezug={!!stil.strich}
        />
      )}
    </>
  );
}
Kurve.istKurve = true;

/** Ein markierter Punkt, z.B. ein Arbeitspunkt. */
export function Punkt({
  x,
  y,
  text,
  anker,
}: {
  x: Wertbar<number>;
  y: Wertbar<number>;
  text?: Wertbar<string>;
  anker?: Anker;
}) {
  const px = useWert(x);
  const py = useWert(y);
  const t = useWert(text ?? "");
  if (import.meta.env.SSR) return null;
  return (
    <>
      <Point x={px} y={py} color="var(--kurve)" />
      {t && <GraphText bei={[px, py]} text={t} anker={anker} farbe="var(--kurve)" />}
    </>
  );
}

/**
 * Gestrichelte Hilfslinie in `Funktionsgraph` und `Zeigerdiagramm`: von `von`
 * nach `nach`, oder mit `winkel` (Grad) als Gerade durch `von` (Standard:
 * Ursprung) über den ganzen Graphen, z.B. eine Wicklungsachse.
 */
export function Hilfslinie({
  von = [0, 0],
  nach,
  winkel,
  text,
  anker,
}: {
  von?: Wertbar<[number, number]>;
  nach?: Wertbar<[number, number]>;
  winkel?: Wertbar<number>;
  text?: Wertbar<string>;
  anker?: Anker;
}) {
  const g = useContext(GraphContext);
  const a = useWert(von);
  const b0 = useWert(nach ?? null);
  const w = useWert(winkel ?? null);
  const t = useWert(text ?? "");
  if (import.meta.env.SSR || !g) return null;
  const farbe = "var(--muted-foreground)";
  if (w === null && !b0) return null;
  const rad = ((w ?? 0) * Math.PI) / 180;
  // Bei `winkel` steht der Text kurz vor dem Rand des Graphen.
  const bis = (start: number, richtung: number, kleinst: number, groesst: number) =>
    richtung > 1e-9
      ? (groesst - start) / richtung
      : richtung < -1e-9
        ? (kleinst - start) / richtung
        : Infinity;
  const laenge = Math.min(
    bis(a[0], Math.cos(rad), g.x.min, g.x.max),
    bis(a[1], Math.sin(rad), g.y.min, g.y.max),
  );
  const b: [number, number] =
    b0 ??
    (Number.isFinite(laenge)
      ? [a[0] + 0.9 * laenge * Math.cos(rad), a[1] + 0.9 * laenge * Math.sin(rad)]
      : a);
  const richtung = `${b[1] >= a[1] ? "oben" : "unten"} ${b[0] >= a[0] ? "rechts" : "links"}`;
  return (
    <>
      {b0 ? (
        <Line.Segment point1={a} point2={b} color={farbe} style="dashed" weight={1} />
      ) : (
        <Line.PointAngle point={a} angle={rad} color={farbe} style="dashed" weight={1} />
      )}
      {t && <GraphText bei={b} text={t} anker={anker ?? (richtung as Anker)} bezug />}
    </>
  );
}

function nummerieren(children: ReactNode, merkmal: "istKurve" | "istZeiger") {
  let i = 0;
  return Children.map(children, (kind) => {
    if (!isValidElement(kind) || !(kind.type as unknown as Record<string, unknown>)[merkmal])
      return kind;
    const props = kind.props as { nummer?: number };
    return cloneElement(kind as ReactElement<{ nummer?: number }>, { nummer: props.nummer ?? i++ });
  });
}

/**
 * Achsenkreuz mit Kurven. Ohne Kurven ein leeres Koordinatensystem.
 * `x`, `y`: sichtbare Bereiche; `xText`, `yText`: Achsen, z.B. „$t$ in ms“.
 */
export function Funktionsgraph({
  x,
  y,
  xText,
  yText,
  xSchritt,
  ySchritt,
  hoehe,
  beschriftung,
  children,
}: {
  x: [number, number];
  y: [number, number];
  xText?: string;
  yText?: string;
  xSchritt?: number;
  ySchritt?: number;
  hoehe?: number;
  beschriftung?: string;
  children?: ReactNode;
}) {
  const kinder = nummerieren(children, "istKurve");
  if (import.meta.env.SSR) return <div>{kinder}</div>;
  const sx = xSchritt ?? schritt(x[1] - x[0]);
  const sy = ySchritt ?? schritt(y[1] - y[0]);
  return (
    <Rahmen
      x={x}
      y={y}
      hoehe={hoehe}
      beschriftung={beschriftung}
      oben={
        yText && (
          <p className="mb-1 text-sm">
            <Gemischt text={yText} />
          </p>
        )
      }
      unten={
        xText && (
          <p className="mt-1 text-right text-sm">
            <Gemischt text={xText} />
          </p>
        )
      }
    >
      {() => (
        <>
          <Coordinates.Cartesian
            xAxis={{ lines: sx, labels: (n) => zahl(n) }}
            yAxis={{ lines: sy, labels: (n) => zahl(n) }}
            subdivisions={5}
          />
          {kinder}
        </>
      )}
    </Rahmen>
  );
}

/** Ein Zeiger von `von` (Standard: Ursprung) nach `nach`, oder mit Betrag und Winkel in Grad. */
export function Zeiger({
  von = [0, 0],
  nach,
  betrag,
  winkel,
  name,
  nummer = 0,
}: {
  von?: Wertbar<[number, number]>;
  nach?: Wertbar<[number, number]>;
  betrag?: Wertbar<number>;
  winkel?: Wertbar<number>;
  name?: Wertbar<string>;
  nummer?: number;
}) {
  const a = useWert(von);
  const b0 = useWert(nach ?? null);
  const r = useWert(betrag ?? 0);
  const w = useWert(winkel ?? 0);
  const n = useWert(name ?? "");
  const b: [number, number] = b0 ?? [
    a[0] + r * Math.cos((w * Math.PI) / 180),
    a[1] + r * Math.sin((w * Math.PI) / 180),
  ];
  if (import.meta.env.SSR) return null;
  const stil = ZEIGER[nummer % ZEIGER.length];
  const rechts = b[0] >= a[0];
  const oben = b[1] >= a[1];
  return (
    <>
      <Vector
        tail={a}
        tip={b}
        color={stil.farbe}
        weight={stil.breite}
        svgLineProps={stil.strich ? { strokeDasharray: stil.strich } : undefined}
      />
      {n && (
        <GraphText
          bei={b}
          text={n}
          farbe={stil.farbe}
          anker={`${oben ? "oben" : "unten"} ${rechts ? "rechts" : "links"}` as Anker}
        />
      )}
    </>
  );
}
Zeiger.istZeiger = true;

/** Zeigerdiagramm mit gleichem Maßstab auf beiden Achsen, optional mit Achsen „Re“/„Im“. */
export function Zeigerdiagramm({
  x,
  y,
  achsen = true,
  xText = "Re",
  yText = "Im",
  beschriftung,
  children,
}: {
  x: [number, number];
  y: [number, number];
  achsen?: boolean;
  xText?: string;
  yText?: string;
  beschriftung?: string;
  children?: ReactNode;
}) {
  const kinder = nummerieren(children, "istZeiger");
  if (import.meta.env.SSR) return <div>{kinder}</div>;
  return (
    <Rahmen x={x} y={y} gleicherMassstab beschriftung={beschriftung}>
      {(g) => (
        <>
          {achsen && (
            <>
              <Coordinates.Cartesian
                xAxis={{ lines: false, labels: false }}
                yAxis={{ lines: false, labels: false }}
                subdivisions={false}
              />
              <GraphText bei={[g.x.max, 0]} text={xText} anker="unten links" />
              <GraphText bei={[0, g.y.max]} text={yText} anker="unten rechts" />
            </>
          )}
          {kinder}
        </>
      )}
    </Rahmen>
  );
}
