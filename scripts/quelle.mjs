// Packt den Quellcode der Webseite als ZIP, ohne node_modules, dist und .git.
// Damit lässt sich das Skript in einem neuen Chat weiterbauen.
//
//   npm run quelle -- [ziel.zip]
import fs from "node:fs";
import path from "node:path";
import { zipSync } from "fflate";

const WURZEL = path.resolve(import.meta.dirname, "..");
const WEG = new Set(["node_modules", "dist", ".git"]);

function sammeln(ordner, dateien = {}) {
  for (const eintrag of fs.readdirSync(ordner, { withFileTypes: true })) {
    const voll = path.join(ordner, eintrag.name);
    const relativ = path.relative(WURZEL, voll).split(path.sep).join("/");
    if (WEG.has(eintrag.name) || eintrag.name.endsWith(".zip")) continue;
    if (eintrag.isDirectory()) sammeln(voll, dateien);
    else if (eintrag.isFile()) dateien[`lernhelfer-skript/${relativ}`] = fs.readFileSync(voll);
  }
  return dateien;
}

const ziel = path.resolve(process.argv[2] ?? "skript-quelle.zip");
const dateien = sammeln(WURZEL);
fs.writeFileSync(ziel, zipSync(dateien, { level: 9 }));
console.log(
  `${path.relative(process.cwd(), ziel)}: ${Object.keys(dateien).length} Dateien, ${Math.round(fs.statSync(ziel).size / 1024)} KB`,
);
