/*
 * Space inside the IBM — coordinates, local foraging, limited seed dispersal.
 *
 * ⚠️ THE ORDER OF THESE TESTS IS THE ARGUMENT. The experiment's conclusion
 * rests on a chain, and each link is a way the whole thing could be quietly
 * false:
 *
 *   1. space OFF must change nothing, or every published IBM number moves.
 *   2. LOCAL FORAGING must actually redirect pollen to positional neighbours.
 *      ⚠️ It had NO TEST AT ALL before this file — `forageRange` has lived in
 *      sim/carryover.js since 2026-08-02, driven only from the v1 harness, and
 *      nothing in tests/ ever exercised it.
 *   3. LIMITED DISPERSAL must actually produce kin structure. This is the
 *      positive control the pre-registration turns on: "limited dispersal" is an
 *      INPUT, "kin ended up near each other" is an OUTCOME, and a kernel too
 *      wide for the ring leaves the arms differing in a parameter and nothing
 *      else. An unmoved result under an intervention that never landed is a
 *      broken harness, not a fact about biology.
 *   4. The four cells must differ in the MECHANISM, not in how they walk the
 *      random stream.
 */

const test = require("node:test");
const assert = require("node:assert");

const I = require("../sim/ibm.js");
const C = require("../sim/carryover.js");
const E = require("../sim/evolve.js");

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const ringDist = (a, b) => {
  const d = Math.abs(a - b) % 1;
  return d > 0.5 ? 1 - d : d;
};

function fixture(n, seed) {
  const built = I.foundTwoLineages(
    n,
    E.makeRng(seed),
    I.signalRng(seed),
    8,
    I.DEFAULTS,
  );
  assert.ok(built, `fixture failed at seed ${seed}`);
  return built.pop;
}

/* --------------------------------------------- 1. off changes nothing */

test("space:null leaves the generation bit-identical", () => {
  const pop = fixture(20, 5);
  const a = I.step(pop, I.DEFAULTS, E.makeRng(5), 0, I.signalRng(5));
  const b = I.step(
    pop,
    { ...I.DEFAULTS, space: null },
    E.makeRng(5),
    0,
    I.signalRng(5),
  );
  assert.deepStrictEqual(
    b.pop,
    a.pop,
    "an explicit null space moved the model",
  );
  assert.equal(a.ancNeighbour, null, "clustering reported with space off");
  /* and no individual acquired a coordinate it should not have */
  assert.ok(
    a.pop.every((ind) => !("pos" in ind)),
    "offspring carry a position in a model with no space",
  );
});

/* ------------------------- 2. local foraging redirects pollen — MECHANISM */

test("local foraging moves pollen between NEIGHBOURS, global does not", () => {
  const n = 24;
  const pop = fixture(n, 7);
  const sites = I.sitesOf(pop, I.DEFAULTS, 0);
  const w = I.allocWeights(sites, null, n);
  /*
   * ⚠️ EVENLY SPACED, BUT NOT IN INDEX ORDER — and the control below is what
   * caught this. `positions[i] = i/n` looks like the neutral choice and is not:
   * foundTwoLineages builds lineage A as the first half of the array and B as
   * the second, so index order puts each lineage on its own ARC. Same-lineage
   * plants exchange more pollen, so the global control came back at 0.179
   * against the ~0.261 expected of unstructured pairs — the test had imposed
   * exactly the clustering the experiment exists to let EMERGE, and would then
   * have credited the kernel with it.
   *
   * A coprime stride keeps the spacing even while decorrelating position from
   * index, and therefore from lineage.
   */
  const positions = Array.from({ length: n }, (_, i) => ((i * 7) % n) / n);

  const meanTransferDist = (forageRange) => {
    const r = C.runBout(sites, w, {
      visits: 6000,
      seed: 21,
      positions,
      forageRange,
    });
    let tot = 0,
      wsum = 0;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        if (i === j || !r.T[i][j]) continue;
        tot += r.T[i][j] * ringDist(positions[i], positions[j]);
        wsum += r.T[i][j];
      }
    assert.ok(wsum > 0, `no transfer at all at forageRange=${forageRange}`);
    return tot / wsum;
  };

  const local = meanTransferDist(0.06);
  const global = meanTransferDist(Infinity);

  /* ⚠️ A POSITIVE CONTROL IN THE SAME TEST. `global` is the legitimate path: if
   * the harness were broken both arms would come back equal, or zero, and a
   * one-sided assertion would read that as "local foraging works". 0.25 is the
   * mean ring distance between two uniformly random points. */
  assert.ok(
    global > 0.2,
    `global foraging concentrated pollen (${global.toFixed(3)}) — the control ` +
      `arm is not global, so the comparison means nothing`,
  );
  assert.ok(
    local < global * 0.6,
    `local foraging did not shorten pollen movement: ${local.toFixed(3)} ` +
      `against ${global.toFixed(3)} global`,
  );
});

