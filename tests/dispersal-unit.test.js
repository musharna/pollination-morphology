/*
 * Tests for the pollen-dispersal unit (roadmap E).
 *
 * The calibration gate is Johnson & Harder 2023 (10.1098/rspb.2023.1148): a
 * CROSSED pair of results across 228 species — removal <45% for solid pollinia
 * against >80% for granular monads, while transfer efficiency runs 27.0%
 * against 2.4%. A model reproduces that only if ONE mechanism drives both, so
 * what has to be pinned is the mechanism's shape, not the fitted numbers:
 *
 *   1. the reduction — "granular" must leave every earlier result bit-identical;
 *   2. all-or-nothing removal — a pollinium leaves whole or not at all;
 *   3. removal is controlled by viscidium, monotonically;
 *   4. mass accounting — counts stay in GRAINS across both packagings, which is
 *      the only reason the two are comparable at all;
 *   5. what the transfer advantage actually is — coherence wins ~1.6x at matched
 *      removal AND matched loss, and adhesion adds to it. SEED-AVERAGED: the
 *      first version used one seed, asserted the opposite, and passed on noise;
 *   6. a pollinium needs a finite pool, because it IS the flower's pollen.
 */

const test = require("node:test");
const assert = require("node:assert");
const P = require("../sim/placement.js");
const C = require("../sim/carryover.js");

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

const removal = (r) => {
  let rel = 0,
    com = 0;
  for (let i = 0; i < SITES.length; i++) {
    rel += r.released[i];
    com += r.flowersUsed[i] * POOL;
  }
  return com > 0 ? rel / com : 0;
};
const transfer = (r) => {
  let rel = 0,
    del = 0;
  for (let i = 0; i < SITES.length; i++) {
    rel += r.released[i];
    del += r.T[i][i];
  }
  return rel > 0 ? del / rel : null;
};

/* 1 ---------------------------------------------------------------------- */
test("granular is the default and is bit-identical to the pre-pollinium bout", () => {
  const base = run({ presentRate: 0.05 });
  const same = run({ presentRate: 0.05, dispersalUnit: "granular" });
  assert.deepStrictEqual([...same.T[0]], [...base.T[0]]);
  assert.deepStrictEqual([...same.T[1]], [...base.T[1]]);
  assert.strictEqual(same.produced, base.produced);
  assert.strictEqual(same.groomedOff, base.groomedOff);

  /* Control: the harness must be able to SEE the other packaging, or the
   * equality above is vacuous. */
  const pol = run({
    presentRate: 1.0,
    dispersalUnit: "pollinium",
    viscidium: 0.5,
  });
  assert.ok(pol.produced > 0 && pol.produced !== base.produced);
});

/* 2 ---------------------------------------------------------------------- */
test("a pollinium leaves the anther whole or not at all", () => {
  const r = run({
    presentRate: 1.0,
    dispersalUnit: "pollinium",
    viscidium: 0.4,
    groom: 0,
    harvest: 0,
  });
  /* Every removal event takes the entire remaining pool, and the pool is only
   * ever refilled to POOL, so released must be a whole number of pools. */
  for (let i = 0; i < SITES.length; i++) {
    const n = r.released[i] / POOL;
    assert.ok(
      Math.abs(n - Math.round(n)) < 1e-9,
      `species ${i} released ${r.released[i]}, not a whole number of ${POOL}-grain masses`,
    );
  }
  assert.ok(r.released[0] > 0, "nothing was ever removed");
});

/* 3 ---------------------------------------------------------------------- */
test("removal efficiency rises monotonically with the viscidium tolerance", () => {
  const got = [0.2, 0.35, 0.6, 1.0, 2.0].map((viscidium) =>
    removal(run({ presentRate: 1.0, dispersalUnit: "pollinium", viscidium })),
  );
  for (let i = 1; i < got.length; i++)
    assert.ok(
      got[i] >= got[i - 1] - 1e-9,
      `removal fell as the tolerance widened: ${got.map((x) => x.toFixed(3)).join(" ")}`,
    );
  assert.ok(
    got[got.length - 1] > 2 * got[0],
    `tolerance barely moves removal: ${got.map((x) => x.toFixed(3)).join(" ")}`,
  );
});

