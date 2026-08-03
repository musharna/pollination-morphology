/*
 * ibm.js — an individual-based model with real inheritance.
 *
 * WHY THIS EXISTS. Roadmap B, and it is the project's biggest open question.
 * v1 (`sim/evolve.js`) is adaptive dynamics over species that are ALREADY
 * distinct: asexual lineages, no standing variation, no recombination, no
 * hybrids. It can say which placements coexist once they exist. It structurally
 * cannot say how a lineage SPLITS, which is the interesting question.
 *
 * Everything measured for B so far has been measured against a proxy — the
 * rare-morph penalty `rare/common ~ 0.26` — in machinery that cannot speciate.
 * This is the machinery that can, so the proxy can be replaced by the thing
 * itself: does a single population ever go bimodal in placement and STAY?
 *
 * WHAT IS NEW HERE, AND IT IS ONE THING. Mating is not assumed. `runBout`
 * already returns T[i][j] = grains from plant i reaching plant j, which IS a
 * mating matrix; it has only ever been summed into per-species fitness. Here it
 * is used as what it is: a mother is drawn in proportion to the pollen she
 * received, and her mate is drawn in proportion to who actually delivered it.
 *
 *   PARENTAGE IS THEREFORE DECIDED BY THE PLACEMENT GEOMETRY, not by a mating
 *   rule written down next to it. Assortative mating is an OUTPUT.
 *
 * That matters because the alternative — an assortment parameter — would build
 * in the answer. Five of the six mechanisms tested for B failed precisely
 * because they moved visits around without changing whether a plant could find
 * a compatible partner, and a hand-written mating rule would have hidden that.
 *
 * PLACEMENT IS STILL NEVER A GENE. Genes are shape, diploid and recombining;
 * placement is computed from the phenotype by the same contact model as
 * everything else. Nothing here can set a placement site.
 *
 * WHAT THE ANSWER SHOULD LOOK LIKE. Two results already constrain it:
 *   - Panmictic selection on placement is STABILISING, -48.9% +/- 16.2pp over
 *     seven populations, and with mutation off the spread collapses 12.6x.
 *     So the default outcome must be convergence. If this model splits a
 *     population by default, it is wrong, not interesting.
 *   - Additive inheritance of shape produces BLENDING placement (detour 1.01),
 *     measured 2026-08-02 and refuting my own prediction that geometry would
 *     put hybrids off-axis. So hybrids land between their parents here too;
 *     that is inherited from the shape model, not re-decided.
 * And one real system: in sympatric Platanthera, placement diverged inside a
 * single gene pool far enough to move pollen from proboscis to cheek WITHOUT
 * producing isolation. Divergence is necessary but not sufficient, so a model
 * that turns any placement variance into a split is also wrong.
 */

const P = require("./placement.js");
const C = require("./carryover.js");
const E = require("./evolve.js");

const GENE_KEYS = Object.keys(E.GENE_BOUNDS);
const ANGLE_GENE = "antherTheta";
const ALL_KEYS = [...GENE_KEYS, ANGLE_GENE];

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

/* Circular mean of two angles. A plain average is wrong at the wrap and would
 * put the offspring of two individuals straddling +/-pi at zero — i.e. exactly
 * opposite both parents, which is not what blending means. */
function meanAngle(a, b) {
  return Math.atan2(
    (Math.sin(a) + Math.sin(b)) / 2,
    (Math.cos(a) + Math.cos(b)) / 2,
  );
}

/*
 * ADDITIVE diploid expression. Chosen rather than invented: the hybrid work of
 * 2026-08-02 measured additive inheritance of shape and found it produces
 * almost perfectly blending placement, so using anything else here would be
 * changing a measured result by fiat.
 */
function phenotype(ind) {
  const g = {};
  for (const k of GENE_KEYS) g[k] = (ind.h1[k] + ind.h2[k]) / 2;
  g[ANGLE_GENE] = meanAngle(ind.h1[ANGLE_GENE], ind.h2[ANGLE_GENE]);
  return g;
}

/*
 * A gamete: free recombination — every locus segregates independently — then
 * mutation. Free recombination is the CONSERVATIVE choice for a speciation
 * question: linkage would help divergence by keeping co-adapted alleles
 * together, so assuming none means any split found here is not an artefact of
 * a linkage map I chose.
 */
function gamete(ind, rng, rate) {
  const g = {};
  for (const k of ALL_KEYS) g[k] = rng() < 0.5 ? ind.h1[k] : ind.h2[k];
  return E.mutate(g, rng, rate);
}

function randomIndividual(rng) {
  return { h1: E.randomGenome(rng), h2: E.randomGenome(rng) };
}

