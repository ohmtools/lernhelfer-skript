import type { ReactNode } from "react";
import { PanelKopf } from "@/components/shell/PanelKopf";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

/**
 * `compact:`: „Inhalt“ oder „Auf dieser Seite“ als Blatt von rechts, 380 px,
 * über der Seite, wie zeiteisens `PanelSheet` (DESIGN.md, „Reading pages“,
 * „Shell“). Kopf mit Titel und Schließen, darunter scrollt der Inhalt für
 * sich. Bewegung, Glas und Abdunklung bringt `ui/sheet.tsx` mit.
 */
export function Blatt({
  offen,
  titel,
  onSchliessen,
  children,
}: {
  offen: boolean;
  titel: string;
  onSchliessen: () => void;
  children: ReactNode;
}) {
  return (
    <Sheet
      open={offen}
      onOpenChange={(neu) => {
        if (!neu) onSchliessen();
      }}
    >
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-[380px] max-w-[calc(100%-2rem)] gap-0 pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] data-[side=right]:sm:max-w-[380px]"
      >
        <PanelKopf
          titel={<SheetTitle className="text-base leading-6 font-semibold">{titel}</SheetTitle>}
          onSchliessen={onSchliessen}
          schliessenText={`${titel} schließen`}
        />
        <div className="relative min-h-0 flex-1 overflow-y-auto px-6 pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
