/*
 * v1 — the evolution loop.
 *
 * THE QUESTION. The packing ceiling in the ablation was found by an OPTIMISER:
 * it saw the whole candidate pool at once and deliberately picked a mutually
 * compatible set. Evolution has no such foresight. Does a community of species
 * sharing one pollinator actually reach that ceiling, or stall far below it?
 *
 * WHY THE COMMUNITY STARTS WITH MANY SPECIES. In a single panmictic
 * population, selection on placement is POSITIVELY frequency-dependent —
 * matching the majority maximises mating success — so it converges rather than
 * diverges, and no amount of running produces speciation. Divergence needs a
 * cost to misdirected pollen. That cost is real and is what this models:
 * pollen arriving on the wrong species' stigma is lost AND occupies stigma
 * capacity the right pollen could have used. Species therefore gain by moving
 * their placement away from their competitors, which is character displacement.
 *
 * WHAT IS A GENE HERE. Shape parameters, and nothing else. Placement is
 * computed from shape by the contact model on every evaluation. The moment
 * placement is directly heritable the whole structure collapses to L1 — which
 * is exactly why L1 is included as a control arm rather than as the model.
 */

const P = require("./placement.js");
const K = require("./packing.js");

const GENE_BOUNDS = {
  axisLen: [1.8, 3.2],
  mouthR: [0.55, 1.0],
  throatR: [0.16, 0.5],
  curve: [0.0, 0.6],
  polarity: [0.05, 0.95],
  antherT: [0.35, 0.85],
  antherProject: [0.15, 0.5],
};
/* Wraps, so it is mutated and stored differently from the bounded genes. */
const ANGLE_GENE = "antherTheta";

/* Checks doc, 2026-08-01: separation past ~0.15 drives stigma contact to zero
 * outright. Held just inside that, so the stigma still meets the animal. */
const HERKOGAMY = 0.05;

function makeRng(seed) {
  let x = seed >>> 0 || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 4294967296;
  };
}
const gauss = (rng) =>
  Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(2 * Math.PI * rng());
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const wrapPi = (a) => {
  let x = a;
  while (x > Math.PI) x -= 2 * Math.PI;
  while (x < -Math.PI) x += 2 * Math.PI;
  return x;
};

function randomGenome(rng) {
  const g = {};
  for (const k in GENE_BOUNDS) {
    const [lo, hi] = GENE_BOUNDS[k];
    g[k] = lo + (hi - lo) * rng();
  }
  g[ANGLE_GENE] = wrapPi(-Math.PI + 2 * Math.PI * rng());
  return g;
}

function mutate(g, rng, rate) {
  const m = { ...g };
  for (const k in GENE_BOUNDS) {
    const [lo, hi] = GENE_BOUNDS[k];
    m[k] = clamp(m[k] + gauss(rng) * rate * (hi - lo), lo, hi);
  }
  m[ANGLE_GENE] = wrapPi(m[ANGLE_GENE] + gauss(rng) * rate * 2 * Math.PI);
  return m;
}

/* A genome is a flower. The stigma tracks the anther because a species' own
 * stigma must collect from wherever its own anther deposits. */
function toFlower(g) {
  return {
    ...P.DEFAULT_FLOWER,
    ...g,
    stigmaTheta: g[ANGLE_GENE],
    stigmaT: Math.min(0.92, g.antherT + HERKOGAMY),
  };
}

// ------------------------------------------------------------------- arms

/*
 * Each arm differs ONLY in how a genome becomes a placement signature. The
 * fitness model, the demography and the mutation operator are identical, so a
 * difference between arms can only come from the placement geometry.
 */
