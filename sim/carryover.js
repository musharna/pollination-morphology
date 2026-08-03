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
  const anther = a.hits.map((h) => ({ s: h.s, phi: h.phi }));
  return {
    anther,
    stigma: s.hits.map((h) => ({ s: h.s, phi: h.phi })),
    contactRate: a.contactRate,
    /* Modal anther placement — the spot a perfectly-aligned visitor would touch.
     * A solid pollinium is removed only by a visit that lands close to it (see
     * `dispersalUnit` below), so this is the target that removal is measured
     * against. Circular in phi. */
    antherMode: anther.length
      ? {
          s: anther.reduce((t, h) => t + h.s, 0) / anther.length,
          phi: Math.atan2(
            anther.reduce((t, h) => t + Math.sin(h.phi), 0),
            anther.reduce((t, h) => t + Math.cos(h.phi), 0),
          ),
        }
      : null,
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

  /* ---- pollen-dispersal unit (roadmap E, sim/reward.js has the accounting).
   *
   * "granular" is the model everything before this assumed: pollen is many
   * independent grains, picked up a dose at a time by any contact, groomed off
   * and deposited grain by grain.
   *
   * "pollinium" is one solid mass — the orchid and milkweed condition. ONE
   * mechanism, two consequences that pull in opposite directions, which is what
   * makes it testable rather than a knob:
   *   REMOVAL falls, because the whole mass leaves only on a visit precise
   *   enough to catch the viscidium (`viscidium`, in body-metric units);
   *   TRANSFER rises, because a coherent unit is not whittled away grain by
   *   grain by grooming and is not diluted across many stigmas.
   * Johnson & Harder 2023 (10.1098/rspb.2023.1148, 228 species) measured
   * exactly that crossing: removal <45% for solid pollinia against >80% for
   * granular monads, while transfer efficiency runs 27.0% against 2.4%. */
  dispersalUnit: "granular",
  viscidium: 0.6,

  /* ---- flower constancy (roadmap B). A foraging bee tends to keep visiting
   * the kind of flower it last visited rather than sampling freely — one of the
   * best-documented facts in pollinator behaviour (Waser 1986; Chittka, Thomson
   * & Waser 1999). It is included here because the frequency-dependence
   * measurement in experiments/two-pollinators.js named the barrier precisely:
   * a rare placement is penalised because there is nobody to exchange pollen
   * with (rare/common ~ 0.26). Constancy attacks that directly, and it should
   * help a RARE morph disproportionately — a common morph would be revisited by
   * chance anyway, while a rare one would not. 0 = free sampling = every
   * earlier result, with no rng draw consumed. */
  constancy: 0,

  /* ---- spatial structure (roadmap B). Plants sit at positions on a RING (a
   * ring rather than a line so there are no edge artefacts), and a bee forages
   * LOCALLY: its next visit is drawn from a Gaussian kernel around the plant it
   * is standing on. Limited dispersal then means a rare morph's offspring land
   * near it, so it can be locally common while globally rare — which is the one
   * thing neither a second pollinator nor flower constancy provided, and both
   * of those failed for exactly that reason.
   *
   * `positions` is one coordinate in [0,1) per ENTRY; null = well-mixed, the
   * behaviour of every earlier result, with no rng draw consumed differently.
   * `forageRange` is the kernel width in ring units; Infinity = global. */
  positions: null,
  forageRange: Infinity,

  /* ---- deception (roadmap C, and roadmap B's sixth symmetry-breaker). A
   * deceptive flower advertises and pays nothing, so what limits it is not its
   * advertisement but what the animal has LEARNED. `learner` is that memory
   * (sim/deception.js); `signals` is one advertising coordinate per entry and
   * `rewardP` the probability a visit is paid — 0 for a cheat, 1 for a reliable
   * rewarder, in between for the variable rewarders that actually exist.
   *
   * null = no learning = every earlier result, and — the part that matters —
   * NO EXTRA RNG DRAW IS CONSUMED, so existing streams are byte-identical.
   * Whether learning produces a rare-morph advantage is measured, not assumed;
   * see the module header for why that had to be left open. */
  learner: null,
  signals: null,
  rewardP: null,
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
    dispersalUnit,
    viscidium,
    constancy,
    positions,
    forageRange,
    learner,
    signals,
    rewardP,
    lastMale = true,
  } = { ...DEFAULTS, ...opts };
  const pollinium = dispersalUnit === "pollinium";
  if (pollinium && !Number.isFinite(pollenPerFlower))
    throw new Error(
      "a pollinium IS the flower's pollen, so pollenPerFlower must be finite",
    );
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
  /* Last entry visited — for flower constancy and for local foraging. */
  let lastSp = -1;
  const local =
    Array.isArray(positions) &&
    positions.length === S &&
    Number.isFinite(forageRange);
  /* Arc distance on the ring, so the two ends of the coordinate are adjacent
   * and no plant is disadvantaged by sitting at an edge. */
  const ringDist = (a, b) => {
    const d = Math.abs(a - b) % 1;
    return d > 0.5 ? 1 - d : d;
  };
  const localW = new Float64Array(S);

  /* Deception. The weights are no longer constant across the bout — the whole
   * point is that they move as the animal learns — so they are recomputed per
   * visit when a learner is present, exactly as the local-foraging path already
   * does. Guarded so the default path keeps its precomputed cumulative array. */
  const learning = !!learner;
  if (learning) {
    if (!Array.isArray(signals) || signals.length !== S)
      throw new Error(
        `deception needs one signal per entry: got ${signals && signals.length} for ${S}`,
      );
    if (rewardP && rewardP.length !== S)
      throw new Error(
        `rewardP must be one per entry: got ${rewardP.length} for ${S}`,
      );
  }
  const learnW = new Float64Array(S);
  const pickLearned = () => {
    let tot = 0;
    for (let i = 0; i < S; i++) {
      const w = abundance[i] * learner.expect(signals[i]);
      learnW[i] = w;
      tot += w;
    }
    /* Every signal fully avoided. The animal still has to forage somewhere, so
     * it falls back to abundance alone rather than the bout silently stalling —
     * a stalled bout would read as "deception is costless", which is the
     * opposite of what a total aversion means. */
    if (!(tot > 0)) {
      const r = rng() * acc;
      for (let i = 0; i < S; i++) if (r <= cum[i]) return i;
      return S - 1;
    }
    let r = rng() * tot;
    for (let i = 0; i < S; i++) {
      r -= learnW[i];
      if (r <= 0) return i;
    }
    return S - 1;
  };

  const pick = () => {
    if (learning) return pickLearned();
    /* The rng is only touched when constancy is actually in play, so the
     * default model's stream — and every result built on it — is untouched. */
    if (constancy > 0 && lastSp >= 0 && rng() < constancy) return lastSp;
    if (local && lastSp >= 0) {
      let tot = 0;
      for (let i = 0; i < S; i++) {
        const d = ringDist(positions[i], positions[lastSp]);
        const w =
          abundance[i] * Math.exp(-(d * d) / (2 * forageRange * forageRange));
        localW[i] = w;
        tot += w;
      }
      if (tot > 0) {
        let r = rng() * tot;
        for (let i = 0; i < S; i++) {
          r -= localW[i];
          if (r <= 0) return i;
        }
        return S - 1;
      }
    }
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
    lastSp = j;

    /* The animal finds out whether this flower pays, and time passes.
     *
     * The rng is drawn UNCONDITIONALLY here rather than only when rewardP is
     * fractional, so two arms that differ only in who is deceptive consume the
     * identical draw sequence. Otherwise the arms would diverge in the rng
     * stream as well as in the mechanism, and a difference between them could
     * not be attributed. */
    if (learning) {
      const p = rewardP ? rewardP[j] : 1;
      learner.learn(signals[j], rng() < p ? 1 : 0);
      learner.decay();
    }

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
        /* `mass` is 1 for a granular grain and the whole pool for a
         * pollinium, so every count below is in GRAINS regardless of how the
         * pollen is packaged — which is what makes the two units comparable. */
        const m = g.mass || 1;
        if (g.ok === false) {
          deadDelivered += m;
          continue;
        }
        T[g.sp][j] += m;
        ageOnDeposit.push(v - g.t);
        if (g.sp === j) landedRight += m;
        else landedWrong += m;
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
      if (rng() < groom) groomedOff += g.mass || 1;
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
    let polSite = null;
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
      if (pollinium) {
        /* All or nothing. The mass comes away only if this visit lands close
         * enough to the modal anther contact to catch the viscidium, which is
         * why removal efficiency is LOW for pollinia without anything being
         * wrong with the flower. */
        polSite = site.anther[(rng() * site.anther.length) | 0];
        const m = site.antherMode;
        const caught =
          m && bodyDist(polSite, m.s, m.phi) < viscidium && remaining[j] > 0;
        dose = caught ? remaining[j] : 0;
        if (!caught) polSite = null;
      } else {
        dose = Math.min(dosePerVisit, remaining[j]);
      }
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
    if (pollinium) {
      /* ONE unit carrying the whole mass. Everything downstream — grooming,
       * the carry cap, deposition — then acts on it as a single object rather
       * than on `dose` independent grains, which is exactly the coherence that
       * makes transfer efficiency HIGH. Two opposite consequences, one cause. */
      if (polSite && dose > 0) {
        const ok = viability >= 1 || rng() < viability;
        if (!ok) senesced += dose;
        load.push({
          s: polSite.s,
          phi: polSite.phi,
          sp: j,
          t: v,
          ok,
          mass: dose,
        });
        produced += dose;
      }
    } else
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
        if (rng() < harvest) harvested += g.mass || 1;
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
