// Modelul istoric al eterului: analogia raului, aparatul in rotatie si
// comparatia predictie / observatie. Toate descriu o IPOTEZA, nu realitatea.
import { COL, MONO, wavelengthRGB } from "./palette.js";
import { state } from "../state.js";
import { TAU } from "../physics/phase.js";
import { predictedSwing, shiftSinceStart, parallelLegs, OBSERVED_1887_UPPER_BOUND } from "../physics/etherModel.js";

function surface(cv, ratio) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = cv.clientWidth || 800, h = Math.round(w * ratio);
  if (cv.width !== Math.round(w * dpr)) {
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    cv.style.height = h + "px";
  }
  const ctx = cv.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

/* ─── Analogia raului ─────────────────────────────────────────────── */
export function makeRiver(cv) {
  let current = 0.5;      // fractiune din viteza inotatorului
  let morph = false;      // false = apa si inotatori, true = eter si lumina
  let t = 0, running = true;

  function times() {
    const v = current;
    const tPar = v >= 1 ? Infinity : 2 / (1 - v * v);       // in unitati de L/c
    const tPerp = v >= 1 ? Infinity : 2 / Math.sqrt(1 - v * v);
    return { tPar, tPerp };
  }

  function draw() {
    const { ctx, w, h } = surface(cv, 0.44);
    if (running) t += 0.011;
    ctx.fillStyle = COL.panel; ctx.fillRect(0, 0, w, h);

    const { tPar, tPerp } = times();
    const cycle = Math.max(tPar, tPerp) * 1.25;
    const tau = (t % cycle);

    const cx = w * 0.18, cy = h * 0.5, L = w * 0.56;

    // curentul
    ctx.strokeStyle = "#16242c"; ctx.lineWidth = 1;
    for (let i = 1; i < 6; i++) {
      const y = h * i / 6;
      ctx.beginPath(); ctx.moveTo(10, y); ctx.lineTo(w - 10, y); ctx.stroke();
    }
    if (current > 0.01) {
      ctx.strokeStyle = morph ? "rgba(127,212,238,.35)" : "rgba(90,150,180,.5)";
      ctx.lineWidth = 1.6;
      for (let i = 0; i < 9; i++) {
        const y = h * (i + 0.5) / 9;
        const x = ((t * 90 * current + i * 61) % (w + 60)) - 30;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 22, y); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 22, y); ctx.lineTo(x + 17, y - 3);
        ctx.moveTo(x + 22, y); ctx.lineTo(x + 17, y + 3);
        ctx.stroke();
      }
    }
    ctx.font = `12px ${MONO}`;
    const head = morph ? "VÂNT DE ETER  v →" : "CURENTUL APEI  v →";
    ctx.fillStyle = "rgba(14,18,24,.94)";
    ctx.fillRect(7, 5, ctx.measureText(head).width + 10, 18);
    ctx.fillStyle = COL.fg3;
    ctx.fillText(head, 12, 18);

    // tinte
    ctx.strokeStyle = COL.line2; ctx.setLineDash([4, 5]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx + L, 10); ctx.lineTo(cx + L, h - 10); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#dde4e9";
    ctx.fillRect(cx + L, cy - 22, 5, 44);
    ctx.fillRect(cx - 22, h * 0.10, 44, 5);

    // pozitiile: B in lungul curentului, A perpendicular
    function posPar(tt) {
      // Curentul curge spre dreapta. Dusul spre dreapta e CU curentul (c+v, rapid),
      // intoarcerea spre stanga e CONTRA curentului (c-v, lenta).
      if (tt >= tPar) return { d: 0, done: true };
      const { withCurrent: out, againstCurrent: back } = parallelLegs(current);
      if (tt <= out) return { d: tt / out, done: false };
      return { d: 1 - (tt - out) / back, done: false };
    }
    function posPerp(tt) {
      if (tt >= tPerp) return { d: 0, done: true };
      const half = tPerp / 2;
      return { d: tt <= half ? tt / half : 1 - (tt - half) / half, done: false };
    }
    const pPar = posPar(tau), pPerp = posPerp(tau);

    // traseul perpendicular (in sus)
    const ay = cy - (cy - h * 0.12) * pPerp.d;
    ctx.strokeStyle = COL.ok; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, ay); ctx.stroke();
    ctx.fillStyle = COL.ok;
    ctx.beginPath(); ctx.arc(cx, ay, 6, 0, TAU); ctx.fill();

    // traseul paralel
    const bx = cx + L * pPar.d;
    ctx.strokeStyle = COL.beamB; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx, cy + 16); ctx.lineTo(bx, cy + 16); ctx.stroke();
    ctx.fillStyle = COL.beamB;
    ctx.beginPath(); ctx.arc(bx, cy + 16, 6, 0, TAU); ctx.fill();

    // etichete si cronometre, pe fundal propriu: sagetile curentului trec pe sub ele
    ctx.font = `12px ${MONO}`;
    const label = (txt, x, y, col) => {
      const tw = ctx.measureText(txt).width;
      ctx.fillStyle = "rgba(14,18,24,.94)";
      ctx.fillRect(x - 5, y - 13, tw + 10, 18);
      ctx.fillStyle = col;
      ctx.fillText(txt, x, y);
    };
    const ro = (x, d) => x.toFixed(d).replace(".", ",");
    label(morph ? "fascicul perpendicular" : "traversează", cx + 14, h * 0.16, COL.ok);
    label(`t = ${ro(tPerp, 2)}`, cx + 14, h * 0.16 + 18, COL.ok);
    const leg = pPar.done ? "" : (tau <= parallelLegs(current).withCurrent ? "  → cu curentul, rapid" : "  ← contra curentului, lent");
    label((morph ? "fascicul paralel" : "cu curentul, apoi înapoi contra lui") + (current > 0.01 ? leg : ""),
          cx + 14, cy + 46, COL.beamB);
    label(tPar === Infinity ? "t = ∞" : `t = ${ro(tPar, 2)}`, cx + 14, cy + 64, COL.beamB);

    const diff = tPar - tPerp;
    label(diff > 0.005 ? `diferență: ${ro(diff, 3)}` : "se întorc simultan",
          cx + 14, h - 14, diff > 0.005 ? COL.warn : COL.fg3);
  }

  return {
    draw,
    setCurrent(v) { current = v; t = 0; },
    getCurrent() { return current; },
    setMorph(v) { morph = v; },
    getMorph() { return morph; },
    toggle() { running = !running; return running; }
  };
}