/* 4 ---------------------------------------------------------------------- */
test("counts stay in grains across both packagings", () => {
  const r = run({
    presentRate: 1.0,
    dispersalUnit: "pollinium",
    viscidium: 0.6,
    harvest: 0,
  });
  let del = 0;
  for (let i = 0; i < SITES.length; i++)
    for (let j = 0; j < SITES.length; j++) del += r.T[i][j];
  /* Delivered grains can never exceed grains removed, and a unit-vs-grain
   * accounting slip would break this immediately. */
  const rel = r.released[0] + r.released[1];
  assert.ok(del <= rel + 1e-9, `delivered ${del} exceeds released ${rel}`);
  assert.ok(del > 0);
  /* And delivery must arrive in whole masses when nothing is lost en route. */
  const clean = run({
    presentRate: 1.0,
    dispersalUnit: "pollinium",
    viscidium: 0.6,
    groom: 0,
    harvest: 0,
  });
  let d2 = 0;
  for (let i = 0; i < SITES.length; i++)
    for (let j = 0; j < SITES.length; j++) d2 += clean.T[i][j];
  assert.ok(Math.abs(d2 / POOL - Math.round(d2 / POOL)) < 1e-9);
});

/* 5 ---------------------------------------------------------------------- */
test("coherence is a real advantage at matched removal, and adhesion adds to it", () => {
  /*
   * ⚠️ SEED-AVERAGED, AND THAT IS THE POINT. The first version of this test used
   * ONE seed and asserted that coherence LOSES. It passed — on noise. Measured
   * over twelve seeds the effect is a ~1.6x ADVANTAGE, and seed 7 is simply an
   * outlier. A single-seed assertion about a stochastic quantity can lock in the
   * opposite of the truth and still go green, which is worse than no test.
   */
  const SEEDS = [3, 11, 29, 47, 61, 73, 89, 101, 113, 127, 139, 151];
  const avg = (o) => {
    const rem = [],
      pte = [];
    for (const seed of SEEDS) {
      const r = C.runBout(SITES, AB, {
        visits: 6000,
        seed,
        pollenPerFlower: POOL,
        visitsPerFlower: 25,
        ...o,
      });
      rem.push(removal(r));
      const t = transfer(r);
      if (t !== null) pte.push(t);
    }
    const m = (x) => x.reduce((a, b) => a + b, 0) / x.length;
    return { removal: m(rem), transfer: m(pte) };
  };

  const pol = avg({
    presentRate: 1.0,
    dispersalUnit: "pollinium",
    viscidium: 0.25,
    groom: 0.3,
    harvest: 0,
  });
  assert.ok(
    pol.removal > 0.05 && pol.removal < 0.6,
    `pollinium removal off-scale at ${pol.removal}`,
  );

  /* Granular starved to the same removal, and at the SAME loss rates — harvest
   * must match, or the comparison credits non-harvestability to coherence. */
  let best = null;
  for (const v of [12, 8, 5, 3, 2]) {
    const g = avg({ presentRate: 0.05, visitsPerFlower: v, groom: 0.3, harvest: 0 });
    if (!best || Math.abs(g.removal - pol.removal) < Math.abs(best.removal - pol.removal))
      best = { ...g, v };
  }
  assert.ok(
    Math.abs(best.removal - pol.removal) < 0.15,
    `could not match removal: ${pol.removal.toFixed(3)} vs ${best.removal.toFixed(3)}`,
  );
  assert.ok(
    pol.transfer > 1.2 * best.transfer,
    `coherence should win at matched removal and matched loss: ${pol.transfer.toFixed(4)} vs ${best.transfer.toFixed(4)}`,
  );

  /* Adhesion adds to it — the negative half, so the claim is two-sided. */
  const glued = avg({
    presentRate: 1.0,
    dispersalUnit: "pollinium",
    viscidium: 0.25,
    groom: 0.05,
    harvest: 0,
  });
  assert.ok(
    glued.transfer > pol.transfer,
    `adhesion should add: ${glued.transfer.toFixed(4)} vs ${pol.transfer.toFixed(4)}`,
  );
});

/* 6 ---------------------------------------------------------------------- */
test("a pollinium requires a finite pool", () => {
  assert.throws(
    () =>
      C.runBout(SITES, AB, {
        visits: 100,
        dispersalUnit: "pollinium",
        pollenPerFlower: Infinity,
      }),
    /finite/,
  );
});
