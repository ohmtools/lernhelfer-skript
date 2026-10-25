import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAnsicht } from "@/lib/ansicht";
import { ExperimentBereich } from "@/primitiven/experiment";
import { Fehlergrenze } from "@/primitiven/Fehlergrenze";
import { Versuch } from "@/primitiven/regler";
import * as prosa from "@/primitiven/prosa";

// Alles, was Claude ergänzt, ist ein Block im Text (nie am Rand): oben das
// rote Badge „Ergänzung“, der Titel und rechts optional die Art, darunter
// eine rote Linie; am Ende eine rote Linie mit „Ende der Ergänzung“, damit
// klar ist, wo das Original weitergeht (DESIGN.md, „Reading pages“). Keine
// Kästen. „Nur Original“ blendet alle Ergänzungen aus.

/** Das rote Badge, das jede Ergänzung trägt. */
export const ErgaenzungBadge = ({ className }: { className?: string }) => (
  <Badge variant="red" className={className}>
    Ergänzung
  </Badge>
);

/** Kopfzeile einer Ergänzung: Badge, Titel, rechts die Art, rote Linie darunter. */
export function ErgaenzungKopf({ titel, art }: { titel: ReactNode; art?: string }) {
  return (
    <div className="flex items-center gap-2.5 border-b-2 border-red pb-2 text-sm">
      <ErgaenzungBadge />
      <span className="min-w-0 font-semibold">{titel}</span>
      {art && (
        <Badge variant="outline" className="ml-auto">
          {art}
        </Badge>
      )}
    </div>
  );
}

/** Schluss einer Ergänzung: rote Linie, rechts „Ende der Ergänzung“. */
export const ErgaenzungEnde = () => (
  <div className="mt-4 flex items-center gap-3 text-xs leading-5 text-muted-foreground">
    <span aria-hidden className="h-0.5 flex-1 bg-red" />
    <span>Ende der Ergänzung</span>
  </div>
);

export function Ergaenzung({
  id,
  titel,
  art,
  className,
  children,
}: {
  id?: string;
  titel: string;
  art?: string;
  className?: string;
  children: ReactNode;
}) {
  const { mitErgaenzungen } = useAnsicht();
  if (!mitErgaenzungen) return null;
  return (
    <section id={id} aria-label={`Ergänzung: ${titel}`} className="my-6 scroll-mt-6">
      <ErgaenzungKopf titel={titel} art={art} />
      <div className={cn("mt-3 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0", className)}>
        {children}
      </div>
      <ErgaenzungEnde />
    </section>
  );
}

type BlockProps = { id?: string; titel?: string; children: ReactNode };

export const Anmerkung = ({ id, titel, children }: BlockProps) => (
  <Ergaenzung id={id} titel={titel ?? "Anmerkung"}>
    {children}
  </Ergaenzung>
);

// Variablen: die Liste `- $u_C$: Bedeutung, in V` als Tabelle „Größe |
// Bedeutung | Einheit“. Eine Zeile ohne „:“ steht ganz unter „Bedeutung“.

type Teile = { groesse: ReactNode[]; bedeutung: ReactNode[]; einheit: string };

const kinderVon = (k: ReactNode): ReactNode[] =>
  isValidElement(k) ? Children.toArray((k.props as { children?: ReactNode }).children) : [];

/** Text eines Listenpunkts, ohne den Absatz einer lockeren Liste. */
function inhaltDesPunkts(punkt: ReactNode) {
  const kinder = kinderVon(punkt).filter((k) => !(typeof k === "string" && !k.trim()));
  return kinder.length === 1 && isValidElement(kinder[0]) && kinder[0].type === prosa.p
    ? kinderVon(kinder[0])
    : kinderVon(punkt);
}

function zerlegen(punkt: ReactNode): Teile {
  const kinder = inhaltDesPunkts(punkt);
  const i = kinder.findIndex((k) => typeof k === "string" && k.includes(":"));
  if (i === -1) return { groesse: [], bedeutung: kinder, einheit: "" };
  const text = kinder[i] as string;
  const p = text.indexOf(":");
  const groesse = [...kinder.slice(0, i), text.slice(0, p)].filter((k) => k !== "");
  const bedeutung = [text.slice(p + 1).trimStart(), ...kinder.slice(i + 1)].filter((k) => k !== "");
  // Einheit am Ende: „…, in V“ oder „…, in Farad (F)“
  let einheit = "";
  const letzte = bedeutung.at(-1);
  if (typeof letzte === "string") {
    const m = /,\s*in\s+([^,]+?)\s*$/.exec(letzte);
    if (m) {
      einheit = m[1];
      bedeutung[bedeutung.length - 1] = letzte.slice(0, m.index);
    }
  }
  return { groesse, bedeutung, einheit };
}

