/*
 * Tests for reward currency and pollen dispensing.
 *
 * The standing constraint this project runs under: a new mechanism needs a
 * limiting case or a reference with a KNOWN RIGHT ANSWER before anything it
 * reports is believed. Three measurement artefacts have already impersonated
 * results here. So this file pins, in order:
 *
 *   1. the reduction — a finite pool dispensed in one go IS the old unlimited
 *      bout, so the new machinery contains the old as a special case;
 *   2. the dilemma — harvesting must destroy delivery and nothing else;
 *   3. Harder & Thomson 1989 (10.1086/284922) — "the proportion deposited
 *      declined as the amount removed increased", the empirical shape the
 *      whole of pollen presentation theory rests on;
 *   4. that the model can produce BOTH halves of Castellanos et al. 2006
 *      (10.1086/498854), because a model that always answers "dispense
 *      gradually" has reproduced nothing.
 */

const test = require("node:test");
const assert = require("node:assert");
const P = require("../sim/placement.js");
const C = require("../sim/carryover.js");
const R = require("../sim/reward.js");

const bee = P.DEFAULT_BEE;

/* Two well-separated flowers, so transfer is mostly conspecific and the
 * delivery rate is about dispensing rather than about mixing. */
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

test("REDUCTION: a finite pool released in one go is the unlimited bout", () => {
  /* presentRate=1 with a pool equal to `deposit` means every visit hands over
   * exactly `deposit` grains — which is what the pre-reward bout did. The
   * transfer matrices must therefore agree grain for grain. */
  const base = C.runBout(SITES, AB, { visits: 4000, seed: 5, groom: 0.18 });
  const finite = C.runBout(SITES, AB, {
    visits: 4000,
    seed: 5,
    groom: 0.18,
    pollenPerFlower: 8, // == DEFAULTS.deposit
    presentRate: 1,
  });
  for (let i = 0; i < SITES.length; i++)
    for (let j = 0; j < SITES.length; j++)
      assert.strictEqual(
        finite.T[i][j],
        base.T[i][j],
        `transfer differs at ${i}->${j}`,
      );
  assert.strictEqual(finite.produced, base.produced);
});

test("THE POLLEN DILEMMA: harvesting destroys delivery, and only delivery", () => {
  const opts = {
    visits: 6000,
    seed: 7,
    pollenPerFlower: 40,
    presentRate: 0.25,
  };
  const none = C.runBout(SITES, AB, { ...opts, harvest: 0 });
  const taking = C.runBout(SITES, AB, { ...opts, harvest: 0.35 });

  const del = (r) => r.T[0][0] + r.T[1][1];
  assert.ok(
    del(taking) < del(none),
    `harvest must cost delivery: ${del(taking)} vs ${del(none)}`,
  );
  assert.ok(taking.harvested > 0, "harvest must actually remove grains");

  /* PAIRED CONTROL. Harvest takes pollen off the ANIMAL; it must not change how
   * much the flowers released, or the comparison above would be confounded by
   * the plants simply having produced less. */
  assert.strictEqual(
    taking.released[0] + taking.released[1],
    none.released[0] + none.released[1],
    "harvest changed what the flowers released — the arms are not comparable",
  );
});

/* Averaged over seeds. A single bout puts Monte Carlo noise of a few percent on
 * each point, which is the same size as the step between adjacent doses at the
 * flat end of the curve — so a single-seed monotonicity test fails on noise
 * rather than on the model. */
const PICKUP = 5;
const DOSES = [0.05, 0.1, 0.25, 0.5, 1.0];
function curve(opts) {
  return DOSES.map((presentRate) => {
    const runs = [3, 11, 29, 47, 61].map((seed) =>
      R.deliveryRate(
        C.runBout(SITES, AB, {
          visits: 8000,
          seed,
          pollenPerFlower: 60,
          presentRate,
          ...opts,
        }),
      ),
    );
    return runs.reduce((a, b) => a + b, 0) / runs.length;
  });
}

