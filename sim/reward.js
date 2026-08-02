/*
 * Reward currency — what the animal is actually paid, and what that costs.
 *
 * Every result so far has treated a visit as free to the flower. It is not.
 * The currency the flower pays in changes the entire payoff structure, and the
 * reason is that ONE currency is also the gamete:
 *
 *   POLLEN    is simultaneously the reward and the male gamete. A grain packed
 *             into a bee's corbiculae is a grain that will never reach a
 *             stigma. Offering more buys more visits and destroys more gametes.
 *             This is the "pollen dilemma" — the inability to perform both
 *             functions at once (Oliveira et al. 2020, 10.3390/plants9121685;
 *             heteranthery is the documented way out, Saab et al. 2021,
 *             10.1093/aobpla/plab054).
 *
 *   NECTAR    is a separate currency. It costs carbon and water, not gametes,
 *             so attraction is DECOUPLED from male fitness.
 *
 * The mechanism that makes this bite is a saturating male gain curve. Harder &
 * Thomson 1989 (10.1086/284922, Am Nat) measured bumble bees depositing 0.6%
 * of removed pollen onto subsequent stigmas in Erythronium grandiflorum, and —
 * the load-bearing part — "the proportion deposited declined as the amount
 * removed increased". So a plant maximises dispersal with many small-dose
 * visits rather than few large ones: restrict presentation, dispense gradually.
 *
 * THE PREDICTION IS TWO-SIDED, which is what makes it testable rather than
 * decorative. Castellanos et al. 2006 (10.1086/498854, Am Nat): "Simultaneous
 * pollen presentation should be favored when pollinators are infrequent or
 * efficient at delivering the pollen they remove, whereas gradual dosing should
 * optimize delivery by frequent and wasteful pollinators." A model that answers
 * "dispense gradually" in every regime has not reproduced the theory, it has
 * merely got lucky in one half of it — so both halves are checked.
 *
 * Vallejo-Marin & Lundgren 2025 (10.1111/1365-2435.70189, Funct Ecol) note that
 * pollen presentation theory "has rarely been tested empirically using real bee
 * visits". A bout that COUNTS transfer is the right instrument for that gap.
 */

const C = require("./carryover.js");

/*
 * A currency is defined by two things: whether collecting it destroys gametes,
 * and what the animal is actually attracted by.
 *
 * `harvest` is the fraction of the carried load the animal actively packs away
 * per visit. It is NOT grooming — grooming is passive loss that happens under
 * any currency. Harvest is the animal taking the reward, and it exists only
 * when the reward IS the pollen.
 */
const REWARDS = {
  pollen: {
    harvest: 0.35,
    /* Attraction is the dose on offer, so the dispensing schedule and the
     * advertisement are the SAME NUMBER. This single coupling is the dilemma. */
    attract: (sp) => sp.presentRate * sp.pollenPerFlower,
  },
  nectar: {
    harvest: 0,
    /* Attraction is a separate budget, so a flower may dispense pollen as
     * meanly as it likes and still be worth visiting. */
    attract: (sp) => sp.nectar,
  },
};

/*
 * Visitation weight. runBout draws plants in proportion to the weights it is
 * given, so reward-dependent visitation needs no change to the bout at all —
 * abundance is simply scaled by how attractive the flower is.
 */
function visitWeights(species) {
  return species.map((sp) => {
    const r = REWARDS[sp.reward];
    if (!r) throw new Error(`unknown reward currency: ${sp.reward}`);
    return Math.max(0, sp.abundance * r.attract(sp));
  });
}

/*
 * One bout under a declared currency. Every species in a bout must share a
 * currency here — mixing them would confound the harvest rate, which is a
 * property of what the ANIMAL is collecting, not of one flower.
 */
function runRewardBout(species, opts = {}) {
  const kinds = new Set(species.map((s) => s.reward));
  if (kinds.size !== 1)
    throw new Error(`one currency per bout, got: ${[...kinds].join(", ")}`);
  const kind = REWARDS[[...kinds][0]];

  const r = C.runBout(
    species.map((s) => s.sites),
    visitWeights(species),
    {
      ...opts,
      harvest: opts.harvest === undefined ? kind.harvest : opts.harvest,
      pollenPerFlower: species[0].pollenPerFlower,
      presentRate: species[0].presentRate,
    },
  );
  return r;
}

/*
 * MALE FITNESS is delivered conspecific grains per grain RELEASED, not per
 * grain the plant owns. Released is the right denominator because it is what
 * Harder & Thomson measured — deposited as a proportion of removed — and
 * because a plant that never opens an anther would otherwise score infinitely
 * well.
 */
function maleFitness(result, i) {
  const rel = result.released[i];
  if (!rel) return { delivered: 0, released: 0, rate: 0 };
  const delivered = result.T[i][i];
  return { delivered, released: rel, rate: delivered / rel };
}

/*
 * NET male fitness — gross siring minus the cost of having stayed open.
 *
 * A flower is not free to keep. Floral longevity is itself an optimised trait
 * balancing the maintenance cost of an open flower against the pollination it
 * buys (Ashman & Schoen 1994, 10.1038/371788a0, Nature), so a gradual
 * disperser that needs twenty visits to shed its pollen pays twenty times the
 * upkeep of one that sheds in a single visit.
 *
 * `maintenance` is that upkeep per visit-open, quoted in GRAIN EQUIVALENTS so
 * it can be subtracted from siring directly. That is a currency conversion and
 * it is an assumption, not a measurement — its only job here is to be the
 * SECOND, non-selective cost, against which senescence can be told apart. A
 * cost that acts the same way in every regime cannot repair one cell of a 2x2
 * without disturbing the others, and this is the arm that demonstrates it.
 */
function netMaleFitness(result, i, { pool, maintenance = 0 } = {}) {
  const committed = result.flowersUsed[i] * pool;
  if (!committed) return 0;
  const upkeep = maintenance * result.visitsTo[i];
  return (result.T[i][i] - upkeep) / committed;
}

/* Summed over species, for a whole-community readout. */
function deliveryRate(result) {
  let del = 0,
    rel = 0;
  for (let i = 0; i < result.T.length; i++) {
    del += result.T[i][i];
    rel += result.released[i];
  }
  return rel > 0 ? del / rel : 0;
}

module.exports = {
  REWARDS,
  visitWeights,
  runRewardBout,
  maleFitness,
  netMaleFitness,
  deliveryRate,
};
