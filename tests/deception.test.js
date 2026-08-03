/*
 * Tests for deception.
 *
 * Two of these carry more weight than the rest.
 *
 * INERTNESS. Every result this project has published came out of runBout, and
 * deception adds a branch inside its visit loop. If the default path is not
 * byte-identical the whole back catalogue silently moves, so that is asserted
 * against a bout that does not mention the option at all — not against a
 * remembered number.
 *
 * THE MECHANISM TEST SHIPS ITS OWN CONTROL. "The deceptive species got fewer
 * visits" passes on a broken harness that simply lost visits, so the same test
 * asserts the rewarding species KEPT its share in the same run. A negative
 * result needs a positive control standing next to it.
 */

const test = require("node:test");
const assert = require("node:assert");
const P = require("../sim/placement.js");
const C = require("../sim/carryover.js");
const D = require("../sim/deception.js");

const bee = P.DEFAULT_BEE;
const species = (theta, over = {}) => ({
  ...P.DEFAULT_FLOWER,
  antherTheta: theta,
  stigmaTheta: theta,
  ...over,
});
const sitesFor = (flowers) =>
  flowers.map((f, i) => C.siteSet(f, bee, { n: 200, seed: 11 + i }));

test("a naive learner expects the naive value everywhere", () => {
  const L = D.makeLearner({ naive: 1 });
  for (const x of [0, 0.13, 0.5, 0.77, 0.999])
    assert.strictEqual(L.expect(x), 1, `naive expectation wrong at ${x}`);
});

test("being cheated lowers the expectation AT that signal", () => {
  const L = D.makeLearner({ rate: 0.3, forget: 0, width: 0.05 });
  const before = L.expect(0.5);
  for (let i = 0; i < 20; i++) L.learn(0.5, 0);
  const after = L.expect(0.5);
  assert.ok(
    after < before * 0.2,
    `20 unrewarded visits should collapse the expectation, ${before} -> ${after}`,
  );
});

test("being paid holds the expectation up — the positive control for the above", () => {
  const L = D.makeLearner({ rate: 0.3, forget: 0, width: 0.05, naive: 1 });
  for (let i = 0; i < 20; i++) L.learn(0.5, 1);
  assert.ok(
    L.expect(0.5) > 0.99,
    `a reliably rewarding signal must not lose value, got ${L.expect(0.5)}`,
  );
});

test("learning generalises, and the gradient FALLS with signal distance", () => {
  const L = D.makeLearner({ rate: 0.3, forget: 0, width: 0.08 });
  for (let i = 0; i < 20; i++) L.learn(0.5, 0);
  const at = L.expect(0.5);
  const near = L.expect(0.55);
  const far = L.expect(0.8);
  assert.ok(at < near, `trained signal must be most avoided: ${at} vs ${near}`);
  assert.ok(near < far, `avoidance must fall with distance: ${near} vs ${far}`);
  assert.ok(
    far > 0.95,
    `a signal 0.3 away with width 0.08 should be nearly untouched, got ${far}`,
  );
});

test("signal space is a RING — 0.98 and 0.02 are neighbours", () => {
  const L = D.makeLearner({ rate: 0.3, forget: 0, width: 0.08 });
  for (let i = 0; i < 20; i++) L.learn(0.0, 0);
  const wrapped = L.expect(0.98);
  const sameDistanceInward = L.expect(0.02);
  assert.ok(
    wrapped < 0.9,
    `0.98 is 0.02 from 0.0 on a ring and must be affected, got ${wrapped}`,
  );
  assert.ok(
    Math.abs(wrapped - sameDistanceInward) < 0.05,
    `the ring must be symmetric: ${wrapped} vs ${sameDistanceInward}`,
  );
});

test("memory is short — expectation decays back toward naive", () => {
  const L = D.makeLearner({ rate: 0.5, forget: 0.05, width: 0.05, naive: 1 });
  for (let i = 0; i < 20; i++) L.learn(0.5, 0);
  const learned = L.expect(0.5);
  L.decay(200);
  const forgotten = L.expect(0.5);
  assert.ok(learned < 0.3, `should have learned, got ${learned}`);
  assert.ok(
    forgotten > 0.9,
    `Whitehead & Peakall: avoidance is short-lived, got ${forgotten}`,
  );
});

test("forget = 0 never forgets — the contrast arm, and it must differ", () => {
  const L = D.makeLearner({ rate: 0.5, forget: 0, width: 0.05 });
  for (let i = 0; i < 20; i++) L.learn(0.5, 0);
  const learned = L.expect(0.5);
  L.decay(200);
  assert.strictEqual(
    L.expect(0.5),
    learned,
    "with forget = 0 the expectation must not move at all",
  );
});

