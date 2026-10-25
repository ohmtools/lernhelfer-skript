import type { ReactNode } from "react";
import { useWert, type Wertbar } from "@/primitiven/experiment";
import { EINHEIT, Flaeche, TextBei, useFlaeche, type Anker, type P } from "@/primitiven/flaeche";

// Freie Zeichnung (Aufbau, Geometrie, Feldbild …) aus wenigen Formen. Wie im
// Übungsblatt gibt es nur die Stile `akzent` (rot) und `hilfslinie`
// (gestrichelt, grau), keine eigenen Farben.

export type Stil = "normal" | "akzent" | "hilfslinie";

export function stilProps(stil: Stil = "normal") {
  if (stil === "akzent") return { className: "text-red", stroke: "currentColor" };
  if (stil === "hilfslinie")
    return { className: "text-muted-foreground", strokeDasharray: "4 4", strokeWidth: 1 };
  return {};
}

export function Zeichnung({
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

export function Pfeilspitze({ von, nach, groesse = 8 }: { von: P; nach: P; groesse?: number }) {
  const winkel = Math.atan2(nach[1] - von[1], nach[0] - von[0]);
  const [x, y] = nach;
  const a = (w: number): P => [
    x - groesse * Math.cos(winkel + w),
    y - groesse * Math.sin(winkel + w),
  ];
  const [p1, p2] = [a(0.4), a(-0.4)];
  return (
    <path
      d={`M${x},${y} L${p1[0]},${p1[1]} L${p2[0]},${p2[1]} Z`}
      fill="currentColor"
      stroke="none"
    />
  );
}

/** Linienzug durch `punkte`, mit `pfeil` eine Spitze am Ende. */
export function Linie({
  punkte,
  stil,
  pfeil = false,
  geschlossen = false,
}: {
  punkte: Wertbar<P[]>;
  stil?: Stil;
  pfeil?: boolean;
  geschlossen?: boolean;
}) {
  const { px } = useFlaeche();
  const pts = useWert(punkte).map(px);
  if (pts.length < 2) return null;
  const d =
    pts.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ") + (geschlossen ? " Z" : "");
  return (
    <g {...stilProps(stil)}>
      <path d={d} />
      {pfeil && <Pfeilspitze von={pts.at(-2)!} nach={pts.at(-1)!} />}
    </g>
  );
}

export function Pfeil({
  von,
  nach,
  stil,
  text,
  anker = "oben",
}: {
  von: Wertbar<P>;
  nach: Wertbar<P>;
  stil?: Stil;
  text?: string;
  anker?: Anker;
}) {
  const a = useWert(von);
  const b = useWert(nach);
  return (
    <>
      <Linie punkte={[a, b]} stil={stil} pfeil />
      {text && (
        <Beschriftung bei={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]} text={text} anker={anker} />
      )}
    </>
  );
}

export function Kreis({
  mitte,
  radius,
  stil,
  gefuellt = false,
}: {
  mitte: Wertbar<P>;
  radius: Wertbar<number>;
  stil?: Stil;
  gefuellt?: boolean;
}) {
  const { px } = useFlaeche();
  const [x, y] = px(useWert(mitte));
  return (
    <g {...stilProps(stil)}>
      <circle
        cx={x}
        cy={y}
        r={useWert(radius) * EINHEIT}
        fill={gefuellt ? "currentColor" : "none"}
      />
    </g>
  );
}

export function Rechteck({
  von,
  nach,
  stil,
  gefuellt = false,
}: {
  von: Wertbar<P>;
  nach: Wertbar<P>;
  stil?: Stil;
  gefuellt?: boolean;
}) {
  const { px } = useFlaeche();
  const [x1, y1] = px(useWert(von));
  const [x2, y2] = px(useWert(nach));
  return (
    <g {...stilProps(stil)}>
      <rect
        x={Math.min(x1, x2)}
        y={Math.min(y1, y2)}
        width={Math.abs(x2 - x1)}
        height={Math.abs(y2 - y1)}
        fill={gefuellt ? "currentColor" : "none"}
        fillOpacity={gefuellt ? 0.15 : undefined}
      />
    </g>
  );
}

/** Text an einem Rasterpunkt, Formeln zwischen `$…$`. */
export function Beschriftung({
  bei,
  text,
  anker = "mitte",
  stil,
}: {
  bei: Wertbar<P>;
  text: Wertbar<string>;
  anker?: Anker;
  stil?: Stil;
}) {
  const { px } = useFlaeche();
  return (
    <TextBei
      px={px(useWert(bei))}
      text={useWert(text)}
      anker={anker}
      className={
        stil === "akzent" ? "text-red" : stil === "hilfslinie" ? "text-muted-foreground" : undefined
      }
    />
  );
}
