import { Children, isValidElement, type ComponentProps } from "react";
import { cn } from "cn";

// Die Elemente des Originaltexts. Größen und Gewichte nach der Skala des
// ohmtools-Designs (Titel 18px, Text 14px), Linien statt Kästen.

export const h1 = (p: ComponentProps<"h1">) => (
  <h1 {...p} className="mb-6 scroll-mt-6 text-lg font-semibold text-balance" />
);
export const h2 = (p: ComponentProps<"h2">) => (
  <h2 {...p} className="mt-6 mb-3 scroll-mt-6 border-t pt-6 text-base font-semibold" />
);
export const h3 = (p: ComponentProps<"h3">) => (
  <h3 {...p} className="mt-8 mb-2 scroll-mt-6 text-sm font-semibold" />
);
export const h4 = (p: ComponentProps<"h4">) => (
  <h4 {...p} className="mt-6 mb-2 scroll-mt-6 text-sm font-medium" />
);
export const h5 = h4;
export const h6 = h4;
export const p = (props: ComponentProps<"p">) => (
  <p {...props} className="my-3 text-sm leading-relaxed" />
);
export const ul = (p: ComponentProps<"ul">) => (
  <ul {...p} className="my-3 ml-5 list-disc space-y-1 text-sm leading-relaxed" />
);
export const ol = (p: ComponentProps<"ol">) => (
  <ol {...p} className="my-3 ml-5 list-decimal space-y-1 text-sm leading-relaxed" />
);
export const li = (p: ComponentProps<"li">) => <li {...p} className="pl-1 [&>p]:my-1" />;
export const a = (p: ComponentProps<"a">) => (
  <a
    {...p}
    target="_blank"
    rel="noreferrer"
    className="text-primary underline underline-offset-4"
  />
);
export const blockquote = (p: ComponentProps<"blockquote">) => (
  <blockquote {...p} className="my-4 border-l-2 border-border pl-4 text-muted-foreground" />
);
export const hr = () => <hr className="my-8" />;
export const table = (p: ComponentProps<"table">) => (
  <div className="my-4 overflow-x-auto">
    <table {...p} className="w-full border-collapse text-sm" />
  </div>
);
export const th = (p: ComponentProps<"th">) => (
  <th {...p} className="border-b px-3 py-2 text-left font-semibold first:pl-0" />
);
export const td = (p: ComponentProps<"td">) => (
  <td {...p} className="border-b px-3 py-2 align-top first:pl-0" />
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
      "my-4 overflow-x-auto border-y py-3 font-mono text-xs leading-relaxed",
      className,
    )}
  />
);
export const img = (p: ComponentProps<"img">) => (
  <img {...p} alt={p.alt ?? ""} className="mx-auto h-auto max-h-[70vh] w-auto max-w-full" />
);

/** Abbildung des Originals mit seiner Bildunterschrift. */
export function Abbildung({
  beschriftung,
  invertieren,
  children,
}: {
  beschriftung?: string;
  invertieren?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <figure
      className={cn("my-6", invertieren && "dark:[&_img]:hue-rotate-180 dark:[&_img]:invert")}
    >
      {children}
      {beschriftung && (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground">
          {beschriftung}
        </figcaption>
      )}
    </figure>
  );
}

/** Abbildung des Originals aus Teilbildern (a), (b) …, darunter die gemeinsame Bildunterschrift. */
export function Abbildungen({ children }: { children?: React.ReactNode }) {
  const kinder = Children.toArray(children);
  const unterschrift = kinder.filter((k) => isValidElement(k) && k.type === Bildunterschrift);
  return (
    <figure className="my-6">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,12rem),1fr))] items-end gap-6">
        {kinder.filter((k) => !(isValidElement(k) && k.type === Bildunterschrift))}
      </div>
      {unterschrift.length > 0 && (
        <figcaption className="mt-3 text-center text-sm text-muted-foreground">
          {unterschrift}
        </figcaption>
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
  children?: React.ReactNode;
}) {
  return (
    <figure className={cn(invertieren && "dark:[&_img]:hue-rotate-180 dark:[&_img]:invert")}>
      {children}
      {beschriftung && (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground">
          {beschriftung}
        </figcaption>
      )}
    </figure>
  );
}

/** Gemeinsame Bildunterschrift einer `:::abbildung`; `Abbildungen` setzt sie darunter. */
export function Bildunterschrift({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

/** Wo im Original-PDF eine Seite beginnt. */
export function Seite({ nr }: { nr: number }) {
  return (
    <div
      id={`seite-${nr}`}
      role="note"
      className="my-6 flex scroll-mt-6 items-center gap-3 text-xs text-muted-foreground"
    >
      <span aria-hidden className="h-px flex-1 bg-border" />
      Seite {nr} im Original
      <span aria-hidden className="h-px flex-1 bg-border" />
    </div>
  );
}
