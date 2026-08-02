/*
 * Is placement inheritance BLENDING?
 *
 * Roadmap B, next step after the panmictic premise. Before building an
 * individual-based model with recombination and hybrids, there is a question
 * that falls straight out of this project's one standing constraint and has a
 * different answer here than in any model where placement is a gene.
 *
 * WHY IT MATTERS. Blending inheritance is the classic enemy of speciation: if a
 * hybrid sits halfway between its parents, gene flow drags diverging morphs back
 * together, and divergence needs assortative mating to survive it. But that
 * argument assumes the trait under selection is inherited additively.
 *
 * HERE IT MIGHT NOT BE. Genes are SHAPE; placement is computed from shape by the
 * contact model. A hybrid inherits intermediate shape — and the shape-to-
 * placement map is geometric and nonlinear, so its PLACEMENT need not be
 * intermediate at all. It could land outside both parents, in a region where
 * nothing matches it. If so, geometry-derived placement generates stronger
 * reproductive isolation than a placement gene ever could, and the ablation's
 * ecological result (L2 out-packs L1) would have a genetic counterpart.
 *
 * THE STATISTICS, on the body metric that decides whether two plants can
 * actually exchange pollen:
 *
 *   detour   ( d(h,p1) + d(h,p2) ) / d(p1,p2)
 *            1.0 = exactly on the segment between the parents (blending)
 *            >1  = off the axis; the hybrid is somewhere neither parent is
 *   nearest  min( d(h,p1), d(h,p2) ) / d(p1,p2)
 *            0.5 = true midpoint;  ~0 = snaps onto one parent
 *   outside  fraction of hybrids FURTHER from both parents than they are from
 *            each other — unambiguously transgressive
 *
 * ⚠️ CONTROL. The L1 arm — placement itself as the gene — must come out blending,
 * because there it is arithmetic: the midpoint of two numbers lies between them.
 * If the harness cannot report blending where blending is guaranteed, it cannot
 * be trusted when it reports the absence of it. That control is the whole reason
 * the L1 arm is here.
 */

const P = require("../sim/placement.js");
const C = require("../sim/carryover.js");
const E = require("../sim/evolve.js");

const bee = P.DEFAULT_BEE;
const rule = (s) => console.log("\n" + s + "\n" + "-".repeat(s.length));
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const median = (xs) => {
  const a = [...xs].sort((p, q) => p - q);
  return a.length % 2
    ? a[(a.length - 1) / 2]
    : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
};

/* Duplicated from experiments/panmictic.js rather than imported: that file runs
 * its experiment on require, so importing it would execute it. Twelve lines is
 * cheaper than a refactor of merged code. */
function meanPlacement(hits) {
  if (!hits.length) return null;
  let cs = 0,
    sn = 0;
  for (const h of hits) {
    cs += Math.cos(h.phi);
    sn += Math.sin(h.phi);
  }
  return { s: mean(hits.map((h) => h.s)), phi: Math.atan2(sn, cs) };
}
const dist = (a, b) => C.bodyDist({ s: a.s, phi: a.phi }, b.s, b.phi);

const BOUNDED = Object.keys(E.GENE_BOUNDS);

/* Free recombination: every gene independently from one parent or the other.
 * This is the arm that can produce a combination neither parent had. */
function recombine(a, b, rng) {
  const g = {};
  for (const k of BOUNDED) g[k] = rng() < 0.5 ? a[k] : b[k];
  g.antherTheta = rng() < 0.5 ? a.antherTheta : b.antherTheta;
  return g;
}

/* Additive blending: every gene the average. This is what a quantitative-
 * genetics model of many small additive loci gives, and it is the case the
 * classic "blending opposes divergence" argument is about. */
function blend(a, b) {
  const g = {};
  for (const k of BOUNDED) g[k] = (a[k] + b[k]) / 2;
  /* Circular — the mean of +3.0 and -3.0 is not 0. */
  g.antherTheta = Math.atan2(
    (Math.sin(a.antherTheta) + Math.sin(b.antherTheta)) / 2,
    (Math.cos(a.antherTheta) + Math.cos(b.antherTheta)) / 2,
  );
  return g;
}

function placementOf(genome, seed) {
  const s = C.siteSet(E.toFlower(genome), bee, { n: 160, seed });
  if (!s.anther.length || !s.stigma.length) return null;
  return meanPlacement(s.anther);
}

function report(label, rows) {
  if (!rows.length) return console.log(`  ${label.padEnd(30)} no viable pairs`);
  const detour = rows.map((r) => r.detour);
  const nearest = rows.map((r) => r.nearest);
  const outside = rows.filter((r) => r.outside).length / rows.length;
  console.log(
    `  ${label.padEnd(30)} ${median(detour).toFixed(2).padStart(7)} ${median(nearest).toFixed(2).padStart(9)} ${(100 * outside).toFixed(0).padStart(8)}%   n=${rows.length}`,
  );
  return { detour: median(detour), nearest: median(nearest), outside };
}

