/*
 * Tests for `sim/verdict-gates.js`.
 *
 * The module has exactly one job — make the positive text UNREACHABLE while any
 * gate is unmet — so the central test is not an example, it is the exhaustive
 * boolean product over {true, false, null}^k. With three gates that is 27 cases
 * and only one of them may contain the positive string.
 *
 * Driven against four broken implementations (_scratch/gates-seen-to-fail.js),
 * all four die. ⚠️ But that run FALSIFIED the claim first written here. The two
 * mutants that weaken the conjunction — "a control that did not fit counts as
 * met" and "any one gate is enough" — are each killed by the product AND by an
 * ordinary example test, so the product is not their unique killer, and saying
 * it was would have been this file asserting its own necessity without checking.
 * What the product actually buys is that the guarantee is exhaustive rather than
 * exemplary: the examples cover the shapes someone thought to write down, the
 * product covers the ones nobody did.
 *
 * The two mutants that weaken VALIDATION instead (`ok: {}` accepted, `ok` absent
 * treated as met) are killed ONLY by the throw tests, which the product cannot
 * reach — a gate that throws never gets as far as being tabulated. Neither half
 * of this file is redundant with the other; they kill disjoint mutants.
 */

const test = require("node:test");
const assert = require("node:assert");
const { claim, gateReport } = require("../sim/verdict-gates.js");

const POS = "✅ THE THING IS ESTABLISHED";
const g = (name, ok) => ({ name, ok, failText: `${name} was not met` });

/* ------------------------------------------------ the invariant, exhaustively */

test("the positive text is unreachable unless EVERY gate is met", () => {
  const states = [true, false, null];
  let allMet = 0;
  for (const a of states)
    for (const b of states)
      for (const c of states) {
        const gates = [g("alpha", a), g("beta", b), g("gamma", c)];
        const r = claim({ gates, positive: POS });
        const every = a === true && b === true && c === true;
        assert.strictEqual(
          r.pass,
          every,
          `pass was ${r.pass} for [${a}, ${b}, ${c}]`,
        );
        assert.strictEqual(
          r.text.includes(POS),
          every,
          `positive text leaked for [${a}, ${b}, ${c}]`,
        );
        if (every) allMet++;
        else
          assert.ok(
            r.failed.length > 0,
            `no gate named as failed for [${a}, ${b}, ${c}]`,
          );
      }
  assert.strictEqual(allMet, 1, "exactly one of 27 cells may pass");
});

test("a control that did not fit fails closed, and says so", () => {
  const r = claim({ gates: [g("null gate", null)], positive: POS });
  assert.strictEqual(r.pass, false);
  assert.ok(!r.text.includes(POS));
  assert.match(r.text, /did not fit/);
});

test("every unmet gate is named, not just the first", () => {
  const r = claim({
    gates: [g("alpha", false), g("beta", true), g("gamma", null)],
    positive: POS,
  });
  assert.deepStrictEqual(r.failed, ["alpha", "gamma"]);
  assert.match(r.text, /alpha was not met/);
  assert.match(r.text, /gamma was not met/);
  assert.ok(!r.text.includes("beta was not met"), "a MET gate was reported");
});

test("no gates at all is a pass — the caller declared none", () => {
  /* Deliberate: `claim({gates: []})` is an explicit statement that nothing
   * conditions this claim. The failure mode this module addresses is a gate
   * that EXISTS and is not consulted, not the absence of gates; a caller with
   * no gates has nothing to route around. */
  const r = claim({ gates: [], positive: POS });
  assert.strictEqual(r.pass, true);
  assert.strictEqual(r.text, POS);
});

/* ------------------------------------- a mis-wired gate is louder than a failed one */

test("a gate with no `ok` throws rather than passing", () => {
  /* The bug this catches is a typo'd field name. Silently treating an absent
   * key as met would reproduce the exact defect the module exists to prevent,
   * one layer up. */
  assert.throws(
    () =>
      claim({
        gates: [{ name: "typo", okk: true, failText: "x" }],
        positive: POS,
      }),
    /has no `ok`/,
  );
});

test("a truthy non-boolean `ok` throws instead of passing", () => {
  /* `ok: someInterval` — an object — is truthy, and a `!g.ok` implementation
   * would wave it through without ever asking the question. */
  for (const bad of [1, "yes", {}, [], undefined])
    assert.throws(
      () =>
        claim({
          gates: [{ name: "loose", ok: bad, failText: "x" }],
          positive: POS,
        }),
      /has no `ok`|must be true, false or null/,
      `ok=${JSON.stringify(bad)} was accepted`,
    );
});

test("a gate missing its name or failText throws", () => {
  assert.throws(
    () => claim({ gates: [{ ok: false, failText: "x" }], positive: POS }),
    /needs a name/,
  );
  assert.throws(
    () => claim({ gates: [{ name: "n", ok: false }], positive: POS }),
    /needs failText/,
  );
});

test("claim refuses to run without gates or without positive text", () => {
  assert.throws(() => claim({ positive: POS }), /needs a gates array/);
  assert.throws(() => claim({ gates: [] }), /needs the positive text/);
  assert.throws(
    () => claim({ gates: [], positive: "" }),
    /needs the positive text/,
  );
});

/* --------------------------------------------------------------- the report */

test("gateReport shows every gate, met and unmet alike", () => {
  const gates = [g("alpha", true), g("beta", false), g("gamma", null)];
  const r = gateReport(gates);
  assert.match(r, /alpha\s+met/);
  assert.match(r, /beta\s+⚠️ UNMET/);
  assert.match(r, /gamma\s+⚠️ DID NOT FIT/);
  assert.strictEqual(r.split("\n").length, 3, "one line per gate");
});

test("a gate name at or past the column width still gets whitespace", () => {
  /* Caught in a real run: "the positive control finds its known hole" is exactly
   * the old column width, so padEnd added nothing and the name butted straight
   * into "met" — `...known holemet`. */
  for (const len of [39, 40, 41, 44, 80]) {
    const line = gateReport([g("x".repeat(len), true)]);
    assert.match(
      line,
      /x\s\s+met$/,
      `no separator at name length ${len}: ${JSON.stringify(line)}`,
    );
  }
});
