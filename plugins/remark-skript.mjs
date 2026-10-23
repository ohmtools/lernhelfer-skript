// Macht aus den Markierungen der Ergänzungen (`:::anmerkung` …) Komponenten
// und prüft dabei, was ein Kapitel enthalten darf. Läuft für die Webseite
// (MDX), für die Prüfung des Wortlauts und für die Umwandlung des Entwurfs.
import GithubSlugger from "github-slugger";
import { toString } from "mdast-util-to-string";
import { visit, SKIP } from "unist-util-visit";
import { valueToEstree } from "estree-util-value-to-estree";
import { BLOECKE, CONTAINER, ERGAENZUNGEN, FRAGENGRUPPE, MARKEN } from "./ergaenzungen.mjs";

const DIREKTIVEN = new Set(["containerDirective", "leafDirective", "textDirective"]);
const JSX = new Set([
  "mdxJsxFlowElement",
  "mdxJsxTextElement",
  "mdxFlowExpression",
  "mdxTextExpression",
]);
const VERBOTEN_IN_FORMELN = /\\(color|textcolor|colorbox|fcolorbox|href|url)\b/;

const element = (hName, children = [], hProperties = {}) => ({
  type: "skriptTeil",
  data: { hName, hProperties },
  children,
});

/** Quelltext eines Knotens, z.B. `:30` aus „10:30“. */
function quelltext(file, node) {
  const { start, end } = node.position ?? {};
  if (start?.offset == null || end?.offset == null) return toString(node);
  return String(file.value).slice(start.offset, end.offset);
}

function ort(node) {
  const p = node.position?.start;
  return p ? `Zeile ${p.line}` : "unbekannte Zeile";
}

/** Trennt das Label (`[…]`) vom Inhalt eines Container-Direktivs. */
function labelUndInhalt(node) {
  const [erstes, ...rest] = node.children;
  if (erstes?.data?.directiveLabel) return { label: erstes, inhalt: rest };
  return { label: undefined, inhalt: node.children };
}

/**
 * Optionen einer Auswahlfrage aus einer Aufgabenliste (`- [x] richtig`).
 * Absätze unter einer Option (nach einer Leerzeile eingerückt) sind ihre
 * eigene Erklärung, was nach der Liste steht, die Erklärung für alle.
 */
function auswahl(file, node, inhalt) {
  const index = inhalt.findIndex(
    (k) => k.type === "list" && k.children.some((i) => typeof i.checked === "boolean"),
  );
  if (index === -1) file.fail(`:::auswahl ohne Liste mit [ ] und [x] (${ort(node)}).`, node);
  const liste = inhalt[index];
  const optionen = liste.children.map((item) => {
    if (typeof item.checked !== "boolean")
      file.fail(`Jede Option in :::auswahl braucht [ ] oder [x] (${ort(item)}).`, item);
    const [erstes, ...rest] = item.children;
    const text = erstes?.type === "paragraph" ? erstes.children : item.children;
    const erklaerung = erstes?.type === "paragraph" && rest.length ? rest : [];
    return element(
      "Option",
      [...text, ...(erklaerung.length ? [element("Optionserklaerung", erklaerung)] : [])],
      { richtig: item.checked },
    );
  });
  if (!liste.children.some((i) => i.checked))
    file.fail(`:::auswahl braucht mindestens eine richtige Option [x] (${ort(node)}).`, node);
  const rest = [...inhalt.slice(0, index), ...inhalt.slice(index + 1)];
  return [element("Optionen", optionen), ...(rest.length ? [element("Antwort", rest)] : [])];
}

/**
 * Teilbilder einer `:::abbildung`: Absätze nur aus Bildern, jedes mit seiner
 * Teilunterschrift als Alternativtext. Die gemeinsame Bildunterschrift (das
 * Label) kommt danach, wie im PDF unter den Teilbildern.
 */
function abbildung(file, node) {
  if (node.type !== BLOECKE.abbildung.art)
    file.fail(
      `„abbildung“ wird als :::abbildung[Bildunterschrift] geschrieben (${ort(node)}).`,
      node,
    );
  const { label, inhalt } = labelUndInhalt(node);
  const bilder = [];
  for (const kind of inhalt) {
    const teile =
      kind.type === "paragraph"
        ? kind.children.filter((k) => k.type !== "break" && !(k.type === "text" && !k.value.trim()))
        : [kind];
    if (!teile.length || teile.some((k) => k.type !== "image"))
      file.fail(
        `In :::abbildung stehen nur Bilder, jedes mit seiner Teilunterschrift (${ort(kind)}).`,
        kind,
      );
    bilder.push(...teile);
  }
  if (bilder.length < 2)
    file.fail(
      `:::abbildung braucht mindestens zwei Teilbilder (${ort(node)}). Ein einzelnes Bild steht allein in seinem Absatz.`,
      node,
    );
  node.children = [
    ...bilder.map((bild) => {
      const invertieren = bild.title === "invertieren";
      bild.title = null;
      return element("Teilbild", [bild], { beschriftung: bild.alt ?? "", invertieren });
    }),
    ...(label ? [element("Bildunterschrift", label.children)] : []),
  ];
  node.data = { hName: BLOECKE.abbildung.komponente, hProperties: {} };
}

