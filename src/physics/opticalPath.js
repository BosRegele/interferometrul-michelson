// Drumul optic: factorul 2 traieste aici si nicaieri altundeva.
/** Oglinda se deplaseaza cu dx, dar lumina parcurge bratul dus si intors. */
export function pathDiffFromMirror(dx) {
  return 2 * dx;
}

/** Sursa extinsa: razele inclinate cu theta au un drum mai scurt. */
export function pathDiffAtAngle(armDiff, theta) {
  return 2 * armDiff * Math.cos(theta);
}

/** Oglinda inclinata cu alpha adauga un termen liniar in x (pozitia pe oglinda). */
export function pathDiffFromTilt(alpha, x) {
  return 2 * alpha * x;
}

/** Cate franje trec la o deplasare dx a oglinzii. */
export function fringesFromDisplacement(dx, lambda) {
  return 2 * dx / lambda;
}

/** Inversa: ce deplasare corespunde unui numar de franje numarate. */
export function displacementFromFringes(n, lambda) {
  return n * lambda / 2;
}

/** Deplasarea care schimba un maxim in minim. */
export function quarterWave(lambda) {
  return lambda / 4;
}