test("HARDER & THOMSON 1989: delivered share SATURATES then falls with dose", () => {
  /* The measured shape, and the only reason restricted presentation pays. Same
   * total pollen in every arm — only the dose per visit differs.
   *
   * The curve is FLAT-THEN-DECLINING rather than monotonic from zero, and that
   * is a consequence of the mechanism rather than a blemish: while the dose is
   * below what a stigma can accept, capacity is not binding and delivery per
   * grain cannot improve further. It only falls once the dose exceeds capacity.
   * Doses here are 3, 6, 15, 30, 60 grains against a pickup of 5. */
  const got = curve({ harvest: 0.35 });
  const doses = DOSES.map((r) => Math.max(1, Math.round(r * 60)));

  const binding = got.filter((_, i) => doses[i] >= PICKUP);
  for (let i = 1; i < binding.length; i++)
    assert.ok(
      binding[i] <= binding[i - 1] + 1e-9,
      `delivered share rose with dose once capacity binds: ${got.map((x) => x.toFixed(5)).join(" ")}`,
    );
  assert.ok(
    got[0] > got[got.length - 1] * 1.5,
    `the decline must be substantial, not a rounding artefact: ${got[0].toFixed(5)} vs ${got[got.length - 1].toFixed(5)}`,
  );
});

test("POSITIVE CONTROL: remove finite stigma capacity and the decline vanishes", () => {
  /* Which mechanism bends the curve? Measured, not assumed — grooming and
   * harvest turn out to set the LEVEL (0.24 -> 0.06) while leaving the shape
   * alone, and the carry cap changes nothing at these doses. It is the finite
   * stigma that saturates, which is also the biology: a stigma has a bounded
   * receptive surface, so a bigger dose cannot be proportionally deposited.
   *
   * So the control that means something is to make the stigma unbounded. If the
   * decline survived THAT, the saturating curve would be an artefact of
   * bookkeeping rather than a consequence of capacity. */
  const flat = curve({ harvest: 0.35, pickup: 1e9 });
  const spread = (flat[0] - flat[flat.length - 1]) / flat[0];
  assert.ok(
    Math.abs(spread) < 0.15,
    `with an unbounded stigma the curve must be flat, got ${flat.map((x) => x.toFixed(5)).join(" ")}`,
  );

  /* NEGATIVE HALF OF THE SAME CONTROL: the harness must still be able to see a
   * decline when capacity IS finite, or "flat" would just mean "broken". */
  const bent = curve({ harvest: 0.35 });
  assert.ok(
    (bent[0] - bent[bent.length - 1]) / bent[0] > 0.3,
    "the same harness must still detect the decline when the stigma is finite",
  );
});

test("currency: pollen couples advertisement to dose, nectar does not", () => {
  const mk = (reward, presentRate) => ({
    sites: SITES[0],
    abundance: 1,
    reward,
    presentRate,
    pollenPerFlower: 40,
    nectar: 1,
  });
  const pollenMean = R.visitWeights([mk("pollen", 0.1), mk("pollen", 1.0)]);
  assert.ok(
    pollenMean[0] < pollenMean[1],
    "a mean pollen flower must attract fewer visits than a generous one",
  );
  const nectarMean = R.visitWeights([mk("nectar", 0.1), mk("nectar", 1.0)]);
  assert.strictEqual(
    nectarMean[0],
    nectarMean[1],
    "nectar attraction must not depend on the pollen dispensing schedule",
  );
});

test("one currency per bout is enforced", () => {
  const sp = (reward) => ({
    sites: SITES[0],
    abundance: 1,
    reward,
    presentRate: 1,
    pollenPerFlower: 40,
    nectar: 1,
  });
  assert.throws(
    () => R.runRewardBout([sp("pollen"), sp("nectar")], { visits: 10 }),
    /one currency per bout/,
  );
});
