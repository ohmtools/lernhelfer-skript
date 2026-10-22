import { createContext, useContext } from "react";

// Ob Ergänzungen sichtbar sind („Nur Original“ blendet sie aus). Nur im
// Speicher: Speicher des Browsers kann im Artefakt gesperrt sein.
export const AnsichtContext = createContext<{ mitErgaenzungen: boolean }>({
  mitErgaenzungen: true,
});

export const useAnsicht = () => useContext(AnsichtContext);