export function Variablen({ id, titel, children }: BlockProps) {
  const istListe = (k: ReactNode): k is ReactElement =>
    isValidElement(k) && (k.type === prosa.ul || k.type === prosa.ol);
  const kinder = Children.toArray(children);
  const punkte = kinder.filter(istListe).flatMap((l) => kinderVon(l).filter(isValidElement));
  const zeilen = punkte.map(zerlegen);
  const rest = kinder.filter((k) => !istListe(k) && !(typeof k === "string" && !k.trim()));
  return (
    <Ergaenzung id={id} titel={titel ?? "Variablen"} className="text-sm">
      {zeilen.length > 0 && (
        <div className="relative overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b text-left">
                <th className="h-10 pr-2 font-medium">Größe</th>
                <th className="h-10 px-2 font-medium">Bedeutung</th>
                <th className="h-10 pl-2 text-right font-medium">Einheit</th>
              </tr>
            </thead>
            <tbody>
              {zeilen.map((z, i) => (
                <tr key={i} className="border-b">
                  <td className="py-2 pr-2 align-top whitespace-nowrap">{z.groesse}</td>
                  <td className="px-2 py-2 align-top">{z.bedeutung}</td>
                  <td className="py-2 pl-2 text-right align-top whitespace-nowrap">{z.einheit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {rest.length > 0 && <div className="mt-3 text-base leading-7">{rest}</div>}
    </Ergaenzung>
  );
}

export const Grafik = ({ id, titel, children }: BlockProps) => (
  <Ergaenzung id={id} titel={titel ?? "Grafik"} art={titel ? "Grafik" : undefined}>
    <Fehlergrenze>{children}</Fehlergrenze>
  </Ergaenzung>
);

export const Interaktiv = ({ id, titel, children }: BlockProps) => (
  <Ergaenzung id={id} titel={titel ?? "Interaktiv"} art={titel ? "Interaktiv" : undefined}>
    <Fehlergrenze>
      <ExperimentBereich>
        <Versuch>{children}</Versuch>
      </ExperimentBereich>
    </Fehlergrenze>
  </Ergaenzung>
);

/** Das Wort, an dem eine Anmerkung hängt; `AnmInline` macht es zum Knopf. */
export const AnmWort = ({ children }: { children: ReactNode }) => <>{children}</>;

/**
 * Anmerkung zu einem Wort, `Oszilloskop:anm[Ein Messgerät …]`: Das Wort ist
 * rot gepunktet unterstrichen und öffnet die Anmerkung. Bei „Nur Original“
 * bleibt nur das Wort.
 */
export function AnmInline({ children }: { children: ReactNode }) {
  const { mitErgaenzungen } = useAnsicht();
  const kinder = Children.toArray(children);
  const wort = kinder.filter((k) => isValidElement(k) && k.type === AnmWort);
  const text = kinder.filter((k) => !(isValidElement(k) && k.type === AnmWort));
  if (!mitErgaenzungen) return <>{wort}</>;
  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="cursor-pointer border-b-[1.5px] border-dotted border-red leading-[inherit] hover:border-solid"
          />
        }
      >
        {wort.length ? wort : <span className="text-sm text-muted-foreground">Anmerkung</span>}
      </PopoverTrigger>
      <PopoverContent className="w-70 text-sm leading-5">
        <span className="mb-1 flex items-center gap-2">
          <ErgaenzungBadge />
          <span className="font-semibold">Anmerkung</span>
        </span>
        {text}
      </PopoverContent>
    </Popover>
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
  <div className="text-base leading-6 font-medium [&>p]:my-0">{children}</div>
);

export function Antwort({ children }: { children: ReactNode }) {
  const { aufgedeckt } = useAufgedeckt();
  if (!aufgedeckt) return null;
  return (
    <div className="erscheinen mt-3 border-l-2 border-border pl-3 text-base leading-7 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      {children}
    </div>
  );
}

export function AufdeckKnopf({
  zeigen = "Antwort zeigen",
  verbergen = "Antwort verbergen",
  className,
}: {
  zeigen?: string;
  verbergen?: string;
  className?: string;
}) {
  const { aufgedeckt, setAufgedeckt } = useAufgedeckt();
  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      aria-expanded={aufgedeckt}
      onClick={() => setAufgedeckt(!aufgedeckt)}
    >
      {aufgedeckt ? verbergen : zeigen}
    </Button>
  );
}

/**
 * Erst selbst denken, dann aufdecken: Frage und Knopf in einer Zeile, darunter
 * die Antwort. Nur noch für ältere Seiten: Fragen stehen heute nur am
 * Kapitelende (ANLEITUNG.md, Kapitel 7).
 */
export function Denkanstoss({ id, children }: { id?: string; children: ReactNode }) {
  const [frage, ...antwort] = Children.toArray(children);
  return (
    <Ergaenzung id={id} titel="Denkanstoß">
      <AufdeckBereich>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b pb-3">
          <div className="min-w-48 flex-1">{frage}</div>
          <AufdeckKnopf className="h-10 w-full compact:h-8 compact:w-auto" />
        </div>
        {antwort}
      </AufdeckBereich>
    </Ergaenzung>
  );
}

// Wiederholungsfragen: Im Kapitel stehen sie nicht, sondern auf ihrer eigenen
// Seite danach (`KapitelSeite`, Teil „fragen“). Jede Frage hat eine
// Kopfzeile mit Nummer und Art und die rote Linie.

/** Ob gerade die Seite der Wiederholungsfragen gezeigt wird. */
export const FragenseiteContext = createContext(false);

export function Fragen({ children }: { children: ReactNode }) {
  const fragenseite = useContext(FragenseiteContext);
  if (!fragenseite) return null;
  return (
    <ol data-fragen className="mt-8 space-y-8 [counter-reset:frage]">
      {children}
    </ol>
  );
}

export function FrageRahmen({ art, children }: { art: string; children: ReactNode }) {
  return (
    <li className="text-sm [counter-increment:frage]">
      <div className="mb-3 flex items-center gap-2.5 border-b-2 border-red pb-2">
        <span className="font-mono text-sm font-semibold before:content-[counter(frage)]" />
        <Badge variant="outline">{art}</Badge>
      </div>
      {children}
    </li>
  );
}
