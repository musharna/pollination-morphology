/*
 * Reward currency and pollen dispensing.
 *
 * Roadmap item C, second mechanism class. Three questions, each with a
 * published answer to be checked against rather than a number to be admired:
 *
 *   A. THE MALE GAIN CURVE. Harder & Thomson 1989 (10.1086/284922, Am Nat)
 *      measured bumble bees depositing 0.6% of REMOVED pollen onto subsequent
 *      stigmas, and found "the proportion deposited declined as the amount
 *      removed increased". Does a counted bout reproduce that shape, and at
 *      what level?
 *
 *   B. THE TWO-SIDED PREDICTION. Castellanos et al. 2006 (10.1086/498854):
 *      simultaneous presentation should win with INFREQUENT or EFFICIENT
 *      pollinators, gradual dosing with FREQUENT and WASTEFUL ones. A model
 *      that answers "dispense gradually" in every regime has reproduced
 *      nothing. This is the experiment that can fail.
 *
 *   C. THE POLLEN DILEMMA. Pollen is reward and gamete at once, so the
 *      dispensing schedule IS the advertisement: dispense meanly and fewer
 *      animals come. Nectar breaks that coupling. Does the optimal schedule
 *      differ between currencies, and by how much?
 */

const P = require("../sim/placement.js");
const C = require("../sim/carryover.js");
const R = require("../sim/reward.js");

const bee = P.DEFAULT_BEE;
const POOL = 60;
const rule = (s) => console.log("\n" + s + "\n" + "-".repeat(s.length));

/* Two well-separated species, so what is measured is dispensing rather than
 * mixing. Separation was the subject of every earlier experiment; here it is
 * deliberately held constant and out of the way. */
function twoSpecies() {
  const a = { ...P.DEFAULT_FLOWER, antherT: 0.5, stigmaT: 0.5, antherTheta: 0 };
  const b = {
    ...P.DEFAULT_FLOWER,
    antherT: 0.5,
    stigmaT: 0.5,
    antherTheta: Math.PI,
  };
  return [a, b].map((f, i) => C.siteSet(f, bee, { n: 200, seed: 11 + i }));
}
const SITES = twoSpecies();
const AB = [0.5, 0.5];
const SEEDS = [3, 11, 29, 47, 61];

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

/* Delivered conspecific grains per grain the plant COMMITTED — released or not.
 * Committed is the right denominator for part B: a gradual disperser that dies
 * with pollen still in the anther has wasted it, and a per-RELEASED rate would
 * hide exactly that. */
function maleFitness(opts) {
  return mean(
    SEEDS.map((seed) => {
      const r = C.runBout(SITES, AB, {
        visits: 12000,
        seed,
        pollenPerFlower: POOL,
        ...opts,
      });
      let del = 0,
        committed = 0;
      for (let i = 0; i < SITES.length; i++) {
        del += r.T[i][i];
        committed += r.flowersUsed[i] * POOL;
      }
      return committed > 0 ? del / committed : 0;
    }),
  );
}

// ==========================================================================
// A — the male gain curve
// ==========================================================================
function partA() {
  rule(
    "A — does the delivered share fall as the dose rises? (Harder & Thomson 1989)",
  );
  const rates = [0.05, 0.1, 0.25, 0.5, 1.0];
  console.log(
    "  dose/visit   delivered per grain RELEASED     (pool 60, pickup 5)",
  );
  const got = [];
  for (const presentRate of rates) {
    const v = mean(
      SEEDS.map((seed) =>
        R.deliveryRate(
          C.runBout(SITES, AB, {
            visits: 12000,
            seed,
            pollenPerFlower: POOL,
            presentRate,
            harvest: 0.35,
          }),
        ),
      ),
    );
    got.push(v);
    console.log(
      `  ${String(Math.max(1, Math.round(presentRate * POOL))).padStart(10)}   ${(100 * v).toFixed(3).padStart(10)}%`,
    );
  }
  console.log(
    `\n  Falls ${(got[0] / got[got.length - 1]).toFixed(2)}x from the smallest dose to the largest.\n` +
      `  The curve is FLAT then DECLINING: while the dose is under what a stigma can\n` +
      `  accept, capacity does not bind and delivery per grain cannot improve.`,
  );

  rule("A2 — which mechanism bends it? (measured, not assumed)");
  const variants = [
    ["full model", { harvest: 0.35 }],
    ["no groom, no harvest", { harvest: 0, groom: 0 }],
    ["UNBOUNDED stigma pickup", { harvest: 0.35, pickup: 1e9 }],
    ["unbounded carry cap", { harvest: 0.35, cap: 1e9 }],
  ];
  console.log(
    "  variant                      small dose    large dose     ratio",
  );
  for (const [label, o] of variants) {
    const lo = mean(
      SEEDS.map((seed) =>
        R.deliveryRate(
          C.runBout(SITES, AB, {
            visits: 12000,
            seed,
            pollenPerFlower: POOL,
            presentRate: 0.05,
            ...o,
          }),
        ),
      ),
    );
    const hi = mean(
      SEEDS.map((seed) =>
        R.deliveryRate(
          C.runBout(SITES, AB, {
            visits: 12000,
            seed,
            pollenPerFlower: POOL,
            presentRate: 1.0,
            ...o,
          }),
        ),
      ),
    );
    console.log(
      `  ${label.padEnd(28)} ${(100 * lo).toFixed(3).padStart(8)}%   ${(100 * hi).toFixed(3).padStart(8)}%   ${(lo / hi).toFixed(2).padStart(6)}x`,
    );
  }
  console.log(
    "\n  A ratio near 1.00 means that variant has NO gain curve. The one that\n" +
      "  flattens it is the mechanism.",
  );
}