test("a signal coordinate is required, and a bad advert is refused", () => {
  const L = D.makeLearner();
  assert.throws(
    () => D.deceptionWeights([{ abundance: 1, signal: NaN }], L),
    /signal coordinate/,
    "a missing signal must throw rather than silently weight everything alike",
  );
  assert.throws(
    () => D.deceptionWeights([{ abundance: 1, signal: 0.5, advert: -1 }], L),
    /non-negative/,
  );
});

test("bad learner parameters are refused rather than clamped", () => {
  assert.throws(() => D.makeLearner({ width: 0 }), /width must be positive/);
  assert.throws(() => D.makeLearner({ rate: 1.5 }), /rate out of range/);
  assert.throws(() => D.makeLearner({ forget: -1 }), /forget out of range/);
});

/*
 * ⚠️ THE REGRESSION THAT MATTERS. A bout that does not mention deception must
 * produce EXACTLY what it produced before the option existed — same transfer
 * matrix, same rng stream. Asserted against a second bout rather than a pinned
 * constant, so it keeps testing the invariant if the model's numbers move for
 * some unrelated reason.
 */
test("the default path is byte-identical — no learner, no extra rng draw", () => {
  const sites = sitesFor([species(0), species(1.2), species(2.4)]);
  const ab = [0.4, 0.35, 0.25];
  const plain = C.runBout(sites, ab, { visits: 4000, seed: 9 });
  const withNulls = C.runBout(sites, ab, {
    visits: 4000,
    seed: 9,
    learner: null,
    signals: null,
    rewardP: null,
  });
  assert.deepStrictEqual(
    plain.T.map((r) => Array.from(r)),
    withNulls.T.map((r) => Array.from(r)),
    "passing the deception options as null must change nothing",
  );
  assert.strictEqual(plain.produced, withNulls.produced);
  assert.strictEqual(plain.landedRight, withNulls.landedRight);
});

test("a mismatched signal array is refused, not padded", () => {
  const sites = sitesFor([species(0), species(1.2)]);
  assert.throws(
    () =>
      C.runBout(sites, [0.5, 0.5], {
        visits: 100,
        learner: D.makeLearner(),
        signals: [0.1],
      }),
    /one signal per entry/,
  );
});

/*
 * The behavioural test, with its positive control inside the same run.
 *
 * Two species, equal abundance, equal advertisement, DIFFERENT signals so the
 * animal can tell them apart — one pays and one does not. The cheat must lose
 * visits; the rewarder must not. Checking only the first would pass on a
 * harness that had simply stopped visiting anything.
 */
test("a cheat loses visits while the rewarder in the same bout does not", () => {
  const sites = sitesFor([species(0), species(2.0)]);
  const ab = [0.5, 0.5];
  const opts = {
    visits: 6000,
    seed: 21,
    signals: [0.2, 0.7],
    rewardP: [0, 1],
  };
  const learned = C.runBout(sites, ab, {
    ...opts,
    learner: D.makeLearner({ rate: 0.2, forget: 0.01, width: 0.06 }),
  });
  /* CONTROL: identical bout, identical signals and rewards, but no learner —
   * so nothing can respond to the cheating. Any visit difference here would be
   * the harness, not the mechanism. */
  const naive = C.runBout(sites, ab, opts);

  const shareL =
    learned.visitsTo[0] / (learned.visitsTo[0] + learned.visitsTo[1]);
  const shareN = naive.visitsTo[0] / (naive.visitsTo[0] + naive.visitsTo[1]);

  assert.ok(
    Math.abs(shareN - 0.5) < 0.05,
    `without a learner the cheat must keep its half: got ${shareN.toFixed(3)}`,
  );
  assert.ok(
    shareL < shareN - 0.1,
    `learning must cost the cheat visits: ${shareL.toFixed(3)} vs ${shareN.toFixed(3)}`,
  );
  assert.ok(
    learned.visitsTo[1] > naive.visitsTo[1],
    "the rewarder must GAIN the visits the cheat lost — positive control",
  );
});

/*
 * Deception is only worth anything while some expectation survives. With a
 * community that is entirely deceptive, aversion generalises everywhere and
 * there is nothing left to exploit — the bout must still complete rather than
 * stalling, because a stalled bout reads as "deception is costless".
 */
test("an all-deceptive community still forages — no silent stall", () => {
  const sites = sitesFor([species(0), species(2.0)]);
  const r = C.runBout(sites, [0.5, 0.5], {
    visits: 3000,
    seed: 5,
    learner: D.makeLearner({ rate: 0.9, forget: 0, width: 0.5 }),
    signals: [0.2, 0.7],
    rewardP: [0, 0],
  });
  const total = r.visitsTo[0] + r.visitsTo[1];
  assert.ok(
    total > 2000,
    `the animal must keep foraging somewhere, got ${total} visits`,
  );
});
