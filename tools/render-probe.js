/*
 * Render the flower geometry headlessly so it can actually be LOOKED AT.
 *
 * ⚠️ WHY THIS EXISTS. Two renderers were built and shipped without anyone —
 * human or otherwise — seeing them draw. Every test passed, because the tests
 * could only check that the DATA was sane, never that the picture was. This
 * projects the real geometry to 2-D polygons and writes them as JSON; the
 * companion Python script rasterises them to a PNG that can be inspected.
 *
 * It deliberately uses the SAME calls the page uses — P.surfacePoint,
 * P.axisFrame, P.antherPoint, P.stigmaPoint — so what it shows is what the page
 * would show, not a second opinion about the geometry.
 *
 *   node tools/render-probe.js one   > /tmp/one.json    a single flower, big
 *   node tools/render-probe.js field > /tmp/field.json  the ring, as the page draws it
 */

const P = require("../sim/placement.js");
const E = require("../sim/evolve.js");
const I = require("../sim/ibm.js");

const W = 900;
const H = 700;

const vAdd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const vSub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const vMul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const vDot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const vCrs = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const vUnit = (a) => {
  const n = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / n, a[1] / n, a[2] / n];
};

function basis(axisDir, origin) {
  const Wv = vUnit(axisDir);
  const V0 = Math.abs(vDot(Wv, [0, 1, 0])) > 0.9 ? [1, 0, 0] : [0, 1, 0];
  const U = vUnit(vCrs(V0, Wv));
  const V = vUnit(vCrs(Wv, U));
  return { U, V, W: Wv, origin };
}
const toWorld = (b, p) =>
  vAdd(b.origin, [
    p[0] * b.U[0] + p[1] * b.V[0] + p[2] * b.W[0],
    p[0] * b.U[1] + p[1] * b.V[1] + p[2] * b.W[1],
    p[0] * b.U[2] + p[1] * b.V[2] + p[2] * b.W[2],
  ]);
const dirWorld = (b, p) => [
  p[0] * b.U[0] + p[1] * b.V[0] + p[2] * b.W[0],
  p[0] * b.U[1] + p[1] * b.V[1] + p[2] * b.W[1],
  p[0] * b.U[2] + p[1] * b.V[2] + p[2] * b.W[2],
];

/* ⚠️ PITCH IS LOAD-BEARING, not taste. At 0.42 the camera is nearly side-on,
 * the corolla tube bulges nearer than the lobes behind it, and painter's
 * ordering therefore draws the tube OVER every near petal — the flower loses
 * half its bloom and reads as a barrel with three far-side petals. Looking down
 * into the flowers puts the whole ring of lobes around the mouth, which is how
 * a flower bed is actually seen. */
let yaw = 0.5,
  pitch = 0.86,
  camDist = 26,
  camTarget = [0, 1.2, 0],
  scale = 900;

function project(p) {
  const d = vSub(p, camTarget);
  const cy = Math.cos(yaw),
    sy = Math.sin(yaw);
  let x = d[0] * cy + d[2] * sy;
  let z = -d[0] * sy + d[2] * cy;
  const cp = Math.cos(pitch),
    sp = Math.sin(pitch);
  const y = d[1] * cp - z * sp;
  z = d[1] * sp + z * cp;
  const zv = z + camDist;
  if (zv < 0.05) return null;
  return {
    x: W / 2 + (scale * x) / zv,
    y: H / 2 - (scale * y) / zv,
    z: zv,
    s: scale / zv,
  };
}
const camForward = () => {
  const cy = Math.cos(yaw),
    sy = Math.sin(yaw),
    cp = Math.cos(pitch),
    sp = Math.sin(pitch);
  return [-cp * sy, sp, cp * cy];
};

const items = [];
function poly(pts, col) {
  const ps = pts.map(project);
  if (ps.some((q) => !q)) return;
  items.push({
    z: ps.reduce((a, q) => a + q.z, 0) / ps.length,
    pts: ps.map((q) => [q.x, q.y]),
    fill: col,
  });
}
function ball(c, r, col) {
  const q = project(c);
  if (!q) return;
  items.push({
    z: q.z,
    ball: true,
    x: q.x,
    y: q.y,
    r: Math.max(0.8, r * q.s),
    fill: col,
  });
}
const shade = (hex, k) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `#${f((n >> 16) & 255)
    .toString(16)
    .padStart(2, "0")}${f((n >> 8) & 255)
    .toString(16)
    .padStart(2, "0")}${f(n & 255)
    .toString(16)
    .padStart(2, "0")}`;
};

/* ⚠️ THE PETALS. Omitting these is why the first field looked like a row of
 * traffic cones: a bare corolla TUBE is a horn, and the lobes are what make it
 * read as a flower. visit.html had them all along. */
