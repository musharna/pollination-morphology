/*
 * Carryover — pollen persists on the animal across several flowers.
 *
 * Everything up to here has been MEAN-FIELD: transfer from species i to j was
 * the overlap of i's anther placement with j's stigma placement, which
 * silently assumes a grain gets exactly one chance and is then gone. Real
 * pollen rides. A grain picked up at flower 1 may still be aboard at flower 5,
 * and a stigma sweeping a patch of the body collects whatever is lying there
 * from any donor.
 *
 * That makes three things measurable that were previously deferred:
 *
 *   LAST-MALE ADVANTAGE     newly deposited grains lie on top of older ones,
 *                           so a stigma takes the most recent first
 *                           (Santana 2025, quantum-dot-labelled pollen)
 *   PACKAGING EFFICIENCY    what fraction of a flower's pollen ever reaches a
 *                           conspecific stigma rather than being groomed off
 *   REAL TRANSFER           a counted rate rather than a distribution overlap
 *
 * And it poses a question with two plausible opposite answers. Carryover gives
 * a grain many chances to find the right stigma, which should HELP rare and
 * poorly-separated species; it also lets heterospecific pollen accumulate on
 * the body, which should HURT them. Which dominates decides whether carryover
 * raises or lowers the number of species one pollinator can support.
 */

const P = require("./placement.js");

/* Body metric. Distances along and around the body are not comparable in raw
 * units, so both are scaled by the spread the contact model actually produces
 * — one unit is roughly one placement's worth of scatter. */
const S_SCALE = 0.043;
const PHI_SCALE = 0.42;

const angDiff = (a, b) => {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
};

function bodyDist(g, s, phi) {
  const ds = (g.s - s) / S_SCALE;
  const dp = angDiff(g.phi, phi) / PHI_SCALE;
  return Math.sqrt(ds * ds + dp * dp);
}

function makeRng(seed) {
  let x = seed >>> 0 || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 4294967296;
  };
}

/*
 * Precompute each species' contact sites once. Within a generation a genome is
 * fixed, so re-deriving placement per visit would be pure waste.
 */
function siteSet(flower, bee, { n = 160, seed = 5 } = {}) {
  const a = P.placementDistribution(flower, bee, { n, seed, part: "anther" });
  const s = P.placementDistribution(flower, bee, {
    n,
    seed: seed + 1,
    part: "stigma",
  });
  return {
    anther: a.hits.map((h) => ({ s: h.s, phi: h.phi })),
    stigma: s.hits.map((h) => ({ s: h.s, phi: h.phi })),
    contactRate: a.contactRate,
  };
}

const DEFAULTS = {
  deposit: 8, // grains a visited anther puts on the animal
  pickup: 5, // grains a stigma can take in one visit
  groom: 0.18, // per-grain probability of being lost per visit
  radius: 1.15, // stigma contact radius, in body-metric units
  cap: 140, // how much pollen the animal can carry at once

  /* ---- reward currency (sim/reward.js). Defaults reproduce the pre-reward
   * bout EXACTLY: an unlimited anther, everything offered at once, and no
   * active collection. The carryover tests are the regression guard for that,
   * including the groom=1 limiting case the whole model is checked against. */
  pollenPerFlower: Infinity, // finite lifetime pollen pool per flower
  presentRate: 1, // fraction of that pool offered per visit (dispensing schedule)
  visitsPerFlower: Infinity, // visits a flower gets before it dies with its pollen
  visitJitter: false, // if set, that count is a MEAN and each flower's life is geometric
  harvest: 0, // fraction of the load ACTIVELY packed away by the animal

  /* ---- cost of prolonged presentation.
   * Pollen held back is pollen ageing: viability decays after anthesis on a
   * clock, over hours to days depending on species (Dafni & Firmage 2000,
   * 10.1007/bf00984098). A gradual disperser therefore ships progressively
   * deader gametes, which is the one penalty gradual dispensing bore nowhere
   * else in this model. Measured in BOUT TICKS, because pollen dies on a clock
   * rather than per visitor. Infinity = no senescence = the previous model. */
  pollenLife: Infinity,
};

/*
 * One foraging bout. The pollinator visits plants drawn in proportion to
 * abundance and the transfer matrix is COUNTED, not assumed:
 * T[i][j] is the number of grains from species i that ended up on a stigma of
 * species j.
 */
