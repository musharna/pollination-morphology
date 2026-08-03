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
  const { state: st } = E.run({
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
  /* The mean-field abundances come back too. The claim about which species the
   * counted simulation fails to recover is a claim about how marginal they were
   * HERE, so it has to be read off this state rather than restated. */
  const live = st.species.filter((s) => s.alive);
  return {
    flowers: live.map((s) => E.toFlower(s.g)),
    abund: live.map((s) => s.n),
  };
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
  /* Returns WHICH species survived, not just how many, so a claim about the
   * ones that are lost can be derived rather than remembered. */
  return { count: alive.filter(Boolean).length, alive };
}

function partB(flowers, abund) {
  rule("B — does the evolved community survive carryover?");
  const sites = flowers.map((f, i) =>
    C.siteSet(f, bee, { n: 200, seed: 11 + i }),
  );
  console.log(
    `  ${flowers.length} species, evolved under the mean-field model\n`,
  );
  console.log("  groom   surviving species");
  let lostAtLimit = null;
  for (const groom of [1.0, 0.5, 0.25, 0.12, 0.05]) {
    const r = demography(sites, groom);
    if (groom === 1.0) lostAtLimit = r.alive;
    console.log(
      `  ${groom.toFixed(2).padStart(5)}   ${String(r.count).padStart(6)}` +
        /* Derived, not hardcoded. This line read "recovers 8 of the mean-field
         * 9" for as long as those happened to be the numbers, and went on
         * printing it after the head-cap fix moved them to 7 of 8. A claim
         * stated as a constant cannot track the computation it describes. */
        (groom === 1.0
          ? `   <- one-chance limit: recovers ${r.count} of the mean-field ${flowers.length}`
          : ""),
    );
  }

  /* ⚠️ The explanation used to be a hardcoded "sat at abundance 0.004", two
   * functions after this file's own warning that a claim stated as a constant
   * cannot track the computation it describes. It was measured once, before the
   * evolution loop changed metric, and has been reprinted unverified since.
   * Derived now, and it reports whichever way the comparison actually falls. */
  const lost = abund.filter((_, i) => !lostAtLimit[i]);
  const kept = abund.filter((_, i) => lostAtLimit[i]);
  if (!lost.length) {
    console.log(
      "\n  The one-chance limit recovers every species — nothing to explain.",
    );
    return;
  }
  const fm = (xs) => xs.map((x) => x.toFixed(4)).join(", ");
  const marginal = Math.max(...lost) < Math.min(...kept);
  console.log(
    `\n  Mean-field abundance of the ${lost.length} species the limit does NOT recover:` +
      ` ${fm(lost.sort((a, b) => a - b))}\n` +
      `  against a survivor range of ${Math.min(...kept).toFixed(4)} to ${Math.max(...kept).toFixed(4)}` +
      ` and an extinction floor of 0.002.\n  ` +
      (marginal
        ? "Every lost species was rarer than every survivor — marginal in the deterministic\n" +
          "  model, and lost once transfer is counted rather than assumed."
        : "⚠️ NOT simply the rarest: at least one lost species was commoner than a survivor,\n" +
          "  so carryover is removing something other than the marginal tail."),
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
/* Mean anther->stigma overlap across every heterospecific pair, on the live
 * continuous metric. Shared so the unevolved community and the evolved one it
 * is contrasted against are measured by the same code, not by one measurement
 * and one remembered number. */
function meanHeteroOverlap(sites) {
  const sigA = sites.map((st) => K.kdeSig(st.anther));
  const sigS = sites.map((st) => K.kdeSig(st.stigma));
  let sum = 0,
    cnt = 0;
  for (let i = 0; i < sites.length; i++)
    for (let j = 0; j < sites.length; j++)
      if (i !== j) {
        sum += K.kdeOverlap(sigA[i], sigS[j]);
        cnt++;
      }
  return sum / cnt;
}

function partC(evolvedSites) {
  rule("C — carryover in a community that has NOT separated");
  const rng = E.makeRng(4242);
  const flowers = [];
  while (flowers.length < 12) {
    const f = E.toFlower(E.randomGenome(rng));
    const d = P.placementDistribution(f, bee, { n: 80, seed: 77 });
    if (d.hits.length > 40) flowers.push(f);
  }
  const sites = flowers.map((f, i) =>
    C.siteSet(f, bee, { n: 200, seed: 11 + i }),
  );

  /* How much do they actually overlap — and how much did the evolved community?
   *
   * ⚠️ The contrast used to be a HARDCODED "0.000", which was two things at
   * once: a constant standing in for a computation, and a rounding artefact of
   * the histogram metric that could return exact zeros. Continuous overlap has
   * gaussian tails and is never exactly zero, so the real contrast is between
   * two measured numbers. This file's own partB comment warns against exactly
   * this ("a claim stated as a constant cannot track the computation it
   * describes") twenty lines earlier. */
  const un = meanHeteroOverlap(sites);
  const ev = meanHeteroOverlap(evolvedSites);
  console.log(
    `  ${flowers.length} unevolved species, mean heterospecific overlap ${un.toExponential(2)}\n` +
      `  the evolved community, same metric and same code path: ${ev.toExponential(2)}` +
      `  (${(un / ev).toFixed(1)}x separated)\n`,
  );
  console.log("  groom   surviving species");
  for (const groom of [1.0, 0.5, 0.25, 0.12, 0.05]) {
    console.log(
      `  ${groom.toFixed(2).padStart(5)}   ${String(demography(sites, groom, { seed: 31 }).count).padStart(6)}`,
    );
  }
}

const { flowers, abund } = evolvedCommunity();
partA(flowers);
partB(flowers, abund);
/* Built the same way partA and partB build theirs, so the overlap contrast in
 * part C is against the community those parts actually ran on. */
partC(flowers.map((f, i) => C.siteSet(f, bee, { n: 200, seed: 11 + i })));
console.log();
