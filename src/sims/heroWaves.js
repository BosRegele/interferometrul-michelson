// Hero: paradoxul. Doua unde si un cursor de faza 0 - 180 - 360.
import { COL, MONO } from "./palette.js";
import { TAU } from "../physics/phase.js";
import { normalizedIntensity, resultantAmplitude } from "../physics/interference.js";

export function makeHeroWaves(cv) {
  let phi = 0, t = 0;

  function draw() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = cv.clientWidth || 700;
    const h = Math.round(Math.min(Math.max(w * 0.5, 230), 400));
    if (cv.width !== Math.round(w * dpr)) {
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      cv.style.height = h + "px";
    }
    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    t += 0.035;

    const meterW = Math.min(84, w * 0.15);
    const x0 = 6, x1 = w - meterW - 24;
    const A = h * 0.13, yA = h * 0.27, yB = h * 0.70;
    const per = Math.max(110, (x1 - x0) / 2.4);

    const trace = (off, amp, cy, col, lw, glow) => {
      ctx.save();
      if (glow) { ctx.shadowColor = col; ctx.shadowBlur = glow; }
      ctx.strokeStyle = col; ctx.lineWidth = lw;
      ctx.beginPath();
      for (let x = x0; x <= x1; x++) {
        const y = cy - amp * Math.sin(TAU * (x - x0) / per - t + off);
        x === x0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    };

    ctx.strokeStyle = "rgba(255,255,255,.06)"; ctx.lineWidth = 1;
    for (const y of [yA, yB]) {
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
    }

    trace(0, A, yA, COL.beamA, 2, 10);
    trace(phi, A, yA, COL.beamB, 2, 10);

    const amp = A * resultantAmplitude(phi);
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = "rgba(255,255,255,.16)"; ctx.lineWidth = 1;
    for (const y of [yB - Math.abs(amp), yB + Math.abs(amp)]) {
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
    }
    ctx.setLineDash([]);
    trace(phi / 2, amp, yB, COL.result, 2.4, 14);

    const I = normalizedIntensity(phi);
    const mx = w - meterW - 4, my = h * 0.13, mh = h * 0.68;
    ctx.strokeStyle = COL.line2; ctx.lineWidth = 1;
    ctx.strokeRect(mx, my, meterW, mh);
    ctx.save();
    ctx.shadowColor = COL.beamB; ctx.shadowBlur = 30 * I;
    ctx.fillStyle = COL.beamB;
    ctx.fillRect(mx + 1, my + mh - mh * I + 1, meterW - 2, Math.max(0, mh * I - 2));
    ctx.restore();

    ctx.fillStyle = COL.fg3; ctx.font = "10px " + MONO;
    ctx.fillText("DETECTOR", mx, my - 8);
    ctx.fillStyle = I > 0.5 ? COL.fg : COL.fg2;
    ctx.font = "14px " + MONO;
    ctx.fillText(Math.round(I * 100) + "%", mx + 4, my + mh + 19);

    ctx.font = "11px " + MONO;
    ctx.fillStyle = COL.beamA; ctx.fillText("raza A", x0, yA - A - 10);
    ctx.fillStyle = COL.beamB; ctx.fillText("raza B", x0 + 60, yA - A - 10);
    ctx.fillStyle = COL.fg2; ctx.fillText("A + B", x0, yB - Math.abs(amp) - 10);
  }

  return {
    draw,
    setPhase(p) { phi = p; },
    getPhase() { return phi; }
  };
}
