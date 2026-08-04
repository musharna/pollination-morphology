/*
 * secondary-contact.js — is there a separation above which divergence maintains
 * itself? (roadmap B)
 *
 * WHY THIS, AND WHY NOW. Seven mechanisms have been tested against roadmap B's
 * barrier and none of them moves placement. Deception was the last candidate
 * with a documented rare-morph advantage and it turned out to diversify the
 * ADVERTISEMENT and not the plant. So the roadmap's own standing alternative,
 * written down after the fifth failure, is no longer a fallback — it is the
 * front-runner:
 *
 *   "NOTHING in this model pushes a rare placement past parity, and placement
 *    divergence needs DRIFT plus the measured 19.1% HYBRID COST rather than a
 *    rare-morph advantage."
 *
 * ⚠️ THAT IS A DIFFERENT QUESTION FROM THE ONE ALREADY ANSWERED. Every run so
 * far asked whether a split can ARISE from one cloud. This asks whether a split
 * PERSISTS once it exists. Origin and maintenance are different problems and a
 * negative on the first says nothing about the second.
 *
 * The IBM is the right tool because it already contains the hybrid cost
 * NATIVELY. Nothing is imposed: hybrids inherit shape additively, land between
 * their parents (measured 2026-08-02, detour 1.01), and are charged for
 * placement mismatch by the transfer matrix itself. So this run does not add a
 * mechanism — it removes the assumption that a split has to build itself.
 *
 * THE PREDICTION WORTH FALSIFYING. If persistence has a threshold separation,
 * that is a quotable number with an immediate empirical test attached: in
 * sympatric Platanthera, placement diverged far enough to move pollen from
 * proboscis to cheek and the two STILL share a gene pool — so the real pair must
 * sit BELOW the threshold. A model that puts them above it is wrong.
 *
 * ⚠️ THREE OUTCOMES LOOK ALIKE AND ONLY ONE STATISTIC SEPARATES THEM.
 * "The split went away" can be FUSION (they interbred), EXTINCTION (drift
 * removed a lineage, nothing fused), or the split can simply HOLD. Placement
 * separation cannot tell the first two apart, and they are opposite mechanisms.
 * Worse, a population can stay visibly bimodal in placement while its ancestry
 * has homogenised completely — genetically fused but looking split. So a neutral
 * ancestry tracer is carried (`anc` in sim/ibm.js): it reads nothing, decides
 * nothing, and consumes no random numbers, and it is what makes the three
 * outcomes distinguishable.
 */

const I = require("../sim/ibm.js");
const E = require("../sim/evolve.js");
const C = require("../sim/carryover.js");

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const sd = (xs) => {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(
    xs.reduce((s, x) => s + (x - m) * (x - m), 0) / (xs.length - 1),
  );
};
const f2 = (x) =>
  x === null || x === undefined ? "   -  " : x.toFixed(2).padStart(6);
const f3 = (x) =>
  x === null || x === undefined ? "    -  " : x.toFixed(3).padStart(7);

/* Smoke mode, for the same reason as experiments/deception-ibm.js: a 20-minute
 * run with no way to exercise its own reporting is how a verdict bug survives. */
const SMOKE = process.env.SC_SMOKE === "1";
const N = SMOKE ? 12 : 30;
const GENS = SMOKE ? 4 : 35;
const SEEDS = SMOKE ? [1, 2] : [1, 2, 3, 4, 5];
const SITE_N = SMOKE ? 50 : 160;
if (SMOKE)
  console.log(
    "\n*** SC_SMOKE=1 — tiny configuration. Exercises the code path and the\n" +
      "*** reporting. THE NUMBERS BELOW ARE NOT RESULTS.\n",
  );

/* The separations to test, in body-distance units. The reachable range by
 * mutating one genome is roughly 0.2 to 14 (probed), and the rare/common
 * barrier was originally characterised at "distance ~10". */
const SEPARATIONS = SMOKE ? [0.5, 6] : [0.5, 1, 2, 4, 8];

const rule = (s) => console.log("\n" + s + "\n" + "-".repeat(s.length));
const optsAt = (extra = {}) => ({ ...I.DEFAULTS, siteN: SITE_N, ...extra });

