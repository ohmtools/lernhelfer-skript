// Zahlen wie in deutschen Skripten: Dezimalkomma, drei gültige Ziffern,
// bei Einheiten ein SI-Vorsatz (4700 Ω → „4,7 kΩ“), sonst bei sehr kleinen
// und sehr großen Beträgen eine Zehnerpotenz (0,000000016 → „1,6·10⁻⁸“).

const VORSAETZE: [number, string][] = [
  [1e12, "T"],
  [1e9, "G"],
  [1e6, "M"],
  [1e3, "k"],
  [1, ""],
  [1e-3, "m"],
  [1e-6, "µ"],
  [1e-9, "n"],
  [1e-12, "p"],
  [1e-15, "f"],
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
  "eV",
  "g",
  "Wh",
  "Ah",
  "Ws",
  "bit",
  "mol",
  "lm",
  "lx",
]);

const HOCH: Record<string, string> = {
  "-": "⁻",
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
};

/** Zehnerpotenz in Hochzahlen, z.B. -8 → „10⁻⁸“. */
export function potenz(exponent: number) {
  return `10${[...String(exponent)].map((z) => HOCH[z] ?? z).join("")}`;
}

function dezimal(wert: number, stellen: number) {
  // Ohne Tausenderpunkt: „1150 Windungen“, nicht „1.150“.
  return new Intl.NumberFormat("de-DE", {
    maximumSignificantDigits: stellen,
    useGrouping: false,
  }).format(wert);
}

export function zahl(wert: number, stellen = 3) {
  if (!Number.isFinite(wert)) return "–";
  const betrag = Math.abs(Number(wert.toPrecision(stellen)));
  // Sonst liefe „0,000000016“ oder „16000000000“ über den Rand.
  if (betrag !== 0 && (betrag < 1e-3 || betrag >= 1e6)) {
    const exponent = Math.floor(Math.log10(betrag));
    const mantisse = Number((wert / 10 ** exponent).toPrecision(stellen));
    // Rundung kann 9,996 zu 10 machen.
    if (Math.abs(mantisse) >= 10)
      return `${dezimal(mantisse / 10, stellen)}·${potenz(exponent + 1)}`;
    return mantisse === 1 ? potenz(exponent) : `${dezimal(mantisse, stellen)}·${potenz(exponent)}`;
  }
  return dezimal(wert, stellen);
}

export function groesse(wert: number, einheit?: string, stellen = 3) {
  if (!Number.isFinite(wert)) return "–";
  if (!einheit) return zahl(wert, stellen);
  if (!SI.has(einheit) || wert === 0) return `${zahl(wert, stellen)} ${einheit}`;
  const betrag = Math.abs(wert);
  const passend = betrag < 1e15 ? VORSAETZE.find(([f]) => betrag >= f * 0.9995) : undefined;
  // Außerhalb der Vorsätze bleibt die Einheit, die Zahl bekommt eine Zehnerpotenz.
  if (!passend) return `${zahl(wert, stellen)} ${einheit}`;
  const [faktor, vorsatz] = passend;
  return `${zahl(wert / faktor, stellen)} ${vorsatz}${einheit}`;
}

/** Liest „4,7“ und „4.7“. */
export function leseZahl(text: string) {
  const sauber = text.trim().replace(/\s/g, "").replace(",", ".");
  if (!sauber) return NaN;
  return Number(sauber);
}
