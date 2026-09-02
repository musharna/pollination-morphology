/*
 * tests/rarity-premium.test.js — guards for #52's instrument.
 *
 * #52 asks whether roadmap B's positive rests on the per-slice rarity premium,
 * and the answer is read off `visitsPerSlice`, added to `step` for this run.
 * These cover the invariants that reading depends on. What they do NOT cover is
 * stated at the bottom rather than left for a reader to discover.
 *
 * ⚠️ The slice-count assertions are the point of the extraction. `sliceCountOf`
 * exists because the vector has to be sized before the phenology block computes
 * its own `S`, and two copies of `Math.max(2, PH.slices | 0 || 8)` a thousand
 * lines apart is the exact shape of the #49 defect, where the occupancy count
 * and the display map drifted apart. A test that only checked the default would
 * pass on two copies that disagree everywhere else, so every branch of the
 * expression is exercised: absent, 0, below the floor, and ordinary values.
 */
const test = require("node:test");
const assert = require("node:assert");
const I = require("../sim/ibm.js");
const E = require("../sim/evolve.js");

const N0 = 24;
const SITE_N = 120;
const D_EXCL = 8;

function oneStep(seed, phen) {
  const rng = E.makeRng(seed);
  const srng = I.signalRng(seed);
  const brng = I.bloomRng(seed);
  const opts = { ...I.DEFAULTS, siteN: SITE_N, phenology: phen };
  const built = I.foundTwoLineages(N0, rng, srng, D_EXCL, opts);
  if (!built) return null;
  return I.step(built.pop, opts, rng, 0, srng, brng);
}

/* which slices carry display, from the model's own ring predicate rather than a
 * reimplementation of it */
function occupancy(blooms, S, width) {
  const cnt = new Array(S).fill(0);
  for (const b of blooms)
    for (let k = 0; k < S; k++) if (I.ringDist(b, k / S) <= width / 2) cnt[k]++;
  return cnt;
}

test("visitsPerSlice is sized by the SAME slice count the season uses", () => {
  /* [requested, effective] — covers the default, the explicit 0 that `|| 8`
   * also catches, and the floor at 2 */
  for (const [req, eff] of [
    [undefined, 8],
    [0, 8],
    [1, 2],
    [2, 2],
    [8, 8],
    [16, 16],
  ]) {
    const phen = { width: 0.12 };
    if (req !== undefined) phen.slices = req;
    const res = oneStep(3, phen);
    assert.ok(res, "population should build");
    assert.strictEqual(
      res.visitsPerSlice.length,
      eff,
      `slices:${String(req)} should give ${eff} entries`,
    );
  }
});

test("visitsPerSlice totals to visitsSpent, in both arms", () => {
  for (const dpv of [false, true]) {
    const res = oneStep(5, {
      slices: 8,
      width: 0.12,
      ...(dpv ? { displayProportionalVisits: true } : {}),
    });
    assert.ok(res, "population should build");
    const tot = Array.from(res.visitsPerSlice).reduce((a, b) => a + b, 0);
    assert.strictEqual(
      tot,
      res.visitsSpent,
      `arm dpv=${dpv}: the per-slice split must account for every visit spent`,
    );
    /* ⚠️ and the sum must not be trivially zero, or the equality above holds on
     * a run where nothing happened */
    assert.ok(tot > 0, `arm dpv=${dpv}: some visits should have been spent`);
  }
});

test("a slice carrying no display receives no visits — and one carrying display does", () => {
  const S = 8;
  const W = 0.12;
  const res = oneStep(7, { slices: S, width: W });
  assert.ok(res, "population should build");
  const cnt = occupancy(res.blooms, S, W);
  let empty = 0;
  let filled = 0;
  for (let k = 0; k < S; k++) {
    if (cnt[k] === 0) {
      assert.strictEqual(
        res.visitsPerSlice[k],
        0,
        `slice ${k} has no display and must receive nothing`,
      );
      empty++;
    } else if (res.visitsPerSlice[k] > 0) filled++;
  }
  /*
   * ⚠️⚠️ THE POSITIVE CONTROL, IN THE SAME TEST. The assertion above is
   * satisfied by an all-zero vector — by a season that never ran at all — so it
   * is worth nothing without a cell where the quantity is NOT zero. At width
   * 0.12 with 24 plants over 8 slices both kinds of slice exist, and both are
   * required to.
   */
  assert.ok(empty > 0, "this configuration should leave some slice empty");
  assert.ok(filled > 0, "and should fill others");
});

test("the ablation redistributes the same budget instead of flattening or growing it", () => {
  const S = 8;
  const W = 0.12;
  const base = { slices: S, width: W };
  const off = oneStep(11, base);
  const on = oneStep(11, { ...base, displayProportionalVisits: true });
  assert.ok(off && on, "both arms should build");

  const occupied = (r) =>
    Array.from(r.visitsPerSlice).filter((_, k) => r.visitsPerSlice[k] > 0);

  /* ⚠️ THE BUDGET GUARD, which #51 needed after the first version of this
   * ablation spent the visits the unablated arm discards. Same total, moved. */
  assert.strictEqual(
    on.visitsSpent,
    off.visitsSpent,
    "the ablation must redistribute the same total, not spend a larger one",
  );

  /* BOTH DIRECTIONS. Flat under the constant per-slice budget — that is the
   * premium, stated as a fact about the vector — and NOT flat once visits
   * follow display. Asserting only one of these could not tell a working flag
   * from a flag that never ran. */
  const vOff = occupied(off);
  const vOn = occupied(on);
  assert.ok(
    vOff.length >= 3 && vOn.length >= 3,
    "need several occupied slices",
  );
  assert.strictEqual(
    Math.min(...vOff),
    Math.max(...vOff),
    "unablated: every slice carrying display gets the SAME number of visits",
  );
  assert.ok(
    Math.max(...vOn) > Math.min(...vOn),
    "ablated: visits must vary with the display each slice carries",
  );
});

/*
 * ⚠️ NOT COVERED, deliberately, rather than named and left hollow:
 *
 * `emptyVisitSlices` — a slice that carries display and still receives zero
 * needs a display share below about 1/(2 * total visits). #51 probed budgets
 * 24000/800/80/16 and widths 0.12/0.3 without ever firing it, and it reads 0.0
 * in every table produced so far. It is structurally unreached at the budgets
 * this project runs, so it is retained as a belt and NOT claimed as tested. A
 * test named for it would be a name without coverage, which this project has
 * already shipped once.
 */
