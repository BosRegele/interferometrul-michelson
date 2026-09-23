// Lantul cauzal, piesa centrala a proiectului:
// oglinda se misca -> drumul creste cu 2dx -> unda aluneca -> faza se schimba
// -> intensitatea se schimba -> franja se misca.
// Cele cinci panouri citesc aceeasi stare si se redeseneaza impreuna.
import { COL, MONO, wavelengthRGB, rgbCss } from "./palette.js";
import { state } from "../state.js";
import { TAU } from "../physics/phase.js";

const TH = 0.75;                       // semi-deschiderea unghiulara a sursei extinse

function panel(cv) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = cv.clientWidth || 200, h = Math.round(w * 0.86);
  if (cv.width !== Math.round(w * dpr)) {
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    cv.style.height = h + "px";
  }
  const ctx = cv.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return { ctx, w, h };
}

/* 1 — oglinda care aluneca */
function drawMirror(cv, t) {
  const { ctx, w, h } = panel(cv);
  const cy = h / 2;
  const frac = state.mirrorDisplacement / (state.lambda * 2);   // 0..1 pe doua lungimi de unda
  const x0 = w * 0.30, span = w * 0.34;
  const mx = x0 + span * Math.min(1, Math.max(0, frac));

  ctx.strokeStyle = COL.line;
  ctx.setLineDash([3, 5]);
  ctx.beginPath(); ctx.moveTo(x0, cy - 26); ctx.lineTo(x0, cy + 26); ctx.stroke();
  ctx.setLineDash([]);

  // fasciculul care loveste oglinda
  ctx.strokeStyle = COL.beamB; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(w * 0.06, cy); ctx.lineTo(mx - 4, cy); ctx.stroke();
  for (let i = 0; i < 2; i++) {
    const f = (t * 0.006 + i / 2) % 1;
    const px = w * 0.06 + (mx - 4 - w * 0.06) * f;
    ctx.fillStyle = COL.beamB;
    ctx.beginPath(); ctx.arc(px, cy, 2.4, 0, TAU); ctx.fill();
  }
  // oglinda
  ctx.fillStyle = "#dde4e9"; ctx.fillRect(mx, cy - 22, 5, 44);
  ctx.fillStyle = "#49555e"; ctx.fillRect(mx + 5, cy - 22, 3, 44);
  // sageata de deplasare
  ctx.strokeStyle = COL.beamB; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0, cy + 38); ctx.lineTo(mx, cy + 38);
  ctx.moveTo(mx, cy + 38); ctx.lineTo(mx - 4, cy + 35);
  ctx.moveTo(mx, cy + 38); ctx.lineTo(mx - 4, cy + 41);
  ctx.stroke();
  ctx.fillStyle = COL.fg2; ctx.font = `11px ${MONO}`;
  ctx.fillText("Δx", (x0 + mx) / 2 - 7, cy + 53);
}

/* 2 — drumul: dus + intors = 2dx */
function drawPath(cv) {
  const { ctx, w, h } = panel(cv);
  const frac = Math.min(1, state.mirrorDisplacement / (state.lambda * 2));
  const full = w * 0.74, x0 = w * 0.13;
  const bar = full * frac;

  ctx.fillStyle = COL.fg3; ctx.font = `10px ${MONO}`;
  ctx.fillText("dus", x0, h * 0.30 - 8);
  ctx.fillText("întors", x0, h * 0.54 - 8);
  ctx.fillText("total", x0, h * 0.80 - 8);

  ctx.fillStyle = "#121a21";
  ctx.fillRect(x0, h * 0.30, full, 9);
  ctx.fillRect(x0, h * 0.54, full, 9);
  ctx.fillRect(x0, h * 0.80, full, 11);

  ctx.fillStyle = COL.beamA;
  ctx.fillRect(x0, h * 0.30, bar / 2, 9);
  ctx.fillRect(x0, h * 0.54, bar / 2, 9);
  ctx.fillStyle = COL.beamB;
  ctx.fillRect(x0, h * 0.80, bar, 11);

  // reper la lambda/2, unde apare primul minim
  const half = full * (state.lambda / 2) / (state.lambda * 2);
  ctx.strokeStyle = COL.warn; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x0 + half, h * 0.76); ctx.lineTo(x0 + half, h * 0.95); ctx.stroke();
  ctx.fillStyle = COL.warn; ctx.font = `9px ${MONO}`;
  ctx.fillText("λ/2", x0 + half + 3, h * 0.99);
}

