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
 * FLOWERING TIME — the one assortment axis in this project that is genuinely
 * INDEPENDENT OF PLACEMENT, and the roadmap has named it as such since the
 * mechanism list was written.
 *
 * Every other candidate acted on where pollen lands or on what the animal wants
 * to visit. Two plants that never flower together cannot exchange pollen
 * whatever their shapes are, so this is assortment by a completely different
 * route — and it is the textbook allochronic-speciation mechanism rather than
 * something invented here.
 *
 * ⚠️ IT IS A GENE, and it is allowed to be one for the same reason the
 * advertisement is: flowering time IS a floral trait with known genetics, not
 * an outcome of two geometries meeting. `shapeOf` keeps it out of the contact
 * model exactly as it keeps the signal out, and the same test applies — two
 * individuals differing only in bloom must produce byte-identical placements.
 *
 * ⚠️ IT LIVES ON A RING. A season with ends would make the earliest and latest
 * flowerers extreme by position rather than by biology, the same edge artefact
 * the ring layout exists to avoid elsewhere. An annual cycle genuinely is
 * circular, so this is the honest coordinate rather than a convenience.
 *
 * ⚠️ AND IT IS NOT IN ALL_KEYS. Adding a locus there would change the number of
 * random draws every gamete makes and move every published IBM number. The
 * bloom locus segregates from its OWN stream, only when phenology is switched
 * on, so the default model is untouched — the same discipline the advertisement
 * already uses one level up.
 */
const BLOOM_GENE = "bloom";

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

/* The same three anther loci WITHOUT the advertisement — the group a flowering
 * time can be tied to without also tying the signal to it. See gamete(). */
const BLOOM_LINK_GROUP = ["antherT", ANGLE_GENE, "antherProject"];

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

/* The bloom locus's own stream, for the same reason the advertisement has one:
 * switching phenology on must not silently re-roll every subsequent shape
 * mutation and site draw, or the phenology arm and the control would differ in
 * two things at once. A different multiplier so the two streams do not run in
 * lockstep. */
