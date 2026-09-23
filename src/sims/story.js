// Vizualizarile care poarta povestea: zoomul pana in laborator,
// cele trei stari de faza si schimbarea rolurilor la rotire.
import { COL, MONO } from "./palette.js";
import { TAU } from "../physics/phase.js";
import { normalizedIntensity, resultantAmplitude } from "../physics/interference.js";

function surface(cv, ratio) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = cv.clientWidth || 700, h = Math.round(w * ratio);
  if (cv.width !== Math.round(w * dpr)) {
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    cv.style.height = h + "px";
  }
  const ctx = cv.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

/* ─── 02 · De ce ar fi eter si pe Pamant? ─────────────────────────
   Trei trepte de zoom, cu acelasi volum transparent de "eter" peste tot. */
export const ZOOM_STAGES = [
  { name: "Sistemul solar", note: "Eterul era presupus că umple tot spațiul dintre planete." },
  { name: "Pământul pe orbită", note: "Planeta nu stă pe loc: se mișcă prin el cu 30 km/s." },
  { name: "Laboratorul", note: "Deci și prin subsolul din Cleveland ar trebui să „bată” un curent." }
];

export function makeEtherZoom(cv) {
  let stage = 0, t = 0, shown = 0;      // shown = zoom animat catre stage

  function etherField(ctx, w, h, density) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < density; i++) {
      const x = ((i * 137.5) % 100) / 100 * w;
      const y = ((i * 61.8) % 100) / 100 * h;
      const drift = (t * 0.25 + i * 7) % (w + 40) - 20;
      ctx.fillStyle = "rgba(127,212,238,.30)";
      ctx.beginPath();
      ctx.arc((x + drift) % w, y, 1.1, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function draw() {
    const { ctx, w, h } = surface(cv, 0.46);
    t += 0.6;
    shown += (stage - shown) * 0.08;
    ctx.fillStyle = COL.panel;
    ctx.fillRect(0, 0, w, h);

    // volumul de eter, prezent la toate scarile
    etherField(ctx, w, h, 150);
    ctx.strokeStyle = "rgba(127,212,238,.16)";
    ctx.lineWidth = 1;
    ctx.strokeRect(8.5, 8.5, w - 17, h - 17);
    ctx.fillStyle = "rgba(127,212,238,.55)";
    ctx.font = "11px " + MONO;
    ctx.fillText("volumul ipotetic de eter — același la toate scările", 16, 24);

    const cx = w * 0.5, cy = h * 0.56;
    const k = shown;                       // 0..2, interpolat

    // treapta 0: sistemul solar
    const a0 = Math.max(0, 1 - Math.abs(k - 0));
    if (a0 > 0.01) {
      ctx.globalAlpha = a0;
      ctx.fillStyle = COL.b;
      ctx.beginPath(); ctx.arc(cx, cy, 13, 0, TAU); ctx.fill();
      ctx.strokeStyle = COL.line2; ctx.lineWidth = 1;
      for (const r of [42, 66, 92, 120]) {
        ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.42, 0, 0, TAU); ctx.stroke();
      }
      const ang = t * 0.012;
      const ex = cx + 92 * Math.cos(ang), ey = cy + 92 * 0.42 * Math.sin(ang);
      ctx.fillStyle = COL.a;
      ctx.beginPath(); ctx.arc(ex, ey, 5, 0, TAU); ctx.fill();
      ctx.fillStyle = COL.fg2; ctx.font = "11px " + MONO;
      ctx.fillText("Pământ", ex + 9, ey - 7);
      ctx.globalAlpha = 1;
    }

    // treapta 1: Pamantul, cu vectorul de viteza
    const a1 = Math.max(0, 1 - Math.abs(k - 1));
    if (a1 > 0.01) {
      ctx.globalAlpha = a1;
      ctx.fillStyle = "#16394a";
      ctx.beginPath(); ctx.arc(cx, cy, 54, 0, TAU); ctx.fill();
      ctx.strokeStyle = COL.a; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(cx, cy, 54, 0, TAU); ctx.stroke();
      ctx.strokeStyle = COL.b; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + 62, cy); ctx.lineTo(cx + 132, cy);
      ctx.moveTo(cx + 132, cy); ctx.lineTo(cx + 124, cy - 5);
      ctx.moveTo(cx + 132, cy); ctx.lineTo(cx + 124, cy + 5);
      ctx.stroke();
      ctx.fillStyle = COL.b; ctx.font = "12px " + MONO;
      ctx.fillText("30 km/s", cx + 68, cy - 10);
      ctx.globalAlpha = 1;
    }

    // treapta 2: laboratorul, cu vantul aparent
    const a2 = Math.max(0, 1 - Math.abs(k - 2));
    if (a2 > 0.01) {
      ctx.globalAlpha = a2;
      const bw = Math.min(w * 0.46, 260), bh = bw * 0.52;
      const bx = cx - bw / 2, by = cy - bh / 2;
      ctx.fillStyle = "#0a0f14"; ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = COL.line2; ctx.lineWidth = 1.2; ctx.strokeRect(bx, by, bw, bh);
      ctx.fillStyle = "#1b2831";
      ctx.fillRect(bx + bw * 0.30, by + bh * 0.42, bw * 0.40, bh * 0.16);
      ctx.fillStyle = COL.fg3; ctx.font = "10px " + MONO;
      ctx.fillText("masa optică", bx + bw * 0.30, by + bh * 0.72);
      // vantul aparent, prin laborator
      ctx.strokeStyle = COL.b; ctx.lineWidth = 1.4;
      for (let i = 0; i < 4; i++) {
        const y = by + bh * (0.18 + i * 0.22);
        const x = bx - 30 + ((t * 1.1 + i * 40) % (bw + 60));
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 20, y);
        ctx.moveTo(x + 20, y); ctx.lineTo(x + 15, y - 3);
        ctx.moveTo(x + 20, y); ctx.lineTo(x + 15, y + 3);
        ctx.stroke();
      }
      ctx.fillStyle = COL.b; ctx.font = "11px " + MONO;
      ctx.fillText("vânt de eter aparent", bx, by - 10);
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = COL.fg;
    ctx.font = "13px " + MONO;
    ctx.fillText(ZOOM_STAGES[stage].name, 16, h - 16);
  }

  return {
    draw,
    get stage() { return stage; },
    set stage(v) { stage = Math.max(0, Math.min(ZOOM_STAGES.length - 1, v)); },
    count: ZOOM_STAGES.length
  };
}

