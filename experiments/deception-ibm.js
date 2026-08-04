/*
 * deception-ibm.js — the one mechanism past parity, put inside a model that can
 * actually breed. (roadmap B)
 *
 * WHERE THIS SITS. Six mechanisms were scored against a PROXY, the rare-morph
 * penalty `rare/common ~ 0.26`. Five did nothing. Deception was the first and
 * only one to push a rare placement past parity (3.18x), because it is the only
 * one that changes whether the animal WANTS TO BE THERE rather than merely who
 * it meets. Then the IBM replaced the proxy with real inheritance and found
 * something sharper than "no split": placement-mediated mating is positively
 * frequency-dependent, so it ERASED an imposed bimodality — spread 0.73 against
 * a random-mating null's 1.97.
 *
 * So the two results point opposite ways, and this experiment is the collision.
 *
 *   Deception supplies NEGATIVE frequency-dependence — being rare pays.
 *   The mating system supplies POSITIVE frequency-dependence — being rare costs.
 *
 * ⚠️ BUT THEY DO NOT ACT ON THE SAME AXIS, and that is the whole question.
 * Deception acts on the ADVERTISEMENT: what the animal has learned about a
 * signal. The mating system acts on PLACEMENT: where pollen physically lands.
 * A rare signal is rewarded; a rare placement is punished; and with free
 * recombination an allele pair that arises together is separated in one
 * generation. So the question is not "is deception strong enough" — it is
 * whether the negative frequency-dependence can REACH the axis the positive
 * frequency-dependence lives on.
 *
 * That is why there is a linkage arm. If placement diverges only when the
 * advertisement is physically linked to the anther loci, the answer is a
 * specific and falsifiable claim about real orchids — that a mimicry-style
 * supergene is a precondition — rather than a modelling detail. Supergenes of
 * exactly this kind are documented in mimicry (Heliconius, Papilio polytes).
 *
 * WHAT IS MEASURED ON BOTH AXES. Reporting placement alone would answer "did
 * deception do anything?" with a statistic that cannot see where it acted, so
 * the same two-medoid separation is computed on the signal ring as on the body
 * surface, and both are quoted against the same nulls.
 */

const I = require("../sim/ibm.js");
const E = require("../sim/evolve.js");
const C = require("../sim/carryover.js");
const D = require("../sim/deception.js");

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const sd = (xs) => {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(
    xs.reduce((s, x) => s + (x - m) * (x - m), 0) / (xs.length - 1),
  );
};
const f2 = (x) =>
  x === null || x === undefined ? "   -  " : x.toFixed(2).padStart(6);

/*
 * The published configuration. The env overrides exist for ONE reason and it is
 * not convenience: this run takes ~20 minutes, and a 20-minute experiment with
 * no way to exercise its own reporting path is a design flaw I walked into —
 * a verdict bug (scoring the linked arm against the unlinked control's band)
 * cost a full re-run to fix and confirm. `DECIBM_SMOKE=1` runs the identical
 * code end to end in seconds so the REPORTING can be checked without re-deriving
 * the RESULT. Smoke numbers are not results and the banner says so.
 */
const SMOKE = process.env.DECIBM_SMOKE === "1";
const N = SMOKE ? 12 : 30;
const GENS = SMOKE ? 4 : 35;
const SEEDS = SMOKE ? [1, 2, 3] : [1, 2, 3, 4, 5, 6];
const SITE_N = SMOKE ? 50 : 160;
if (SMOKE)
  console.log(
    "\n*** DECIBM_SMOKE=1 — tiny configuration. This exercises the code path and\n" +
      "*** the reporting. THE NUMBERS BELOW ARE NOT RESULTS.\n",
  );

/*
 * The learning parameters are NOT re-tuned here. They are the ones
 * experiments/deception.js already measured a rare-morph advantage under, and
 * `forget = 0.01` is the value the literature pins hardest — Whitehead & Peakall
 * 2012 found short-term but not long-term avoidance. Re-tuning them for this
 * harness would be calibrating a constant from the artifact under test.
 */
const LEARN = { rate: 0.2, forget: 0.01, width: 0.06, naive: 1 };

const rule = (s) => console.log("\n" + s + "\n" + "-".repeat(s.length));

// ========================================================================
// PART 0 — the anchor gate
// ========================================================================

