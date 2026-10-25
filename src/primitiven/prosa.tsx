import { Children, isValidElement, type ComponentProps, type ReactNode } from "react";
import { cn } from "cn";

// Die Elemente des Originaltexts in shadcns Typografie (DESIGN.md, „Reading
// pages“, „Type“): am Handy etwas kleiner, ab `compact:` die volle Größe.
// Die Seite hat ihr <h1> im Kopf; das # des Kapitels wird deshalb <h2>, jede
// Ebene darunter eine tiefer. Linien statt Kästen.

const UEBERSCHRIFT = "scroll-mt-6 font-semibold tracking-tight text-balance";

export const h1 = ({ className, ...p }: ComponentProps<"h1">) => (
  <h2
    {...p}
    className={cn(
      UEBERSCHRIFT,
      "mt-2 mb-4 border-b pb-2 text-[26px] leading-8 compact:text-3xl compact:leading-9",
      className,
    )}
  />
);
export const h2 = (p: ComponentProps<"h2">) => (
  <h3
    {...p}
    className={cn(
      UEBERSCHRIFT,
      "mt-8 mb-2 text-xl leading-7 compact:mb-4 compact:text-2xl compact:leading-8",
    )}
  />
);
export const h3 = (p: ComponentProps<"h3">) => (
  <h4 {...p} className={cn(UEBERSCHRIFT, "mt-6 mb-2 text-lg leading-7")} />
);
export const h4 = (p: ComponentProps<"h4">) => (
  <h5 {...p} className={cn(UEBERSCHRIFT, "mt-6 mb-2 text-base leading-7")} />
);
export const h5 = h4;
export const h6 = h4;
const TEXT = "text-base leading-[26px] compact:leading-7";
export const p = (props: ComponentProps<"p">) => <p {...props} className={cn("my-4", TEXT)} />;
export const ul = (p: ComponentProps<"ul">) => (
  <ul {...p} className={cn("my-4 ml-6 list-disc space-y-1", TEXT)} />
);
export const ol = (p: ComponentProps<"ol">) => (
  <ol {...p} className={cn("my-4 ml-6 list-decimal space-y-1", TEXT)} />
);
export const li = (p: ComponentProps<"li">) => <li {...p} className="pl-1 [&>p]:my-1" />;
export const a = (p: ComponentProps<"a">) => (
  <a {...p} target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4" />
);
export const blockquote = (p: ComponentProps<"blockquote">) => (
  <blockquote {...p} className="my-4 border-l-2 pl-4 text-muted-foreground" />
);
export const hr = () => <hr className="my-8" />;
export const table = (p: ComponentProps<"table">) => (
  <div className="relative my-6 overflow-x-auto">
    <table {...p} className="w-full border-collapse text-sm" />
  </div>
);
export const th = (p: ComponentProps<"th">) => (
  <th {...p} className="h-10 border-b px-2 text-left font-medium first:pl-0 last:pr-0" />
);
export const td = (p: ComponentProps<"td">) => (
  <td {...p} className="border-b px-2 py-2 align-top first:pl-0 last:pr-0" />
);
export const code = ({ className, ...p }: ComponentProps<"code">) => (
  <code {...p} className={cn("font-mono text-[0.9em]", className)} />
);
// Code wie im Übungsblatt zwischen zwei Linien; Farben über --shiki-* (index.css).
export const pre = ({ className, style, ...p }: ComponentProps<"pre">) => (
  <pre
    {...p}
    style={{ ...style, backgroundColor: "transparent" }}
    className={cn(
      "relative my-6 overflow-x-auto border-y py-3 font-mono text-[13px] leading-relaxed",
      className,
    )}
  />
);
export const img = (p: ComponentProps<"img">) => (
  <img {...p} alt={p.alt ?? ""} className="mx-auto h-auto max-h-[70vh] w-auto max-w-full" />
);

/**
 * Bildunterschrift des Originals: „Abb. 2.2: Text“ → „**Abb. 2.2** Text“,
 * die Nummer halbfett in der Textfarbe, der Text grau.
 */
function Unterschrift({ children, className }: { children: ReactNode; className?: string }) {
  const kinder = Children.toArray(children);
  const erstes = kinder[0];
  const m =
    typeof erstes === "string"
      ? /^((?:Abb(?:ildung)?|Bild|Fig(?:ur)?|Tab(?:elle)?)\.?\s*[\dA-Z][\d.]*[a-z]?)\s*:?\s*/.exec(
          erstes,
        )
      : null;
  return (
    <figcaption className={cn("mt-2 text-sm text-muted-foreground", className)}>
      {m ? (
        <>
          <b className="font-semibold text-foreground">{m[1]}</b>{" "}
          {(erstes as string).slice(m[0].length)}
          {kinder.slice(1)}
        </>
      ) : (
        children
      )}
    </figcaption>
  );
}

/** Abbildung des Originals mit seiner Bildunterschrift. */
export function Abbildung({
  beschriftung,
  invertieren,
  children,
}: {
  beschriftung?: string;
  invertieren?: boolean;
  children?: ReactNode;
}) {
  return (
    <figure
      className={cn("my-6", invertieren && "dark:[&_img]:hue-rotate-180 dark:[&_img]:invert")}
    >
      {children}
      {beschriftung && <Unterschrift>{beschriftung}</Unterschrift>}
    </figure>
  );
}

/** Abbildung des Originals aus Teilbildern (a), (b) …, darunter die gemeinsame Bildunterschrift. */
export function Abbildungen({ children }: { children?: ReactNode }) {
  const kinder = Children.toArray(children);
  const unterschrift = kinder.filter((k) => isValidElement(k) && k.type === Bildunterschrift);
  return (
    <figure className="my-6">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,12rem),1fr))] items-end gap-6">
        {kinder.filter((k) => !(isValidElement(k) && k.type === Bildunterschrift))}
      </div>
      {unterschrift.length > 0 && (
        <Unterschrift className="mt-3">
          {unterschrift.flatMap((u) =>
            isValidElement<{ children?: ReactNode }>(u) ? Children.toArray(u.props.children) : [],
          )}
        </Unterschrift>
      )}
    </figure>
  );
}

/** Ein Teilbild in `Abbildungen` mit seiner eigenen Unterschrift, z.B. „(a) Kurzschlussläufer“. */
export function Teilbild({
  beschriftung,
  invertieren,
  children,
}: {
  beschriftung?: string;
  invertieren?: boolean;
  children?: ReactNode;
}) {
  return (
    <figure className={cn(invertieren && "dark:[&_img]:hue-rotate-180 dark:[&_img]:invert")}>
      {children}
      {beschriftung && <Unterschrift>{beschriftung}</Unterschrift>}
    </figure>
  );
}

/** Gemeinsame Bildunterschrift einer `:::abbildung`; `Abbildungen` setzt sie darunter. */
export function Bildunterschrift({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

/** Wo im Original-PDF eine Seite beginnt: „Seite 4 im Original“ und eine Linie. */
export function Seite({ nr }: { nr: number }) {
  return (
    <div
      id={`seite-${nr}`}
      role="note"
      className="mt-10 mb-4 flex scroll-mt-6 items-center gap-3 text-xs leading-5 text-muted-foreground"
    >
      <span>
        Seite <span className="font-mono">{nr}</span> im Original
      </span>
      <span aria-hidden className="h-px flex-1 bg-border" />
    </div>
  );
}
