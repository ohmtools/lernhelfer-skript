import { Children, isValidElement, useId, useState, type ReactNode } from "react";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { groesse, leseZahl } from "@/lib/format";
import {
  Antwort,
  AufdeckBereich,
  AufdeckKnopf,
  FrageRahmen,
  useAufgedeckt,
} from "@/primitiven/ergaenzungen";

// Die drei Arten der Wiederholungsfragen (DESIGN.md, „Questions page“):
// Erklären (eigene Antwort, dann aufdecken), Auswahl (Rückmeldung an den
// Optionen) und Rechnen (Zahl prüfen).

/** Freie Frage: eigene Antwort (optional), dann die Lösung aufdecken. */
export function Frage({ children }: { children: ReactNode }) {
  const [frage, ...antwort] = Children.toArray(children);
  const id = useId();
  return (
    <FrageRahmen art="Erklären">
      <AufdeckBereich>
        {frage}
        <label htmlFor={id} className="sr-only">
          Deine Antwort (bleibt nur auf dieser Seite)
        </label>
        <Textarea id={id} placeholder="Deine Antwort" className="mt-3 min-h-18" />
        <AufdeckKnopf className="mt-2.5" />
        {antwort}
      </AufdeckBereich>
    </FrageRahmen>
  );
}

// Auswahlfrage: eine richtige Option → Optionsfelder, die Rückmeldung kommt
// mit der Wahl; mehrere → Kästchen und „Prüfen“. Unter jeder markierten
// Option steht ihre eigene Erklärung, nach der Liste die für alle.

export function Auswahlfrage({ children }: { children: ReactNode }) {
  return (
    <FrageRahmen art="Auswahl">
      <AufdeckBereich>
        {Children.map(children, (k) =>
          isValidElement<{ children?: ReactNode }>(k) && k.type === Antwort ? (
            <Auswahlerklaerung>{k.props.children}</Auswahlerklaerung>
          ) : (
            k
          ),
        )}
      </AufdeckBereich>
    </FrageRahmen>
  );
}

