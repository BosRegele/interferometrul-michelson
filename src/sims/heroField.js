// Campul de franje din hero, calculat pe placa video.
// Fiecare pixel rezolva I = cos^2(pi*delta/lambda) cu delta = 2*d*cos(theta).
// Mouse-ul muta, lin, oglinda: inelele respira pe masura ce misti cursorul.
import { wavelengthRGB } from "./palette.js";

const VS = "attribute vec2 a;void main(){gl_Position=vec4(a,0.0,1.0);}";
const FS = [
  "precision highp float;",
  "uniform vec2 uRes;uniform vec2 uCtr;uniform float uD;uniform float uLam;",
  "uniform float uT;uniform float uFade;uniform vec3 uCol;",
  "float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}",
  "void main(){",
  "  vec2 px=gl_FragCoord.xy;",
  "  vec2 p=(px-uCtr)/min(uRes.x,uRes.y);",
  "  float r=length(p);",
  "  float ph=4.0*3.14159265*uD/uLam*cos(r*0.75);",
  "  float I=pow(0.5+0.5*cos(ph),1.6);",
  "  float fall=exp(-r*r*1.35);",
  "  float grain=(hash(px+vec2(uT))-0.5)*0.014;",          // fara benzi de culoare
  "  vec3 ground=vec3(0.027,0.035,0.051);",                 // exact fundalul paginii
  "  vec3 c=ground+uCol*(I*fall*uFade*0.92)+grain;",
  "  gl_FragColor=vec4(max(c,0.0),1.0);",
  "}"
].join("\n");

export function makeHeroField(cv) {
  const LAM = 589.3;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let gl = null, uni = {}, t = 0, fade = reduced ? 1 : 0;
  let d = 5200, target = 5200, pointer = 0.5;

  try { gl = cv.getContext("webgl", { alpha: false, antialias: false, depth: false }); } catch (e) { gl = null; }
  if (gl) {
    const mk = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };
    const vs = mk(gl.VERTEX_SHADER, VS), fs = mk(gl.FRAGMENT_SHADER, FS);
    const pr = vs && fs ? gl.createProgram() : null;
    if (pr) {
      gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
    }
    if (pr && gl.getProgramParameter(pr, gl.LINK_STATUS)) {
      gl.useProgram(pr);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(pr, "a");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      for (const n of ["uRes", "uCtr", "uD", "uLam", "uT", "uFade", "uCol"]) uni[n] = gl.getUniformLocation(pr, n);
    } else {
      gl = null;
    }
  }

  const host = cv.parentElement;
  host.addEventListener("pointermove", e => {
    const r = host.getBoundingClientRect();
    pointer = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
  });

  function size() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    const w = Math.round((cv.clientWidth || 800) * dpr), h = Math.round((cv.clientHeight || 600) * dpr);
    if (cv.width !== w || cv.height !== h) {
      cv.width = w; cv.height = h;
      if (gl) gl.viewport(0, 0, w, h);
    }
    return { w, h };
  }

  function center(w, h) {
    // pe ecrane late campul sta in dreapta, langa titlu; pe telefon, sus
    return w / h > 1.1 ? [w * 0.74, h * 0.52] : [w * 0.5, h * 0.72];
  }

  function draw() {
    const { w, h } = size();
    t += 1;
    if (fade < 1) fade = Math.min(1, fade + 0.012);
    target = 4200 + pointer * 3600 + (reduced ? 0 : 500 * Math.sin(t * 0.004));
    d += (target - d) * (reduced ? 1 : 0.035);

    if (gl) {
      const [cx, cy] = center(w, h), col = wavelengthRGB(LAM);
      gl.uniform2f(uni.uRes, w, h);
      gl.uniform2f(uni.uCtr, cx, h - cy);                 // WebGL numara de jos in sus
      gl.uniform1f(uni.uD, d);
      gl.uniform1f(uni.uLam, LAM);
      gl.uniform1f(uni.uT, t % 1000);
      gl.uniform1f(uni.uFade, fade);
      gl.uniform3f(uni.uCol, col[0], col[1], col[2]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      return;
    }
    // rezerva fara WebGL: o lumina calda, statica
    const ctx = cv.getContext("2d");
    const [cx, cy] = center(w, h);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.6);
    g.addColorStop(0, "rgba(255,176,74,.22)");
    g.addColorStop(1, "rgba(7,9,13,1)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }

  return { draw, webgl: !!gl };
}
