/*
 * Tests for `servicedPairs` — distinct (donor flower, recipient flower) pairs.
 *
 * ⚠️⚠️ WHY IT EXISTS. experiments/sectile.js measured "flowers serviced" as
 * `ageOnDeposit.length / flowersUsed`, which is deposition EVENTS per donor. Two
 * massulae from one donor reaching the same stigma are two events and ONE flower
 * serviced. That counter is what the massula count is SELECTED on against
 * Johnson & Harder's "a few to 20", so the error was not cosmetic: under the old
 * count, massulae 20/30/60 read 3.5/4.1/4.3 and qualified; corrected they read
 * 1.5/1.5/1.0 and NO count qualifies at all.
 *
 * The invariant is an ordering — pairs <= events, always — plus the two regimes
 * where the gap must and must not appear. An ordering test alone would pass for
 * a counter hard-wired to zero, so both ends are pinned.
 */

const test = require("node:test");
const assert = require("node:assert");
const C = require("../sim/carryover.js");
const P = require("../sim/placement.js");

/* the same two-species geometry experiments/sectile.js measures on, so the
 * regimes below are the ones the calibration actually lives in */
const bee = P.DEFAULT_BEE;
const flower = (antherTheta) => ({
  ...P.DEFAULT_FLOWER,
  antherT: 0.5,
  stigmaT: 0.5,
  antherTheta,
});
const SITES = [0, Math.PI].map((th, i) =>
  C.siteSet(flower(th), bee, { n: 200, seed: 11 + i }),
);
const AB = [0.5, 0.5];
const bout = (opts) =>
  C.runBout(SITES, AB, {
    visits: 4000,
    seed: 3,
    pollenPerFlower: 60,
    visitsPerFlower: 25,
    groom: 0.3,
    harvest: 0,
    presentRate: 1.0,
    ...opts,
  });

test("distinct pairs never exceed deposition events", () => {
  for (const opts of [
    {},
    { dispersalUnit: "sectile", massulae: 4 },
    { dispersalUnit: "sectile", massulae: 30 },
    { dispersalUnit: "pollinium" },
  ]) {
    const r = bout(opts);
    assert.ok(
      r.servicedPairs <= r.ageOnDeposit.length,
      `pairs ${r.servicedPairs} exceeded events ${r.ageOnDeposit.length} for ${JSON.stringify(opts)}`,
    );
    /* the positive control: a counter stuck at 0 would satisfy the line above */
    assert.ok(
      r.servicedPairs > 0,
      `nothing was serviced at all for ${JSON.stringify(opts)}`,
    );
  }
});

test("many small units double up on stigmas, so pairs fall BELOW events", () => {
  /* the regime the sectile calibration lives in, and the reason the old counter
   * was wrong there specifically */
  const r = bout({ dispersalUnit: "sectile", massulae: 30 });
  assert.ok(
    r.servicedPairs < r.ageOnDeposit.length,
    `at 30 massulae the two counters agreed (${r.servicedPairs}), so the ` +
      "doubling-up this field exists to measure is not happening and the test " +
      "is not exercising it",
  );
});

test("a whole-pool unit cannot double up, so pairs EQUAL events", () => {
  /* a solid pollinium is one object: a donor deposits it once and cannot land
   * twice on the same stigma. The two counters must agree exactly — which is
   * also why the old counter looked right for pollinia and wrong for massulae. */
  const r = bout({ dispersalUnit: "pollinium" });
  assert.strictEqual(
    r.servicedPairs,
    r.ageOnDeposit.length,
    "an indivisible unit produced more deposits than donor-recipient pairs",
  );
});

test("the gap widens with the number of units", () => {
  /* monotone in the thing that causes it: more units per donor means more
   * chances that two of them meet the same stigma */
  const ratio = (n) => {
    const r = bout({ dispersalUnit: "sectile", massulae: n });
    return r.servicedPairs / r.ageOnDeposit.length;
  };
  const few = ratio(4);
  const many = ratio(30);
  assert.ok(
    many < few,
    `the deposits-to-pairs gap should grow with unit count: ${few} at 4, ${many} at 30`,
  );
});

test("an inviable grain is counted by neither, so the two stay comparable", () => {
  /* ageOnDeposit is pushed after the viability `continue`, and servicedPairs is
   * added on the same line. If one moved above the check and the other did not,
   * the ordering invariant would still hold and the ratio would silently mean
   * something else — so senescence on, both must still agree for pollinia. */
  const r = bout({ dispersalUnit: "pollinium", pollenLife: 3 });
  assert.strictEqual(r.servicedPairs, r.ageOnDeposit.length);
});
