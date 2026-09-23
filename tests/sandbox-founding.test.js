/*
 * Founding is part of every edge-bearing card's signature (grill 2026-09-23).
 * Each edge was measured on runs founded by foundTwoLineages at a target d; the
 * hand-set founding (the "found at target d" box off) has its own null, which
 * for card 1 reaches 0.344 (null tables, last section), below the 0.603 edge.
 * Each test runs a known OPEN case twice: box on (the positive control, still
 * open) and box off (grey, naming the founding). Before the fix the box-off
 * card-1 run read `open` at 0.577.
 */
const test = require("node:test");
const assert = require("node:assert");
const I = require("../sim/ibm.js");
const E = require("../sim/evolve.js");
const { runPage } = require("../tools/sandbox-drive.js");

test("card 1: target 8 seed 25's genomes, hand-set founded, is grey; target 4 seed 16 founded at d opens", () => {
  const b = I.foundTwoLineages(18, E.makeRng(25), I.signalRng(25), 8, {
    ...I.DEFAULTS,
    siteN: 90,
  });
  const off = runPage({ seed: 25, useD: false, n: 18, gens: 24, siteN: 90, lineages: [b.gA, b.gB] });
  assert.equal(off.error, null, off.error);
  assert.ok(+off.ratio < 0.603, `the case no longer sits below the edge: ${off.ratio}`);
  assert.equal(off.cards.card1, "grey", off.cardText.card1);
  assert.match(off.cardText.card1, /founded at target d 4 or 8/);
  const on = runPage({ seed: 16, useD: true, d: 4, n: 18, gens: 24, siteN: 90 });
  assert.equal(on.cards.card1, "open", on.cardText.card1);
});

const cases = [
  ["cards 2 and 3", { level: 3, seed: 6 }, ["card2", "card3"]],
  ["card 5", { level: 4, seed: 8, options: { selfCover: 0.85 } }, ["card5"]],
  ["card 6", { level: 5, seed: 13, loadWidth: true }, ["card6"]],
];
for (const [name, s, cards] of cases)
  test(`${name}: open founded at target 8, grey hand-set founded`, () => {
    const on = runPage({ ...s, useD: true, d: 8 });
    const off = runPage({ ...s, useD: false });
    for (const c of cards) {
      assert.equal(on.cards[c], "open", `${c} on: ${on.cardText[c]}`);
      assert.equal(off.cards[c], "grey", `${c} off: ${off.cardText[c]}`);
      assert.match(off.cardText[c], /founded at target d 8/);
    }
  });

test("levels 2 to 6 load the founding their rates were measured at; level 1 and free do not", () => {
  for (const level of [2, 3, 4, 5, 6]) {
    const p = runPage({ level, noRun: true });
    assert.equal(p.useD, true, `level ${level} left the box off`);
    assert.equal(p.d, "8", `level ${level} d ${p.d}`);
  }
  for (const level of [1, "free"])
    assert.equal(runPage({ level, noRun: true }).useD, false, `level ${level}`);
});
