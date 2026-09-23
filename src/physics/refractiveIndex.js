// Drum optic prin materie: OPL = n * L.
/** Drumul optic printr-un mediu de indice n si lungime geometrica L. */
export function opticalPathLength(n, L) {
  return n * L;
}

/** Ce adauga la diferenta de drum un tub de gaz strabatut dus-intors. */
export function pathDiffFromGas(n, L) {
  return 2 * (n - 1) * L;
}

/** Cate franje defileaza la vidarea tubului. */
export function fringesFromGas(n, L, lambda) {
  return pathDiffFromGas(n, L) / lambda;
}

/** Indicele de refractie dedus din numarul de franje numarate. */
export function indexFromFringes(N, L, lambda) {
  return 1 + N * lambda / (2 * L);
}

export const GASES = {
  he:  { n1: 3.5e-5,  label: "heliu" },
  air: { n1: 2.93e-4, label: "aer" },
  co2: { n1: 4.50e-4, label: "CO₂" }
};
