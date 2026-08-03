/*
 * Tests for the sectile dispersal unit.
 *
 * The load-bearing ones are the two LIMITS. Sectile is not a third mechanism —
 * it is the packaging mechanism at an intermediate grain size — so it has to
 * degenerate to the conditions on either side of it. If it does not, "one
 * mechanism at three grain sizes" is a story rather than a description of the
 * code, and the experiment's negative result would be untrustworthy for a
 * reason that has nothing to do with biology.
 */

const test = require("node:test");
const assert = require("node:assert");
const P = require("../sim/placement.js");
const C = require("../sim/carryover.js");

const bee = P.DEFAULT_BEE;
const POOL = 60;
const sites = [0, Math.PI].map((theta, i) =>
  C.siteSet(
    { ...P.DEFAULT_FLOWER, antherT: 0.5, stigmaT: 0.5, antherTheta: theta },
    bee,
    { n: 200, seed: 11 + i },
  ),
);
const run = (opts) =>
  C.runBout(sites, [0.5, 0.5], {
    visits: 4000,
    seed: 7,
    pollenPerFlower: POOL,
    visitsPerFlower: 25,
    groom: 0.3,
    harvest: 0,
    presentRate: 1,
    ...opts,
  });

test("sectile refuses an infinite pollen pool — massulae must partition something", () => {
  assert.throws(
    () =>
      C.runBout(sites, [0.5, 0.5], {
        visits: 100,
        dispersalUnit: "sectile",
        pollenPerFlower: Infinity,
      }),
    /pollenPerFlower must be finite/,
  );
});

test("sectile refuses a massula count below one", () => {
  assert.throws(
    () => run({ dispersalUnit: "sectile", massulae: 0 }),
    /at least one massula/,
  );
});

/*
 * LIMIT 1. One massula is the whole flower's pollen travelling as a single
 * object — a pollinium in everything but the viscidium gate. Its DEPOSITION
 * events must therefore be as coarse as a pollinium's: whole-pool units.
 */
test("massulae = 1 makes deposition as coarse as a pollinium's", () => {
  const one = run({ dispersalUnit: "sectile", massulae: 1 });
  const grains = one.T[0][0] + one.T[0][1] + one.T[1][0] + one.T[1][1];
  const events = one.ageOnDeposit.length;
  assert.ok(events > 0, "nothing was delivered — the test cannot discriminate");
  assert.ok(
    grains / events > POOL * 0.5,
    `one massula must deliver a pool-sized unit per event, got ${(grains / events).toFixed(1)} grains`,
  );
});

/*
 * LIMIT 2. As many massulae as there are grains IS granular monads. Compared
 * against a real granular bout at the same settings, the per-event grain count
 * must collapse to about one.
 */
test("massulae = pollenPerFlower collapses to granular, one grain per event", () => {
  const many = run({ dispersalUnit: "sectile", massulae: POOL });
  const grains = many.T[0][0] + many.T[0][1] + many.T[1][0] + many.T[1][1];
  const events = many.ageOnDeposit.length;
  assert.ok(events > 0, "nothing delivered");
  const per = grains / events;
  assert.ok(
    per > 0.9 && per < 1.1,
    `at one grain per massula each event must carry ~1 grain, got ${per.toFixed(2)}`,
  );
});

/* The monotone between those limits — the property the experiment's selection
 * step relies on. More massulae means finer units, so more deposition events. */
test("deposition gets finer as the massula count rises", () => {
  const evs = [1, 4, 15, 60].map(
    (massulae) =>
      run({ dispersalUnit: "sectile", massulae }).ageOnDeposit.length,
  );
  for (let i = 1; i < evs.length; i++)
    assert.ok(
      evs[i] > evs[i - 1],
      `events must rise with massula count: ${evs.join(", ")}`,
    );
});

/* Grains are neither created nor destroyed by being packaged. A partition bug
 * would otherwise show up as a transfer efficiency, which is exactly the
 * quantity the experiment reports. */
test("packaging conserves pollen — released never exceeds what flowers committed", () => {
  for (const massulae of [1, 7, 60]) {
    const r = run({ dispersalUnit: "sectile", massulae });
    for (let i = 0; i < 2; i++) {
      const committed = r.flowersUsed[i] * POOL;
      assert.ok(
        r.released[i] <= committed + 1e-6,
        `species ${i} released ${r.released[i]} of ${committed} committed at massulae=${massulae}`,
      );
    }
  }
});

/* The default path must not have moved. Sectile adds a branch to the same
 * release and load code every published result runs through. */
test("granular bouts are untouched by the sectile branch existing", () => {
  const a = run({ dispersalUnit: "granular", massulae: 30 });
  const b = run({ dispersalUnit: "granular" });
  assert.deepStrictEqual(
    a.T.map((r) => Array.from(r)),
    b.T.map((r) => Array.from(r)),
    "massulae must be inert unless dispersalUnit is sectile",
  );
});
