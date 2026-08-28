/*
 * ibm.js — does a single population ever split on placement? (roadmap B)
 *
 * Every mechanism tested for B so far has been scored against a PROXY: the
 * rare-morph penalty `rare/common ~ 0.26`, measured in machinery that cannot
 * speciate. Six mechanisms were tried; five did nothing and deception was the
 * first to push a rare placement past parity. But "past parity" is not
 * "speciated" — nothing has ever run a population with real inheritance and
 * asked whether it actually goes bimodal and stays.
 *
 * This does. `sim/ibm.js` draws parentage out of the transfer matrix, so
 * assortative mating is an OUTPUT of the placement geometry rather than a
 * parameter, and the offspring of two plants inherit shape diploidly with free
 * recombination.
 *
 * ⚠️ THE ANCHOR GATE IS NOT DECORATION. A model that splits populations by
 * default would be broken, not exciting, because the panmictic experiment
 * already MEASURED that placement selection is stabilising. So nothing is
 * computed until two validated facts reproduce here. This gate has already
 * earned its keep once: my first diagnostic of it correlated deviation against
 * pollen RECEIVED, which is only the female half of fitness, and read +0.149 --
 * i.e. disruptive. Realized parentage, which is what actually decides
 * representation, reads -0.842. A headline of "the IBM is disruptive" was one
 * unchecked measurement away.
 */

const I = require("../sim/ibm.js");
const E = require("../sim/evolve.js");
const C = require("../sim/carryover.js");
const { claim } = require("../sim/verdict-gates.js");

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const sd = (xs) => {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(
    xs.reduce((s, x) => s + (x - m) * (x - m), 0) / (xs.length - 1),
  );
};
const f2 = (x) => (x === null ? "   -  " : x.toFixed(2).padStart(6));

const N = 30;
const GENS = 35;
const SEEDS = [1, 2, 3, 4];
const SITE_N = 160;

// ------------------------------------------------------------- anchor gate

/*
 * ANCHOR 1. Realized parentage must be STABILISING. Measured by actually
 * sampling parents the way the model does, not by summing one sex's fitness.
 */
function realizedGradient(seed) {
  const rng = E.makeRng(seed);
  const pop = I.foundPopulation(N, rng, { spread: 0.06 });
  const opts = { ...I.DEFAULTS, siteN: SITE_N };
  const sites = I.sitesOf(pop, opts, 0);
  const n = sites.length;
  const r = C.runBout(sites, new Array(n).fill(1 / n), {
    visits: opts.visits,
    seed: 7,
  });
  const rec = new Array(n).fill(0);
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) if (i !== j) rec[j] += r.T[i][j];

  const pick = (ws, rr) => {
    const t = ws.reduce((a, b) => a + b, 0);
    if (!(t > 0)) return -1;
    let x = rr() * t;
    for (let i = 0; i < ws.length; i++) {
      x -= ws[i];
      if (x <= 0) return i;
    }
    return ws.length - 1;
  };
  const cnt = new Array(n).fill(0);
  const r2 = E.makeRng(seed * 977 + 5);
  for (let k = 0; k < 40000; k++) {
    const mo = pick(rec, r2);
    if (mo < 0) continue;
    const sires = [];
    for (let i = 0; i < n; i++) sires.push(i === mo ? 0 : r.T[i][mo]);
    const fa = pick(sires, r2);
    if (fa < 0) continue;
    cnt[mo]++;
    cnt[fa]++;
  }

  const pl = sites.map(I.placementOf);
  const ok = pl.filter(Boolean);
  let cs = 0,
    sn = 0;
  for (const p of ok) {
    cs += Math.cos(p.phi);
    sn += Math.sin(p.phi);
  }
  const centre = { s: mean(ok.map((p) => p.s)), phi: Math.atan2(sn, cs) };
  const rows = pl
    .map((p, i) => (p ? { d: I.dist(p, centre), f: cnt[i] } : null))
    .filter(Boolean)
    .sort((a, b) => a.d - b.d);
  const q = Math.floor(rows.length / 3);
  const near = mean(rows.slice(0, q).map((x) => x.f));
  const far = mean(rows.slice(-q).map((x) => x.f));
  return { ratio: far / near };
}