/*
 * Pairs are drawn with a MINIMUM placement separation. Two parents that already
 * sit on top of each other make the question meaningless — every hybrid is
 * trivially "between" them — and would dilute the statistic toward blending.
 */
function makePairs(seed, want, minSep) {
  const rng = E.makeRng(seed);
  const pool = [];
  for (let i = 0; i < want * 12 && pool.length < want * 4; i++) {
    const g = E.randomGenome(rng);
    const p = placementOf(g, 900 + i);
    if (p) pool.push({ g, p });
  }
  const pairs = [];
  for (let i = 0; i < pool.length && pairs.length < want; i++)
    for (let j = i + 1; j < pool.length && pairs.length < want; j++)
      if (dist(pool[i].p, pool[j].p) >= minSep) pairs.push([pool[i], pool[j]]);
  return { pairs, pool: pool.length };
}

// ==========================================================================
// A — real morphological hybrids
// ==========================================================================
function partA() {
  rule("A — do hybrids of real morphologies land BETWEEN their parents?");
  const { pairs, pool } = makePairs(41, 140, 2.0);
  console.log(
    `  ${pool} viable genomes -> ${pairs.length} parent pairs separated by >= 2.0 body units\n`,
  );
  console.log("  cross                          detour   nearest   outside");

  const rng = E.makeRng(7);
  const rec = [],
    bl = [];
  pairs.forEach(([A, B], k) => {
    const sep = dist(A.p, B.p);
    for (const [mode, rows] of [
      [recombine(A.g, B.g, rng), rec],
      [blend(A.g, B.g), bl],
    ]) {
      const hp = placementOf(mode, 5000 + k);
      if (!hp) continue;
      const d1 = dist(hp, A.p),
        d2 = dist(hp, B.p);
      rows.push({
        detour: (d1 + d2) / sep,
        nearest: Math.min(d1, d2) / sep,
        outside: d1 > sep && d2 > sep,
      });
    }
  });
  report("free recombination", rec);
  report("additive blending", bl);
  return { rec, bl };
}

// ==========================================================================
// B — THE CONTROL: placement as the gene, where blending is guaranteed
// ==========================================================================
/*
 * The L1 world. A "genome" is the placement itself, so an additive hybrid is the
 * arithmetic midpoint and MUST score detour 1.00, nearest 0.50, outside 0%.
 * Anything else means the statistic is broken and part A says nothing.
 */
function partB() {
  rule("B — CONTROL: placement AS the gene (L1), where blending is arithmetic");
  const rng = E.makeRng(3);
  const rows = [],
    recRows = [];
  for (let k = 0; k < 200; k++) {
    const A = { s: 0.2 + 0.6 * rng(), phi: (rng() * 2 - 1) * Math.PI };
    const B = { s: 0.2 + 0.6 * rng(), phi: (rng() * 2 - 1) * Math.PI };
    const sep = dist(A, B);
    if (sep < 2.0) continue;

    /* Additive: the midpoint, circular in phi. */
    const mid = {
      s: (A.s + B.s) / 2,
      phi: Math.atan2(
        (Math.sin(A.phi) + Math.sin(B.phi)) / 2,
        (Math.cos(A.phi) + Math.cos(B.phi)) / 2,
      ),
    };
    /* Free recombination in an L1 world: each COORDINATE from one parent. Even
     * here a hybrid can be off-axis, because taking s from one parent and phi
     * from the other lands on a corner rather than the segment. That is the
     * honest L1 comparison and it is not 1.00. */
    const cross = {
      s: rng() < 0.5 ? A.s : B.s,
      phi: rng() < 0.5 ? A.phi : B.phi,
    };

    for (const [h, out] of [
      [mid, rows],
      [cross, recRows],
    ]) {
      const d1 = dist(h, A),
        d2 = dist(h, B);
      out.push({
        detour: (d1 + d2) / sep,
        nearest: Math.min(d1, d2) / sep,
        outside: d1 > sep && d2 > sep,
      });
    }
  }
  console.log("  cross                          detour   nearest   outside");
  const add = report("L1 additive (must be 1.00/0.50)", rows);
  report("L1 free recombination", recRows);

  const ok =
    add &&
    Math.abs(add.detour - 1) < 0.02 &&
    Math.abs(add.nearest - 0.5) < 0.02;
  console.log(
    ok
      ? "\n  ✅ control passes: the statistic reports blending where blending is\n" +
          "     guaranteed, so its verdict in part A is meaningful."
      : "\n  ❌ CONTROL FAILED — the statistic does not report blending where it is\n" +
          "     arithmetic. Part A means nothing. Fix this before reading it.",
  );
  return ok;
}

// ==========================================================================
// C — what it costs a hybrid
// ==========================================================================
/*
 * Detour is geometry. The question that matters for speciation is whether it
 * costs anything: a hybrid that lands off-axis only gains isolation if there is
 * nobody there to mate with. So put the hybrid into a population made of its own
 * parents' two morphs and count its mating success against a parent's.
 */
