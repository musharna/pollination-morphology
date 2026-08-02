/*
 * THE ABLATION (groundwork §4.4). Does placement-derived-from-3-D-morphology
 * buy anything a 1-D placement gene does not?
 *
 * This is the delete-the-grid test for this project. It runs before the
 * evolution loop is built, because if L1 matches L2 the geometry is decoration
 * and v1 should not be written.
 *
 *   L0            no placement at all — the standard ABM assumption
 *   L1-strict     L2's own placements with roll discarded
 *   L1-free       a free 1-D placement gene, whole body available   [STEELMAN]
 *   L2            2-D placement derived from real morphology
 *   CTRL-2D-ideal a free 2-D placement gene, whole surface available [CEILING]
 *
 * READ THE ARMS HONESTLY:
 *
 *   L2 >= L1-strict is FORCED. Marginalising a joint histogram cannot lower
 *   min-sum overlap. That arm measures a magnitude (how much roll is carrying)
 *   and its direction proves nothing.
 *
 *   L2 vs L1-FREE is the real test and L1-free can win. It is handed the whole
 *   body length as a free gene at precision matched to L2's own, whereas L2
 *   can only reach the placements its morphology space actually produces. If a
 *   free 1-D gene out-packs our geometry, the geometry is not earning its
 *   keep, and that is the finding.
 *
 *   CTRL-2D-ideal is the ceiling L2 would hit if morphology could put pollen
 *   anywhere on the animal. The gap between L2 and it is how much of the
 *   surface the flower shapes cannot reach.
 */

const P = require("../sim/placement.js");
const K = require("../sim/packing.js");

const TAUS = [0.05, 0.1, 0.2, 0.3, 0.5];
const N_MORPH = 400;
const N_VISITS = 240;
const MIN_CONTACT = 0.5; // a flower that rarely touches the animal is not a species

/*
 * The animal's surface now extends ahead of the spine end onto the head's
 * forward cap (roadmap item D). The synthetic arms must be given THE SAME
 * DOMAIN, at the same density of species centres — a steelman confined to a
 * smaller surface than the real morphologies get would lose for a reason that
 * has nothing to do with dimensionality, which is precisely the rigging this
 * ablation exists to avoid. So counts scale with the domain rather than staying
 * fixed.
 */
const S_LO = -P.bodyRadius(P.DEFAULT_BEE, 0) / P.DEFAULT_BEE.bodyLen;
const S_SPAN = 1 - S_LO;
const scaled = (n) => Math.round(n * S_SPAN);
const RESTARTS = 600;

