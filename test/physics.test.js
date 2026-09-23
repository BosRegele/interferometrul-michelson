import { test } from "node:test";
import assert from "node:assert/strict";

import { phaseFromPathDiff, pathDiffFromPhase, wrapPhase, TAU } from "../src/physics/phase.js";
import { pathDiffFromMirror, pathDiffAtAngle, fringesFromDisplacement,
         displacementFromFringes, quarterWave } from "../src/physics/opticalPath.js";
import { normalizedIntensity, absoluteIntensity, resultantAmplitude,
         isMaximum, isMinimum, fringeIntensity } from "../src/physics/interference.js";
import { coherenceLength, visibility, bandwidthFromSlider } from "../src/physics/coherence.js";
import { pathDiffFromGas, fringesFromGas, indexFromFringes, GASES } from "../src/physics/refractiveIndex.js";
import { predictedFringeShift, shiftAtAngle, timeParallel, timePerpendicular,
         deltaTime, C } from "../src/physics/etherModel.js";

const NA = 589.3;                       // nm, linia D a sodiului
const close = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;

test("drumul optic este dublul deplasarii oglinzii", () => {
  assert.equal(pathDiffFromMirror(100), 200);
  assert.equal(pathDiffFromMirror(147.325), 294.65);
});

test("o deplasare de lambda/4 da o diferenta de drum de lambda/2", () => {
  const dx = quarterWave(NA);
  assert.ok(close(pathDiffFromMirror(dx), NA / 2, 1e-12));
});

test("lambda/2 diferenta de drum inseamna faza pi, adica minim", () => {
  const phi = phaseFromPathDiff(NA / 2, NA);
  assert.ok(close(phi, Math.PI, 1e-12));
  assert.ok(isMinimum(phi, 1e-9));
  assert.ok(close(normalizedIntensity(phi), 0, 1e-12));
});

test("drum nul sau lambda intreg inseamna maxim", () => {
  for (const delta of [0, NA, 2 * NA, 5 * NA]) {
    const phi = phaseFromPathDiff(delta, NA);
    assert.ok(isMaximum(phi, 1e-9), `delta=${delta}`);
    assert.ok(close(normalizedIntensity(phi), 1, 1e-9));
  }
});

test("intensitatea absoluta la maxim este de patru ori cea a unui fascicul", () => {
  assert.ok(close(absoluteIntensity(0, 1), 4, 1e-12));
  assert.ok(close(absoluteIntensity(Math.PI, 1), 0, 1e-12));
  assert.ok(close(absoluteIntensity(Math.PI / 2, 1), 2, 1e-12));
});

test("amplitudinea rezultanta este 2E0*cos(phi/2)", () => {
  assert.ok(close(resultantAmplitude(0), 2, 1e-12));
  assert.ok(close(resultantAmplitude(Math.PI), 0, 1e-12));
});

test("faza si drumul optic sunt inverse una alteia", () => {
  const delta = 123.456;
  assert.ok(close(pathDiffFromPhase(phaseFromPathDiff(delta, NA), NA), delta, 1e-9));
});

test("wrapPhase aduce faza in [0, 2pi)", () => {
  assert.ok(close(wrapPhase(-Math.PI), Math.PI, 1e-12));
  assert.ok(close(wrapPhase(3 * TAU + 1), 1, 1e-9));
});

test("numaratoarea de franje: N = 2dx/lambda", () => {
  assert.ok(close(fringesFromDisplacement(1500, 600), 5, 1e-12));
  assert.ok(close(fringesFromDisplacement(displacementFromFringes(37, NA), NA), 37, 1e-9));
});

test("o franja inseamna exact lambda/2 de deplasare", () => {
  assert.ok(close(displacementFromFringes(1, NA), NA / 2, 1e-12));
});

test("sursa extinsa: drumul scade cu cos(theta)", () => {
  assert.ok(close(pathDiffAtAngle(1000, 0), 2000, 1e-12));
  assert.ok(pathDiffAtAngle(1000, 0.5) < 2000);
  assert.ok(close(pathDiffAtAngle(1000, Math.PI / 2), 0, 1e-9));
});

