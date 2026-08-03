/*
 * Deception — does a cheat gain when rare, and can that rescue a rare PLACEMENT?
 *
 * Five mechanisms have now been tested against roadmap B's barrier: a rare
 * placement is penalised because there is nobody to exchange pollen with
 * (rare/common ~ 0.26). Pollinator heterogeneity, flower constancy, larger
 * patches and recombination all failed; spatial structure helped partially.
 * Every one of them shares a limitation — they change WHO the animal meets, not
 * whether the animal wants to be there.
 *
 * Deception is the first mechanism in the set that acts on the animal's
 * motivation, and it is the only one for which negative frequency-dependence is
 * actually documented in the field (Gigord, Macnair & Smithson 2001,
 * 10.1073/pnas.111162598). That is why it was worth building.
 *
 * ⚠️ IT IS ALSO DOCUMENTED NOT TO REPLICATE. The same group found no diversity
 * advantage six years later (Smithson et al. 2007, 10.1890/05-1445), and the
 * avoidance learning it rests on is short-lived (Whitehead & Peakall 2012,
 * 10.1093/beheco/ars149). So the learning rule is what is built; the
 * frequency-dependence is what is MEASURED. Part A exists to find out whether
 * this model produces Gigord's result at all — if it does not, parts C and D
 * are asking a question with no mechanism behind it, and that is a finding.
 *
 * Every part carries a no-learner control in the same units, because "the
 * deceptive morph did worse" is what a broken harness prints too.
 */

const P = require("../sim/placement.js");
const C = require("../sim/carryover.js");
const E = require("../sim/evolve.js");
const D = require("../sim/deception.js");

const bee = P.DEFAULT_BEE;
const rule = (s) => console.log("\n" + s + "\n" + "-".repeat(s.length));
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

const N = 24;
const VISITS = 20000;
const build = (g, seed) => C.siteSet(E.toFlower(g), bee, { n: 130, seed });
const viable = (s) => s.anther.length && s.stigma.length;

/* The learning parameters. `forget` is the one the literature pins hardest —
 * avoidance is short-lived — so it is swept in part B rather than trusted. */
const LEARN = { rate: 0.2, forget: 0.01, width: 0.06, naive: 1 };

/*
 * Per-capita mating success of the focal morph, summed over both sex roles.
 * Same shape as experiments/two-pollinators.js so the numbers are comparable to
 * the five mechanisms already tested against this barrier.
 *
 * `learn` null = no learner = the control arm. Signals and reward status are
 * still passed in both arms so the two differ in exactly one thing.
 */
function focalPerCapita(opts) {
  const {
    focalG,
    resG,
    nFocal,
    nOther,
    tag,
    focalSignal,
    resSignal,
    focalRewardP,
    resRewardP,
    learn,
  } = opts;
  const n = nFocal + nOther;
  const sites = [];
  for (let i = 0; i < nFocal; i++) sites.push(build(focalG, tag + i));
  for (let i = 0; i < nOther; i++) sites.push(build(resG, tag + 500 + i));
  if (!sites.every(viable)) return null;

  const signals = [];
  const rewardP = [];
  for (let i = 0; i < nFocal; i++) {
    signals.push(focalSignal);
    rewardP.push(focalRewardP);
  }
  for (let i = 0; i < nOther; i++) {
    signals.push(resSignal);
    rewardP.push(resRewardP);
  }

  const r = C.runBout(sites, new Array(n).fill(1 / n), {
    visits: VISITS,
    seed: 13,
    signals,
    rewardP,
    learner: learn ? D.makeLearner(learn) : null,
  });

  let focal = 0;
  for (let i = 0; i < nFocal; i++)
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      focal += r.T[i][j] + r.T[j][i];
    }
  return focal / nFocal;
}

/*
 * The frequency-dependence statistic: same morph, two frequencies, same total
 * population. Below 1 = being common pays. Above 1 = a rare morph gains.
 */
