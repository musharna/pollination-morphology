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
  pitch = 0.62,
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
function poly(pts, col, zForce) {
  const ps = pts.map(project);
  if (ps.some((q) => !q)) return;
  /* ⚠️ zForce exists because painter's algorithm FAILS on the ground plane. A
   * triangle running from the centre to the far rim spans enormous depth, so its
   * average z lands NEARER than the flowers standing on it and it paints over
   * the entire scene. Large background geometry has to be pinned behind
   * everything rather than sorted with it. */
  items.push({
    z: zForce == null ? ps.reduce((a, q) => a + q.z, 0) / ps.length : zForce,
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
  /* the whole composed scene, as the page draws it: ground, the patch, and the
   * bee carrying pollen — so the COMPOSITION can be judged, not just a flower */
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

  /*
   * ⚠️ THE BOUT IS RESOLVED BEFORE ANYTHING IS DRAWN, and that ordering is a
   * bug I made first. `project` reads the camera at the moment each point is
   * projected, so moving the camera AFTER the patch is drawn leaves the plants
   * projected through the old camera and the bee through the new one — two
   * scenes in one frame. Everything the camera depends on has to be known here.
   */
  let LOG = null,
    REC = null,
    CARRY = null,
    IDX = 4;
  if (mode === "bout") {
    const res = I.step(
      built.pop,
      { ...I.DEFAULTS, logBout: { from: 600, count: 60 } },
      E.makeRng(seed),
      0,
      I.signalRng(seed),
    );
    LOG = res.visitLog || [];
    /*
     * The BIGGEST transfer in the window, not the first one.
     *
     * ⚠️ And that is a choice worth being explicit about, because it is the
     * kind that quietly flatters a model. Most visits in a real bout deliver
     * nothing or one grain — the first delivering visit here moved a single
     * grain, which is honest and shows nothing. Picking the largest transfer
     * makes the MECHANISM visible in one still frame; it is not the typical
     * visit and the page never claims it is. The animation shows every visit in
     * the window, this probe shows the one worth photographing.
     */
    let at = -1;
    for (let q = 0; q < LOG.length; q++)
      if (
        LOG[q].stig &&
        LOG[q].nTook > 0 &&
        (at < 0 || LOG[q].nTook > LOG[at].nTook)
      )
        at = q;
    if (at < 0) throw new Error("no delivering visit in the logged window");
    REC = LOG[at];
    IDX = REC.j;
    let load = [];
    for (let q = 0; q <= at; q++) {
      for (const g of LOG[q].took) {
        const i = load.findIndex(
          (x) => x.sp === g.sp && x.s === g.s && x.phi === g.phi,
        );
        if (i >= 0) load.splice(i, 1);
      }
      if (q < at)
        for (const g of LOG[q].gave)
          load.push({ s: g.s, phi: g.phi, sp: LOG[q].j });
    }
    CARRY = load;
    console.log(
      `bout: visit ${REC.t} at plant ${REC.j}, delivering ${REC.nTook}, carrying ${REC.carry}`,
    );
  }
  const TH = IDX * GOLDEN;
  const RAD = R * Math.sqrt((IDX + 0.5) / n);
  const FH = 3.6 + 0.9 * (E.toFlower(I.shapeOf(built.pop[IDX])).axisLen - 1.8);
  /*
   * ⚠️ THE BOUT NEEDS ITS OWN CAMERA, and that is a finding rather than a
   * preference. At the field camera the animal projects INSIDE the frame — the
   * guard further down confirmed it — and is still invisible: a speck two units
   * above one flower, occluded by whichever bloom happens to stand nearer. A
   * wide shot of eighteen plants cannot show a grain of pollen crossing a few
   * millimetres of insect. So the transfer view moves the camera to the flower
   * being worked. The patch is still behind it; the subject is now the visit.
   */
  if (mode === "bout") {
    /* Aimed at the MOUTH, where the animal is, rather than at the plant's
     * midpoint — the first framing spent half the canvas on empty sky. */
    camTarget = [Math.cos(TH) * RAD - 0.5, FH + 0.9, Math.sin(TH) * RAD + 0.4];
    camDist = 7.6;
    pitch = 0.22;
    yaw = 0.5;
  }
  /*
   * ⚠️ A NEAR CLIP, because moving the camera IN moves it INTO the patch. At
   * close range the lens sits among the neighbouring plants and whichever one
   * stands between it and the subject fills the entire frame — the previous
   * render was a wall of brown corolla with the bee somewhere behind it. This
   * is an ordinary camera near-plane and nothing to do with the model: plants
   * closer than the flower being worked are not drawn.
   */
  const Z_SUB =
    mode === "bout"
      ? project([Math.cos(TH) * RAD, FH, Math.sin(TH) * RAD]).z
      : -Infinity;
  const nearClipped = (x, y, z) => {
    if (mode !== "bout") return false;
    const q = project([x, y, z]);
    return !q || q.z < Z_SUB - 1.1;
  };

  /* ⚠️ GROUND FIRST, AND AT THE RIGHT HEIGHT. The corolla hangs BELOW its mouth,
   * so a ground plane at y=0 with the mouths at y=0 puts every flower
   * underground. Plants stand ON the ground: mouth at STEM_H, corolla hanging to
   * STEM_H - axisLen, stem from there to zero. */
  const GROUND = "#20281c";
  for (let i = 0; i < 40; i++) {
    const a0 = (i / 40) * 2 * Math.PI,
      a1 = ((i + 1) / 40) * 2 * Math.PI;
    const rr = R * 1.5;
    poly(
      [
        [0, 0, 0],
        [Math.cos(a0) * rr, 0, Math.sin(a0) * rr],
        [Math.cos(a1) * rr, 0, Math.sin(a1) * rr],
      ],
      GROUND,
      1e9,
    );
  }

  const stemAt = (x, z, top, tint) => {
    /* a stem, and two leaves — SCENE DRESSING, not model output. The model has
     * no stem; plants do. Drawn so the flowers stand in a place instead of
     * floating in a void, and labelled as dressing wherever it is described. */
    const w = 0.075;
    poly(
      [
        [x - w, 0, z],
        [x + w, 0, z],
        [x + w, top, z],
        [x - w, top, z],
      ],
      "#3f5a35",
    );
    for (const sgn of [-1, 1]) {
      const y0 = top * (0.34 + 0.16 * (sgn > 0 ? 1 : 0));
      poly(
        [
          [x, y0, z],
          [x + sgn * 0.75, y0 + 0.3, z + sgn * 0.3],
          [x + sgn * 1.05, y0 + 0.12, z + sgn * 0.1],
          [x + sgn * 0.55, y0 - 0.16, z - sgn * 0.06],
        ],
        "#4a6b3c",
      );
    }
  };

  built.pop.forEach((ind, i) => {
    const th = i * GOLDEN;
    const rad = R * Math.sqrt((i + 0.5) / n);
    const f0 = E.toFlower(I.shapeOf(ind));
    /* ⚠️ HEIGHT IS DERIVED FROM A REAL GENE (axisLen), not sprinkled randomly —
     * a longer corolla stands taller. Random jitter would be inventing variation
     * the model does not have. */
    const H = 3.6 + 0.9 * (f0.axisLen - 1.8);
    const x = Math.cos(th) * rad,
      z = Math.sin(th) * rad;
    if (nearClipped(x, H, z)) return;
    stemAt(x, z, Math.max(0.4, H - f0.axisLen * 0.92));
    const b = basis(vUnit([0, -1, 0]), [x, H, z]);
    drawFlower(
      E.toFlower(I.shapeOf(ind)),
      b,
      ind.anc ? "#cc6699" : "#e8b23a",
      9,
      14,
    );
  });

  /*
   * The bee. In "field" it hovers over one flower with a plausible load; in
   * "bout" it is placed at a REAL logged visit, carrying the load the model says
   * is on its body at that moment and delivering the grains that visit
   * delivered. That second mode is the only way to see the pollination itself
   * without a browser.
   */
  const bee = P.DEFAULT_BEE;
  const pose =
    mode === "bout"
      ? {
          /* AT the mouth, not above it — an animal hovering a body-length clear
           * of the flower is commuting, not pollinating, and the transfer it is
           * drawn making would be crossing thin air. */
          p: [Math.cos(TH) * RAD - 0.95, FH + 0.72, Math.sin(TH) * RAD + 0.8],
          f: vUnit([0.62, -0.42, -0.52]),
          u: [0, 1, 0],
        }
      : {
          p: [-5.4, 8.2, 5.6],
          f: vUnit([0.72, -0.5, -0.48]),
          u: [0, 1, 0],
        };
  const idx = IDX;
  /* ⚠️ A GUARD THAT ACTUALLY OBSERVES ITS REFERENT. The previous probe render
   * put the animal out of frame and the run reported success anyway — the
   * script's only check was "did it write a PNG". Whether the subject of the
   * picture is IN the picture is the one thing this mode exists to show, so it
   * is asserted rather than eyeballed. */
  {
    const q = project(pose.p);
    if (!q || q.x < 0 || q.x > W || q.y < 0 || q.y > H)
      console.log(
        `⚠️ BEE OFF-FRAME: ${q ? `${q.x | 0},${q.y | 0}` : "behind the camera"}`,
      );
    else console.log(`bee projects to ${q.x | 0},${q.y | 0} of ${W}x${H}`);
  }
  /*
   * ⚠️ `lift` IS NOT COSMETIC. A grain sits exactly ON the body surface, so it
   * shares a depth with the body segment under it and painter's ordering
   * between the two is a coin toss — the load was invisible in the first bout
   * render, painted over by the very animal carrying it. Standing the grains
   * slightly proud of the surface makes the ordering unambiguous. The body
   * COORDINATES are untouched; only the drawing radius moves.
   */
  const bodyPoint = (s, phi, lift = 1) => {
    const rr = P.bodyRadius(bee, s) * lift;
    const lat = vCrs(pose.f, pose.u);
    return vAdd(
      vAdd(pose.p, vMul(pose.f, -s * bee.bodyLen)),
      vAdd(vMul(pose.u, rr * Math.cos(phi)), vMul(lat, rr * Math.sin(phi))),
    );
  };
  for (let i = 0; i <= 26; i++) {
    const s = i / 26;
    const rr = P.bodyRadius(bee, s);
    const c = vAdd(pose.p, vMul(pose.f, -s * bee.bodyLen));
    const dark = s < 0.16 ? 0.5 : Math.floor(s * 7) % 2 ? 0.42 : 0.95;
    ball(c, rr, shade("#c8a24a", dark));
  }
  /* ⚠️ ONE grey quad per side did not read as an animal at all — it looked like
   * a paper tag stuck to a bean. Bees have TWO wings a side, and it is the pale
   * fan against a dark body that says "insect". Plus antennae, which are most of
   * what makes a head read as a head. */
  const lat = vCrs(pose.f, pose.u);
  for (const sgn of [-1, 1]) {
    for (const [off, len, spread, col] of [
      [0.22, 1.45, 0.55, "#cfe0ee"],
      [0.34, 1.05, 0.95, "#b9cddd"],
    ]) {
      const root = vAdd(pose.p, vMul(pose.f, -off * bee.bodyLen));
      const tip = vAdd(
        vAdd(root, vMul(lat, sgn * len)),
        vAdd(vMul(pose.u, 0.42), vMul(pose.f, -spread * 0.5)),
      );
      poly(
        [
          root,
          vAdd(tip, vMul(pose.f, 0.16)),
          tip,
          vAdd(root, vMul(pose.f, -0.3)),
        ],
        col,
      );
    }
    /* antennae */
    const head = vAdd(pose.p, vMul(pose.f, 0.02));
    const atip = vAdd(
      vAdd(head, vMul(pose.f, 0.55)),
      vAdd(vMul(lat, sgn * 0.3), vMul(pose.u, 0.34)),
    );
    poly([head, atip, vAdd(atip, vMul(pose.u, -0.07))], "#2b2b2b");
  }
  if (mode === "bout") {
    /* the load actually on the body, each grain coloured by the ancestry of the
     * plant that shed it — the only place the two lineages physically mix */
    for (const g of CARRY)
      ball(
        bodyPoint(g.s, g.phi, 1.1),
        0.085,
        built.pop[g.sp] && built.pop[g.sp].anc ? "#cc6699" : "#e8b23a",
      );
    /* and the transfer: grains part-way from the body to the stigma that swept
     * them off. Drawn at mid-flight, which is where the animation shows them. */
    for (const g of REC.took) {
      const a = bodyPoint(g.s, g.phi, 1.25);
      const b = bodyPoint(REC.stig.s, REC.stig.phi, 1.25);
      ball(
        [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2],
        0.13,
        "#fff4cf",
      );
    }
    /* where the stigma actually swept — the contact the transfer went through */
    ball(bodyPoint(REC.stig.s, REC.stig.phi, 1.25), 0.16, "#8fe3b0");
  } else {
    const ss = I.sitesOf(built.pop, I.DEFAULTS, 0)[idx];
    for (
      let q = 0;
      q < ss.anther.length;
      q += Math.ceil(ss.anther.length / 14) || 1
    )
      ball(bodyPoint(ss.anther[q].s, ss.anther[q].phi), 0.075, "#f4e08a");
  }
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
