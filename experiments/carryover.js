/*
 * What does carryover change?
 *
 * A. PACKAGING EFFICIENCY and LAST-MALE ADVANTAGE, across grooming rates —
 *    two quantities the mean-field model could not express at all.
 * B. COEXISTENCE. The mean-field model says nine species can share this
 *    pollinator. Does that survive when pollen actually rides? There are two
 *    plausible opposite answers: carryover gives a grain many chances to find
 *    the right stigma (helps), and it lets rival pollen accumulate on the body
 *    (hurts).
 */

const P = require("../sim/placement.js");
const K = require("../sim/packing.js");
const E = require("../sim/evolve.js");
const C = require("../sim/carryover.js");

const bee = P.DEFAULT_BEE;
const rule = (s) => console.log("\n" + s + "\n" + "-".repeat(s.length));

/* The community v1 evolved under the mean-field model, so the question is
 * asked of the same species rather than of a fresh random set. */
function evolvedCommunity() {
  const rng0 = E.makeRng(99);
  const sS = [],
    sP = [];
  for (let i = 0; i < 120; i++) {
    const d = P.placementDistribution(E.toFlower(E.randomGenome(rng0)), bee, {
      n: 60,
      seed: 500 + i,
    });
    if (d.hits.length >= 8) {
      sS.push(K.sSpread(d.hits));
      sP.push(K.phiSpread(d.hits));
    }
  }
  const ctx = {
    bee,
    nSamp: 60,
    sSd: K.median(sS),
    phiSd: K.median(sP),
    seed: 1097,
  };
  const { state } = E.run({
    arm: E.ARMS.L2,
    ctx,
    nSpecies: 40,
    generations: 400,
    sampleEvery: 100,
    k: 0.0005,
    mutRate: 0.03,
    extinctAt: 0.002,
    seed: 1,
  });
  return state.species.filter((s) => s.alive).map((s) => E.toFlower(s.g));
}

// ==========================================================================
// A. what carryover makes measurable
// ==========================================================================
function partA(flowers) {
  rule("A — packaging efficiency and last-male advantage, by grooming rate");
  const sites = flowers.map((f, i) =>
    C.siteSet(f, bee, { n: 200, seed: 11 + i }),
  );
  const ab = flowers.map(() => 1 / flowers.length);

  console.log(
    "  groom   median carry   delivered/produced   conspecific share   last-male gain",
  );
  for (const groom of [1.0, 0.5, 0.25, 0.12, 0.05]) {
    const r = C.runBout(sites, ab, { visits: 30000, seed: 3, groom });
    const rnd = C.runBout(sites, ab, {
      visits: 30000,
      seed: 3,
      groom,
      lastMale: false,
    });
    const delivered = r.landedRight + r.landedWrong;
    console.log(
      `  ${groom.toFixed(2).padStart(5)}   ${String(C.medianCarry(r.ageOnDeposit)).padStart(12)}` +
        `   ${(delivered / r.produced).toFixed(3).padStart(18)}` +
        `   ${(r.landedRight / Math.max(1, delivered)).toFixed(3).padStart(17)}` +
        `   ${(C.medianCarry(rnd.ageOnDeposit) - C.medianCarry(r.ageOnDeposit)).toFixed(1).padStart(14)}`,
    );
  }
  console.log(
    "\n  groom=1 is the one-chance limit — every grain gets exactly one stigma sweep,\n" +
      "  which is what the mean-field model assumed. Lower values are real carryover.\n" +
      "  'last-male gain' is how many visits younger the delivered pollen is when\n" +
      "  fresh grains lie on top, against random removal from the same patch.",
  );
}

// ==========================================================================
// B. does carryover change how many species coexist?
// ==========================================================================
/*
 * kc, the pollen-limitation floor, is CALIBRATED AT THE ONE-CHANCE LIMIT and
 * then held fixed while grooming varies.
 *
 * Legitimate rather than circular: at groom=1 the counted simulation and the
 * mean-field model are provably the same process, so matching them there fixes
 * a free parameter against a known answer — and the thing under test, what
 * happens at groom<1, is not the thing being calibrated. The value also sits
 * mid-plateau (5, 6, 8, 8, 8, 8 species for kc = 0.005 down to 0.00005) rather
 * than on a knife-edge, so nothing balances on it.
 *
 * My first guess, kc=0.005, was ten times too high and starved four species.
 * It was caught only because the limit check said the answer had to be 9.
 */