function bloomRng(seed) {
  return E.makeRng((seed * 40503 + 12345) >>> 0 || 1);
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
  /*
   * ⚠️ TWO SUPERGENE ARMS, AND THEY MUST NOT DRAG EACH OTHER IN. `linkSignal`
   * ties the ADVERTISEMENT to the anther loci; `linkBloom` ties FLOWERING TIME
   * to them. Reusing one group for both would mean switching phenology's linked
   * arm on silently linked the advertisement as well, so an experiment about
   * flowering time would be running a deception arm it never asked for.
   * BLOOM_LINK_GROUP is therefore the anther loci WITHOUT the signal.
   */
  const linked = opts.linkSignal
    ? LINK_GROUP
    : opts.linkBloom
      ? BLOOM_LINK_GROUP
      : null;
  /* Drawn up front rather than lazily: the signal locus is last in ALL_KEYS, and
   * a coin that only exists once an earlier group member has been visited would
   * make correctness depend on key order. Only the supergene arms draw it, so
   * the free arm's stream is untouched. */
  let linkCoin = linked ? rng() < 0.5 : null;
  for (const k of ALL_KEYS) {
    let fromH1;
    if (k === SIGNAL_GENE) {
      /* The advertisement's own segregation coin comes from the advertisement's
       * own stream — unless IT is linked, in which case it must by definition
       * take the shape loci's coin, which is the whole content of linkage. A
       * bloom supergene must NOT capture it. */
      fromH1 = opts.linkSignal ? linkCoin : srng() < 0.5;
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

  /*
   * The bloom locus, segregating and mutating on its own stream. Guarded by
   * `opts.bloom`, so with phenology off not a single extra draw is taken from
   * any stream and every published IBM number reproduces bit-for-bit.
   *
   * ⚠️ FREE RECOMBINATION IS THE CONSERVATIVE DEFAULT AND ALSO THE HARDEST CASE
   * FOR THIS MECHANISM, which is the whole interest of it. An unlinked bloom
   * allele is torn away from whatever placement allele it arose beside in a
   * single generation, so temporal assortment should sort BLOOM TIMES without
   * ever sorting SHAPES. `linkBloom` is the supergene arm that tests exactly
   * that — the same arm structure the advertisement already has, and real
   * supergenes of this kind exist.
   */
  if (opts.bloom) {
    const brng = opts.brng || rng;
    const fromH1 =
      opts.linkBloom && linkCoin !== null ? linkCoin : brng() < 0.5;
    const bRate = opts.bloomMut === undefined ? rate : opts.bloomMut;
    m[BLOOM_GENE] = wrap01(
      (fromH1 ? ind.h1[BLOOM_GENE] : ind.h2[BLOOM_GENE]) + gauss(brng) * bRate,
    );
  }
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
 * ⚠️ DID THE CLUSTERING ACTUALLY HAPPEN? This is the positive control for
 * space, and it exists because "limited dispersal" is an INPUT while "kin ended
 * up near each other" is an OUTCOME. Set the kernel wide relative to the ring
 * and the arms differ in a parameter and in nothing else — every downstream
 * comparison would then be measuring an intervention that never landed, which
 * is the failure this project has hit repeatedly: a guard whose predicate
 * cannot observe its referent.
 *
 * Mean |ancestry difference| between ring-ADJACENT plants, over the same
 * quantity for ALL pairs. Below 1 means neighbours are more alike than the
 * population at large — kin structure. At 1 there is no structure whatever the
 * dispersal parameter says.
 *
 * Returns null when there is nothing to measure rather than a number that would
 * read as "no clustering".
 */
function ancNeighbour(pop, positions) {
  const n = pop.length;
  if (n < 4 || !positions || positions.length !== n) return null;
  const a = pop.map((i) => (i.anc === undefined ? 0 : i.anc));
  const order = positions
    .map((p, i) => [p, i])
    .sort((x, y) => x[0] - y[0])
    .map((x) => x[1]);

  let adj = 0;
  for (let k = 0; k < n; k++)
    adj += Math.abs(a[order[k]] - a[order[(k + 1) % n]]);
  adj /= n;

  let all = 0,
    cnt = 0;
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      all += Math.abs(a[i] - a[j]);
      cnt++;
    }
  all /= cnt;

  /* A population that has already fused or lost a lineage has no ancestry
   * differences left to structure, so the ratio is undefined rather than 1. */
  if (!(all > 1e-12)) return null;
  return adj / all;
}

/*
 * The fate of a founded pair, at the end of a run.
 *
 * ⚠️ SINGLE-SOURCED HERE BECAUSE A NEW EXPERIMENT MUST NOT BRING ITS OWN. This
 * predicate decides every headline in roadmap B, and five experiments currently
 * hold their own byte-identical copy of it (`fusion-vs-exclusion.js` and
 * friends). Copies cannot disagree while nobody edits them and will disagree
 * silently the moment somebody does — and a run that classifies outcomes by its
 * own slightly different rule is not comparable to the results it is quoted
 * against. New work uses this one. The existing copies are left alone rather
 * than rewritten in a commit that is about something else.
 *
 * HELD    ancestry variance is still a substantial fraction of the founding
 *         value — two lineages, still distinct.
 * one lost  the tracer has gone to one end: a lineage was excluded.
 * FUSED   variance collapsed with the mean in the middle: they merged.
 */
function fateOf(finalPop, ancVar0, extinct) {
  if (extinct || !finalPop || finalPop.length < 2) return "BOTH LOST";
  const v = ancestryVar(finalPop);
  const m = mean(finalPop.map((i) => (i.anc === undefined ? 0 : i.anc)));
  if (v > 0.4 * ancVar0) return "HELD";
  if (m < 0.15 || m > 0.85) return "one lost";
  return "FUSED";
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

  /*
   * ---- SPACE. null = the panmictic model every earlier IBM result came from,
   * consuming no random numbers differently.
   *
   * `{forageRange, seedRange}`. Plants sit at coordinates on a RING — a ring
   * rather than a line so no plant is disadvantaged by sitting at an edge, the
   * same convention sim/carryover.js already uses for the bout.
   *
   *   `forageRange`  the width of the Gaussian kernel the bee's next visit is
   *                  drawn from, around the plant it is standing on. Infinity =
   *                  the global forager of every previous run. This is NOT a new
   *                  bout mechanism: `positions`/`forageRange` have existed in
   *                  runBout since 2026-08-02 and were only ever driven from the
   *                  v1 harness. This gives the IBM's plants coordinates and
   *                  passes them down.
   *
   *   `seedRange`    the width of the Gaussian an offspring's position is
   *                  displaced by, FROM ITS MOTHER'S. Infinity = a uniformly
   *                  redrawn position, i.e. global dispersal.
   *
   * ⚠️ CLUSTERING IS NOT IMPOSED, and that is the whole difference from the
   * 2026-08-02 run. That one PLACED the morphs in arcs, which asserts the
   * structure whose consequences it then measures. Founders here are scattered
   * at random and any clustering must EMERGE from limited dispersal over
   * generations — which is what the roadmap asked for. Whether it emerged is
   * therefore an OUTCOME to be measured, not an input to be trusted:
   * `ancNeighbour` in the return is that measurement.
   *
   * ⚠️ THE RANDOM DRAWS ARE UNCONDITIONAL WITHIN `space`. Both a uniform and a
   * gaussian are consumed per offspring whichever dispersal mode is set, so the
   * four cells of the 2x2 differ in the MECHANISM and not in how they walk the
   * random stream. Consuming one draw for global dispersal and two for limited
   * would make every cell a different realisation as well as a different model,
   * and no difference between them could be attributed. sim/carryover.js draws
   * its reward coin unconditionally for exactly this reason.
   */
  space: null,

  /*
   * ---- FLOWERING TIME. null = off, drawing no random numbers from any stream,
   * so every published IBM result is bit-identical.
   *
   * `{width, slices, mut, link}`. Each plant carries a heritable bloom allele
   * on a ring and is in flower for `width` of the season around it; the season
   * runs as `slices` successive bouts and a plant not in flower has an
   * abundance of zero in that slice. See the long note in step().
   *
   * `link` is the SUPERGENE ARM. Free recombination is the default and is also
   * the hardest case for this mechanism, which is exactly why it is the
   * default: an unlinked bloom allele is torn away from whatever placement
   * allele it arose beside within one generation, so temporal assortment should
   * sort FLOWERING TIMES while never sorting SHAPES. With `link` the bloom
   * locus co-segregates with the three anther loci — and NOT with the
   * advertisement, which has its own arm.
   */
  phenology: null,

  /* More than one pollinator. null = the single `bee` above. Separate bouts are
   * summed and the visit budget is SPLIT, so arms differ in geometry rather than
   * in how much pollination they receive. See step(). */
  bees: null,
  /* Each animal brings its OWN visit budget rather than sharing one pool — the
   * difference between one limiting factor and two. See the note in step(); only
   * interpretable against a one-animal double-budget control. */
  independentBudgets: false,

  /* ---- rare-biased visit allocation (roadmap B). A morph of frequency f takes
   * f^a of the visits: a = 1 is proportional to abundance (uniform per plant, and
   * every earlier result, bit-identical), a = 0 splits visits evenly whatever the
   * frequencies. null = a = 1 = untouched. See allocWeights below for why rarity
   * is read off placement rather than off ancestry. */
  allocExponent: null,

  /* ---- reproductive assurance. null = off, and off draws NO random numbers, so
   * every result published before this existed is bit-identical.
   *
   * {rate, cost, ancNull, always, floorOnly}. `rate` sets a maternal weight
   * FLOOR of `rate x mean(received)` that every plant gets on identical terms,
   * with no reference to lineage and no quota; a mother then selfs with
   * probability floor / (her own weight). So a plant nobody visited reproduces
   * almost entirely by selfing while a well-visited one barely does, and the
   * frequency-dependence is a CONSEQUENCE of the mate-finding constraint this
   * model already measured rather than a parameter of it.
   *
   * ⚠️ It attaches to the MOTHER DRAW, not the sire draw, because mate
   * limitation here is never being CHOSEN — see the long note in step().
   *
   * `cost` is inbreeding depression: a selfed offspring fails to establish with
   * this probability, so the mechanism can FAIL and must be shown to.
   *
   * ⚠️ `floorOnly` is the control for the floor itself. The floor flattens the
   * maternal weight distribution, which could change who reproduces on its own —
   * so this applies the floor and still demands an outcross sire. Any effect
   * surviving it is weight-flattening, not selfing.
   *
   * ⚠️ `always` is a CONTROL, not a mechanism — every mother selfs regardless of
   * whether she was pollinated. It exists so the triviality arm ("if everyone
   * selfs, isolation is manufactured") can be run and MUST report isolation; an
   * isolation statistic that stays flat under it is broken.
   *
   * ⚠️ `ancNull` is the MECHANICAL-NULL control for the tracer. A selfed
   * offspring normally inherits the mother's `anc` UNAVERAGED, while an
   * outcrossed one takes the parental mean — so selfing raises ancestry variance,
   * and therefore HELD, BY CONSTRUCTION rather than by biology. Set true and a
   * selfed offspring's `anc` is averaged with a RANDOM individual instead: same
   * genetics, same selfing, averaging restored. The HELD difference between the
   * two is the artefact, measured rather than argued about. */
  selfing: null,

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
/*
 * ---- rare-biased visit allocation (roadmap B). An animal that preferentially
 * visits the RARER morph. A morph of frequency f takes f^a of the visits, so
 * a = 1 is visits-proportional-to-abundance (uniform per plant, and every
 * earlier result, bit-identical) while a = 0 splits visits evenly whatever the
 * frequencies. `opts.allocExponent` null = a = 1 = untouched.
 *
 * ⚠️ RARITY IS COMPUTED FROM THE POPULATION'S OWN PLACEMENT CLOUD, NEVER FROM
 * `anc`. Ancestry is bookkeeping the pollinator cannot perceive, so biasing on it
 * would be the same mistake as making placement a gene. A kernel share around
 * each plant approximates its cluster's frequency, so weighting by dens^(a-1)
 * sends a morph's share of visits to f^a with no labels anywhere.
 *
 * ⚠️ And the measured consequence is that this mechanism is SELF-DEFEATING on a
 * continuous axis: the lowest-density placement is the GAP BETWEEN two clusters,
 * so a preference for rare morphs pours visits onto the intermediates that bridge
 * them. See docs/2026-08-04-rare-biased-visits.md.
 */
const ALLOC_H = 1.0; /* kernel width, body-metric units; stigma radius is 1.15 */
function allocWeights(sites, a, n) {
  if (a === null || a === undefined || a === 1) return new Array(n).fill(1 / n);
  const places = sites.map(placementOf);
  const w = new Array(n).fill(0);
  let tot = 0;
  for (let i = 0; i < n; i++) {
    if (!places[i]) continue;
    let dens = 0;
    for (let j = 0; j < n; j++) {
      if (!places[j]) continue;
      const d = dist(places[i], places[j]) / ALLOC_H;
      dens += Math.exp(-0.5 * d * d);
    }
    dens /= n;
    w[i] = dens > 0 ? Math.pow(dens, a - 1) : 0;
    tot += w[i];
  }
  if (!(tot > 0)) return new Array(n).fill(1 / n);
  for (let i = 0; i < n; i++) w[i] /= tot;
  return w;
}

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

/*
 * Occupancy of the GAP BETWEEN two founding placements, and of the two cores.
 *
 * ⚠️ THE REFERENCE POINTS ARE FIXED BY THE FOUNDING GEOMETRY AND MUST NOT BE
 * RECOMPUTED PER GENERATION. Re-deriving "the gap" from the current cloud makes
 * the statistic circular: as two clusters merge, the midpoint of whatever is
 * left drifts with them, and a fused population would keep reporting a
 * comfortably empty gap right up to the point where there is only one cluster
 * to be in the middle of. `pA`/`pB` come from the founding lineages.
 *
 * A plant is an INTERMEDIATE if it lies near the segment joining them
 *   dist(p,pA) + dist(p,pB) <= ell * d0        (a prolate ellipse; = d0 on the
 *                                               segment itself)
 * and is in neither core
 *   min(dist(p,pA), dist(p,pB)) >= core * d0.
 *
 * The ellipse is used rather than a projection because the body metric is
 * circular in phi and has no straight line to project onto.
 *
 * ⚠️ THIS STATISTIC MUST BE ABLE TO REPORT BOTH ANSWERS. A gap that reads empty
 * is the interesting result, so an implementation that could only ever return ~0
 * would manufacture it. `coreA`/`coreB` are returned alongside for that reason:
 * a bridge FORMING keeps both cores occupied while `gap` rises, whereas two
 * clusters MIGRATING together drain the cores into the middle. Those are
 * different mechanisms and the pair of numbers separates them.
 */
/*
 * WHICH plants occupy the gap, by index into `places`. This is the SINGLE
 * definition of the predicate; `gapOccupancy` below is a thin wrapper that
 * counts what this returns.
 *
 * ⚠️ It was not always so. This predicate lived twice — once here returning
 * fractions and once in `experiments/fusion-vs-exclusion.js` returning indices,
 * because crossing gap membership with ancestry needs to know WHICH plant, not
 * how many. The two copies were kept in step by a runtime anchor that compared
 * them on real clouds. An anchor detects drift; it does not prevent it, and it
 * only ran when that one experiment ran. Single-sourcing removes the drift
 * rather than watching for it.
 *
 * ⚠️ INDICES ARE INTO THE ORIGINAL ARRAY, nulls included. `places` is parallel
 * to the traced `anc` array, so filtering before indexing would shift every
 * index past the first unplaced plant and silently cross gap membership with
 * the WRONG plant's ancestry — which is the whole quantity this feeds.
 */
function gapMembers(places, pA, pB, { ell = 1.3, core = 0.3 } = {}) {
  const gap = [];
  const coreA = [];
  const coreB = [];
  const d0 = dist(pA, pB);
  let n = 0;
  for (let i = 0; i < places.length; i++) {
    const p = places[i];
    if (!p) continue;
    n++;
    /* Coincident reference points cannot define a gap. Counting continues so
     * that `n` still reports the cloud size rather than claiming it is empty. */
    if (!(d0 > 0)) continue;
    const a = dist(p, pA);
    const b = dist(p, pB);
    if (a < core * d0) coreA.push(i);
    else if (b < core * d0) coreB.push(i);
    else if (a + b <= ell * d0) gap.push(i);
  }
  return { gap, coreA, coreB, n };
}

function gapOccupancy(places, pA, pB, opts = {}) {
  const m = gapMembers(places, pA, pB, opts);
  if (m.n === 0) return { gap: 0, coreA: 0, coreB: 0, n: 0 };
  return {
    gap: m.gap.length / m.n,
    coreA: m.coreA.length / m.n,
    coreB: m.coreB.length / m.n,
    n: m.n,
  };
}

// ------------------------------------------------------------------- step

/*
 * One generation. The whole point is between the two marked lines: parentage
 * comes out of the transfer matrix.
 */
function step(pop, opts, rng, gen, srng = null, brng = null) {
  const n = pop.length;
  const signals = pop.map(signalOf);

  /*
   * Ring coordinates. A founder that has never had one gets a random position —
   * SCATTERED, not arranged, so any structure downstream has to be built by
   * dispersal rather than declared here. Offspring carry `pos` forward, so this
   * only ever fires on the founding generation.
   */
  const SP = opts.space || null;
  const positions = SP
    ? pop.map((ind) => (ind.pos === undefined ? rng() : ind.pos))
    : null;

  /*
   * ---- FLOWERING TIME. Founders that have never carried a bloom allele get
   * one at random, INDEPENDENT OF LINEAGE — assigning the two lineages
   * different flowering times would impose the assortment whose consequences
   * this is meant to measure, the same error the 2026-08-02 spatial run made by
   * placing the morphs in arcs.
   */
  const PH = opts.phenology || null;
  /* how many plants were actually in flower together, averaged over the slices
   * that had any — the confound arm's claim, measured. See the slice loop. */
  let coflowerSum = 0;
  let coflowerSlices = 0;
  const brn = brng || (PH ? bloomRng(7) : null);
  let blooms = null;
  if (PH) {
    for (const ind of pop) {
      if (ind.h1[BLOOM_GENE] === undefined) ind.h1[BLOOM_GENE] = brn();
      if (ind.h2[BLOOM_GENE] === undefined) ind.h2[BLOOM_GENE] = brn();
    }
    blooms = pop.map((ind) => meanRing(ind.h1[BLOOM_GENE], ind.h2[BLOOM_GENE]));

    /*
     * ⚠️⚠️ THE CONFOUND ARM. A narrow season does two things at once, and only
     * one of them is the mechanism under test.
     *
     *   (a) it ASSORTS mating by flowering time — the hypothesis; and
     *   (b) it SHRINKS the pool of plants available on any given day.
     *
     * At width 0.12 with n=30 that second effect leaves roughly 3.6 plants
     * co-flowering per slice against 30 in the wide baseline, and a mating pool
     * that small retains ancestry variance MECHANICALLY, with no need for
     * flowering time to correlate with anything. The random-mating null does
     * not separate them: it removes the transfer matrix, and both act through
     * the transfer matrix.
     *
     * `shuffleBloom` PERMUTES the expressed schedules among plants. A permutation
     * rather than a redraw, because the multiset of bloom times is then exactly
     * preserved — the number of plants in flower in every slice is identical,
     * so (b) is held fixed to the individual — while WHICH plant holds which
     * schedule is randomised, destroying any association between flowering time
     * and lineage. It is the expressed PHENOTYPE that is scrambled; the alleles
     * still segregate and mutate normally.
     *
     * ⚠️ THE PERMUTATION IS DRAWN IN EITHER MODE and only APPLIED when the flag
     * is set, so the arm and its control consume the same number of draws from
     * the same stream and differ in the MECHANISM rather than in how they walk
     * the random sequence. Same discipline as the spatial branch's `withPos`.
     */
    const order = blooms.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(brn() * (i + 1));
      const t = order[i];
      order[i] = order[j];
      order[j] = t;
    }
    if (PH.shuffleBloom) blooms = order.map((i) => blooms[i]);
  }

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
  let visitLog = null;
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
    const base = allocWeights(ss, opts.allocExponent, n);
    const boutOpts = {
      seed: 7 + gen + 100000 * bi,
      /* Local foraging — the bee's next visit drawn from a kernel around the
       * plant it is standing on. Already implemented inside runBout since
       * 2026-08-02; this is simply the first time the IBM has had coordinates
       * to hand it. Null positions leave the bout bit-identical. */
      positions,
      forageRange: SP ? SP.forageRange : Infinity,
      learner,
      signals: learner ? signals : null,
      rewardP: learner
        ? new Array(n).fill(opts.deceptive ? 0 : opts.honestP)
        : null,
      /* The renderer's window into the bout. First animal only — a second bee
       * carries its own pollen on its own body and the two logs cannot be
       * interleaved into one flight. Reads only; see `log` in carryover's
       * DEFAULTS for why it cannot move the model.
       *
       * ⚠️ AND THE SLICED PATH DOES NOT LOG. With phenology on, the season is a
       * SEQUENCE of bouts each with its own visit numbering, so a {from, count}
       * window would fire once per slice and the renderer would splice
       * fragments of several different flights into what it draws as one. The
       * renderer never runs phenology, so logging stays on the single-bout path
       * where a visit index means exactly one thing. */
      log: !PH && opts.logBout && bi === 0 ? opts.logBout : null,
    };

    if (!PH) {
      const rb = C.runBout(ss, base, { ...boutOpts, visits: per });
      if (bi === 0 && opts.logBout) visitLog = rb.visitLog;
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++) T[i][j] += rb.T[i][j];
    } else {
      /*
       * ---- THE SEASON, RUN AS A SEQUENCE OF BOUTS.
       *
       * ⚠️ NO NEW BOUT MECHANISM. A plant that is not in flower is simply not
       * available to be visited, which is an ABUNDANCE of zero — and runBout
       * has always taken abundance as an argument. The season is therefore a
       * sequence of ordinary bouts with a time-varying abundance vector, which
       * is the same convention two pollinators already use: separate bouts,
       * summed. Nothing inside the bout knows what time it is.
       *
       * ⚠️ AND THE VISIT BUDGET IS SPLIT, not duplicated. Giving each slice the
       * full budget would mean the phenology arm also received more
       * pollination, and "temporal assortment helps" would be
       * indistinguishable from "more visits help" — the trap the two-pollinator
       * control was built to avoid and which its own splitting later turned
       * out to have half-caused.
       *
       * ⚠️ WHAT IT COSTS, stated rather than hidden: the animal starts each
       * slice with an EMPTY BODY, so pollen does not carry from one slice to
       * the next. Between days that is right; within what would otherwise be
       * one continuous bout it is a real loss of carryover, and it applies
       * equally to every arm including the controls.
       */
      const S = Math.max(2, PH.slices | 0 || 8);
      const half = (PH.width === undefined ? 0.25 : PH.width) / 2;
      const perSlice = Math.max(1, Math.round(per / S));
      for (let k = 0; k < S; k++) {
        const t = k / S;
        const w = base.map((b, i) => (ringDist(blooms[i], t) <= half ? b : 0));
        /* A slice in which nothing is in flower is a slice with no visits, not
         * a crash and not a redistribution — the pollinator's effort in that
         * part of the season is simply lost. */
        if (!w.some((x) => x > 0)) continue;
        /*
         * ⚠️⚠️ THE POOL SIZE THE CONFOUND ARM CLAIMS TO HOLD FIXED, MEASURED
         * RATHER THAN ASSUMED.
         *
         * `shuffleBloom` permutes the schedules, which preserves the multiset of
         * bloom times WITHIN a generation — so per-slice occupancy is identical
         * at the moment of the permutation. But once expressed bloom is
         * decoupled from fitness the ALLELE distribution evolves differently:
         * selection no longer maintains its spread, it drifts toward
         * concentration, and a concentrated distribution puts MORE plants in
         * flower together in the slices that are occupied at all.
         *
         * So the control fixes the quantity at one timestep and lets its own
         * downstream consequence drift. Whether that matters is an empirical
         * question about how far the arms actually diverge, and it cannot be
         * settled by inspecting the permutation. This counts what really
         * happened.
         */
        coflowerSum += w.reduce((c, x) => c + (x > 0 ? 1 : 0), 0);
        coflowerSlices++;
        const rb = C.runBout(ss, w, {
          ...boutOpts,
          visits: perSlice,
          seed: boutOpts.seed + 7919 * (k + 1),
        });
        for (let i = 0; i < n; i++)
          for (let j = 0; j < n; j++) T[i][j] += rb.T[i][j];
      }
    }
    /* Placement is defined RELATIVE TO A BODY, so with two animals a plant has
     * two of them. The bimodality statistic is reported on the FIRST animal, so
     * it stays the same quantity it was in every earlier run; the fate of the
     * lineages, which is what this experiment actually asks, does not depend on
     * that choice. */
    if (bi === 0) sites = ss;
  });
  const r = { T };

  /*
   * ⚠️ DID THE TEMPORAL ASSORTMENT ACTUALLY HAPPEN? The positive control for
   * phenology, and it is measured from the TRANSFER MATRIX rather than from the
   * parameters — "plants have flowering windows" is an input, "pollen actually
   * moved between plants that flower together" is the outcome. A window wide
   * enough that everything overlaps everything leaves the arms differing in a
   * parameter and in nothing else, and every downstream comparison would then be
   * measuring an intervention that never landed.
   *
   * Mean bloom-time distance between donor and recipient, weighted by grains
   * delivered, over the same quantity across all pairs. Below 1 means pollen
   * moved between plants closer in flowering time than chance.
   */
  let bloomAssort = null;
  if (PH) {
    let wsum = 0,
      wtot = 0,
      asum = 0,
      acnt = 0;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const d = ringDist(blooms[i], blooms[j]);
        asum += d;
        acnt++;
        if (T[i][j] > 0) {
          wsum += T[i][j] * d;
          wtot += T[i][j];
        }
      }
    const allMean = acnt ? asum / acnt : 0;
    bloomAssort = wtot > 0 && allMean > 1e-12 ? wsum / wtot / allMean : null;
  }

  /*
   * ⚠️⚠️ THE POSITIVE CONTROL FOR `shuffleBloom`, AND `bloomAssort` CANNOT BE IT.
   *
   * bloomAssort measures whether pollen moves between plants close in EXPRESSED
   * flowering time. Permuting the schedules does not change that at all — plants
   * still flower in narrow windows and still exchange pollen with whoever is
   * open alongside them — so bloomAssort stays low in the shuffled arm and would
   * report the manipulation as not having landed. That is the same trap as
   * measuring an intervention with a statistic blind to it.
   *
   * What the shuffle destroys is the association between flowering time and
   * ANCESTRY. So: mean bloom distance between plants of the SAME lineage, over
   * the same quantity for all pairs. Heritable bloom clusters within a lineage
   * and the ratio sits below 1; a permutation decouples them and it returns to
   * 1. Null when there is no ancestry variation left to associate with.
   */
  let bloomLineage = null;
  if (PH && n > 3) {
    let sSum = 0,
      sCnt = 0,
      aSum = 0,
      aCnt = 0;
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++) {
        const d = ringDist(blooms[i], blooms[j]);
        aSum += d;
        aCnt++;
        const ai = pop[i].anc === undefined ? 0 : pop[i].anc;
        const aj = pop[j].anc === undefined ? 0 : pop[j].anc;
        /* "same lineage" in a population with hybrids is a matter of degree, so
         * weight by how much ancestry the pair SHARES rather than forcing a
         * binary that intermediates would not fit */
        const w = 1 - Math.abs(ai - aj);
        sSum += w * d;
        sCnt += w;
      }
    const allM = aCnt ? aSum / aCnt : 0;
    bloomLineage = sCnt > 1e-9 && allM > 1e-12 ? sSum / sCnt / allM : null;
  }

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
   * ---- REPRODUCTIVE ASSURANCE, and it has to attach HERE rather than at the
   * sire draw, which is where the obvious version would put it.
   *
   * ⚠️ A mother is drawn in proportion to `received`, and `received[j]` sums
   * T[i][j] over every i != j. So a mother can only be PICKED if somebody
   * already delivered to her, which guarantees `sires` holds a positive entry.
   * The "nobody delivered to her" branch below is therefore UNREACHABLE on the
   * default path — measured, not assumed: `unmated` is 0 across a 100x range of
   * visit budgets. Mate limitation in this model is not "chosen and left without
   * a sire", it is NEVER BEING CHOSEN AT ALL, and assurance that hooks the sire
   * draw would be silently inert.
   *
   * So selfing enters as a maternal weight FLOOR that does not require a
   * partner: every plant gets `rate x mean(received)` worth of selfed seed, on
   * identical terms and with no reference to lineage. A plant then selfs with
   * probability floor / (its own weight), so a plant nobody visited reproduces
   * almost entirely by selfing while a well-visited one barely does. The
   * frequency-dependence is a CONSEQUENCE of that, not a parameter of it.
   *
   * ⚠️ The floor also flattens the maternal weight distribution, which could by
   * itself change who reproduces — so `floorOnly` applies the floor and still
   * demands an outcross sire, isolating "flattened weights" from "selfed
   * offspring". Under it the unreachable branch above becomes reachable, which
   * is the point.
   */
  let selfW = null;
  if (opts.selfing && (opts.selfing.rate > 0 || opts.selfing.always)) {
    if (opts.selfing.always) {
      /* control arm: reproduction is entirely selfed, so maternal weight stops
       * depending on pollination at all */
      selfW = new Array(n).fill(1);
      weight = new Array(n).fill(1);
    } else {
      const floor =
        (opts.selfing.rate * received.reduce((a, b) => a + b, 0)) / n;
      selfW = new Array(n).fill(floor);
      weight = weight.map((w) => w + floor);
    }
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

  /*
   * Where an offspring lands. See `space` in DEFAULTS for why BOTH draws are
   * taken whichever dispersal mode is set — the cells of the 2x2 must differ in
   * the mechanism, not in how they walk the random stream.
   *
   * ⚠️ The key is only ATTACHED when space is on. Writing `pos: undefined` onto
   * every individual would make the offspring of a panmictic run unequal to the
   * offspring of the same run before this existed — `deepStrictEqual`
   * distinguishes an absent key from one holding undefined — and the tests that
   * assert bit-identity would fail for a reason that has nothing to do with the
   * model.
   */
  const withPos = (child, mother) => {
    if (!SP) return child;
    const u = rng();
    const g = gauss(rng);
    child.pos = Number.isFinite(SP.seedRange)
      ? wrap01(positions[mother] + g * SP.seedRange)
      : u;
    return child;
  };
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
    const gopts = {
      linkSignal: opts.linkSignal,
      signalMut: opts.signalMut,
      srng,
      /* the bloom locus segregates only when phenology is on; see gamete() */
      bloom: !!PH,
      brng: brn,
      bloomMut: PH ? PH.mut : undefined,
      linkBloom: PH ? !!PH.link : false,
    };
    const S = opts.selfing;

    /* A selfed offspring, and the tracer question that comes with it. Returns
     * false when inbreeding depression kills it, so the caller counts a failure
     * exactly as it would for an unpollinated mother. */
    const setSelfedSeed = () => {
      if (S.cost > 0 && rng() < S.cost) return false;
      /* ⚠️ Selfing normally SKIPS the averaging that outcrossing performs, which
       * inflates ancestry variance — and HELD with it — for reasons that are
       * arithmetic rather than biological. ancNull restores the averaging
       * against a random individual so the inflation can be measured. */
      const anc = S.ancNull
        ? ((pop[mother].anc || 0) + (pop[Math.floor(rng() * n)].anc || 0)) / 2
        : pop[mother].anc || 0;
      next.push(
        withPos(
          {
            h1: gamete(pop[mother], rng, opts.mutRate, gopts),
            h2: gamete(pop[mother], rng, opts.mutRate, gopts),
            anc,
          },
          mother,
        ),
      );
      return true;
    };

    /* Does this mother set selfed seed? Her floor share against her own total,
     * so a plant nobody visited selfs almost always and a well-visited one
     * almost never. `floorOnly` keeps the floor but refuses the selfing, which
     * is the control that separates the two. ⚠️ No rng is drawn when the knob is
     * off, so `selfing: null` leaves the random stream — and every result
     * published before this existed — bit-identical. */
    if (
      selfW !== null &&
      !S.floorOnly &&
      rng() * weight[mother] < selfW[mother]
    ) {
      if (!setSelfedSeed()) {
        failed++;
        if (failed > 40 * n) break;
      }
      continue;
    }

    const sires = [];
    for (let i = 0; i < n; i++)
      sires.push(i === mother ? 0 : opts.randomMating ? 1 : r.T[i][mother]);
    const father = pick(sires);
    // --------------------------------------------
    if (father < 0) {
      /* nobody delivered to her: she sets no outcrossed seed. Not silently
       * replaced by a self, because that would manufacture the very isolation
       * the run is trying to detect.
       *
       * ⚠️ UNREACHABLE on the default path — a mother is drawn in proportion to
       * `received`, so being picked at all proves a sire exists. It can fire
       * only under `floorOnly`, where the weight floor may select a mother
       * nobody pollinated and this then correctly refuses her a seed — and even
       * then only under severe pollen limitation, since a plant with ZERO
       * receipt exists only when visits are scarce. Measured for n=24: fires at
       * 20-60 visits, never at 400+. That is the point of the control: the floor
       * ALONE rescues nothing. */
      failed++;
      if (failed > 40 * n) break;
      continue;
    }
    next.push(
      withPos(
        {
          h1: gamete(pop[mother], rng, opts.mutRate, gopts),
          h2: gamete(pop[father], rng, opts.mutRate, gopts),
          /* the tracer: the parental mean, drawing no random numbers */
          anc: ((pop[mother].anc || 0) + (pop[father].anc || 0)) / 2,
        },
        mother,
      ),
    );
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
    /* null unless opts.logBout asked for it — the sampled bout, for drawing. */
    visitLog,
    sites,
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
    /* the positive control for space — null when space is off, or when there is
     * no ancestry variation left to be structured. See ancNeighbour. */
    ancNeighbour: SP ? ancNeighbour(pop, positions) : null,
    /* the positive control for phenology — null when it is off. See above. */
    bloomAssort,
    /* the positive control for shuffleBloom specifically; bloomAssort is blind
     * to it, because a permutation preserves assortment on expressed time */
    bloomLineage,
    /* ⚠️ the confound arm holds this fixed only WITHIN a generation; across
     * generations the allele distribution drifts once selection is removed, so
     * it is measured rather than assumed. null when phenology is off. */
    coflower: coflowerSlices ? coflowerSum / coflowerSlices : null,
    /* the flowering times themselves, so an experiment can ask whether the
     * SEASON split even when the shapes did not */
    blooms,
    unmated: failed,
    /* A stall is a generation that could not produce the offspring it was
     * entitled to. With demography off `target` IS n, so this is the same
     * predicate it has always been; with demography on it must be read against
     * the entitlement rather than against the parents, or every shrinking
     * generation would report itself frozen. */
    stalled: next.length < target,
  };
}