// ========================================================================
// founding two lineages at a TARGET placement separation
// ========================================================================

/*
 * ⚠️ PLACEMENT IS STILL NEVER A GENE. A target separation cannot be assigned,
 * because placement is not a thing a genome carries — so genomes are DRAWN and
 * then SELECTED by the placement they turn out to produce. That is the only
 * move consistent with the founding constraint, and it is why the realised
 * separation is reported alongside the target rather than assumed equal to it.
 */
function twoLineages(n, rng, srng, targetD) {
  const base = { ...E.randomGenome(rng), signal: srng() };
  const opts = optsAt();
  const placeOf = (g) =>
    I.sitesOf([{ h1: g, h2: g }], opts, 0).map(I.placementOf)[0];
  const p0 = placeOf(base);
  if (!p0) return null;

  let best = null;
  for (const step of [0.05, 0.1, 0.2, 0.3, 0.5, 0.8, 1.2, 1.6]) {
    for (let k = 0; k < 8; k++) {
      const g = E.mutate(base, rng, step);
      g.signal = srng();
      const p = placeOf(g);
      if (!p) continue;
      const d = I.dist(p0, p);
      const err = Math.abs(d - targetD);
      if (!best || err < best.err) best = { g, d, err };
    }
  }
  if (!best) return null;

  /* Each lineage is near-clonal, which is what "two lineages meeting" means.
   * Ancestry 0 and 1 are labels on the individual, not alleles. */
  const half = Math.floor(n / 2);
  const pop = [
    ...I.foundPopulation(half, rng, {
      spread: 0.02,
      srng,
      base,
      anc: 0,
    }),
    ...I.foundPopulation(n - half, rng, {
      spread: 0.02,
      srng,
      base: best.g,
      anc: 1,
    }),
  ];
  return { pop, realised: best.d, gA: base, gB: best.g };
}

const ancMean = (pop) => mean(pop.map((i) => i.anc || 0));

/*
 * The classification. `ancVar` starts at 0.25 for an even 0/1 split and falls to
 * 0 under either fusion or extinction — `ancMean` is what tells those apart,
 * because fusion converges on 0.5 while extinction converges on 0 or 1.
 */
function fate(finalPop, ancVar0) {
  const v = I.ancestryVar(finalPop);
  const m = ancMean(finalPop);
  const held = v > 0.4 * ancVar0;
  if (held) return { tag: "HELD", v, m };
  if (m < 0.15 || m > 0.85) return { tag: "one lost", v, m };
  return { tag: "FUSED", v, m };
}

// ========================================================================
// PART 0 — the anchor gate
// ========================================================================

/*
 * ANCHOR 1 — the tracer must have changed nothing. It is not on a haplotype and
 * draws no random numbers, so the shape dynamics must be bit-identical to the
 * model before it existed. Golden generated from commit c5267d1, NOT from the
 * code under test.
 */
const PRE_TRACER = [
  [0.6426076918656048, 3.0637323268730365],
  [0.8843517599890253, 3.6807972859897253],
  [0.8257455458521449, 3.61632994537921],
  [0.49249979315034653, 2.269042873658907],
  [0.6023262955018738, 2.172879959409133],
];
function anchorInert() {
  const h = I.run({
    n: 12,
    generations: 5,
    seed: 3,
    siteN: 60,
    visits: 6000,
  }).history;
  const got = h.map((r) => [r.spread, r.separation]);
  const ok = JSON.stringify(got) === JSON.stringify(PRE_TRACER);
  console.log("  1. the ancestry tracer changed NOTHING about the dynamics");
  console.log(
    `     shape history bit-identical to commit c5267d1   ${ok ? "ok" : "FAIL"}`,
  );
  return ok;
}

