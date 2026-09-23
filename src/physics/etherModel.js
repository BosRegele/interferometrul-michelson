// Modelul istoric al eterului. Descrie o PREDICTIE a fizicii clasice, nu realitatea.
export const C = 2.99792458e8;

/** Timp dus-intors pe bratul paralel cu curentul ipotetic. */
export function timeParallel(L, v, c = C) {
  return (2 * L / c) / (1 - (v * v) / (c * c));
}

/** Timp dus-intors pe bratul perpendicular. */
export function timePerpendicular(L, v, c = C) {
  return (2 * L / c) / Math.sqrt(1 - (v * v) / (c * c));
}

export function deltaTime(L, v, c = C) {
  return timeParallel(L, v, c) - timePerpendicular(L, v, c);
}

/** Deplasarea de franje prezisa la rotirea aparatului cu 90 de grade. */
export function predictedFringeShift(L, v, lambda, c = C) {
  return 2 * L * v * v / (lambda * c * c);
}

/** Cum ar varia deplasarea pe parcursul unei rotatii complete. */
export function shiftAtAngle(maxShift, theta) {
  return maxShift * Math.cos(2 * theta);
}

/** Limita superioara masurata efectiv in 1887, in franje. */
export const OBSERVED_1887_UPPER_BOUND = 0.01;
