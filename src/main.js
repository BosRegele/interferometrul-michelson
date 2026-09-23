// Firul care leaga totul: comenzile scriu in stare, starea redeseneaza tot.
import { state, set, subscribe, reset } from "./state.js";
import { toDegrees } from "./physics/phase.js";
import { quarterWave } from "./physics/opticalPath.js";
import { GASES } from "./physics/refractiveIndex.js";
import { normalizedIntensity } from "./physics/interference.js";
import { makeHeroWaves } from "./sims/heroWaves.js";
import { makeBuilder, BUILD_STEPS } from "./sims/builder.js";
import { mountChain } from "./sims/chain.js";
import { makeFringes, drawProfile } from "./sims/fringes.js";
import { makeGasCell } from "./sims/gasCell.js";
import { makeRiver, makeApparatus, makeSplit } from "./sims/ether.js";
import { makeEtherZoom, ZOOM_STAGES, drawPhaseState, drawRotationRoles } from "./sims/story.js";
import { makeHeroField } from "./sims/heroField.js";
import { initNav, initProgress, initDrawer, initPresenter, initChallenge, fmt } from "./ui.js";

const $ = id => document.getElementById(id);
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ── planificator: un singur rAF, doar pentru ce e pe ecran ──────── */
const jobs = [];
function every(el, fn) {
  const job = { fn, visible: true };
  jobs.push(job);
  if ("IntersectionObserver" in window && el) {
    new IntersectionObserver(e => { job.visible = e[0].isIntersecting; },
      { rootMargin: "160px" }).observe(el);
  }
  return job;
}
let playing = !reduced;
const failed = new Set();
function runJobs(onlyVisible) {
  for (const j of jobs) {
    if (onlyVisible && !j.visible) continue;
    try { j.fn(); }
    catch (err) {
      // o simulare stricata nu are voie sa opreasca restul paginii
      if (!failed.has(j)) { failed.add(j); console.error(err); }
    }
  }
}
function loop() {
  requestAnimationFrame(loop);          // programat primul: bucla supravietuieste oricarei erori
  if (playing) runJobs(true);
}
/* O redesenare completa, independenta de animatie. Folosita la redimensionare,
   la deschiderea unui acordeon, la tiparire si cand animatia e oprita
   (prefers-reduced-motion sau pauza din Presenter Mode). */
let redrawPending = false;
function redrawSoon() {
  if (redrawPending) return;
  redrawPending = true;
  setTimeout(() => { redrawPending = false; runJobs(false); }, 0);
}

/* butoanele de tip „du-ma la" */
document.querySelectorAll("[data-goto]").forEach(b =>
  b.addEventListener("click", () =>
    $(b.dataset.goto)?.scrollIntoView({ behavior: "smooth", block: "start" })));

/* ── hero: campul de franje care reactioneaza la mouse ──────────── */
const heroField = makeHeroField($("heroField"));
every($("heroField"), heroField.draw);

/* ── 02 · zoom: sistem solar -> Pamant -> laborator ─────────────── */
const zoom = makeEtherZoom($("zoomCv"));
function zoomSync() {
  $("zoomName").textContent = ZOOM_STAGES[zoom.stage].name;
  $("zoomNote").textContent = ZOOM_STAGES[zoom.stage].note;
  [0, 1, 2].forEach(i => $("zoom" + i).setAttribute("aria-pressed", String(i === zoom.stage)));
}
[0, 1, 2].forEach(i => $("zoom" + i).addEventListener("click", () => { zoom.stage = i; zoomSync(); }));
zoomSync();
every($("zoomCv"), zoom.draw);

/* ── 04 · raul ──────────────────────────────────────────────────── */
const river = makeRiver($("riverCv"));
$("riverCurrent").addEventListener("input", e => {
  const v = +e.target.value / 100;
  river.setCurrent(v);
  $("riverCurrentV").textContent = v === 0 ? "fără curent" : Math.round(v * 100) + "% din viteza înotătorului";
});
$("riverMorph").addEventListener("click", () => {
  const v = !river.getMorph();
  river.setMorph(v);
  $("riverMorph").setAttribute("aria-pressed", String(v));
  $("riverMorph").textContent = v ? "← Înapoi la apă" : "Transformă apa în eter →";
});
every($("riverCv"), river.draw);

