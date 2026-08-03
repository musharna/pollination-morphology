/*
 * Deception — the sixth mechanism class, and the first one that can make a RARE
 * morph do better than a common one.
 *
 * A deceptive flower advertises and pays nothing. Everything the model has so
 * far assumes a visit is drawn on abundance times attractiveness, both of which
 * are properties of the FLOWER. Deception cannot work that way, because the
 * thing that limits a cheat is not its advertisement but what the animal has
 * LEARNED about it. So the pollinator needs a state, and this module is that
 * state.
 *
 * ⚠️ THE LITERATURE IS GENUINELY SPLIT, SO NEGATIVE FREQUENCY-DEPENDENCE IS AN
 * OUTPUT HERE, NOT AN ASSUMPTION.
 *
 *   Gigord, Macnair & Smithson 2001 (10.1073/pnas.111162598, PNAS) varied the
 *   relative frequency of the two colour morphs of the rewardless orchid
 *   Dactylorhiza sambucina in its natural habitat and found rare morphs gained
 *   through BOTH male and female components — the first demonstration that
 *   pollinator preference for rare morphs can maintain a colour polymorphism.
 *
 *   ⚠️ Smithson, Juillet, Macnair & Gigord 2007 (10.1890/05-1445, Ecology) —
 *   the SAME GROUP six years later — found NO evidence that polymorphic arrays
 *   of the same orchid had higher mean reproductive success, and monomorphic
 *   yellow arrays had significantly GREATER pollinia removal. Rare-morph
 *   advantage is not the same claim as diversity advantage, and the second did
 *   not replicate.
 *
 *   ⚠️ Whitehead & Peakall 2012 (10.1093/beheco/ars149, Behav Ecol) tracked the
 *   wasp pollinating the sexually deceptive Chiloglottis trapeziformis with
 *   synthetic pheromone baits and found SHORT-TERM BUT NOT LONG-TERM patch
 *   avoidance. Whatever the animal learns, it forgets.
 *
 * Building this with a rare-morph advantage wired in would have been assuming
 * the answer to the question the module exists to ask. What is wired in instead
 * is a standard learning rule; whether it PRODUCES frequency-dependence, and at
 * what memory length, is measured.
 *
 * THE MODEL. Rescorla-Wagner associative learning over a signal space, with a
 * stimulus generalisation gradient — the textbook account of what a foraging
 * bee does, and every parameter names something measurable:
 *
 *   E(x)   the animal's current expectation of reward at signal x
 *   rate   how fast one experience moves that expectation
 *   forget how fast it decays back to naive  <- Whitehead & Peakall's short memory
 *   width  how far learning about x transfers to signals near x
 *   naive  the expectation an inexperienced animal starts with
 *
 * `naive` is why deception works at all. Internicola & Harder 2011
 * (10.1098/rspb.2011.1849, Proc R Soc B) found generalised food-deceptive
 * orchids compete poorly with rewarding species and do better when flowering
 * early, when "relatively more pollinators are naive" — so the naive
 * expectation is not a convenience, it is the resource a cheat consumes.
 *
 * GENERALISATION IS THE TRADE-OFF, and it is why signal is a separate axis from
 * placement. A cheat that mimics rewarding flowers closely is hard to tell
 * apart and gets visits — but it also sits inside the aversion its own kind
 * generates. A distinctive cheat is easy to avoid. Lichtenberg, Heiling,
 * Bronstein & Barker 2020 (10.1098/rstb.2019.0486, Phil Trans R Soc B) frame
 * exactly this as a signal-detection problem: similarity among floral displays
 * weakens the correlation between signal and reward, which is what makes the
 * discrimination hard.
 *
 * Signal space is a RING, for the same reason plant positions are: on a line
 * the extreme signals have fewer neighbours and would look distinctive for a
 * reason that is an artefact of the coordinate rather than a fact about
 * signalling.
 */

const BINS = 64;

/*
 * A learner is one animal's memory. It is deliberately NOT per-species: the
 * animal knows signals, not taxonomy, which is the whole content of
 * generalisation. Two species with the same signal are indistinguishable to it,
 * and that is the intended behaviour, not a limitation.
 */