const ARMS = {
  /* Placement computed from 3-D morphology — the model. */
  L2: {
    sig(g, ctx) {
      const f = toFlower(g);
      const a = P.placementDistribution(f, ctx.bee, {
        n: ctx.nSamp,
        seed: ctx.seed,
        part: "anther",
      });
      const s = P.placementDistribution(f, ctx.bee, {
        n: ctx.nSamp,
        seed: ctx.seed + 1,
        part: "stigma",
      });
      if (!a.hits.length || !s.hits.length) return null; // never touches the animal
      return { A: K.sig2D(a.hits), S: K.sig2D(s.hits) };
    },
  },
  /* Placement IS a gene: one coordinate along the body, at precision matched
   * to what the morphology arm actually produces. The cheap version of the
   * whole project, and the arm that has to be beaten. */
  L1: {
    sig(g, ctx) {
      const s0 = (g.antherT - 0.35) / 0.5; // reuse a bounded gene as the site
      const hitsA = K.syntheticHits(s0, 0, ctx.sSd, ctx.phiSd, {
        n: ctx.nSamp,
        seed: ctx.seed,
      });
      const hitsS = K.syntheticHits(s0, 0, ctx.sSd, ctx.phiSd, {
        n: ctx.nSamp,
        seed: ctx.seed + 1,
      });
      if (!hitsA.length || !hitsS.length) return null;
      return { A: K.sig2D(hitsA), S: K.sig2D(hitsS) };
    },
  },
  /* No placement at all: every visit is an undifferentiated encounter, so all
   * pollen reaches all stigmas. The negative control — if the community still
   * diversifies here, diversification is not being caused by placement. */
  L0: {
    sig() {
      return { A: null, S: null };
    },
    allOverlap: 1,
  },
};

// --------------------------------------------------------------- the model

/*
 * Pollen flow. The pollinator moves between plants in proportion to their
 * abundance, so flow from i to j scales with n_i * n_j, and the fraction that
 * actually lands on j's stigma is the overlap of i's anther placement with j's
 * stigma placement.
 *
 * Per-capita reproductive success is the share of pollen arriving at a
 * species' stigmas that is its own — high when its own pollen reaches its own
 * stigmas, low when rivals clog them. It SATURATES: once a species is
 * receiving plenty of its own pollen, more does not help.
 *
 * ⚠️ k is a pollen-limitation floor and its scale is load-bearing, not
 * cosmetic. If k exceeds a species' own pollen supply at its equilibrium
 * abundance (n * O_ii, on the order of 0.017 for thirty species), then EVERY
 * species is pollen-limited, r rises steeply with abundance for all of them,
 * and the commonest wins whatever its placement. k must sit well below that.
 */
function fitnesses(sigs, n, O, k) {
  const S = n.length;
  const w = new Float64Array(S);
  for (let j = 0; j < S; j++) {
    if (!sigs[j]) continue;
    let own = 0,
      het = 0;
    for (let i = 0; i < S; i++) {
      if (!sigs[i]) continue;
      const flow = n[i] * O[i][j];
      if (i === j) own = flow;
      else het += flow;
    }
    w[j] = own / (own + het + k);
  }
  return w;
}

function overlapMatrixOf(sigs, arm) {
  const S = sigs.length;
  const O = Array.from({ length: S }, () => new Float64Array(S));
  for (let i = 0; i < S; i++) {
    for (let j = 0; j < S; j++) {
      if (!sigs[i] || !sigs[j]) continue;
      O[i][j] =
        arm.allOverlap !== undefined
          ? arm.allOverlap
          : K.overlap(sigs[i].A, sigs[j].S);
    }
  }
  return O;
}

/*
 * Fitness of a mutant of species i against the current community.
 *
 * Rebuilding the whole overlap matrix per mutant is O(S^3) per generation and
 * made a 40-species run intractable. Only row and column i change when i
 * mutates, so only the S overlaps that touch i need recomputing.
 */
function invasionFitness(sigs, n, i, cs, arm, k) {
  if (arm.allOverlap !== undefined) {
    let own = 0,
      het = 0;
    for (let j = 0; j < n.length; j++) {
      if (!sigs[j]) continue;
      if (j === i) own = n[j] * arm.allOverlap;
      else het += n[j] * arm.allOverlap;
    }
    return own / (own + het + k);
  }
  const own = n[i] * K.overlap(cs.A, cs.S);
  let het = 0;
  for (let j = 0; j < n.length; j++) {
    if (j === i || !sigs[j]) continue;
    het += n[j] * K.overlap(sigs[j].A, cs.S);
  }
  return own / (own + het + k);
}

