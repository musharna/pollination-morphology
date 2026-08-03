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
/* Continuous overlap has gaussian tails and is never exactly zero, so a fixed
 * 3-decimal format prints "0.000" for values spanning many orders of magnitude
 * and manufactures the appearance of a hard floor. That formatting is precisely
 * what justified the retired tau -> 0 framing elsewhere in this project. */
const fmt = (x) => (x >= 1e-3 ? x.toFixed(3) : x.toExponential(1)).padStart(8);
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
    K.kdeOverlap(
      K.kdeSig(
        P.placementDistribution(donor, bee, {
          n: N_VISITS,
          seed: 11,
          part: "anther",
        }).hits,
      ),
      K.kdeSig(
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
      `   ${String(deg).padStart(5)}deg ${fmt(ab)} ${fmt(ba)} ${fmt(asym)}`,
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
        `    ${String(deg).padStart(3)}deg  ${(st - at).toFixed(3).padStart(9)} ` +
          `${fmt(ab)} ${fmt(ba)} ${fmt(Math.abs(ab - ba))}` +
          (floored ? "   <- below 1e-6, uninformative" : ""),
      );
    }
  }

  /*
   * ⚠️ WHY does overlap collapse across that separation sweep? The write-up
   * recorded an "unlooked-for finding" — that herkogamy past ~0.15 drives
   * STIGMA CONTACT to zero outright, "the stigma stops touching the animal at
   * all" — inferred from overlaps that printed as 0.000 on the histogram.
   *
   * That inference was never measured, and it is wrong. Contact rate is right
   * there on the distribution, so print it instead of reasoning from a zero.
   */
  console.log("\n  is the collapse a LOSS OF CONTACT, or separation?");
  console.log("    separation   anther contact   stigma contact");
  const contactAt = (at, st) => {
    const f = species(0, { antherT: at, stigmaT: st });
    return [
      P.placementDistribution(f, bee, { n: N_VISITS, seed: 11, part: "anther" })
        .contactRate,
      P.placementDistribution(f, bee, { n: N_VISITS, seed: 11, part: "stigma" })
        .contactRate,
    ];
  };
  for (const [at, st] of [
    [0.575, 0.575],
    [0.55, 0.6],
    [0.5, 0.65],
    [0.45, 0.72],
    [0.4, 0.8],
    [0.35, 0.88],
  ]) {
    const [ca, cs] = contactAt(at, st);
    console.log(
      `    ${(st - at).toFixed(3).padStart(10)}   ${ca.toFixed(4).padStart(14)}   ${cs.toFixed(4).padStart(14)}` +
        (cs < 0.01 ? "   <- stigma lost" : "") +
        (ca < 0.01 ? "   <- ANTHER lost" : ""),
    );
  }
  console.log(
    "\n  Both organs are still contacting at separation 0.270, where overlap has\n" +
      "  already fallen ~23 orders of magnitude — so that collapse is the two organs\n" +
      "  touching at DIFFERENT PLACES, which is herkogamy working, not contact loss.\n" +
      "  Contact loss does eventually happen, but to the ANTHER, as it retreats out of\n" +
      "  the visitor's reach. The published claim named the wrong organ.",
  );

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
    K.kdeOverlap(
      K.kdeSig(
        P.placementDistribution(donor, bee, {
          n: N_VISITS,
          seed: sd,
          part: "anther",
        }).hits,
      ),
      K.kdeSig(
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
      K.kdeSig(
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

/*
 * ⚠️ CROSS-PLAN COMPARISON NEEDS A COMMON POOL SIZE.
 *
 * The contact filter rejects a very different fraction per body plan — 23% for
 * the default bee against 62% for a small slender one — so each plan used to be
 * scored on whatever pool it happened to accept (153 to 309). The packing
 * ceiling climbs steeply with candidate count, so ratios measured at different
 * N are not comparable to each other, and check 2's entire question is a
 * comparison ACROSS plans.
 *
 * The previous write-up spotted the variation and dismissed it — "while no
 * ceiling appeared pool-limited" — which the pool-scaling measurement has since
 * falsified: every arm is pool-limited at these sizes. Draw from a larger
 * candidate set and truncate every plan to a common N instead.
 */
function ablate(bee, part, label, capN = null, poolN = 900) {
  const { pool: full, rejected } = poolFor(bee, part, 7, poolN);
  const pool = capN === null ? full : full.slice(0, capN);
  if (pool.length < 20) {
    console.log(
      `  ${label.padEnd(22)} pool too small (${pool.length}) — skipped`,
    );
    return null;
  }
  const sSd = K.median(pool.map((d) => K.sSpread(d.hits)));
  const prec = pool.map((d) => [K.sSpread(d.hits), K.phiSpread(d.hits)]);
  const sLo = -P.bodyRadius(bee, 0) / bee.bodyLen;
  const l2 = K.kdeOverlapMatrix(pool.map((d) => K.kdeSig(d.hits)));
  /* MATCHED CANDIDATE COUNT. This used to hand the 1-D arm round(200 * span)
   * candidates against however many species survived the contact filter — a
   * ratio taken across two different pool sizes is two points on two different
   * curves, and the packing ceiling moves steeply with pool size. Both arms now
   * get exactly pool.length. Same error, same file-by-file discovery, as
   * ablation.js and precision-audit.js. */
  const l1 = K.kdeOverlapMatrix(armFree1D(pool.length, prec, sLo, 20000));

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
    `  ${label.padEnd(22)} N ${String(pool.length).padStart(3)} ` +
      `(accepted ${String(full.length).padStart(3)}/${poolN}, ${((100 * rejected) / poolN).toFixed(0)}% rejected)  ` +
      `s sd ${sSd.toFixed(4)}  L1-free ${String(a).padStart(3)}   L2 ${String(b).padStart(3)}   ` +
      `${(b / a).toFixed(2)}x`,
  );
  return { a, b, ratio: b / a, accepted: full.length };
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
  /* Pass 1 — how many candidates does each plan accept out of the same draw?
   * That is a result in its own right (contact difficulty varies by animal) and
   * it sets the common N the comparison has to run at. */
  const POOL_N = 900;
  const accepted = plans.map(
    (p) => poolFor(p.bee, "anther", 7, POOL_N).pool.length,
  );
  const capN = Math.min(...accepted);
  console.log(
    `  accepted out of ${POOL_N} drawn: ` +
      plans.map((p, i) => `${p.name} ${accepted[i]}`).join(", "),
  );
  console.log(
    `  every plan scored at the common N = ${capN}, so the ratios are comparable\n`,
  );

  for (const p of plans) ablate(p.bee, "anther", p.name, capN, POOL_N);

  console.log(
    "\n  If the ratio held only for the default bee, it would be a fact about that\n" +
      "  animal rather than about placement dimensionality. At a common pool size the\n" +
      "  ordering is a comparison; at the pool each plan happened to accept it was not.",
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

  const matP = K.kdeOverlapMatrix(precisionOnly.map((d) => K.kdeSig(d.hits)));
  /* POSITIVE CONTROL, in the same units: species differing in POSITION at a
   * matched precision. Known to pack. If the precision arm returns 1 and this
   * also returns 1, the harness is inert rather than the finding being real. */
  const positionOnly = [];
  for (let i = 0; i < 24; i++) {
    const f = species(-Math.PI + (2 * Math.PI * i) / 24);
    const d = P.placementDistribution(f, bee, { n: N_VISITS, seed: 11 });
    if (d.hits.length) positionOnly.push(d);
  }
  const matQ = K.kdeOverlapMatrix(positionOnly.map((d) => K.kdeSig(d.hits)));

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
  /* Same matched-N requirement as check 2: the stigma is harder to contact than
   * the anther, so the two organs accept different numbers out of the same draw
   * and would otherwise be scored at different pool sizes. */
  const POOL_N = 900;
  const capN = Math.min(
    poolFor(P.DEFAULT_BEE, "anther", 7, POOL_N).pool.length,
    poolFor(P.DEFAULT_BEE, "stigma", 7, POOL_N).pool.length,
  );
  console.log(`  both organs scored at the common N = ${capN}\n`);
  ablate(P.DEFAULT_BEE, "anther", "anther placement", capN, POOL_N);
  ablate(P.DEFAULT_BEE, "stigma", "stigma placement", capN, POOL_N);
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
