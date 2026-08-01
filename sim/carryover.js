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
    lastMale = true,
  } = { ...DEFAULTS, ...opts };
  const rng = makeRng(seed);
  const S = sites.length;

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
      else for (let q = near.length - 1; q > 0; q--) {
        const r = (rng() * (q + 1)) | 0;
        [near[q], near[r]] = [near[r], near[q]];
      }
      const take = near.slice(0, pickup);
      for (const gi of take) {
        const g = load[gi];
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

    // --- then the anther loads it up
    for (let d = 0; d < deposit; d++) {
      const aSite = site.anther[(rng() * site.anther.length) | 0];
      load.push({ s: aSite.s, phi: aSite.phi, sp: j, t: v });
      produced++;
    }
    if (load.length > cap) {
      load.sort((a, b) => a.t - b.t);
      groomedOff += load.length - cap;
      load = load.slice(load.length - cap);
    }
  }

  return {
    T,
    produced,
    landedRight,
    landedWrong,
    groomedOff,
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
