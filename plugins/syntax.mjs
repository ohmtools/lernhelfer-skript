// Die remark-Plugins für die Syntax, gleich für Entwurf (.md) und Kapitel
// (.mdx): Webseite, Prüfung des Wortlauts und Umwandlung lesen damit
// denselben Baum.
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

export const syntax = [
  // Eine einzelne Tilde („~3 mA“) bleibt Text, nur ~~so~~ wird durchgestrichen.
  [remarkGfm, { singleTilde: false }],
  remarkMath,
  remarkDirective,
];
