// Stratul de interfata: navigatie pe capitole, sertarul de formule,
// Presenter Mode si Challenge Mode. Nu contine fizica.
import { state, set, reset, SODIUM } from "./state.js";
import { TAU, toDegrees } from "./physics/phase.js";
import { pathDiffFromMirror, quarterWave } from "./physics/opticalPath.js";
import { opticalPathLength } from "./physics/refractiveIndex.js";

const fmt = (n, d = 1) => n.toLocaleString("ro-RO", { minimumFractionDigits: d, maximumFractionDigits: d });

/** Deschide orice <details> care ascunde tinta, apoi deruleaza la ea. */
export function reveal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  for (let p = el.parentElement; p; p = p.parentElement) {
    if (p.tagName === "DETAILS" && !p.open) p.open = true;
  }
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ─── Navigatie pe capitole ───────────────────────────────────────── */
export function initNav() {
  const links = [...document.querySelectorAll("[data-chapter]")];
  const chapters = links.map(a => document.getElementById(a.dataset.chapter));

  links.forEach(a => a.addEventListener("click", e => {
    e.preventDefault();
    document.getElementById(a.dataset.chapter)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }));

  if (!("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const i = chapters.indexOf(e.target);
      links.forEach((a, j) => a.setAttribute("aria-current", j === i ? "true" : "false"));
    }
  }, { rootMargin: "-20% 0px -70% 0px" });
  chapters.forEach(c => c && io.observe(c));
}

export function initProgress() {
  const bar = document.getElementById("prog");
  if (!bar) return;
  addEventListener("scroll", () => {
    const d = document.documentElement;
    bar.style.width = (d.scrollTop / Math.max(1, d.scrollHeight - d.clientHeight) * 100) + "%";
  }, { passive: true });
}

/* ─── Sertarul de formule, cu valorile curente ────────────────────── */
export function initDrawer() {
  const drawer = document.getElementById("drawer");
  const btn = document.getElementById("drawerBtn");
  const closeBtn = document.getElementById("drawerClose");
  const body = document.getElementById("drawerBody");
  if (!drawer || !btn) return;

  const open = v => {
    drawer.classList.toggle("open", v);
    btn.setAttribute("aria-expanded", String(v));
    if (v) render();
  };
  btn.addEventListener("click", () => open(!drawer.classList.contains("open")));
  closeBtn?.addEventListener("click", () => open(false));
  addEventListener("keydown", e => { if (e.key === "Escape") open(false); });

  function render() {
    const dx = state.mirrorDisplacement;
    const dL = pathDiffFromMirror(dx);
    const phi = state.phaseDifference;
    const deg = toDegrees(phi) % 360;
    const stateWord = state.intensity > 0.97 ? "maxim"
      : state.intensity < 0.03 ? "minim" : "intermediar";

    const rows = [
      ["δ = 2Δd",
       `δ = 2 · ${fmt(dx)} = ${fmt(dL)} nm`,
       "diferența de drum optic"],
      ["φ = 2πδ/λ",
       `φ = 2π · ${fmt(dL)} / ${fmt(state.lambda)} = ${fmt(phi / Math.PI, 2)}π = ${fmt(deg, 0)}° → ${stateWord}`,
       "faza dintre cele două fascicule"],
      ["I = 4I₀cos²(φ/2)",
       `I / Imax = cos²(${fmt(phi / 2 / Math.PI, 2)}π) = ${fmt(state.intensity, 2)}`,
       "intensitatea la detector"],
      ["N = 2Δx/λ",
       `N = 2 · ${fmt(dx)} / ${fmt(state.lambda)} = ${fmt(state.fringesPassed, 2)} franje`,
       "franje numărate"],
      ["OPL = nL",
       `OPL = ${state.refractiveIndex.toFixed(6)} · ${fmt(state.gasLength * 100)} cm = ${fmt(opticalPathLength(state.refractiveIndex, state.gasLength) * 100, 4)} cm`,
       "drumul optic prin gaz"],
      ["Lc = λ²/Δλ",
       `Lc = ${fmt(state.lambda)}² / ${state.bandwidth < 1 ? state.bandwidth.toFixed(3) : fmt(state.bandwidth, 2)} = ${
         state.coherenceLength > 1e6 ? fmt(state.coherenceLength / 1e6, 1) + " mm"
                                     : fmt(state.coherenceLength / 1000, 1) + " µm"}`,
       "lungimea de coerență"]
    ];

    body.innerHTML = rows.map(([f, sub, cap]) => `
      <div class="frow">
        <span class="ff">${f}</span>
        <span class="fs">${sub}</span>
        <span class="fc">${cap}</span>
      </div>`).join("");
  }

  return { render, open };
}