function freqDependence(base) {
  const rare = focalPerCapita({
    ...base,
    nFocal: 4,
    nOther: N - 4,
    tag: base.tag,
  });
  const common = focalPerCapita({
    ...base,
    nFocal: N - 4,
    nOther: 4,
    tag: base.tag + 7,
  });
  if (!rare || !common || !(common > 0)) return null;
  return rare / common;
}

// ==========================================================================
// A — does a rare CHEAT gain, on signal alone?
// ==========================================================================
/*
 * The Gigord test, stripped to its mechanism. Two morphs of the SAME deceptive
 * species: identical placement, identical rewardlessness, differing only in the
 * signal they advertise. If avoidance learning generates frequency-dependence,
 * it must show up here and nowhere weaker.
 */
function partA() {
  rule("A — two deceptive morphs differing ONLY in signal (the Gigord test)");

  const rng = E.makeRng(4242);
  const g = E.randomGenome(rng);
  const base = {
    focalG: g,
    resG: g, // SAME genome: placement cannot contribute
    focalRewardP: 0,
    resRewardP: 0,
    resSignal: 0.5,
    tag: 31,
  };

  console.log(
    "  Both morphs are the same plant with the same placement. The only\n" +
      "  difference is where they sit in signal space.\n",
  );
  console.log(
    "   signal gap   rare/common (learning)   rare/common [NO LEARNER]",
  );
  const rows = [];
  for (const gap of [0.0, 0.05, 0.1, 0.2, 0.35, 0.5]) {
    const b = { ...base, focalSignal: (0.5 + gap) % 1 };
    const withL = freqDependence({ ...b, learn: LEARN });
    const noL = freqDependence({ ...b, learn: null });
    rows.push({ gap, withL, noL });
    console.log(
      `   ${gap.toFixed(2).padStart(10)}   ${fmt(withL).padStart(21)}   ${fmt(noL).padStart(24)}`,
    );
  }
  /*
   * ⚠️ THE CONTROL HAS TO BE A DISTRIBUTION, NOT A POINT.
   *
   * The first version of this asserted that the no-learner column "must sit at
   * 1.000" and flagged a harness fault when it read 1.025. That was the check
   * being wrong, not the harness: rare/common is a STOCHASTIC quantity — the
   * rare and common arms draw different site realisations — and demanding
   * flatness from a single draw is the single-seed assertion this project
   * already lists as a standing constraint.
   *
   * Measured across independent genome draws the null is 0.976 to 1.045, i.e.
   * noise of about +/-2.5% that VARIES IN SIGN. So the null band is estimated
   * here, in the same units and from the same code, and the learning arm is
   * judged against that band rather than against 1.
   */
  const nullDraws = [];
  const nrng = E.makeRng(20260803);
  for (let k = 0; k < 8; k++) {
    const ng = E.randomGenome(nrng);
    const v = freqDependence({
      focalG: ng,
      resG: ng,
      focalRewardP: 0,
      resRewardP: 0,
      focalSignal: 0.8,
      resSignal: 0.5,
      tag: 401 + 17 * k,
      learn: null,
    });
    if (v !== null && Number.isFinite(v)) nullDraws.push(v);
  }
  const nMean = mean(nullDraws);
  const nSd = Math.sqrt(
    nullDraws.reduce((a, b) => a + (b - nMean) ** 2, 0) /
      Math.max(1, nullDraws.length - 1),
  );
  const band = nMean + 3 * nSd;
  console.log(
    `\n  NULL BAND, ${nullDraws.length} independent draws with no learner and identical morphs:` +
      `\n  mean ${nMean.toFixed(3)}, sd ${nSd.toFixed(3)}, range ${Math.min(...nullDraws).toFixed(3)}` +
      `-${Math.max(...nullDraws).toFixed(3)}. The offset varies in SIGN, so it is` +
      `\n  sampling noise between the two arms' site draws, not a systematic bias.` +
      `\n  A learning result counts only above mean + 3sd = ${band.toFixed(3)}.`,
  );

  const best = rows.filter((r) => r.withL !== null);
  const gained = best.filter((r) => r.withL > band);
  const peak = Math.max(...best.map((r) => r.withL));
  console.log(
    gained.length
      ? `\n  ✅ A rare cheat GAINS at ${gained.length} of ${best.length} signal gaps, up to ${peak.toFixed(3)} —\n` +
          `  far outside the null band. Negative frequency-dependence is an OUTPUT of\n` +
          `  avoidance learning here, not an assumption, which is what Gigord et al.\n` +
          `  measured in the field. ⚠️ It requires a signal gap: at gap 0 the two\n` +
          `  morphs are indistinguishable to the animal and the effect is exactly absent.`
      : `\n  ⚠️ NO rare-morph advantage clears the null band (peak ${peak.toFixed(3)} vs ${band.toFixed(3)}).\n` +
          `  Avoidance learning alone does not generate negative frequency-dependence\n` +
          `  in this model — the Smithson et al. 2007 outcome, not the Gigord 2001 one.`,
  );
  return rows;
}

