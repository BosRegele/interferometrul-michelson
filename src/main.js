// Firul care leaga totul: comenzile scriu in stare, starea redeseneaza tot.
import { state, set, subscribe, reset, SODIUM } from "./state.js";
import { TAU, toDegrees } from "./physics/phase.js";
import { quarterWave, displacementFromFringes } from "./physics/opticalPath.js";
import { GASES } from "./physics/refractiveIndex.js";
import { makeHeroWaves } from "./sims/heroWaves.js";
import { makeBuilder, BUILD_STEPS } from "./sims/builder.js";
import { mountChain } from "./sims/chain.js";
import { makeFringes, drawProfile, drawCoherenceLadder } from "./sims/fringes.js";
import { makeGasCell } from "./sims/gasCell.js";
import { makeRiver, makeApparatus, makeSplit } from "./sims/ether.js";
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
function loop() {
  if (playing) for (const j of jobs) if (j.visible) j.fn();
  requestAnimationFrame(loop);
}

/* ── HERO: paradoxul ────────────────────────────────────────────── */
const hero = makeHeroWaves($("heroCv"));
const heroPhase = $("heroPhase");
function heroSync() {
  const deg = +heroPhase.value;
  hero.setPhase(deg * Math.PI / 180);
  $("heroPhaseV").textContent = deg + "°";
  const I = Math.pow(Math.cos(deg * Math.PI / 360), 2);
  $("heroVerdict").textContent =
    I > 0.97 ? "lumină maximă" : I < 0.03 ? "întuneric total" : `${Math.round(I * 100)}% din lumină`;
  $("heroVerdict").className = "verdict " + (I < 0.03 ? "dark" : I > 0.97 ? "bright" : "");
}
heroPhase.addEventListener("input", heroSync);
heroSync();
every($("heroCv"), hero.draw);

/* ── BUILD: pas cu pas ──────────────────────────────────────────── */
const builder = makeBuilder($("buildCv"));
function buildSync() {
  const s = BUILD_STEPS[builder.step];
  $("buildTitle").textContent = s.title;
  $("buildText").textContent = s.text;
  $("buildCount").textContent = (builder.step + 1) + " / " + builder.count;
  $("buildPrev").disabled = builder.step === 0;
  $("buildNext").disabled = builder.step === builder.count - 1;
  [...document.querySelectorAll(".bdot")].forEach((d, i) =>
    d.classList.toggle("on", i <= builder.step));
}
$("buildNext").addEventListener("click", () => { builder.step = builder.step + 1; buildSync(); });
$("buildPrev").addEventListener("click", () => { builder.step = builder.step - 1; buildSync(); });
document.querySelectorAll(".bdot").forEach((d, i) =>
  d.addEventListener("click", () => { builder.step = i; buildSync(); }));
buildSync();
every($("buildCv"), builder.draw);

/* ── CHAIN: lantul cauzal ───────────────────────────────────────── */
const chainFrame = mountChain($("chain"));
const chainSlider = $("chainMirror");
chainSlider.addEventListener("input", () => set({ mirrorDisplacement: +chainSlider.value }));
$("chainQuarter").addEventListener("click", () => {
  set({ mirrorDisplacement: quarterWave(state.lambda) });
  chainSlider.value = state.mirrorDisplacement;
});
$("chainZero").addEventListener("click", () => {
  set({ mirrorDisplacement: 0 });
  chainSlider.value = 0;
});
every($("chain"), chainFrame);

/* ── FRINGES: laboratorul ───────────────────────────────────────── */
const fringes = makeFringes($("fringeCv"));
const profile = $("profileCv");
let fringeDirty = true, refineT = 0;
const markDirty = () => { fringeDirty = true; };

const ctlLambda = $("ctlLambda"), ctlArm = $("ctlArm"), ctlTilt = $("ctlTilt"), ctlBand = $("ctlBand");
ctlLambda.addEventListener("input", () => { set({ lambda: +ctlLambda.value }); markDirty(); });
ctlArm.addEventListener("input", () => { set({ armDifference: +ctlArm.value }); markDirty(); });
ctlTilt.addEventListener("input", () => { set({ tilt: +ctlTilt.value }); markDirty(); });
ctlBand.addEventListener("input", () => { set({ bandwidthSlider: +ctlBand.value }); markDirty(); });

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
  $("ctlBandWrap").classList.toggle("off", state.whiteLight);
  if (state.whiteLight && state.armDifference > 2400) {
    set({ armDifference: 900 });
    ctlArm.value = 900;
  }
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
      refineT = setTimeout(() => { fringes.draw(false); }, 150);
    }
  } else if (fringes.getMicro()) {
    fringes.draw(false);
  }
});

/* ── MEASURE: rigla ─────────────────────────────────────────────── */
const measureSlider = $("measureMirror");
measureSlider.addEventListener("input", () => set({ mirrorDisplacement: +measureSlider.value }));
$("measureZero").addEventListener("click", () => set({ fringeZero: state.mirrorDisplacement }));
let scanning = false, scanDir = 1;
$("measureScan").addEventListener("click", () => {
  scanning = !scanning;
  $("measureScan").setAttribute("aria-pressed", String(scanning));
  $("measureScan").textContent = scanning ? "Oprește" : "Scanează";
});
every($("measureCounter"), () => {
  if (!scanning) return;
  let v = state.mirrorDisplacement + scanDir * 24;
  if (v > 6000) { v = 6000; scanDir = -1; }
  if (v < 0) { v = 0; scanDir = 1; }
  set({ mirrorDisplacement: v });
  measureSlider.value = v;
});

