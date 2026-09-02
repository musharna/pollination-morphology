/*
 * tests/bloom-fixed.test.js — guards for #53's instrument.
 *
 * `forceBloomDist` exists to hold ONE variable still: the flowering-time
 * distribution. Everything #53 concludes rests on it doing exactly that and
 * nothing else, so these cover the four properties the design leans on —
 * identity under self-donation, the marginal becoming the donor's, rank order
 * surviving, and the option being inert when absent.
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

function step0(seed, extra = {}) {
  const rng = E.makeRng(seed);
  const srng = I.signalRng(seed);
  const brng = I.bloomRng(seed);
  const opts = {
    ...I.DEFAULTS,
    siteN: SITE_N,
    phenology: { slices: S, width: W, ...extra },
  };
  const built = I.foundTwoLineages(N0, rng, srng, D_EXCL, opts);
  if (!built) return null;
  return I.step(built.pop, opts, rng, 0, srng, brng);
}

test("self-donation is the identity", () => {
  /*
   * ⚠️⚠️ THE LOAD-BEARING CONTROL FOR THE WHOLE OF #53. Rank-mapping a multiset
   * onto itself maps every rank to itself, so forcing an arm with its own
   * realised blooms must return them unchanged. Without this, "cell C differs
   * from cell A" cannot be told apart from "the forcing perturbs whatever it
   * touches", and no other check can separate those two.
   */
  for (const seed of [1, 2, 3, 4, 5]) {
    const free = step0(seed);
    assert.ok(free, "population should build");
    const self = step0(seed, { forceBloomDist: free.blooms });
    assert.deepStrictEqual(
      Array.from(self.blooms),
      Array.from(free.blooms),
      `seed ${seed}: forcing an arm with its own blooms must change nothing`,
    );
    /* and not merely the blooms — the whole step */
    assert.strictEqual(self.visitsSpent, free.visitsSpent);
    assert.strictEqual(self.bloomAssort, free.bloomAssort);
    assert.strictEqual(self.bloomLineage, free.bloomLineage);
    assert.strictEqual(self.coflower, free.coflower);
  }
});

test("the forced distribution IS the donor's, as a multiset", () => {
  const donor = Array.from({ length: N0 }, (_, i) => (i * 0.037) % 1);
  const res = step0(9, { forceBloomDist: donor });
  assert.ok(res, "population should build");
  const got = Array.from(res.blooms).sort((a, b) => a - b);
  const want = donor.slice(0, res.blooms.length).sort((a, b) => a - b);
  assert.deepStrictEqual(
    got,
    want,
    "every expressed bloom must come from the donor, with its multiplicities",
  );
  /* ⚠️ the positive control in the same test: a donor that is NOT what the arm
   * would have produced, so "identical" cannot pass by accident */
  const free = step0(9);
  assert.notDeepStrictEqual(
    Array.from(free.blooms).sort((a, b) => a - b),
    want,
    "the donor must differ from what the arm produces on its own, or this test\n" +
      "would pass on a hook that never ran",
  );
});

test("rank order is preserved — the k-th smallest plant gets the k-th smallest donor value", () => {
  const free = step0(11);
  assert.ok(free, "population should build");
  const n = free.blooms.length;
  /* a donor whose values are strictly increasing and distinct, so ranks are
   * unambiguous */
  const donor = Array.from({ length: n }, (_, i) => 0.2 + i * 0.002);
  const forced = step0(11, { forceBloomDist: donor });
  const rankOf = (xs) => {
    const idx = xs.map((_, i) => i).sort((a, b) => xs[a] - xs[b]);
    const r = new Array(xs.length);
    idx.forEach((orig, rank) => (r[orig] = rank));
    return r;
  };
  const rFree = rankOf(Array.from(free.blooms));
  const rForced = rankOf(Array.from(forced.blooms));
  assert.deepStrictEqual(
    rForced,
    rFree,
    "a plant's position in the flowering order must survive the mapping — that\n" +
      "is what keeps relatives flowering together",
  );
});

test("a donor of a different size is mapped by quantile, not truncated", () => {
  /*
   * The arms diverge demographically, so the donor routinely holds a different
   * number of plants. A silent index mismatch would truncate or recycle the tail
   * and quietly stop being the donor's distribution.
   */
  const free = step0(13);
  assert.ok(free, "population should build");
  const n = free.blooms.length;
  for (const m of [Math.max(2, n - 7), n + 9]) {
    const donor = Array.from(
      { length: m },
      (_, i) => 0.1 + (0.8 * i) / (m - 1),
    );
    const forced = step0(13, { forceBloomDist: donor });
    assert.strictEqual(
      forced.blooms.length,
      n,
      `donor size ${m}: the population size must not change`,
    );
    const set = new Set(donor);
    for (const b of forced.blooms)
      assert.ok(
        set.has(b),
        `donor size ${m}: every value must come from the donor`,
      );
    /* the mapping must SPAN the donor, not pile onto one end */
    assert.ok(
      Math.min(...forced.blooms) < 0.3 && Math.max(...forced.blooms) > 0.7,
      `donor size ${m}: the mapping must cover the donor's range`,
    );
  }
});

test("the option is inert when absent or empty", () => {
  const free = step0(17);
  assert.ok(free, "population should build");
  for (const extra of [{}, { forceBloomDist: null }, { forceBloomDist: [] }]) {
    const r = step0(17, extra);
    assert.deepStrictEqual(
      Array.from(r.blooms),
      Array.from(free.blooms),
      `${JSON.stringify(extra)} must leave every earlier result bit-identical`,
    );
  }
});
