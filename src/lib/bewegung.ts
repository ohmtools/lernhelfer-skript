import { flushSync } from "react-dom";

// Bewegung ohne Bibliothek, wie in zeiteisen (`src/lib/motion.ts`,
// DESIGN.md „Motion“): View Transitions, wo sich das Layout ändert (das
// Panel rechts), die Web Animations API, wo nur etwas hereinkommt (eine
// andere Seite, ein anderer Tab), CSS für den Rest (`erscheinen` in
// `src/index.css`). Bei `prefers-reduced-motion` oder ohne Unterstützung
// des Browsers passiert die Änderung einfach sofort.

export function wenigBewegung(): boolean {
  try {
    return matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/** Die eine Kurve des Designs: schnell los, sanft landen. */
export const KURVE = "cubic-bezier(0.2, 0, 0, 1)";

let laufend = 0;

/**
 * Führt `aenderung` (ein State-Wechsel von React) in einer View Transition
 * aus. `html[data-transition]` nennt die Art, solange sie läuft; die
 * Animation dazu steht in `src/index.css`.
 */
export function uebergang(art: "panel", aenderung: () => void): void {
  if (
    typeof document.startViewTransition !== "function" ||
    document.visibilityState !== "visible" ||
    wenigBewegung()
  ) {
    aenderung();
    return;
  }
  const html = document.documentElement;
  const meins = ++laufend;
  html.dataset.transition = art;
  const gezeigt = document.startViewTransition(() => flushSync(aenderung));
  // Eine neuere Transition überspringt diese: nur die letzte räumt auf.
  void gezeigt.finished.finally(() => {
    if (laufend === meins) delete html.dataset.transition;
  });
}

/** Wie viele Animationen ein Rahmen schon begonnen hat. */
const schiebend = new WeakMap<HTMLElement, number>();

/**
 * Schiebt ein Element von einer Seite herein (1: von rechts, -1: von links,
 * 0: es blendet nur ein). Nur der neue Zustand bewegt sich. `rahmen` (der
 * scrollende Elternteil) schneidet währenddessen seitlich ab, damit kein
 * waagrechter Scrollbalken aufblitzt.
 */
export function hereinschieben(
  element: Element,
  richtung: -1 | 0 | 1,
  rahmen?: HTMLElement | null,
): void {
  if (wenigBewegung() || typeof element.animate !== "function") return;
  const nummer = rahmen ? (schiebend.get(rahmen) ?? 0) + 1 : 0;
  if (rahmen) {
    schiebend.set(rahmen, nummer);
    rahmen.style.overflowX = "hidden";
  }
  const animation = element.animate(
    [
      { opacity: 0, transform: `translateX(${richtung * 32}px)` },
      { opacity: 1, transform: "none" },
    ],
    { duration: 280, easing: KURVE, fill: "backwards" },
  );
  // Nur die letzte Animation im Rahmen gibt ihn wieder frei.
  if (rahmen)
    void animation.finished
      .catch(() => {})
      .finally(() => {
        if (schiebend.get(rahmen) === nummer) rahmen.style.overflowX = "";
      });
}
