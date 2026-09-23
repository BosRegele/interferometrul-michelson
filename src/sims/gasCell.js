// Tubul cu gaz: drumul optic se schimba fara ca geometria sa se schimbe.
import { COL, MONO, wavelengthRGB } from "./palette.js";
import { state } from "../state.js";
import { TAU } from "../physics/phase.js";
import { fringesFromGas, GASES } from "../physics/refractiveIndex.js";

export function makeGasCell(cv) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let gas = "air", frac = 1, target = 1;

  function total() {
    return fringesFromGas(1 + GASES[gas].n1, state.gasLength, state.lambda * 1e-9);
  }

  function draw() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = cv.clientWidth || 800, h = Math.round(Math.max(w * 0.34, 230));
    if (cv.width !== Math.round(w * dpr)) {
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      cv.style.height = h + "px";
    }
    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = COL.panel; ctx.fillRect(0, 0, w, h);

    if (reduced || Math.abs(frac - target) <= 0.0005) frac = target;
    else frac += (target - frac) * 0.02;

    const tot = total(), passed = tot * (1 - frac);
    const Lcm = state.gasLength * 100;
    const ax = w * 0.09, bx = w * 0.88, yUp = h * 0.22, yDn = h * 0.36;

    ctx.save();
    ctx.shadowColor = COL.beamB; ctx.shadowBlur = 12;
    ctx.strokeStyle = COL.beamB; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ax, yUp); ctx.lineTo(bx, yUp);
    ctx.moveTo(bx, yDn); ctx.lineTo(ax, yDn);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = COL.beamB;
    for (const [x, y, d] of [[w * 0.30, yUp, 1], [w * 0.30, yDn, -1]]) {
      ctx.beginPath();
      ctx.moveTo(x, y - 4); ctx.lineTo(x + 9 * d, y); ctx.lineTo(x, y + 4);
      ctx.closePath(); ctx.fill();
    }

    ctx.fillStyle = "#dde4e9";
    ctx.fillRect(bx, yUp - 16, 5, (yDn - yUp) + 32);
    ctx.strokeStyle = COL.beamA; ctx.lineWidth = 2.4; ctx.globalAlpha = 0.7;
    ctx.beginPath(); ctx.moveTo(ax - 12, yUp - 14); ctx.lineTo(ax + 12, yDn + 14); ctx.stroke();
    ctx.globalAlpha = 1;

    const cw = Math.max(36, Lcm / 30 * w * 0.30), cx = w * 0.42;
    ctx.fillStyle = "rgba(127,212,238," + (0.03 + 0.15 * frac) + ")";
    ctx.fillRect(cx, yUp - 14, cw, (yDn - yUp) + 28);
    ctx.strokeStyle = "#5f7f8e"; ctx.lineWidth = 1.3;
    ctx.strokeRect(cx, yUp - 14, cw, (yDn - yUp) + 28);

    ctx.fillStyle = "rgba(127,212,238,.5)";
    const mols = Math.round(frac * Math.max(5, cw / 11));
    for (let i = 0; i < mols; i++) {
      const rx = cx + 5 + ((i * 53) % Math.max(1, cw - 10));
      const ry = yUp - 10 + ((i * 31) % Math.max(1, (yDn - yUp) + 20));
      ctx.beginPath(); ctx.arc(rx, ry, 1.7, 0, TAU); ctx.fill();
    }

    ctx.fillStyle = COL.fg2; ctx.font = "11px " + MONO;
    ctx.fillText("tub de " + Lcm.toFixed(1) + " cm cu " + GASES[gas].label, cx, yUp - 22);
    ctx.fillStyle = COL.fg3;
    ctx.fillText("oglindă", bx - 46, yUp - 22);

    const by = h * 0.55, bh = h * 0.30;
    const phase = TAU * (2 * GASES[gas].n1 * state.gasLength * frac) / (state.lambda * 1e-9);
    const col = wavelengthRGB(state.lambda);
    for (let x = 0; x < w; x++) {
      const I = Math.pow(0.5 + 0.5 * Math.cos(TAU * x / 64 + phase), 1.35);
      ctx.fillStyle = "rgb(" + (col[0] * 255 * I | 0) + "," + (col[1] * 255 * I | 0) + "," + (col[2] * 255 * I | 0) + ")";
      ctx.fillRect(x, by, 1, bh);
    }
    ctx.strokeStyle = COL.line; ctx.lineWidth = 1;
    ctx.strokeRect(0.5, by, w - 1, bh);
    ctx.strokeStyle = "rgba(87,214,162,.9)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(w / 2, by); ctx.lineTo(w / 2, by + bh); ctx.stroke();

    ctx.fillStyle = COL.fg3; ctx.font = "10px " + MONO;
    ctx.fillText("FRANJELE, LA DETECTOR", 6, by - 6);
    ctx.fillStyle = COL.beamB; ctx.font = "15px " + MONO;
    const txt = passed.toFixed(1) + " / " + tot.toFixed(1) + " franje";
    ctx.fillText(txt, Math.max(6, w - 8 - ctx.measureText(txt).width), by - 6);
  }

  return {
    draw,
    pump() { target = 0; },
    fill() { target = 1; },
    setGas(g) { gas = g; },
    getGas() { return gas; },
    get fraction() { return frac; },
    total
  };
}