// ==========================================================================
// B — the two-sided prediction. THIS is the one that can fail.
// ==========================================================================
function partB() {
  rule(
    "B — gradual vs simultaneous across pollinator regimes (Castellanos et al. 2006)",
  );
  console.log(
    "  Prediction: gradual wins with FREQUENT + WASTEFUL pollinators;\n" +
      "  simultaneous wins with INFREQUENT or EFFICIENT ones. Both halves must\n" +
      "  appear or the model has not reproduced the theory.\n",
  );

  const regimes = [
    ["frequent + wasteful", { visitsPerFlower: 25, groom: 0.3, harvest: 0.35 }],
    [
      "frequent + efficient",
      { visitsPerFlower: 25, pickup: 60, groom: 0.03, harvest: 0.03 },
    ],
    [
      "infrequent + wasteful",
      { visitsPerFlower: 2, groom: 0.3, harvest: 0.35 },
    ],
    [
      "infrequent + efficient",
      { visitsPerFlower: 2, pickup: 60, groom: 0.03, harvest: 0.03 },
    ],
  ];
  const strategies = [
    ["gradual (dose 3)", 0.05],
    ["simultaneous (dose 60)", 1.0],
  ];

  console.log(
    "  regime                    " +
      strategies.map(([n]) => n.padStart(22)).join("") +
      "     winner",
  );
  for (const [label, o] of regimes) {
    const vals = strategies.map(([, presentRate]) =>
      maleFitness({ ...o, presentRate }),
    );
    const win = vals[0] > vals[1] ? "GRADUAL" : "SIMULTANEOUS";
    console.log(
      `  ${label.padEnd(24)}  ` +
        vals.map((v) => `${(100 * v).toFixed(3)}%`.padStart(22)).join("") +
        `     ${win}`,
    );
  }
  console.log(
    "\n  Read as: delivered conspecific grains per grain the plant COMMITTED,\n" +
      "  so pollen a short-lived flower never got to release counts as wasted.",
  );
}

// ==========================================================================
// B2 — the cell that does NOT reproduce, and three explanations that failed
// ==========================================================================
/*
 * Three of the four cells match. "Frequent + EFFICIENT" does not: the theory
 * says simultaneous, this model says gradual. Rather than accept the three
 * matches and move on, here is the elimination — because a partial
 * reproduction whose failure is unexplained is indistinguishable from a bug.
 */
