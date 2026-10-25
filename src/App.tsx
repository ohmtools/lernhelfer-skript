import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { BookOpen, List, Search, Settings } from "lucide-react";
import { cn } from "cn";
import { PanelHeader } from "@/components/ohmtools/panel-header";
import { PanelSheet } from "@/components/ohmtools/panel-sheet";
import { Button } from "@/components/ui/button";
import { AnsichtTabs } from "@/components/shell/AnsichtTabs";
import { AufDieserSeite } from "@/components/shell/AufDieserSeite";
import {
  EinstellungenDialog,
  EinstellungenSeite,
  EinstellungenTab,
} from "@/components/shell/Einstellungen";
import { Kapitelbaum } from "@/components/shell/Kapitelbaum";
import { KapitelBadge, KapitelSeite } from "@/components/shell/KapitelSeite";
import { Suche } from "@/components/shell/Suche";
import { TabLeiste, type Tab } from "@/components/shell/TabLeiste";
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
// - schmal (`narrow`): eine Spalte und die Leiste „Skript | Inhalt |
//   Einstellungen“.
// Die Einstellungen sind breit ein Dialog, kompakt eine Seite an Stelle der
// Ansicht, am Handy der Tab.
// Bewegung (`@/lib/bewegung`, `@/lib/ohmtools/motion`): die nächste Seite
// oder der Tab rechts davon kommt von rechts, die vorige von links; „Mit
// Ergänzungen | Nur Original“ blendet die Seite neu ein; die Spalte rechts
// gleitet herein (`panel`), die Seite der Einstellungen kommt von rechts
// (`forward`, `back`); ein Sprung innerhalb der Seite scrollt sanft. Blatt
// und Dialog bewegen sich wie in den Apps (`ui/sheet.tsx`, `ui/dialog.tsx`).

type Panel = "seite" | null;
type BlattArt = "inhalt" | "seite";

