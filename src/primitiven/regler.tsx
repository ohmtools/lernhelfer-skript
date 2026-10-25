import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { groesse } from "@/lib/format";
import { useExperiment, useWert, type Wertbar } from "@/primitiven/experiment";
import { Zeichen } from "@/primitiven/flaeche";
import * as prosa from "@/primitiven/prosa";
import { Tex } from "@/primitiven/Tex";

type ReglerProps = {
  /** Name des Werts, unter dem ihn andere Bausteine lesen, z.B. `R`. */
  name: string;
  /** Formelzeichen in TeX oder ein Wort, sonst `name`. */
  tex?: string;
  min?: number;
  max?: number;
  start?: number;
  schritt?: number;
  einheit?: string;
  /** `log` für Werte über mehrere Zehnerpotenzen (z.B. 100 Ω bis 100 kΩ). */
  skala?: "linear" | "log";
  /**
   * `schalter`: zwei Zustände 0 und 1, beschriftet mit `aus` und `an`.
   * `zeit`: ein Regler mit „Abspielen“, der von `min` bis `max` läuft.
   */
  art?: "regler" | "schalter" | "zeit";
  aus?: string;
  an?: string;
  /** Nur bei `zeit`: Sekunden für einen Durchlauf von `min` bis `max` (Standard 5). */
  dauer?: number;
  /** Nur bei `zeit`: am Ende wieder bei `min` anfangen (Standard), sonst anhalten. */
  wiederholen?: boolean;
};

const SCHRITTE_LOG = 1000;

/** Ein Wert zum Einstellen in `:::interaktiv`. */
export function Regler({
  name,
  tex,
  min = 0,
  max = 1,
  start,
  schritt,
  einheit,
  skala = "linear",
  art = "regler",
  aus = "aus",
  an = "an",
  dauer = 5,
  wiederholen = true,
}: ReglerProps) {
  const { werte, setze } = useExperiment();
  const wert = Number(werte[name] ?? start ?? min);
  const id = useId();

  if (art === "zeit")
    return (
      <Zeitregler
        name={name}
        tex={tex}
        min={min}
        max={max}
        wert={wert}
        schritt={schritt}
        einheit={einheit}
        dauer={dauer}
        wiederholen={wiederholen}
      />
    );

  if (art === "schalter") {
    return (
      <Zeile>
        <td className="py-3 pr-3 align-middle" id={id}>
          <Zeichen text={tex ?? name} />
        </td>
        <td colSpan={2} className="py-3 align-middle">
          <ToggleGroup
            aria-labelledby={id}
            variant="outline"
            size="sm"
            value={[wert ? "1" : "0"]}
            onValueChange={(neu: string[]) => neu.length && setze(name, neu[0] === "1" ? 1 : 0)}
          >
            <ToggleGroupItem value="0">{aus}</ToggleGroupItem>
            <ToggleGroupItem value="1">{an}</ToggleGroupItem>
          </ToggleGroup>
        </td>
      </Zeile>
    );
  }

  const log = skala === "log" && min > 0 && max > 0;
  const zuRegler = (w: number) =>
    log ? (Math.log(w / min) / Math.log(max / min)) * SCHRITTE_LOG : w;
  const vonRegler = (r: number) => (log ? min * (max / min) ** (r / SCHRITTE_LOG) : r);

  return (
    <Zeile>
      <td className="py-3 pr-3 align-middle" id={id}>
        <Zeichen text={tex ?? name} />
      </td>
      <td className="w-full py-3 pr-4 align-middle">
        <Slider
          aria-labelledby={id}
          aria-valuetext={groesse(wert, einheit)}
          min={log ? 0 : min}
          max={log ? SCHRITTE_LOG : max}
          step={log ? 1 : (schritt ?? (max - min) / 100)}
          value={zuRegler(wert)}
          onValueChange={(neu) => setze(name, vonRegler(Array.isArray(neu) ? neu[0] : neu))}
        />
      </td>
      <td className="py-3 text-right align-middle font-mono text-xs whitespace-nowrap">
        {groesse(wert, einheit)}
      </td>
    </Zeile>
  );
}
Regler.istRegler = true;
Regler.istParameter = true;

