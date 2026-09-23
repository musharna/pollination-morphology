/*
 * M3b acceptance, level 5 and card 6 (northstar spec §9 M3b row; §4 card 6; §5
 * level 5), in the fake browser, executing the page's own script. Founding:
 * "found at target d" ON at 8, the null tables' protocol.
 *
 *  - level 5, seeds 1 to 5: HELD / one lost / HELD / one lost / one lost, no
 *    generation recruits nothing; the field caption says the bout is not drawn;
 *  - the width-locus object, seed 3: treatment minus shuffled 0.393, card 6
 *    prints it uncoloured (closed); seed 13: 0.768, open; seed 23: -0.006, closed.
 */
const test = require("node:test");
const assert = require("node:assert");
const { runPage } = require("../tools/sandbox-drive.js");

const L5 = { level: 5, useD: true, d: 8 };
const EXPECT = { 1: "HELD", 2: "one lost", 3: "HELD", 4: "one lost", 5: "one lost" };

for (const [seed, fate] of Object.entries(EXPECT))
  test(`level 5 seed ${seed}: ${fate}, no stalled generation`, () => {
    const p = runPage({ ...L5, seed: +seed });
    assert.equal(p.error, null, p.error);
    assert.deepEqual([p.options.phenOn, p.options.phenSlices, p.options.phenWidth], [true, "8", "0.12"]);
    assert.equal(p.fate, fate);
    assert.equal(p.stalledGens, 0);
    assert.equal(p.win, fate === "HELD" ? "won" : "lost");
    assert.match(p.fieldCaption || "", /bout not drawn: the sliced season does not log one/);
  });

test("control: a run without phenology carries no no-log caption", () => {
  const p = runPage({ level: 2, seed: 1, useD: true, d: 8 });
  assert.doesNotMatch(p.fieldCaption || "", /bout not drawn/);
});

test("the width-locus button loads card 6's exact object", () => {
  const p = runPage({ level: 5, noRun: true, loadWidth: true });
  assert.deepEqual(
    [p.options.phenOn, p.options.phenSlices, p.options.phenWidth, p.options.phenWidthLocus, p.options.phenWidthMut, p.options.phenConserve],
    [true, "8", "", true, "0.03", true],
  );
});

const diff = (t) => {
  const m = /treatment minus shuffled (-?\d+\.\d+)/.exec(t || "");
  return m ? m[1] : null;
};
for (const [seed, d, state] of [[3, "0.393", "closed"], [13, "0.768", "open"], [23, "-0.006", "closed"]])
  test(`card 6, width-locus object, seed ${seed}: ${d}, ${state}`, () => {
    const p = runPage({ ...L5, seed, loadWidth: true });
    assert.equal(p.error, null, p.error);
    assert.equal(diff(p.cardText.card6), d, p.cardText.card6);
    assert.equal(p.cards.card6, state, p.cardText.card6);
  });

test("card 6 is grey on level 5's first object (a flipped widthLocus is not the measured object)", () => {
  const p = runPage({ ...L5, seed: 13, options: { phenWidthLocus: true } });
  assert.equal(p.cards.card6, "grey", p.cardText.card6);
});
