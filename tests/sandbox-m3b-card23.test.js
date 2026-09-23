/*
 * M3b acceptance, cards 2 and 3 (northstar spec §9 M3b row; §4 cards 2, 3), in
 * the fake browser, executing the page's own script. Every value is read off
 * the DOM: the fate tile, the cards' `data-state`, and the quantities each card
 * prints. Founding protocol: "found at target d" ON at 8, the null tables'
 * (docs/2026-09-13-northstar-null-tables.md, `card23`, `card23rm`).
 *
 *  - level 3 at seed 6: FUSED, peak gap 0.633, mean 0.266, lead 3, cards 2 and 3 open;
 *  - level 3 at seed 1: `one lost`, both closed;
 *  - seed 6 under randomMating: FUSED, peak 0.720, mean 0.507, lead 0, both
 *    closed by the lead and grey by the signature (grey wins).
 */
const test = require("node:test");
const assert = require("node:assert");
const { runPage } = require("../tools/sandbox-drive.js");

const L3 = { level: 3, useD: true, d: 8 };
const quant = (t) => {
  const m = /peak gap (\S+), mean gap (\S+), lead (-?\d+|none)/.exec(t || "");
  return m ? { peak: m[1], mean: m[2], lead: m[3] } : null;
};

test("level 3 loads allocExponent 0.25 into the option control", () => {
  const p = runPage({ level: 3, noRun: true });
  assert.equal(p.options.allocExponent, "0.25");
  assert.equal(p.options.phenOn, false);
  assert.equal(p.options.selfRate, "");
});

test("level 3 seed 6: FUSED, peak 0.633, mean 0.266, lead 3; cards 2 and 3 open", () => {
  const p = runPage({ ...L3, seed: 6 });
  assert.equal(p.error, null, p.error);
  assert.equal(p.fate, "FUSED");
  for (const c of ["card2", "card3"]) {
    assert.deepEqual(quant(p.cardText[c]), { peak: "0.633", mean: "0.266", lead: "3" }, `${c}: ${p.cardText[c]}`);
    assert.equal(p.cards[c], "open", `${c}: ${p.cardText[c]}`);
  }
});

test("level 3 seed 1: one lost; cards 2 and 3 closed", () => {
  const p = runPage({ ...L3, seed: 1 });
  assert.equal(p.fate, "one lost");
  assert.equal(p.cards.card2, "closed", p.cardText.card2);
  assert.equal(p.cards.card3, "closed", p.cardText.card3);
});

test("level 3 seed 6 under randomMating: FUSED, peak 0.720, mean 0.507, lead 0; grey by the signature", () => {
  const p = runPage({ ...L3, seed: 6, random: true });
  assert.equal(p.fate, "FUSED");
  for (const c of ["card2", "card3"]) {
    assert.deepEqual(quant(p.cardText[c]), { peak: "0.720", mean: "0.507", lead: "0" }, `${c}: ${p.cardText[c]}`);
    assert.equal(p.cards[c], "grey", `${c}: ${p.cardText[c]}`);
    assert.match(p.cardText[c], /lead 0, not above the random-mating edge 1/);
  }
});
