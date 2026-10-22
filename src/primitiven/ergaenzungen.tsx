import { createContext, useContext, useState, type ReactNode } from "react";
import {
  BookOpenCheck,
  Lightbulb,
  MessageSquareText,
  MousePointerClick,
  PenLine,
  Shapes,
  Sigma,
} from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { useAnsicht } from "@/lib/ansicht";
import { ExperimentBereich } from "@/primitiven/experiment";
import { Fehlergrenze } from "@/primitiven/Fehlergrenze";

// Alles, was Claude ergänzt: eine rote Linie links und die Beschriftung
// „Ergänzung · …“ (Farbe ist nie der einzige Hinweis), keine Kästen. „Nur
// Original“ blendet alle Ergänzungen aus.

type Symbol = typeof Lightbulb;

export function Ergaenzung({
  art,
  titel,
  symbol: Icon,
  className,
  children,
}: {
  art: string;
  titel?: string;
  symbol: Symbol;
  className?: string;
  children: ReactNode;
}) {
  const { mitErgaenzungen } = useAnsicht();
  if (!mitErgaenzungen) return null;
  return (
    <aside
      aria-label={`Ergänzung: ${art}`}
      className={cn("my-6 border-l-2 border-primary pl-4", className)}
    >
      <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <Icon aria-hidden className="size-3.5" />
        Ergänzung · {art}
      </p>
      {titel && <p className="mt-1 text-sm font-semibold">{titel}</p>}
      <div className="mt-2 text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">{children}</div>
    </aside>
  );
}

export const Anmerkung = ({ titel, children }: { titel?: string; children: ReactNode }) => (
  <Ergaenzung art="Anmerkung" titel={titel} symbol={MessageSquareText}>
    {children}
  </Ergaenzung>
);

export const Variablen = ({ titel, children }: { titel?: string; children: ReactNode }) => (
  <Ergaenzung
    art="Variablen"
    titel={titel}
    symbol={Sigma}
    className="[&_ul]:ml-0 [&_ul]:list-none [&_ul]:space-y-0.5"
  >
    {children}
  </Ergaenzung>
);

export const Grafik = ({ titel, children }: { titel?: string; children: ReactNode }) => (
  <Ergaenzung art="Grafik" titel={titel} symbol={Shapes}>
    <Fehlergrenze>{children}</Fehlergrenze>
  </Ergaenzung>
);

export const Interaktiv = ({ titel, children }: { titel?: string; children: ReactNode }) => (
  <Ergaenzung art="Zum Ausprobieren" titel={titel} symbol={MousePointerClick}>
    <Fehlergrenze>
      <ExperimentBereich>{children}</ExperimentBereich>
    </Fehlergrenze>
  </Ergaenzung>
);

/** Kurzer Hinweis im Satz, z.B. „R:anm[ohmscher Widerstand]“. */
export function AnmInline({ children }: { children: ReactNode }) {
  const { mitErgaenzungen } = useAnsicht();
  if (!mitErgaenzungen) return null;
  return (
    <span className="text-muted-foreground">
      {" "}
      <span className="border-b border-primary" title="Ergänzung">
        [Ergänzung: {children}]
      </span>
    </span>
  );
}

// Frage und Antwort: Die Antwort bleibt verdeckt, bis der Nutzer sie aufdeckt.

const AufgedecktContext = createContext<{
  aufgedeckt: boolean;
  setAufgedeckt: (a: boolean) => void;
}>({
  aufgedeckt: true,
  setAufgedeckt: () => {},
});

export const useAufgedeckt = () => useContext(AufgedecktContext);

export function AufdeckBereich({ children }: { children: ReactNode }) {
  const [aufgedeckt, setAufgedeckt] = useState(false);
  return (
    <AufgedecktContext.Provider value={{ aufgedeckt, setAufgedeckt }}>
      {children}
    </AufgedecktContext.Provider>
  );
}

export const Fragetext = ({ children }: { children: ReactNode }) => (
  <div className="text-sm font-medium leading-relaxed [&>p]:my-0">{children}</div>
);

export function Antwort({ children }: { children: ReactNode }) {
  const { aufgedeckt } = useAufgedeckt();
  if (!aufgedeckt) return null;
  return (
    <div className="mt-3 border-l-2 border-border pl-3 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      {children}
    </div>
  );
}

export function AufdeckKnopf({ zeigen, verbergen }: { zeigen: string; verbergen: string }) {
  const { aufgedeckt, setAufgedeckt } = useAufgedeckt();
  return (
    <Button
      variant="outline"
      size="sm"
      className="mt-3"
      aria-expanded={aufgedeckt}
      onClick={() => setAufgedeckt(!aufgedeckt)}
    >
      {aufgedeckt ? verbergen : zeigen}
    </Button>
  );
}

/** Erst selbst denken, dann aufdecken. */
export const Denkanstoss = ({ children }: { children: ReactNode }) => (
  <Ergaenzung art="Denkanstoß" symbol={Lightbulb}>
    <AufdeckBereich>
      {children}
      <AufdeckKnopf zeigen="Auflösung zeigen" verbergen="Auflösung verbergen" />
    </AufdeckBereich>
  </Ergaenzung>
);

/** Aufeinanderfolgende Wiederholungsfragen am Ende eines Abschnitts. */
export const Fragen = ({ children }: { children: ReactNode }) => (
  <Ergaenzung art="Wiederholungsfragen" symbol={BookOpenCheck}>
    <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
      Beantworte jede Frage zuerst selbst, ohne nachzuschauen, und deck erst dann die Lösung auf.
    </p>
    <ol className="space-y-6 [counter-reset:frage]">{children}</ol>
  </Ergaenzung>
);

export function FrageRahmen({ children }: { children: ReactNode }) {
  return (
    <li className="[counter-increment:frage]">
      <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground before:content-['Frage_'_counter(frage)]">
        <PenLine aria-hidden className="order-first size-3.5" />
      </p>
      {children}
    </li>
  );
}
