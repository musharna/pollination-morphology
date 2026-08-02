/*
 * The cost of prolonged presentation — and whether it is really what the
 * missing Castellanos cell needs.
 *
 * WHERE THIS COMES FROM. The reward experiment reproduced Castellanos et al.
 * 2006 (10.1086/498854) in three cells of four. "Frequent + EFFICIENT" says
 * simultaneous presentation should win; this model says gradual. Three
 * explanations were refuted there, and the conclusion recorded was: gradual
 * dispensing bears no cost in this model except stranding, so once visits are
 * plentiful it can tie but never lose. A cost of staying open was named as the
 * concrete missing mechanism.
 *
 * THAT DIAGNOSIS MAKES AN ARITHMETIC PREDICTION, AND IT IS NOT A FLATTERING
 * ONE. Gradual beats simultaneous by 1.68x in frequent+wasteful and by 1.79x in
 * frequent+efficient. The margin is LARGER in the cell that is supposed to
 * reverse. So any cost that acts the same way in both regimes must flip the
 * wasteful cell — which the theory says should stay gradual — at a WEAKER
 * setting than the efficient one. Fixing the broken cell would break a working
 * one. That is derived before any measurement below, and part D0 checks it.
 *
 * So three hypotheses for the failing cell, not one:
 *
 *   H1  a missing cost: pollen SENESCES in the anther, so gradual ships
 *       progressively deader gametes (Dafni & Firmage 2000, 10.1007/bf00984098)
 *   H2  a missing cost: a flower open longer costs more UPKEEP, floral
 *       longevity being itself an optimised trait (Ashman & Schoen 1994,
 *       10.1038/371788a0)
 *   H3  not a missing cost at all — an ARTEFACT of this model. Under the
 *       efficient regime grooming is nearly off, so a simultaneous presenter's
 *       60-grain dose accumulates on the animal and is truncated by the carry
 *       cap, which discards the OLDEST grains. B2 relaxed the contact radius
 *       but never the cap, and never under this regime.
 *
 * H1 and H2 are cited biology and are worth having regardless of what they fix.
 * H3 is the uncomfortable one, so it gets tested too.
 */

const P = require("../sim/placement.js");
const C = require("../sim/carryover.js");
const R = require("../sim/reward.js");

const bee = P.DEFAULT_BEE;
const POOL = 60;
const rule = (s) => console.log("\n" + s + "\n" + "-".repeat(s.length));

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

/* Male fitness as part B defined it — delivered conspecific grains per grain
 * COMMITTED — now optionally net of upkeep. Same denominator throughout, so
 * every number here is comparable with the reward experiment's table. */
function fitness(opts = {}, maintenance = 0) {
  return mean(
    SEEDS.map((seed) => {
      const r = C.runBout(SITES, AB, {
        visits: 12000,
        seed,
        pollenPerFlower: POOL,
        ...opts,
      });
      /* POOLED across species — summed deliveries over summed commitments, not
       * the mean of per-species rates. It has to be pooled to be the same
       * statistic the reward experiment's table reports; summing per-species
       * rates instead returns exactly twice it for two symmetric species, which
       * leaves every winner unchanged and every printed percentage wrong. */
      let del = 0,
        committed = 0;
      for (let i = 0; i < SITES.length; i++) {
        del += r.T[i][i] - maintenance * r.visitsTo[i];
        committed += r.flowersUsed[i] * POOL;
      }
      return committed > 0 ? del / committed : 0;
    }),
  );
}

/* The regimes exactly as the reward experiment defined them, so this is a
 * continuation of that table rather than a new one. */
const REGIMES = [
  ["frequent + wasteful", { visitsPerFlower: 25, groom: 0.3, harvest: 0.35 }],
  [
    "frequent + efficient",
    { visitsPerFlower: 25, pickup: 60, groom: 0.03, harvest: 0.03 },
  ],
  ["infrequent + wasteful", { visitsPerFlower: 2, groom: 0.3, harvest: 0.35 }],
  [
    "infrequent + efficient",
    { visitsPerFlower: 2, pickup: 60, groom: 0.03, harvest: 0.03 },
  ],
];
const PREDICTED = ["GRADUAL", "SIMULTANEOUS", "SIMULTANEOUS", "SIMULTANEOUS"];

