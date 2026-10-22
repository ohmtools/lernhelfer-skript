import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "cn";
import { Tex } from "@/primitiven/Tex";

// Zeichenfläche für `Zeichnung` und `Schaltung`: Koordinaten in Rastereinheiten
// mit dem Ursprung unten links (y nach oben, wie TikZ), eine Einheit = 40 px.
// Linien sind SVG in `currentColor`, Beschriftungen HTML mit KaTeX über dem
// SVG (kein foreignObject, das ist auf dem iPad unzuverlässig).

export const EINHEIT = 40;
const RAND = 1;

export type P = [number, number];

type Flaeche = {
  /** Rasterpunkt → Pixel im SVG. */
  px: (p: P) => P;
  breite: number;
  hoehe: number;
  ebene: HTMLDivElement | null;
};

const FlaecheContext = createContext<Flaeche | null>(null);

export function useFlaeche() {
  const f = useContext(FlaecheContext);
  if (!f) throw new Error("Dieser Baustein gehört in eine <Zeichnung> oder <Schaltung>.");
  return f;
}

export function Flaeche({
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
  const [ebene, setEbene] = useState<HTMLDivElement | null>(null);
  const w = (breite + 2 * RAND) * EINHEIT;
  const h = (hoehe + 2 * RAND) * EINHEIT;
  // Ist die Spalte schmaler (Handy), wird die ganze Fläche samt Beschriftung
  // verkleinert, damit nichts abgeschnitten wird.
  const huelle = useRef<HTMLDivElement>(null);
  const [platz, setPlatz] = useState(w);
  useLayoutEffect(() => {
    const el = huelle.current;
    if (!el) return;
    const messen = () => setPlatz(el.clientWidth || w);
    const beobachter = new ResizeObserver(messen);
    beobachter.observe(el);
    messen();
    return () => beobachter.disconnect();
  }, [w]);
  const massstab = Math.min(1, platz / w);
  const px = ([x, y]: P): P => [(x + RAND) * EINHEIT, (hoehe - y + RAND) * EINHEIT];
  return (
    <figure className="my-4">
      <div ref={huelle} style={{ height: h * massstab }}>
        <div
          className="relative mx-auto origin-top-left"
          style={{
            width: w,
            height: h,
            transform: massstab < 1 ? `scale(${massstab})` : undefined,
          }}
        >
          <svg
            width={w}
            height={h}
            viewBox={`0 0 ${w} ${h}`}
            className="absolute inset-0 overflow-visible text-foreground"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden={beschriftung ? undefined : true}
            role={beschriftung ? "img" : undefined}
            aria-label={beschriftung}
          >
            <FlaecheContext.Provider value={{ px, breite, hoehe, ebene }}>
              {children}
            </FlaecheContext.Provider>
          </svg>
          <div ref={setEbene} className="pointer-events-none absolute inset-0 text-sm" />
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

export type Anker =
  | "mitte"
  | "oben"
  | "unten"
  | "links"
  | "rechts"
  | "oben links"
  | "oben rechts"
  | "unten links"
  | "unten rechts";

// Wo der Text relativ zum Punkt steht ("oben" = über dem Punkt).
const VERSCHIEBUNG: Record<Anker, string> = {
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

/** Text an einem Punkt in Pixeln der Fläche. Formeln zwischen `$…$`. */
export function TextBei({
  px: [x, y],
  text,
  anker = "mitte",
  abstand = 4,
  className,
}: {
  px: P;
  text: string;
  anker?: Anker;
  abstand?: number;
  className?: string;
}) {
  const { ebene } = useFlaeche();
  if (!ebene) return null;
  const dx = anker.includes("links") ? -abstand : anker.includes("rechts") ? abstand : 0;
  const dy = anker.includes("oben") ? -abstand : anker.includes("unten") ? abstand : 0;
  return createPortal(
    <span
      className={cn("absolute leading-none whitespace-nowrap", className)}
      style={{ left: x + dx, top: y + dy, transform: `translate(${VERSCHIEBUNG[anker]})` }}
    >
      <Gemischt text={text} />
    </span>,
    ebene,
  );
}

/** Text mit Formeln zwischen `$…$`; ohne `$` ganz als Formel, wenn er wie eine aussieht. */
export function Gemischt({ text }: { text: string }) {
  if (!text.includes("$")) return /[\\_^{}]/.test(text) ? <Tex>{text}</Tex> : <>{text}</>;
  return (
    <>
      {text
        .split(/(\$[^$]+\$)/)
        .map((teil, i) =>
          teil.startsWith("$") ? (
            <Tex key={i}>{teil.slice(1, -1)}</Tex>
          ) : (
            <span key={i}>{teil}</span>
          ),
        )}
    </>
  );
}

/** Ein Formelzeichen wie „R“ oder „U_0“ kursiv als Formel, Wörter als Text. */
export function Zeichen({ text }: { text: string }) {
  if (text.includes("$")) return <Gemischt text={text} />;
  return /^\p{L}$/u.test(text) || /[\\_^{}]/.test(text) ? <Tex>{text}</Tex> : <>{text}</>;
}
