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
  return { pop, realised: best.d };
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
 * The whole hypothesis rests on it, and it is NOT imposed by this code — it is
 * supposed to fall out of placement mismatch. If it does not bite at this
 * operating point then every "the split fused" result below is just a population
 * with no force holding it apart, which is a broken harness rather than a
 * finding. Measured the way it was measured on 2026-08-02: mating success of
 * intermediate-placement individuals against the two parental groups.
 */
function anchorHybridCost() {
  const costs = [];
  for (const seed of [1, 2, 3]) {
    const rng = E.makeRng(seed);
    const srng = I.signalRng(seed);
    const built = twoLineages(N, rng, srng, 4);
    if (!built) continue;
    /* one generation of mating produces hybrids; measure THEM */
    const out = I.step(built.pop, optsAt(), rng, 0, srng);
    const kids = out.pop;
    const sites = I.sitesOf(kids, optsAt(), 1);
    const n = sites.length;
    const r = C.runBout(sites, new Array(n).fill(1 / n), {
      visits: optsAt().visits,
      seed: 7,
    });
    const succ = new Array(n).fill(0);
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        succ[j] += r.T[i][j];
        succ[i] += r.T[i][j];
      }
    const hyb = [],
      par = [];
    kids.forEach((k, i) => {
      const a = k.anc || 0;
      if (a > 0.35 && a < 0.65) hyb.push(succ[i]);
      else par.push(succ[i]);
    });
    if (hyb.length >= 2 && par.length >= 2)
      costs.push(1 - mean(hyb) / mean(par));
  }
  const mc = costs.length ? mean(costs) : null;
  const ok = mc !== null && mc > 0;
  console.log(
    `\n  2. the HYBRID COST is live at this operating point (2026-08-02: 19.1%)`,
  );
  console.log(
    `     intermediate-placement offspring lose ${mc === null ? "n/a" : (100 * mc).toFixed(1) + "%"} of mating success   ${ok ? "ok" : "FAIL"}` +
      `${costs.length ? "   [" + costs.map((c) => (100 * c).toFixed(0) + "%").join(", ") + "]" : ""}`,
  );
  console.log(
    `     (not imposed anywhere — it falls out of placement mismatch, which is why\n` +
      `      it has to be measured rather than assumed)`,
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
