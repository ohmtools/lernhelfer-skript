// Schneidet eine Abbildung aus einer PDF-Seite aus, mit Angaben relativ zur
// Seite (0 = links/oben, 1 = rechts/unten), z.B. die untere Hälfte:
//
//   npm run ausschnitt -- skript.pdf 12 0 0.5 1 1 bilder/s12-1.png
//
// Optionen: --dpi 150 (Standard), --grau (Graustufen, kleinere Datei).
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const option = (name, standard) => {
  const i = args.indexOf(name);
  if (i === -1) return standard;
  const [wert] = args.splice(i, 2).slice(1);
  return wert;
};
const grau = args.includes("--grau");
if (grau) args.splice(args.indexOf("--grau"), 1);
const dpi = Number(option("--dpi", "150"));
const [pdf, seite, links, oben, rechts, unten, ziel] = args;
if (!ziel) {
  console.error(
    "Aufruf: npm run ausschnitt -- <pdf> <seite> <links> <oben> <rechts> <unten> <ziel.png> [--dpi 150] [--grau]",
  );
  process.exit(2);
}
const info = execFileSync("pdfinfo", ["-f", seite, "-l", seite, pdf], { encoding: "utf8" });
const groesse =
  info.match(new RegExp(`Page\\s+${seite} size:\\s+([\\d.]+) x ([\\d.]+)`)) ??
  info.match(/Page size:\s+([\d.]+) x ([\d.]+)/);
if (!groesse) throw new Error("Seitengröße nicht gefunden (pdfinfo).");
const [bp, hp] = [Number(groesse[1]), Number(groesse[2])].map((pt) => (pt / 72) * dpi);
const [x1, y1, x2, y2] = [links, oben, rechts, unten].map(Number);
const box = [
  Math.round(x1 * bp),
  Math.round(y1 * hp),
  Math.round((x2 - x1) * bp),
  Math.round((y2 - y1) * hp),
];
fs.mkdirSync(path.dirname(path.resolve(ziel)), { recursive: true });
const ohneEndung = path.resolve(ziel).replace(/\.png$/, "");
execFileSync("pdftoppm", [
  "-f",
  seite,
  "-l",
  seite,
  "-r",
  String(dpi),
  "-x",
  String(box[0]),
  "-y",
  String(box[1]),
  "-W",
  String(box[2]),
  "-H",
  String(box[3]),
  ...(grau ? ["-gray"] : []),
  "-png",
  "-singlefile",
  pdf,
  ohneEndung,
]);
console.log(
  `${ziel}: ${box[2]} × ${box[3]} px, ${Math.round(fs.statSync(`${ohneEndung}.png`).size / 1024)} KB`,
);