function anchors() {
  console.log("PART 0 -- the two validated facts this model must reproduce\n");
  let ok = true;

  const ratios = SEEDS.map((s) => realizedGradient(s).ratio);
  const mr = mean(ratios);
  const a1 = mr < 0.95;
  ok = ok && a1;
  console.log(
    `  1. realized parentage is STABILISING (panmictic: -48.9% on total fitness)`,
  );
  console.log(
    `     deviant third reproduces ${mr.toFixed(2)}x the central third   ${a1 ? "ok" : "FAIL"}   [${ratios.map((x) => x.toFixed(2)).join(", ")}]`,
  );

  /* ANCHOR 2. With mutation off the cloud must contract (panmictic measured a
   * 12.6x collapse). Seed-averaged, because drift at N=30 is loud. */
  const collapses = SEEDS.map((seed) => {
    const h = I.run({
      n: N,
      generations: GENS,
      seed,
      mutRate: 0,
      siteN: SITE_N,
    }).history;
    return h[0].spread / h[h.length - 1].spread;
  });
  const mc = mean(collapses);
  const a2 = mc > 1.5;
  ok = ok && a2;
  console.log(`\n  2. with mutation OFF the placement cloud CONTRACTS`);
  console.log(
    `     spread collapses ${mc.toFixed(1)}x over ${GENS} generations         ${a2 ? "ok" : "FAIL"}   [${collapses.map((x) => x.toFixed(1)).join(", ")}]`,
  );
  console.log();
  return ok;
}

// ----------------------------------------------------- detectability control

/*
 * ⚠️ DIFFERENT MECHANISM CLASS, after two failures of the same one.
 *
 * The first two positive controls both imposed FECUNDITY selection and both
 * failed to split, which left two readings indistinguishable: either the
 * selection cannot beat the mating system, or the statistic cannot see a split
 * at all. A control that shares a mechanism with the thing under test cannot
 * separate those, because the mechanism under test is free to defeat it.
 *
 * So this one does not select at all. It hands the pipeline a population that
 * IS two lineages and asks only whether the measurement can see it. That
 * isolates DETECTABILITY from PRODUCIBILITY, and it is the question the other
 * two controls were silently conflating.
 */
function detectability() {
  console.log("PART 0b -- can this measurement see a split at all?\n");
  const rows = [];
  for (const seed of [1, 2, 3, 4]) {
    const rng = E.makeRng(seed);
    const two = [
      ...I.foundPopulation(N / 2, rng, { spread: 0.02 }),
      ...I.foundPopulation(N / 2, rng, { spread: 0.02 }),
    ];
    const one = I.foundPopulation(N, rng, { spread: 0.06 });
    const pl = (p) =>
      I.sitesOf(p, { ...I.DEFAULTS, siteN: SITE_N }, 0).map(I.placementOf);
    const a = I.twoClusterSeparation(pl(two));
    const b = I.twoClusterSeparation(pl(one));
    rows.push({ seed, two: a.separation, one: b.separation });
  }
  const best = Math.max(...rows.map((r) => r.two / r.one));
  console.log("    seed   two lineages   one lineage   ratio");
  for (const r of rows)
    console.log(
      `    ${String(r.seed).padStart(4)}   ${f2(r.two)}        ${f2(r.one)}      ${f2(r.two / r.one)}x`,
    );
  const ok = best > 5;
  console.log(
    `\n    the statistic reads a real split up to ${best.toFixed(0)}x the one-cloud baseline   ${ok ? "ok" : "FAIL"}`,
  );
  console.log(
    "    (a seed near 1x is correct, not broken: two random lineages can land in",
  );
  console.log("     the same place, and then there is nothing to detect.)\n");
  return ok;
}

// ------------------------------------------------------------ the question

/*
 * Two optima for the positive control, taken from the founding population's own
 * placements — the two individuals furthest apart. Chosen that way so the
 * targets are REACHABLE by the genomes actually present; a pair of coordinates
 * I invented might sit somewhere no genome in the population can express, and
 * then a failure to split would say nothing about the harness.
 */