function rngFrom(seed) {
  let x = seed >>> 0 || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------- the morphology pool
 *
 * Genes are SHAPE parameters only. Placement appears nowhere in this list,
 * which is groundwork §4.5's constraint made mechanical: the only way an arm
 * can move a placement site is by changing a shape and letting the contact
 * model recompute where the animal gets touched.
 */
function sampleMorphologies(seed = 1) {
  const rng = rngFrom(seed);
  const lerp = (a, b) => a + (b - a) * rng();
  const pool = [];
  let rejected = 0;

  for (let i = 0; i < N_MORPH; i++) {
    const f = {
      ...P.DEFAULT_FLOWER,
      axisLen: lerp(1.8, 3.2),
      mouthR: lerp(0.55, 1.0),
      throatR: lerp(0.16, 0.5),
      curve: lerp(0.0, 0.6),
      polarity: lerp(0.05, 0.95),
      antherT: lerp(0.35, 0.85),
      antherTheta: lerp(-Math.PI, Math.PI),
      antherProject: lerp(0.15, 0.5),
    };
    const d = P.placementDistribution(f, P.DEFAULT_BEE, {
      n: N_VISITS,
      seed: 1000 + i,
    });
    if (d.contactRate < MIN_CONTACT) {
      rejected++;
      continue;
    }
    pool.push({ f, d });
  }
  return { pool, rejected, attempted: N_MORPH };
}

/* --------------------------------------------------------------- the arms */

function armL0(nSpecies) {
  /* No placement model: every visit is an undifferentiated encounter, so every
   * species deposits over the whole animal identically. Implemented rather
   * than asserted, so the "L0 cannot isolate" prediction is measured. */
  const flat = K.kdeSig(
    Array.from({ length: 2000 }, (_, i) => ({
      s: (i % 50) / 50 + 0.01,
      phi: -Math.PI + ((i % 37) / 37) * 2 * Math.PI,
    })),
  );
  return Array.from({ length: nSpecies }, () => flat);
}

/*
 * MATCHED PRECISION, PROPERLY.
 *
 * packing.js states the constraint the synthetic arms exist under: precision
 * must be matched or the comparison is rigged. The first implementation matched
 * only the MEDIAN, and that turned out to be an incomplete version of the
 * project's own rule. Real precision is strongly heterogeneous — phi sd runs
 * 0.12 at p05 to 0.85 at p95, and 71 of 309 species are tighter than median on
 * BOTH axes. Handing every synthetic blob the median spread therefore builds a
 * "ceiling" that a quarter of the real pool is individually sharper than, and
 * L2 duly exceeded it at two tolerances. A ceiling the measured arm beats is
 * not a ceiling.
 *
 * So the synthetic arms now inherit the pool's precision DISTRIBUTION, drawn as
 * (s sd, phi sd) PAIRS so any correlation between the two survives. Shuffled
 * once with a fixed seed so precision does not line up with grid position.
 */
function precisionPool(pool, seed) {
  const pairs = pool.map((p) => [K.sSpread(p.d.hits), K.phiSpread(p.d.hits)]);
  const rng = rngFrom(seed);
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  return pairs;
}

function armFree1D(count, prec, seed) {
  const sigs = [];
  for (let i = 0; i < count; i++) {
    const s0 = S_LO + ((i + 0.5) / count) * S_SPAN;
    const [sSd, phiSd] = prec[i % prec.length];
    sigs.push(
      K.kdeSig(
        K.syntheticHits(s0, 0, sSd, phiSd, {
          n: N_VISITS,
          seed: seed + i,
          sLo: S_LO,
        }),
      ),
    );
  }
  return sigs;
}

/*
 * ⚠️ THE STEELMAN THE FIRST VERSION WITHHELD.
 *
 * armFree1D draws precision from the pool's DISTRIBUTION — a mix, mostly near
 * median. But if placement is a gene, precision is a gene too (that decision is
 * taken in sim/evolve.js), and an optimiser free to choose candidates would
 * choose the tightest ones: tighter placement means less overlap means more
 * species packed. Withholding that while granting free choice of PLACEMENT is
 * an arbitrary handicap on the control arm.
 *
 * So every candidate gets the pool's BEST precision on each axis independently
 * — as precise as the tightest real flower, and no more, because unbounded
 * precision packs unlimited species and that is not a fact about placement
 * dimensionality.
 */
function armFree1DEvolved(count, prec, seed) {
  const sMin = Math.min(...prec.map((p) => p[0]));
  const pMin = Math.min(...prec.map((p) => p[1]));
  const sigs = [];
  for (let i = 0; i < count; i++) {
    const s0 = S_LO + ((i + 0.5) / count) * S_SPAN;
    sigs.push(
      K.kdeSig(
        K.syntheticHits(s0, 0, sMin, pMin, {
          n: N_VISITS,
          seed: seed + i,
          sLo: S_LO,
        }),
      ),
    );
  }
  return sigs;
}

function armFree2D(nS, nPhi, prec, seed) {
  const sigs = [];
  let k = 0;
  for (let i = 0; i < nS; i++)
    for (let j = 0; j < nPhi; j++) {
      const [sSd, phiSd] = prec[k % prec.length];
      sigs.push(
        K.kdeSig(
          K.syntheticHits(
            S_LO + ((i + 0.5) / nS) * S_SPAN,
            -Math.PI + (j / nPhi) * 2 * Math.PI,
            sSd,
            phiSd,
            { n: N_VISITS, seed: seed + k++, sLo: S_LO },
          ),
        ),
      );
    }
  return sigs;
}

/* ------------------------------------------------------------------ report */

function ceilings(sigs, label) {
  const mat = K.kdeOverlapMatrix(sigs);
  const row = { arm: label, pool: sigs.length };
  /* The packer is randomised greedy over an NP-hard problem, so it UNDERCOUNTS
   * and the shortfall shrinks with restarts. At 200 restarts L2 at tau=0.05
   * returned 21 while 2000 restarts returned 21-23 across seeds — the old
   * setting sat at the bottom of the range. Raised, and every reported figure
   * is the best of several seeds so all arms are undercounted equally little. */
  for (const tau of TAUS) {
    let best = 0;
    for (const seed of [99, 7, 4242])
      best = Math.max(
        best,
        K.packingCeiling(mat, tau, { restarts: RESTARTS, seed }).size,
      );
    row[`tau${tau}`] = best;
  }
  return row;
}

function main() {
  const t0 = process.hrtime.bigint();
  const { pool, rejected, attempted } = sampleMorphologies(7);

  console.log(`morphologies sampled : ${attempted}`);
  console.log(
    `  rejected (contact < ${MIN_CONTACT}) : ${rejected}  (${((100 * rejected) / attempted).toFixed(1)}%)`,
  );
  console.log(`  viable species pool  : ${pool.length}`);

  /* Precision, measured off the real arm so the synthetic arms inherit it
   * instead of being handed a number chosen by me. A steelman given tighter
   * blobs than the geometry produces would win for the wrong reason. */
  const prec = precisionPool(pool, 31337);
  const sQ = pool.map((p) => K.sSpread(p.d.hits)).sort((a, b) => a - b);
  const pQ = pool.map((p) => K.phiSpread(p.d.hits)).sort((a, b) => a - b);
  const at = (a, f) => a[Math.floor(f * (a.length - 1))];
  console.log(
    `\nmatched precision: the synthetic arms draw (s sd, phi sd) PAIRS from the\n` +
      `real pool's own distribution, not its median.\n` +
      `  s sd    p05 ${at(sQ, 0.05).toFixed(4)}  med ${at(sQ, 0.5).toFixed(4)}  p95 ${at(sQ, 0.95).toFixed(4)}\n` +
      `  phi sd  p05 ${at(pQ, 0.05).toFixed(4)}  med ${at(pQ, 0.5).toFixed(4)}  p95 ${at(pQ, 0.95).toFixed(4)} rad`,
  );

  /* How much of the animal can the morphology space actually reach? If this
   * is a thin ribbon, the second placement dimension is nominal. */
  const occupied = new Set();
  const occupiedS = new Set();
  for (const p of pool)
    for (const h of p.d.hits) {
      const sb = K.sBin(h.s);
      const pb = Math.min(
        19,
        Math.floor(((h.phi + Math.PI) / (2 * Math.PI)) * 20),
      );
      occupied.add(`${sb},${pb}`);
      occupiedS.add(sb);
    }
  const TOTAL_BINS = K.S_BINS * K.PHI_BINS;
  console.log(
    `reachable body bins  : ${occupied.size} of ${TOTAL_BINS} 2-D bins (${((100 * occupied.size) / TOTAL_BINS).toFixed(1)}%), ${occupiedS.size} of ${K.S_BINS} along the body`,
  );

  const sigs2D = pool.map((p) => K.kdeSig(p.d.hits));
  const sigs1D = pool.map((p) => K.kdeSig(p.d.hits, { dims: 1 }));

  const rows = [
    ceilings(armL0(60), "L0 (no placement)"),
    ceilings(sigs1D, "L1-strict (roll discarded)"),
    ceilings(armFree1D(scaled(200), prec, 20000), "L1-free, drawn precision"),
    ceilings(
      armFree1DEvolved(scaled(200), prec, 21000),
      "L1-free, EVOLVED precision",
    ),
    ceilings(sigs2D, "L2 (from morphology)"),
    ceilings(armFree2D(scaled(80), 40, prec, 40000), "CTRL-2D-ideal [CEILING]"),
  ];

  /* ⚠️ RESOLUTION CHECK — kept, INVERTED, and still printed BEFORE the table.
   *
   * On the histogram this existed to WARN: overlap was a 24-bin grid, the
   * evolved precision was five times finer than one bin, and the evolved row
   * was a floor imposed by binning rather than a ceiling imposed by geometry.
   *
   * The continuous metric is supposed to remove that mechanism, and a claim of
   * removal needs a POSITIVE CONTROL rather than an assurance. So the same
   * probe now runs as a test the new metric can fail: halve the precision and
   * the ceiling MUST rise. If it does not, the replacement saturates too and
   * every number below is again a binning artefact — which is precisely the
   * thing that would otherwise be invisible, because a saturated metric
   * produces a perfectly plausible table. */
  {
    const binW = (1 - K.S_LO) / K.S_BINS;
    const sMin = Math.min(...prec.map((q) => q[0]));
    const probe = (sSd) => {
      const sg = [];
      const count = scaled(200);
      for (let i = 0; i < count; i++)
        sg.push(
          K.kdeSig(
            K.syntheticHits(
              S_LO + ((i + 0.5) / count) * S_SPAN,
              0,
              sSd,
              0.0788,
              {
                n: 900,
                seed: 31000 + i,
                sLo: S_LO,
              },
            ),
          ),
        );
      return K.packingCeiling(K.kdeOverlapMatrix(sg), 0.2, {
        restarts: RESTARTS,
        seed: 7,
      }).size;
    };
    /* ⚠️ Probe FINER, not coarser. The first version of this check doubled sSd
     * and reported "resolves" — but doubling moves OUT of the saturated zone,
     * so it can only ever pass. Saturation means making precision finer buys
     * nothing, so halving is the test. */
    const a = probe(sMin),
      b = probe(sMin / 2);
    console.log(
      `\nMETRIC RESOLUTION CONTROL: the evolved precision is sSd ${sMin.toFixed(4)}, ` +
        `${(binW / sMin).toFixed(1)}x finer\n    than the ${binW.toFixed(4)} bin the old histogram metric used.\n` +
        `    ceiling at sSd ${sMin.toFixed(4)} = ${a}; at HALF that (${(sMin / 2).toFixed(4)}, finer) = ${b}.` +
        (b > a
          ? `\n    PASS -> finer placement still buys more species (${a} -> ${b}), so the\n` +
            "    continuous metric resolves this regime and the table below is a\n" +
            "    measurement rather than a floor."
          : "\n    ⚠️ FAIL -> the CONTINUOUS metric is saturated here too. Every figure\n" +
            "    below is again a resolution floor, not geometry. Do not quote them."),
    );
  }

  console.log("\nspecies packing ceiling, by isolation threshold tau:\n");
  const head = [
    "arm".padEnd(38),
    "pool".padStart(5),
    ...TAUS.map((t) => `t=${t}`.padStart(7)),
  ];
  console.log(head.join(" "));
  console.log("-".repeat(head.join(" ").length));
  for (const r of rows) {
    console.log(
      [
        r.arm.padEnd(38),
        String(r.pool).padStart(5),
        ...TAUS.map((t) => String(r[`tau${t}`]).padStart(7)),
      ].join(" "),
    );
  }

  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  console.log(`\nelapsed ${(ms / 1000).toFixed(1)}s`);
  return rows;
}

if (require.main === module) main();
module.exports = {
  main,
  sampleMorphologies,
  precisionPool,
  armFree1D,
  armFree1DEvolved,
  armFree2D,
  S_LO,
  S_SPAN,
  scaled,
  RESTARTS,
};