/*
 * ANCHOR 1 — THE ADVERTISEMENT MUST NOT HAVE CHANGED THE MODEL.
 *
 * Adding a heritable locus perturbs a shared random stream, which would have
 * silently moved every previously published IBM arm onto different draws while
 * looking like an additive change. `sim/ibm.js` therefore gives the
 * advertisement its own stream, and this checks that it worked: the two arms
 * published on 2026-08-03 must come back with the SAME numbers, not similar
 * ones.
 */
const PUBLISHED = { real: 2.58, nul: 2.21 };

function anchorReproduction() {
  const armAt = (extra) => {
    const last = [1, 2, 3, 4].map((seed) => {
      const h = I.run({
        n: N,
        generations: GENS,
        seed,
        siteN: SITE_N,
        ...extra,
      }).history;
      return h[h.length - 1];
    });
    return mean(last.map((h) => h.separation).filter((x) => x !== null));
  };
  const real = armAt({});
  const nul = armAt({ randomMating: true });
  const ok =
    Math.abs(real - PUBLISHED.real) < 0.005 &&
    Math.abs(nul - PUBLISHED.nul) < 0.005;
  console.log(
    `  1. the 2026-08-03 arms still reproduce EXACTLY (advertisement is on its own rng)`,
  );
  console.log(
    `     placement-mated ${real.toFixed(2)} (published ${PUBLISHED.real})   ` +
      `random-mating ${nul.toFixed(2)} (published ${PUBLISHED.nul})   ${ok ? "ok" : "FAIL"}`,
  );
  return ok;
}

/*
 * ⚠️ ANCHOR 2 — IS DECEPTION LIVE AT *THIS* OPERATING POINT?
 *
 * This is the anchor this experiment exists to pass before anything else runs.
 * The 3.18x rare-morph advantage was measured at N = 24 in a single bout with
 * its own site draws; nothing guarantees it survives at N = 30, siteN = 160,
 * 24000 visits, inside step(). An arm where the mechanism is quietly INERT
 * returns "no split" — which is indistinguishable from a real negative and
 * reads as the hypothesis surviving. This project has been caught by an inert
 * control before, so the mechanism is measured where it will actually be used.
 *
 * The control here is EXACT rather than statistical, which is stronger than
 * anything the earlier deception work could do: with no learner, the signal is
 * never read, so the deviant and matched arms are bit-identical bouts and the
 * ratio must be exactly 1.000 at every gap. Any departure from 1.000 would mean
 * the advertisement had leaked into the geometry — so this one control tests
 * both that deception works and that `shapeOf` holds, end to end.
 */
function anchorLive() {
  const perCapita = (seed, gap, learn) => {
    const rng = E.makeRng(seed);
    const srng = I.signalRng(seed);
    const pop = I.foundPopulation(N, rng, { spread: 0.06, srng });
    /* Everyone advertises 0.5; the focal plant is moved by `gap`. Its GENOME is
     * untouched, so its placement is identical in both arms by construction. */
    pop.forEach((ind, i) => {
      const v = (0.5 + (i === 0 ? gap : 0)) % 1;
      ind.h1.signal = v;
      ind.h2.signal = v;
    });
    const opts = { ...I.DEFAULTS, siteN: SITE_N };
    const sites = I.sitesOf(pop, opts, 0);
    const n = sites.length;
    const r = C.runBout(sites, new Array(n).fill(1 / n), {
      visits: opts.visits,
      seed: 7,
      learner: learn ? D.makeLearner(learn) : null,
      signals: learn ? pop.map(I.signalOf) : null,
      rewardP: learn ? new Array(n).fill(0) : null,
    });
    let f = 0;
    for (let j = 1; j < n; j++) f += r.T[0][j] + r.T[j][0];
    return f;
  };

  console.log(
    `\n  2. deception is LIVE at this operating point (N=${N}, siteN=${SITE_N}, ${I.DEFAULTS.visits} visits)`,
  );
  console.log(
    `     one deviant advertiser among ${N - 1} identical cheats, its genome unchanged\n`,
  );
  console.log("       signal gap   with learning   NO LEARNER (must be 1.000)");
  const seeds = [1, 2, 3];
  let peak = 0;
  let nullExact = true;
  for (const gap of [0, 0.05, 0.1, 0.2, 0.35]) {
    const withL = mean(
      seeds.map((s) => perCapita(s, gap, LEARN) / perCapita(s, 0, LEARN)),
    );
    const noL = mean(
      seeds.map((s) => perCapita(s, gap, null) / perCapita(s, 0, null)),
    );
    if (Math.abs(noL - 1) > 1e-12) nullExact = false;
    peak = Math.max(peak, withL);
    console.log(
      `       ${gap.toFixed(2).padStart(10)}   ${withL.toFixed(3).padStart(13)}   ${noL.toFixed(3).padStart(24)}`,
    );
  }
  const ok = peak > 2 && nullExact;
  console.log(
    `\n     a rare advertiser gains up to ${peak.toFixed(2)}x   ${peak > 2 ? "ok" : "FAIL"}` +
      `\n     no-learner control is exactly 1.000 at every gap   ${nullExact ? "ok" : "FAIL"}` +
      `\n     (that control is exact, not statistical: with no learner the signal is never` +
      `\n      read, so the two arms are the same bout. It therefore also proves the` +
      `\n      advertisement cannot reach the geometry.)`,
  );
  return ok;
}

