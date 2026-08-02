/*
 * Tests for the cost of prolonged presentation.
 *
 * The reward work ended by naming a missing mechanism: gradual dispensing bore
 * no penalty in this model except stranding, so once visits were plentiful it
 * could tie but never lose. Two costs are now available — pollen senescence in
 * the anther (Dafni & Firmage 2000, 10.1007/bf00984098) and floral upkeep while
 * open (Ashman & Schoen 1994, 10.1038/371788a0).
 *
 * A cost that merely handicaps gradual dispensing proves nothing: ANY handicap
 * would flip a duel that gradual currently wins. What has to be pinned is the
 * SHAPE of each cost, so the experiment can tell them apart rather than tune
 * one knob until a table looks right. So this file pins, in order:
 *
 *   1. the reduction — pollenLife = Infinity must leave the previous bout
 *      bit-identical, rng stream included;
 *   2. schedule selectivity — senescence must cost a SIMULTANEOUS presenter
 *      exactly nothing, because its residence time is zero. The negative half
 *      is asserted alongside the positive one;
 *   3. the mechanism, not the discount — dead pollen must still occupy stigma
 *      slots, which is what makes senescence more than a multiplier;
 *   4. monotonicity in the decay clock;
 *   5. upkeep accounting, exactly, and its own selectivity.
 */

const test = require("node:test");
const assert = require("node:assert");
const P = require("../sim/placement.js");
const C = require("../sim/carryover.js");
const R = require("../sim/reward.js");

const bee = P.DEFAULT_BEE;
const POOL = 60;

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

const run = (o) =>
  C.runBout(SITES, AB, {
    visits: 6000,
    seed: 7,
    pollenPerFlower: POOL,
    visitsPerFlower: 25,
    ...o,
  });

const delivered = (r) => r.T[0][0] + r.T[1][1];

/* --------------------------------------------------------------------------
 * 1. The reduction. A new option must contain the old model as a special case,
 *    and "contains" means identical, not similar — senescence adds an rng draw
 *    per grain, so if it were drawn unconditionally every earlier result in the
 *    project would silently move.
 * ------------------------------------------------------------------------ */
test("pollenLife = Infinity is bit-identical to the pre-senescence bout", () => {
  const base = run({ presentRate: 0.05 });
  const same = run({ presentRate: 0.05, pollenLife: Infinity });

  assert.deepStrictEqual(
    [...same.T[0]],
    [...base.T[0]],
    "transfer matrix moved with senescence disabled",
  );
  assert.deepStrictEqual([...same.T[1]], [...base.T[1]]);
  assert.strictEqual(same.produced, base.produced);
  assert.strictEqual(same.groomedOff, base.groomedOff);
  assert.strictEqual(same.senesced, 0);
  assert.strictEqual(same.deadDelivered, 0);

  /* And the control: the same harness must be able to SEE senescence when it
   * is switched on, otherwise the equality above is vacuous. */
  const aged = run({ presentRate: 0.05, pollenLife: 40 });
  assert.ok(
    aged.senesced > 0,
    "harness cannot detect senescence at all — test 1 proves nothing",
  );
});

/* --------------------------------------------------------------------------
 * 2. Schedule selectivity — the property that makes this a mechanism rather
 *    than a thumb on the scale. A flower that empties on the visit it opens
 *    has zero anther residence, so its pollen cannot age. This is exact, not
 *    approximate, so it is asserted exactly.
 * ------------------------------------------------------------------------ */
test("senescence costs a simultaneous presenter exactly nothing", () => {
  const sim = run({ presentRate: 1.0, pollenLife: 40 });
  assert.strictEqual(
    sim.senesced,
    0,
    "a flower emptied on the visit it opened shipped aged pollen",
  );
  assert.strictEqual(sim.deadDelivered, 0);

  /* The positive half, in the same test: the identical clock must bite hard on
   * a gradual presenter. A negative result with no positive control beside it
   * is indistinguishable from a broken harness. */
  const grad = run({ presentRate: 0.05, pollenLife: 40 });
  assert.ok(
    grad.senesced > 0.1 * grad.produced,
    `gradual lost only ${grad.senesced}/${grad.produced} grains to senescence`,
  );

  /* And simultaneous must be unchanged against its OWN no-senescence run, so
   * the zero above is not an artefact of it releasing nothing. */
  const simFree = run({ presentRate: 1.0 });
  assert.strictEqual(delivered(sim), delivered(simFree));
  assert.ok(simFree.produced > 0);
});

/* --------------------------------------------------------------------------
 * 3. Dead pollen crowds live pollen. If inviable grains were simply deleted,
 *    senescence would be a multiplier on delivery and nothing more. They are
 *    not: they land, fill a slot, and fail to sire. The stigma should therefore
 *    still be taking about as many grains as before — they are just worth less.
 * ------------------------------------------------------------------------ */
