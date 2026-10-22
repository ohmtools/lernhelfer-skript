import {
  Children,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

// Werte der Regler eines `:::interaktiv`-Blocks. Bausteine darin nehmen statt
// einer Zahl auch eine Funktion der Werte, z.B. `f={(t, { R, C }) => …}`.
export type Werte = Record<string, number>;

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
function startwerte(kinder: ReactNode, werte: Werte = {}): Werte {
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

export function ExperimentBereich({ children }: { children: ReactNode }) {
  const [werte, setWerte] = useState<Werte>(() => startwerte(children));
  const setze = useCallback(
    (name: string, wert: number) => setWerte((alt) => ({ ...alt, [name]: wert })),
    [],
  );
  return (
    <ExperimentContext.Provider value={{ werte, setze }}>{children}</ExperimentContext.Provider>
  );
}