function makeLearner({
  rate = 0.15,
  forget = 0.02,
  width = 0.08,
  naive = 1,
  bins = BINS,
} = {}) {
  if (!(width > 0)) throw new Error("generalisation width must be positive");
  if (rate < 0 || rate > 1) throw new Error(`rate out of range: ${rate}`);
  if (forget < 0 || forget > 1)
    throw new Error(`forget out of range: ${forget}`);

  const E = new Float64Array(bins).fill(naive);

  /* Ring distance in signal units, so no signal is distinctive by virtue of
   * sitting at the end of the coordinate. */
  const ringDist = (a, b) => {
    const d = Math.abs(a - b) % 1;
    return d > 0.5 ? 1 - d : d;
  };

  /* The generalisation gradient, precomputed: kernel[k] is how much an
   * experience k bins away moves this bin. Bees show gaussian-shaped
   * generalisation around a trained stimulus, so a gaussian is the shape. */
  const half = bins >> 1;
  const kernel = new Float64Array(bins);
  for (let k = 0; k < bins; k++) {
    const d = (k > half ? bins - k : k) / bins;
    kernel[k] = Math.exp(-(d * d) / (2 * width * width));
  }

  const binOf = (x) => {
    const m = ((x % 1) + 1) % 1;
    return Math.min(bins - 1, (m * bins) | 0);
  };

  return {
    bins,
    naive,
    /* What the animal currently expects at this signal. Callers use it as a
     * multiplier on visitation, so it is clamped to be non-negative — an
     * animal can be unwilling, not repelled into negative probability. */
    expect(signal) {
      return Math.max(0, E[binOf(signal)]);
    },
    /*
     * One experience: visited a flower advertising `signal`, received `reward`
     * (1 = paid, 0 = cheated). Rescorla-Wagner, smeared by the generalisation
     * kernel so learning about one signal transfers to nearby ones.
     */
    learn(signal, reward) {
      const b = binOf(signal);
      for (let i = 0; i < bins; i++) {
        const g = kernel[(i - b + bins) % bins];
        if (g > 1e-6) E[i] += rate * g * (reward - E[i]);
      }
    },
    /*
     * Time passing. Expectations relax back toward naive, which is what makes
     * the memory SHORT and is the one behaviour Whitehead & Peakall measured
     * directly. With forget = 0 the animal never forgets and aversion
     * accumulates without bound — that is the contrast arm, not the default.
     */
    decay(steps = 1) {
      if (forget <= 0) return;
      const keep = Math.pow(1 - forget, steps);
      for (let i = 0; i < bins; i++) E[i] = naive + (E[i] - naive) * keep;
    },
    /* For assertions and diagnostics — never used by the bout. */
    snapshot() {
      return Array.from(E);
    },
    meanExpectation() {
      let s = 0;
      for (let i = 0; i < bins; i++) s += E[i];
      return s / bins;
    },
  };
}

/*
 * Visitation weights under deception.
 *
 * The shape is deliberately the same as reward.js's `visitWeights` — abundance
 * scaled by how worth visiting the flower currently is — because runBout draws
 * on whatever weights it is handed, so learning needs no change to the bout's
 * transfer accounting at all. What changes is that the weight is no longer
 * constant across the bout.
 *
 * `advert` is the flower's investment in being noticed and is NOT the reward:
 * decoupling those two is the entire definition of a cheat.
 */
function deceptionWeights(species, learner) {
  return species.map((sp) => {
    const advert = sp.advert === undefined ? 1 : sp.advert;
    if (!(advert >= 0))
      throw new Error(`advert must be non-negative: ${advert}`);
    if (!Number.isFinite(sp.signal))
      throw new Error("every species needs a signal coordinate");
    return Math.max(0, sp.abundance * advert * learner.expect(sp.signal));
  });
}

/*
 * Did this visit pay? A species is either rewarding or it is not.
 *
 * `rewardP` allows the intermediate case that actually exists in the field —
 * rewarding species are not reliable, and Lichtenberg et al. 2020 make the
 * point that variable rewards are precisely what weakens the signal-reward
 * correlation a forager is trying to read. A deceptive species is rewardP = 0,
 * which is the limiting case rather than a separate code path.
 */
function paid(sp, u) {
  const p = sp.rewardP === undefined ? (sp.deceptive ? 0 : 1) : sp.rewardP;
  if (p < 0 || p > 1) throw new Error(`rewardP out of range: ${p}`);
  return u < p ? 1 : 0;
}

module.exports = { makeLearner, deceptionWeights, paid, BINS };
