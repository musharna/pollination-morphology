/*
 * deception-parity.js — re-scoring the one result that said a mechanism worked.
 *
 * ⚠️ THIS EXISTS BECAUSE THE IBM'S ANCHOR GATE ALREADY CAUGHT THIS CLASS OF
 * ERROR ONCE, IN MY OWN WORK, THREE DAYS AGO.
 *
 * The IBM's first diagnostic scored selection by pollen RECEIVED and read +0.149
 * — disruptive. Scored by realized parentage, the thing that actually decides
 * who is represented in the next generation, the same population reads −0.842.
 * The model was right; the statistic was wrong.
 *
 * `experiments/deception.js` part D is what licensed the claim that deception is
 * "the FIRST mechanism of six to push a rare placement past parity", and it is
 * quoted in the roadmap, the README and three documents. It scores a morph by
 *
 *     focal += r.T[i][j] + r.T[j][i]        // summed transfer, both sex roles
 *
 * Summing both roles avoids the female-only error. But summed transfer is still
 * not parentage, and the difference is not cosmetic:
 *
 *   TRANSFER is a raw sum. A plant that delivers a lot of pollen scores high.
 *   PARENTAGE is a normalised SHARE, drawn per mother. A plant's male success is
 *     sum over mothers of  P(mother) * T[focal][mother] / sum_i T[i][mother],
 *   so pollen delivered to mothers who are already saturated by everyone else
 *   counts for almost nothing.
 *
 * A rare morph can therefore have high summed transfer and near-zero parentage,
 * which is exactly the situation "rare placement" describes. So this re-runs
 * part D unchanged and scores it BOTH ways from the SAME bout — same sites, same
 * rng, same learner — so any divergence is the statistic and nothing else.
 *
 * If the two agree, the published claim stands and this file is a control that
 * cost an hour. If they disagree, a headline result in this project is an
 * artefact of its scoring statistic and has to be corrected everywhere it is
 * stated.
 */

const E = require("../sim/evolve.js");
const C = require("../sim/carryover.js");
const D = require("../sim/deception.js");
const P = require("../sim/placement.js");

const bee = P.DEFAULT_BEE;
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

/* Identical to experiments/deception.js so this is a re-score, not a re-design. */
const N = 24;
const VISITS = 20000;
const LEARN = { rate: 0.2, forget: 0.01, width: 0.06, naive: 1 };
const build = (g, seed) => C.siteSet(E.toFlower(g), bee, { n: 130, seed });
const viable = (s) => s.anther.length && s.stigma.length;

/*
 * One bout, scored two ways.
 *
 * PARENTAGE uses the IBM's own rule, because that is the rule that decides the
 * next generation: a mother is drawn in proportion to the pollen she received,
 * her mate in proportion to who delivered it to HER, and selfing is not mating
 * success. Both parents are counted, so this is not the female-only error.
 */
function scoreBoth(opts) {
  const { focalG, resG, nFocal, nOther, tag, focalSignal, resSignal, learn } =
    opts;
  const n = nFocal + nOther;
  const sites = [];
  for (let i = 0; i < nFocal; i++) sites.push(build(focalG, tag + i));
  for (let i = 0; i < nOther; i++) sites.push(build(resG, tag + 500 + i));
  if (!sites.every(viable)) return null;

  const signals = [];
  for (let i = 0; i < n; i++)
    signals.push(i < nFocal ? focalSignal : resSignal);

  const r = C.runBout(sites, new Array(n).fill(1 / n), {
    visits: VISITS,
    seed: 13,
    signals,
    rewardP: new Array(n).fill(0), // every plant a cheat, as in part D
    learner: learn ? D.makeLearner(learn) : null,
  });

  /* --- the published statistic --- */
  let transfer = 0;
  for (let i = 0; i < nFocal; i++)
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      transfer += r.T[i][j] + r.T[j][i];
    }

  /* --- realized parentage, the IBM's rule --- */
  const received = new Array(n).fill(0);
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) if (i !== j) received[j] += r.T[i][j];

  const rng = E.makeRng(tag * 31 + 7);
  const pick = (ws) => {
    const t = ws.reduce((a, b) => a + b, 0);
    if (!(t > 0)) return -1;
    let x = rng() * t;
    for (let i = 0; i < ws.length; i++) {
      x -= ws[i];
      if (x <= 0) return i;
    }
    return ws.length - 1;
  };
  const cnt = new Array(n).fill(0);
  const DRAWS = 40000;
  for (let k = 0; k < DRAWS; k++) {
    const mo = pick(received);
    if (mo < 0) continue;
    const sires = [];
    for (let i = 0; i < n; i++) sires.push(i === mo ? 0 : r.T[i][mo]);
    const fa = pick(sires);
    if (fa < 0) continue;
    cnt[mo]++;
    cnt[fa]++;
  }
  let parentage = 0;
  for (let i = 0; i < nFocal; i++) parentage += cnt[i];

  return { transfer: transfer / nFocal, parentage: parentage / nFocal };
}

/* rare/common under both statistics, from the same two bouts. */
function freqDependence(base) {
  const rare = scoreBoth({ ...base, nFocal: 4, nOther: N - 4, tag: base.tag });
  const common = scoreBoth({
    ...base,
    nFocal: N - 4,
    nOther: 4,
    tag: base.tag + 7,
  });
  if (!rare || !common || !(common.transfer > 0) || !(common.parentage > 0))
    return null;
  return {
    transfer: rare.transfer / common.transfer,
    parentage: rare.parentage / common.parentage,
  };
}

