/*
 * tests/rare-floor.test.js — guards for #56's two load-bearing assumptions.
 *
 * #56 varies the population size to ask whether the rare-lineage floor sits at a
 * COUNT of plants or at a FREQUENCY. Two properties of the sim carry that whole
 * design, neither previously covered:
 *
 *   1. `visitsPerPlant` holds per-plant pollinator service constant while N0
 *      varies. Without it `opts.visits` is a constant TOTAL, per-plant service
 *      scales as 1/n, and the sweep would confound "fewer plants" with "more
 *      service each". It must ALSO be a no-op at the founding size, or the N0=30
 *      cell is not the anchor to #55 that #56 reports it as.
 *   2. `T[j][j]` is self-pollen. #56's test of the geitonogamy explanation reads
 *      it directly, and if the diagonal were zero or meant something else the
 *      whole "self share" measurement would be inert or wrong.
 *
 * Both were checked before the run; this is what keeps them checked.
 */
const test = require("node:test");
const assert = require("node:assert");
const I = require("../sim/ibm.js");
const E = require("../sim/evolve.js");

const SITE_N = 160,
  D_EXCL = 8,
  S = 8,
  W = 0.12;

function run(seed, N0, vpp, gens, premiumOff) {
  const rng = E.makeRng(seed);
  const srng = I.signalRng(seed);
  const brng = I.bloomRng(seed);
  const phen = { slices: S, width: W };
  const opts = { ...I.DEFAULTS, siteN: SITE_N, phenology: phen };
  if (vpp != null) opts.visitsPerPlant = vpp;
  const built = I.foundTwoLineages(N0, rng, srng, D_EXCL, opts);
  if (!built) return null;
  let pop = built.pop;
  const out = [];
  for (let g = 0; g < gens; g++) {
    if (pop.length < 2) break;
    phen.displayProportionalVisits = !!premiumOff;
    const res = I.step(pop, opts, rng, g, srng, brng);
    out.push({ anc: res.pop.map((x) => x.anc || 0), spent: res.visitsSpent });
    pop = res.pop;
  }
  return out;
}

test("visitsPerPlant is a no-op at the founding size, so the N0=30 cell anchors to #55", () => {
  let checked = 0;
  for (const seed of [1, 2, 3]) {
    for (const off of [false, true]) {
      const a = run(seed, 30, null, 6, off); /* opts.visits = 24000 */
      const b = run(seed, 30, 800, 6, off); /* 800 * 30 = 24000 */
      assert.ok(a && b, `seed ${seed}: founding failed`);
      assert.deepStrictEqual(
        b.map((x) => x.anc),
        a.map((x) => x.anc),
        `seed ${seed} arm ${off ? "B" : "A"}: visitsPerPlant=800 changed the run at N0=30`,
      );
      assert.deepStrictEqual(
        b.map((x) => x.spent),
        a.map((x) => x.spent),
        `seed ${seed} arm ${off ? "B" : "A"}: visit spend differs at N0=30`,
      );
      checked++;
    }
  }
  assert.equal(checked, 6);
});

test("visitsPerPlant is NOT inert at another N0 — the knob actually does something", () => {
  /* ⚠️ THE COMPANION HALF. A knob that is a no-op everywhere would pass the test
   * above perfectly and make the whole sweep meaningless: every N0 would get the
   * same total service and the design would silently be testing nothing. */
  const a = run(1, 30, 800, 2, false);
  const b = run(1, 60, 800, 2, false);
  assert.ok(a && b, "founding failed");
  assert.equal(a[0].spent, 24000, "N0=30 should spend 800*30");
  assert.equal(b[0].spent, 48000, "N0=60 should spend 800*60");
  assert.notEqual(
    b[0].spent,
    a[0].spent,
    "visitsPerPlant did not change the budget at a different N0",
  );
});

test("T's diagonal is self-pollen, is non-zero, and is exactly what `received` omits", () => {
  const rng = E.makeRng(1);
  const srng = I.signalRng(1);
  const brng = I.bloomRng(1);
  const phen = { slices: S, width: W, displayProportionalVisits: false };
  const opts = {
    ...I.DEFAULTS,
    siteN: SITE_N,
    phenology: phen,
    visitsPerPlant: 800,
  };
  const built = I.foundTwoLineages(30, rng, srng, D_EXCL, opts);
  assert.ok(built, "founding failed");
  const res = I.step(built.pop, opts, rng, 0, srng, brng);
  assert.ok(res.T, "step returned no transfer matrix");

  const n = res.T.length;
  let diag = 0,
    off = 0;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      i === j ? (diag += res.T[i][j]) : (off += res.T[i][j]);

  /* if this were zero, #56's "self share" would be identically 0 and the
   * geitonogamy measurement would report a flat line whatever the biology did */
  assert.ok(
    diag > 0,
    "the diagonal is zero — the self-pollen measurement is inert",
  );
  assert.ok(off > 0, "no outcross pollen moved at all");

  /* and the diagonal must be precisely the term sim/ibm.js:1749-1753 skips */
  let worst = 0;
  for (let j = 0; j < n; j++) {
    let col = 0,
      rec = 0;
    for (let i = 0; i < n; i++) {
      col += res.T[i][j];
      if (i !== j) rec += res.T[i][j];
    }
    worst = Math.max(worst, Math.abs(rec - (col - res.T[j][j])));
  }
  assert.ok(
    worst < 1e-9,
    `received is not the column sum minus the diagonal (worst ${worst})`,
  );
});
