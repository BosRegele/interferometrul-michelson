// Campul de franje. Doua moduri de citire: SCREEN (suprafata intreaga) si
// POINT (un singur punct, ca o fotodioda). Microscope Mode arata undele locale.
import { COL, MONO, wavelengthRGB, rgbCss, SPECTRUM } from "./palette.js";
import { state } from "../state.js";
import { TAU } from "../physics/phase.js";
import { pathDiffAtAngle, pathDiffFromTilt } from "../physics/opticalPath.js";
import { visibility, coherenceLength } from "../physics/coherence.js";

const TH = 0.75;              // semi-deschidere unghiulara
const HALF_MM = 10;           // jumatatea ecranului <-> 10 mm pe oglinda

/** Diferenta de drum locala, in nm, pentru un punct normat (-1..1). */
export function localPathDiff(dxn, dyn) {
  const r = Math.sqrt(dxn * dxn + dyn * dyn);
  return pathDiffAtAngle(state.armDifference, r * TH)
       + pathDiffFromTilt(state.tilt * 1e-6, dxn * HALF_MM * 1e6);
}

function colorAt(dxn, dyn) {
  const delta = localPathDiff(dxn, dyn);
  if (!state.whiteLight) {
    const V = visibility(delta, state.coherenceLength);
    const I = 0.5 + 0.5 * V * Math.cos(TAU * delta / state.lambda);
    const c = wavelengthRGB(state.lambda);
    return [c[0] * I, c[1] * I, c[2] * I];
  }
  let R = 0, G = 0, B = 0;
  for (const s of SPECTRUM.samples) {
    const I = 0.5 + 0.5 * Math.cos(TAU * delta / s.l);
    R += s.c[0] * I; G += s.c[1] * I; B += s.c[2] * I;
  }
  return [R / SPECTRUM.sum[0] * 1.55, G / SPECTRUM.sum[1] * 1.55, B / SPECTRUM.sum[2] * 1.55];
}

