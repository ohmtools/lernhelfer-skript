import { BookOpen, ListTree, Settings } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";

export type Tab = "skript" | "inhalt" | "einstellungen";

// Wie zeiteisen: unter `desktop` eine feste Leiste unten, Symbol über
// Beschriftung, der aktive Tab mit roter Linie auf der Trennlinie.
const TAB_ITEM =
  "relative h-14 min-w-0 flex-1 flex-col gap-1 text-xs text-muted-foreground aria-[current=page]:text-foreground";

export function TabLeiste({ tab, onChange }: { tab: Tab; onChange: (tab: Tab) => void }) {
  const tabs: { tab: Tab; label: string; Icon: typeof BookOpen }[] = [
    { tab: "skript", label: "Skript", Icon: BookOpen },
    { tab: "inhalt", label: "Inhalt", Icon: ListTree },
    { tab: "einstellungen", label: "Einstellungen", Icon: Settings },
  ];
  return (
    <nav
      aria-label="Ansichten"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-background pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] desktop:hidden"
    >
      {tabs.map(({ tab: t, label, Icon }) => (
        <Button
          key={t}
          variant="ghost"
          aria-current={t === tab ? "page" : undefined}
          className={TAB_ITEM}
          onClick={() => onChange(t)}
        >
          <span
            aria-hidden
            className={cn("absolute inset-x-0 -top-px h-0.5 bg-primary", t !== tab && "hidden")}
          />
          <Icon className="size-5" />
          {label}
        </Button>
      ))}
    </nav>
  );
}