/*
 * ⚠️ ANCHOR 2 — IS THE HYBRID COST ACTUALLY OPERATING HERE?
 *
 * The whole hypothesis rests on it, and it is NOT imposed anywhere — it is meant
 * to fall out of placement mismatch. If it does not bite, every "the split fused"
 * result below is a population with no force holding it apart, which is a broken
 * harness rather than a finding.
 *
 * ⚠️⚠️ THIS ANCHOR FAILED TWICE AND BOTH TIMES THE ANCHOR WAS WRONG. Recorded
 * because each failure is a real lesson about the quantity being reproduced.
 *
 * FAILURE 1 — the wrong FREQUENCY. It ran one generation of free mating from a
 * 50/50 founding and compared the resulting intermediates against the pure types:
 * −18.7%, i.e. hybrids do BETTER. The reason is in the source document's own
 * sentence — the cost is "underdominance arising from FREQUENCY DEPENDENCE rather
 * than from transgression". The 19.1% is defined for a hybrid RARE among two
 * parental morphs; after one generation of free mating the intermediates are the
 * MAJORITY at the modal placement, and this model's placement selection is
 * stabilising (−48.9%), so the common central type is favoured. Inverting the
 * frequency condition inverted the sign.
 *
 * FAILURE 2 — the wrong CONSTRUCTION. Corrected to one hybrid among 10+10
 * parentals, it read 1.145 +/- 0.252 (n=12) and still would not reproduce. Two
 * differences from the published construction, both mine:
 *   - the published pairs are two INDEPENDENT random genomes at a minimum
 *     separation. Mine were a genome and its own MUTANT, which share almost
 *     everything, so there was barely a mismatch to pay for.
 *   - the published hybrid is a RECOMBINANT (each locus from one parent or the
 *     other). Mine was an additive F1 sitting at the exact midpoint.
 *
 * So the anchor now does BOTH, and the distinction turns out to matter for the
 * experiment rather than only for the anchor:
 *
 *   2a  the PUBLISHED construction — independent pairs, recombinant hybrid.
 *       This is the POSITIVE CONTROL: it proves the measurement can detect a cost
 *       that is known to be there. It is the only one gated on.
 *   2b  the IBM's OWN F1 — additive blend of the two lineage genomes at the
 *       separation actually used below. Reported, not gated, because whatever it
 *       reads is an input to the result rather than a check on the harness.
 *
 * If 2a finds the cost and 2b does not, that is not a harness problem — it says
 * the cost depends on the inheritance model, and the IBM's F1s are the case that
 * does not pay it.
 */
const BOUNDED = Object.keys(E.GENE_BOUNDS);

function recombine(a, b, rng) {
  const g = {};
  for (const k of BOUNDED) g[k] = rng() < 0.5 ? a[k] : b[k];
  g.antherTheta = rng() < 0.5 ? a.antherTheta : b.antherTheta;
  return g;
}

const viableSite = (s) => s.anther.length && s.stigma.length;
const flowerOf = (shape, seed) =>
  C.siteSet(E.toFlower(shape), optsAt().bee, { n: SITE_N, seed });
function successIn(sites, i) {
  const n = sites.length;
  const r = C.runBout(sites, new Array(n).fill(1 / n), {
    visits: optsAt().visits,
    seed: 13,
  });
  let t = 0;
  for (let j = 0; j < n; j++) if (j !== i) t += r.T[i][j] + r.T[j][i];
  return { self: t, all: r };
}

/*
 * The published net matching effect: one hybrid rare among 10+10 parentals,
 * divided by the same hybrid among clones of itself. The clone arm is what
 * removes intrinsic flower quality (it was 0.960, about 6 of the original 25 raw
 * points). Summed transfer over both sex roles because that is the statistic the
 * 19.1% was DEFINED with — reproducing a published quantity, not endorsing it.
 */
function netEffect(gA, gB, hybShape, tag) {
  const hs = flowerOf(hybShape, 8000 + tag);
  if (!viableSite(hs)) return null;
  const mixed = [];
  for (let i = 0; i < 10; i++) mixed.push(flowerOf(gA, 7000 + tag * 40 + i));
  for (let i = 0; i < 10; i++) mixed.push(flowerOf(gB, 7500 + tag * 40 + i));
  if (!mixed.every(viableSite)) return null;
  mixed.push(hs);
  const rm = successIn(mixed, mixed.length - 1);
  const parentMixed = mean(
    Array.from({ length: 20 }, (_, i) => {
      let t = 0;
      for (let j = 0; j < mixed.length; j++)
        if (j !== i) t += rm.all.T[i][j] + rm.all.T[j][i];
      return t;
    }),
  );
  if (!(parentMixed > 0)) return null;
  const hClones = Array.from({ length: 21 }, (_, i) =>
    flowerOf(hybShape, 8600 + tag * 40 + i),
  );
  const aClones = Array.from({ length: 21 }, (_, i) =>
    flowerOf(gA, 9200 + tag * 40 + i),
  );
  if (!hClones.every(viableSite) || !aClones.every(viableSite)) return null;
  const hSolo = successIn(hClones, 0).self;
  const aSolo = successIn(aClones, 0).self;
  if (!(aSolo > 0) || !(hSolo > 0)) return null;
  return rm.self / parentMixed / (hSolo / aSolo);
}

