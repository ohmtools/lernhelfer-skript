// Zahlen wie in deutschen Skripten: Dezimalkomma, drei gültige Ziffern,
// bei Einheiten ein SI-Vorsatz (4700 Ω → „4,7 kΩ“).

const VORSAETZE: [number, string][] = [
  [1e9, "G"],
  [1e6, "M"],
  [1e3, "k"],
  [1, ""],
  [1e-3, "m"],
  [1e-6, "µ"],
  [1e-9, "n"],
  [1e-12, "p"],
];

// Einheiten, vor die ein Vorsatz passt. Bei anderen (°, %, dB …) bleibt die Zahl.
const SI = new Set([
  "Ω",
  "V",
  "A",
  "F",
  "H",
  "Hz",
  "s",
  "W",
  "J",
  "C",
  "S",
  "T",
  "Wb",
  "m",
  "N",
  "Pa",
  "VA",
  "var",
]);

export function zahl(wert: number, stellen = 3) {
  if (!Number.isFinite(wert)) return "–";
  return new Intl.NumberFormat("de-DE", { maximumSignificantDigits: stellen }).format(wert);
}

export function groesse(wert: number, einheit?: string, stellen = 3) {
  if (!Number.isFinite(wert)) return "–";
  if (!einheit) return zahl(wert, stellen);
  if (!SI.has(einheit) || wert === 0) return `${zahl(wert, stellen)} ${einheit}`;
  const betrag = Math.abs(wert);
  const [faktor, vorsatz] = VORSAETZE.find(([f]) => betrag >= f * 0.9995) ?? VORSAETZE.at(-1)!;
  return `${zahl(wert / faktor, stellen)} ${vorsatz}${einheit}`;
}

/** Liest „4,7“ und „4.7“. */
export function leseZahl(text: string) {
  const sauber = text.trim().replace(/\s/g, "").replace(",", ".");
  if (!sauber) return NaN;
  return Number(sauber);
}