/*
 * ANCHOR 3 — the two facts the IBM itself had to reproduce, unchanged: realized
 * parentage is stabilising, and with mutation off the cloud contracts. Deception
 * must not have broken either, so they are re-run WITH deception on.
 */
function anchorStabilising() {
  const collapses = SEEDS.map((seed) => {
    const h = I.run({
      n: N,
      generations: GENS,
      seed,
      mutRate: 0,
      signalMut: 0,
      siteN: SITE_N,
      deceptive: true,
      learn: LEARN,
    }).history;
    return h[0].spread / h[h.length - 1].spread;
  });
  const mc = mean(collapses);
  const ok = mc > 1.5;
  console.log(
    `\n  3. with mutation OFF the placement cloud still CONTRACTS, deception ON`,
  );
  console.log(
    `     spread collapses ${mc.toFixed(1)}x over ${GENS} generations   ${ok ? "ok" : "FAIL"}   [${collapses
      .map((x) => x.toFixed(1))
      .join(", ")}]`,
  );
  return ok;
}

// ========================================================================
// the arms
// ========================================================================

function arm(label, extra) {
  const runs = SEEDS.map((seed) =>
    I.run({ n: N, generations: GENS, seed, siteN: SITE_N, ...extra }),
  );
  const tailOf = (r, key) => {
    const t = r.history.slice(Math.floor((GENS * 2) / 3));
    return mean(t.map((h) => h[key] ?? 0));
  };
  const last = runs.map((r) => r.history[r.history.length - 1]);
  return {
    label,
    /* placement */
    sep: mean(last.map((h) => h.separation).filter((x) => x !== null)),
    tail: runs.map((r) => tailOf(r, "separation")),
    spread: mean(last.map((h) => h.spread)),
    /* advertisement */
    sigTail: runs.map((r) => tailOf(r, "signalSeparation")),
    sigSpread: mean(last.map((h) => h.signalSpread)),
    sigGap: mean(last.map((h) => h.signalGap ?? 0)),
    unmated: mean(last.map((h) => h.unmated)),
    stalled: last.some((h) => h.stalled),
  };
}

/*
 * ⚠️ THE ADVERTISEMENT SPREAD PRINTS AT THREE DECIMALS, NOT TWO, AND THAT IS A FIX.
 *
 * It used to share the 2-decimal `f2` with everything else, and I then reported
 * the inflation by dividing the PRINTED values — 0.18 / 0.05 = "3.6x". The real
 * numbers are 0.175 / 0.055 = 3.2x. Dividing two rounded quantities whose
 * denominator is ~0.05 amplifies the rounding into a ~12% error in the ratio,
 * which is the whole reason a derived quantity must never be recomputed from a
 * display value. So the column carries enough precision to divide, and the ratio
 * itself is printed below so nobody has to.
 */
const f3 = (x) =>
  x === null || x === undefined ? "    -  " : x.toFixed(3).padStart(7);

function report(a) {
  console.log(
    `  ${a.label.padEnd(34)} ${f2(mean(a.tail))} +/-${f2(sd(a.tail))}  ${f2(a.spread)}   ` +
      `${f2(mean(a.sigTail))} +/-${f2(sd(a.sigTail))}  ${f3(a.sigSpread)}${a.stalled ? "  (stalled)" : ""}`,
  );
}

