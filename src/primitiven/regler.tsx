import { useEffect, useId, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="my-3 grid gap-2 text-sm sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)] sm:items-center sm:gap-4">
      <span className="flex items-center gap-2 tabular-nums">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label={laeuft ? "Anhalten" : "Abspielen"}
          aria-pressed={laeuft}
          onClick={umschalten}
        >
          {laeuft ? <Pause aria-hidden /> : <Play aria-hidden />}
        </Button>
        <span id={id}>
          <Zeichen text={tex ?? name} /> = {groesse(wert, einheit)}
        </span>
      </span>
      <Slider
        aria-labelledby={id}
        min={min}
        max={max}
        step={schritt ?? (max - min) / 200}
        value={wert}
        onValueChange={(neu) => {
          setLaeuft(false);
          setze(name, Array.isArray(neu) ? neu[0] : neu);
        }}
      />
    </div>
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
  return (
    <p className="my-2 text-sm tabular-nums">
      <Tex>{`${tex} =`}</Tex> {groesse(zahl, einheit, stellen)}
    </p>
  );
}
