import { DURATION_IN, EASE, reducedMotion } from "@/lib/ohmtools/motion";

// Bewegung wie in den Apps (DESIGN.md „Motion“): View Transitions,
// `reducedMotion()`, Kurve und Dauer kommen aus `@/lib/ohmtools/motion`
// (Kopie aus ohmtools/design), `erscheinen` aus `src/index.css`. Hier steht
// nur, was das Skript darüber hinaus braucht: Hereinschieben, das den
// scrollenden Rahmen solange seitlich abschneidet (`slideIn` des Designs tut
// das nicht).

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
  if (reducedMotion() || typeof element.animate !== "function") return;
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
    { duration: DURATION_IN, easing: EASE, fill: "backwards" },
  );
  // Nur die letzte Animation im Rahmen gibt ihn wieder frei.
  if (rahmen)
    void animation.finished
      .catch(() => {})
      .finally(() => {
        if (schiebend.get(rahmen) === nummer) rahmen.style.overflowX = "";
      });
}
