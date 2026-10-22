import { useEffect } from "react";

// Folgt dem Farbschema des Geräts über shadcns `.dark` auf <html>, auch bei
// Änderungen. Wie zeiteisen: kein Umschalter (ohmtools-Design).
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => document.documentElement.classList.toggle("dark", query.matches);

    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  return children;
}
