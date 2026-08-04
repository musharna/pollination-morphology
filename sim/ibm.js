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
const D = require("./deception.js");

const GENE_KEYS = Object.keys(E.GENE_BOUNDS);
const ANGLE_GENE = "antherTheta";

/*
 * THE ADVERTISEMENT LOCUS, and it is worth being explicit about why this one is
 * allowed to be a gene when placement is not.
 *
 * Placement is not a gene because placement is not a trait — it is where a
 * particular animal's body happens to touch a particular flower, i.e. an
 * OUTCOME of two geometries meeting. Writing it as an allele would let the model
 * assume the thing it exists to derive.
 *
 * A signal is the opposite: colour and scent ARE floral traits with known
 * genetics, and in the one system where rare-morph advantage was measured in the
 * field — Gigord et al. 2001 on Dactylorhiza sambucina — the polymorphism IS a
 * heritable colour morph. So `signal` is inherited, and the invariant that
 * matters is enforced separately and tested: the advertisement must never reach
 * the geometry. `shapeOf` is what keeps it out.
 */
const SIGNAL_GENE = "signal";
const ALL_KEYS = [...GENE_KEYS, ANGLE_GENE, SIGNAL_GENE];

/*
 * The linkage group for the supergene arm. Free recombination is the
 * conservative default everywhere in this model, but it is ALSO the thing most
 * likely to stop deception from ever reaching placement — a signal allele and an
 * anther allele that arise together are separated in one generation. So linkage
 * is an explicit arm rather than a hidden assumption, and this is the group:
 * the advertisement plus the three loci that actually position the anther.
 * Mimicry supergenes of exactly this kind are real (Heliconius, Papilio
 * polytes), so the arm is a hypothesis about orchids, not a modelling flourish.
 */
const LINK_GROUP = ["antherT", ANGLE_GENE, "antherProject", SIGNAL_GENE];

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

/* Box-Muller, matching sim/evolve.js — not exported there. */
const gauss = (rng) =>
  Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(2 * Math.PI * rng());

/* Signal lives on a RING in [0,1), the same coordinate sim/deception.js bins,
 * so that no advertisement is distinctive merely by sitting at the end of a
 * line. */
const wrap01 = (x) => ((x % 1) + 1) % 1;

/* Circular blend of two ring coordinates — the signal analogue of meanAngle,
 * and wrong for the same reason a plain average is wrong at the wrap. */
function meanRing(a, b) {
  const A = 2 * Math.PI * a;
  const B = 2 * Math.PI * b;
  const m = Math.atan2(
    (Math.sin(A) + Math.sin(B)) / 2,
    (Math.cos(A) + Math.cos(B)) / 2,
  );
  return wrap01(m / (2 * Math.PI));
}

/*
 * Poisson draws, for the recruit count under density dependence. Knuth's product
 * method below 30 and the normal approximation above it — the standard split.
 * Knuth's loop cost grows linearly in the mean, and by 30 the approximation's
 * error is far below the demographic noise it is there to represent.
 */
function poisson(rng, lam) {
  if (!(lam > 0)) return 0;
  if (lam < 30) {
    const L = Math.exp(-lam);
    let k = 0;
    let p = 1;
    do {
      k++;
      p *= rng();
    } while (p > L);
    return k - 1;
  }
  return Math.max(0, Math.round(lam + Math.sqrt(lam) * gauss(rng)));
}

/* Ring distance in signal units. */
const ringDist = (a, b) => {
  const d = Math.abs(a - b) % 1;
  return d > 0.5 ? 1 - d : d;
};

/*
 * ⚠️ THE ADVERTISEMENT DRAWS FROM ITS OWN RANDOM STREAM, and this is load-bearing
 * rather than tidiness.
 *
 * `shapeOf` stops the signal reaching the geometry through the phenotype. This
 * stops it reaching the geometry through the RNG. Sharing one stream would mean
 * that switching deception on, or changing the advertisement's mutation rate,
 * silently re-rolled every subsequent shape mutation and site draw — so an arm
 * with deception and an arm without would differ in two things at once and no
 * difference between them could be attributed. `sim/carryover.js` already draws
 * its reward coin unconditionally for exactly this reason; this is the same
 * requirement one level up.
 *
 * It also means every number published for the IBM before the advertisement
 * existed still reproduces bit-for-bit, which is how it was checked.
 */