const HEAD =
  "  arm                                  PLACEMENT tail  spread     SIGNAL tail  spread";

// ========================================================================
// main
// ========================================================================

console.log("=".repeat(88));
console.log(
  "Can deception's negative frequency-dependence reach the placement axis? (roadmap B)",
);
console.log("=".repeat(88));

rule("PART 0 — the anchor gate");
const gate = [anchorReproduction(), anchorLive(), anchorStabilising()];
if (!gate.every(Boolean)) {
  /* The anchors are calibrated to the PUBLISHED configuration, so under SMOKE
   * they are expected to fail and are informational only — which is exactly why
   * a smoke run must never be read as a result. The real path is unchanged. */
  console.log(
    SMOKE
      ? "\n(anchors do not apply at smoke size — informational only)"
      : "\nANCHORS FAILED — refusing to compute a result.",
  );
  if (!SMOKE) process.exit(1);
}

rule("PART A — deception with free recombination (the conservative default)");
console.log(HEAD);
/* Three levels, so the mechanism is isolated from its own machinery: no learner
 * at all; the learner present with every plant honest; the learner present with
 * every plant a cheat. The middle arm shares runBout's learning code path and
 * rng draws with the third and differs only in whether cheating pays. */
const bare = arm("no learner at all", {});
const honest = arm("learner on, all plants HONEST", { learn: LEARN });
const cheat = arm("learner on, all plants CHEAT", {
  deceptive: true,
  learn: LEARN,
});
const nul = arm("random mating (null)", { randomMating: true });
report(bare);
report(honest);
report(cheat);
report(nul);

rule("PART B — the supergene: advertisement LINKED to the anther loci");
console.log(HEAD);
const linkHonest = arm("linked, all plants HONEST", {
  learn: LEARN,
  linkSignal: true,
});
const linkCheat = arm("linked, all plants CHEAT", {
  deceptive: true,
  learn: LEARN,
  linkSignal: true,
});
report(linkHonest);
report(linkCheat);
console.log(
  "\n  The honest-linked arm is here so that any effect in the cheating-linked arm\n" +
    "  cannot be attributed to reduced recombination on its own.",
);

rule("PART C — does the answer depend on how fast the advertisement mutates?");
console.log(
  "  The advertisement's mutation rate is the one parameter with no measured value\n" +
    "  to anchor it, so it is SWEPT rather than picked. Gigord's morphs are discrete,\n" +
    "  which argues for larger steps than a quantitative shape trait; the default here\n" +
    "  is the conservative choice of equality with it.\n",
);
console.log(
  "  signalMut   free: PLACEMENT tail   SIGNAL tail    linked: PLACEMENT tail   SIGNAL tail",
);
const sweep = [];
for (const sm of [0.02, 0.06, 0.15]) {
  const a = arm("", { deceptive: true, learn: LEARN, signalMut: sm });
  const b = arm("", {
    deceptive: true,
    learn: LEARN,
    signalMut: sm,
    linkSignal: true,
  });
  sweep.push({ sm, a, b });
  console.log(
    `  ${sm.toFixed(2).padStart(9)}   ${f2(mean(a.tail))}${" ".repeat(14)}${f2(mean(a.sigTail))}   ` +
      `${f2(mean(b.tail))}${" ".repeat(16)}${f2(mean(b.sigTail))}`,
  );
}

// ---------------------------------------------------------------- verdict

const band = mean(nul.tail) + 2 * sd(nul.tail);

/*
 * ⚠️ EACH ARM IS JUDGED AGAINST ITS OWN MATCHED CONTROL.
 *
 * The first version of this scored the LINKED cheating arm against the UNLINKED
 * honest band, which is the wrong comparison and flattered it: linkage changes
 * how alleles travel, so it has its own honest control and that control's band
 * is the one it has to clear. Against the correct band the linked arm's signal
 * result at the default mutation rate is marginal rather than a split, and
 * saying so is the difference between reporting an effect and reporting the
 * control it was compared to.
 */
const sigBandOf = (control) => mean(control.sigTail) + 2 * sd(control.sigTail);
const sigFree = sigBandOf(honest);
const sigLinked = sigBandOf(linkHonest);

