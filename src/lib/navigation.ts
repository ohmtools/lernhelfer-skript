import { useCallback, useEffect, useState } from "react";
import { KAPITEL } from "@/lib/kapitel";

export type Ort = { kapitel: string; abschnitt?: string };

// Die Adresse hält den Ort als `#/kapitel/abschnitt`, damit Neuladen und
// Zurück funktionieren. In einem Artefakt kann `location` gesperrt sein:
// dann bleibt der Ort nur im Speicher.
function ausAdresse(): Ort | null {
  try {
    const [kapitel, abschnitt] = decodeURIComponent(location.hash.replace(/^#\/?/, "")).split("/");
    if (KAPITEL.some((k) => k.schluessel === kapitel))
      return { kapitel, abschnitt: abschnitt || undefined };
  } catch {
    // gesperrt oder kaputt: Anfang
  }
  return null;
}

function inAdresse(ort: Ort) {
  try {
    const hash = `#/${ort.kapitel}${ort.abschnitt ? `/${ort.abschnitt}` : ""}`;
    if (location.hash !== hash) history.replaceState(null, "", hash);
  } catch {
    // gesperrt: nur im Speicher
  }
}

export function useNavigation() {
  const [ort, setOrt] = useState<Ort>(
    () => ausAdresse() ?? { kapitel: KAPITEL[0]?.schluessel ?? "" },
  );

  useEffect(() => {
    const folgen = () => {
      const neu = ausAdresse();
      if (neu) setOrt(neu);
    };
    window.addEventListener("hashchange", folgen);
    return () => window.removeEventListener("hashchange", folgen);
  }, []);

  const gehe = useCallback((neu: Ort) => {
    setOrt(neu);
    inAdresse(neu);
  }, []);

  return { ort, gehe };
}
