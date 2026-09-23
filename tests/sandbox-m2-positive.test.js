/*
 * M2 acceptance, the two positive seeds (northstar spec §9 M2 row; §4 cards 1
 * and 4). The page is loaded in the fake browser, founded through its own "found
 * at target d" switch, Run is pressed, and every number and card state is read
 * back off the DOM (tools/sandbox-drive.js). The expected rows come from RUNNING
 * the null-tables tool in the test, so the assertion is that the page and the
 * tool run ONE protocol — no number below is hand-copied except the spec's
 * named values, which are asserted against the tool too.
 *
 * Seen-to-fail control: SANDBOX_PAGE=<master's population.html copied beside
 * master's population-run.js> fails every test here (no cards, no stalled count,
 * the page's own "one lineage lost" string).
 */
const test = require("node:test");
const assert = require("node:assert");
const { runPage, toolRows } = require("../tools/sandbox-drive.js");

const CASES = [
  {
    name: "card 4: target 8, seed 1",
    seed: 1,
    d: 8,
    spec: { fate: "one lost", hybGens: 0, realised: "8.124", ratio: null },
    open: "card4",
  },
  {
    name: "card 1: target 4, seed 16",
    seed: 16,
    d: 4,
    spec: { fate: "one lost", hybGens: 1, realised: "3.849", ratio: "0.111" },
    open: "card1",
  },
];

for (const c of CASES) {
  test(`${c.name} — the page equals the tool's row and the card opens`, () => {
    const row = toolRows("page", c.seed, c.seed).find(
      (r) => r.d === c.d && r.arm === "placed",
    );
    assert.ok(row, "the tool printed no row for this seed");
    /* the tool itself still says what the spec says */
    assert.deepStrictEqual(
      {
        fate: row.fate,
        hybGens: row.hybGens,
        realised: row.realised,
        ratio: row.ratio,
      },
      c.spec,
      "the tool's row no longer matches the spec's control",
    );

    const p = runPage({ seed: c.seed, useD: true, d: c.d, n: 18, gens: 24, siteN: 90 });
    assert.equal(p.error, null, `the page refused to run: ${p.error}`);
    assert.equal(p.fate, row.fate, "fate differs from the tool");
    assert.equal(p.hybGens, row.hybGens, "hybrid generations differ from the tool");
    assert.equal(p.hybOf, 24);
    assert.equal(p.ratio, row.ratio, "receipt ratio differs from the tool");
    assert.equal(p.realised, row.realised, "realised separation differs");
    assert.equal(p.stalledGens, 0);
    assert.equal(p.cards[c.open], "open", `${c.open} is not open`);
    for (const k of ["card2", "card3", "card5", "card6"])
      assert.equal(p.cards[k], "grey", `${k} is not a grey placeholder`);
  });
}
