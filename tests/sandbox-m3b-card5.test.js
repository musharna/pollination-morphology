/*
 * M3b acceptance, card 5 and its in-page flat arm (northstar spec §9 M3b row;
 * §4 card 5), in the fake browser, executing the page's own script. Founding:
 * "found at target d" ON at 8, the null tables' protocol (`card5`: R200 is the
 * flat floor, R200q69 / R200q85 the cover arms).
 *
 *  - level 4 at q = 0.85, seed 8: `one lost`, flat arm HELD, card 5 opens;
 *  - q = 1, seed 8: `one lost`, flat HELD, card 5 CLOSED (no self weight spent);
 *  - q = 0.69, seed 1: HELD, flat `one lost`, closed, the reversed pair printed.
 */
const test = require("node:test");
const assert = require("node:assert");
const { runPage } = require("../tools/sandbox-drive.js");

const L4 = { level: 4, useD: true, d: 8 };
const pair = (t) => {
  const m = /this run (HELD|one lost|FUSED|BOTH LOST|STALLED); its flat arm \(q = 0, same rate\) (HELD|one lost|FUSED|BOTH LOST|STALLED)/.exec(t || "");
  return m ? [m[1], m[2]] : null;
};

test("level 4 loads the sweep's option object into the controls", () => {
  const p = runPage({ level: 4, noRun: true });
  assert.deepEqual(
    [p.options.selfRate, p.options.selfCost, p.options.selfCover],
    ["2", "0", "0.69"],
  );
  assert.equal(p.options.phenOn, true);
  assert.deepEqual([p.options.phenSlices, p.options.phenWidth], ["8", "0.12"]);
  assert.equal(p.options.phenWidthLocus, false);
  assert.equal(p.options.phenPropVisits, false);
  assert.equal(p.options.visitsPerPlant, "800");
});

test("level 4, q = 0.85, seed 8: one lost, flat HELD, card 5 open", () => {
  const p = runPage({ ...L4, seed: 8, options: { selfCover: 0.85 } });
  assert.equal(p.error, null, p.error);
  assert.equal(p.fate, "one lost");
  assert.deepEqual(pair(p.cardText.card5), ["one lost", "HELD"], p.cardText.card5);
  assert.equal(p.cards.card5, "open", p.cardText.card5);
});

test("level 4, q = 1, seed 8: one lost, flat HELD, card 5 CLOSED", () => {
  const p = runPage({ ...L4, seed: 8, options: { selfCover: 1 } });
  assert.equal(p.fate, "one lost");
  assert.deepEqual(pair(p.cardText.card5), ["one lost", "HELD"], p.cardText.card5);
  assert.equal(p.cards.card5, "closed", p.cardText.card5);
  assert.match(p.cardText.card5, /cover 1/);
});

test("level 4, q = 0.69, seed 1: HELD, flat one lost, card 5 closed, reversed pair printed", () => {
  const p = runPage({ ...L4, seed: 1 });
  assert.equal(p.fate, "HELD");
  assert.deepEqual(pair(p.cardText.card5), ["HELD", "one lost"], p.cardText.card5);
  assert.equal(p.cards.card5, "closed", p.cardText.card5);
  assert.match(p.cardText.card5, /reversed/);
});