/* 3 — cele doua unde, una alunecata */
function drawWaves(cv, t) {
  const { ctx, w, h } = panel(cv);
  const phi = state.phaseDifference;
  const A = h * 0.17, cy1 = h * 0.30, cy2 = h * 0.62, per = w * 0.52;

  const trace = (off, cyy, col) => {
    ctx.strokeStyle = col; ctx.lineWidth = 1.7;
    ctx.beginPath();
    for (let x = 6; x <= w - 6; x++) {
      const y = cyy - A * Math.sin(TAU * (x - 6) / per - t * 0.04 + off);
      x === 6 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  };
  trace(0, cy1, COL.beamA);
  trace(phi, cy1, COL.beamB);

  // rezultanta
  const amp = 2 * A * Math.cos(phi / 2);
  ctx.strokeStyle = COL.result; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 6; x <= w - 6; x++) {
    const y = cy2 - amp * Math.sin(TAU * (x - 6) / per - t * 0.04 + phi / 2);
    x === 6 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.fillStyle = COL.fg3; ctx.font = `10px ${MONO}`;
  ctx.fillText("A + B", 8, h - 6);
}

/* 4 — cadranul de faza */
function drawPhase(cv) {
  const { ctx, w, h } = panel(cv);
  const phi = state.phaseDifference;
  const cx = w / 2, cy = h * 0.46, r = Math.min(w, h) * 0.28;

  ctx.strokeStyle = COL.line2; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
  // reperele 0 / pi
  ctx.fillStyle = COL.fg3; ctx.font = `9px ${MONO}`;
  ctx.fillText("0", cx + r + 4, cy + 3);
  ctx.fillText("π", cx - r - 11, cy + 3);
  // sectorul parcurs
  ctx.strokeStyle = COL.beamB; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, phi % TAU); ctx.stroke();
  // acul
  const a = phi % TAU;
  ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a)); ctx.stroke();
  ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(cx, cy, 2.5, 0, TAU); ctx.fill();
  // zona de minim
  ctx.fillStyle = COL.fg3; ctx.font = `9px ${MONO}`;
  ctx.fillText("π = întuneric", cx - 34, h - 8);
}

/* 5 — franja si intensitatea */
function drawFringe(cv) {
  const { ctx, w, h } = panel(cv);
  const size = Math.min(w * 0.62, h * 0.72);
  const x0 = (w - size) / 2 - 8, y0 = h * 0.10;
  const col = wavelengthRGB(state.lambda);
  const dd = 1767.9 + state.mirrorDisplacement;        // pornim de la un centru luminos

  const step = 2;
  for (let y = 0; y < size; y += step) {
    for (let x = 0; x < size; x += step) {
      const dx = (x - size / 2) / (size / 2), dy = (y - size / 2) / (size / 2);
      const r = Math.sqrt(dx * dx + dy * dy);
      if (r > 1) continue;
      let I = 0.5 + 0.5 * Math.cos(2 * TAU * dd / state.lambda * Math.cos(r * TH));
      I = Math.pow(I, 1.3) * Math.max(0, 1 - Math.pow(r, 6) * 0.7);
      ctx.fillStyle = rgbCss([col[0] * I, col[1] * I, col[2] * I]);
      ctx.fillRect(x0 + x, y0 + y, step, step);
    }
  }
  ctx.strokeStyle = COL.line; ctx.lineWidth = 1;
  ctx.strokeRect(x0 - 0.5, y0 - 0.5, size + 1, size + 1);

  // bara de intensitate
  const bx = x0 + size + 10, bw = 12, bh = size;
  ctx.strokeStyle = COL.line2; ctx.strokeRect(bx, y0, bw, bh);
  ctx.fillStyle = COL.beamB;
  ctx.fillRect(bx + 1, y0 + bh - bh * state.intensity + 1, bw - 2, bh * state.intensity - 2);
}

const STAGES = [drawMirror, drawPath, drawWaves, drawPhase, drawFringe];

export function mountChain(root) {
  const canvases = [...root.querySelectorAll("canvas[data-stage]")];
  let t = 0;
  return function frame() {
    t += 1;
    canvases.forEach((cv, i) => STAGES[i] && STAGES[i](cv, t));
  };
}