test("lungimea de coerenta si vizibilitatea", () => {
  assert.ok(close(coherenceLength(589.3, 0.6), 589.3 * 589.3 / 0.6, 1e-9));
  assert.ok(close(visibility(0, 1000), 1, 1e-12));
  assert.ok(visibility(2000, 1000) < 0.02);
  const lcWhite = coherenceLength(589.3, bandwidthFromSlider(0));
  assert.ok(lcWhite > 1000 && lcWhite < 1400, `Lc lumina alba = ${lcWhite} nm`);
});

test("latimea de banda scade monoton cu pozitia cursorului", () => {
  let prev = Infinity;
  for (let v = 0; v <= 100; v += 5) {
    const b = bandwidthFromSlider(v);
    assert.ok(b < prev, `v=${v}`);
    prev = b;
  }
  assert.ok(close(bandwidthFromSlider(70), 0.6, 1e-9));
});

test("gaz: 10 cm de aer dau aproximativ 99 de franje", () => {
  const N = fringesFromGas(1 + GASES.air.n1, 0.10, 589.3e-9);
  assert.ok(N > 99 && N < 100, `N = ${N}`);
});

test("gazul intra de doua ori in drumul optic", () => {
  assert.ok(close(pathDiffFromGas(1.5, 2), 2, 1e-12));
});

test("indicele dedus din franje este inversa lui fringesFromGas", () => {
  const n = 1 + GASES.co2.n1, L = 0.15, lam = 589.3e-9;
  const N = fringesFromGas(n, L, lam);
  assert.ok(close(indexFromFringes(N, L, lam), n, 1e-12));
});

test("modelul eterului: bratul paralel ar fi mai lent decat cel perpendicular", () => {
  const L = 11, v = 3e4;
  assert.ok(timeParallel(L, v) > timePerpendicular(L, v));
  assert.ok(deltaTime(L, v) > 0);
});

test("fara vant de eter nu exista nicio diferenta", () => {
  assert.ok(close(deltaTime(11, 0), 0, 1e-20));
  assert.equal(predictedFringeShift(11, 0, 589.3e-9), 0);
});

test("configuratia din 1887 prezicea aproximativ 0,37 franje", () => {
  const shift = predictedFringeShift(11, 3e4, 589.3e-9);
  assert.ok(shift > 0.35 && shift < 0.40, `shift = ${shift}`);
});

test("predictia se inverseaza la 90 de grade si revine la 180", () => {
  const s = 0.37;
  assert.ok(close(shiftAtAngle(s, 0), s, 1e-12));
  assert.ok(close(shiftAtAngle(s, Math.PI / 4), 0, 1e-15));
  assert.ok(close(shiftAtAngle(s, Math.PI / 2), -s, 1e-12));
  assert.ok(close(shiftAtAngle(s, Math.PI), s, 1e-12));
});

test("viteza luminii este cea din SI", () => {
  assert.equal(C, 299792458);
});

test("franjele isi pierd contrastul cand vizibilitatea scade", () => {
  const hi = fringeIntensity(0, NA, 1);
  const lo = fringeIntensity(0, NA, 0.1);
  assert.ok(close(hi, 1, 1e-12));
  assert.ok(lo < 0.6 && lo > 0.5);
});

import { parallelLegs } from "../src/physics/etherModel.js";

test("raul: dusul cu curentul e mai rapid decat intoarcerea contra lui", () => {
  for (const v of [0.1, 0.3, 0.5, 0.8]) {
    const { withCurrent, againstCurrent } = parallelLegs(v);
    assert.ok(withCurrent < 1 && againstCurrent > 1, `v=${v}`);
    assert.ok(withCurrent < againstCurrent, `v=${v}`);
    // suma trebuie sa fie exact timpul total al bratului paralel, 2/(1-v^2)
    assert.ok(close(withCurrent + againstCurrent, 2 / (1 - v * v), 1e-12));
  }
});

test("raul: fara curent, cele doua jumatati sunt egale", () => {
  const { withCurrent, againstCurrent } = parallelLegs(0);
  assert.equal(withCurrent, 1);
  assert.equal(againstCurrent, 1);
});
