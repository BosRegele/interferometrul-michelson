// Coerenta: cat de departe pot fi decalate bratele inainte ca franjele sa dispara.
/** Lungimea de coerenta Lc = lambda^2 / dLambda. */
export function coherenceLength(lambda, dLambda) {
  return lambda * lambda / dLambda;
}

/** Vizibilitatea franjelor la o diferenta de drum delta. */
export function visibility(delta, coherenceLen) {
  const r = delta / coherenceLen;
  return Math.exp(-r * r);
}

// Surse reale, ancorate pe valoarea cursorului 0..100 (0 = lumina alba).
const ANCHORS = [[0, 300], [15, 50], [40, 5], [70, 0.6], [100, 0.002]];

/** Latimea de banda in nm pentru pozitia cursorului. */
export function bandwidthFromSlider(v) {
  for (let i = 1; i < ANCHORS.length; i++) {
    if (v <= ANCHORS[i][0]) {
      const [x0, y0] = ANCHORS[i - 1];
      const [x1, y1] = ANCHORS[i];
      const f = (v - x0) / (x1 - x0);
      return Math.exp(Math.log(y0) + f * (Math.log(y1) - Math.log(y0)));
    }
  }
  return ANCHORS[ANCHORS.length - 1][1];
}

export function sourceName(dLambda) {
  if (dLambda >= 150) return "lumină albă";
  if (dLambda >= 20) return "filtru colorat";
  if (dLambda >= 2) return "filtru îngust";
  if (dLambda >= 0.1) return "lampă cu sodiu";
  return "laser He-Ne";
}