/* ── 06–08 · construirea, recombinarea, suprapunerea ────────────── */
const builder = makeBuilder($("buildCv"));
function buildSync() {
  const s = BUILD_STEPS[builder.step];
  $("buildTitle").textContent = s.title;
  $("buildText").textContent = s.text;
  $("buildCount").textContent = (builder.step + 1) + " / " + builder.count;
  $("buildPrev").disabled = builder.step === 0;
  $("buildNext").disabled = builder.step === builder.count - 1;
  document.querySelectorAll(".bdot").forEach((d, i) => d.classList.toggle("on", i <= builder.step));
}
$("buildNext").addEventListener("click", () => { builder.step = builder.step + 1; buildSync(); });
$("buildPrev").addEventListener("click", () => { builder.step = builder.step - 1; buildSync(); });
document.querySelectorAll(".bdot").forEach((d, i) => {
  const go = () => { builder.step = i; buildSync(); };
  d.addEventListener("click", go);
  d.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
});
buildSync();
every($("buildCv"), builder.draw);


const superpose = makeBuilder($("superposeCv"));
superpose.step = 5;                      // suprapuse
every($("superposeCv"), superpose.draw);

/* ── 09 · faza: trei stari obligatorii + cursorul ───────────────── */
let phaseT = 0;
const phaseStates = [["ph0", 0], ["ph90", Math.PI / 2], ["ph180", Math.PI]];
every($("ph0"), () => {
  phaseT += 0.035;
  for (const [id, phi] of phaseStates) drawPhaseState($(id), phi, phaseT);
});

const hero = makeHeroWaves($("heroCv"));
const heroPhase = $("heroPhase");
function heroSync() {
  const deg = +heroPhase.value;
  hero.setPhase(deg * Math.PI / 180);
  $("heroPhaseV").textContent = deg + "°";
  const I = normalizedIntensity(deg * Math.PI / 180);
  const word = I > 0.97 ? "lumină maximă" : I < 0.03 ? "lumină minimă" : Math.round(I * 100) + "% din lumină";
  const kind = I > 0.97 ? "constructiv" : I < 0.03 ? "distructiv" : "parțial";
  $("heroVerdict").textContent = word;
  $("heroVerdict").className = "verdict " + (I < 0.03 ? "dark" : I > 0.97 ? "bright" : "");
  $("heroVerdictTag").textContent = kind;
}
heroPhase.addEventListener("input", heroSync);
document.querySelectorAll("[data-phase]").forEach(b =>
  b.addEventListener("click", () => { heroPhase.value = b.dataset.phase; heroSync(); }));
heroSync();
every($("heroCv"), hero.draw);

/* ── 10 · lantul cauzal ─────────────────────────────────────────── */
const chainFrame = mountChain($("chain"));
const chainSlider = $("chainMirror");
chainSlider.addEventListener("input", () => set({ mirrorDisplacement: +chainSlider.value }));
$("chainQuarter").addEventListener("click", () => set({ mirrorDisplacement: quarterWave(state.lambda) }));
$("chainZero").addEventListener("click", () => set({ mirrorDisplacement: 0 }));
every($("chain"), chainFrame);

/* ── 12 · franjele ──────────────────────────────────────────────── */
const fringes = makeFringes($("fringeCv"));
const profile = $("profileCv");
let fringeDirty = true, refineT = 0;
const markDirty = () => { fringeDirty = true; };

const ctlLambda = $("ctlLambda"), ctlArm = $("ctlArm"), ctlTilt = $("ctlTilt");
ctlLambda.addEventListener("input", () => set({ lambda: +ctlLambda.value }));
ctlArm.addEventListener("input", () => set({ armDifference: +ctlArm.value }));
ctlTilt.addEventListener("input", () => set({ tilt: +ctlTilt.value }));