/* ---------- 3. POSITIVE CONTROL: limited dispersal builds kin structure */

test("limited dispersal clusters ancestry; global dispersal does not", () => {
  const run = (space, seed, gens = 10) => {
    const rng = E.makeRng(seed);
    const srng = I.signalRng(seed);
    let pop = fixture(28, seed);
    const seen = [];
    for (let g = 0; g < gens; g++) {
      if (pop.length < 2) break;
      const res = I.step(pop, { ...I.DEFAULTS, space }, rng, g, srng);
      if (res.ancNeighbour !== null) seen.push(res.ancNeighbour);
      pop = res.pop;
    }
    return seen;
  };

  const SEEDS = [2, 3, 4, 5, 6];
  const tight = [];
  const loose = [];
  for (const s of SEEDS) {
    /* the same forager in both arms — only DISPERSAL differs, so any structure
     * is built by where seed lands and not by where the animal flew */
    tight.push(...run({ forageRange: Infinity, seedRange: 0.02 }, s).slice(3));
    loose.push(
      ...run({ forageRange: Infinity, seedRange: Infinity }, s).slice(3),
    );
  }
  assert.ok(tight.length > 5 && loose.length > 5, "too little to compare");

  const T = mean(tight),
    L = mean(loose);
  /* Global dispersal is the positive control for the STATISTIC: with positions
   * redrawn every generation there is no kin structure by construction, so this
   * must sit at 1. If it does not, ancNeighbour is measuring something else and
   * the tight arm's number means nothing. */
  assert.ok(
    Math.abs(L - 1) < 0.12,
    `global dispersal reported clustering ${L.toFixed(3)} — the statistic is ` +
      `detecting something other than kin structure`,
  );
  assert.ok(
    T < 0.85,
    `limited dispersal produced no kin structure (${T.toFixed(3)} against ` +
      `${L.toFixed(3)}) — the intervention did not land, so any downstream ` +
      `comparison would be measuring nothing`,
  );
});

/* ------------- 4. the cells differ in mechanism, not in the rng stream */

test("both dispersal modes consume the same random draws", () => {
  const counted = (seed) => {
    const base = E.makeRng(seed);
    let n = 0;
    const f = () => {
      n++;
      return base();
    };
    f.count = () => n;
    return f;
  };

  const draws = (space) => {
    const pop = fixture(20, 11);
    const rng = counted(11);
    I.step(pop, { ...I.DEFAULTS, space }, rng, 0, I.signalRng(11));
    return rng.count();
  };

  const a = draws({ forageRange: Infinity, seedRange: 0.03 });
  const b = draws({ forageRange: Infinity, seedRange: Infinity });
  assert.equal(
    a,
    b,
    `limited and global dispersal consumed ${a} and ${b} random draws — the ` +
      `cells of the 2x2 would be different realisations as well as different ` +
      `models, and no difference between them could be attributed`,
  );
});

/* ------------------------------- 5. the statistic refuses to invent a value */

test("clustering is null when there is no ancestry left to structure", () => {
  const flat = Array.from({ length: 10 }, () => ({ anc: 0.5 }));
  const pos = flat.map((_, i) => i / 10);
  assert.equal(
    I.ancNeighbour(flat, pos),
    null,
    "reported a clustering ratio for a population with no ancestry variance",
  );
  assert.equal(I.ancNeighbour(flat.slice(0, 2), pos.slice(0, 2)), null);
});