/* ─── Presenter Mode ──────────────────────────────────────────────── */
const SCENES = [
  ["ch-story", "Întrebarea", "Valurile au apa, sunetul are aerul. Lumina — prin ce?"],
  ["s-ether-idea", "Eterul", "Un mediu invizibil, presupus că umple tot spațiul."],
  ["s-why-earth", "Și pe Pământ", "Universal, nu o atmosferă: Pământul e scufundat în el."],
  ["s-ether-wind", "Vântul de eter", "Ne mișcăm prin el cu 30 km/s, deci ar trebui să-l simțim."],
  ["s-river", "Râul", "Cine înoată în lungul curentului pierde timp."],
  ["s-timing", "Cum cronometrezi lumina", "Nu o cronometrezi. Lași razele să se reîntâlnească."],
  ["ch-apparatus", "Aparatul", "Sursă, lamă separatoare, două brațe, două oglinzi."],
  ["s-recombine", "Recombinarea", "Una reflectată, cealaltă transmisă, spre același detector."],
  ["s-superpose", "Suprapunerea", "Aceeași regiune din spațiu; câmpurile se adună."],
  ["s-phase", "Faza", "Cât de decalate sunt cele două unde."],
  ["s-mirror", "Mișcă oglinda", "Drumul crește, faza se schimbă, franja se mișcă."],
  ["s-two-dx", "Factorul 2", "Dus plus întors: oglinda Δx, drumul 2Δx."],
  ["s-fringes", "Franjele", "Fiecare direcție are propria diferență de drum."],
  ["ch-1887", "Înapoi la eter", "Instrumentul e gata. Acum putem testa ipoteza."],
  ["s-rotate-why", "De ce rotim", "Brațele își schimbă rolurile față de vântul ipotetic."],
  ["s-predict", "Predicția", "Modelul eterului cere aproximativ 0,4 franje."],
  ["s-vs", "1887", "Rotim aparatul și comparăm."],
  ["s-meaning", "Rezultatul", "Efectul așteptat nu a apărut."],
  ["s-einstein", "Contextul", "Un drum de douăzeci de ani, nu un singur experiment."]
];

export function initPresenter(controls = {}) {
  const btn = document.getElementById("presentBtn");
  const bar = document.getElementById("presentBar");
  const title = document.getElementById("presentTitle");
  const line = document.getElementById("presentLine");
  const count = document.getElementById("presentCount");
  if (!btn || !bar) return;

  let on = false, i = 0;

  function show(k) {
    i = (k + SCENES.length) % SCENES.length;
    const [anchor, t, l] = SCENES[i];
    title.textContent = t;
    line.textContent = l;
    count.textContent = (i + 1) + " / " + SCENES.length;
    reveal(anchor);
  }
  function toggle(v) {
    on = v;
    document.body.classList.toggle("presenting", on);
    bar.hidden = !on;
    btn.setAttribute("aria-pressed", String(on));
    if (on) show(0);
  }
  btn.addEventListener("click", () => toggle(!on));
  document.getElementById("presentExit")?.addEventListener("click", () => toggle(false));
  document.getElementById("presentPrev")?.addEventListener("click", () => show(i - 1));
  document.getElementById("presentNext")?.addEventListener("click", () => show(i + 1));

  addEventListener("keydown", e => {
    if (e.key === "Escape" && on) { toggle(false); return; }
    if (!on) return;
    if (e.target.matches("input, textarea")) return;
    if (e.key === "ArrowRight") { show(i + 1); e.preventDefault(); }
    else if (e.key === "ArrowLeft") { show(i - 1); e.preventDefault(); }
    else if (e.key === " ") { controls.togglePlay?.(); e.preventDefault(); }
    else if (e.key === "r" || e.key === "R") { reset(); controls.afterReset?.(); }
  });
}

