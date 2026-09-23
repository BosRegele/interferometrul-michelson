// Culorile si conversia lungime de unda -> RGB, folosite de toate desenele.
export const COL = {
  void: "#07090d",
  panel: "#07090d",        // identic cu fundalul paginii
  line: "#1a232c",
  line2: "#27343e",
  fg: "#f0f3f5",
  fg2: "#96a3ad",
  fg3: "#5f6d79",
  beamA: "#7fd4ee",     // fasciculul A
  beamB: "#ffb04a",     // fasciculul B
  result: "#ffffff",    // rezultanta
  ok: "#57d6a2",
  warn: "#e0705c"
};

/** Aproximare CIE: lungime de unda in nm -> [r,g,b] in 0..1. */
export function wavelengthRGB(wl) {
  let r = 0, g = 0, b = 0;
  if (wl < 440) { r = -(wl - 440) / 60; b = 1; }
  else if (wl < 490) { g = (wl - 440) / 50; b = 1; }
  else if (wl < 510) { g = 1; b = -(wl - 510) / 20; }
  else if (wl < 580) { r = (wl - 510) / 70; g = 1; }
  else if (wl < 645) { r = 1; g = -(wl - 645) / 65; }
  else { r = 1; }
  let f = 1;
  if (wl > 700) f = 0.35 + 0.65 * (780 - wl) / 80;
  else if (wl < 420) f = 0.35 + 0.65 * (wl - 380) / 40;
  return [Math.pow(Math.max(r, 0) * f, 0.82),
          Math.pow(Math.max(g, 0) * f, 0.82),
          Math.pow(Math.max(b, 0) * f, 0.82)];
}

export function rgbCss(c, scale = 255) {
  return `rgb(${Math.min(255, c[0] * scale) | 0},${Math.min(255, c[1] * scale) | 0},${Math.min(255, c[2] * scale) | 0})`;
}

/** Spectrul vizibil esantionat, pentru modul lumina alba. */
export const SPECTRUM = (() => {
  const s = [], sum = [0, 0, 0];
  for (let l = 408; l <= 692; l += 12) {
    const c = wavelengthRGB(l);
    s.push({ l, c });
    sum[0] += c[0]; sum[1] += c[1]; sum[2] += c[2];
  }
  return { samples: s, sum };
})();

export const MONO = "'IBM Plex Mono', ui-monospace, monospace";

export function fitCanvas(cv, cssWidth) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = cssWidth || cv.clientWidth || 800;
  const h = Math.round(w * (cv.dataset.ratio ? +cv.dataset.ratio : 0.5));
  cv.width = Math.round(w * dpr);
  cv.height = Math.round(h * dpr);
  cv.style.height = h + "px";
  const ctx = cv.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}
