import {
  Children,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// Werte der Regler eines `:::interaktiv`-Blocks und der Rechnungen darin.
// Bausteine nehmen statt einer Zahl auch eine Funktion der Werte, z.B.
// `f={(t, { R, C }) => …}`. Eine `Rechnung` kann auch eine Funktion liefern,
// die andere aufrufen (`({ M }) => M(s)`).
export type Werte = Record<string, number & ((...x: number[]) => number)>;

type Experiment = { werte: Werte; setze: (name: string, wert: number) => void };

const ExperimentContext = createContext<Experiment>({ werte: {}, setze: () => {} });

export const useExperiment = () => useContext(ExperimentContext);

/** Eine Angabe, die fest oder eine Funktion der Werte ist. */
export type Wertbar<T> = T | ((werte: Werte) => T);

export function aufloesen<T>(angabe: Wertbar<T>, werte: Werte): T {
  return typeof angabe === "function" ? (angabe as (w: Werte) => T)(werte) : angabe;
}

export function useWert<T>(angabe: Wertbar<T>): T {
  return aufloesen(angabe, useExperiment().werte);
}

// Startwerte aus den Reglern im Baum lesen, damit schon das erste Bild (und
// die Prüfung auf dem Server) mit ihnen rechnet.
function startwerte(kinder: ReactNode, werte: Record<string, number> = {}) {
  Children.forEach(kinder, (kind) => {
    if (!isValidElement(kind)) return;
    const props = kind.props as {
      name?: unknown;
      start?: unknown;
      min?: unknown;
      children?: ReactNode;
      __regler?: boolean;
    };
    const typ = kind.type as { istRegler?: boolean };
    if (typ?.istRegler && typeof props.name === "string") {
      werte[props.name] = Number(props.start ?? props.min ?? 0);
    }
    if (props.children) startwerte(props.children, werte);
  });
  return werte;
}

type RechnungProps = { name: string; wert: (werte: Werte) => unknown };

// Rechnungen der Reihe nach ausführen: Jede sieht die Regler und die
// Rechnungen vor ihr.
function rechnen(kinder: ReactNode, werte: Record<string, unknown>) {
  Children.forEach(kinder, (kind) => {
    if (!isValidElement(kind)) return;
    const props = kind.props as Partial<RechnungProps> & { children?: ReactNode };
    if ((kind.type as { istRechnung?: boolean })?.istRechnung && props.name && props.wert)
      werte[props.name] = props.wert(werte as Werte);
    else if (props.children) rechnen(props.children, werte);
  });
  return werte as Werte;
}

/**
 * Rechnet einmal pro Experiment einen Wert oder eine Funktion aus, die andere
 * Bausteine wie einen Regler lesen, z.B.
 * `<Rechnung name="tau" wert={({ R, C }) => R * C} />`. Zeigt nichts an.
 */
export function Rechnung(props: RechnungProps) {
  void props; // ExperimentBereich rechnet, die Rechnung selbst zeigt nichts.
  return null;
}
Rechnung.istRechnung = true;

export function ExperimentBereich({ children }: { children: ReactNode }) {
  const [regler, setRegler] = useState(() => startwerte(children));
  const setze = useCallback(
    (name: string, wert: number) => setRegler((alt) => ({ ...alt, [name]: wert })),
    [],
  );
  const werte = useMemo(() => rechnen(children, { ...regler }), [children, regler]);
  return (
    <ExperimentContext.Provider value={{ werte, setze }}>{children}</ExperimentContext.Provider>
  );
}
