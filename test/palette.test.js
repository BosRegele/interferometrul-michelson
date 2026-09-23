import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { COL } from "../src/sims/palette.js";

// Canvas ignora in tacere o culoare undefined si pastreaza stilul anterior,
// deci o cheie gresita nu da eroare: desenul iese doar invizibil.
function sources(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? sources(path.join(dir, e.name))
      : e.name.endsWith(".js") ? [path.join(dir, e.name)] : []);
}

test("fiecare culoare folosita din paleta este definita", () => {
  for (const file of sources("src")) {
    const used = new Set([...fs.readFileSync(file, "utf8").matchAll(/\bCOL\.([A-Za-z0-9_]+)/g)].map(m => m[1]));
    for (const key of used) {
      assert.ok(key in COL, `${file} foloseste COL.${key}, care nu exista`);
    }
  }
});

test("toate culorile paletei sunt valori CSS valide", () => {
  for (const [k, v] of Object.entries(COL)) {
    assert.match(v, /^#[0-9a-f]{6}$/i, `COL.${k} = ${v}`);
  }
});