$("modeScreen").addEventListener("click", () => { fringes.setMode("screen"); modeSync(); });
$("modePoint").addEventListener("click", () => { fringes.setMode("point"); modeSync(); });
$("modeWhite").addEventListener("click", () => { set({ whiteLight: !state.whiteLight }); modeSync(); });
$("modeMicro").addEventListener("click", () => { fringes.setMicro(!fringes.getMicro()); modeSync(); });
function modeSync() {
  $("modeScreen").setAttribute("aria-pressed", String(fringes.getMode() === "screen"));
  $("modePoint").setAttribute("aria-pressed", String(fringes.getMode() === "point"));
  $("modeWhite").setAttribute("aria-pressed", String(state.whiteLight));
  $("modeMicro").setAttribute("aria-pressed", String(fringes.getMicro()));
  $("ctlLambdaWrap").classList.toggle("off", state.whiteLight);
  if (state.whiteLight && state.armDifference > 2400) set({ armDifference: 900 });
  markDirty();
}
modeSync();
every($("fringeCv"), () => {
  fringes.tick();
  if (fringeDirty) {
    const quick = state.whiteLight;
    fringes.draw(quick);
    drawProfile(profile);
    fringeDirty = false;
    if (quick) {
      clearTimeout(refineT);
      refineT = setTimeout(() => fringes.draw(false), 150);
    }
  } else if (fringes.getMicro()) {
    fringes.draw(false);
  }
});

/* ── 14 · rolurile bratelor la rotire ───────────────────────────── */
let rolesRotated = false;
function rolesSync() {
  drawRotationRoles($("rolesCv"), rolesRotated);
  $("rolesTag").textContent = rolesRotated ? "după rotirea cu 90°" : "înainte de rotire";
  $("rolesToggle").textContent = rolesRotated ? "Înapoi la poziția inițială" : "Rotește cu 90°";
}
$("rolesToggle").addEventListener("click", () => { rolesRotated = !rolesRotated; rolesSync(); });

/* ── 15 · prezice inainte de rezultat ───────────────────────────── */
const ACK = [
  "Asta spunea fizica clasică. Rezultatul real e mai jos.",
  "O intuiție prudentă. Rezultatul real e mai jos.",
  "Contra teoriei vremii. Rezultatul real e mai jos."
];
document.querySelectorAll("#predictGuess [data-guess]").forEach(b =>
  b.addEventListener("click", () => {
    document.querySelectorAll("#predictGuess [data-guess]").forEach(o => {
      o.classList.toggle("picked", o === b);
    });
    $("predictAck").hidden = false;
    $("predictAck").textContent = ACK[+b.dataset.guess];
    $("revealBtn").dataset.ready = "1";
  }));

/* ── 16 · aparatul in rotatie, predictie vs 1887 ────────────────── */
const apparatus = makeApparatus($("mmCv"));
const split = makeSplit($("splitCv"));
$("armLen").addEventListener("input", e => set({ armLength: +e.target.value }));
$("etherV").addEventListener("input", e => set({ etherSpeed: +e.target.value * 1000 }));
let rotating = false, rotateTarget = 0;
function rotationDone() {
  $("rotateBtn").disabled = false;
  $("rotateBtn").textContent = "Mai rotește 90°";
  if (!split.revealed) $("revealBtn").hidden = false;
}
$("rotateBtn").addEventListener("click", () => {
  if (reduced) {                         // fara animatie: sare direct la pozitia finala
    set({ rotationAngle: state.rotationAngle + Math.PI / 2 });
    rotationDone();
    return;
  }
  rotateTarget = state.rotationAngle + Math.PI / 2;
  rotating = true;
  $("rotateBtn").disabled = true;
  $("rotateBtn").textContent = "se rotește...";
});
$("revealBtn").addEventListener("click", () => {
  split.reveal();
  $("revealBtn").hidden = true;
});
every($("mmCv"), () => {
  if (rotating) {
    const next = Math.min(rotateTarget, state.rotationAngle + 0.012);
    set({ rotationAngle: next });
    if (next >= rotateTarget) {
      rotating = false;
      rotationDone();
    }
  }
  apparatus.draw();
});
every($("splitCv"), split.draw);

const figNotes = $("figNotes");
$("figOriginal").addEventListener("click", () => {
  figNotes.hidden = true;
  $("figOriginal").setAttribute("aria-pressed", "true");
  $("figExplained").setAttribute("aria-pressed", "false");
});
$("figExplained").addEventListener("click", () => {
  figNotes.hidden = false;
  $("figOriginal").setAttribute("aria-pressed", "false");
  $("figExplained").setAttribute("aria-pressed", "true");
});

