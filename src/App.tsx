import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Ansicht } from "@/components/shell/Ansicht";
import { AufDieserSeite } from "@/components/shell/AufDieserSeite";
import { Kapitelbaum } from "@/components/shell/Kapitelbaum";
import { KapitelSeite } from "@/components/shell/KapitelSeite";
import { Suche } from "@/components/shell/Suche";
import { TabLeiste, type Tab } from "@/components/shell/TabLeiste";
import { Ueber } from "@/components/shell/Ueber";
import { AnsichtContext } from "@/lib/ansicht";
import { KAPITEL, SKRIPT } from "@/lib/kapitel";
import { useNavigation, type Ort } from "@/lib/navigation";

// Desktop (`desktop:`): ein Viewport, drei Spalten, jede scrollt für sich:
// links Suche und Kapitel, Mitte das Kapitel, rechts (ab xl) „Auf dieser
// Seite“. Darunter: Tab-Leiste „Skript | Inhalt | Einstellungen“, die Seite
// scrollt (ohmtools-Design, wie zeiteisen).

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
          if (el && el.getBoundingClientRect().top <= 120) gefunden = id;
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

export function App() {
  const { ort, gehe } = useNavigation();
  const [tab, setTab] = useState<Tab>("skript");
  const [mitErgaenzungen, setMitErgaenzungen] = useState(true);
  const [ziel, setZiel] = useState<Ort | null>(ort.abschnitt ? ort : null);
  const erledigt = useRef<Ort | null>(null);
  const mitte = useRef<HTMLElement>(null);
  const kapitel = KAPITEL.find((k) => k.schluessel === ort.kapitel) ?? KAPITEL[0];
  const ids = kapitel ? kapitel.gliederung.map((g) => g.id) : [];
  const [idsStabil, setIdsStabil] = useState(ids);
  if (idsStabil.join() !== ids.join()) setIdsStabil(ids);
  const aktiv = useAktiverAbschnitt(idsStabil);

  const hingehen = (neu: Ort) => {
    gehe(neu);
    setTab("skript");
    setZiel(neu);
  };

  // Nach dem Wechsel zum Abschnitt springen, sonst an den Anfang des Kapitels.
  useLayoutEffect(() => {
    if (!ziel || tab !== "skript" || erledigt.current === ziel) return;
    erledigt.current = ziel;
    const el = ziel.abschnitt ? document.getElementById(ziel.abschnitt) : null;
    if (el) el.scrollIntoView({ block: "start" });
    else {
      mitte.current?.scrollTo({ top: 0 });
      window.scrollTo({ top: 0 });
    }
  }, [ziel, tab]);

  if (!kapitel) return <p className="p-6 text-sm">Dieses Skript hat noch keine Kapitel.</p>;

  return (
    <AnsichtContext.Provider value={{ mitErgaenzungen }}>
      <div className="min-h-dvh desktop:grid desktop:h-dvh desktop:grid-cols-[18rem_minmax(0,1fr)] xl:desktop:grid-cols-[18rem_minmax(0,1fr)_15rem]">
        <aside className="hidden min-h-0 flex-col border-r desktop:flex">
          <div className="flex items-start gap-2 border-b p-6">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-balance">{SKRIPT.titel}</p>
              {SKRIPT.fach && <p className="mt-1 text-xs text-muted-foreground">{SKRIPT.fach}</p>}
            </div>
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="-mt-2 -mr-2"
                    aria-label="Über dieses Skript"
                  />
                }
              >
                <Info />
              </PopoverTrigger>
              <PopoverContent side="bottom" align="start" className="w-80">
                <p className="text-sm font-semibold">{SKRIPT.titel}</p>
                <Ueber />
              </PopoverContent>
            </Popover>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            <Suche onGehe={hingehen}>
              <Kapitelbaum ort={ort} aktiv={aktiv} onGehe={hingehen} />
            </Suche>
          </div>
          <div className="border-t p-6">
            <Ansicht mitErgaenzungen={mitErgaenzungen} onChange={setMitErgaenzungen} voll />
          </div>
        </aside>

        <main
          ref={mitte}
          className="pb-[calc(3.5rem+env(safe-area-inset-bottom))] desktop:min-h-0 desktop:overflow-y-auto desktop:pb-0"
        >
          <div className={tab === "skript" ? undefined : "hidden desktop:block"}>
            <KapitelSeite kapitel={kapitel} mitErgaenzungen={mitErgaenzungen} onGehe={hingehen} />
          </div>
          {tab === "inhalt" && (
            <section className="p-6 desktop:hidden" aria-label="Inhalt">
              <p className="text-lg font-semibold text-balance">{SKRIPT.titel}</p>
              {SKRIPT.fach && (
                <p className="mt-1 mb-6 text-sm text-muted-foreground">{SKRIPT.fach}</p>
              )}
              <Suche onGehe={hingehen}>
                <Kapitelbaum ort={ort} aktiv={aktiv} onGehe={hingehen} />
              </Suche>
            </section>
          )}
          {tab === "einstellungen" && (
            <div className="desktop:hidden">
              <section className="border-b p-6">
                <h2 className="mb-3 text-lg font-semibold">Ansicht</h2>
                <Ansicht mitErgaenzungen={mitErgaenzungen} onChange={setMitErgaenzungen} voll />
              </section>
              <section className="p-6">
                <h2 className="mb-3 text-lg font-semibold">Über dieses Skript</h2>
                <p className="mb-3 text-sm font-medium">{SKRIPT.titel}</p>
                <Ueber />
              </section>
            </div>
          )}
        </main>

        <aside className="hidden min-h-0 overflow-y-auto border-l p-6 xl:desktop:block">
          <AufDieserSeite kapitel={kapitel} aktiv={aktiv} onGehe={hingehen} />
        </aside>
      </div>
      <TabLeiste tab={tab} onChange={setTab} />
    </AnsichtContext.Provider>
  );
}