const duel = (o, maintenance = 0) => {
  const g = fitness({ ...o, presentRate: 0.05 }, maintenance);
  const s = fitness({ ...o, presentRate: 1.0 }, maintenance);
  const margin = Math.abs(g - s) / Math.max(Math.abs(g), Math.abs(s));
  return {
    g,
    s,
    win: margin < 0.02 ? "TIE" : g > s ? "GRADUAL" : "SIMULTANEOUS",
  };
};

function scoreboard(label, o, maintenance = 0) {
  let right = 0;
  const cells = REGIMES.map(([name, reg], k) => {
    const d = duel({ ...reg, ...o }, maintenance);
    const ok = d.win === PREDICTED[k];
    if (ok) right++;
    return { name, ...d, ok };
  });
  console.log(
    `  ${label.padEnd(22)} ` +
      cells
        .map((c) => `${c.ok ? "OK " : "XX "}${c.win.slice(0, 4).padEnd(4)}`)
        .join(" ") +
      `   ${right}/4`,
  );
  return { cells, right };
}

// ==========================================================================
// D0 — the prediction, before any cost is applied
// ==========================================================================
function partD0() {
  rule("D0 — what a regime-INDEPENDENT cost must do, derived before measuring");
  console.log(
    "  If a cost simply scales a gradual disperser's fitness by some factor m,\n" +
      "  each cell flips when m drops below simultaneous/gradual for that cell.\n" +
      "  The cell that flips FIRST is the one with the SMALLEST margin.\n",
  );
  console.log("  regime                    gradual  simultaneous   flips at m");
  const thresholds = [];
  for (const [name, reg] of REGIMES.slice(0, 2)) {
    const d = duel(reg);
    const m = d.s / d.g;
    thresholds.push({ name, m });
    console.log(
      `  ${name.padEnd(24)} ${(100 * d.g).toFixed(3).padStart(7)}% ${(100 * d.s).toFixed(3).padStart(12)}%   ${m.toFixed(3).padStart(10)}`,
    );
  }
  const [waste, eff] = thresholds;
  console.log(
    `\n  wasteful flips at m = ${waste.m.toFixed(3)}, efficient at m = ${eff.m.toFixed(3)}.` +
      (waste.m > eff.m
        ? "\n  WASTEFUL FLIPS FIRST — so a uniform cost strong enough to repair the\n" +
          "  efficient cell has already broken the wasteful one. PREDICTION: neither\n" +
          "  cost below reaches 4/4."
        : "\n  Efficient flips first, so a uniform cost COULD repair the table.") +
      "\n  This is arithmetic on the current model, not a result about biology.",
  );
}

// ==========================================================================
// D1 / D2 — the two costs, swept across the whole 2x2
// ==========================================================================
function partD1() {
  rule("D1 — pollen senescence in the anther (Dafni & Firmage 2000)");
  console.log(
    "  Viability decays with time held in the anther, so a gradual disperser\n" +
      "  ships progressively deader gametes and a simultaneous one ships none.\n" +
      "  Columns are the four regimes in the order above; OK = matches theory.\n",
  );
  console.log(
    "  pollenLife             freq+wast freq+eff  infr+wast infr+eff    score",
  );
  scoreboard("none (Infinity)", {});
  for (const pollenLife of [400, 200, 100, 60, 40, 25, 15]) {
    scoreboard(`life ${pollenLife} ticks`, { pollenLife });
  }
}

function partD2() {
  rule("D2 — upkeep while the flower stays open (Ashman & Schoen 1994)");
  console.log(
    "  Charged per visit-open in grain equivalents, so a flower needing twenty\n" +
      "  visits to shed its pool pays twenty times the upkeep of one that sheds\n" +
      "  in a single visit.\n",
  );
  console.log(
    "  maintenance            freq+wast freq+eff  infr+wast infr+eff    score",
  );
  for (const m of [0, 0.02, 0.05, 0.1, 0.2, 0.4]) {
    scoreboard(`m = ${m}`, {}, m);
  }
}

