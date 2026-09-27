/*
 * The run's story (sandbox intro, 2026-09-27): story(model, fate) answers the
 * page's question — do the two lineages stay two kinds? — for each of the
 * engine's five fates, in authored words, and marks where on the plot it
 * happened. Seen failing: story did not exist.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const H = require("../ancestry-heat.js");

/* a column: l1 plants at ancestry 0 (bin 0), mid hybrids at 0.5 (bin 10),
 * l2 plants at ancestry 1 (bin 19) */
const col = (g, l1, mid, l2, o = {}) => {
  const counts = new Array(20).fill(0);
  counts[0] = l1; counts[10] = mid; counts[19] = l2;
  return { g, final: !!o.final, n: l1 + mid + l2, counts, hyb: mid, ancVar: 0.1, stalled: !!o.stalled };
};
const model = (cols) => ({ bins: 20, v0: 0.25, heldLine: 0.1, cols });

test("HELD answers Yes; no marks when nothing happened", () => {
  const s = H.story(model([col(0, 15, 0, 15), col(1, 15, 0, 15), col(2, 15, 0, 15, { final: true })]), "HELD");
  assert.equal(s.answer, "Yes");
  assert.equal(s.caption, "Yes — they stayed two kinds: the last plants' ancestry is still split between the two lineages.");
  assert.deepEqual(s.marks, []);
});

test("one lost names the lost lineage and marks where it was last seen", () => {
  const s = H.story(model([col(0, 15, 0, 15), col(1, 20, 0, 10), col(2, 30, 0, 0), col(3, 30, 0, 0, { final: true })]), "one lost");
  assert.equal(s.answer, "No");
  assert.equal(s.caption, "No — lineage\u00a02 was lost: the last plants' ancestry is over 85% lineage\u00a01.");
  assert.deepEqual(s.marks, [{ col: 2, row: "bottom", text: "lineage 2 gone" }]);
  const t = H.story(model([col(0, 15, 0, 15), col(1, 0, 0, 30), col(2, 0, 0, 30, { final: true })]), "one lost");
  assert.equal(t.caption, "No — lineage\u00a01 was lost: the last plants' ancestry is over 85% lineage\u00a02.");
  assert.deepEqual(t.marks, [{ col: 1, row: "top", text: "lineage 1 gone" }]);
});

test("one lost with a straggler to the end: named, but not marked gone", () => {
  const s = H.story(model([col(0, 15, 0, 15), col(1, 29, 0, 1), col(2, 29, 0, 1, { final: true })]), "one lost");
  assert.equal(s.caption, "No — lineage\u00a02 was lost: the last plants' ancestry is over 85% lineage\u00a01.");
  assert.deepEqual(s.marks, []);
});

test("FUSED marks the first hybrids", () => {
  const s = H.story(model([col(0, 15, 0, 15), col(1, 14, 2, 14), col(2, 2, 26, 2, { final: true })]), "FUSED");
  assert.equal(s.caption, "No — they blended: the last plants' ancestry mixes both lineages, and the split between them has collapsed.");
  assert.deepEqual(s.marks, [{ col: 1, row: "mid", text: "first hybrids" }]);
});

test("STALLED counts stalled generations, k of N, and marks the first", () => {
  const s = H.story(model([col(0, 15, 0, 15), col(1, 15, 0, 15, { stalled: true }), col(2, 15, 0, 15, { stalled: true }), col(3, 15, 0, 15, { final: true })]), "STALLED");
  assert.equal(s.caption, "No — it stalled: 2 of 3 generations made no new plants, so the old ones were carried forward. That is not staying two kinds.");
  assert.deepEqual(s.marks, [{ col: 1, row: "mid", text: "stalled: no new plants" }]);
});

test("BOTH LOST answers No with no marks", () => {
  const s = H.story(model([col(0, 15, 0, 15), col(1, 1, 0, 0, { final: true })]), "BOTH LOST");
  assert.equal(s.caption, "No — the population died out: fewer than two plants were left.");
  assert.deepEqual(s.marks, []);
});

test("marks come in order stall, lost, hybrids, at most three", () => {
  const s = H.story(model([col(0, 15, 0, 15), col(1, 15, 0, 15, { stalled: true }), col(2, 20, 2, 8), col(3, 30, 0, 0), col(4, 30, 0, 0, { final: true })]), "one lost");
  assert.deepEqual(s.marks.map((m) => m.text), ["stalled: no new plants", "lineage 2 gone", "first hybrids"]);
});

test("an unknown fate throws", () => {
  assert.throws(() => H.story(model([col(0, 15, 0, 15), col(1, 15, 0, 15, { final: true })]), "held"), /unknown fate/);
});