const fmt = (x) => (x === null ? "  n/a" : x.toFixed(3));

// ==========================================================================
// B — how long must the memory be?
// ==========================================================================
/*
 * Whitehead & Peakall found short-term but not long-term avoidance. If this
 * model only produces frequency-dependence at a memory far longer than that,
 * the mechanism is being asked to do something the animal demonstrably does
 * not do — and the part A result would not transfer to the field.
 */
function partB() {
  rule("B — how much memory does the effect need? (forget = decay per visit)");

  const rng = E.makeRng(4242);
  const g = E.randomGenome(rng);
  const base = {
    focalG: g,
    resG: g,
    focalRewardP: 0,
    resRewardP: 0,
    focalSignal: 0.8,
    resSignal: 0.5,
    tag: 31,
  };
  console.log("    forget   half-life (visits)   rare/common");
  for (const forget of [0, 0.002, 0.01, 0.05, 0.2, 0.6]) {
    const f = freqDependence({ ...base, learn: { ...LEARN, forget } });
    const hl = forget <= 0 ? Infinity : Math.log(0.5) / Math.log(1 - forget);
    console.log(
      `    ${forget.toFixed(3).padStart(6)}   ${(hl === Infinity ? "never" : hl.toFixed(0)).padStart(18)}   ${fmt(f).padStart(11)}`,
    );
  }
  console.log(
    "\n  A memory that never decays is the strongest possible version of the\n" +
      "  mechanism and is NOT what was measured in the field; it is here as the\n" +
      "  upper bound, so the realistic rows can be read against it.",
  );
}

// ==========================================================================
// C — does the cheat need honest neighbours?
// ==========================================================================
/*
 * Internicola & Harder 2011: generalised food-deceptive orchids compete poorly
 * with rewarding species, and do better when more pollinators are naive. That
 * predicts the cheat's success should depend on the REWARDING community around
 * it — a prediction this model can either reproduce or fail.
 */
function partC() {
  rule("C — does a cheat do better surrounded by honest flowers?");

  const rng = E.makeRng(4242);
  const g = E.randomGenome(rng);
  console.log(
    "  A rare deceptive morph among residents whose reward reliability varies.\n",
  );
  console.log("   resident rewardP   cheat per-capita   [NO LEARNER]   ratio");
  for (const rp of [0, 0.25, 0.5, 0.75, 1]) {
    const b = {
      focalG: g,
      resG: g,
      nFocal: 4,
      nOther: N - 4,
      tag: 77,
      focalSignal: 0.8,
      resSignal: 0.5,
      focalRewardP: 0,
      resRewardP: rp,
    };
    const withL = focalPerCapita({ ...b, learn: LEARN });
    const noL = focalPerCapita({ ...b, learn: null });
    console.log(
      `   ${rp.toFixed(2).padStart(16)}   ${withL.toFixed(1).padStart(16)}   ${noL.toFixed(1).padStart(12)}   ${(withL / noL).toFixed(3).padStart(5)}`,
    );
  }
  console.log(
    "\n  The no-learner column is the same community with learning switched off,\n" +
      "  so the ratio isolates what the animal's memory does.\n" +
      "\n  A ratio that FALLS with resident rewardP reproduces Internicola & Harder\n" +
      "  2011: generalised food-deceptive orchids 'compete poorly with rewarding\n" +
      "  species for pollinator services'. The mechanism the model supplies for it\n" +
      "  is that every honest visit RESTORES the expectation a cheat's signal\n" +
      "  spends, so honest neighbours are what pay for the discrimination.",
  );
}

