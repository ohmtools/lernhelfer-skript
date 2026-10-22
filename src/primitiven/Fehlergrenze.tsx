import type { ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";

// Ein Fehler in einer Grafik oder einem Experiment soll nicht die ganze Seite
// leeren, nur diesen Block.
export function Fehlergrenze({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallbackRender={({ error }) => (
        <p role="alert" className="text-sm text-destructive">
          Dieser Teil lässt sich nicht anzeigen:{" "}
          {error instanceof Error ? error.message : String(error)}
        </p>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