/* ─── Aparatul in rotatie ─────────────────────────────────────────── */
export function makeApparatus(cv) {
  const noise = Array.from({ length: 400 }, () => (Math.random() - 0.5) * 2);

  function draw() {
    const { ctx, w, h } = surface(cv, 0.42);
    ctx.fillStyle = COL.panel; ctx.fillRect(0, 0, w, h);
    const ang = state.rotationAngle;
    const dn0 = state.predictedShift;

    // stanga: placa care se roteste
    const cx = w * 0.23, cy = h * 0.5, R = Math.min(w * 0.17, h * 0.36);
    ctx.strokeStyle = "#17232b"; ctx.lineWidth = 1;
    for (let i = 1; i < 7; i++) {
      const y = h * i / 7;
      ctx.beginPath(); ctx.moveTo(8, y); ctx.lineTo(w * 0.45, y); ctx.stroke();
    }
    ctx.fillStyle = COL.fg3; ctx.font = `11px ${MONO}`;
    ctx.fillText("vânt de eter ipotetic  v →", 10, 16);

    ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
    ctx.strokeStyle = COL.line2; ctx.lineWidth = 1.2;
    ctx.strokeRect(-R, -R, 2 * R, 2 * R);
    ctx.fillStyle = "rgba(255,176,74,.03)"; ctx.fillRect(-R, -R, 2 * R, 2 * R);
    ctx.strokeStyle = COL.beamA; ctx.lineWidth = 1.6; ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(R - 10, 0);
    ctx.moveTo(0, 0); ctx.lineTo(0, -(R - 10));
    ctx.stroke(); ctx.globalAlpha = 1;
    ctx.fillStyle = "#dde4e9";
    ctx.fillRect(R - 12, -11, 4, 22);
    ctx.fillRect(-11, -(R - 8), 22, 4);
    ctx.save(); ctx.rotate(-Math.PI / 4);
    ctx.strokeStyle = COL.beamA; ctx.globalAlpha = 0.65; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(10, 0); ctx.stroke();
    ctx.restore();
    ctx.restore();

    // dreapta: graficul. Axa verticala = cat s-au MUTAT franjele, nu cata lumina e.
    const gx = w * 0.56, gw = w * 0.40, gy = h * 0.24, gh = h * 0.54;
    const RANGE = 0.25;                               // scara: ±0,25 franje
    const mid = gy + gh / 2, sc = (gh / 2 - 6) / RANGE;
    const clamp = v => Math.max(-RANGE, Math.min(RANGE, v));
    ctx.strokeStyle = "#161f26"; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(gx, mid); ctx.lineTo(gx + gw, mid);
    ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + gh);
    ctx.stroke();
    ctx.fillStyle = COL.fg3; ctx.font = `10px ${MONO}`;
    ctx.textAlign = "right";
    ctx.fillText("+0,25", gx - 6, gy + 8);
    ctx.fillText("0", gx - 6, mid + 3);
    ctx.fillText("−0,25", gx - 6, gy + gh + 2);
    ctx.textAlign = "center";
    ["0°", "90°", "180°", "270°", "360°"].forEach((s, i) => ctx.fillText(s, gx + gw * i / 4, gy + gh + 18));
    ctx.fillText("unghiul de rotire a aparatului", gx + gw / 2, gy + gh + 36);
    ctx.save();
    ctx.translate(gx - 46, mid); ctx.rotate(-Math.PI / 2);
    ctx.fillText("deplasarea franjelor", 0, 0);
    ctx.restore();
    ctx.textAlign = "left";

    ctx.strokeStyle = COL.beamB; ctx.lineWidth = 1.8; ctx.beginPath();
    for (let x = 0; x <= gw; x++) {
      const y = mid - clamp(predictedSwing(dn0, x / gw * TAU)) * sc;
      x ? ctx.lineTo(gx + x, y) : ctx.moveTo(gx, y);
    }
    ctx.stroke();
    ctx.strokeStyle = COL.ok; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let x = 0; x <= gw; x++) {
      const n = noise[Math.floor(x / gw * noise.length) % noise.length];
      const y = mid - n * OBSERVED_1887_UPPER_BOUND * 0.45 * sc;
      x ? ctx.lineTo(gx + x, y) : ctx.moveTo(gx, y);
    }
    ctx.stroke();

    let frac = (ang / TAU) % 1; if (frac < 0) frac += 1;
    const px = gx + gw * frac;
    ctx.strokeStyle = COL.line2; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(px, gy); ctx.lineTo(px, gy + gh); ctx.stroke();
    ctx.fillStyle = COL.beamB;
    ctx.beginPath(); ctx.arc(px, mid - clamp(predictedSwing(dn0, ang)) * sc, 3.5, 0, TAU); ctx.fill();

    // legenda, cu latimi masurate: nu se mai suprapune
    ctx.font = `10px ${MONO}`;
    let lx = gx;
    for (const [col, txt] of [[COL.beamB, "predicția eterului"], [COL.ok, "măsurat în 1887"]]) {
      ctx.fillStyle = col; ctx.fillRect(lx, gy - 22, 14, 2);
      ctx.fillStyle = COL.fg2; ctx.fillText(txt, lx + 20, gy - 17);
      lx += 20 + ctx.measureText(txt).width + 24;
    }
  }
  return { draw };
}