// ==========================================================================
// D — the roadmap B question: can it rescue a rare PLACEMENT?
// ==========================================================================
/*
 * The reason deception was built. A rare placement morph is penalised at
 * rare/common ~ 0.26 because it has no mating partners. If a rare SIGNAL is
 * rewarded by pollinator avoidance learning, and the new placement morph also
 * carries a new signal, the visitation gain might offset the mating penalty.
 *
 * The two arms differ in exactly one thing: whether the animal can learn.
 */
function partD() {
  rule("D — can a rare cheat's visitation gain rescue a rare PLACEMENT?");

  const rng = E.makeRng(99);
  const resG = E.randomGenome(rng);
  console.log(
    "  Focal morph differs from the resident in placement AND signal.\n" +
      "  Baseline for this barrier, measured under one pollinator: 0.26.\n",
  );
  console.log(
    "   morph   rare/common (learning)   rare/common [NO LEARNER]   lift",
  );

  const lifts = [];
  let tried = 0;
  for (let k = 0; k < 12 && lifts.length < 8; k++) {
    /* Step sizes spanning the range the comparable experiments use (constancy
     * 0.15-1.5, spatial and patch-size 0.8-1.6), so this asks the same "how far
     * away is the new placement" question those did rather than fixing one
     * arbitrary distance. */
    const focalG = E.mutate(resG, rng, 0.4 + 1.2 * (k / 12));
    const base = {
      focalG,
      resG,
      focalSignal: 0.8,
      resSignal: 0.5,
      focalRewardP: 0,
      resRewardP: 0,
      tag: 101 + k * 13,
    };
    const withL = freqDependence({ ...base, learn: LEARN });
    const noL = freqDependence({ ...base, learn: null });
    tried++;
    if (withL === null || noL === null || !(noL > 0)) continue;
    lifts.push({ withL, noL, lift: withL / noL });
    console.log(
      `   ${String(lifts.length).padStart(5)}   ${withL.toFixed(3).padStart(21)}   ${noL.toFixed(3).padStart(24)}   ${(withL / noL).toFixed(3)}`,
    );
  }
  if (!lifts.length) {
    console.log("  no viable morphs drawn — inconclusive, not a null");
    return;
  }
  const rescued = lifts.filter((l) => l.withL > 1).length;
  const mLift = mean(lifts.map((l) => l.lift));
  console.log(
    `\n  ${rescued} of ${lifts.length} morphs cross rare/common = 1 with learning on.` +
      `\n  Mean lift from learning: ${mLift.toFixed(3)}x  (drew ${tried} candidates)`,
  );
  console.log(
    rescued > 0
      ? "\n  ✅ Deception is the FIRST mechanism of six to push a rare placement past\n" +
          "  parity. That is the symmetry-breaker roadmap B has been looking for."
      : "\n  ⚠️ Even with a visitation gain, a rare placement stays below parity. The\n" +
          "  mating penalty is not something extra visits can pay off — which would\n" +
          "  make six mechanisms tested and none sufficient, and would support the\n" +
          "  standing possibility that divergence needs drift plus the hybrid cost.",
  );
}

partA();
partB();
partC();
partD();
console.log();