export function makeFringes(cv, opts = {}) {
  const RES = 200;
  const off = document.createElement("canvas");
  off.width = off.height = RES;
  const octx = off.getContext("2d", { alpha: false });
  const img = octx.createImageData(RES, RES);
  let mode = "screen", micro = false, hover = null, t = 0;

  function renderField(quick) {
    const d = img.data, h = RES / 2, st = quick ? 2 : 1;
    for (let y = 0; y < RES; y += st) {
      const dyn = (y - h) / h;
      for (let x = 0; x < RES; x += st) {
        const dxn = (x - h) / h;
        const c = colorAt(dxn, dyn);
        const r = Math.sqrt(dxn * dxn + dyn * dyn);
        const vg = Math.max(0, 1 - Math.pow(r, 7) * 0.6);
        const R = Math.min(255, 255 * c[0] * vg), G = Math.min(255, 255 * c[1] * vg),
              B = Math.min(255, 255 * c[2] * vg);
        for (let by = 0; by < st && y + by < RES; by++)
          for (let bx = 0; bx < st && x + bx < RES; bx++) {
            const i = ((y + by) * RES + (x + bx)) * 4;
            d[i] = R; d[i + 1] = G; d[i + 2] = B; d[i + 3] = 255;
          }
      }
    }
    octx.putImageData(img, 0, 0);
  }

  function draw(quick) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = cv.clientWidth || 420, h = w;
    if (cv.width !== Math.round(w * dpr)) {
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      cv.style.height = h + "px";
    }
    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#04060a"; ctx.fillRect(0, 0, w, h);

    if (mode === "screen") {
      renderField(quick);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(off, 0, 0, RES, RES, 0, 0, w, h);
    } else {
      // POINT DETECTOR: doar centrul, ca o fotodioda
      const delta = localPathDiff(0, 0);
      const V = visibility(delta, state.coherenceLength);
      const I = 0.5 + 0.5 * V * Math.cos(TAU * delta / state.lambda);
      const c = wavelengthRGB(state.lambda);
      ctx.save(); ctx.shadowColor = rgbCss(c); ctx.shadowBlur = 60 * I;
      ctx.fillStyle = rgbCss([c[0] * I, c[1] * I, c[2] * I]);
      ctx.beginPath(); ctx.arc(w / 2, h * 0.42, w * 0.17, 0, TAU); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = COL.line2; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(w / 2, h * 0.42, w * 0.17, 0, TAU); ctx.stroke();
      // bara de intensitate
      const bw = w * 0.5, bx = (w - bw) / 2, by = h * 0.72;
      ctx.fillStyle = "#121a21"; ctx.fillRect(bx, by, bw, 10);
      ctx.fillStyle = rgbCss(c); ctx.fillRect(bx, by, bw * I, 10);
      ctx.fillStyle = COL.fg2; ctx.font = `12px ${MONO}`;
      ctx.fillText(`I / Imax = ${I.toFixed(2)}`, bx, by + 28);
      ctx.fillStyle = COL.fg3;
      ctx.fillText("un singur punct, ca o fotodiodă", bx, by + 46);
    }

    // reticul + citire la hover
    if (hover && mode === "screen") {
      const { x, y } = hover;
      const dxn = (x / w) * 2 - 1, dyn = (y / h) * 2 - 1;
      const delta = localPathDiff(dxn, dyn);
      const phi = TAU * delta / state.lambda;
      const V = visibility(delta, state.coherenceLength);
      const I = 0.5 + 0.5 * V * Math.cos(phi);
      ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 15, y); ctx.lineTo(x - 11, y);
      ctx.moveTo(x + 11, y); ctx.lineTo(x + 15, y);
      ctx.moveTo(x, y - 15); ctx.lineTo(x, y - 11);
      ctx.moveTo(x, y + 11); ctx.lineTo(x, y + 15);
      ctx.stroke();

      const lines = [
        `ΔL local = ${(delta / 1000).toFixed(3)} µm`,
        `φ = ${(phi / Math.PI).toFixed(2)}π`,
        `I / Imax = ${I.toFixed(2)}`
      ];
      const bw = 148, bh = 54;
      const bx = Math.min(w - bw - 6, Math.max(6, x + 16));
      const by = Math.min(h - bh - 6, Math.max(6, y - bh - 12));
      ctx.fillStyle = "rgba(7,9,13,.92)"; ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = COL.line2; ctx.strokeRect(bx + 0.5, by + 0.5, bw, bh);
      ctx.font = `11px ${MONO}`;
      lines.forEach((l, i) => { ctx.fillStyle = COL.fg2; ctx.fillText(l, bx + 8, by + 17 + i * 14); });

      // Microscope Mode: undele locale in punctul tintit
      if (micro) {
        const mw = 190, mh = 96;
        const mx = Math.min(w - mw - 6, Math.max(6, x - mw / 2));
        const my = y + 24 + mh > h ? Math.max(6, y - mh - 70) : y + 24;
        ctx.fillStyle = "rgba(7,9,13,.95)"; ctx.fillRect(mx, my, mw, mh);
        ctx.strokeStyle = COL.line2; ctx.strokeRect(mx + 0.5, my + 0.5, mw, mh);
        const cy = my + mh * 0.42, A = 17, per = 52;
        for (const [ph, col] of [[0, COL.beamA], [phi, COL.beamB]]) {
          ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.beginPath();
          for (let px = 6; px < mw - 6; px++) {
            const yy = cy - A * Math.sin(TAU * px / per - t * 0.05 + ph);
            px === 6 ? ctx.moveTo(mx + px, yy) : ctx.lineTo(mx + px, yy);
          }
          ctx.stroke();
        }
        const amp = 2 * A * Math.cos(phi / 2);
        ctx.strokeStyle = COL.result; ctx.lineWidth = 1.8; ctx.beginPath();
        for (let px = 6; px < mw - 6; px++) {
          const yy = my + mh * 0.78 - amp * 0.5 * Math.sin(TAU * px / per - t * 0.05 + phi / 2);
          px === 6 ? ctx.moveTo(mx + px, yy) : ctx.lineTo(mx + px, yy);
        }
        ctx.stroke();
        ctx.fillStyle = COL.fg3; ctx.font = `9px ${MONO}`;
        ctx.fillText("undele în acest punct", mx + 7, my + 12);
      }
    }
  }

  cv.addEventListener("pointermove", e => {
    const r = cv.getBoundingClientRect();
    hover = { x: e.clientX - r.left, y: e.clientY - r.top };
    if (opts.onHover) opts.onHover(hover);
  });
  cv.addEventListener("pointerleave", () => { hover = null; });

  return {
    draw,
    tick() { t += 1; },
    setMode(m) { mode = m; },
    getMode() { return mode; },
    setMicro(v) { micro = v; },
    getMicro() { return micro; }
  };
}

