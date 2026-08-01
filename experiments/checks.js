/*
 * Four checks the existing model already enables, run before the evolution
 * loop is written because any of them could change its design.
 *
 *   1. RECIPROCAL DIRECTION   is isolation symmetric, or does pollen flow one
 *                             way and not back?
 *   2. OTHER BODY PLANS       is the 2-D packing advantage a property of the
 *                             geometry, or of one particular bee?
 *   3. PRECISION ALONE        can species coexist by differing only in how
 *                             repeatable their placement is?
 *   4. STIGMA-SIDE PLACEMENT  everything so far ablated the anther.
 *
 * Each check carries a control that would catch an inert harness, because a
 * broken measurement returns "no effect", which is indistinguishable from a
 * real null.
 */

const P = require("../sim/placement.js");
const K = require("../sim/packing.js");

const N_VISITS = 240;
const rule = (s) => console.log("\n" + s + "\n" + "-".repeat(s.length));

const flower = (over = {}) => ({ ...P.DEFAULT_FLOWER, ...over });
/* A species' own stigma must collect from wherever its own anther deposits,
 * so the two organs move together — but they sit at DIFFERENT DEPTHS, which
 * is herkogamy and is the only thing that can make the two directions differ. */
const species = (theta, over = {}) =>
  flower({ antherTheta: theta, stigmaTheta: theta, ...over });

// ==========================================================================
// CHECK 1 — is isolation reciprocal?
// ==========================================================================
function check1() {
  rule(
    "CHECK 1 — reciprocal direction: does pollen flow one way but not back?",
  );

  const bee = P.DEFAULT_BEE;
  const dirOverlap = (donor, recipient) =>
    K.overlap(
      K.sig2D(
        P.placementDistribution(donor, bee, {
          n: N_VISITS,
          seed: 11,
          part: "anther",
        }).hits,
      ),
      K.sig2D(
        P.placementDistribution(recipient, bee, {
          n: N_VISITS,
          seed: 11,
          part: "stigma",
        }).hits,
      ),
    );

  const A = species(0);
  console.log(
    "  A's anther is at theta=0; B's anther and stigma sweep together.",
  );
  console.log(
    "  herkogamy: anther at t=" +
      A.antherT +
      ", stigma at t=" +
      A.stigmaT +
      "\n",
  );
  console.log("   B theta     A->B     B->A     asymmetry");

  let maxAsym = 0;
  for (const deg of [0, 30, 60, 90, 120, 150, 180]) {
    const B = species((deg * Math.PI) / 180);
    const ab = dirOverlap(A, B); // A donates, B receives
    const ba = dirOverlap(B, A); // B donates, A receives
    const asym = Math.abs(ab - ba);
    maxAsym = Math.max(maxAsym, asym);
    console.log(
      `   ${String(deg).padStart(5)}deg  ${ab.toFixed(3)}    ${ba.toFixed(3)}    ${asym.toFixed(3)}`,
    );
  }

  /* CONTROL. At theta=0 the two species are identical, so the two directions
   * are the same computation and MUST agree. If they disagree there, the
   * asymmetry above is a bug in the harness rather than herkogamy. */
  const B0 = species(0);
  const c1 = dirOverlap(A, B0),
    c2 = dirOverlap(B0, A);
  console.log(
    `\n  CONTROL identical species: A->B ${c1.toFixed(4)} vs B->A ${c2.toFixed(4)} ` +
      `-> ${Math.abs(c1 - c2) < 1e-9 ? "agree (harness sound)" : "DISAGREE — harness bug"}`,
  );
  console.log(`  maximum asymmetry across the sweep: ${maxAsym.toFixed(3)}`);

  /*
   * Does asymmetry track herkogamy — the depth separation of anther and
   * stigma, which is the only thing that can make the two directions differ?
   *
   * MUST BE PROBED WHERE OVERLAP IS MEASURABLE. The first version of this
   * swept separation at theta=90deg, where wide separations drive BOTH
   * directions to exactly zero; the asymmetry then reads 0.000 for a floor
   * effect and is indistinguishable from real symmetry. Probing at shallower
   * theta keeps both directions off the floor, and any pair that still
   * bottoms out is flagged rather than counted.
   */
  console.log(
    "\n  asymmetry vs anther-stigma separation, probed off the floor:",
  );
  console.log("    theta  separation    A->B     B->A     asym");
  for (const deg of [30, 45, 60]) {
    for (const [at, st] of [
      [0.575, 0.575],
      [0.55, 0.6],
      [0.5, 0.65],
      [0.45, 0.72],
    ]) {
      const Ah = species(0, { antherT: at, stigmaT: st });
      const Bh = species((deg * Math.PI) / 180, { antherT: at, stigmaT: st });
      const ab = dirOverlap(Ah, Bh),
        ba = dirOverlap(Bh, Ah);
      const floored = ab < 1e-6 && ba < 1e-6;
      console.log(
        `    ${String(deg).padStart(3)}deg  ${(st - at).toFixed(3).padStart(9)}    ` +
          `${ab.toFixed(3)}    ${ba.toFixed(3)}    ${Math.abs(ab - ba).toFixed(3)}` +
          (floored ? "   <- FLOOR, uninformative" : ""),
      );
    }
  }

  /*
   * Is that consistent sign real, or an artefact of one shared seed?
   * Every measurable pair above had B->A > A->B, which is either a systematic
   * herkogamy effect or the same sampling noise appearing twice. Re-run across
   * independent seeds: if the sign flips, it is noise and there is no
   * directional isolation to model.
   */
  console.log(
    "\n  is the sign systematic? (B->A minus A->B, independent seeds)",
  );
  const dirOverlapSeed = (donor, recipient, sd) =>
    K.overlap(
      K.sig2D(
        P.placementDistribution(donor, bee, {
          n: N_VISITS,
          seed: sd,
          part: "anther",
        }).hits,
      ),
      K.sig2D(
        P.placementDistribution(recipient, bee, {
          n: N_VISITS,
          seed: sd,
          part: "stigma",
        }).hits,
      ),
    );
  for (const deg of [30, 45, 60]) {
    const A2 = species(0);
    const B2 = species((deg * Math.PI) / 180);
    const ds = [];
    for (const sd of [3, 11, 29, 47, 83, 101, 137]) {
      ds.push(dirOverlapSeed(B2, A2, sd) - dirOverlapSeed(A2, B2, sd));
    }
    const mean = ds.reduce((a, b) => a + b, 0) / ds.length;
    const pos = ds.filter((d) => d > 0).length;
    console.log(
      `    ${String(deg).padStart(3)}deg  mean ${mean >= 0 ? "+" : ""}${mean.toFixed(4)}  ` +
        `range [${Math.min(...ds).toFixed(3)}, ${Math.max(...ds).toFixed(3)}]  ` +
        `${pos}/${ds.length} seeds positive` +
        (pos === ds.length || pos === 0
          ? "   <- consistent"
          : "   <- SIGN FLIPS, noise"),
    );
  }
}

