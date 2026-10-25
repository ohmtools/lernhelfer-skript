// Seitenabstand an den Rändern (Kopf, Leiste, Inhalt, Einstellungen) wie in
// zeiteisen (`AppHeader.tsx`): 16 px, ab `compact:` 24 px, aber mindestens der
// sichere Bereich (Notch im Querformat). Der größere Wert gilt, nie beide
// zusammen.
export const RAND_X =
  "pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))] compact:pr-[max(1.5rem,env(safe-area-inset-right))] compact:pl-[max(1.5rem,env(safe-area-inset-left))]";