/* ── MATTER: tubul cu gaz ───────────────────────────────────────── */
const gasCell = makeGasCell($("gasCv"));
$("gasLen").addEventListener("input", e => set({ gasLength: +e.target.value / 100 }));
for (const [id, key] of [["gasAir", "air"], ["gasCO2", "co2"], ["gasHe", "he"]]) {
  $(id).addEventListener("click", () => {
    gasCell.setGas(key);
    set({ refractiveIndex: 1 + GASES[key].n1 });
    ["gasAir", "gasCO2", "gasHe"].forEach(x =>
      $(x).setAttribute("aria-pressed", String(x === id)));
  });
}
$("gasPump").addEventListener("click", () => gasCell.pump());
$("gasFill").addEventListener("click", () => gasCell.fill());
every($("gasCv"), gasCell.draw);

/* ── ETHER: raul, aparatul, split-screen ────────────────────────── */
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
  $("riverMorph").textContent = v ? "Înapoi la apă" : "Traduce în lumină și eter";
});
every($("riverCv"), river.draw);

const apparatus = makeApparatus($("mmCv"));
const split = makeSplit($("splitCv"));
$("armLen").addEventListener("input", e => set({ armLength: +e.target.value }));
$("etherV").addEventListener("input", e => set({ etherSpeed: +e.target.value * 1000 }));
let rotating = false;
$("rotateBtn").addEventListener("click", () => {
  rotating = true;
  $("rotateBtn").disabled = true;
  $("rotateBtn").textContent = "se rotește...";
});
$("revealBtn").addEventListener("click", () => {
  split.reveal();
  $("revealBtn").hidden = true;
  $("resultText").hidden = false;
});
every($("mmCv"), () => {
  if (rotating) {
    set({ rotationAngle: state.rotationAngle + 0.012 });
    if (state.rotationAngle >= Math.PI / 2) {
      rotating = false;
      $("rotateBtn").disabled = false;
      $("rotateBtn").textContent = "Mai rotește 90°";
      $("revealBtn").hidden = split.revealed;
    }
  }
  apparatus.draw();
});
every($("splitCv"), split.draw);

/* ── figura din 1887: original / explicat ───────────────────────── */
const figNotes = $("figNotes");
$("figOriginal")?.addEventListener("click", () => {
  figNotes.hidden = true;
  $("figOriginal").setAttribute("aria-pressed", "true");
  $("figExplained").setAttribute("aria-pressed", "false");
});
$("figExplained")?.addEventListener("click", () => {
  figNotes.hidden = false;
  $("figOriginal").setAttribute("aria-pressed", "false");
  $("figExplained").setAttribute("aria-pressed", "true");
});

/* ── panouri statice ────────────────────────────────────────────── */
function drawStatic() { drawCoherenceLadder($("cohCv")); }
addEventListener("resize", () => { drawStatic(); markDirty(); });
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
    measureCounterV: fmt(Math.abs(s.fringesPassed), 1),
    measureDx: fmt(Math.abs(s.mirrorDisplacement - s.fringeZero)) + " nm",
    measureCheck: fmt(Math.abs(displacementFromFringes(s.fringesPassed, s.lambda))) + " nm",
    ctlLambdaV: fmt(s.lambda, 0) + " nm",
    ctlArmV: fmt(s.armDifference / 1000, 2) + " µm",
    ctlTiltV: fmt(s.tilt, 0) + " µrad",
    ctlBandV: s.sourceName,
    ctlLc: s.coherenceLength > 1e6 ? fmt(s.coherenceLength / 1e6, 1) + " mm" : fmt(s.coherenceLength / 1000, 1) + " µm",
    gasLenV: fmt(s.gasLength * 100) + " cm",
    gasTotal: fmt(gasCell.total(), 1) + " franje",
    armLenV: fmt(s.armLength) + " m",
    etherVV: fmt(s.etherSpeed / 1000, 0) + " km/s",
    predShift: fmt(s.predictedShift, 2)
  };
  for (const k in txt) { const el = $(k); if (el) el.textContent = txt[k]; }

  const v = $("chainVerdict");
  if (v) v.className = "verdict " + (s.intensity < 0.03 ? "dark" : s.intensity > 0.97 ? "bright" : "");
  if (chainSlider && +chainSlider.value !== s.mirrorDisplacement) chainSlider.value = s.mirrorDisplacement;
  if (measureSlider && +measureSlider.value !== s.mirrorDisplacement) measureSlider.value = s.mirrorDisplacement;
  if (ctlLambda && +ctlLambda.value !== s.lambda) ctlLambda.value = s.lambda;
  if (ctlArm && +ctlArm.value !== s.armDifference) ctlArm.value = s.armDifference;
  if (drawer) drawer.render();
  markDirty();
});

/* ── interfata ──────────────────────────────────────────────────── */
initNav();
initProgress();
initPresenter({
  togglePlay: () => { playing = !playing; },
  afterReset: () => { modeSync(); buildSync(); markDirty(); }
});
initChallenge($("challenges"), () => { modeSync(); markDirty(); });
$("resetBtn")?.addEventListener("click", () => { reset(); modeSync(); markDirty(); });

if (reduced) {
  hero.draw(); builder.draw(); chainFrame(); fringes.draw(false);
  drawProfile(profile); gasCell.draw(); river.draw(); apparatus.draw(); split.draw();
} else {
  requestAnimationFrame(loop);
}
