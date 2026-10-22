import katex from "katex";
import { useMemo } from "react";
import { cn } from "cn";

// KaTeX zur Laufzeit für Beschriftungen in Grafiken und berechnete Werte.
// Formeln im Text setzt schon das Bauen (rehype-katex, Komponente Formel).
export function Tex({
  children,
  block = false,
  className,
}: {
  children: string;
  block?: boolean;
  className?: string;
}) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(children, {
        displayMode: block,
        throwOnError: true,
        strict: "ignore",
      });
    } catch (fehler) {
      // `npm run pruefen` rendert jedes Kapitel auf dem Server und soll den
      // Fehler sehen; im Browser bleibt der Quelltext stehen.
      if (import.meta.env.SSR)
        throw new Error(`Formel „${children}“: ${(fehler as Error).message}`);
      return null;
    }
  }, [children, block]);
  if (html == null) return <code className={className}>{children}</code>;
  return (
    <span className={cn(block && "block", className)} dangerouslySetInnerHTML={{ __html: html }} />
  );
}

/** Gesetzte Formel aus dem Bauen (siehe plugins/pipeline.mjs). */
export function Formel({ html, block }: { html: string; block?: boolean }) {
  if (block) {
    return (
      <div
        className="my-4 overflow-x-auto overflow-y-hidden py-1"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