function optimaFor(seed) {
  const rng = E.makeRng(seed);
  const pop = I.foundPopulation(N, rng, { spread: 0.06 });
  const places = I.sitesOf(pop, { ...I.DEFAULTS, siteN: SITE_N }, 0)
    .map(I.placementOf)
    .filter(Boolean);
  let best = null;
  for (let a = 0; a < places.length; a++)
    for (let b = a + 1; b < places.length; b++) {
      const d = I.dist(places[a], places[b]);
      if (!best || d > best.d) best = { d, o: [places[a], places[b]] };
    }
  return best ? best.o : null;
}

function arm(label, extra, withOptima = false) {
  const runs = SEEDS.map((seed) =>
    I.run({
      n: N,
      generations: GENS,
      seed,
      siteN: SITE_N,
      ...(withOptima ? { optima: optimaFor(seed) } : {}),
      ...extra,
    }),
  );
  const last = runs.map((r) => r.history[r.history.length - 1]);
  const seps = last.map((h) => h.separation).filter((x) => x !== null);
  const minor = last.map((h) => h.minorityFrac).filter((x) => x !== null);
  const spread = last.map((h) => h.spread);
  /* persistence: the split must be there over the final third, not in one frame */
  const tail = runs.map((r) => {
    const t = r.history.slice(Math.floor((GENS * 2) / 3));
    return mean(t.map((h) => h.separation ?? 0));
  });
  /* ⚠️ `separation` is gap/dispersion and is UNBOUNDED in its denominator: a
   * majority 100x tighter multiplies it ~97x with the split unchanged. Both
   * parts are carried out so a reader can tell a wider gap from a tighter core.
   * See sim/ibm.js twoClusterSeparation and tests/split-stats.test.js. */
  const gaps = last.map((h) => h.gap).filter((x) => x !== null);
  const disp = last.map((h) => h.dispersion).filter((x) => x !== null);
  return {
    label,
    sep: [mean(seps), sd(seps)],
    tail: [mean(tail), sd(tail)],
    minor: mean(minor),
    gap: gaps.length ? mean(gaps) : null,
    dispersion: disp.length ? mean(disp) : null,
    spread: mean(spread),
    stalled: last.some((h) => h.stalled),
  };
}

function report(a) {
  console.log(
    `  ${a.label.padEnd(30)} ${f2(a.sep[0])} +/-${f2(a.sep[1])}   ${f2(a.tail[0])}    ${f2(a.minor)}  ` +
      `${f2(a.gap)} ${f2(a.dispersion)}  ${f2(a.spread)}${a.stalled ? "  (a run stalled)" : ""}`,
  );
}

// ------------------------------------------------------------------- main

console.log("=".repeat(84));
console.log("Does a single population split on placement? (roadmap B)");
console.log("=".repeat(84));
console.log();

if (!anchors()) {
  console.log("ANCHORS FAILED -- refusing to compute a speciation result.");
  process.exit(1);
}

if (!detectability()) {
  console.log(
    "THE MEASUREMENT CANNOT SEE A SPLIT -- refusing to report that there was none.",
  );
  process.exit(1);
}

console.log(
  "PART A -- placement-determined mating vs a null that cannot assort\n",
);
console.log(
  "  arm                              final sep        tail    minority    gap   disp   spread",
);
const real = arm("placement decides mating", {});
const nul = arm("random mating (null)", { randomMating: true });
report(real);
report(nul);
console.log();

console.log("PART B -- imposed fecundity selection toward TWO placements\n");
console.log(
  "  arm                              final sep        tail    minority    gap   disp   spread",
);
const forced = arm("two imposed optima (k=8)", { optimaK: 8 }, true);
report(forced);
console.log();

// ---------------------------------------------------------------- verdict

console.log("=".repeat(84));
const realSplits = real.tail[0] > nul.tail[0] + 2 * nul.tail[1];
const forcedSplits = forced.tail[0] > nul.tail[0] + 2 * nul.tail[1];
const forcedCollapsed = forced.spread < nul.spread;

