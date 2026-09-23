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

/** Cele doua jumatati ale drumului paralel, in unitati de L/c, cu v ca fractiune din c.
    Dusul merge in sensul curentului (rapid), intoarcerea contra lui (lent). */
export function parallelLegs(v) {
  return { withCurrent: 1 / (1 + v), againstCurrent: 1 / (1 - v) };
}

/** Deplasarea de franje prezisa la rotirea aparatului cu 90 de grade. */
export function predictedFringeShift(L, v, lambda, c = C) {
  return 2 * L * v * v / (lambda * c * c);
}

/** Oscilatia prezisa in jurul pozitiei medii, cum o deseneaza si lucrarea din 1887.
    Amplitudinea e JUMATATE din predictie: de la 0° la 90° franjele trec de la +Δn/2 la −Δn/2,
    deci se muta in total cu Δn, cat da formula 2Lv²/(λc²). */
export function predictedSwing(totalShift, theta) {
  return (totalShift / 2) * Math.cos(2 * theta);
}

/** Cat s-ar fi mutat franjele fata de pozitia de start, dupa o rotire cu theta. */
export function shiftSinceStart(totalShift, theta) {
  return (totalShift / 2) * (1 - Math.cos(2 * theta));
}

/** Limita superioara masurata efectiv in 1887, in franje. */
export const OBSERVED_1887_UPPER_BOUND = 0.01;
