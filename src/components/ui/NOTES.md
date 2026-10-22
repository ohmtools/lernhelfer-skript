# src/components/ui

shadcn-Komponenten im Stil `base-sera` (Base UI, nicht Radix), wie in
zeiteisen. Nicht von Hand ändern, außer hier steht es.

- `button`, `checkbox`, `input`, `label`, `popover`, `separator`,
  `textarea`, `toggle`, `toggle-group` sind aus zeiteisen kopiert (dort von
  der shadcn-CLI erzeugt, `uppercase`/`tracking-*` entfernt).
- `slider` und `radio-group` sind aus dem shadcn-Repository
  (`apps/v4/registry/bases/base/ui/*.tsx`) mit den Klassen aus
  `registry/styles/style-sera.css` von Hand so gebaut, wie es die CLI täte:
  `ui.shadcn.com` war beim Anlegen gesperrt. Mit Zugang neu erzeugen:
  `npx shadcn@latest add slider radio-group`, danach
  `uppercase` und `tracking-wider`/`tracking-widest` entfernen.
- `cn` kommt aus dem Paket `cn`; `src/lib/utils.ts` gibt es nur für die CLI.