function ergaenzung(file, node, name, def) {
  if (node.type !== def.art) {
    const form = { containerDirective: ":::", leafDirective: "::", textDirective: ":" }[def.art];
    file.fail(`„${name}“ wird als ${form}${name} geschrieben (${ort(node)}).`, node);
  }
  const attribute = node.attributes ?? {};
  for (const key of Object.keys(attribute)) {
    if (!(def.attribute ?? []).includes(key))
      file.fail(`Unbekannte Angabe {${key}=…} bei :::${name} (${ort(node)}).`, node);
  }
  for (const key of def.attribute ?? []) {
    if (name === "rechnen" && key !== "einheit" && attribute[key] == null)
      file.fail(`:::rechnen braucht {${key}=…} (${ort(node)}).`, node);
  }

  if (node.type === "textDirective") {
    node.data = { hName: def.komponente, hProperties: {} };
    return;
  }
  const { label, inhalt } = labelUndInhalt(node);
  const props = { ...attribute };
  let kinder = inhalt;
  if (def.label === "titel" && label) props.titel = toString(label);
  if (def.label === "frage") {
    if (!label)
      file.fail(
        `:::${name} braucht die Frage in eckigen Klammern: :::${name}[Frage] (${ort(node)}).`,
        node,
      );
    const antwort =
      name === "auswahl"
        ? auswahl(file, node, inhalt)
        : inhalt.length
          ? [element("Antwort", inhalt)]
          : [];
    if (name !== "auswahl" && !inhalt.length)
      file.fail(`:::${name} braucht eine Lösung unter der Frage (${ort(node)}).`, node);
    kinder = [element("Fragetext", label.children), ...antwort];
  }
  node.children = kinder;
  node.data = { hName: def.komponente, hProperties: props };
}

/** Fasst aufeinanderfolgende Fragen zu einem Block zusammen. */
function fragenGruppieren(parent) {
  if (!parent.children || parent.data?.hName === FRAGENGRUPPE) return;
  const neu = [];
  for (const kind of parent.children) {
    const istFrage = kind.type === "containerDirective" && ERGAENZUNGEN[kind.name]?.gruppe;
    const letzte = neu.at(-1);
    if (istFrage && letzte?.data?.hName === FRAGENGRUPPE) letzte.children.push(kind);
    else if (istFrage) neu.push(element(FRAGENGRUPPE, [kind]));
    else neu.push(kind);
  }
  parent.children = neu;
}

/**
 * @param {{ mdx?: boolean }} [optionen] `mdx: true` hängt die Exporte für die
 *   Webseite an (Titel, Gliederung, Seiten, Suchtext).
 */