test("inviable grains still occupy stigma slots", () => {
  const free = run({ presentRate: 0.05, pickup: 5 });
  const aged = run({ presentRate: 0.05, pickup: 5, pollenLife: 40 });

  assert.ok(aged.deadDelivered > 0, "no dead pollen reached a stigma");
  assert.ok(
    delivered(aged) < delivered(free),
    "senescence did not reduce siring",
  );

  /* Slots filled, viable or not, should be close to the slots filled before.
   * Not exact — dead grains change which grains are nearest and in what order
   * — but far closer than the drop in siring alone. */
  const slotsFree = delivered(free) + free.T[0][1] + free.T[1][0];
  const slotsAged =
    delivered(aged) + aged.T[0][1] + aged.T[1][0] + aged.deadDelivered;
  assert.ok(
    Math.abs(slotsAged - slotsFree) / slotsFree < 0.15,
    `stigma slots not conserved: ${slotsFree} -> ${slotsAged}`,
  );
});

/* --------------------------------------------------------------------------
 * 4. Monotone in the clock. A longer-lived grain must sire more.
 * ------------------------------------------------------------------------ */
test("siring rises monotonically with pollen lifetime", () => {
  const got = [10, 25, 60, 150, Infinity].map((pollenLife) =>
    delivered(run({ presentRate: 0.05, pollenLife })),
  );
  for (let i = 1; i < got.length; i++)
    assert.ok(
      got[i] >= got[i - 1],
      `siring fell as pollen lived longer: ${got.join(" ")}`,
    );
  assert.ok(
    got[got.length - 1] > 1.5 * got[0],
    `clock has almost no effect: ${got.join(" ")}`,
  );
});

/* --------------------------------------------------------------------------
 * 4b. The carry cap must be VISIBLE when it bites.
 *
 *     Cap truncation used to be added to `groomedOff`, where it was
 *     indistinguishable from ordinary passive loss. That is how a cap
 *     calibrated for an 8-grain deposit went unnoticed while it discarded
 *     ~450k grains under a 60-grain dose — silently deciding a dispensing
 *     experiment against the schedule that loads the animal fastest. The
 *     counter is separate now, and this pins both that separation and the
 *     regime-selectivity that made the artefact so easy to miss.
 * ------------------------------------------------------------------------ */
test("carry-cap losses are counted apart from grooming, and are schedule-selective", () => {
  const EFF = { visitsPerFlower: 25, pickup: 60, groom: 0.03, harvest: 0.03 };

  const sim = run({ ...EFF, presentRate: 1.0 });
  const grad = run({ ...EFF, presentRate: 0.05 });
  assert.ok(
    sim.capTruncated > 0,
    "the cap does not bind where it is known to bind",
  );
  assert.strictEqual(
    grad.capTruncated,
    0,
    "a gradual presenter should never reach the cap in this regime",
  );

  /* Wasteful grooming keeps the load down, so the cap is invisible there. The
   * artefact is specific to ONE cell of the 2x2, which is exactly why it read
   * as a property of that cell rather than as a bug. */
  const wasteful = run({
    visitsPerFlower: 25,
    groom: 0.3,
    harvest: 0.35,
    presentRate: 1.0,
  });
  assert.strictEqual(wasteful.capTruncated, 0);

  /* And removing the cap must recover the siring it was destroying. */
  const uncapped = run({ ...EFF, presentRate: 1.0, cap: 1e9 });
  assert.strictEqual(uncapped.capTruncated, 0);
  assert.ok(
    delivered(uncapped) > delivered(sim),
    "removing the cap did not increase siring",
  );
});

/* --------------------------------------------------------------------------
 * 5. Upkeep. Charged per visit-open, so it is exactly computable — pinning the
 *    arithmetic keeps the experiment's cost curves honest.
 * ------------------------------------------------------------------------ */
test("upkeep is subtracted exactly, and scales with visits open", () => {
  const r = run({ presentRate: 0.05 });
  const gross = R.netMaleFitness(r, 0, { pool: POOL });
  assert.strictEqual(gross, r.T[0][0] / (r.flowersUsed[0] * POOL));

  const m = 0.01;
  const net = R.netMaleFitness(r, 0, { pool: POOL, maintenance: m });
  const expected = (r.T[0][0] - m * r.visitsTo[0]) / (r.flowersUsed[0] * POOL);
  assert.ok(Math.abs(net - expected) < 1e-12);
  assert.ok(net < gross, "upkeep did not reduce net fitness");

  /* Upkeep per grain committed must be far heavier for a gradual presenter,
   * because it holds a flower open for many visits to shed one pool. That is
   * the sense in which this cost is schedule-selective — and it is the ONLY
   * sense, which is exactly what distinguishes it from senescence. */
  const sim = run({ presentRate: 1.0 });
  const perGrain = (x) => x.visitsTo[0] / (x.flowersUsed[0] * POOL);
  assert.ok(
    perGrain(r) > 5 * perGrain(sim),
    `upkeep not schedule-selective: ${perGrain(r)} vs ${perGrain(sim)}`,
  );
});
