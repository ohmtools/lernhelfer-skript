import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { List, Search, Settings } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { AnsichtTabs } from "@/components/shell/AnsichtTabs";
import { AufDieserSeite } from "@/components/shell/AufDieserSeite";
import { Einstellungen } from "@/components/shell/Einstellungen";
import { Kapitelbaum } from "@/components/shell/Kapitelbaum";
import { KapitelBadge, KapitelSeite } from "@/components/shell/KapitelSeite";
import { Suche } from "@/components/shell/Suche";
import { TabLeiste, type Tab } from "@/components/shell/TabLeiste";
import { AnsichtContext } from "@/lib/ansicht";
import { FRAGENSEITE, SEITEN, SKRIPT } from "@/lib/kapitel";
import { useNavigation, type Ort } from "@/lib/navigation";

// Ein Viewport, die Seite scrollt nie; jede Spalte scrollt für sich
// (DESIGN.md, „App shell“ und „Reading pages“). Kopf 56 px.
// - `wide:`: links Suche und Kapitel (280 px), Mitte die Seite (höchstens
//   720 px), rechts „Auf dieser Seite“ (280 px) oder das Panel
//   „Einstellungen“ (340 px), beide über Knöpfe im Kopf.
// - darunter eine Spalte und die Leiste „Skript | Inhalt | Einstellungen“.

type Panel = "seite" | "einstellungen" | null;

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
  const [tab, setTab] = useState<Tab>("skript");
  const [panel, setPanel] = useState<Panel>(startPanel);
  const [mitErgaenzungen, setMitErgaenzungen] = useState(true);
  const [ziel, setZiel] = useState<Ort | null>(ort.abschnitt ? ort : null);
  const erledigt = useRef<Ort | null>(null);
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

  const hingehen = (neu: Ort) => {
    gehe(neu);
    setTab("skript");
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
    if (el) el.scrollIntoView({ block: "start" });
    else mitte.current?.scrollTo({ top: 0 });
  }, [ziel, tab]);

  if (!seite || !kapitel)
    return <p className="p-6 text-sm">Dieses Skript hat noch keine Kapitel.</p>;

  const umschalten = (p: Panel) => setPanel((alt) => (alt === p ? null : p));
  const einstellungen = (schliessen?: () => void) => (
    <Einstellungen
      mitErgaenzungen={mitErgaenzungen}
      onChange={setMitErgaenzungen}
      onSchliessen={schliessen}
    />
  );

  return (
    <AnsichtContext.Provider value={{ mitErgaenzungen }}>
      <div className="flex h-dvh flex-col pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b pt-[env(safe-area-inset-top)] pr-2 pl-4 wide:gap-4 wide:px-6">
          <h1 className="min-w-0 flex-1 text-base leading-5 font-semibold compact:flex-none">
            {SKRIPT.titel}
          </h1>
          <span className="hidden compact:inline-flex">
            <KapitelBadge seite={seite} />
          </span>
          <span className="hidden flex-1 compact:block" />
          <span className="hidden wide:block">
            <AnsichtTabs mitErgaenzungen={mitErgaenzungen} onChange={setMitErgaenzungen} />
          </span>
          <div className="hidden gap-2 wide:flex">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Auf dieser Seite"
              aria-pressed={panel === "seite"}
              className={cn(panel === "seite" && "bg-accent")}
              onClick={() => umschalten("seite")}
            >
              <List />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Einstellungen"
              aria-pressed={panel === "einstellungen"}
              className={cn(panel === "einstellungen" && "bg-accent")}
              onClick={() => umschalten("einstellungen")}
            >
              <Settings />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Suchen"
            className="size-10 wide:hidden"
            onClick={() => {
              setTab("inhalt");
              requestAnimationFrame(() => suchfeld.current?.focus());
            }}
          >
            <Search />
          </Button>
        </header>

        <div className="flex min-h-0 flex-1">
          <aside className="hidden w-70 shrink-0 flex-col overflow-y-auto border-r wide:flex">
            <Suche onGehe={hingehen} spalte>
              <Kapitelbaum ort={ort} aktiv={aktiv} onGehe={hingehen} />
            </Suche>
          </aside>

          <main ref={mitte} className="min-w-0 flex-1 overflow-y-auto">
            <div className={tab === "skript" ? undefined : "hidden wide:block"}>
              <KapitelSeite seite={seite} onGehe={hingehen} />
            </div>
            {tab === "inhalt" && (
              <section className="p-4 wide:hidden" aria-label="Inhalt">
                <Suche onGehe={hingehen} feldRef={suchfeld}>
                  <Kapitelbaum ort={ort} aktiv={aktiv} onGehe={hingehen} gross />
                </Suche>
              </section>
            )}
            {tab === "einstellungen" && <div className="wide:hidden">{einstellungen()}</div>}
          </main>

          {panel === "seite" && !seite.fragen && (
            <aside className="hidden w-70 shrink-0 overflow-y-auto px-6 py-10 wide:block">
              <AufDieserSeite kapitel={kapitel} aktiv={aktiv} onGehe={hingehen} />
            </aside>
          )}
          {panel === "einstellungen" && (
            <aside
              aria-label="Einstellungen"
              className="hidden w-85 shrink-0 overflow-y-auto border-l wide:block"
            >
              {einstellungen(() => setPanel(null))}
            </aside>
          )}
        </div>
        <TabLeiste tab={tab} onChange={setTab} />
      </div>
    </AnsichtContext.Provider>
  );
}