export default function remarkSkript(optionen = {}) {
  return (tree, file) => {
    // 1. Unbekannte Text- und Blockdirektiven sind Original: „10:30“ oder
    //    „Port:A“ dürfen nicht verschwinden.
    visit(tree, (node, index, parent) => {
      if (!DIREKTIVEN.has(node.type) || !parent) return;
      const name = node.name;
      if (ERGAENZUNGEN[name] || MARKEN[name] || BLOECKE[name]) return;
      if (node.type === "containerDirective") {
        const erlaubt = [
          ...Object.keys(ERGAENZUNGEN),
          ...Object.keys(BLOECKE),
          ...Object.keys(MARKEN),
        ].join(", ");
        file.fail(`Unbekannte Markierung „:::${name}“ (${ort(node)}). Erlaubt: ${erlaubt}.`, node);
      }
      const text = { type: "text", value: quelltext(file, node) };
      parent.children[index] =
        node.type === "leafDirective" ? { type: "paragraph", children: [text] } : text;
      return SKIP;
    });

    // 2. Prüfungen, die vom Ort im Baum abhängen.
    const pruefen = (node, inErgaenzung, inContainer) => {
      if (node.type === "heading" && inErgaenzung)
        file.fail(`Keine Überschriften in Ergänzungen (${ort(node)}).`, node);
      if (
        (node.type === "math" || node.type === "inlineMath") &&
        VERBOTEN_IN_FORMELN.test(node.value)
      ) {
        file.fail(
          `Formeln ohne \\color, \\textcolor, \\href (${ort(node)}): Farben kommen nur aus dem Design.`,
          node,
        );
      }
      if (JSX.has(node.type) && !inContainer) {
        file.fail(
          `JSX und {…} nur in :::grafik oder :::interaktiv (${ort(node)}). Steht „{“ oder „<“ im Text, schreib \\{ bzw. \\<.`,
          node,
        );
      }
      const istErgaenzung = DIREKTIVEN.has(node.type) && ERGAENZUNGEN[node.name];
      const istContainer = istErgaenzung && CONTAINER.includes(node.name);
      for (const kind of node.children ?? [])
        pruefen(kind, inErgaenzung || !!istErgaenzung, inContainer || !!istContainer);
    };
    pruefen(tree, false, false);

    // 3. Gliederung und Suchtext, bevor Direktiven umgebaut werden.
    const slugger = new GithubSlugger();
    let titel = "";
    const gliederung = [];
    const suchtext = [];
    const seiten = [];
    let abschnitt = { id: "", titel: "", text: [] };
    suchtext.push(abschnitt);
    for (const node of tree.children) {
      if (node.type === "heading") {
        const text = toString(node);
        const id = slugger.slug(text);
        node.data = { ...node.data, hProperties: { ...node.data?.hProperties, id } };
        if (node.depth === 1) {
          if (titel) file.fail(`Nur eine Überschrift # pro Kapitel (${ort(node)}).`, node);
          titel = text;
        } else {
          gliederung.push({ tiefe: node.depth, titel: text, id });
          abschnitt = { id, titel: text, text: [] };
          suchtext.push(abschnitt);
        }
        continue;
      }
      if (node.type === "mdxjsEsm") continue;
      // Wörter einzeln sammeln, damit Blöcke nicht zusammenkleben („KondensatorDer“).
      visit(node, (k) => {
        if (k.type === "text" || k.type === "inlineCode") abschnitt.text.push(k.value);
        else if (k.type === "image" && k.alt) abschnitt.text.push(k.alt);
      });
    }
    visit(tree, "leafDirective", (node) => {
      if (node.name !== "seite") return;
      const nr = toString(node).trim();
      if (!/^\d+$/.test(nr))
        file.fail(`::seite braucht eine Seitenzahl: ::seite[12] (${ort(node)}).`, node);
      const zahl = Number(nr);
      if (seiten.length && zahl < seiten.at(-1))
        file.fail(
          `::seite[${zahl}] nach ::seite[${seiten.at(-1)}]: Seiten aufsteigend (${ort(node)}).`,
          node,
        );
      seiten.push(zahl);
    });

    // 4. Direktiven zu Komponenten.
    visit(tree, (node) => {
      if (!DIREKTIVEN.has(node.type)) return;
      if (MARKEN[node.name]) {
        if (node.type !== MARKEN[node.name].art)
          file.fail(`Seiten werden als ::seite[12] markiert (${ort(node)}).`, node);
        node.data = {
          hName: MARKEN[node.name].komponente,
          hProperties: { nr: Number(toString(node).trim()) },
        };
        node.children = [];
        return;
      }
      if (BLOECKE[node.name]) return abbildung(file, node);
      ergaenzung(file, node, node.name, ERGAENZUNGEN[node.name]);
    });
    visit(tree, (node) => fragenGruppieren(node));

    // 5. Ein Absatz, der nur aus einem Bild besteht, wird eine Abbildung;
    //    der Alternativtext ist die Unterschrift des Originals.
    visit(tree, "paragraph", (node, index, parent) => {
      const kinder = node.children.filter((k) => !(k.type === "text" && !k.value.trim()));
      if (kinder.length !== 1 || kinder[0].type !== "image" || !parent) return;
      const bild = kinder[0];
      const invertieren = bild.title === "invertieren";
      bild.title = null;
      parent.children[index] = element("Abbildung", [bild], {
        beschriftung: bild.alt ?? "",
        invertieren,
      });
    });

    if (!optionen.mdx) return;
    if (!titel) file.fail("Ein Kapitel beginnt mit genau einer Überschrift #.");
    const exporte = {
      titel,
      gliederung,
      seiten: seiten.length ? [seiten[0], seiten.at(-1)] : null,
      suchtext: suchtext
        .map((a) => ({
          id: a.id,
          titel: a.titel,
          text: a.text.join(" ").replace(/\s+/g, " ").trim(),
        }))
        .filter((a) => a.text || a.titel),
    };
    for (const [name, wert] of Object.entries(exporte)) {
      tree.children.push({
        type: "mdxjsEsm",
        value: "",
        data: {
          estree: {
            type: "Program",
            sourceType: "module",
            body: [
              {
                type: "ExportNamedDeclaration",
                specifiers: [],
                declaration: {
                  type: "VariableDeclaration",
                  kind: "const",
                  declarations: [
                    {
                      type: "VariableDeclarator",
                      id: { type: "Identifier", name },
                      init: valueToEstree(wert),
                    },
                  ],
                },
              },
            ],
          },
        },
      });
    }
  };
}