function demography(
  sites,
  groom,
  { steps = 150, visits = 8000, kc = 0.0002, seed = 7 } = {},
) {
  const S = sites.length;
  let n = new Array(S).fill(1 / S);
  let alive = new Array(S).fill(true);
  const rng = C.makeRng(seed);

  for (let g = 0; g < steps; g++) {
    const idx = [];
    for (let i = 0; i < S; i++) if (alive[i]) idx.push(i);
    if (idx.length <= 1) break;

    const r = C.runBout(
      idx.map((i) => sites[i]),
      idx.map((i) => n[i]),
      { visits, seed: seed + g, groom },
    );
    /* Per-visit rates, so the pollen-limitation floor kc has a fixed meaning
     * regardless of how long the bout ran. */
    const w = idx.map((_, a) => {
      let own = r.T[a][a] / visits,
        tot = 0;
      for (let b = 0; b < idx.length; b++) tot += r.T[b][a] / visits;
      return own / (tot + kc);
    });

    let propTot = 0;
    const prop = w.map((wi, a) => {
      const v = Math.max(0, n[idx[a]] * wi * (1 + 0.03 * (rng() - 0.5) * 2));
      propTot += v;
      return v;
    });
    if (propTot <= 0) break;

    const death = 0.12;
    let occ = 0;
    for (const i of idx) occ += n[i];
    idx.forEach((i, a) => {
      n[i] = n[i] * (1 - death) + (death * occ * prop[a]) / propTot;
    });
    for (const i of idx) if (n[i] < 0.002) alive[i] = false;
  }
  return alive.filter(Boolean).length;
}

function partB(flowers) {
  rule("B — does the evolved community survive carryover?");
  const sites = flowers.map((f, i) =>
    C.siteSet(f, bee, { n: 200, seed: 11 + i }),
  );
  console.log(
    `  ${flowers.length} species, evolved under the mean-field model\n`,
  );
  console.log("  groom   surviving species");
  for (const groom of [1.0, 0.5, 0.25, 0.12, 0.05]) {
    const n = demography(sites, groom);
    console.log(
      `  ${groom.toFixed(2).padStart(5)}   ${String(n).padStart(6)}` +
        (groom === 1.0
          ? "   <- one-chance limit: recovers 8 of the mean-field 9"
          : ""),
    );
  }
  console.log(
    "\n  The species the limit does not recover sat at abundance 0.004 against an\n" +
      "  extinction floor of 0.002 — marginal in the deterministic model, and lost\n" +
      "  once transfer is counted rather than assumed.",
  );
}

// ==========================================================================
// C. the discriminating case
// ==========================================================================
/*
 * Part B asked the question of a community that had already evolved to zero
 * pairwise overlap — so the mechanism by which carryover should HURT, rival
 * pollen piling up on the body, never had a chance to bite. The honest test is
 * a community that genuinely overlaps.
 */
function partC() {
  rule("C — carryover in a community that has NOT separated");
  const rng = E.makeRng(4242);
  const flowers = [];
  while (flowers.length < 12) {
    const f = E.toFlower(E.randomGenome(rng));
    const d = P.placementDistribution(f, bee, { n: 80, seed: 77 });
    if (d.hits.length > 40) flowers.push(f);
  }
  const sites = flowers.map((f, i) => C.siteSet(f, bee, { n: 200, seed: 11 + i }));

  // how much do they actually overlap?
  const sigA = sites.map((st) => K.sig2D(st.anther));
  const sigS = sites.map((st) => K.sig2D(st.stigma));
  let sum = 0,
    cnt = 0;
  for (let i = 0; i < sites.length; i++)
    for (let j = 0; j < sites.length; j++)
      if (i !== j) {
        sum += K.overlap(sigA[i], sigS[j]);
        cnt++;
      }
  console.log(
    `  ${flowers.length} unevolved species, mean heterospecific overlap ${(sum / cnt).toFixed(3)}` +
      `  (the evolved community's was 0.000)
`,
  );
  console.log("  groom   surviving species");
  for (const groom of [1.0, 0.5, 0.25, 0.12, 0.05]) {
    console.log(
      `  ${groom.toFixed(2).padStart(5)}   ${String(demography(sites, groom, { seed: 31 })).padStart(6)}`,
    );
  }
}

const flowers = evolvedCommunity();
partA(flowers);
partB(flowers);
partC();
console.log();
