# src/components/ui

shadcn-Komponenten im Stil `base-vega` (Base UI, nicht Radix), wie in
zeiteisen. Nicht von Hand ändern, außer hier steht es.

- `button`, `checkbox`, `dialog`, `drawer`, `input`, `label`, `popover`,
  `separator`, `sheet`, `tabs`, `textarea`, `toggle`, `toggle-group` sind
  Kopien aus `ohmtools/design` (`shadcn/src/components/ui/`, mit den
  Handänderungen aus dessen DESIGN.md, „Hand-edits“), geholt mit
  `npx --yes github:ohmtools/design add --force <name>…`. Die erste Zeile
  nennt die Quelle; `ohmtools-design check` schlägt fehl, wenn eine Kopie
  abweicht. Eine Änderung gehört zuerst ins Design, dann `add` erneut. Das
  gilt ebenso für `src/components/ohmtools/`, `src/lib/ohmtools/` und
  `src/styles/ohmtools.css`.
- `slider`, `radio-group`, `badge` und `table` sind aus dem
  shadcn-Repository (`apps/v4/registry/bases/base/ui/*.tsx`), jede
  `cn-*`-Klasse durch ihre `@apply`-Liste aus
  `apps/v4/registry/styles/style-vega.css` ersetzt, wie es die CLI täte:
  `ui.shadcn.com` war beim Anlegen gesperrt. Mit Zugang neu erzeugen:
  `npx shadcn@latest add slider radio-group badge table`, danach
  `uppercase` und `tracking-wider`/`tracking-widest` entfernen und die
  Handänderungen unten wieder einbauen.
- Handänderungen:
  - `badge.tsx`: Radius `rounded-sm` (6 px, DESIGN.md „Shape and surfaces“)
    statt der Pille, und die Variante `red` (`bg-red text-red-foreground`)
    für das Badge „Ergänzung“, das einzige rote.
- `cn` kommt aus dem Paket `cn`; `src/lib/utils.ts` gibt es nur für die CLI.
