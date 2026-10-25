import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { BookOpen, List, Settings } from "lucide-react";
import { cn } from "cn";
import { BottomBar } from "@/components/ohmtools/bottom-bar";
import { PanelHeader } from "@/components/ohmtools/panel-header";
import { PanelSheet } from "@/components/ohmtools/panel-sheet";
import { Button } from "@/components/ui/button";
import { AnsichtTabs } from "@/components/shell/AnsichtTabs";
import { AufDieserSeite } from "@/components/shell/AufDieserSeite";
import { EinstellungenDialog, EinstellungenSeite } from "@/components/shell/Einstellungen";
import { Kapitelbaum } from "@/components/shell/Kapitelbaum";
import { KapitelBadge, KapitelSeite } from "@/components/shell/KapitelSeite";
import { Suche } from "@/components/shell/Suche";
import { AnsichtContext } from "@/lib/ansicht";
import { hereinschieben } from "@/lib/bewegung";
import { FRAGENSEITE, SEITEN, SKRIPT } from "@/lib/kapitel";
import { useNavigation, type Ort } from "@/lib/navigation";
import { RAND_X } from "@/lib/rand";
import { reducedMotion, transition } from "@/lib/ohmtools/motion";
import { useStep } from "@/lib/ohmtools/steps";

// Ein Viewport, die Seite scrollt nie; jede Spalte scrollt für sich
// (DESIGN.md, „App shell“ und „Reading pages“). Kopf 56 px, auf niedrigen
// Querformat-Bildschirmen (`short:`) 48 px, dazu der sichere Bereich oben;
// seitlich polstern Kopf, Leiste und Inhalt selbst (`RAND_X`). Die Wurzel
// setzt `text-sm`, die Seite selbst `text-base`. Jede Spalte ist `relative`:
// sonst beziehen sich absolut gesetzte Elemente darin (`sr-only`) auf das
// Dokument, verlängern es, und `scrollIntoView` schiebt den Kopf weg.
// Drei Stufen (`useStep()` aus `@/lib/ohmtools/steps`, dieselben Abfragen
// wie `compact:` und `wide:` im Stylesheet des Designs):
// - breit (`wide`): links Suche und Kapitel (280 px), Mitte die Seite
//   (höchstens 720 px), rechts „Auf dieser Seite“ (280 px, schließbar).
// - kompakt (`compact`): eine Spalte, alles in der Kopfzeile; „Inhalt“ und
//   „Auf dieser Seite“ als Blatt von rechts (380 px, `PanelSheet`).
// - schmal (`narrow`): eine Spalte, im Kopf „Inhalt“ und „Einstellungen“,
//   „Inhalt“ eine Seite über allem; unten die Leiste mit den Tabs „Mit
//   Ergänzungen | Nur Original“.
// Gruppen wie in den Apps (DESIGN.md, „Which group“): die Ansicht ist eine
// „View“ (Tabs im Kopf, am Handy in der Leiste unten), „Inhalt“ und „Auf
// dieser Seite“ sind Panels, die Einstellungen eine „Area“ (breit ein
// Dialog, sonst eine Seite über allem).
// Bewegung (`@/lib/bewegung`, `@/lib/ohmtools/motion`): die nächste Seite
// kommt von rechts, die vorige von links; „Mit Ergänzungen | Nur Original“
// blendet die Seite neu ein; die Spalte rechts gleitet herein (`panel`),
// Seiten über allem kommen von rechts und gehen dorthin zurück (`forward`,
// `back`); ein Sprung innerhalb der Seite scrollt sanft. Blatt und Dialog
// bewegen sich wie in den Apps (`ui/sheet.tsx`, `ui/dialog.tsx`).

type Panel = "seite" | null;
type BlattArt = "inhalt" | "seite";