const splitsPlacement = (a) => mean(a.tail) > band;
const splitsSignal = (a, control) => mean(a.sigTail) > sigBandOf(control);

console.log("\n" + "=".repeat(88));
console.log(
  `  null bands   placement ${band.toFixed(2)} (random mating +2sd)` +
    `   signal ${sigFree.toFixed(2)} free / ${sigLinked.toFixed(2)} linked (matched honest +2sd)\n`,
);
for (const [a, control] of [
  [cheat, honest],
  [linkCheat, linkHonest],
])
  console.log(
    `  ${a.label.padEnd(34)} placement split: ${splitsPlacement(a) ? "YES" : "NO "}` +
      `    signal ${mean(a.sigTail).toFixed(2)} vs band ${sigBandOf(control).toFixed(2)}: ${splitsSignal(a, control) ? "CLEARS" : "marginal"}` +
      /* the ratio is COMPUTED here, from the full-precision values, precisely so
       * that it is never re-derived from the rounded column above */
      `    spread ${a.sigSpread.toFixed(3)} vs ${control.sigSpread.toFixed(3)} = ${(a.sigSpread / control.sigSpread).toFixed(2)}x`,
  );

const anySweepPlacement = sweep.some(
  (r) => mean(r.a.tail) > band || mean(r.b.tail) > band,
);
console.log();

if (
  !splitsPlacement(cheat) &&
  !splitsPlacement(linkCheat) &&
  !anySweepPlacement
) {
  const widened =
    cheat.sigSpread > 2 * honest.sigSpread &&
    linkCheat.sigSpread > 2 * linkHonest.sigSpread;
  if (widened) {
    console.log(
      "  DECEPTION DIVERSIFIES THE ADVERTISEMENT AND DOES NOT MOVE THE PLANT.\n" +
        "\n" +
        "  The mechanism is demonstrably working — a rare advertiser gains several-fold\n" +
        "  (anchor 2) and the advertisement cloud is several times wider than its matched\n" +
        "  honest control. What it does not do is move PLACEMENT, and that holds even when\n" +
        "  the advertisement is LINKED to the anther loci, so the failure is not that free\n" +
        "  recombination separated them.\n" +
        "\n" +
        "  ⚠️ Note which claim the numbers support. The advertisement's SPREAD inflates\n" +
        "  reliably; its BIMODALITY clears the matched honest band only marginally. That\n" +
        "  distinction is the mechanism rather than a hedge:\n" +
        "\n" +
        "  NEGATIVE FREQUENCY-DEPENDENCE MAINTAINS A POLYMORPHISM; IT DOES NOT COMPLETE A\n" +
        "  SPLIT. A rare-morph advantage must evaporate the moment the morph becomes\n" +
        "  common, so it generates and protects variance without ever resolving it into\n" +
        "  two discrete morphs — and a protected polymorphism is the opposite of a\n" +
        "  completed split. That is what Gigord et al. 2001 actually reported: the\n" +
        "  MAINTENANCE of a colour polymorphism within one species, not speciation.\n" +
        "\n" +
        "  Meanwhile a rare PLACEMENT still has nobody to exchange pollen with, and extra\n" +
        "  visits do not create a compatible partner. Deception's 3.18x past parity bought\n" +
        "  visitation, and visitation was never the barrier.\n" +
        "\n" +
        "  Seven mechanisms, and this is now the second of them shown to break a symmetry\n" +
        "  on an axis that is not the one reproductive isolation lives on — a sharper\n" +
        "  statement of why the other five failed than 'they did not work'.",
    );
  } else {
    console.log(
      "  Deception moves NEITHER axis inside a breeding population, despite a large\n" +
        "  per-capita advantage in a single bout (anchor 2). That would mean the\n" +
        "  rare/common proxy the first six mechanisms were scored against does not\n" +
        "  survive contact with inheritance at all.",
    );
  }
} else {
  console.log(
    "  A PLACEMENT SPLIT APPEARED. That is a first for this project, so it needs the\n" +
      "  hardest possible check before it is believed — start with whether the honest\n" +
      "  and linked-honest controls stayed put, and whether the split persists in the\n" +
      "  tail rather than appearing in the final frame.",
  );
}
console.log("=".repeat(88));