function signalRng(seed) {
  return E.makeRng((seed * 2654435761) >>> 0 || 1);
}

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
  g[SIGNAL_GENE] = meanRing(ind.h1[SIGNAL_GENE], ind.h2[SIGNAL_GENE]);
  return g;
}

/*
 * ⚠️ THE INVARIANT THAT KEEPS THE ADVERTISEMENT OUT OF THE GEOMETRY.
 *
 * Everything that becomes a flower goes through here, and here is where the
 * signal is dropped. If it were not, `toFlower` would spread it onto the flower
 * object and a future contact-model change could silently start reading it — at
 * which point "the population split on placement" would be a statement about an
 * advertisement gene. Tested directly: two individuals differing ONLY in signal
 * must produce byte-identical placements.
 */
function shapeOf(ind) {
  const { [SIGNAL_GENE]: _drop, ...shape } = phenotype(ind);
  return shape;
}

function signalOf(ind) {
  return phenotype(ind)[SIGNAL_GENE];
}

/*
 * A gamete: free recombination — every locus segregates independently — then
 * mutation. Free recombination is the CONSERVATIVE choice for a speciation
 * question: linkage would help divergence by keeping co-adapted alleles
 * together, so assuming none means any split found here is not an artefact of
 * a linkage map I chose.
 */
function gamete(ind, rng, rate, opts = {}) {
  const g = {};
  /* Falls back to `rng` only when no advertisement stream is supplied, which is
   * the case in the unit tests that exercise segregation directly. */
  const srng = opts.srng || rng;
  /*
   * One shared coin for the linkage group when the supergene arm is on, an
   * independent coin per locus otherwise. The coin is drawn LAZILY, so the free
   * arm's rng stream is byte-identical to what it was before linkage existed and
   * every earlier IBM number still reproduces.
   */
  const linked = opts.linkSignal ? LINK_GROUP : null;
  /* Drawn up front rather than lazily: the signal locus is last in ALL_KEYS, and
   * a coin that only exists once an earlier group member has been visited would
   * make correctness depend on key order. Only the supergene arm draws it, so
   * the free arm's stream is untouched. */
  let linkCoin = linked ? rng() < 0.5 : null;
  for (const k of ALL_KEYS) {
    let fromH1;
    if (k === SIGNAL_GENE) {
      /* The advertisement's own segregation coin comes from the advertisement's
       * own stream — unless it is LINKED, in which case it must by definition
       * take the shape loci's coin, which is the whole content of linkage. */
      fromH1 = linked ? linkCoin : srng() < 0.5;
    } else if (linked && linked.includes(k)) {
      fromH1 = linkCoin;
    } else {
      fromH1 = rng() < 0.5;
    }
    g[k] = fromH1 ? ind.h1[k] : ind.h2[k];
  }
  /* E.mutate only touches the shape loci and carries anything else through
   * untouched, so the signal is mutated here, on its own ring and at its own
   * rate. Advertisement and morphology are different kinds of trait and there is
   * no reason their mutational steps should be tied together — but the rate IS
   * swept in the experiment rather than picked. */
  const m = E.mutate(g, rng, rate);
  const sRate = opts.signalMut === undefined ? rate : opts.signalMut;
  m[SIGNAL_GENE] = wrap01(m[SIGNAL_GENE] + gauss(srng) * sRate);
  return m;
}

function randomIndividual(rng, srng = rng) {
  return {
    h1: { ...E.randomGenome(rng), [SIGNAL_GENE]: srng() },
    h2: { ...E.randomGenome(rng), [SIGNAL_GENE]: srng() },
  };
}

/* A population of near-clones plus mutational variance — one lineage, which is
 * the starting condition the speciation question actually asks about. */
