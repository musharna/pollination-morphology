/*
 * tests/rare-advantage.test.js — guards for #55's instrument.
 *
 * #55 needs to know WHO ACTUALLY MATED, which nothing in the sim reported. The
 * instrument is `opts.logMatings`: `step` returns the realised (mother, father)
 * of every offspring, null unless asked for. Three properties carry the whole
 * experiment, and none of them was covered:
 *
 *   1. It is INERT. Every result published before it existed must be
 *      reproducible with it compiled in, whether the flag is on or off — so the
 *      flag must consume no random numbers and change no branch.
 *   2. It is COMPLETE. One record per offspring, in the same order, or any
 *      per-plant quantity indexed against it is silently misaligned.
 *   3. It is CORRECT. `anc` is the parental mean, so the recorded pair must
 *      reproduce every offspring's `anc` exactly.
 *
 * ⚠️ PROPERTY 3 NEEDS PARENTS THAT DIFFER, AND THE OBVIOUS TEST HAS NONE. Under
 * the premium almost every mating is within lineage, so anc_mother ===
 * anc_father and a recorder that wrote the MOTHER into the father's slot
 * reproduces every offspring exactly. That mutant survived the first version of
 * this check across 2,880 offspring. The population here is therefore given
 * SPREAD ancestry on purpose, and the test asserts a floor on how many recorded
 * pairs actually differ — a coverage number, so the check cannot quietly lose
 * its teeth again.
 */
const test = require("node:test");
const assert = require("node:assert");
const I = require("../sim/ibm.js");
const E = require("../sim/evolve.js");

const N0 = 24;
const SITE_N = 120;
const D_EXCL = 8;
const S = 8;
const W = 0.12;

function setup(seed, logMatings, spreadAncestry) {
  const rng = E.makeRng(seed);
  const srng = I.signalRng(seed);
  const brng = I.bloomRng(seed);
  const phen = { slices: S, width: W };
  const opts = { ...I.DEFAULTS, siteN: SITE_N, phenology: phen };
  if (logMatings) opts.logMatings = true;
  const built = I.foundTwoLineages(N0, rng, srng, D_EXCL, opts);
  if (!built) return null;
  const pop = built.pop;
  if (spreadAncestry)
    /* `anc` is a passive label that reads nothing and decides nothing
     * (sim/ibm.js:431-449), so giving it distinct values per plant changes no
     * dynamics — it only makes a mis-recorded parent detectable. */
    for (let i = 0; i < pop.length; i++)
      pop[i].anc = (i + 1) / (pop.length + 1);
  return { pop, opts, phen, rng, srng, brng };
}

function march(s, gens) {
  let pop = s.pop;
  const out = [];
  for (let g = 0; g < gens; g++) {
    if (pop.length < 2) break;
    s.phen.displayProportionalVisits = false; /* premium on */
    const res = I.step(pop, s.opts, s.rng, g, s.srng, s.brng);
    out.push({
      parents: pop.map((x) => x.anc || 0),
      anc: res.pop.map((x) => x.anc || 0),
      matings: res.matings,
    });
    pop = res.pop;
  }
  return out;
}

test("logMatings is null unless asked for, and one record per offspring when it is", () => {
  const off = setup(3, false, false);
  const on = setup(3, true, false);
  assert.ok(off && on, "founding failed");
  const a = march(off, 4);
  const b = march(on, 4);
  for (const gen of a)
    assert.equal(gen.matings, null, "matings recorded without opts.logMatings");
  for (const gen of b) {
    assert.ok(Array.isArray(gen.matings), "opts.logMatings did not record");
    assert.equal(
      gen.matings.length,
      gen.anc.length,
      "one record per offspring is required or every per-plant index misaligns",
    );
  }
});

test("turning logMatings on changes nothing about the run", () => {
  for (const seed of [1, 2, 3]) {
    const off = setup(seed, false, false);
    const on = setup(seed, true, false);
    assert.ok(off && on, `seed ${seed}: founding failed`);
    assert.deepStrictEqual(
      march(on, 6).map((x) => x.anc),
      march(off, 6).map((x) => x.anc),
      `seed ${seed}: the flag perturbed the run, so it is not an observation`,
    );
  }
});

test("the recorded pair reproduces every offspring's ancestry exactly", () => {
  let checked = 0;
  let differing = 0;
  for (const seed of [1, 2, 3, 4]) {
    const s = setup(seed, true, true);
    assert.ok(s, `seed ${seed}: founding failed`);
    for (const gen of march(s, 5)) {
      const P = gen.parents;
      for (let i = 0; i < gen.anc.length; i++) {
        const m = gen.matings[i];
        const pm = P[m.m] || 0,
          pf = P[m.f] || 0;
        if (pm !== pf) differing++;
        assert.ok(
          Math.abs((pm + pf) / 2 - gen.anc[i]) < 1e-12,
          `seed ${seed} offspring ${i}: pair (${m.m},${m.f}) gives ${(pm + pf) / 2}, run gave ${gen.anc[i]}`,
        );
        checked++;
      }
    }
  }
  assert.ok(checked > 200, `only ${checked} offspring checked`);
  /* ⚠️ THE COVERAGE FLOOR. Only pairs whose parents DIFFER can catch a
   * mis-recorded parent; without this the assertion above passes on a recorder
   * that writes the mother twice.
   *
   * The floor sits well below what this configuration actually produces
   * (185/480 measured): reproductive skew makes many offspring share a parent
   * pair, so identical `anc` values recur in later generations and the fraction
   * is nowhere near 1. What the floor must exclude is the DEGENERATE case — an
   * arm-A-like population where every mating is within lineage and the count is
   * zero. */
  assert.ok(
    differing > 0.2 * checked && differing > 50,
    `only ${differing}/${checked} pairs had differing parents — this check cannot detect a wrong parent`,
  );
});

test("a selfed offspring records a pair that reproduces its ancestry too", () => {
  /* selfing is off in #52-#55, so this path is otherwise untested here; it is
   * the branch where the recorded father is the MOTHER by design, and the
   * identity has to hold there as well. */
  const rng = E.makeRng(7);
  const srng = I.signalRng(7);
  const brng = I.bloomRng(7);
  const phen = { slices: S, width: W };
  const opts = {
    ...I.DEFAULTS,
    siteN: SITE_N,
    phenology: phen,
    logMatings: true,
    selfing: { ...(I.DEFAULTS.selfing || {}), always: true, cost: 0 },
  };
  const built = I.foundTwoLineages(N0, rng, srng, D_EXCL, opts);
  if (!built)
    return; /* founding is a search and may fail; not this test's job */
  const pop = built.pop;
  for (let i = 0; i < pop.length; i++) pop[i].anc = (i + 1) / (pop.length + 1);
  phen.displayProportionalVisits = false;
  const res = I.step(pop, opts, rng, 0, srng, brng);
  assert.ok(Array.isArray(res.matings), "no matings recorded");
  assert.equal(res.matings.length, res.pop.length, "one record per offspring");
  for (let i = 0; i < res.pop.length; i++) {
    const m = res.matings[i];
    const pred = ((pop[m.m].anc || 0) + (pop[m.f].anc || 0)) / 2;
    assert.ok(
      Math.abs(pred - (res.pop[i].anc || 0)) < 1e-12,
      `selfed offspring ${i}: pair (${m.m},${m.f}) gives ${pred}, run gave ${res.pop[i].anc}`,
    );
  }
});