// ==========================================================================
// shared: a parameterised version of the ablation
// ==========================================================================
function rngFrom(seed) {
  let x = seed >>> 0 || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 4294967296;
  };
}

function poolFor(bee, part, seed = 7, n = 400) {
  const rng = rngFrom(seed);
  const lerp = (a, b) => a + (b - a) * rng();
  const pool = [];
  let rejected = 0;
  for (let i = 0; i < n; i++) {
    const f = flower({
      axisLen: lerp(1.8, 3.2),
      mouthR: lerp(0.55, 1.0),
      throatR: lerp(0.16, 0.5),
      curve: lerp(0.0, 0.6),
      polarity: lerp(0.05, 0.95),
      antherT: lerp(0.35, 0.85),
      antherTheta: lerp(-Math.PI, Math.PI),
      antherProject: lerp(0.15, 0.5),
    });
    f.stigmaTheta = f.antherTheta;
    f.stigmaT = Math.min(0.92, f.antherT + 0.05);
    const d = P.placementDistribution(f, bee, {
      n: N_VISITS,
      seed: 1000 + i,
      part,
    });
    if (d.contactRate < 0.5) {
      rejected++;
      continue;
    }
    pool.push(d);
  }
  return { pool, rejected };
}

/*
 * The steelman spans THIS bee's whole surface, cap included, and draws (s sd,
 * phi sd) PAIRS from the pool's own precision distribution.
 *
 * Both corrections come from the head-cap work. Each body plan has its own cap
 * extent, r0/bodyLen, so the domain is per-bee rather than a shared constant —
 * a small compact animal has proportionally more head in front of its spine end
 * than a long slender one, and giving them all the default bee's domain would
 * quietly compare different surfaces.
 */
function armFree1D(count, prec, sLo, seed) {
  const span = 1 - sLo;
  const out = [];
  for (let i = 0; i < count; i++) {
    const [sSd, phiSd] = prec[i % prec.length];
    out.push(
      K.sig2D(
        K.syntheticHits(sLo + ((i + 0.5) / count) * span, 0, sSd, phiSd, {
          n: N_VISITS,
          seed: seed + i,
          sLo,
        }),
      ),
    );
  }
  return out;
}