console.log("=".repeat(86));
console.log(
  "Was deception really past parity, or was that the scoring statistic? (roadmap B)",
);
console.log("=".repeat(86));

/*
 * POSITIVE CONTROL FIRST. If the two statistics never disagree — including where
 * they MUST agree — then a disagreement below would be unreadable, and if they
 * always disagree the comparison is measuring noise. So: two morphs that are
 * genuinely identical must score ~1 under BOTH, and the signal-only case (where
 * the published experiment's part A found a real gain and placement is held
 * constant by construction) must show a gain under BOTH.
 */
console.log("\nPART 0 — the two statistics must agree where they have to\n");
const rngC = E.makeRng(4242);
const gC = E.randomGenome(rngC);
const identical = freqDependence({
  focalG: gC,
  resG: gC,
  focalSignal: 0.5,
  resSignal: 0.5,
  tag: 31,
  learn: LEARN,
});
const signalOnly = freqDependence({
  focalG: gC,
  resG: gC, // SAME genome — placement identical, only the advertisement differs
  focalSignal: 0.8,
  resSignal: 0.5,
  tag: 31,
  learn: LEARN,
});
console.log("   case                                    transfer   parentage");
console.log(
  `   identical morphs (must be ~1 both)      ${identical.transfer.toFixed(3).padStart(8)}   ${identical.parentage.toFixed(3).padStart(9)}`,
);
console.log(
  `   SAME placement, rarer signal            ${signalOnly.transfer.toFixed(3).padStart(8)}   ${signalOnly.parentage.toFixed(3).padStart(9)}`,
);
const agreeNull =
  Math.abs(identical.transfer - 1) < 0.15 &&
  Math.abs(identical.parentage - 1) < 0.15;
const agreeSignal = signalOnly.transfer > 1.2 && signalOnly.parentage > 1.2;
console.log(
  `\n   identical morphs score ~1 under both        ${agreeNull ? "ok" : "FAIL"}` +
    `\n   a rarer ADVERTISEMENT gains under both      ${agreeSignal ? "ok" : "FAIL"}`,
);
if (!agreeNull || !agreeSignal) {
  console.log(
    "\n   The two statistics disagree where they must agree, so any disagreement",
  );
  console.log("   below would be uninterpretable. Refusing to re-score.");
  process.exit(1);
}
console.log(
  "\n   Both statistics behave identically when placement is held constant. Any\n" +
    "   divergence below is therefore about PLACEMENT rarity specifically.",
);

// ------------------------------------------------------------------ part D
console.log("\nPART D (re-scored) — a rare morph that differs in PLACEMENT\n");
console.log(
  "  Baseline for this barrier under one pollinator: 0.26. Past parity = above 1.\n",
);
console.log(
  "   morph   transfer (published stat)   parentage (IBM's rule)   ratio",
);

const rng = E.makeRng(99);
const resG = E.randomGenome(rng);
const rows = [];
for (let k = 0; k < 12 && rows.length < 8; k++) {
  const focalG = E.mutate(resG, rng, 0.4 + 1.2 * (k / 12));
  const v = freqDependence({
    focalG,
    resG,
    focalSignal: 0.8,
    resSignal: 0.5,
    tag: 101 + k * 13,
    learn: LEARN,
  });
  if (!v) continue;
  rows.push(v);
  console.log(
    `   ${String(rows.length).padStart(5)}   ${v.transfer.toFixed(3).padStart(24)}   ${v.parentage
      .toFixed(3)
      .padStart(21)}   ${(v.parentage / v.transfer).toFixed(3)}`,
  );
}

const pastT = rows.filter((r) => r.transfer > 1).length;
const pastP = rows.filter((r) => r.parentage > 1).length;
console.log(
  `\n  past parity by summed TRANSFER  : ${pastT} of ${rows.length}   (mean ${mean(rows.map((r) => r.transfer)).toFixed(3)})`,
);
console.log(
  `  past parity by realized PARENTAGE: ${pastP} of ${rows.length}   (mean ${mean(rows.map((r) => r.parentage)).toFixed(3)})`,
);

console.log("\n" + "=".repeat(86));
if (pastT > 0 && pastP === 0) {
  console.log(
    "  ⚠️ THE PUBLISHED CLAIM DOES NOT SURVIVE RE-SCORING.\n" +
      "\n" +
      "  Deception pushes a rare placement past parity in summed TRANSFER and not in\n" +
      "  realized PARENTAGE, from the identical bout. Part 0 shows the two statistics\n" +
      "  agree when only the advertisement is rare, so this is specific to placement\n" +
      "  rarity: the extra pollen a rare cheat moves goes to mothers who are already\n" +
      "  saturated by the common morph, and a raw sum counts that while a normalised\n" +
      "  share does not.\n" +
      "\n" +
      "  'The first of six mechanisms past parity' has to be corrected wherever it is\n" +
      "  stated — and it explains the IBM cleanly: deception never had the effect the\n" +
      "  proxy credited it with, so a model with real inheritance was never going to\n" +
      "  reproduce it.",
  );
} else if (pastP > 0) {
  console.log(
    `  The claim SURVIVES: ${pastP} of ${rows.length} morphs are past parity by parentage too.\n` +
      "  Deception really does relieve the rare-placement penalty in a single bout, and\n" +
      "  the IBM's failure to split is therefore about what happens ACROSS generations\n" +
      "  rather than about the original measurement being wrong.",
  );
} else {
  console.log(
    "  Neither statistic puts a rare placement past parity here — which would itself\n" +
      "  fail to reproduce the published run and needs chasing before anything else.",
  );
}
console.log("=".repeat(86));
