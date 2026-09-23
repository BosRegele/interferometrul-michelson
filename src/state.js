// Sursa unica de adevar. Toate vizualizarile citesc de aici; nimeni nu tine copii locale.
import { phaseFromPathDiff } from "./physics/phase.js";
import { pathDiffFromMirror, fringesFromDisplacement } from "./physics/opticalPath.js";
import { normalizedIntensity } from "./physics/interference.js";
import { coherenceLength, bandwidthFromSlider, sourceName } from "./physics/coherence.js";
import { predictedFringeShift } from "./physics/etherModel.js";

export const SODIUM = 589.3;              // nm

const base = {
  lambda: SODIUM,                          // nm
  mirrorDisplacement: 0,                   // nm, fata de pozitia de zero
  armDifference: 4000,                     // nm, pentru campul de franje
  tilt: 0,                                 // urad
  bandwidthSlider: 100,                    // 0..100
  whiteLight: false,
  refractiveIndex: 1 + 2.93e-4,
  gasLength: 0.10,                         // m
  gasFraction: 1,                          // 1 = tub plin, 0 = vidat
  rotationAngle: 0,                        // rad
  etherSpeed: 3e4,                         // m/s, ipotetic
  armLength: 11,                           // m
  fringeZero: 0                            // referinta contorului
};

export const state = { ...base };
const listeners = new Set();

function derive() {
  state.pathDifference = pathDiffFromMirror(state.mirrorDisplacement);        // nm
  state.phaseDifference = phaseFromPathDiff(state.pathDifference, state.lambda);
  state.intensity = normalizedIntensity(state.phaseDifference);              // 0..1
  state.fringesPassed = fringesFromDisplacement(
    state.mirrorDisplacement - state.fringeZero, state.lambda);
  state.bandwidth = bandwidthFromSlider(state.bandwidthSlider);              // nm
  state.coherenceLength = coherenceLength(state.lambda, state.bandwidth);    // nm
  state.sourceName = sourceName(state.bandwidth);
  state.predictedShift = predictedFringeShift(
    state.armLength, state.etherSpeed, state.lambda * 1e-9);
}

export function set(patch) {
  let changed = false;
  for (const k in patch) {
    if (state[k] !== patch[k]) { state[k] = patch[k]; changed = true; }
  }
  if (!changed) return state;
  derive();
  for (const fn of listeners) fn(state);
  return state;
}

export function subscribe(fn) {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
}

export function reset() {
  Object.assign(state, base);
  derive();
  for (const fn of listeners) fn(state);
}

derive();