const COROLLA = "#d9cdb0";
const LIGHT = vUnit([-0.35, 0.8, 0.5]);
const U_STEPS = 7,
  V_STEPS = 8;

function corollaLobes(f, b, tint) {
  /* ⚠️ TUNED AGAINST A RENDER, NOT BY EYE-FREE GUESSING. visit.html's five
   * lobes with a strong backward reflex read correctly SIDE-ON, which is the
   * only way that page ever shows a flower. Seen from above — which is how a
   * field has to be shown — the same lobes present as three limbs and a head:
   * two arms up, a round face. Six narrower lobes with about half the reflex
   * read as a radial bloom from both angles. */
  const N = 6;
  const fr = P.axisFrame(f, 0);
  const base = P.axisAt(f, 0);
  const wOf = (v) => Math.pow(Math.sin(Math.PI * (0.16 + 0.84 * v)), 0.62);
  const pt = (ang, v) => {
    const rr = P.tubeRadius(f, 0, ang);
    const flare = 1 + 1.35 * v * (0.55 + 0.45 * v);
    const back = -(0.12 * v + 0.34 * v * v);
    const cup = 0.13 * Math.sin(Math.PI * v);
    const loc = [0, 0, 0];
    for (let k = 0; k < 3; k++)
      loc[k] =
        base[k] +
        (fr.dorsal[k] * Math.cos(ang) + fr.lateral[k] * Math.sin(ang)) *
          rr *
          (flare + cup) +
        fr.fwd[k] * back;
    return toWorld(b, loc);
  };
  for (let i = 0; i < N; i++) {
    const c = (i / N) * 2 * Math.PI + 0.3;
    const halfw = Math.PI / N - 0.045;
    for (let vi = 0; vi < V_STEPS; vi++) {
      const v0 = vi / V_STEPS,
        v1 = (vi + 1) / V_STEPS;
      const w0 = halfw * wOf(v0),
        w1 = halfw * wOf(v1);
      for (let ui = 0; ui < U_STEPS; ui++) {
        const u0 = -1 + (2 * ui) / U_STEPS,
          u1 = -1 + (2 * (ui + 1)) / U_STEPS;
        const q = [
          pt(c + u0 * w0, v0),
          pt(c + u0 * w1, v1),
          pt(c + u1 * w1, v1),
          pt(c + u1 * w0, v0),
        ];
        const nrm = vUnit(vCrs(vSub(q[1], q[0]), vSub(q[3], q[0])));
        const lam = 0.55 + 0.45 * Math.abs(vDot(nrm, LIGHT));
        poly(q, shade(tint, lam * (1 - 0.12 * v0)));
      }
    }
  }
}

function platform(f, b) {
  const { platformLen, platformAngle } = P.polarityTraits(f);
  if (platformLen < 0.03) return;
  const fr = P.axisFrame(f, 0);
  const base = P.axisAt(f, 0);
  const point = (ang, ext) => {
    const rr = P.tubeRadius(f, 0, ang) * (1 - 0.25 * ext);
    const loc = [0, 0, 0];
    for (let k = 0; k < 3; k++)
      loc[k] =
        base[k] +
        (fr.dorsal[k] * Math.cos(ang) + fr.lateral[k] * Math.sin(ang)) * rr -
        fr.dorsal[k] * ext * platformAngle -
        fr.fwd[k] * ext * platformLen;
    return toWorld(b, loc);
  };
  const N = 12;
  for (let j = 0; j < N; j++) {
    const a0 = Math.PI - 1.15 + (2.3 * j) / N,
      a1 = Math.PI - 1.15 + (2.3 * (j + 1)) / N;
    poly([point(a0, 0), point(a0, 1), point(a1, 1), point(a1, 0)], "#c3b18e");
  }
}

const LOBES_ONLY = process.argv.includes("--lobes");