/* A population of near-clones plus mutational variance — one lineage, which is
 * the starting condition the speciation question actually asks about. */
function foundPopulation(n, rng, { spread = 0.06 } = {}) {
  const base = E.randomGenome(rng);
  const pop = [];
  for (let i = 0; i < n; i++)
    pop.push({
      h1: E.mutate(base, rng, spread),
      h2: E.mutate(base, rng, spread),
    });
  return pop;
}

// -------------------------------------------------------------- placement

const DEFAULTS = {
  siteN: 90,
  visits: 24000,
  bee: P.DEFAULT_BEE,
  mutRate: 0.02,
  /*
   * Positive-control knobs. `optima` is a pair of target placements and
   * `optimaK` the strength with which proximity to the nearer one is rewarded.
   * Not a mechanism and not offered as one — it exists so that a run reporting
   * "no split" can be shown capable of reporting one. See the note in step().
   */
  optima: null,
  optimaK: 0,
  /* Sever placement from mating, for the null. */
  randomMating: false,
};

function sitesOf(pop, opts, gen) {
  return pop.map((ind, i) =>
    C.siteSet(E.toFlower(phenotype(ind)), opts.bee, {
      n: opts.siteN,
      seed: 1000 + 31 * gen + i,
    }),
  );
}

/* Mean placement of an individual's anther cloud, circular in phi. */
function placementOf(site) {
  const hits = site.anther;
  if (!hits || !hits.length) return null;
  let cs = 0,
    sn = 0;
  for (const h of hits) {
    cs += Math.cos(h.phi);
    sn += Math.sin(h.phi);
  }
  return { s: mean(hits.map((h) => h.s)), phi: Math.atan2(sn, cs) };
}

const dist = (a, b) => C.bodyDist({ s: a.s, phi: a.phi }, b.s, b.phi);

// ------------------------------------------------------------ bimodality

/*
 * Two-medoid split on the body metric the transfer model itself uses, so
 * "far apart" means far apart in the units that decide whether two plants can
 * exchange pollen at all.
 *
 * Reported as separation = (distance between medoids) / (mean within-cluster
 * distance). A single cloud arbitrarily cut in half scores ~1; two genuinely
 * distinct clouds score well above it. This is a descriptive statistic, not a
 * test, and the run quotes it against its own shuffled null rather than
 * against a threshold I picked.
 */
function twoClusterSeparation(places) {
  const pts = places.filter(Boolean);
  if (pts.length < 6) return null;
  let best = null;
  /* deterministic restarts: seed the pair from the widest-apart points */
  for (let a = 0; a < pts.length; a++)
    for (let b = a + 1; b < pts.length; b++) {
      const d = dist(pts[a], pts[b]);
      if (!best || d > best.d) best = { a, b, d };
    }
  let m1 = pts[best.a],
    m2 = pts[best.b];
  let assign = null;
  for (let iter = 0; iter < 12; iter++) {
    assign = pts.map((p) => (dist(p, m1) <= dist(p, m2) ? 0 : 1));
    for (const c of [0, 1]) {
      const members = pts.filter((_, i) => assign[i] === c);
      if (!members.length) continue;
      /* medoid: the member minimising total distance to the rest */
      let bestM = members[0],
        bestCost = Infinity;
      for (const cand of members) {
        const cost = members.reduce((s, o) => s + dist(cand, o), 0);
        if (cost < bestCost) {
          bestCost = cost;
          bestM = cand;
        }
      }
      if (c === 0) m1 = bestM;
      else m2 = bestM;
    }
  }
  const within = [];
  pts.forEach((p, i) => within.push(dist(p, assign[i] === 0 ? m1 : m2)));
  const w = mean(within);
  const sizes = [
    assign.filter((x) => x === 0).length,
    assign.filter((x) => x === 1).length,
  ];
  return {
    separation: w > 1e-9 ? dist(m1, m2) / w : 0,
    sizes,
    minorityFrac: Math.min(...sizes) / pts.length,
  };
}

/* Spread of the cloud about its own centre — the quantity measured to collapse
 * 12.6x when mutation is switched off, so it is the anchor for convergence. */
function spreadOf(places) {
  const pts = places.filter(Boolean);
  if (pts.length < 2) return 0;
  let cs = 0,
    sn = 0;
  for (const p of pts) {
    cs += Math.cos(p.phi);
    sn += Math.sin(p.phi);
  }
  const centre = { s: mean(pts.map((p) => p.s)), phi: Math.atan2(sn, cs) };
  return mean(pts.map((p) => dist(p, centre)));
}

// ------------------------------------------------------------------- step

/*
 * One generation. The whole point is between the two marked lines: parentage
 * comes out of the transfer matrix.
 */
