import { Children, isValidElement, useId, useState, type ReactNode } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { groesse, leseZahl } from "@/lib/format";
import {
  AufdeckBereich,
  AufdeckKnopf,
  FrageRahmen,
  useAufgedeckt,
} from "@/primitiven/ergaenzungen";

/** Freie Frage: eigene Antwort (optional), dann die Lösung aufdecken. */
export function Frage({ children }: { children: ReactNode }) {
  return (
    <FrageRahmen>
      <AufdeckBereich>
        {Children.toArray(children)[0]}
        <Textarea
          aria-label="Deine Antwort (bleibt nur auf dieser Seite)"
          placeholder="Deine Antwort (bleibt nur auf dieser Seite)"
          className="mt-2 min-h-16"
        />
        <AufdeckKnopf zeigen="Lösung zeigen" verbergen="Lösung verbergen" />
        {Children.toArray(children).slice(1)}
      </AufdeckBereich>
    </FrageRahmen>
  );
}

// Auswahlfrage: eine richtige Option → Optionsfelder, mehrere → Kästchen.

export function Auswahlfrage({ children }: { children: ReactNode }) {
  return (
    <FrageRahmen>
      <AufdeckBereich>{children}</AufdeckBereich>
    </FrageRahmen>
  );
}

export function Optionen({ children }: { children: ReactNode }) {
  const optionen = Children.toArray(children).filter(isValidElement) as React.ReactElement<{
    richtig?: boolean;
  }>[];
  const richtige = new Set(optionen.flatMap((o, i) => (o.props.richtig ? [i] : [])));
  const mehrfach = richtige.size > 1;
  const [gewaehlt, setGewaehlt] = useState<Set<number>>(new Set());
  const { aufgedeckt: geprueft, setAufgedeckt } = useAufgedeckt();
  const id = useId();
  const alleRichtig =
    gewaehlt.size === richtige.size && [...gewaehlt].every((i) => richtige.has(i));

  const umschalten = (i: number, an: boolean) => {
    setAufgedeckt(false);
    setGewaehlt((alt) => {
      const neu = mehrfach ? new Set(alt) : new Set<number>();
      if (an) neu.add(i);
      else neu.delete(i);
      return neu;
    });
  };

  const zeilen = optionen.map((option, i) => {
    const feld = `${id}-${i}`;
    const zeichen =
      geprueft && (richtige.has(i) || gewaehlt.has(i)) ? (
        richtige.has(i) ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Check aria-hidden className="size-3.5 text-foreground" /> richtig
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <X aria-hidden className="size-3.5 text-destructive" /> falsch
          </span>
        )
      ) : null;
    return (
      <div key={i} className="flex items-start gap-3">
        {mehrfach ? (
          <Checkbox
            id={feld}
            checked={gewaehlt.has(i)}
            onCheckedChange={(an) => umschalten(i, an === true)}
          />
        ) : (
          <RadioGroupItem id={feld} value={String(i)} />
        )}
        <label htmlFor={feld} className="flex-1 text-sm leading-snug">
          {option}
        </label>
        {zeichen}
      </div>
    );
  });

  return (
    <>
      <p className="mt-1 mb-2 text-xs text-muted-foreground">
        {mehrfach ? "Mehrere Antworten sind richtig." : "Eine Antwort ist richtig."}
      </p>
      {mehrfach ? (
        <div className="grid gap-3">{zeilen}</div>
      ) : (
        <RadioGroup
          value={gewaehlt.size ? String([...gewaehlt][0]) : null}
          onValueChange={(wert) => umschalten(Number(wert), true)}
        >
          {zeilen}
        </RadioGroup>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          disabled={!gewaehlt.size}
          onClick={() => setAufgedeckt(true)}
        >
          Prüfen
        </Button>
        {geprueft && (
          <span role="status" className="text-sm">
            {alleRichtig ? "Richtig." : "Noch nicht ganz: Die richtigen Antworten sind markiert."}
          </span>
        )}
      </div>
    </>
  );
}

/** Eine Option; `richtig` liest `Optionen`. */
export function Option({ children }: { children: ReactNode; richtig?: boolean }) {
  return <>{children}</>;
}

/** Rechenfrage: Zahl eingeben, prüfen, dann den Lösungsweg aufdecken. */
export function Rechenfrage({
  ergebnis,
  toleranz,
  einheit,
  children,
}: {
  ergebnis: string | number;
  toleranz: string | number;
  einheit?: string;
  children: ReactNode;
}) {
  return (
    <FrageRahmen>
      <AufdeckBereich>
        {Children.toArray(children)[0]}
        <Rechenfeld
          ergebnis={leseZahl(String(ergebnis))}
          toleranz={leseZahl(String(toleranz))}
          einheit={einheit}
        />
        {Children.toArray(children).slice(1)}
      </AufdeckBereich>
    </FrageRahmen>
  );
}

function Rechenfeld({
  ergebnis,
  toleranz,
  einheit,
}: {
  ergebnis: number;
  toleranz: number;
  einheit?: string;
}) {
  const [eingabe, setEingabe] = useState("");
  const [geprueft, setGeprueft] = useState<null | boolean>(null);
  const { aufgedeckt, setAufgedeckt } = useAufgedeckt();
  const id = useId();
  const pruefen = () => {
    const wert = leseZahl(eingabe);
    const richtig = Math.abs(wert - ergebnis) <= Math.abs(toleranz);
    setGeprueft(richtig);
    if (richtig) setAufgedeckt(true);
  };
  return (
    <div className="mt-2">
      <div className="flex flex-wrap items-end gap-3">
        <label htmlFor={id} className="sr-only">
          Dein Ergebnis
        </label>
        <div className="flex items-end gap-2">
          <Input
            id={id}
            inputMode="decimal"
            placeholder="Dein Ergebnis"
            value={eingabe}
            onChange={(e) => {
              setEingabe(e.target.value);
              setGeprueft(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && pruefen()}
            className="w-36"
          />
          {einheit && <span className="pb-1.5 text-sm">{einheit}</span>}
        </div>
        <Button variant="outline" size="sm" disabled={!eingabe.trim()} onClick={pruefen}>
          Prüfen
        </Button>
        {!aufgedeckt && (
          <Button variant="ghost" size="sm" onClick={() => setAufgedeckt(true)}>
            Lösung zeigen
          </Button>
        )}
      </div>
      {geprueft !== null && (
        <p role="status" className="mt-2 flex items-center gap-1.5 text-sm">
          {geprueft ? (
            <>
              <Check aria-hidden className="size-4" /> Richtig: {groesse(ergebnis, einheit)}.
            </>
          ) : (
            <>
              <X aria-hidden className="size-4 text-destructive" /> Noch nicht. Rechne noch einmal
              nach oder deck die Lösung auf.
            </>
          )}
        </p>
      )}
    </div>
  );
}