/* ─── 09 · Cele trei stari de faza, obligatorii ───────────────────
   Fiecare panou arata A, B si rezultanta pentru o faza fixa. */
export function drawPhaseState(cv, phi, animT) {
  const { ctx, w, h } = surface(cv, 0.74);
  ctx.fillStyle = "#0a0e13";
  ctx.fillRect(0, 0, w, h);

  const x0 = 8, x1 = w - 8;
  const A = h * 0.11, per = Math.max(64, (x1 - x0) / 1.9);
  const yA = h * 0.19, yB = h * 0.45, yS = h * 0.79;

  const trace = (off, amp, cy, col, lw) => {
    ctx.strokeStyle = col; ctx.lineWidth = lw;
    ctx.beginPath();
    for (let x = x0; x <= x1; x++) {
      const y = cy - amp * Math.sin(TAU * (x - x0) / per - animT + off);
      x === x0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  };

  ctx.strokeStyle = "rgba(255,255,255,.07)"; ctx.lineWidth = 1;
  for (const y of [yA, yB, yS]) {
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
  }
  trace(0, A, yA, COL.a, 1.7);
  trace(phi, A, yB, COL.b, 1.7);

  const amp = A * resultantAmplitude(phi);
  if (Math.abs(amp) < 0.6) {
    ctx.strokeStyle = COL.res; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(x0, yS); ctx.lineTo(x1, yS); ctx.stroke();
  } else {
    trace(phi / 2, amp, yS, COL.res, 2.2);
  }

  ctx.font = "9px " + MONO;
  ctx.fillStyle = COL.a; ctx.fillText("A", 3, yA - A - 4);
  ctx.fillStyle = COL.b; ctx.fillText("B", 3, yB - A - 4);
  ctx.fillStyle = COL.fg2; ctx.fillText("A + B", 3, yS - Math.abs(amp) - 4);
}

/* ─── 14 · De ce rotim aparatul: rolurile se schimba ──────────────── */
export function drawRotationRoles(cv, rotated) {
  const { ctx, w, h } = surface(cv, 0.42);
  ctx.fillStyle = COL.panel;
  ctx.fillRect(0, 0, w, h);

  const cx = w * 0.5, cy = h * 0.56, L = Math.min(w * 0.19, h * 0.34);

  // vantul ipotetic
  ctx.strokeStyle = "rgba(255,176,74,.45)"; ctx.lineWidth = 1.3;
  for (let i = 0; i < 4; i++) {
    const y = h * (0.14 + i * 0.24);
    for (let x = 14; x < w - 30; x += 58) {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 26, y);
      ctx.moveTo(x + 26, y); ctx.lineTo(x + 20, y - 4);
      ctx.moveTo(x + 26, y); ctx.lineTo(x + 20, y + 4);
      ctx.stroke();
    }
  }
  ctx.fillStyle = COL.b; ctx.font = "12px " + MONO;
  ctx.fillText("VÂNT DE ETER  →", 14, 20);

  // bratele: A orizontal, B vertical; la rotire isi schimba rolurile
  const horiz = rotated ? COL.a : COL.b;
  const vert = rotated ? COL.b : COL.a;

  ctx.lineWidth = 3;
  ctx.strokeStyle = horiz;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + L, cy); ctx.stroke();
  ctx.strokeStyle = vert;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - L); ctx.stroke();

  ctx.fillStyle = "#dde4e9";
  ctx.fillRect(cx + L, cy - 11, 4, 22);
  ctx.fillRect(cx - 11, cy - L - 4, 22, 4);

  ctx.font = "12px " + MONO;
  ctx.fillStyle = horiz;
  ctx.fillText(rotated ? "B · paralel" : "A · paralel", cx + L + 12, cy + 4);
  ctx.fillStyle = vert;
  ctx.fillText(rotated ? "A · perpendicular" : "B · perpendicular", cx + 14, cy - L - 10);

  ctx.fillStyle = COL.fg2; ctx.font = "12px " + MONO;
  ctx.fillText(rotated ? "după rotirea cu 90°" : "înainte de rotire", 14, h - 14);
}