const ci = (xs) =>
  xs.length > 1 ? (1.96 * sd(xs)) / Math.sqrt(xs.length) : 0;

function anchorHybridCost() {
  const nPairs = SMOKE ? 4 : 12;
  const rng = E.makeRng(20260804);

  /* --- 2a: the published construction, as the positive control --- */
  const pool = [];
  for (let i = 0; i < nPairs * 14 && pool.length < nPairs * 3; i++) {
    const g = E.randomGenome(rng);
    const s = flowerOf(g, 900 + i);
    if (viableSite(s)) pool.push({ g, p: I.placementOf(s) });
  }
  const pubs = [];
  let tag = 0;
  for (let i = 0; i < pool.length && pubs.length < nPairs; i++)
    for (let j = i + 1; j < pool.length && pubs.length < nPairs; j++) {
      if (!pool[i].p || !pool[j].p) continue;
      if (I.dist(pool[i].p, pool[j].p) < 1.5) continue;
      const v = netEffect(
        pool[i].g,
        pool[j].g,
        recombine(pool[i].g, pool[j].g, rng),
        ++tag,
      );
      if (v !== null && Number.isFinite(v)) pubs.push(v);
    }
  const mPub = pubs.length ? mean(pubs) : null;
  const hiPub = mPub === null ? null : mPub + ci(pubs);
  const ok = hiPub !== null && hiPub < 1;

  console.log(
    `\n  2a. POSITIVE CONTROL — the published construction (2026-08-02: 0.809 [0.708, 0.910])`,
  );
  console.log(
    `      independent parent pairs, RECOMBINANT hybrid, clone control`,
  );
  console.log(
    `      net matching effect ${mPub === null ? "n/a" : mPub.toFixed(3)} +/- ${ci(pubs).toFixed(3)}` +
      `  (n=${pubs.length}, upper ${hiPub === null ? "n/a" : hiPub.toFixed(3)})   ${ok ? "ok" : "FAIL"}`,
  );

  /* --- 2b: the IBM's own F1, additive, at the separations actually used --- */
  console.log(
    `\n  2b. the IBM's OWN hybrid — additive F1 of the two lineages (reported, not gated)`,
  );
  console.log("        target d   net matching effect");
  for (const d of SEPARATIONS) {
    const vals = [];
    for (const seed of SEEDS) {
      const r2 = E.makeRng(seed);
      const s2 = I.signalRng(seed);
      const built = twoLineages(N, r2, s2, d);
      if (!built) continue;
      const v = netEffect(
        built.gA,
        built.gB,
        I.shapeOf({ h1: built.gA, h2: built.gB }),
        1000 + Math.round(d * 10) * 7 + seed,
      );
      if (v !== null && Number.isFinite(v)) vals.push(v);
    }
    if (!vals.length) continue;
    console.log(
      `      ${f2(d)}     ${f3(mean(vals))} +/- ${ci(vals).toFixed(3)}  (n=${vals.length})`,
    );
  }
  console.log(
    `      Gated on 2a only. 2b is an INPUT to the result: if the IBM's own F1s pay no\n` +
      `      cost, the force assumed to maintain a split is not there to begin with.`,
  );
  return ok;
}

/*
 * ANCHOR 3 — the founding actually hits its targets, and the tracer starts where
 * it should. A run that silently founded both lineages on top of each other
 * would report "everything fuses" no matter what the mating system did.
 */