/* ─── Challenge Mode: prezici, apoi simulatorul demonstreaza ──────── */
export const CHALLENGES = [
  {
    q: "Muți oglinda M2 cu exact λ/4, adică 147 nm. Ce arată detectorul?",
    a: ["Rămâne la fel", "Se stinge complet", "Se dublează", "Clipește de două ori"],
    c: 1,
    why: "λ/4 de oglindă înseamnă λ/2 de drum optic, deci φ = π: cele două unde se anulează punct cu punct.",
    apply: () => set({ mirrorDisplacement: quarterWave(SODIUM) }),
    goto: "s-mirror"
  },
  {
    q: "La φ = π detectorul e negru. Unde s-a dus energia luminii?",
    a: ["S-a transformat în căldură", "S-a pierdut", "A ieșit pe cealaltă față a lamei, înapoi spre sursă", "A fost absorbită de oglinzi"],
    c: 2,
    why: "Interferometrul are două ieșiri, mereu complementare. Ce lipsește dintr-una se regăsește în cealaltă.",
    apply: () => set({ mirrorDisplacement: quarterWave(SODIUM) }),
    goto: "s-mirror"
  },
  {
    q: "Treci de la roșu la albastru, deci λ scade. Ce se întâmplă cu inelele?",
    a: ["Se răresc", "Se îndesesc", "Rămân la fel", "Dispar"],
    c: 1,
    why: "Aceeași diferență de drum acoperă mai multe lungimi de undă, deci mai multe ordine încap pe ecran.",
    apply: () => set({ lambda: 430, armDifference: 6000, whiteLight: false }),
    goto: "s-fringes"
  },
  {
    q: "Pui în brațul mobil un tub de 10 cm cu aer și îl videzi. Franjele...",
    a: ["Nu se mișcă, geometria e neschimbată", "Se mișcă cu vreo 99 de franje", "Dispar complet", "Își schimbă culoarea"],
    c: 1,
    why: "Drumul optic e nL, nu L. Scoțând aerul, drumul scade cu 2(n−1)L — aproape o sută de franje.",
    goto: "gasCv"
  },
  {
    q: "De ce Michelson căuta zeroul cu lampa de sodiu, și nu direct cu lumină albă?",
    a: ["Sodiul e mai luminos", "Lumina albă are franje doar la câțiva µm de zero", "Lumina albă nu dă franje", "Din obișnuință"],
    c: 1,
    why: "Lungimea de coerență a luminii albe e vreo 1,2 µm. Sodiul rezistă sute de micrometri, deci găsești zeroul mult mai ușor.",
    apply: () => set({ whiteLight: true, armDifference: 900 }),
    goto: "s-fringes"
  },
  {
    q: "De ce era esențial ca aparatul din 1887 să fie rotit?",
    a: ["Ca să se încălzească uniform", "Ca să schimbe rolurile celor două brațe față de vântul ipotetic", "Ca să amestece mercurul", "Ca să verifice oglinzile"],
    c: 1,
    why: "O singură poziție nu spune nimic: nu știi diferența de drum de referință. Rotind, efectul ar fi trebuit să se inverseze — asta se putea măsura.",
    goto: "s-rotate-why"
  }
];

export function initChallenge(root, onApply) {
  if (!root) return;
  let score = 0, done = 0;
  const scoreEl = document.getElementById("chScore");

  CHALLENGES.forEach((ch, i) => {
    const box = document.createElement("div");
    box.className = "ch";
    const head = document.createElement("p");
    head.className = "ch-q";
    head.innerHTML = `<i>${String(i + 1).padStart(2, "0")}</i>${ch.q}`;
    box.appendChild(head);

    const opts = document.createElement("div");
    opts.className = "ch-opts";
    ch.a.forEach((txt, j) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "ch-opt"; b.textContent = txt;
      b.addEventListener("click", () => {
        if (box.dataset.done) return;
        box.dataset.done = "1"; done++;
        [...opts.children].forEach((o, k) => {
          if (k === ch.c) o.classList.add("ok");
          else if (o === b) o.classList.add("no");
          o.disabled = true;
        });
        if (j === ch.c) score++;
        const fb = document.createElement("p");
        fb.className = "ch-why";
        fb.textContent = (j === ch.c ? "Corect. " : "Nu. ") + ch.why;
        box.appendChild(fb);

        const act = document.createElement("button");
        act.type = "button"; act.className = "ch-show";
        act.textContent = "Arată-mi în simulator";
        act.addEventListener("click", () => {
          ch.apply?.();
          onApply?.();
          reveal(ch.goto);
        });
        box.appendChild(act);
        if (scoreEl) scoreEl.textContent = `${score} / ${CHALLENGES.length} corecte`;
      });
      opts.appendChild(b);
    });
    box.appendChild(opts);
    root.appendChild(box);
  });
}

export { fmt };