/** Profilul de intensitate pe diametrul orizontal. */
export function drawProfile(cv) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = cv.clientWidth || 420, h = 84;
  if (cv.width !== Math.round(w * dpr)) {
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    cv.style.height = h + "px";
  }
  const ctx = cv.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "#04060a"; ctx.fillRect(0, 0, w, h);
  const top = 10, bot = h - 14;
  ctx.strokeStyle = "#131c23"; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, bot); ctx.lineTo(w, bot);
  ctx.moveTo(0, top); ctx.lineTo(w, top);
  ctx.stroke();
  const ys = [], cs = [];
  for (let x = 0; x <= w; x++) {
    const c = colorAt((x - w / 2) / (w / 2), 0);
    const lum = Math.min(1, 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]);
    ys.push(bot - lum * (bot - top)); cs.push(c);
  }
  for (let x = 0; x < w; x++) {
    ctx.fillStyle = rgbCss(cs[x], 255).replace("rgb", "rgba").replace(")", ",.3)");
    ctx.fillRect(x, ys[x], 1, bot - ys[x]);
  }
  ctx.beginPath();
  for (let x = 0; x <= w; x++) x ? ctx.lineTo(x, ys[x]) : ctx.moveTo(0, ys[0]);
  ctx.strokeStyle = "#cfd9df"; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.fillStyle = COL.fg3; ctx.font = `9px ${MONO}`;
  ctx.fillText("intensitatea pe diametru", 6, 9);
}

/** Cat de departe rezista franjele, pentru cinci surse reale. */
const LADDER = [["laser", 0.002], ["lampă cu sodiu", 0.6], ["filtru îngust", 5],
                ["filtru colorat", 50], ["lumină albă", 300]];

export function drawCoherenceLadder(cv) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = cv.clientWidth || 700, h = Math.round(Math.max(230, w * 0.34));
  if (cv.width !== Math.round(w * dpr)) {
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    cv.style.height = h + "px";
  }
  const ctx = cv.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = COL.panel; ctx.fillRect(0, 0, w, h);

  const x0 = Math.min(126, w * 0.30), x1 = w - 14;
  const lo = Math.log10(0.3), hi = Math.log10(3000);       // in micrometri
  const col = wavelengthRGB(589.3);
  const top = 28, rowH = (h - top - 28) / LADDER.length;

  LADDER.forEach(([name, dl], k) => {
    const y = top + k * rowH, bh = Math.max(11, rowH - 13);
    const Lc = coherenceLength(589.3, dl) / 1000;
    for (let x = x0; x < x1; x++) {
      const dm = Math.pow(10, lo + (x - x0) / (x1 - x0) * (hi - lo));
      const V = visibility(dm, Lc);
      const I = 0.5 + 0.5 * V * Math.cos((x - x0) * 0.42);
      ctx.fillStyle = rgbCss([col[0] * I, col[1] * I, col[2] * I]);
      ctx.fillRect(x, y, 1, bh);
    }
    ctx.strokeStyle = COL.line; ctx.lineWidth = 1;
    ctx.strokeRect(x0 - 0.5, y - 0.5, x1 - x0 + 1, bh + 1);
    ctx.fillStyle = COL.fg2; ctx.font = `11px ${MONO}`;
    ctx.fillText(name, 6, y + bh / 2 + 4);
    const lx = x0 + (Math.log10(Lc) - lo) / (hi - lo) * (x1 - x0);
    ctx.font = `10px ${MONO}`;
    if (lx > x0 && lx < x1) {
      ctx.strokeStyle = COL.beamB; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(lx, y - 3); ctx.lineTo(lx, y + bh + 3); ctx.stroke();
      ctx.fillStyle = COL.beamB;
      ctx.fillText(Lc < 1000 ? Math.round(Lc) + " µm" : (Lc / 1000).toFixed(1) + " mm",
                   Math.min(lx + 5, x1 - 52), y + 9);
    } else {
      ctx.fillStyle = COL.ok;
      ctx.fillText("mult dincolo →", x1 - 88, y + 9);
    }
  });

  ctx.fillStyle = COL.fg3; ctx.font = `10px ${MONO}`;
  for (const [v, s] of [[1, "1 µm"], [10, "10 µm"], [100, "0,1 mm"], [1000, "1 mm"]]) {
    const x = x0 + (Math.log10(v) - lo) / (hi - lo) * (x1 - x0);
    ctx.strokeStyle = "#141d24"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, top - 6); ctx.lineTo(x, h - 24); ctx.stroke();
    ctx.fillStyle = COL.fg3;
    ctx.fillText(s, x - 16, h - 10);
  }
  ctx.fillText("decalajul dintre brațe →", 6, h - 10);
  ctx.fillStyle = COL.fg2; ctx.fillText("SURSA", 6, 17);
}