/** Der Abschnitt, dessen Überschrift zuletzt oben vorbeigescrollt ist. */
function useAktiverAbschnitt(ids: string[]) {
  const [aktiv, setAktiv] = useState<string | undefined>(ids[0]);
  useEffect(() => {
    let rahmen = 0;
    const messen = () => {
      cancelAnimationFrame(rahmen);
      rahmen = requestAnimationFrame(() => {
        let gefunden = ids[0];
        for (const id of ids) {
          const el = document.getElementById(id);
          if (el && el.getBoundingClientRect().top <= 140) gefunden = id;
        }
        setAktiv(gefunden);
      });
    };
    messen();
    document.addEventListener("scroll", messen, true);
    window.addEventListener("resize", messen);
    return () => {
      cancelAnimationFrame(rahmen);
      document.removeEventListener("scroll", messen, true);
      window.removeEventListener("resize", messen);
    };
  }, [ids]);
  return aktiv;
}

/**
 * Hält den Abschnitt nach einem Sprung oben, solange sich die neue Seite noch
 * setzt: Zeichenflächen und Graphen messen ihre Breite erst nach dem Einhängen
 * und werden dann kleiner. Höchstens eine Sekunde, und nur bis der Nutzer
 * selbst scrollt.
 */
function festhalten(el: Element, spalte: HTMLElement) {
  const ausrichten = () => el.scrollIntoView({ block: "start" });
  const beobachter = new ResizeObserver(ausrichten);
  for (const kind of spalte.children) beobachter.observe(kind);
  const ende = () => {
    beobachter.disconnect();
    clearTimeout(uhr);
    for (const e of EINGABEN) spalte.removeEventListener(e, ende);
  };
  const uhr = setTimeout(ende, 1000);
  for (const e of EINGABEN) spalte.addEventListener(e, ende, { passive: true });
  return ende;
}
const EINGABEN = ["wheel", "touchstart", "pointerdown", "keydown"] as const;

/** Breit genug für drei Spalten mit „Auf dieser Seite“? Nur beim Start gefragt. */
function startPanel(): Panel {
  try {
    return matchMedia("(width >= 80rem)").matches ? "seite" : null;
  } catch {
    return null;
  }
}

