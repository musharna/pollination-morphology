/*
 * #60 — the outcome classifier that turns a k=1 generation into RECOVER / EXIT /
 * SURVIVE / CENSORED. Every number in the survival-vs-recovery result is this
 * function applied 300-odd times, so it is tested on hand-built rows where the
 * right answer is known by construction rather than by re-running the sweep.
 */
const test = require("node:test");
const assert = require("node:assert");
const { classify, ESCAPE } = require("../experiments/lineage-outcome.js");

/* rows carry only what classify reads */
const r = (n0, n1, nh = 0) => ({ n0, n1, nh });

test("ESCAPE is 3 — the k where #56 measured the floor stops binding", () => {
  /* w = 0.000 / 0.734 / 1.646 at k = 1 / 2 / 3. If this constant drifts, every
   * recovery probability in #60 silently changes meaning. */
  assert.equal(ESCAPE, 3);
});

test("RECOVER when the minority reaches the escape threshold", () => {
  assert.equal(classify([r(1, 29), r(3, 27)], 0, 5, false), "RECOVER");
});

test("EXIT when the minority reaches zero", () => {
  assert.equal(classify([r(1, 29), r(0, 30)], 0, 5, false), "EXIT");
});

test("EXIT takes precedence over a later recovery it never lived to see", () => {
  /* a lineage that hits 0 is gone; anything after is a different story and must
   * not be credited to it */
  assert.equal(
    classify([r(1, 29), r(0, 30), r(5, 25)], 0, 5, false),
    "EXIT",
    "a lineage that hit zero was scored on what happened afterwards",
  );
});

test("SURVIVE when still alive at i+W without ever escaping", () => {
  const rows = [r(1, 29), r(1, 29), r(2, 28), r(2, 28)];
  assert.equal(classify(rows, 0, 2, false), "SURVIVE");
});

test("CENSORED when the run ends before the window closes", () => {
  /* ⚠️ The outcome is genuinely unknown and must be excluded, not guessed. If
   * this returned SURVIVE it would silently convert "we stopped looking" into
   * "it lived", inflating survival at the end of every run. */
  assert.equal(classify([r(1, 29), r(1, 29)], 0, 5, false), "CENSORED");
});

test("the minority is fixed at the START of the episode, not re-derived", () => {
  /* ⚠️ THE TRAP. If "which side is the minority" were recomputed each
   * generation, a lineage that RECOVERS PAST its rival would have the label
   * swapped onto the other side mid-episode — and a total win would be scored
   * as an EXIT. Constructed so the two readings give opposite answers. */
  const rows = [r(1, 29), r(30, 0)];
  assert.equal(
    classify(rows, 0, 5, false),
    "RECOVER",
    "the minority took over the population and was scored as if it vanished",
  );
});

test("PURE and INCLUSIVE differ exactly on the absorbed-into-hybrids route", () => {
  /* The tracer confound, made concrete: the minority's PURE count hits zero
   * while hybrids carrying its ancestry are present and growing.
   *   PURE      calls that extinction
   *   INCLUSIVE calls it alive, and here it goes on to escape
   * Neither is wrong; they answer different questions, which is exactly why #60
   * reports both instead of picking one silently. */
  const rows = [r(1, 29), r(0, 28, 2), r(0, 27, 3), r(0, 27, 3)];
  assert.equal(classify(rows, 0, 5, false), "EXIT");
  assert.equal(classify(rows, 0, 5, true), "RECOVER");
});

test("with no hybrids anywhere, the two conventions agree by construction", () => {
  /* The positive control on the pair: if these ever diverged on hybrid-free
   * rows, the INCLUSIVE branch would be doing something other than counting
   * hybrids, and every convention comparison in #60 would be uninterpretable. */
  const cases = [
    [r(1, 29), r(3, 27)],
    [r(1, 29), r(0, 30)],
    [r(1, 29), r(1, 29), r(2, 28), r(2, 28)],
    [r(1, 29), r(1, 29)],
  ];
  for (const rows of cases)
    assert.equal(
      classify(rows, 0, 5, false),
      classify(rows, 0, 5, true),
      `conventions disagreed on hybrid-free rows: ${JSON.stringify(rows)}`,
    );
});

test("the window actually bounds the lookahead", () => {
  /* An escape that happens after the window must not be counted. Without this,
   * W=5 and W=10 would be the same statistic and the pre-registered pair of
   * windows would be a distinction with no difference. */
  const rows = [r(1, 29), r(1, 29), r(1, 29), r(1, 29), r(5, 25), r(5, 25)];
  assert.equal(
    classify(rows, 0, 2, false),
    "SURVIVE",
    "W=2 should not see gen 4",
  );
  assert.equal(classify(rows, 0, 5, false), "RECOVER", "W=5 should see gen 4");
});