function step(pop, opts, rng, gen) {
  const n = pop.length;
  const sites = sitesOf(pop, opts, gen);
  const r = C.runBout(sites, new Array(n).fill(1 / n), {
    visits: opts.visits,
    seed: 7 + gen,
  });

  const received = new Array(n).fill(0);
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      if (i === j) continue; // selfing is not mating success
      received[j] += r.T[i][j];
    }

  const places = sites.map(placementOf);
  let weight = received.slice();

  /*
   * ⚠️ POSITIVE CONTROL, and the first version of it was WRONG in a way worth
   * keeping on the record.
   *
   * It weighted fitness by exp(k * distance-from-the-mean), on the reasoning
   * that rewarding deviation is disruptive selection. On a ONE-dimensional
   * trait axis that is true. On the 2-D body surface it is not: "far from the
   * mean" has no direction, so it rewards a SHELL rather than two peaks, and
   * once k is large the leading extreme simply takes over and the population
   * goes DIRECTIONAL. The tell was unmissable in hindsight — the forced arm
   * came out with LESS placement spread (1.17) than the random-mating null
   * (1.97), which no genuine split can do.
   *
   * This project has now walked into that trap twice; the panmictic experiment
   * recorded the same thing, that on a |deviation| axis disruptive selection
   * rises monotonically instead of forming an interior U.
   *
   * So the control names TWO OPTIMA and rewards proximity to whichever is
   * nearer. That is a construction that must split if a split is detectable at
   * all — and if it does not, the harness cannot see splits and no negative
   * result from it means anything.
   */
  if (opts.optima && opts.optimaK) {
    weight = weight.map((w, i) => {
      if (!places[i]) return w;
      const near = Math.min(...opts.optima.map((o) => dist(places[i], o)));
      return w * Math.exp(-opts.optimaK * near);
    });
  }

  const pick = (ws) => {
    const tot = ws.reduce((a, b) => a + b, 0);
    if (!(tot > 0)) return -1;
    let x = rng() * tot;
    for (let i = 0; i < ws.length; i++) {
      x -= ws[i];
      if (x <= 0) return i;
    }
    return ws.length - 1;
  };

  const next = [];
  let failed = 0;
  const uniform = new Array(n).fill(1);
  while (next.length < n) {
    // ---- parentage from the transfer matrix ----
    /*
     * opts.randomMating severs exactly ONE link: who mates with whom stops
     * depending on placement, while mutation, recombination and demography are
     * untouched. It is the null the split statistic is read against — a
     * population that CANNOT have diverged assortatively, measured by the same
     * code — and it also says whether any structure in the real arm came from
     * the geometry or from the machinery.
     */
    const mother = pick(opts.randomMating ? uniform : weight);
    if (mother < 0) {
      failed++;
      break;
    }
    const sires = [];
    for (let i = 0; i < n; i++)
      sires.push(i === mother ? 0 : opts.randomMating ? 1 : r.T[i][mother]);
    const father = pick(sires);
    // --------------------------------------------
    if (father < 0) {
      /* nobody delivered to her: she sets no outcrossed seed. Not silently
       * replaced by a self, because that would manufacture the very isolation
       * the run is trying to detect. */
      failed++;
      if (failed > 40 * n) break;
      continue;
    }
    next.push({
      h1: gamete(pop[mother], rng, opts.mutRate),
      h2: gamete(pop[father], rng, opts.mutRate),
    });
  }

  return {
    pop: next.length ? next : pop,
    places,
    spread: spreadOf(places),
    cluster: twoClusterSeparation(places),
    unmated: failed,
    stalled: next.length < n,
  };
}

function run({
  n = 30,
  generations = 30,
  seed = 1,
  found = null,
  ...rest
} = {}) {
  const opts = { ...DEFAULTS, ...rest };
  const rng = E.makeRng(seed);
  let pop = found || foundPopulation(n, rng, {});
  const history = [];
  for (let g = 0; g < generations; g++) {
    const out = step(pop, opts, rng, g);
    pop = out.pop;
    history.push({
      gen: g,
      spread: out.spread,
      separation: out.cluster ? out.cluster.separation : null,
      minorityFrac: out.cluster ? out.cluster.minorityFrac : null,
      unmated: out.unmated,
      stalled: out.stalled,
    });
  }
  return { pop, history };
}

module.exports = {
  GENE_KEYS,
  ALL_KEYS,
  DEFAULTS,
  meanAngle,
  phenotype,
  gamete,
  randomIndividual,
  foundPopulation,
  sitesOf,
  placementOf,
  dist,
  twoClusterSeparation,
  spreadOf,
  step,
  run,
};