export function App() {
  const { ort, gehe } = useNavigation();
  const stufe = useStep();
  const [panel, setPanel] = useState<Panel>(startPanel);
  const [blatt, setBlatt] = useState<BlattArt | null>(null);
  // Was das Blatt zeigt; bleibt beim Schließen, bis es hinausgeglitten ist.
  const [blattArt, setBlattArt] = useState<BlattArt>("inhalt");
  const [einstellungen, setEinstellungen] = useState(false);
  const [mitErgaenzungen, setMitErgaenzungen] = useState(true);
  const [ziel, setZiel] = useState<Ort | null>(ort.abschnitt ? ort : null);
  const erledigt = useRef<Ort | null>(null);
  const sanft = useRef(false);
  const mitte = useRef<HTMLElement>(null);
  const fragen = ort.abschnitt === FRAGENSEITE;
  const seite =
    SEITEN.find((s) => s.kapitel.schluessel === ort.kapitel && s.fragen === fragen) ?? SEITEN[0];
  const kapitel = seite?.kapitel;
  const ids = kapitel && !seite.fragen ? kapitel.gliederung.map((g) => g.id) : [];
  const [idsStabil, setIdsStabil] = useState(ids);
  if (idsStabil.join() !== ids.join()) setIdsStabil(ids);
  const aktiv = useAktiverAbschnitt(idsStabil);

  // Blatt und Seite „Inhalt“ gehören zu ihrer Stufe: wechselt sie, schließen
  // sie. Die Einstellungen bleiben offen, als Dialog oder als Seite.
  const [stufeZuletzt, setStufeZuletzt] = useState(stufe);
  if (stufeZuletzt !== stufe) {
    setStufeZuletzt(stufe);
    setBlatt(null);
  }

  const hingehen = (neu: Ort) => {
    // Auf derselben Seite und schon sichtbar: dorthin scrollen statt springen.
    sanft.current = neu.kapitel === ort.kapitel && (neu.abschnitt === FRAGENSEITE) === fragen;
    gehe(neu);
    setBlatt(null);
    setZiel(neu);
  };

  // Nach dem Wechsel zum Abschnitt springen, sonst an den Anfang der Seite.
  useLayoutEffect(() => {
    if (!ziel || erledigt.current === ziel) return;
    erledigt.current = ziel;
    const el =
      ziel.abschnitt && ziel.abschnitt !== FRAGENSEITE
        ? document.getElementById(ziel.abschnitt)
        : null;
    const behavior = sanft.current && !reducedMotion() ? "smooth" : "auto";
    if (el) el.scrollIntoView({ block: "start", behavior });
    else mitte.current?.scrollTo({ top: 0, behavior });
    if (el && behavior === "auto" && mitte.current) return festhalten(el, mitte.current);
  }, [ziel]);

  // Eine andere Seite oder die andere Ansicht kommt herein.
  const index = seite ? SEITEN.indexOf(seite) : 0;
  const zuletzt = useRef({ index, mitErgaenzungen });
  useLayoutEffect(() => {
    const alt = zuletzt.current;
    zuletzt.current = { index, mitErgaenzungen };
    const richtung = Math.sign(index - alt.index) as -1 | 0 | 1;
    if (!richtung && alt.mitErgaenzungen === mitErgaenzungen) return;
    const kind = mitte.current?.firstElementChild;
    if (kind) hereinschieben(kind, richtung, mitte.current);
  }, [index, mitErgaenzungen]);

  if (!seite || !kapitel)
    return <p className="p-6 text-sm">Dieses Skript hat noch keine Kapitel.</p>;

  const spalteUmschalten = () =>
    transition("panel", () => setPanel((alt) => (alt === "seite" ? null : "seite")));
  // Kompakt ein Blatt, das sich selbst bewegt; am Handy ist „Inhalt“ eine
  // Seite, die von rechts kommt und dorthin zurückgeht (wie `usePanel()`).
  const blattUmschalten = (art: BlattArt) => {
    const umschalten = () => {
      setBlattArt(art);
      setBlatt((alt) => (alt === art ? null : art));
    };
    if (stufe === "narrow") transition(blatt === art ? "back" : "forward", umschalten);
    else umschalten();
  };
  // Die Einstellungen: breit ein Dialog, sonst eine Seite, die von rechts
  // kommt und dorthin zurückgeht (wie `useArea()` des Designs).
  const einstellungenUmschalten = (offen: boolean) =>
    stufe === "wide"
      ? setEinstellungen(offen)
      : transition(offen ? "forward" : "back", () => setEinstellungen(offen));
  // Liegt eine Seite über allem, ruht der Rest.
  const inhaltSeite = stufe === "narrow" && blatt === "inhalt";
  const ruhend = (stufe !== "wide" && einstellungen) || inhaltSeite;
  // „Auf dieser Seite“: breit die Spalte rechts, kompakt ein Blatt.
  const seiteOffen = stufe === "wide" ? panel === "seite" : blatt === "seite";
  const inhalt = (gross: boolean) => (
    <Suche onGehe={hingehen}>
      <Kapitelbaum ort={ort} aktiv={aktiv} onGehe={hingehen} gross={gross} />
    </Suche>
  );

  return (
    <AnsichtContext.Provider value={{ mitErgaenzungen }}>
      <div className="relative flex h-dvh flex-col text-sm">
        <header
          inert={ruhend}
          className={cn(
            "flex h-[calc(3.5rem+env(safe-area-inset-top))] shrink-0 items-center gap-2 border-b pt-[env(safe-area-inset-top)] short:h-[calc(3rem+env(safe-area-inset-top))] md:gap-4",
            RAND_X,
          )}
        >
          <h1 className="min-w-0 flex-1 text-base leading-5 font-semibold compact:flex-initial">
            {SKRIPT.titel}
          </h1>
          {stufe !== "narrow" && (
            <>
              {/* Unter `md:` steht „Kapitel 2 / 3“ über der Seite, sonst passen
                  Titel, Tabs und Knöpfe nicht in die Zeile */}
              <span className="hidden md:inline-flex">
                <KapitelBadge seite={seite} />
              </span>
              <span className="flex-1" />
              <span className="shrink-0">
                <AnsichtTabs mitErgaenzungen={mitErgaenzungen} onChange={setMitErgaenzungen} />
              </span>
            </>
          )}
          <div className="flex shrink-0 gap-2">
            {stufe !== "wide" && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Inhalt"
                aria-pressed={blatt === "inhalt"}
                className={cn(blatt === "inhalt" && "bg-accent")}
                onClick={() => blattUmschalten("inhalt")}
              >
                <BookOpen />
              </Button>
            )}
            {/* Die Wiederholungsfragen haben keine Abschnitte; am Handy
                zeigt „Inhalt“ die Abschnitte im Kapitelbaum */}
            {!seite.fragen && stufe !== "narrow" && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Auf dieser Seite"
                aria-pressed={seiteOffen}
                className={cn(seiteOffen && "bg-accent")}
                onClick={() => (stufe === "wide" ? spalteUmschalten() : blattUmschalten("seite"))}
              >
                <List />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Einstellungen"
              aria-haspopup={stufe === "wide" ? "dialog" : undefined}
              onClick={() => einstellungenUmschalten(true)}
            >
              <Settings />
            </Button>
          </div>
        </header>

        <div inert={ruhend} className="flex min-h-0 flex-1">
          {stufe === "wide" && (
            <aside className="relative flex w-70 shrink-0 flex-col overflow-y-auto border-r">
              <Suche onGehe={hingehen} spalte>
                <Kapitelbaum ort={ort} aktiv={aktiv} onGehe={hingehen} />
              </Suche>
            </aside>
          )}

          <main ref={mitte} className="relative min-w-0 flex-1 overflow-y-auto">
            <KapitelSeite
              seite={seite}
              onGehe={hingehen}
              onErgaenzungenZeigen={() => setMitErgaenzungen(true)}
            />
          </main>

          {stufe === "wide" && panel === "seite" && !seite.fragen && (
            <aside data-vt="panel" className="relative w-70 shrink-0 overflow-y-auto px-6 py-10">
              <AufDieserSeite kapitel={kapitel} aktiv={aktiv} onGehe={hingehen} />
            </aside>
          )}
        </div>
        {stufe === "narrow" && (
          <div inert={ruhend}>
            <BottomBar>
              <AnsichtTabs mitErgaenzungen={mitErgaenzungen} onChange={setMitErgaenzungen} leiste />
            </BottomBar>
          </div>
        )}

        {/* Am Handy ist „Inhalt“ eine Seite über allem (wie `Panel` des Designs) */}
        {inhaltSeite && (
          <div className="absolute inset-0 z-10 flex flex-col bg-background pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]">
            <PanelHeader
              title="Inhalt"
              onBack={() => blattUmschalten("inhalt")}
              backLabel="Zurück"
            />
            <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {inhalt(true)}
            </div>
          </div>
        )}

        {stufe === "compact" && (
          <PanelSheet open={blatt !== null} onClose={() => setBlatt(null)}>
            <PanelHeader
              title={blattArt === "inhalt" ? "Inhalt" : "Auf dieser Seite"}
              onClose={() => setBlatt(null)}
              closeLabel={`${blattArt === "inhalt" ? "Inhalt" : "Auf dieser Seite"} schließen`}
            />
            <div className="relative min-h-0 flex-1 overflow-y-auto px-6 pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              {blattArt === "inhalt" ? (
                inhalt(true)
              ) : (
                <AufDieserSeite kapitel={kapitel} aktiv={aktiv} onGehe={hingehen} imBlatt />
              )}
            </div>
          </PanelSheet>
        )}
        {stufe === "wide" && (
          <EinstellungenDialog offen={einstellungen} onSchliessen={() => setEinstellungen(false)} />
        )}
        {stufe !== "wide" && einstellungen && (
          <EinstellungenSeite onSchliessen={() => einstellungenUmschalten(false)} />
        )}
      </div>
    </AnsichtContext.Provider>
  );
}