/*
 * `trace` attaches the per-generation placement cloud and the parents' ancestry
 * labels to each history row. Off by default and it consumes NO random numbers,
 * so every published run is bit-identical with it absent — asserted by a test.
 *
 * ⚠️ IT EXISTS SO AN EXPERIMENT NEED NOT REIMPLEMENT THIS LOOP. Asking "what
 * happened BEFORE the lineages fused" needs the state of each generation, and
 * the alternative — a copy of the generation loop living in an experiment — is
 * the failure this project has already recorded once: a helper that recomputes
 * the behaviour under test ends up testing the recomputation, and a step() that
 * ignored a flag left two such tests green. `places` and `anc` are taken from
 * the SAME objects the model itself scored, so they cannot drift from it.
 *
 * Both are measured on the PARENTS of generation g, which is what `places` and
 * `ancVar` already pair with — see the note in step()'s return.
 */
function run({
  n = 30,
  generations = 30,
  seed = 1,
  found = null,
  trace = false,
  ...rest
} = {}) {
  const opts = { ...DEFAULTS, ...rest };
  const rng = E.makeRng(seed);
  /* The advertisement's independent stream — see signalRng(). */
  const srng = signalRng(seed);
  /* The flowering-time stream, created only when phenology is on so the default
   * model's streams are untouched. See bloomRng(). */
  const brng = opts.phenology ? bloomRng(seed) : null;
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
    /* captured BEFORE the step, so it labels the parents that produced this
     * generation rather than their offspring */
    const parentAnc = trace
      ? pop.map((i) => (i.anc === undefined ? 0 : i.anc))
      : null;
    const out = step(pop, opts, rng, g, srng, brng);
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
      ...(trace ? { places: out.places, anc: parentAnc } : {}),
    });
  }
  return { pop, history, extinct: extinct || pop.length < 2 };
}

module.exports = {
  GENE_KEYS,
  ALL_KEYS,
  SIGNAL_GENE,
  BLOOM_GENE,
  LINK_GROUP,
  BLOOM_LINK_GROUP,
  bloomRng,
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
  ancNeighbour,
  fateOf,
  sitesOf,
  placementOf,
  allocWeights,
  dist,
  twoClusterSeparation,
  gapMembers,
  gapOccupancy,
  spreadOf,
  step,
  run,
};
