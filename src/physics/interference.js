// Suprapunerea a doua unde de aceeasi amplitudine si frecventa.
import { TAU, phaseFromPathDiff } from "./phase.js";

/** Amplitudinea rezultanta, ca fractiune din amplitudinea unei unde: 2cos(phi/2). */
export function resultantAmplitude(phi) {
  return 2 * Math.cos(phi / 2);
}

/** Intensitatea normata la maxim: cos^2(phi/2), in [0,1]. */
export function normalizedIntensity(phi) {
  const c = Math.cos(phi / 2);
  return c * c;
}

/** Intensitatea absoluta: I = 4*I0*cos^2(phi/2). */
export function absoluteIntensity(phi, i0 = 1) {
  return 4 * i0 * normalizedIntensity(phi);
}

/** Intensitatea intr-un punct, din diferenta de drum, cu vizibilitate data. */
export function fringeIntensity(delta, lambda, visibility = 1) {
  const i = 0.5 + 0.5 * Math.cos(phaseFromPathDiff(delta, lambda));
  return 0.5 + (i - 0.5) * visibility;
}

/** true daca faza corespunde unui maxim (toleranta in radiani). */
export function isMaximum(phi, tol = 1e-6) {
  return Math.abs(Math.cos(phi / 2)) > 1 - tol;
}

export function isMinimum(phi, tol = 1e-6) {
  return Math.abs(Math.cos(phi / 2)) < tol;
}

export { TAU };