/* ── 19 · explore more ──────────────────────────────────────────── */
const gasCell = makeGasCell($("gasCv"));
$("gasLen").addEventListener("input", e => set({ gasLength: +e.target.value / 100 }));
for (const [id, key] of [["gasAir", "air"], ["gasCO2", "co2"], ["gasHe", "he"]]) {
  $(id).addEventListener("click", () => {
    gasCell.setGas(key);
    set({ refractiveIndex: 1 + GASES[key].n1 });
    ["gasAir", "gasCO2", "gasHe"].forEach(x => $(x).setAttribute("aria-pressed", String(x === id)));
  });
}
$("gasPump").addEventListener("click", () => gasCell.pump());
$("gasFill").addEventListener("click", () => gasCell.fill());
every($("gasCv"), gasCell.draw);

/* panourile statice se redeseneaza la redimensionare si la deschiderea unui accordion */
function drawStatic() {
  rolesSync();
}
function relayout() { drawStatic(); markDirty(); redrawSoon(); }
// ResizeObserver prinde orice schimbare de latime: fereastra, acordeoane, tiparire, fonturi incarcate
if ("ResizeObserver" in window) {
  let lastW = 0;
  new ResizeObserver(entries => {
    const w = Math.round(entries[0].contentRect.width);
    if (w !== lastW) { lastW = w; relayout(); }
  }).observe(document.querySelector("main"));
} else {
  addEventListener("resize", relayout);
}
document.querySelectorAll("details").forEach(d =>
  d.addEventListener("toggle", () => { if (d.open) relayout(); }));
addEventListener("beforeprint", () => { drawStatic(); runJobs(false); });
drawStatic();

/* ── citirile numerice, dintr-un singur loc ─────────────────────── */
const drawer = initDrawer();
subscribe(s => {
  const deg = toDegrees(s.phaseDifference) % 360;
  const txt = {
    chainDx: fmt(s.mirrorDisplacement) + " nm",
    chainDx2: fmt(s.mirrorDisplacement) + " nm",
    chainDL: fmt(s.pathDifference) + " nm",
    chainPhi: fmt(s.phaseDifference / Math.PI, 2) + "π = " + fmt(deg, 0) + "°",
    chainLambda: fmt(s.lambda) + " nm",
    chainI: fmt(s.intensity, 2),
    chainVerdict: s.intensity > 0.97 ? "MAXIM" : s.intensity < 0.03 ? "ÎNTUNERIC" : "intermediar",
    ctlLambdaV: fmt(s.lambda, 0) + " nm",
    ctlArmV: fmt(s.armDifference / 1000, 2) + " µm",
    ctlTiltV: fmt(s.tilt, 0) + " µrad",
    gasLenV: fmt(s.gasLength * 100) + " cm",
    gasTotal: fmt(gasCell.total(), 1) + " franje",
    armLenV: fmt(s.armLength) + " m",
    etherVV: fmt(s.etherSpeed / 1000, 0) + " km/s",
    predShift: fmt(s.predictedShift, 2)
  };
  for (const k in txt) { const el = $(k); if (el) el.textContent = txt[k]; }

  const v = $("chainVerdict");
  v.className = "verdict " + (s.intensity < 0.03 ? "dark" : s.intensity > 0.97 ? "bright" : "");
  // cursoarele raman sincronizate cu starea, oricine ar fi schimbat-o
  for (const [el, val] of [[chainSlider, s.mirrorDisplacement], [ctlLambda, s.lambda], [ctlArm, s.armDifference], [ctlTilt, s.tilt]]) {
    if (el && +el.value !== val) el.value = val;
  }
  drawer?.render();
  markDirty();
  if (!playing) redrawSoon();            // fara animatie, starea noua tot trebuie desenata
});

/* ── interfata ──────────────────────────────────────────────────── */
initNav();
initProgress();
initPresenter({
  togglePlay: () => { playing = !playing; },
  afterReset: () => { modeSync(); buildSync(); markDirty(); }
});
initChallenge($("challenges"), () => { modeSync(); markDirty(); });
$("resetBtn").addEventListener("click", () => {
  reset();
  heroPhase.value = 0; heroSync();
  builder.step = 0; buildSync();
  modeSync(); markDirty();
});

redrawSoon();                            // primul cadru, cu sau fara animatie
if (!reduced) requestAnimationFrame(loop);
