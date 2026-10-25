import { useEffect } from "react";

// Folgt dem Farbschema des Geräts über shadcns `.dark` auf <html>, auch bei
// Änderungen. Wie zeiteisen: kein Umschalter (ohmtools-Design). Gedruckt
// wird immer hell (DESIGN.md, „Light and dark“): `beforeprint` nimmt `.dark`
// weg, `afterprint` setzt es wieder.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    let drucken = false;
    const apply = () =>
      document.documentElement.classList.toggle("dark", query.matches && !drucken);
    const vorDemDruck = () => {
      drucken = true;
      apply();
    };
    const nachDemDruck = () => {
      drucken = false;
      apply();
    };

    apply();
    query.addEventListener("change", apply);
    window.addEventListener("beforeprint", vorDemDruck);
    window.addEventListener("afterprint", nachDemDruck);
    return () => {
      query.removeEventListener("change", apply);
      window.removeEventListener("beforeprint", vorDemDruck);
      window.removeEventListener("afterprint", nachDemDruck);
    };
  }, []);

  return children;
}
