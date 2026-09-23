// Build Mode: aparatul se construieste pas cu pas.
// Pasul 4 este cel care conteaza: arata separat ca o componenta din A este
// reflectata spre detector si una din B este transmisa spre acelasi detector.
import { COL, MONO } from "./palette.js";
import { state } from "../state.js";
import { TAU } from "../physics/phase.js";

export const BUILD_STEPS = [
  { title: "Sursa", text: "Un singur fascicul pleacă spre centrul mesei. Tot ce urmează se naște din el — de aceea cele două jumătăți vor fi perfect sincronizate." },
  { title: "Lama separatoare", text: "O placă de sticlă cu un strat metalic de câțiva nanometri. Jumătate din lumină trece prin ea, jumătate e reflectată în unghi drept." },
  { title: "Cele două brațe", text: "Fasciculul A urcă spre oglinda fixă M1. Fasciculul B merge spre oglinda mobilă M2. Din acest moment, cele două jumătăți străbat drumuri diferite." },
  { title: "Întoarcerea", text: "Oglinzile le trimit înapoi, pe exact același traseu. Fiecare braț a fost parcurs de două ori — ține minte asta." },
  { title: "Recombinarea", text: "Aici se întâmplă totul. Din fasciculul A, o componentă este transmisă prin lamă spre detector. Din fasciculul B, o componentă este reflectată de lamă spre același detector. Sunt desenate alături doar ca să le poți vedea separat." },
  { title: "Suprapunerea", text: "În realitate ocupă aceeași regiune din spațiu. Câmpurile lor electrice se adună punct cu punct — iar detectorul măsoară pătratul sumei, nu suma pătratelor." }
];

const L = { srcX: 0.08, bsX: 0.44, m2X: 0.86, m1Y: 0.14, axisY: 0.50, detY: 0.90 };