function drawFlower(f, b, tint, T_STEPS, TH_STEPS) {
  const view = camForward();
  if (LOBES_ONLY) {
    corollaLobes(f, b, tint);
    return;
  }
  for (let i = 0; i < T_STEPS; i++) {
    const t0 = i / T_STEPS,
      t1 = (i + 1) / T_STEPS;
    for (let j = 0; j < TH_STEPS; j++) {
      const a0 = (j / TH_STEPS) * 2 * Math.PI,
        a1 = ((j + 1) / TH_STEPS) * 2 * Math.PI;
      const am = (a0 + a1) / 2,
        tm = (t0 + t1) / 2;
      const fr = P.axisFrame(f, tm);
      const nLocal = [
        fr.dorsal[0] * Math.cos(am) + fr.lateral[0] * Math.sin(am),
        fr.dorsal[1] * Math.cos(am) + fr.lateral[1] * Math.sin(am),
        fr.dorsal[2] * Math.cos(am) + fr.lateral[2] * Math.sin(am),
      ];
      if (vDot(dirWorld(b, nLocal), view) < 0.02) continue;
      /* ⚠️ THE THROAT MUST BE DARKER THAN THE LOBES. visit.html uses two
       * colours -- pale #d9cdb0 lobes against a #b9a583 throat -- and that
       * contrast is the only thing separating them. Painting both with one
       * ancestry tint made every near petal vanish into the tube it overlaps,
       * which is why the flower read as three far-side petals and a barrel. */
      const k = (0.58 + 0.34 * ((1 + Math.cos(am)) / 2) - 0.14 * tm) * 0.62;
      poly(
        [
          toWorld(b, P.surfacePoint(f, t0, a0)),
          toWorld(b, P.surfacePoint(f, t1, a0)),
          toWorld(b, P.surfacePoint(f, t1, a1)),
          toWorld(b, P.surfacePoint(f, t0, a1)),
        ],
        shade(tint, k),
      );
    }
  }
  platform(f, b);
  corollaLobes(f, b, tint);
  ball(toWorld(b, P.antherPoint(f)), 0.15, "#f4e08a");
  ball(toWorld(b, P.stigmaPoint(f)), 0.13, "#8fd694");
}

const mode = process.argv[2] || "one";

if (mode === "one") {
  /* one flower, filling the frame, axis pointing up as the page arranges it */
  camDist = 7;
  camTarget = [0, 0, 0];
  const f = { ...P.DEFAULT_FLOWER };
  drawFlower(f, basis(vUnit([0, -1, 0]), [0, 0, 0]), "#e8b23a", 22, 30);
} else if (mode === "pair") {
  /* the two FOUNDING genomes side by side, big — the field showed one lineage
   * apparently petal-less and this is what tells whether that is real
   * morphology or a rendering fault */
  camDist = 11;
  camTarget = [0, 0.4, 0];
  const seed = 3;
  const built = I.foundTwoLineages(
    18,
    E.makeRng(seed),
    I.signalRng(seed),
    8,
    I.DEFAULTS,
  );
  drawFlower(
    E.toFlower(built.gA),
    basis(vUnit([0, -1, 0]), [-2.4, 0, 0]),
    "#e8b23a",
    20,
    26,
  );
  drawFlower(
    E.toFlower(built.gB),
    basis(vUnit([0, -1, 0]), [2.4, 0, 0]),
    "#cc6699",
    20,
    26,
  );
  console.log("gA", JSON.stringify(built.gA));
  console.log("gB", JSON.stringify(built.gB));
} else if (mode === "sideways") {
  /* the orientation visit.html uses, for comparison */
  camDist = 7;
  camTarget = [0, 0, 0];
  const f = { ...P.DEFAULT_FLOWER };
  drawFlower(f, basis([-1, 0, 0], [0, 0, 0]), "#e8b23a", 22, 30);
} else {
  /* the ring exactly as population.html lays it out */
  const seed = 3,
    n = 18;
  const built = I.foundTwoLineages(
    n,
    E.makeRng(seed),
    I.signalRng(seed),
    8,
    I.DEFAULTS,
  );
  /* ⚠️ A RING WAS THE WRONG LAYOUT TWICE OVER. It leaves a dead hole in the
   * middle of the frame, and — worse — it implies spatial structure the default
   * IBM does not have: this population is PANMICTIC, every plant equally able to
   * exchange with every other. A filled patch on golden-angle spacing says
   * "a stand of plants" without asserting a geometry the model never used.
   *
   * The flowers also stand UPRIGHT. Leaning them outward tipped the near half
   * away from the camera so their tubes hid their own lobes. */
  const R = 8.6;
  const GOLDEN = Math.PI * (3 - Math.sqrt(5));
  built.pop.forEach((ind, i) => {
    const th = i * GOLDEN;
    const rad = R * Math.sqrt((i + 0.5) / n);
    const b = basis(vUnit([0, -1, 0]), [
      Math.cos(th) * rad,
      0,
      Math.sin(th) * rad,
    ]);
    drawFlower(
      E.toFlower(I.shapeOf(ind)),
      b,
      ind.anc ? "#cc6699" : "#e8b23a",
      9,
      14,
    );
  });
}

items.sort((a, b) => b.z - a.z);

const G = require("./png.js");
const r = G.raster(W, H);
for (const it of items) {
  const col = G.hex(it.fill);
  if (it.ball) G.fillCircle(r, it.x, it.y, it.r, col);
  else G.fillPoly(r, it.pts, col);
}
const dest = process.argv[3] || "_probe.png";
G.writePng(r, dest);
console.log(`${mode}: ${items.length} items -> ${dest}`);
