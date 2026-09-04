const test = require("node:test");
const assert = require("node:assert");
const { episodes, episodeStarts } = require("../experiments/k1-episodes.js");

/* rows are the archive's own shape: g, n0, n1, nh, informative, k */
const row = (g, n0, n1, nh = 0) => ({
  g,
  n0,
  n1,
  nh,
  informative: n0 > 0 && n1 > 0,
  k: n0 > 0 && n1 > 0 ? Math.min(n0, n1) : null,
});
const run = (seed, rows) => ({ seed, rows });

test("picks out exactly the generations at the requested k", () => {
  const r = [run(1, [row(0, 29, 1), row(1, 28, 2), row(2, 29, 1)])];
  assert.strictEqual(episodes(r, 1).length, 2);
  assert.strictEqual(episodes(r, 2).length, 1);
});

test("skips non-informative rows — k is undefined once a side is gone", () => {
  const r = [run(1, [row(0, 30, 0), row(1, 29, 1)])];
  const e = episodes(r, 1);
  assert.strictEqual(e.length, 1);
  assert.strictEqual(e[0].g, 1);
});

test("minority is whichever side is smaller, either way round", () => {
  const r = [run(1, [row(0, 1, 29), row(1, 29, 1)])];
  const e = episodes(r, 1);
  assert.strictEqual(e[0].minorIs0, true);
  assert.strictEqual(e[1].minorIs0, false);
});

/* ⚠️ TRAP 1 — #60's test 7, restated for this module. A lineage that comes back
 * and OVERTAKES its rival must not be scored as though it vanished. If the
 * minority were re-derived from the successor row, nextPure would read the
 * wrong side and a recovery from 1 to 20 would be recorded as a collapse. */
test("the minority is fixed at the START of the episode, not re-derived", () => {
  const r = [run(1, [row(0, 1, 29), row(1, 20, 10)])];
  const e = episodes(r, 1);
  assert.strictEqual(e.length, 1);
  /* she was lineage 0 with one plant; next generation she has 20 */
  assert.strictEqual(e[0].nextPure, 20);
});

/* ⚠️ TRAP 2 — the successor must be read even when it is NOT informative.
 * A row goes non-informative exactly when a pure count hits zero, which IS the
 * exit being counted. Filtering on it conditions on survival and deletes every
 * exit — the no-selfing arm consists of nothing else. */
test("reads the successor even when it is not informative (the exit)", () => {
  const r = [run(1, [row(0, 29, 1), row(1, 30, 0)])];
  const e = episodes(r, 1);
  assert.strictEqual(e.length, 1);
  assert.notStrictEqual(e[0].next, null);
  assert.strictEqual(e[0].nextPure, 0);
});

test("an arm that always exits still yields its episodes", () => {
  const r = [
    run(1, [row(0, 29, 1), row(1, 30, 0)]),
    run(2, [row(0, 1, 29), row(1, 0, 30)]),
  ];
  const e = episodes(r, 1);
  assert.strictEqual(e.length, 2);
  assert.deepStrictEqual(
    e.map((x) => x.nextPure),
    [0, 0],
  );
});

test("a final row has no successor and reports null rather than throwing", () => {
  const r = [run(1, [row(0, 29, 1)])];
  const e = episodes(r, 1);
  assert.strictEqual(e[0].next, null);
  assert.strictEqual(e[0].nextPure, null);
});

test("hybrid count of the successor is carried through", () => {
  const r = [run(1, [row(0, 29, 1), row(1, 28, 0, 5)])];
  assert.strictEqual(episodes(r, 1)[0].nextHyb, 5);
});

test("seeds are carried so counts can be reported per distinct seed", () => {
  const r = [run(7, [row(0, 29, 1)]), run(9, [row(0, 29, 1)])];
  assert.deepStrictEqual(
    episodes(r, 1).map((e) => e.seed),
    [7, 9],
  );
});

/* dwell: three consecutive generations at k=1 is ONE episode, not three —
 * otherwise the count/starts ratio that measures dwell is identically 1 */
test("consecutive generations at k are one episode, not several", () => {
  const r = [run(1, [row(0, 29, 1), row(1, 29, 1), row(2, 29, 1)])];
  assert.strictEqual(episodes(r, 1).length, 3);
  assert.strictEqual(episodeStarts(r, 1), 1);
});

test("a re-entry after leaving k counts as a new episode", () => {
  const r = [run(1, [row(0, 29, 1), row(1, 28, 2), row(2, 29, 1)])];
  assert.strictEqual(episodeStarts(r, 1), 2);
});

test("an episode broken by a non-informative row re-enters as a new one", () => {
  const r = [run(1, [row(0, 29, 1), row(1, 30, 0), row(2, 29, 1)])];
  assert.strictEqual(episodeStarts(r, 1), 2);
});