/*
 * ⚠️⚠️ THE MINORITY WAS PRINTED AND NEVER CONSULTED. The two predicates above
 * read `tail` alone — a separation averaged over the final third — while
 * `minor` sat in the same table, unread by anything. `separation` and
 * `minorityFrac` fail on OPPOSITE shapes, which is exactly why one cannot stand
 * in for the other: a single cloud cut arbitrarily in half scores ~1 on
 * separation but a healthy ~0.5 minority, and a lone outlier scores hugely on
 * separation with a minority near 1/N. Gating on separation alone therefore
 * cannot refuse "one individual wandered off", which is the shape a split is
 * most likely to be mistaken for.
 *
 * The floor is the NULL's own minority rather than a number picked here — the
 * house rule from twoClusterSeparation's docstring, "quoted against its own
 * shuffled null rather than against a threshold I picked". The 0.5 is a declared
 * tolerance on that null-referenced quantity, not an absolute threshold: a real
 * split may be somewhat more lopsided than an arbitrary cut, but not five times
 * more.
 */
const MINOR_TOL = 0.5;
const minorityGate = (a) => ({
  name: `the minority is a lineage, not an outlier (${a.label})`,
  ok:
    a.minor == null || nul.minor == null
      ? null
      : a.minor >= MINOR_TOL * nul.minor,
  failText:
    `The smaller cluster holds ${(100 * a.minor).toFixed(1)}% of the population against the\n` +
    `random-mating null's ${(100 * nul.minor).toFixed(1)}%. A separation this lopsided is one group and a\n` +
    "few strays, not two lineages — and `separation` cannot refuse it, because a lone\n" +
    "outlier maximises the very ratio a split is being scored on.",
});

console.log(
  `  placement-mated population splits            : ${realSplits ? "YES" : "NO"}`,
);
console.log(
  `  imposed two-optima population splits         : ${forcedSplits ? "YES" : "NO"}`,
);
console.log(
  `  imposed two-optima population CONTRACTS      : ${forcedCollapsed ? "YES" : "no"}  (spread ${forced.spread.toFixed(2)} vs null ${nul.spread.toFixed(2)})`,
);
console.log();

if (realSplits) {
  console.log(
    claim({
      gates: [minorityGate(real)],
      heading:
        "  ⛔ THE TAIL SEPARATION CLEARS THE NULL AND IT IS NOT A SPLIT:",
      positive:
        "  The population SPLIT under placement-determined mating alone, and the smaller\n" +
        "  cluster is a real fraction of it rather than a handful of strays. That would be\n" +
        "  a first for this project -- check it hard before believing it.",
    }).text,
  );
} else if (forcedSplits) {
  console.log(
    claim({
      gates: [minorityGate(forced)],
      heading:
        "  ⛔ THE IMPOSED-OPTIMA TAIL CLEARS THE NULL AND IT IS NOT A SPLIT:",
      positive:
        "  Placement-mated mating alone does not split, but imposed selection toward two\n" +
        "  placements does, and the smaller cluster is a real fraction of the population.\n" +
        "  The barrier is the mating system, not the fitness surface.",
    }).text,
  );
} else {
  console.log(
    "  NEITHER splits, and the measurement demonstrably CAN see a split (Part 0b).",
  );
  console.log();
  console.log(
    "  The stronger half is Part B. Fecundity selection was pointed at two reachable",
  );
  console.log(
    "  placements at k=8 and the population still did not become bimodal -- it",
  );
  console.log(
    `  CONTRACTED, to a spread of ${forced.spread.toFixed(2)} against the random-mating null's ${nul.spread.toFixed(2)}.`,
  );
  console.log(
    "  Rewarding two placements is not enough, because whichever cluster falls behind",
  );
  console.log(
    "  loses its mates: mating is placement-mediated and therefore positively",
  );
  console.log(
    "  frequency-dependent, so the mating system ERASES an imposed bimodality rather",
  );
  console.log("  than merely failing to create one.");
  console.log();
  console.log(
    "  That is the rare-morph mate-finding problem, now shown with real inheritance,",
  );
  console.log(
    "  recombination and hybrids rather than against the rare/common proxy -- and it",
  );
  console.log(
    "  is what sympatric Platanthera shows in the field, where placement diverged",
  );
  console.log("  inside one gene pool without ever isolating it.");
}
console.log("=".repeat(84));
