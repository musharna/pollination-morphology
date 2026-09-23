/*
 * M2 negative control: the null tables' seeds 1 to 5 at both targets under
 * randomMating (northstar spec §9 M2 row). Each quantity must sit on the null
 * side of its card's edge (card 4: 23 of 24 hybrid generations; card 1: ratio
 * 1.146 or more, or Infinity), and — round 6, grey wins — cards 1 AND 4 must be
 * `grey` on all ten, because randomMating is outside both signatures, whatever
 * the quantities say. A page that decided open/closed before the signature
 * would draw these `closed` and fail here.
 */
const test = require("node:test");
const assert = require("node:assert");
const { runPage } = require("../tools/sandbox-drive.js");

for (const seed of [1, 2, 3, 4, 5])
  for (const d of [4, 8])
    test(`random-mating null, target ${d}, seed ${seed}: quantities on the null side, cards 1 and 4 grey`, () => {
      const p = runPage({ seed, useD: true, d, n: 18, gens: 24, siteN: 90, random: true });
      assert.equal(p.error, null, `the page refused to run: ${p.error}`);
      assert.equal(p.hybGens, 23, "hybrid generations are not 23");
      assert.equal(p.hybOf, 24);
      assert.ok(p.ratio !== null, "no receipt ratio on a null run");
      assert.ok(
        p.ratio === "Infinity" || +p.ratio >= 1.146,
        `ratio ${p.ratio} is not on the null side (>= 1.146 or Infinity)`,
      );
      assert.equal(p.cards.card1, "grey", "card 1 is not grey under randomMating");
      assert.equal(p.cards.card4, "grey", "card 4 is not grey under randomMating");
      assert.match(p.cardText.card4, /measured at .*; this run .*random mating/);
    });