function runBout(sites, abundance, opts = {}) {
  const {
    visits = 20000,
    seed = 1,
    deposit,
    pickup,
    groom,
    radius,
    cap,
    pollenPerFlower,
    presentRate,
    visitsPerFlower,
    visitJitter,
    harvest,
    pollenLife,
    lastMale = true,
  } = { ...DEFAULTS, ...opts };
  const rng = makeRng(seed);
  const S = sites.length;

  /* Pollen remaining in the flower of species i that the animal is currently
   * working. A flower with a finite pool dispenses part of it per visit and is
   * replaced when spent — which is what makes a DISPENSING SCHEDULE meaningful
   * rather than a rescaling of `deposit`. */
  const finite = Number.isFinite(pollenPerFlower);
  const remaining = new Float64Array(S).fill(finite ? pollenPerFlower : 0);
  const released = new Float64Array(S);
  const unreleased = new Float64Array(S);
  const flowersUsed = new Float64Array(S).fill(finite ? 1 : 0);
  const flowerVisits = new Float64Array(S);
  const dosePerVisit = Math.max(1, Math.round(presentRate * pollenPerFlower));
  let harvested = 0;

  /* Bout tick at which the flower currently being worked opened. A grain's
   * anther residence is (now - that), which is what senescence acts on. */
  const senesce = Number.isFinite(pollenLife) && finite;
  const flowerOpenedAt = new Float64Array(S);
  const visitsTo = new Float64Array(S);
  let senesced = 0,
    deadDelivered = 0,
    capTruncated = 0;

  const cum = [];
  let acc = 0;
  for (let i = 0; i < S; i++) {
    acc += abundance[i];
    cum.push(acc);
  }
  const pick = () => {
    const r = rng() * acc;
    for (let i = 0; i < S; i++) if (r <= cum[i]) return i;
    return S - 1;
  };

  const T = Array.from({ length: S }, () => new Float64Array(S));
  let load = [];
  let produced = 0,
    landedRight = 0,
    landedWrong = 0,
    groomedOff = 0;
  const ageOnDeposit = [];

  for (let v = 0; v < visits; v++) {
    const j = pick();
    const site = sites[j];
    if (!site.anther.length || !site.stigma.length) continue;
    visitsTo[j] += 1;

    // --- the stigma sweeps first: a flower cannot pollinate itself with the
    // --- pollen it is about to hand over on the same visit
    const sSite = site.stigma[(rng() * site.stigma.length) | 0];
    if (load.length) {
      const near = [];
      for (let gi = 0; gi < load.length; gi++)
        if (bodyDist(load[gi], sSite.s, sSite.phi) < radius) near.push(gi);
      /* Newest first. Fresh pollen lies ON TOP of what is already there, so a
       * stigma takes the most recent grains — last-male advantage is not
       * imposed here, it falls out of the stacking. */
      if (lastMale) near.sort((x, y) => load[y].t - load[x].t);
      else
        for (let q = near.length - 1; q > 0; q--) {
          const r = (rng() * (q + 1)) | 0;
          [near[q], near[r]] = [near[r], near[q]];
        }
      const take = near.slice(0, pickup);
      for (const gi of take) {
        const g = load[gi];
        /* An inviable grain still LANDS. It occupies one of the stigma's
         * limited slots and simply fails to sire, which is why senescence is
         * not merely a discount on the delivered count — dead pollen crowds
         * out live pollen. The grain is dropped from the load either way. */
        if (g.ok === false) {
          deadDelivered++;
          continue;
        }
        T[g.sp][j] += 1;
        ageOnDeposit.push(v - g.t);
        if (g.sp === j) landedRight++;
        else landedWrong++;
      }
      const drop = new Set(take);
      load = load.filter((_, gi) => !drop.has(gi));
    }

    /*
     * --- grooming comes BETWEEN the sweep and the new load, and the order is
     * load-bearing. Grooming before the sweep, or after the fresh pollen is
     * added, both destroy the limiting case: at groom = 1 each grain must get
     * EXACTLY ONE stigma sweep, at the very next flower, which is precisely
     * the mean-field assumption every earlier result rests on. That limit is
     * how this machinery is checked against the old one.
     */
    const kept = [];
    for (const g of load) {
      if (rng() < groom) groomedOff++;
      else kept.push(g);
    }
    load = kept;

    /*
     * --- then the anther loads it up.
     *
     * With an unlimited pool this is the original fixed `deposit`. With a
     * finite pool the flower hands over its scheduled dose and is replaced once
     * spent, so `presentRate` controls the DOSE while the pool controls the
     * TOTAL — the two quantities pollen presentation theory separates.
     */
    let dose = deposit;
    if (finite) {
      /*
       * A flower gets a bounded number of visits and then dies, and whatever it
       * has not yet dispensed dies with it. That waste is the entire reason
       * pollen presentation theory is TWO-SIDED: gradual dispensing spreads
       * pollen across many visitors when visitors are plentiful, but strands it
       * in the anther when they are scarce (Castellanos et al. 2006,
       * 10.1086/498854). Replacing flowers only once they are spent would
       * quietly guarantee every flower drains, and the model could then only
       * ever return "dispense gradually".
       */
      /* With jitter the flower's life is geometric with the same mean, so a
       * gradual disperser is sometimes stranded with pollen still in the anther
       * even when visitors are plentiful on average. Deterministic lifetimes
       * remove that risk entirely, and removing it is what makes gradual
       * dispensing unbeatable whenever the mean clears the dispensal
       * requirement. */
      const dead = visitJitter
        ? Number.isFinite(visitsPerFlower) && rng() < 1 / visitsPerFlower
        : flowerVisits[j] >= visitsPerFlower;
      if (dead) {
        unreleased[j] += remaining[j];
        remaining[j] = pollenPerFlower;
        flowerVisits[j] = 0;
        flowersUsed[j] += 1;
      } else if (remaining[j] <= 0) {
        remaining[j] = pollenPerFlower; // spent, so on to the next flower
        flowerVisits[j] = 0;
        flowersUsed[j] += 1;
      }
      /* A flower opens when it is first VISITED, not when the bout starts.
       * Anchoring the clock to tick zero instead would age the first flower of
       * every species by however long the bout took to reach it — and because
       * senescence draws an rng per grain, that silently moves every downstream
       * number even in runs where nothing actually senesces. */
      if (flowerVisits[j] === 0) flowerOpenedAt[j] = v;
      flowerVisits[j] += 1;
      dose = Math.min(dosePerVisit, remaining[j]);
      remaining[j] -= dose;
      released[j] += dose;
    }
    /* Viability at the moment of release, set by how long this grain has sat in
     * the anther. A simultaneous presenter empties on the visit its flower
     * opens, so its residence is zero and senescence costs it nothing; a
     * gradual presenter ships its last dose after the whole flower lifetime.
     * That asymmetry is the entire mechanism — the cost is SCHEDULE-SELECTIVE
     * by construction, not a flat handicap on dispensing slowly. */
    const viability = senesce
      ? Math.exp(-(v - flowerOpenedAt[j]) / pollenLife)
      : 1;
    for (let d = 0; d < dose; d++) {
      const aSite = site.anther[(rng() * site.anther.length) | 0];
      /* Short-circuit when fully viable so the rng stream is untouched in the
       * default (pollenLife = Infinity) model — every earlier result, and the
       * groom = 1 mean-field regression, must stay bit-identical. */
      const ok = viability >= 1 || rng() < viability;
      if (!ok) senesced++;
      load.push({ s: aSite.s, phi: aSite.phi, sp: j, t: v, ok });
      produced++;
    }

    /*
     * --- and the animal packs some of it away for itself.
     *
     * THE POLLEN DILEMMA: pollen is simultaneously the reward and the male
     * gamete, so a grain eaten is a grain never delivered (Oliveira et al. 2020,
     * 10.3390/plants9121685). This is ACTIVE collection into the corbiculae and
     * is distinct from the passive grooming loss above — a nectar-rewarding
     * flower has grooming but no harvest, which is exactly the contrast
     * sim/reward.js measures. It comes AFTER the fresh load because that is
     * when a bee packs: it works over the pollen it has just picked up.
     */
    if (harvest > 0) {
      const keep = [];
      for (const g of load) {
        if (rng() < harvest) harvested++;
        else keep.push(g);
      }
      load = keep;
    }

    /* The carry cap discards the OLDEST grains, which are exactly the ones that
     * have not yet found a stigma. Its losses are counted SEPARATELY from
     * grooming on purpose: folded into groomedOff they are indistinguishable
     * from ordinary passive loss, and a cap that binds hard under one
     * dispensing schedule and not another then silently decides experiments
     * about dispensing schedules. It did. See docs/2026-08-02. */
    if (load.length > cap) {
      load.sort((a, b) => a.t - b.t);
      capTruncated += load.length - cap;
      load = load.slice(load.length - cap);
    }
  }

  return {
    T,
    produced,
    landedRight,
    landedWrong,
    groomedOff,
    harvested,
    senesced,
    deadDelivered,
    capTruncated,
    released,
    unreleased,
    flowersUsed,
    visitsTo,
    retained: load.length,
    ageOnDeposit,
    visits,
  };
}

/*
 * Row-normalised transfer, so it can be compared against a mean-field overlap
 * matrix on the same footing: what share of species i's delivered pollen
 * reached species j?
 */
function normaliseRows(T) {
  const S = T.length;
  const N = Array.from({ length: S }, () => new Float64Array(S));
  for (let i = 0; i < S; i++) {
    let tot = 0;
    for (let j = 0; j < S; j++) tot += T[i][j];
    if (tot > 0) for (let j = 0; j < S; j++) N[i][j] = T[i][j] / tot;
  }
  return N;
}

/* Median carry age of grains that were actually delivered — how many visits a
 * grain rides before it lands. Zero means no carryover at all. */
function medianCarry(ages) {
  if (!ages.length) return 0;
  const a = [...ages].sort((x, y) => x - y);
  return a.length % 2
    ? a[(a.length - 1) / 2]
    : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
}

module.exports = {
  DEFAULTS,
  S_SCALE,
  PHI_SCALE,
  angDiff,
  bodyDist,
  siteSet,
  runBout,
  normaliseRows,
  medianCarry,
  makeRng,
};