export function makeBuilder(cv) {
  let step = 0, t = 0;

  function geom(w, h) {
    return {
      src: [w * L.srcX, h * L.axisY],
      bs:  [w * L.bsX,  h * L.axisY],
      m1:  [w * L.bsX,  h * L.m1Y],
      m2:  [w * L.m2X,  h * L.axisY],
      det: [w * L.bsX,  h * L.detY]
    };
  }

  function beam(ctx, a, b, col, width, glow) {
    ctx.save();
    if (glow) { ctx.shadowColor = col; ctx.shadowBlur = glow; }
    ctx.strokeStyle = col; ctx.lineWidth = width; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    ctx.restore();
  }

  function packets(ctx, a, b, col, n, phase) {
    for (let i = 0; i < n; i++) {
      const f = (t * 0.005 + phase + i / n) % 1;
      const x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f;
      ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 12; ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(x, y, 3, 0, TAU); ctx.fill(); ctx.restore();
    }
  }

  function label(ctx, x, y, txt, col, size = 12) {
    ctx.fillStyle = col; ctx.font = `${size}px ${MONO}`;
    ctx.fillText(txt, x, y);
  }

  function draw() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = cv.clientWidth || 900, h = Math.round(w * 0.56);
    if (cv.width !== Math.round(w * dpr)) {
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      cv.style.height = h + "px";
    }
    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = COL.panel; ctx.fillRect(0, 0, w, h);
    const g = geom(w, h);
    t += 1;

    // masa optica
    ctx.strokeStyle = "#131b22"; ctx.lineWidth = 1;
    for (let i = 1; i < 8; i++) {
      const y = h * i / 8;
      ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(w - 20, y); ctx.stroke();
    }

    // sursa
    ctx.strokeStyle = COL.beamB; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(g.src[0], g.src[1], 11, 0, TAU); ctx.stroke();
    ctx.fillStyle = COL.beamB;
    ctx.beginPath(); ctx.arc(g.src[0], g.src[1], 4, 0, TAU); ctx.fill();
    label(ctx, g.src[0] - 14, g.src[1] + 32, "SURSĂ", COL.fg2, 11);

    // fasciculul de intrare
    beam(ctx, [g.src[0] + 12, g.src[1]], g.bs, COL.beamB, 2.4, 12);
    packets(ctx, [g.src[0] + 12, g.src[1]], g.bs, COL.beamB, 3, 0);

    if (step >= 1) {
      // lama separatoare, la 45 de grade
      ctx.save();
      ctx.translate(g.bs[0], g.bs[1]); ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = "rgba(127,212,238,.16)"; ctx.fillRect(-24, -4, 48, 8);
      ctx.strokeStyle = COL.beamA; ctx.lineWidth = 1.3; ctx.strokeRect(-24, -4, 48, 8);
      ctx.restore();
      label(ctx, g.bs[0] - 58, g.bs[1] - 16, "LAMĂ", COL.beamA, 11);
    }

    if (step >= 2) {
      beam(ctx, g.bs, g.m1, COL.beamA, 1.9, 10);
      beam(ctx, g.bs, g.m2, COL.beamB, 1.9, 10);
      packets(ctx, g.bs, g.m1, COL.beamA, 2, 0.2);
      packets(ctx, g.bs, g.m2, COL.beamB, 2, 0.45);
      ctx.fillStyle = "#dde4e9";
      ctx.fillRect(g.m1[0] - 26, g.m1[1] - 6, 52, 6);
      ctx.fillRect(g.m2[0], g.m2[1] - 26, 6, 52);
      ctx.fillStyle = "#49555e";
      ctx.fillRect(g.m1[0] - 26, g.m1[1] - 10, 52, 4);
      ctx.fillRect(g.m2[0] + 6, g.m2[1] - 26, 4, 52);
      label(ctx, g.m1[0] - 10, g.m1[1] - 18, "M1", COL.fg, 12);
      label(ctx, g.m2[0] + 14, g.m2[1] - 30, "M2", COL.fg, 12);
      label(ctx, g.bs[0] + 8, g.m1[1] + 52, "A", COL.beamA, 13);
      label(ctx, g.m2[0] - 60, g.bs[1] - 12, "B", COL.beamB, 13);
    }

    if (step >= 3) {
      // fasciculele se intorc, usor decalate ca sa se vada ca sunt drumuri separate
      beam(ctx, [g.m1[0] + 7, g.m1[1]], [g.bs[0] + 7, g.bs[1]], COL.beamA, 1.5, 8);
      beam(ctx, [g.m2[0], g.m2[1] + 7], [g.bs[0], g.bs[1] + 7], COL.beamB, 1.5, 8);
      packets(ctx, [g.m1[0] + 7, g.m1[1]], [g.bs[0] + 7, g.bs[1]], COL.beamA, 2, 0.6);
      packets(ctx, [g.m2[0], g.m2[1] + 7], [g.bs[0], g.bs[1] + 7], COL.beamB, 2, 0.8);
      label(ctx, g.bs[0] + 16, g.m1[1] + 92, "dus și întors", COL.fg3, 10);
    }

    if (step === 4) {
      // momentul-cheie: cele doua componente, desenate ALATURI
      const dx = 26;
      beam(ctx, [g.bs[0] - dx, g.bs[1]], [g.det[0] - dx, g.det[1]], COL.beamA, 2.2, 12);
      beam(ctx, [g.bs[0] + dx, g.bs[1]], [g.det[0] + dx, g.det[1]], COL.beamB, 2.2, 12);
      packets(ctx, [g.bs[0] - dx, g.bs[1]], [g.det[0] - dx, g.det[1]], COL.beamA, 2, 0);
      packets(ctx, [g.bs[0] + dx, g.bs[1]], [g.det[0] + dx, g.det[1]], COL.beamB, 2, 0.5);
      label(ctx, g.bs[0] - dx - 96, g.bs[1] + 54, "A: transmis", COL.beamA, 11);
      label(ctx, g.bs[0] - dx - 96, g.bs[1] + 68, "prin lamă", COL.beamA, 11);
      label(ctx, g.bs[0] + dx + 14, g.bs[1] + 54, "B: reflectat", COL.beamB, 11);
      label(ctx, g.bs[0] + dx + 14, g.bs[1] + 68, "de lamă", COL.beamB, 11);
      ctx.strokeStyle = COL.line2; ctx.setLineDash([3, 4]); ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(g.det[0] - dx, g.det[1]); ctx.lineTo(g.det[0] + dx, g.det[1]);
      ctx.stroke(); ctx.setLineDash([]);
      label(ctx, g.det[0] - 74, g.det[1] + 22, "același detector", COL.fg2, 11);
    }

    if (step >= 5) {
      // suprapuse: acelasi drum, campurile se aduna
      beam(ctx, g.bs, g.det, COL.beamA, 5, 14);
      beam(ctx, g.bs, g.det, COL.beamB, 2.2, 10);
      packets(ctx, g.bs, g.det, COL.result, 3, 0.15);
      label(ctx, g.bs[0] + 16, (g.bs[1] + g.det[1]) / 2, "A + B", COL.result, 12);
    }

    if (step >= 4) {
      // detectorul, cu discul care pulseaza dupa intensitatea reala din stare
      const I = step >= 5 ? state.intensity : 0.5;
      ctx.strokeStyle = COL.ok; ctx.lineWidth = 1.4;
      ctx.strokeRect(g.det[0] - 26, g.det[1] - 12, 52, 24);
      ctx.save(); ctx.shadowColor = COL.ok; ctx.shadowBlur = 24 * I;
      ctx.fillStyle = `rgba(87,214,162,${0.15 + 0.8 * I})`;
      ctx.beginPath(); ctx.arc(g.det[0], g.det[1], 9, 0, TAU); ctx.fill(); ctx.restore();
      label(ctx, g.det[0] + 34, g.det[1] + 4, "DETECTOR", COL.ok, 11);
    }
  }

  return {
    draw,
    get step() { return step; },
    set step(v) { step = Math.max(0, Math.min(BUILD_STEPS.length - 1, v)); },
    count: BUILD_STEPS.length
  };
}