function partB2() {
  rule("B2 — the frequent+efficient cell, and three refuted explanations");
  const EFF = { visitsPerFlower: 25, pickup: 60, groom: 0.03, harvest: 0.03 };
  /* A winner is only declared when the margin clears seed noise. Without this
   * the large-radius rows below flip label between runs on a 0.1pp difference,
   * which would read as a reversal when it is a tie. */
  const duel = (o) => {
    const g = maleFitness({ ...o, presentRate: 0.05 });
    const s = maleFitness({ ...o, presentRate: 1.0 });
    const margin = Math.abs(g - s) / Math.max(g, s);
    const win =
      margin < 0.02 ? "TIE (within noise)" : g > s ? "GRADUAL" : "SIMULTANEOUS";
    return { g, s, win };
  };

  console.log(
    "  (1) is 'efficient' the wrong knob? grooming vs stigma capacity",
  );
  for (const [label, o] of [
    ["efficient = low grooming", { ...EFF, pickup: 5 }],
    ["efficient = high stigma capacity", EFF],
  ]) {
    const d = duel(o);
    console.log(
      `      ${label.padEnd(34)} ${(100 * d.g).toFixed(3).padStart(7)}% vs ${(100 * d.s).toFixed(3).padStart(7)}%   ${d.win}`,
    );
  }

  console.log(
    "\n  (2) do deterministic flower lifetimes remove gradual's risk?",
  );
  for (const [label, o] of [
    ["lifetime exactly 25", { ...EFF, visitJitter: false }],
    ["lifetime geometric, mean 25", { ...EFF, visitJitter: true }],
  ]) {
    const d = duel(o);
    console.log(
      `      ${label.padEnd(34)} ${(100 * d.g).toFixed(3).padStart(7)}% vs ${(100 * d.s).toFixed(3).padStart(7)}%   ${d.win}`,
    );
  }

  console.log(
    "\n  (3) does the per-visit contact ceiling forbid a big single export?",
  );
  for (const radius of [1.15, 4, 8, 20, 1e6]) {
    const d = duel({ ...EFF, radius });
    console.log(
      `      radius ${String(radius).padEnd(27)} ${(100 * d.g).toFixed(3).padStart(7)}% vs ${(100 * d.s).toFixed(3).padStart(7)}%   ${d.win}`,
    );
  }

  console.log(
    "\n  All three fail to flip it. Relaxing the contact ceiling makes the two\n" +
      "  strategies CONVERGE to a tie rather than reverse, which is the tell: in\n" +
      "  this model gradual dispensing has NO COST except stranding. There is no\n" +
      "  penalty for staying open longer and no pollen senescence in the anther,\n" +
      "  so once visits are plentiful gradual can tie but never lose. That missing\n" +
      "  cost, not the pollinator's efficiency, is what the fourth cell needs.",
  );
}

// ==========================================================================
// C — the pollen dilemma
// ==========================================================================
/*
 * With pollen as the reward the dispensing schedule is also the advertisement,
 * so dispensing meanly costs visits. The channel is visits per flower: a flower
 * offering a tenth of the dose attracts proportionally fewer animals. With
 * nectar the advertisement is a separate budget and the schedule is free.
 */
function partC() {
  rule("C — the pollen dilemma: does the currency change the best schedule?");
  const BASE_VISITS = 25;
  const rates = [0.05, 0.1, 0.2, 0.35, 0.5, 0.75, 1.0];

  console.log(
    "  dose/visit   POLLEN reward     NECTAR reward   (male fitness per grain committed)",
  );
  const pol = [],
    nec = [];
  for (const presentRate of rates) {
    /* Pollen: attraction scales with the dose on offer, so visits scale too. */
    const vP = Math.max(1, Math.round(BASE_VISITS * presentRate));
    const p = maleFitness({
      presentRate,
      visitsPerFlower: vP,
      groom: 0.3,
      harvest: 0.35,
    });
    /* Nectar: the same animals come regardless of the pollen schedule, and they
     * are not packing pollen away, so harvest is zero. */
    const n = maleFitness({
      presentRate,
      visitsPerFlower: BASE_VISITS,
      groom: 0.3,
      harvest: 0,
    });
    pol.push(p);
    nec.push(n);
    console.log(
      `  ${String(Math.max(1, Math.round(presentRate * POOL))).padStart(10)}   ` +
        `${(100 * p).toFixed(3)}%`.padStart(13) +
        `   ${(100 * n).toFixed(3)}%`.padStart(17),
    );
  }
  const best = (xs) => rates[xs.indexOf(Math.max(...xs))];
  console.log(
    `\n  best schedule under POLLEN : dose ${Math.round(best(pol) * POOL)} (rate ${best(pol)})` +
      `\n  best schedule under NECTAR : dose ${Math.round(best(nec) * POOL)} (rate ${best(nec)})`,
  );
  console.log(
    "\n  If nectar's optimum sits at a MORE gradual schedule than pollen's, the\n" +
      "  dilemma is real in this model: a pollen-rewarding flower is pushed to\n" +
      "  over-dispense because dispensing IS how it advertises.",
  );
}

partA();
partB();
partB2();
partC();
console.log();