/*
 * One generation.
 *
 *   1. every surviving species proposes one mutant, which replaces the
 *      resident if it does better against the CURRENT community (trait
 *      substitution — the standard adaptive-dynamics move, not an
 *      individual-based population genetic model, and that is a real
 *      simplification worth stating)
 *   2. abundances follow the replicator equation on the resulting fitnesses
 *   3. anything below the extinction floor is removed
 */
function step(state, params, rng) {
  const { arm, ctx, k, mutRate, extinctAt, death = 0.12, noise = 0.03 } = params;
  const live = state.species.filter((s) => s.alive);

  // 1. mutation and trait substitution
  const sigs = live.map((s) => s.sig);
  const n = live.map((s) => s.n);
  const O = overlapMatrixOf(sigs, arm);
  const w = fitnesses(sigs, n, O, k);

  for (let i = 0; i < live.length; i++) {
    const cand = mutate(live[i].g, rng, mutRate);
    const cs = arm.sig(cand, { ...ctx, seed: ctx.seed + 7 * i });
    if (!cs) continue; // a mutant that never touches the animal cannot invade
    if (invasionFitness(sigs, n, i, cs, arm, k) > w[i]) {
      live[i].g = cand;
      live[i].sig = cs;
      sigs[i] = cs;
    }
  }

  /*
   * 2. Demography — LOTTERY RECRUITMENT, not a bare replicator.
   *
   * The first version used n' = n * w / wbar with w rising without bound in
   * abundance. Nothing regulated a species as it became common, so monopoly
   * was the only attractor and every arm collapsed to one species regardless
   * of placement. That is a missing mechanism, not a bad constant: real
   * communities are limited by space as well as by pollen.
   *
   * Here a fixed fraction of sites is vacated each generation and refilled in
   * proportion to n * r. Total occupancy is conserved, so a species cannot run
   * away; it can only take share from neighbours it out-reproduces.
   */
  const Of = overlapMatrixOf(sigs, arm);
  const wf = fitnesses(sigs, n, Of, k);

  let propTot = 0;
  const prop = new Float64Array(live.length);
  for (let i = 0; i < live.length; i++) {
    /* A little demographic noise, because a community seeded at exactly equal
     * abundance with exactly equal fitness sits on an unstable equilibrium and
     * a deterministic update leaves it there forever — which reads as
     * coexistence when it is really just symmetry never being broken. */
    const jitter = 1 + noise * gauss(rng);
    prop[i] = Math.max(0, n[i] * wf[i] * jitter);
    propTot += prop[i];
  }
  if (propTot <= 0) return { extinctions: 0, meanW: 0 };

  let occ = 0;
  for (const s of live) occ += s.n;
  const vacated = death * occ;
  let mean = 0;
  for (let i = 0; i < live.length; i++) {
    live[i].n = n[i] * (1 - death) + (vacated * prop[i]) / propTot;
    mean += n[i] * wf[i];
  }

  // 3. extinction
  let extinctions = 0;
  for (const s of live) {
    if (s.n < extinctAt) {
      s.alive = false;
      extinctions++;
    }
  }
  return { extinctions, meanW: mean };
}

function init(params, rng) {
  const { arm, ctx, nSpecies } = params;
  const species = [];
  let tries = 0;
  while (species.length < nSpecies && tries < nSpecies * 20) {
    tries++;
    const g = randomGenome(rng);
    const sig = arm.sig(g, { ...ctx, seed: ctx.seed + 13 * species.length });
    if (!sig) continue; // must be able to touch the animal to start
    species.push({ g, sig, n: 1 / nSpecies, alive: true });
  }
  return { species };
}

function run(params) {
  const rng = makeRng(params.seed || 1);
  const state = init(params, rng);
  const history = [];
  for (let gen = 0; gen < params.generations; gen++) {
    const r = step(state, params, rng);
    if (gen % params.sampleEvery === 0 || gen === params.generations - 1) {
      history.push({
        gen,
        alive: state.species.filter((s) => s.alive).length,
        meanW: r.meanW,
      });
    }
  }
  return { state, history };
}

module.exports = {
  ARMS,
  GENE_BOUNDS,
  HERKOGAMY,
  randomGenome,
  mutate,
  toFlower,
  fitnesses,
  overlapMatrixOf,
  step,
  init,
  run,
  makeRng,
};
