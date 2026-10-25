import type { ReactNode } from "react";
import { ChevronLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Titelzeile eines Panels, 56 px wie zeiteisens `PanelHeader`: am Handy eine
 * Seite mit Pfeil zurück vor dem Titel, im Blatt der Knopf zum Schließen
 * dahinter. `titel` darf ein eigenes Element sein (der Titel eines Dialogs).
 */
export function PanelKopf({
  titel,
  onZurueck,
  onSchliessen,
  schliessenText = "Schließen",
}: {
  titel: ReactNode;
  onZurueck?: () => void;
  onSchliessen?: () => void;
  /** Name des Knopfs zum Schließen für Screenreader, z.B. „Inhalt schließen“. */
  schliessenText?: string;
}) {
  return (
    <div className="flex h-14 shrink-0 items-center gap-2 px-4 compact:px-6">
      {onZurueck && (
        <Button
          variant="ghost"
          size="icon"
          className="-ml-2 size-10 compact:size-9"
          aria-label="Zurück"
          onClick={onZurueck}
        >
          <ChevronLeft />
        </Button>
      )}
      {typeof titel === "string" ? (
        <h2 className="min-w-0 flex-1 text-base leading-6 font-semibold">{titel}</h2>
      ) : (
        <div className="min-w-0 flex-1">{titel}</div>
      )}
      {onSchliessen && (
        <Button
          variant="ghost"
          size="icon"
          className="-mr-2"
          aria-label={schliessenText}
          onClick={onSchliessen}
        >
          <X />
        </Button>
      )}
    </div>
  );
}