/** Die Tabs in der Reihenfolge der Leiste (`TabLeiste`), für die Richtung. */
const REIHE: Tab[] = ["skript", "inhalt", "einstellungen"];

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
  const [tabWahl, setTab] = useState<Tab>("skript");
  // Die Leiste gibt es nur am Handy; sonst steht immer die Seite da.
  const tab: Tab = stufe === "narrow" ? tabWahl : "skript";
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
  const suchfeld = useRef<HTMLInputElement>(null);
  const fragen = ort.abschnitt === FRAGENSEITE;
  const seite =
    SEITEN.find((s) => s.kapitel.schluessel === ort.kapitel && s.fragen === fragen) ?? SEITEN[0];
  const kapitel = seite?.kapitel;
  const ids = kapitel && !seite.fragen ? kapitel.gliederung.map((g) => g.id) : [];
  const [idsStabil, setIdsStabil] = useState(ids);
  if (idsStabil.join() !== ids.join()) setIdsStabil(ids);
  const aktiv = useAktiverAbschnitt(idsStabil);

  // Blatt und Dialog gehören zu ihrer Stufe: wechselt sie, schließen sie.
  const [stufeZuletzt, setStufeZuletzt] = useState(stufe);
  if (stufeZuletzt !== stufe) {
    setStufeZuletzt(stufe);
    if (stufe !== "compact") setBlatt(null);
    if (stufe === "narrow") setEinstellungen(false);
  }

  const hingehen = (neu: Ort) => {
    // Auf derselben Seite und schon sichtbar: dorthin scrollen statt springen.
    sanft.current =
      tab === "skript" && neu.kapitel === ort.kapitel && (neu.abschnitt === FRAGENSEITE) === fragen;
    gehe(neu);
    setTab("skript");
    setBlatt(null);
    setZiel(neu);
  };

  // Nach dem Wechsel zum Abschnitt springen, sonst an den Anfang der Seite.
  useLayoutEffect(() => {
    if (!ziel || tab !== "skript" || erledigt.current === ziel) return;
    erledigt.current = ziel;
    const el =
      ziel.abschnitt && ziel.abschnitt !== FRAGENSEITE
        ? document.getElementById(ziel.abschnitt)
        : null;
    const behavior = sanft.current && !reducedMotion() ? "smooth" : "auto";
    if (el) el.scrollIntoView({ block: "start", behavior });
    else mitte.current?.scrollTo({ top: 0, behavior });
    if (el && behavior === "auto" && mitte.current) return festhalten(el, mitte.current);
  }, [ziel, tab]);

  // Eine andere Seite, ein anderer Tab oder die andere Ansicht kommt herein.
  const index = seite ? SEITEN.indexOf(seite) : 0;
  const zuletzt = useRef({ index, tab, mitErgaenzungen });
  useLayoutEffect(() => {
    const alt = zuletzt.current;
    zuletzt.current = { index, tab, mitErgaenzungen };
    const tabs = REIHE.indexOf(tab) - REIHE.indexOf(alt.tab);
    const richtung = Math.sign(tabs || index - alt.index) as -1 | 0 | 1;
    if (!richtung && alt.mitErgaenzungen === mitErgaenzungen) return;
    const sichtbar = [...(mitte.current?.children ?? [])].find((k) => k.getClientRects().length);
    if (sichtbar) hereinschieben(sichtbar, richtung, mitte.current);
  }, [index, tab, mitErgaenzungen]);

  if (!seite || !kapitel)
    return <p className="p-6 text-sm">Dieses Skript hat noch keine Kapitel.</p>;

  const spalteUmschalten = () =>
    transition("panel", () => setPanel((alt) => (alt === "seite" ? null : "seite")));
  const blattUmschalten = (art: BlattArt) => {
    setBlattArt(art);
    setBlatt((alt) => (alt === art ? null : art));
  };
  // Die Einstellungen: breit ein Dialog, kompakt eine Seite, die von rechts
  // kommt und dorthin zurückgeht (wie `useArea()` des Designs).
  const einstellungenUmschalten = (offen: boolean) =>
    stufe === "compact"
      ? transition(offen ? "forward" : "back", () => setEinstellungen(offen))
      : setEinstellungen(offen);
  // Kompakt liegt die Seite der Einstellungen über allem, der Rest ruht.
  const ruhend = stufe === "compact" && einstellungen;
  // „Auf dieser Seite“: breit die Spalte rechts, kompakt ein Blatt.
  const seiteOffen = stufe === "wide" ? panel === "seite" : blatt === "seite";
  const inhalt = (gross: boolean, feldRef?: typeof suchfeld) => (
    <Suche onGehe={hingehen} feldRef={feldRef}>
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
          {stufe === "narrow" ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Suchen"
              className="size-10"
              onClick={() => {
                setTab("inhalt");
                requestAnimationFrame(() => suchfeld.current?.focus());
              }}
            >
              <Search />
            </Button>
          ) : (
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
              <div className="flex shrink-0 gap-2">
                {stufe === "compact" && (
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
                {/* Die Wiederholungsfragen haben keine Abschnitte */}
                {!seite.fragen && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Auf dieser Seite"
                    aria-pressed={seiteOffen}
                    className={cn(seiteOffen && "bg-accent")}
                    onClick={() =>
                      stufe === "wide" ? spalteUmschalten() : blattUmschalten("seite")
                    }
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
            </>
          )}
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
            {/* Bleibt eingehängt, damit Antworten und Regler einen Tabwechsel überstehen */}
            <div className={tab === "skript" ? undefined : "hidden"}>
              <KapitelSeite
                seite={seite}
                onGehe={hingehen}
                onErgaenzungenZeigen={() => setMitErgaenzungen(true)}
              />
            </div>
            {tab === "inhalt" && (
              <section className={cn("py-4", RAND_X)} aria-label="Inhalt">
                {inhalt(true, suchfeld)}
              </section>
            )}
            {tab === "einstellungen" && (
              <EinstellungenTab mitErgaenzungen={mitErgaenzungen} onChange={setMitErgaenzungen} />
            )}
          </main>

          {stufe === "wide" && panel === "seite" && !seite.fragen && (
            <aside data-vt="panel" className="relative w-70 shrink-0 overflow-y-auto px-6 py-10">
              <AufDieserSeite kapitel={kapitel} aktiv={aktiv} onGehe={hingehen} />
            </aside>
          )}
        </div>
        {stufe === "narrow" && <TabLeiste tab={tab} onChange={setTab} />}

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
        {stufe === "compact" && einstellungen && (
          <EinstellungenSeite onSchliessen={() => einstellungenUmschalten(false)} />
        )}
      </div>
    </AnsichtContext.Provider>
  );
}