function ablate(bee, part, label) {
  const { pool, rejected } = poolFor(bee, part);
  if (pool.length < 20) {
    console.log(
      `  ${label.padEnd(22)} pool too small (${pool.length}) — skipped`,
    );
    return null;
  }
  const sSd = K.median(pool.map((d) => K.sSpread(d.hits)));
  const prec = pool.map((d) => [K.sSpread(d.hits), K.phiSpread(d.hits)]);
  const sLo = -P.bodyRadius(bee, 0) / bee.bodyLen;
  const span = 1 - sLo;
  const l2 = K.overlapMatrix(pool.map((d) => K.sig2D(d.hits)));
  const l1 = K.overlapMatrix(
    armFree1D(Math.round(200 * span), prec, sLo, 20000),
  );

  const tau = 0.2;
  const best = (m) => {
    let v = 0;
    for (const seed of [99, 7, 4242])
      v = Math.max(v, K.packingCeiling(m, tau, { restarts: 600, seed }).size);
    return v;
  };
  const a = best(l1);
  const b = best(l2);
  console.log(
    `  ${label.padEnd(22)} pool ${String(pool.length).padStart(3)} (rej ${String(rejected).padStart(3)})  ` +
      `s sd ${sSd.toFixed(4)}  L1-free ${String(a).padStart(3)}   L2 ${String(b).padStart(3)}   ` +
      `${(b / a).toFixed(2)}x`,
  );
  return { a, b, ratio: b / a };
}

// ==========================================================================
// CHECK 2 — is the advantage a property of the geometry or of one bee?
// ==========================================================================
function check2() {
  rule("CHECK 2 — other pollinator body plans (packing ceiling at tau=0.2)");

  const scaleBee = (name, k, lenK = 1) => ({
    name,
    bodyLen: 1.75 * lenK,
    regions: P.DEFAULT_BEE.regions.map((r) => ({
      ...r,
      r0: r.r0 * k,
      r1: r.r1 * k,
    })),
    reach: P.DEFAULT_BEE.reach,
  });

  const plans = [
    { name: "default bee", bee: P.DEFAULT_BEE },
    { name: "small slender", bee: scaleBee("small", 0.65, 0.8) },
    { name: "large robust", bee: scaleBee("large", 1.35, 1.15) },
    { name: "long slender", bee: scaleBee("long", 0.7, 1.5) },
  ];
  for (const p of plans) ablate(p.bee, "anther", p.name);

  console.log(
    "\n  If the ratio held only for the default bee, the 3x would be a fact about\n" +
      "  that animal rather than about placement dimensionality.",
  );
}

// ==========================================================================
// CHECK 3 — can precision alone isolate?
// ==========================================================================
function check3() {
  rule(
    "CHECK 3 — precision alone: same mean position, different repeatability",
  );

  const bee = P.DEFAULT_BEE;
  /* Position held FIXED. Only polarity moves, which drives rollSpread and so
   * the repeatability of the placement — Armbruster's precision axis. */
  const precisionOnly = [];
  for (let i = 0; i < 24; i++) {
    const f = species(0, { polarity: 0.05 + (0.9 * i) / 23 });
    const d = P.placementDistribution(f, bee, { n: N_VISITS, seed: 11 });
    if (d.hits.length) precisionOnly.push(d);
  }
  const spreads = precisionOnly.map((d) => K.phiSpread(d.hits));
  console.log(
    `  ${precisionOnly.length} species, identical anther position, ` +
      `phi spread ${Math.min(...spreads).toFixed(2)} to ${Math.max(...spreads).toFixed(2)} rad`,
  );

  const matP = K.overlapMatrix(precisionOnly.map((d) => K.sig2D(d.hits)));
  /* POSITIVE CONTROL, in the same units: species differing in POSITION at a
   * matched precision. Known to pack. If the precision arm returns 1 and this
   * also returns 1, the harness is inert rather than the finding being real. */
  const positionOnly = [];
  for (let i = 0; i < 24; i++) {
    const f = species(-Math.PI + (2 * Math.PI * i) / 24);
    const d = P.placementDistribution(f, bee, { n: N_VISITS, seed: 11 });
    if (d.hits.length) positionOnly.push(d);
  }
  const matQ = K.overlapMatrix(positionOnly.map((d) => K.sig2D(d.hits)));

  console.log("\n   tau    precision-only   position-only [POSITIVE CONTROL]");
  for (const tau of [0.05, 0.1, 0.2, 0.3, 0.5]) {
    const a = K.packingCeiling(matP, tau, { restarts: 200, seed: 99 }).size;
    const b = K.packingCeiling(matQ, tau, { restarts: 200, seed: 99 }).size;
    console.log(
      `   ${String(tau).padEnd(5)} ${String(a).padStart(12)} ${String(b).padStart(16)}`,
    );
  }
}

// ==========================================================================
// CHECK 4 — the stigma side
// ==========================================================================
function check4() {
  rule(
    "CHECK 4 — stigma-side placement (everything so far ablated the anther)",
  );
  ablate(P.DEFAULT_BEE, "anther", "anther placement");
  ablate(P.DEFAULT_BEE, "stigma", "stigma placement");
  console.log(
    "\n  The stigma is the same computation on a separately evolvable organ.\n" +
      "  A large divergence here would mean the two sides need separate treatment in v1.",
  );
}

check1();
check2();
check3();
check4();
console.log();