function anchorFounding() {
  console.log(
    `\n  3. two lineages can be founded at the requested separations`,
  );
  console.log(
    "       target   realised (mean over seeds)   ancVar at founding",
  );
  let ok = true;
  for (const d of SEPARATIONS) {
    const got = [];
    const vars = [];
    for (const seed of SEEDS) {
      const rng = E.makeRng(seed);
      const srng = I.signalRng(seed);
      const b = twoLineages(N, rng, srng, d);
      if (!b) continue;
      got.push(b.realised);
      vars.push(I.ancestryVar(b.pop));
    }
    const mg = mean(got);
    const mv = mean(vars);
    /* within a factor of two of the target, and the tracer at its 0.25 maximum */
    const good = mg > d / 2 && mg < d * 2 && Math.abs(mv - 0.25) < 0.02;
    ok = ok && good;
    console.log(
      `     ${f2(d)}   ${f2(mg)}                     ${f3(mv)}   ${good ? "ok" : "FAIL"}`,
    );
  }
  return ok;
}

// ========================================================================
// the arms
// ========================================================================

function contactRun(d, seed, extra = {}, n = N) {
  const rng = E.makeRng(seed);
  const srng = I.signalRng(seed);
  const built = twoLineages(n, rng, srng, d);
  if (!built) return null;
  const v0 = I.ancestryVar(built.pop);
  const out = I.run({
    n,
    generations: GENS,
    seed,
    siteN: SITE_N,
    found: built.pop,
    ...extra,
  });
  const last = out.history[out.history.length - 1];
  return {
    realised: built.realised,
    v0,
    fate: fate(out.pop, v0),
    sep: last.separation,
    spread: last.spread,
    minor: last.minorityFrac,
    /*
     * ⚠️ STALLING IS NOT FUSION AND MUST BE VISIBLE.
     *
     * When two lineages sit far apart, mothers can fail to find any donor at
     * all. step() then declines to replace them with selfs — deliberately, since
     * that would manufacture the isolation the run is trying to detect — and a
     * generation that cannot fill itself falls back to the previous population.
     * A run doing that is not measuring maintenance, it is frozen, and it would
     * read as a clean result. So the unmated fraction is carried out and
     * reported next to every row rather than left inside the history.
     */
    stalled: out.history.some((h) => h.stalled),
    unmated: mean(out.history.map((h) => h.unmated)),
  };
}

function sweep(label, extra) {
  console.log(`\n  ${label}`);
  console.log(
    "    target d   realised   final ancVar   final sep   HELD / FUSED / lost   unmated  stalls",
  );
  const rows = [];
  for (const d of SEPARATIONS) {
    const rs = SEEDS.map((s) => contactRun(d, s, extra)).filter(Boolean);
    if (!rs.length) continue;
    const tally = { HELD: 0, FUSED: 0, "one lost": 0 };
    rs.forEach((r) => tally[r.fate.tag]++);
    const stalls = rs.filter((r) => r.stalled).length;
    const row = {
      d,
      realised: mean(rs.map((r) => r.realised)),
      v: mean(rs.map((r) => r.fate.v)),
      v0: mean(rs.map((r) => r.v0)),
      sep: mean(rs.map((r) => r.sep ?? 0)),
      unmated: mean(rs.map((r) => r.unmated)),
      stalls,
      tally,
    };
    rows.push(row);
    console.log(
      `    ${f2(d)}     ${f2(row.realised)}     ${f3(row.v)}       ${f2(row.sep)}      ` +
        `${tally.HELD} / ${tally.FUSED} / ${tally["one lost"]}      ${f2(row.unmated)}   ${stalls}/${rs.length}${stalls ? "  <-- FROZEN, not fused" : ""}`,
    );
  }
  return rows;
}

// ========================================================================
// main
// ========================================================================

console.log("=".repeat(88));
console.log(
  "Secondary contact: is there a separation above which divergence maintains itself?",
);
console.log("=".repeat(88));

rule("PART 0 — the anchor gate");
const gate = [anchorInert(), anchorHybridCost(), anchorFounding()];
if (!gate.every(Boolean)) {
  console.log(
    SMOKE
      ? "\n(anchors do not apply at smoke size — informational only)"
      : "\nANCHORS FAILED — refusing to compute a result.",
  );
  if (!SMOKE) process.exit(1);
}

rule("PART A — two lineages meet, and mating is decided by placement");
const real = sweep("placement decides mating", {});

