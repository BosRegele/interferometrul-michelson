// Impacheteaza modulele ES intr-un singur fisier, pastrand fiecare modul
// in propriul domeniu. Produce doua iesiri:
//   site/index.html            - document complet, se deschide cu dublu-click
//   dist/artifact-body.html    - doar continutul, pentru publicare ca artifact
import fs from "node:fs";
import path from "node:path";

const SRC = "src";
const ENTRY = "main.js";

const factories = new Map();

function resolve(fromRel, spec) {
  const dir = path.posix.dirname(fromRel.replace(/\\/g, "/"));
  return path.posix.normalize(path.posix.join(dir, spec)).replace(/^\.\//, "");
}

function transform(rel, code) {
  const exported = new Set();
  let out = code;

  // import { a, b } from "./x.js";  ->  const { a, b } = __req("x.js");
  out = out.replace(
    /^[ \t]*import\s*\{([^}]*)\}\s*from\s*["']([^"']+)["'];?[ \t]*$/gm,
    (_, names, spec) => `const {${names}} = __req(${JSON.stringify(resolve(rel, spec))});`
  );

  // export { A, B };
  out = out.replace(/^[ \t]*export\s*\{([^}]*)\};?[ \t]*$/gm, (_, names) => {
    names.split(",").map(s => s.trim()).filter(Boolean).forEach(n => exported.add(n));
    return "";
  });

  // export function / const / let / class
  out = out.replace(/^[ \t]*export\s+(async\s+)?(function|const|let|class)\s+([A-Za-z_$][\w$]*)/gm,
    (m, asy, kind, name) => {
      exported.add(name);
      return m.replace(/^([ \t]*)export\s+/, "$1");
    });

  if (/^\s*export\s/m.test(out)) {
    throw new Error(`Export netratat in ${rel}:\n` +
      out.split("\n").filter(l => /^\s*export\s/.test(l)).join("\n"));
  }

  const tail = [...exported].map(n => `  __e.${n} = ${n};`).join("\n");
  return `__mods[${JSON.stringify(rel)}] = function(__e, __req){\n${out}\n${tail}\n};`;
}

function load(rel) {
  if (factories.has(rel)) return;
  factories.set(rel, null);
  const code = fs.readFileSync(path.join(SRC, rel), "utf8");
  for (const m of code.matchAll(/^[ \t]*import\s*\{[^}]*\}\s*from\s*["']([^"']+)["']/gm)) {
    load(resolve(rel, m[1]));
  }
  factories.set(rel, transform(rel, code));
}

load(ENTRY);

const runtime = `(function(){
"use strict";
var __mods = {}, __cache = {};
function __req(id){
  if (__cache[id]) return __cache[id];
  var e = {}; __cache[id] = e;
  if (!__mods[id]) throw new Error("modul lipsa: " + id);
  __mods[id](e, __req);
  return e;
}
${[...factories.values()].join("\n")}
__req(${JSON.stringify(ENTRY)});
})();`;

const css = fs.readFileSync(path.join(SRC, "styles.css"), "utf8");
const body = fs.readFileSync(path.join(SRC, "page.html"), "utf8");

const TITLE = "Interferometrul lui Michelson";
const FONTS = '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?' +
  'family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400' +
  '&family=Archivo:wght@300;400;500&family=IBM+Plex+Mono:wght@400;500&display=swap">';

const artifact = `<title>${TITLE}</title>
${FONTS}
<style>
${css}</style>

${body}
<script>
${runtime}
</` + `script>
`;

const full = `<!doctype html>
<html lang="ro">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="Interferometrul lui Michelson - proiect interactiv de fizica pentru clasa a XII-a: de la doua unde la LIGO.">
<meta name="color-scheme" content="dark">
<title>${TITLE}</title>
${FONTS}
<style>
${css}</style>
</head>
<body>
${body}
<script>
${runtime}
</` + `script>
</body>
</html>
`;

fs.mkdirSync("dist", { recursive: true });
fs.mkdirSync("site", { recursive: true });
fs.writeFileSync("dist/artifact-body.html", artifact);
fs.writeFileSync("site/index.html", full);

const kb = n => (n / 1024).toFixed(1) + " KB";
console.log(`module impachetate : ${factories.size}`);
console.log(`javascript         : ${kb(runtime.length)}`);
console.log(`css                : ${kb(css.length)}`);
console.log(`site/index.html    : ${kb(full.length)}`);
console.log(`dist/artifact-body : ${kb(artifact.length)}`);