function partC() {
  rule("C — does an off-axis hybrid actually mate worse than its parents?");
  console.log(
    "  ⚠️ A hybrid mating badly among its parents is NOT yet evidence of a matching\n" +
      "  cost: it may simply be a worse FLOWER. So each hybrid is measured twice —\n" +
      "  rare among the two parental morphs, and common among clones of itself. The\n" +
      "  clonal arm has no mismatch by construction, so it isolates intrinsic\n" +
      "  quality, and only the RATIO of the two is a matching effect.\n",
  );
  const { pairs } = makePairs(41, 60, 2.0);
  const rng = E.makeRng(11);
  const mixedR = [],
    cloneR = [],
    netR = [];

  const build = (g, seed) => C.siteSet(E.toFlower(g), bee, { n: 140, seed });
  const viable = (s) => s.anther.length && s.stigma.length;

  /* Mating success of individual `i` in a population, summed over both sex
   * roles and excluding self. */
  function successIn(sites, i) {
    const n = sites.length;
    const r = C.runBout(sites, new Array(n).fill(1 / n), {
      visits: 24000,
      seed: 13,
    });
    let t = 0;
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      t += r.T[i][j] + r.T[j][i];
    }
    return { self: t, all: r };
  }

  pairs.forEach(([A, B], k) => {
    const hg = recombine(A.g, B.g, rng);
    const hs = build(hg, 8000 + k);
    if (!viable(hs)) return;

    /* Arm 1 — the hybrid is RARE among two common parental morphs. */
    const mixed = [];
    for (let i = 0; i < 10; i++) mixed.push(build(A.g, 7000 + k * 40 + i));
    for (let i = 0; i < 10; i++) mixed.push(build(B.g, 7500 + k * 40 + i));
    if (!mixed.every(viable)) return;
    mixed.push(hs);
    const rm = successIn(mixed, mixed.length - 1);
    const parentMixed = mean(
      Array.from({ length: 20 }, (_, i) => {
        let t = 0;
        for (let j = 0; j < mixed.length; j++) {
          if (i === j) continue;
          t += rm.all.T[i][j] + rm.all.T[j][i];
        }
        return t;
      }),
    );
    if (!(parentMixed > 0)) return;

    /* Arm 2 — the CONTROL. The same hybrid among 20 clones of itself, and the
     * same parent among 20 clones of itself. No mismatch is possible in either,
     * so any difference here is intrinsic flower quality, not placement. */
    const hClones = [];
    for (let i = 0; i < 21; i++) hClones.push(build(hg, 8600 + k * 40 + i));
    const aClones = [];
    for (let i = 0; i < 21; i++) aClones.push(build(A.g, 9200 + k * 40 + i));
    if (!hClones.every(viable) || !aClones.every(viable)) return;
    const hSolo = successIn(hClones, 0).self;
    const aSolo = successIn(aClones, 0).self;
    if (!(aSolo > 0)) return;

    const mixedRatio = rm.self / parentMixed; // hybrid vs parent, mismatch present
    const cloneRatio = hSolo / aSolo; // hybrid vs parent, mismatch absent
    mixedR.push(mixedRatio);
    cloneR.push(cloneRatio);
    netR.push(mixedRatio / cloneRatio); // the matching effect alone
  });

  const ci = (xs) => {
    const m = mean(xs);
    const sd = Math.sqrt(
      xs.reduce((a, x) => a + (x - m) * (x - m), 0) / (xs.length - 1),
    );
    return { m, half: (1.96 * sd) / Math.sqrt(xs.length) };
  };

  console.log(`  ${netR.length} hybrids measured in both settings\n`);
  console.log(
    "  hybrid / parent mating success        median    mean +/- 95% CI",
  );
  for (const [label, xs] of [
    ["rare among both parent morphs", mixedR],
    ["among clones of itself (control)", cloneR],
    ["NET matching effect (ratio)", netR],
  ]) {
    const c = ci(xs);
    console.log(
      `  ${label.padEnd(36)} ${median(xs).toFixed(3).padStart(6)}   ${c.m.toFixed(3)} +/- ${c.half.toFixed(3)}`,
    );
  }
  const c = ci(netR);
  console.log(
    "\n  " +
      (c.m + c.half < 1
        ? "✅ The NET interval sits below 1.0: geometry alone imposes a hybrid cost,\n" +
          "     with no genetic incompatibility of any kind. The isolation comes from\n" +
          "     where the pollen lands."
        : c.m - c.half > 1
          ? "The net effect FAVOURS hybrids — a rare placement escapes competition."
          : "⚠️ The NET interval includes 1.0. Any raw deficit is intrinsic flower\n" +
            "     quality rather than a matching cost, and roadmap B needs another\n" +
            "     source of isolation."),
  );
}

const controlOk = partB(); // control first
partA();
if (controlOk) partC();
console.log();