rule("PART B — the null: mating severed from placement");
console.log(
  "  ⚠️ THE CONTROL THAT MAKES PART A MEAN ANYTHING. If lineages persist here too,\n" +
    "  they were not held apart by the geometry — they simply never had the chance\n" +
    "  to mix, and the whole result would be about demography rather than placement.",
);
const nul = sweep("random mating (null)", { randomMating: true });

rule("PART C — does drift decide it? (population size at one separation)");
const dMid = SEPARATIONS[Math.floor(SEPARATIONS.length / 2)];
console.log(
  `  Held at separation ${dMid}; the 'drift' half of the hypothesis says a small\n` +
    `  population may lose a lineage outright before the hybrid cost can act.\n`,
);
console.log("       N     final ancVar   HELD / FUSED / lost");
const bySize = [];
for (const n of SMOKE ? [12] : [16, 30, 60]) {
  const rs = SEEDS.map((s) => contactRun(dMid, s, {}, n)).filter(Boolean);
  if (!rs.length) continue;
  const tally = { HELD: 0, FUSED: 0, "one lost": 0 };
  rs.forEach((r) => tally[r.fate.tag]++);
  bySize.push({ n, v: mean(rs.map((r) => r.fate.v)), tally });
  console.log(
    `     ${String(n).padStart(3)}       ${f3(mean(rs.map((r) => r.fate.v)))}       ` +
      `${tally.HELD} / ${tally.FUSED} / ${tally["one lost"]}`,
  );
}

// ---------------------------------------------------------------- verdict

console.log("\n" + "=".repeat(88));

const heldAt = real.filter((r) => r.tally.HELD > r.tally.FUSED);
const nullHeldAt = nul.filter((r) => r.tally.HELD > r.tally.FUSED);
const threshold = heldAt.length ? heldAt[0].d : null;
const nullThreshold = nullHeldAt.length ? nullHeldAt[0].d : null;

console.log(
  `  lowest separation where the split HOLDS   real ${threshold ?? "none"}   null ${nullThreshold ?? "none"}\n`,
);

if (threshold !== null && nullThreshold === null) {
  console.log(
    `  ✅ THERE IS A THRESHOLD, AND IT IS THE GEOMETRY THAT SETS IT.\n` +
      `\n` +
      `  Below separation ~${threshold} two lineages fuse; at or above it they hold, and the\n` +
      `  random-mating null fuses at EVERY separation — so persistence is not demography,\n` +
      `  it is placement deciding who can breed with whom.\n` +
      `\n` +
      `  That is roadmap B's standing alternative surviving its first real test: divergence\n` +
      `  does not have to be built by a rare-morph advantage, it only has to be REACHED —\n` +
      `  and once reached, the hybrid cost that falls out of placement mismatch keeps it.\n` +
      `\n` +
      `  ⚠️ THE EMPIRICAL TEST THIS OWES: sympatric Platanthera diverged in placement far\n` +
      `  enough to move pollen from proboscis to cheek and STILL shares a gene pool. The\n` +
      `  real pair must therefore sit BELOW this threshold. If it does not, this is wrong.`,
  );
} else if (threshold !== null && nullThreshold !== null) {
  console.log(
    `  ⚠️ Lineages persist in the NULL as well, so this is not about placement. Two\n` +
      `  near-clonal lineages may simply be too far apart in the mating matrix for any\n` +
      `  arm to mix them, or the tracer is not being averaged. Chase the null first.`,
  );
} else {
  console.log(
    `  EVERYTHING FUSES, at every separation tested up to ${SEPARATIONS[SEPARATIONS.length - 1]}.\n` +
      `\n` +
      `  With the hybrid cost measured live (anchor 2) and the founding verified to hit its\n` +
      `  targets (anchor 3), that is a real negative and not an inert harness: the cost is\n` +
      `  present, it is simply not enough to hold two lineages apart once they are in\n` +
      `  contact. Placement-mediated mating erased an IMPOSED bimodality on 2026-08-03 and\n` +
      `  it erases a FOUNDED one here — origin and maintenance both fail, which is a much\n` +
      `  stronger statement than either alone.`,
  );
}
console.log("=".repeat(88));