function foundPopulation(
  n,
  rng,
  {
    spread = 0.06,
    signalSpread = null,
    srng = null,
    base = null,
    anc = 0,
  } = {},
) {
  const sr = srng || rng;
  const b = base || { ...E.randomGenome(rng), [SIGNAL_GENE]: sr() };
  const sS = signalSpread === null ? spread : signalSpread;
  const hap = () => {
    const h = E.mutate(b, rng, spread);
    h[SIGNAL_GENE] = wrap01(h[SIGNAL_GENE] + gauss(sr) * sS);
    return h;
  };
  const pop = [];
  for (let i = 0; i < n; i++) pop.push({ h1: hap(), h2: hap(), anc });
  return pop;
}

/*
 * ⚠️ A NEUTRAL ANCESTRY TRACER, AND IT MUST STAY NEUTRAL.
 *
 * `anc` is not a gene and not a trait. It is a label carried alongside the
 * genome and averaged between parents, the standard admixture tracker, and it
 * exists because THREE DIFFERENT OUTCOMES ALL LOOK LIKE "the split went away":
 *
 *   FUSION      the lineages interbreed and the difference is averaged out
 *   EXTINCTION  drift removes one lineage entirely — nothing fused
 *   PERSISTENCE placement stays bimodal
 *
 * Placement separation alone cannot tell fusion from extinction, and they are
 * opposite mechanisms. Worse, a population can stay visibly bimodal in placement
 * while its ancestry has completely homogenised — genetically fused but looking
 * split — and only a tracer catches that.
 *
 * It reads nothing and decides nothing: it is not on a haplotype, so it cannot
 * reach the phenotype, and it consumes NO random numbers, so it cannot perturb
 * any published result. Both are tested.
 */
function ancestryVar(pop) {
  const xs = pop.map((i) => (i.anc === undefined ? 0 : i.anc));
  const m = mean(xs);
  return mean(xs.map((x) => (x - m) * (x - m)));
}

/*
 * Found two near-clonal lineages whose placements sit a TARGET distance apart.
 *
 * ⚠️ PLACEMENT IS STILL NEVER A GENE, which is exactly why this is a search. A
 * separation cannot be assigned, because placement is not something a genome
 * carries — so genomes are DRAWN and then SELECTED by the placement they turn
 * out to produce, and the REALISED separation is returned rather than the
 * target. Any caller that quotes the target instead of the realised value is
 * quoting something the model never agreed to.
 *
 * Lives here rather than in an experiment because two experiments now need it
 * and because the discipline above belongs with the model, not beside it.
 */
