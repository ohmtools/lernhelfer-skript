import { useId } from "react";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { groesse } from "@/lib/format";
import { useExperiment, useWert, type Wertbar } from "@/primitiven/experiment";
import { Zeichen } from "@/primitiven/flaeche";
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
  /** `schalter`: zwei Zustände 0 und 1, beschriftet mit `aus` und `an`. */
  art?: "regler" | "schalter";
  aus?: string;
  an?: string;
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
}: ReglerProps) {
  const { werte, setze } = useExperiment();
  const wert = werte[name] ?? start ?? min;
  const id = useId();

  if (art === "schalter") {
    return (
      <div className="my-3 flex flex-wrap items-center gap-3 text-sm">
        <span id={id}>
          <Zeichen text={tex ?? name} />
        </span>
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
      </div>
    );
  }

  const log = skala === "log" && min > 0 && max > 0;
  const zuRegler = (w: number) =>
    log ? (Math.log(w / min) / Math.log(max / min)) * SCHRITTE_LOG : w;
  const vonRegler = (r: number) => (log ? min * (max / min) ** (r / SCHRITTE_LOG) : r);

  return (
    <div className="my-3 grid gap-2 text-sm sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)] sm:items-center sm:gap-4">
      <span id={id} className="tabular-nums">
        <Zeichen text={tex ?? name} /> = {groesse(wert, einheit)}
      </span>
      <Slider
        aria-labelledby={id}
        min={log ? 0 : min}
        max={log ? SCHRITTE_LOG : max}
        step={log ? 1 : (schritt ?? (max - min) / 100)}
        value={zuRegler(wert)}
        onValueChange={(neu) => setze(name, vonRegler(Array.isArray(neu) ? neu[0] : neu))}
      />
    </div>
  );
}
Regler.istRegler = true;

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
  return (
    <p className="my-2 text-sm tabular-nums">
      <Tex>{`${tex} =`}</Tex> {groesse(zahl, einheit, stellen)}
    </p>
  );
}