// Animation: Der Wert läuft erst, wenn der Leser „Abspielen“ drückt, nie von
// selbst (prefers-reduced-motion), und bleibt jederzeit mit dem Regler
// einstellbar.
function Zeitregler({
  name,
  tex,
  min,
  max,
  wert,
  schritt,
  einheit,
  dauer,
  wiederholen,
}: {
  name: string;
  tex?: string;
  min: number;
  max: number;
  wert: number;
  schritt?: number;
  einheit?: string;
  dauer: number;
  wiederholen: boolean;
}) {
  const { setze } = useExperiment();
  const [laeuft, setLaeuft] = useState(false);
  const aktuell = useRef(wert);
  const id = useId();

  useEffect(() => {
    aktuell.current = wert;
  }, [wert]);

  useEffect(() => {
    if (!laeuft) return;
    let vorher = performance.now();
    let rahmen = requestAnimationFrame(function weiter(jetzt) {
      const neu = aktuell.current + ((max - min) * (jetzt - vorher)) / 1000 / Math.max(dauer, 0.1);
      vorher = jetzt;
      if (neu >= max && !wiederholen) {
        setze(name, max);
        setLaeuft(false);
        return;
      }
      aktuell.current = neu >= max ? min + ((neu - min) % (max - min)) : neu;
      setze(name, aktuell.current);
      rahmen = requestAnimationFrame(weiter);
    });
    return () => cancelAnimationFrame(rahmen);
  }, [laeuft, min, max, dauer, wiederholen, name, setze]);

  const umschalten = () => {
    if (!laeuft && !wiederholen && aktuell.current >= max) setze(name, min);
    setLaeuft(!laeuft);
  };

  return (
    <Zeile>
      <td className="py-3 pr-3 align-middle whitespace-nowrap" id={id}>
        <span className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={laeuft ? "Anhalten" : "Abspielen"}
            aria-pressed={laeuft}
            onClick={umschalten}
          >
            {laeuft ? <Pause aria-hidden /> : <Play aria-hidden />}
          </Button>
          <Zeichen text={tex ?? name} />
        </span>
      </td>
      <td className="w-full py-3 pr-4 align-middle">
        <Slider
          aria-labelledby={id}
          aria-valuetext={groesse(wert, einheit)}
          min={min}
          max={max}
          step={schritt ?? (max - min) / 200}
          value={wert}
          onValueChange={(neu) => {
            setLaeuft(false);
            setze(name, Array.isArray(neu) ? neu[0] : neu);
          }}
        />
      </td>
      <td className="py-3 text-right align-middle font-mono text-xs whitespace-nowrap">
        {groesse(wert, einheit)}
      </td>
    </Zeile>
  );
}

/** Eine berechnete Größe, z.B. `<Wert tex="\tau = RC" wert={({ R, C }) => R * C} einheit="s" />`. */
export function Wert({
  tex,
  wert,
  einheit,
  stellen = 3,
}: {
  tex: string;
  wert: Wertbar<number>;
  einheit?: string;
  stellen?: number;
}) {
  const zahl = useWert(wert);
  // „\tau = RC“: das Zeichen links, die Rechnung grau daneben
  const gleich = tex.indexOf("=");
  const zeichen = gleich === -1 ? tex : tex.slice(0, gleich).trim();
  const rechnung = gleich === -1 ? "" : tex.slice(gleich + 1).trim();
  return (
    <Zeile>
      <td className="py-3 pr-3 align-middle whitespace-nowrap">
        <Tex>{zeichen}</Tex>
      </td>
      <td className="w-full py-3 pr-4 align-middle text-muted-foreground">
        {rechnung && <Tex>{`= ${rechnung}`}</Tex>}
      </td>
      <td className="py-3 text-right align-middle font-mono text-xs font-semibold whitespace-nowrap">
        {groesse(zahl, einheit, stellen)}
      </td>
    </Zeile>
  );
}
Wert.istParameter = true;

// Regler und Werte stehen in einer Tabelle „Parameter | Wert“ (DESIGN.md,
// „Interactive parts“). `Versuch` sammelt sie dafür aus einem
// `:::interaktiv`: erst die Grafiken, dann die Tabelle, dann der Text.

const TabelleContext = createContext(false);

/** Eine Zeile der Tabelle; außerhalb einer Tabelle eine eigene. */
function Zeile({ children }: { children: ReactNode }) {
  const inTabelle = useContext(TabelleContext);
  const zeile = <tr className="border-b last:border-b-0">{children}</tr>;
  if (inTabelle) return zeile;
  return (
    <table className="my-3 w-full border-collapse text-sm">
      <tbody>{zeile}</tbody>
    </table>
  );
}

export function Parametertabelle({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left">
            <th colSpan={2} className="h-10 font-medium">
              Parameter
            </th>
            <th className="h-10 text-right font-medium">Wert</th>
          </tr>
        </thead>
        <TabelleContext.Provider value={true}>
          <tbody>{children}</tbody>
        </TabelleContext.Provider>
      </table>
    </div>
  );
}

const istParameter = (k: ReactNode) =>
  isValidElement(k) && !!(k.type as { istParameter?: boolean }).istParameter;
const istText = (k: ReactNode) =>
  typeof k === "string" || (isValidElement(k) && (k.type === "p" || k.type === prosa.p));

/** Ordnet den Inhalt eines `:::interaktiv`: Grafiken, Parametertabelle, Text. */
export function Versuch({ children }: { children: ReactNode }) {
  const kinder = Children.toArray(children);
  const parameter = kinder.filter(istParameter);
  const text = kinder.filter((k) => !istParameter(k) && istText(k));
  const rest = kinder.filter((k) => !istParameter(k) && !istText(k));
  return (
    <div className="space-y-4 [&_figure]:my-0">
      {rest}
      {parameter.length > 0 && <Parametertabelle>{parameter}</Parametertabelle>}
      {text.length > 0 && <div className="[&>p]:my-2">{text}</div>}
    </div>
  );
}