function foundTwoLineages(n, rng, srng, targetD, opts) {
  const base = { ...E.randomGenome(rng), [SIGNAL_GENE]: srng() };
  const placeOf = (g) =>
    sitesOf([{ h1: g, h2: g }], opts, 0).map(placementOf)[0];
  const p0 = placeOf(base);
  if (!p0) return null;

  let best = null;
  for (const step of [0.05, 0.1, 0.2, 0.3, 0.5, 0.8, 1.2, 1.6]) {
    for (let k = 0; k < 8; k++) {
      const g = E.mutate(base, rng, step);
      g[SIGNAL_GENE] = srng();
      const p = placeOf(g);
      if (!p) continue;
      const d = dist(p0, p);
      const err = Math.abs(d - targetD);
      if (!best || err < best.err) best = { g, d, err };
    }
  }
  if (!best) return null;

  /* Each lineage is near-clonal, which is what "two lineages meeting" means.
   * Ancestry 0 and 1 are labels on the individual, not alleles. */
  const half = Math.floor(n / 2);
  const pop = [
    ...foundPopulation(half, rng, { spread: 0.02, srng, base, anc: 0 }),
    ...foundPopulation(n - half, rng, {
      spread: 0.02,
      srng,
      base: best.g,
      anc: 1,
    }),
  ];
  return { pop, realised: best.d, gA: base, gB: best.g };
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

  /* More than one pollinator. null = the single `bee` above. Separate bouts are
   * summed and the visit budget is SPLIT, so arms differ in geometry rather than
   * in how much pollination they receive. See step(). */
  bees: null,
  /* Each animal brings its OWN visit budget rather than sharing one pool — the
   * difference between one limiting factor and two. See the note in step(); only
   * interpretable against a one-animal double-budget control. */
  independentBudgets: false,

  /*
   * ⚠️ THE TWO CONSTANTS THAT MAKE THIS MODEL ZERO-SUM, AND THEY ARE MODELLING
   * ASSUMPTIONS RATHER THAN BIOLOGY. Both default to off, so every result
   * published before they existed is unaffected.
   *
   * 1. `demography` — HOW MANY OFFSPRING A GENERATION PRODUCES.
   *
   *    Left null, step() fills exactly `pop.length` slots, which is SOFT
   *    SELECTION in the population-genetics sense (Wallace 1975): the number of
   *    recruits is a constant and only RELATIVE pollination success can matter,
   *    so one lineage's seed is by construction another's loss. Two
   *    reproductively isolated groups are then forced into a zero-sum contest by
   *    the demography rather than by anything about pollination — which makes
   *    "one lineage is excluded" a statement about constant-size populations.
   *
   *    Set to {seedsPerGrain, K} the recruit count becomes
   *    min(K, Poisson(seedsPerGrain * total pollen received)) — HARD selection,
   *    where absolute fitness matters and a population that sets fewer seeds
   *    SHRINKS instead of handing its slots to a competitor. K is a shared
   *    ceiling on establishment sites; it is deliberately NOT per-lineage,
   *    because a quota each would simply assume coexistence.
   *
   *    ⚠️ Total-then-multinomial is used rather than a Poisson per mother
   *    because they are the SAME distribution (Poisson thinning) while the cap
   *    binds nowhere — and the existing parentage loop is then untouched.
   *
   * 2. `visitsPerPlant` — HOW MUCH POLLINATOR SERVICE EXISTS.
   *
   *    Left null, `visits` is a constant total shared out over however many
   *    plants there are, so per-plant visitation is forced to scale as 1/n and
   *    the pollinators are a second fixed pool to compete over. Set to a number,
   *    the budget becomes visitsPerPlant * n — constant per-plant service, i.e.
   *    a pollinator fauna that tracks floral abundance.
   *
   *    ⚠️ THIS ONE IS NECESSARY FOR THE FIRST TO MEAN ANYTHING. With a constant
   *    visit total, total pollen delivered barely depends on n, so the recruit
   *    count is nearly constant too and density dependence is inert — the
   *    population would simply be pinned at a different number. Lifting only
   *    assumption 1 tests a model that is still zero-sum through the pollinator.
   *
   *    At n equal to the founding size the rescaling is a no-op by construction,
   *    which is what keeps the anchors bit-identical.
   */
  demography: null,
  visitsPerPlant: null,

  /* ---- deception (sim/deception.js), the one mechanism measured past parity
   * and the only one of the six not previously inside a model that can breed.
   *
   * `deceptive` switches the MECHANISM, not the machinery: the learner is
   * present in both settings and runBout draws its reward coin unconditionally,
   * so the honest control runs the identical code path and the identical rng
   * stream with rewardP = 1. A learner-null control would have differed in two
   * things at once. */
  deceptive: false,
  /*
   * ⚠️ NULL BY DEFAULT, deliberately. A learner present at all sends runBout
   * down `pickLearned`, which selects flowers differently AND consumes the rng
   * differently — so defaulting this to a parameter object would have quietly
   * moved every pre-deception IBM arm onto a different code path while looking
   * like an inert default. There are therefore THREE levels, not two:
   *   learn: null                      no machinery  — reproduces the 2026-08-03 run
   *   learn: LEARN, deceptive: false   machinery on, mechanism off
   *   learn: LEARN, deceptive: true    mechanism on
   * The middle one is the control that isolates deception; the first is what
   * shows the middle one did not itself change the answer.
   */
  learn: null,
  /* Reward probability of every plant when `deceptive` is off. 1 = all honest. */
  honestP: 1,
  /* Advertisement mutation rate; defaults to the shape rate. Swept, not tuned. */
  signalMut: undefined,
  /* Supergene arm: the advertisement co-segregates with the anther loci. */
  linkSignal: false,
};