/* ─── Split-screen: predictie vs observatie ───────────────────────── */
export function makeSplit(cv) {
  const PS = 140;
  const off = document.createElement("canvas");
  off.width = off.height = PS;
  const octx = off.getContext("2d", { alpha: false });
  const img = octx.createImageData(PS, PS);
  const col = wavelengthRGB(589.3);
  let revealed = false;

  function patch(shiftFringes) {
    const d = img.data, hh = PS / 2, dd = 8 * 589.3 / 2 + shiftFringes * 589.3 / 2;
    for (let y = 0; y < PS; y++) for (let x = 0; x < PS; x++) {
      const dx = (x - hh) / hh, dy = (y - hh) / hh;
      const r = Math.sqrt(dx * dx + dy * dy);
      let I = Math.pow(0.5 + 0.5 * Math.cos(2 * TAU * dd / 589.3 * Math.cos(r * 0.75)), 1.3);
      I *= Math.max(0, 1 - Math.pow(r, 6) * 0.7);
      const i = (y * PS + x) * 4;
      d[i] = Math.min(255, col[0] * 255 * I);
      d[i + 1] = Math.min(255, col[1] * 255 * I);
      d[i + 2] = Math.min(255, col[2] * 255 * I);
      d[i + 3] = 255;
    }
    octx.putImageData(img, 0, 0);
    return off;
  }

  function draw() {
    const { ctx, w, h } = surface(cv, 0.42);
    ctx.fillStyle = COL.panel; ctx.fillRect(0, 0, w, h);
    const size = Math.min(w * 0.36, h * 0.66);
    const y = h * 0.16;
    const xs = [w * 0.5 - size - 14, w * 0.5 + 14];
    const shifts = [shiftSinceStart(state.predictedShift, state.rotationAngle),
                    OBSERVED_1887_UPPER_BOUND * 0.6 * Math.sin(state.rotationAngle * 3)];
    const labels = ["PREDICȚIE · modelul eterului", "OBSERVAȚIE · 1887"];
    const cols = [COL.beamB, COL.ok];

    for (let k = 0; k < 2; k++) {
      if (k === 1 && !revealed) {
        ctx.fillStyle = "#0a0e13"; ctx.fillRect(xs[k], y, size, size);
        ctx.strokeStyle = COL.line2; ctx.setLineDash([4, 5]);
        ctx.strokeRect(xs[k] + 0.5, y + 0.5, size, size); ctx.setLineDash([]);
        ctx.fillStyle = COL.fg3; ctx.font = `12px ${MONO}`;
        ctx.textAlign = "center";
        ctx.fillText("se vede după rotire", xs[k] + size / 2, y + size / 2 + 4);
        ctx.textAlign = "left";
      } else {
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(patch(shifts[k]), 0, 0, PS, PS, xs[k], y, size, size);
        ctx.strokeStyle = "rgba(255,255,255,.22)"; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(xs[k] + size / 2, y); ctx.lineTo(xs[k] + size / 2, y + size);
        ctx.moveTo(xs[k], y + size / 2); ctx.lineTo(xs[k] + size, y + size / 2);
        ctx.stroke();
      }
      ctx.strokeStyle = COL.line; ctx.lineWidth = 1;
      ctx.strokeRect(xs[k] - 0.5, y - 0.5, size + 1, size + 1);
      ctx.fillStyle = cols[k]; ctx.font = `11px ${MONO}`;
      ctx.fillText(labels[k], xs[k], y - 10);
      if (k === 0 || revealed) {
        ctx.fillStyle = COL.fg2;
        ctx.fillText(`s-au mutat cu ${Math.abs(shifts[k]).toFixed(2).replace(".", ",")} franje de la start`, xs[k], y + size + 20);
      }
    }
  }

  return { draw, reveal() { revealed = true; }, hide() { revealed = false; }, get revealed() { return revealed; } };
}