/** Erklärung zu einer Option; `Optionen` zeigt sie nach dem Prüfen unter ihr. */
export function Optionserklaerung({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

const istErklaerung = (k: ReactNode) => isValidElement(k) && k.type === Optionserklaerung;

function Urteil({ richtig }: { richtig: boolean }) {
  return richtig ? (
    <Badge variant="outline" className="erscheinen">
      <Check aria-hidden /> richtig
    </Badge>
  ) : (
    <Badge variant="outline" className="erscheinen border-destructive/30 text-destructive">
      <X aria-hidden /> falsch
    </Badge>
  );
}

export function Optionen({ children }: { children: ReactNode }) {
  const optionen = Children.toArray(children).filter(isValidElement) as React.ReactElement<{
    richtig?: boolean;
    children?: ReactNode;
  }>[];
  const teile = optionen.map((o) => {
    const kinder = Children.toArray(o.props.children);
    return {
      text: kinder.filter((k) => !istErklaerung(k)),
      erklaerung: kinder.filter(istErklaerung),
    };
  });
  const richtige = new Set(optionen.flatMap((o, i) => (o.props.richtig ? [i] : [])));
  const mehrfach = richtige.size > 1;
  const [gewaehlt, setGewaehlt] = useState<Set<number>>(new Set());
  const { aufgedeckt: geprueft, setAufgedeckt } = useAufgedeckt();
  const id = useId();
  const alleRichtig =
    gewaehlt.size === richtige.size && [...gewaehlt].every((i) => richtige.has(i));

  const umschalten = (i: number, an: boolean) => {
    setAufgedeckt(!mehrfach);
    setGewaehlt((alt) => {
      const neu = mehrfach ? new Set(alt) : new Set<number>();
      if (an) neu.add(i);
      else neu.delete(i);
      return neu;
    });
  };

  const zeilen = teile.map(({ text, erklaerung }, i) => {
    const feld = `${id}-${i}`;
    const urteil = geprueft && (richtige.has(i) || gewaehlt.has(i));
    return (
      <div key={i} className="border-b py-2.5">
        <div className="flex items-center gap-2.5">
          {mehrfach ? (
            <Checkbox
              id={feld}
              checked={gewaehlt.has(i)}
              onCheckedChange={(an) => umschalten(i, an === true)}
            />
          ) : (
            <RadioGroupItem id={feld} value={String(i)} />
          )}
          <label htmlFor={feld} className="flex-1 text-sm leading-5">
            {text}
          </label>
          {urteil && <Urteil richtig={richtige.has(i)} />}
        </div>
        {urteil && erklaerung.length > 0 && (
          <div className="erscheinen mt-1.5 ml-6.5 text-sm leading-5 text-muted-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-1 [&_p]:text-sm [&_p]:leading-5">
            {erklaerung}
          </div>
        )}
      </div>
    );
  });

  return (
    <div className="mt-3">
      {mehrfach ? (
        <div role="group" aria-label="Antworten (mehrere sind richtig)" className="flex flex-col">
          {zeilen}
        </div>
      ) : (
        <RadioGroup
          aria-label="Antworten"
          className="flex flex-col gap-0"
          value={gewaehlt.size ? String([...gewaehlt][0]) : null}
          onValueChange={(wert) => umschalten(Number(wert), true)}
        >
          {zeilen}
        </RadioGroup>
      )}
      {mehrfach && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted-foreground">Mehrere Antworten sind richtig.</span>
          <Button disabled={!gewaehlt.size} onClick={() => setAufgedeckt(true)}>
            Prüfen
          </Button>
        </div>
      )}
      {geprueft && mehrfach && (
        <p role="status" className="erscheinen mt-2 text-sm">
          {alleRichtig ? "Richtig." : "Noch nicht ganz: Die richtigen Antworten sind markiert."}
        </p>
      )}
    </div>
  );
}

/** Eine Option; `richtig` liest `Optionen`. */
export function Option({ children }: { children: ReactNode; richtig?: boolean }) {
  return <>{children}</>;
}

/** Erklärung für alle Optionen einer Auswahlfrage, sichtbar nach der Wahl. */
function Auswahlerklaerung({ children }: { children: ReactNode }) {
  const { aufgedeckt } = useAufgedeckt();
  if (!aufgedeckt) return null;
  return (
    <div className="erscheinen mt-3 text-sm leading-5 text-muted-foreground [&_p]:my-1 [&_p]:text-sm [&_p]:leading-5">
      {children}
    </div>
  );
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
  const [frage, ...loesung] = Children.toArray(children);
  return (
    <FrageRahmen art="Rechnen">
      <AufdeckBereich>
        {frage}
        <Rechenfeld
          ergebnis={leseZahl(String(ergebnis))}
          toleranz={leseZahl(String(toleranz))}
          einheit={einheit}
        />
        {loesung}
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
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={id} className="sr-only">
          Dein Ergebnis{einheit ? ` in ${einheit}` : ""}
        </label>
        <Input
          id={id}
          inputMode="decimal"
          placeholder="Ergebnis"
          aria-invalid={geprueft === false || undefined}
          value={eingabe}
          onChange={(e) => {
            setEingabe(e.target.value);
            setGeprueft(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && pruefen()}
          className="w-35 font-mono"
        />
        {einheit && <span className="text-sm">{einheit}</span>}
        <Button className="ml-2" disabled={!eingabe.trim()} onClick={pruefen}>
          Prüfen
        </Button>
        {!aufgedeckt && geprueft === false && (
          <Button variant="ghost" onClick={() => setAufgedeckt(true)}>
            Lösung zeigen
          </Button>
        )}
      </div>
      {geprueft !== null && (
        <p
          role="status"
          className={
            geprueft
              ? "erscheinen mt-2.5 flex items-center gap-1.5 text-sm"
              : "erscheinen mt-2.5 flex items-center gap-1.5 text-sm text-destructive"
          }
        >
          {geprueft ? (
            <>
              <Check aria-hidden className="size-4" /> Richtig:{" "}
              <span className="font-mono">{groesse(ergebnis, einheit)}</span>.
            </>
          ) : (
            <>
              <X aria-hidden className="size-4" /> Noch nicht. Rechne noch einmal nach oder deck die
              Lösung auf.
            </>
          )}
        </p>
      )}
    </div>
  );
}