function sitesOf(pop, opts, gen, beeIdx = 0) {
  /* beeIdx offsets the site seed so a second animal does not reuse the first
   * animal's draws. It is 0 for the single-animal case, leaving every seed —
   * and therefore every earlier result — unchanged. */
  return pop.map((ind, i) =>
    C.siteSet(E.toFlower(shapeOf(ind)), opts.bee, {
      n: opts.siteN,
      seed: 1000 + 31 * gen + i + 500000 * beeIdx,
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

/*
 * The SAME statistic on the advertisement axis, so the two axes are read in the
 * same units and a split on one cannot be confused with a split on the other.
 *
 * This is the point of wiring deception in at all. Deception's negative
 * frequency-dependence acts on SIGNAL; the mating system's positive
 * frequency-dependence acts on PLACEMENT. Reporting only placement would answer
 * "did deception do anything?" with a number that cannot see where it acted.
 */
function ringSeparation(signals) {
  const xs = signals.filter((x) => Number.isFinite(x));
  if (xs.length < 6) return null;
  let best = null;
  for (let a = 0; a < xs.length; a++)
    for (let b = a + 1; b < xs.length; b++) {
      const d = ringDist(xs[a], xs[b]);
      if (!best || d > best.d) best = { a, b, d };
    }
  let m1 = xs[best.a],
    m2 = xs[best.b];
  let assign = null;
  for (let iter = 0; iter < 12; iter++) {
    assign = xs.map((p) => (ringDist(p, m1) <= ringDist(p, m2) ? 0 : 1));
    for (const c of [0, 1]) {
      const members = xs.filter((_, i) => assign[i] === c);
      if (!members.length) continue;
      let bestM = members[0],
        bestCost = Infinity;
      for (const cand of members) {
        const cost = members.reduce((s, o) => s + ringDist(cand, o), 0);
        if (cost < bestCost) {
          bestCost = cost;
          bestM = cand;
        }
      }
      if (c === 0) m1 = bestM;
      else m2 = bestM;
    }
  }
  const w = mean(xs.map((p, i) => ringDist(p, assign[i] === 0 ? m1 : m2)));
  const sizes = [
    assign.filter((x) => x === 0).length,
    assign.filter((x) => x === 1).length,
  ];
  return {
    separation: w > 1e-9 ? ringDist(m1, m2) / w : 0,
    sizes,
    minorityFrac: Math.min(...sizes) / xs.length,
    gap: ringDist(m1, m2),
  };
}

/* Circular spread of the advertisement cloud about its own mean. */
function ringSpread(signals) {
  const xs = signals.filter((x) => Number.isFinite(x));
  if (xs.length < 2) return 0;
  let cs = 0,
    sn = 0;
  for (const x of xs) {
    cs += Math.cos(2 * Math.PI * x);
    sn += Math.sin(2 * Math.PI * x);
  }
  const centre = wrap01(Math.atan2(sn, cs) / (2 * Math.PI));
  return mean(xs.map((x) => ringDist(x, centre)));
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
function step(pop, opts, rng, gen, srng = null) {
  const n = pop.length;
  const signals = pop.map(signalOf);

  /*
   * ⚠️ MORE THAN ONE POLLINATOR, and three things about it are load-bearing.
   *
   * 1. SEPARATE BOUTS, SUMMED — never one mixed bout. Pollen is carried on a
   *    body, so a grain picked up from animal A can only be delivered by animal
   *    A. This is the convention experiments/two-pollinators.js already
   *    established and the reason it is a convention.
   *
   * 2. THE VISIT BUDGET IS SPLIT BY DEFAULT, not duplicated. Giving each animal
   *    the full budget would mean the two-pollinator arm also receives twice the
   *    pollination, and "two pollinators permit coexistence" would be
   *    indistinguishable from "more visits permit coexistence". Splitting holds
   *    total visitation invariant to the number of animals, so the arms differ
   *    in GEOMETRY alone.
   *
   *    ⚠️⚠️ AND THAT CONTROL HAS A COST THAT ONLY BECAME VISIBLE LATER. Splitting
   *    one budget keeps ONE LIMITING FACTOR — the animals divide a single pool of
   *    visits, so the two lineages still compete for the same resource however
   *    different their pollinators are. Competitive exclusion follows from one
   *    limiting factor, so the 2026-08-04 two-pollinator negative was partly
   *    guaranteed by its own control. Two animals become TWO limiting factors
   *    only with `independentBudgets`, where each animal brings its own visits.
   *    That reintroduces the confound the split existed to remove, so it is only
   *    interpretable against a ONE-ANIMAL DOUBLE-BUDGET control holding total
   *    visits equal — which is exactly how the limiting-factors run uses it.
   *
   * 3. THE SINGLE-ANIMAL CASE IS BIT-IDENTICAL. With one bee the split is a
   *    no-op, the site seeds and bout seed are unchanged, and `runBout` builds
   *    its own rng from its seed so extra bouts cannot perturb the outer stream.
   *    Every result published before this still reproduces, which is how it was
   *    checked.
   *
   * Each animal gets its OWN learner: two animals do not share a memory.
   */
  const bees = opts.bees && opts.bees.length ? opts.bees : [opts.bee];
  /* Constant total service (null) or constant per-plant service — see the note
   * on `visitsPerPlant` in DEFAULTS. Null leaves every earlier seed unchanged. */
  const budget = opts.visitsPerPlant
    ? Math.max(1, Math.round(opts.visitsPerPlant * n))
    : opts.visits;
  /* One shared pool divided among the animals (default, one limiting factor), or
   * a full budget each (two limiting factors — and twice the visits, which is why
   * it needs the double-budget control). A no-op with a single animal either way,
   * so every earlier result is untouched. */
  const per = opts.independentBudgets
    ? budget
    : Math.max(1, Math.round(budget / bees.length));

  const T = Array.from({ length: n }, () => new Float64Array(n));
  let sites = null;
  bees.forEach((bee, bi) => {
    const ss = sitesOf(pop, { ...opts, bee }, gen, bi);
    /*
     * The learner is REBUILT EACH GENERATION. That is a claim, so it is stated:
     * the animal is not the same individual across plant generations, and
     * Whitehead & Peakall 2012 measured short-term but not long-term avoidance,
     * so carrying one memory across decades of flowering would be the strong
     * version of a mechanism the field says is weak. Within a generation the
     * memory persists across the whole bout, which is where learning happens.
     */
    const learner = opts.learn ? D.makeLearner(opts.learn) : null;
    const rb = C.runBout(ss, new Array(n).fill(1 / n), {
      visits: per,
      seed: 7 + gen + 100000 * bi,
      learner,
      signals: learner ? signals : null,
      rewardP: learner
        ? new Array(n).fill(opts.deceptive ? 0 : opts.honestP)
        : null,
    });
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) T[i][j] += rb.T[i][j];
    /* Placement is defined RELATIVE TO A BODY, so with two animals a plant has
     * two of them. The bimodality statistic is reported on the FIRST animal, so
     * it stays the same quantity it was in every earlier run; the fate of the
     * lineages, which is what this experiment actually asks, does not depend on
     * that choice. */
    if (bi === 0) sites = ss;
  });
  const r = { T };

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

  /*
   * ⚠️ HOW MANY OFFSPRING THIS GENERATION MAKES — the fixed-N assumption, and
   * the whole of it. Null demography reproduces `target = n` exactly, so this
   * line is the difference between soft and hard selection.
   *
   * The total is read off `weight` rather than `received` so that the quantity
   * deciding HOW MANY seeds are set is the same quantity deciding WHOSE they
   * are; if the positive control is on, fecundity selection reduces both.
   */
  let target = n;
  let totalSeed = null;
  if (opts.demography) {
    totalSeed = weight.reduce((a, b) => a + b, 0);
    target = Math.min(
      opts.demography.K,
      poisson(rng, opts.demography.seedsPerGrain * totalSeed),
    );
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
  while (next.length < target) {
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
    const gopts = {
      linkSignal: opts.linkSignal,
      signalMut: opts.signalMut,
      srng,
    };
    next.push({
      h1: gamete(pop[mother], rng, opts.mutRate, gopts),
      h2: gamete(pop[father], rng, opts.mutRate, gopts),
      /* the tracer: the parental mean, drawing no random numbers */
      anc: ((pop[mother].anc || 0) + (pop[father].anc || 0)) / 2,
    });
  }

  return {
    /*
     * ⚠️ THE FALLBACK IS SUPPRESSED UNDER DENSITY DEPENDENCE, deliberately.
     * With fixed N, a generation that cannot fill itself is a FROZEN run and
     * returning the parents keeps that visible as a stall. With demography on,
     * a shortfall is the result: a population that set few seeds is meant to
     * shrink, and carrying the parents forward would silently rescue exactly
     * the decline the arm exists to measure.
     */
    pop: opts.demography ? next : next.length ? next : pop,
    places,
    signals,
    target,
    recruits: next.length,
    popN: n,
    totalSeed,
    spread: spreadOf(places),
    cluster: twoClusterSeparation(places),
    signalCluster: ringSeparation(signals),
    signalSpread: ringSpread(signals),
    /* measured on the population that PRODUCED this generation, so it pairs with
     * the placements above rather than with the offspring */
    ancVar: ancestryVar(pop),
    unmated: failed,
    /* A stall is a generation that could not produce the offspring it was
     * entitled to. With demography off `target` IS n, so this is the same
     * predicate it has always been; with demography on it must be read against
     * the entitlement rather than against the parents, or every shrinking
     * generation would report itself frozen. */
    stalled: next.length < target,
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
  /* The advertisement's independent stream — see signalRng(). */
  const srng = signalRng(seed);
  let pop = found || foundPopulation(n, rng, { srng });
  const history = [];
  let extinct = false;
  for (let g = 0; g < generations; g++) {
    /*
     * ⚠️ EXTINCTION IS AN OUTCOME AND MUST STOP THE RUN RATHER THAN CRASH IT.
     * Under density dependence the population can genuinely reach zero, and
     * every statistic below divides by its size. Unreachable with demography
     * off, where the generation count and the history length are unchanged.
     */
    if (pop.length < 2) {
      extinct = true;
      break;
    }
    const out = step(pop, opts, rng, g, srng);
    pop = out.pop;
    history.push({
      gen: g,
      popN: out.popN,
      target: out.target,
      recruits: out.recruits,
      totalSeed: out.totalSeed,
      spread: out.spread,
      separation: out.cluster ? out.cluster.separation : null,
      minorityFrac: out.cluster ? out.cluster.minorityFrac : null,
      signalSpread: out.signalSpread,
      signalSeparation: out.signalCluster ? out.signalCluster.separation : null,
      signalGap: out.signalCluster ? out.signalCluster.gap : null,
      signalMinorityFrac: out.signalCluster
        ? out.signalCluster.minorityFrac
        : null,
      ancVar: out.ancVar,
      unmated: out.unmated,
      stalled: out.stalled,
    });
  }
  return { pop, history, extinct: extinct || pop.length < 2 };
}

module.exports = {
  GENE_KEYS,
  ALL_KEYS,
  SIGNAL_GENE,
  LINK_GROUP,
  DEFAULTS,
  meanAngle,
  meanRing,
  ringDist,
  signalRng,
  phenotype,
  shapeOf,
  signalOf,
  poisson,
  ringSeparation,
  ringSpread,
  gamete,
  randomIndividual,
  foundPopulation,
  foundTwoLineages,
  ancestryVar,
  sitesOf,
  placementOf,
  dist,
  twoClusterSeparation,
  spreadOf,
  step,
  run,
};