// ==========================================================================
// D3 — the hypothesis that this is MY artefact, not missing biology
// ==========================================================================
/*
 * Under the efficient regime grooming is 0.03 and harvest 0.03, so almost
 * nothing leaves the animal except by delivery. A simultaneous presenter hands
 * over 60 grains at every visit while a stigma accepts at most `pickup`, so the
 * load climbs until the carry cap truncates it — and the cap discards the
 * OLDEST grains, which are precisely the ones that have not yet found a stigma.
 * A gradual presenter, supplying 3 grains a visit, never reaches the cap. If
 * that is what decides the cell, the missing ingredient is not a cost at all.
 */
function partD3() {
  rule("D3 — does the CARRY CAP decide the failing cell? (an artefact check)");
  const EFF = { visitsPerFlower: 25, pickup: 60, groom: 0.03, harvest: 0.03 };
  const WASTE = { visitsPerFlower: 25, groom: 0.3, harvest: 0.35 };

  console.log("  How full does the animal actually get in each regime?\n");
  console.log("  regime / schedule           final load   cap    truncated");
  for (const [label, reg] of [
    ["efficient", EFF],
    ["wasteful", WASTE],
  ])
    for (const [sched, presentRate] of [
      ["gradual", 0.05],
      ["simultaneous", 1.0],
    ]) {
      const r = C.runBout(SITES, AB, {
        visits: 12000,
        seed: 3,
        pollenPerFlower: POOL,
        ...reg,
        presentRate,
      });
      console.log(
        `  ${(label + " / " + sched).padEnd(28)} ${String(r.retained).padStart(9)}   ${String(C.DEFAULTS.cap).padStart(3)}   ${String(r.capTruncated).padStart(9)}`,
      );
    }

  console.log("\n  And the duel with the cap removed:\n");
  console.log(
    "  regime                 cap         gradual  simultaneous  winner",
  );
  for (const [label, reg] of [
    ["frequent + efficient", EFF],
    ["frequent + wasteful", WASTE],
  ])
    for (const cap of [140, 1e9]) {
      const d = duel({ ...reg, cap });
      console.log(
        `  ${label.padEnd(22)} ${(cap > 1e8 ? "unlimited" : String(cap)).padEnd(11)} ${(100 * d.g).toFixed(3).padStart(7)}% ${(100 * d.s).toFixed(3).padStart(12)}%  ${d.win}`,
      );
    }
  console.log(
    "\n  If removing the cap flips frequent+efficient while leaving\n" +
      "  frequent+wasteful alone, the fourth cell was never about a missing cost.",
  );
}

// ==========================================================================
// D4 — the two together
// ==========================================================================
/*
 * D3 does not, on its own, finish the job: with the cap unbound the efficient
 * cell becomes a TIE, not a simultaneous win. But it changes the arithmetic of
 * D0 completely. The efficient margin was 0.559 with the cap binding; without
 * it, gradual no longer leads there at all, so an arbitrarily SMALL cost tips
 * that cell — while the wasteful cell still needs a cost of 0.593 to move.
 *
 * The two hypotheses were never rivals. The artefact was MASKING the cost: no
 * amount of senescence could repair the table while the cap was suppressing
 * simultaneous by nearly half in exactly one cell. This is the run that decides
 * whether the pair does what neither does alone.
 */
function partD4() {
  rule("D4 — the cost and the artefact fix TOGETHER");
  console.log(
    "  Neither reached 4/4 alone. With the cap no longer binding, the efficient\n" +
      "  cell is a tie, so it now takes only a light cost to tip — while the\n" +
      "  wasteful cell still needs a heavy one to break. That separation is what\n" +
      "  a repair requires, and it did not exist before D3.\n",
  );
  const UNCAP = { cap: 1e9 };
  console.log(
    "  senescence, uncapped   freq+wast freq+eff  infr+wast infr+eff    score",
  );
  scoreboard("none (Infinity)", UNCAP);
  for (const pollenLife of [400, 200, 100, 60, 40, 25]) {
    scoreboard(`life ${pollenLife} ticks`, { ...UNCAP, pollenLife });
  }
  console.log(
    "\n  upkeep, uncapped       freq+wast freq+eff  infr+wast infr+eff    score",
  );
  for (const m of [0.01, 0.02, 0.05, 0.1, 0.2]) {
    scoreboard(`m = ${m}`, UNCAP, m);
  }
  console.log(
    "\n  A 4/4 row here means all four of Castellanos' regimes come out right at\n" +
      "  once, which no single change above achieved.",
  );
}

partD0();
partD1();
partD2();
partD3();
partD4();
console.log();
