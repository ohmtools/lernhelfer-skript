import { cn } from "cn";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RAND_X } from "@/lib/rand";

export type Tab = "skript" | "inhalt" | "einstellungen";

const TABS: { tab: Tab; label: string }[] = [
  { tab: "skript", label: "Skript" },
  { tab: "inhalt", label: "Inhalt" },
  { tab: "einstellungen", label: "Einstellungen" },
];

const istTab = (wert: unknown): wert is Tab => TABS.some((t) => t.tab === wert);

/** Unter `wide:` die Leiste unten, in Reichweite des Daumens: „Skript | Inhalt | Einstellungen“. */
export function TabLeiste({ tab, onChange }: { tab: Tab; onChange: (tab: Tab) => void }) {
  return (
    <div
      className={cn(
        "shrink-0 border-t bg-background pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] wide:hidden",
        RAND_X,
      )}
    >
      <Tabs value={tab} onValueChange={(wert: unknown) => istTab(wert) && onChange(wert)}>
        <TabsList aria-label="Ansichten" className="h-10! w-full">
          {TABS.map(({ tab: t, label }) => (
            <TabsTrigger key={t} value={t}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
