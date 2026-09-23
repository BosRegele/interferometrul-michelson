// Faza: legatura dintre diferenta de drum si unghiul de faza.
export const TAU = Math.PI * 2;

/** Diferenta de faza produsa de o diferenta de drum optic. delta si lambda in aceleasi unitati. */
export function phaseFromPathDiff(delta, lambda) {
  return TAU * delta / lambda;
}

/** Inversa: ce diferenta de drum produce o faza data. */
export function pathDiffFromPhase(phi, lambda) {
  return phi * lambda / TAU;
}

/** Aduce faza in intervalul [0, 2pi). */
export function wrapPhase(phi) {
  const p = phi % TAU;
  return p < 0 ? p + TAU : p;
}

export function toDegrees(phi) {
  return phi * 180 / Math.PI;
}
