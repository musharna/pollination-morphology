/*
 * M2 stall fixture (northstar spec §3 "A stall is a loss", §9 M2 row). Both
 * lineages Evolve.randomGenome(Evolve.makeRng(4)) with antherT 0.825, founded
 * by the page's hand-set recipe at seed 1, the level configuration (N 30, 35
 * generations, siteN 160), DEFAULT_BEE. Every generation recruits nothing: the
 * page must print STALLED with 35 stalled generations — never HELD, which is
 * what the founders' variance reads — and open no card: cards 1 and 4 not open,
 * 2, 3, 5, 6 grey. Controls: antherT 0.80 recruits and reads FUSED with 0
 * stalled; antherT 0.85 has a null placement and the page declines to found.
 */
const test = require("node:test");
const assert = require("node:assert");
const { runPage } = require("../tools/sandbox-drive.js");
const E = require("../sim/evolve.js");

const LEVEL = { seed: 1, n: 30, gens: 35, siteN: 160, useD: false };
const pair = (antherT) => {
  const g = { ...E.randomGenome(E.makeRng(4)), antherT };
  return [g, { ...g }];
};

test("the stall fixture reads STALLED, 35 of 35, and opens no card", () => {
  const p = runPage({ ...LEVEL, lineages: pair(0.825) });
  assert.equal(p.error, null, `the page refused to run: ${p.error}`);
  assert.equal(p.fate, "STALLED", "a run that never reproduced was not STALLED");
  assert.equal(p.stalledGens, 35);
  assert.equal(p.gensRun, 35);
  for (const k of ["card1", "card4"])
    assert.notEqual(p.cards[k], "open", `${k} opened on a STALLED run`);
  /* card 4's signature includes the level configuration: inside it, closed */
  assert.equal(p.cards.card4, "closed");
  /* card 1's signature is the PAGE configuration only (spec §4 card 1: no edge
   * at the level configuration, grey there). The M2 row says "closed"; see the
   * M2 report — the two spec lines disagree and grey-wins decides it. */
  assert.equal(p.cards.card1, "grey");
  for (const k of ["card2", "card3", "card5", "card6"])
    assert.equal(p.cards[k], "grey", `${k} is not grey`);
});

test("control: antherT 0.80 recruits and reads FUSED with 0 stalled", () => {
  const p = runPage({ ...LEVEL, lineages: pair(0.8) });
  assert.equal(p.error, null, `the page refused to run: ${p.error}`);
  assert.equal(p.fate, "FUSED");
  assert.equal(p.stalledGens, 0);
});

test("control: antherT 0.85 has no placement and the page declines to found", () => {
  const p = runPage({ ...LEVEL, lineages: pair(0.85) });
  assert.match(String(p.error), /never touches the bee/);
  assert.ok(
    !["HELD", "one lost", "FUSED", "BOTH LOST", "STALLED"].includes(p.fate),
    `a fate (${p.fate}) was printed for a run that was never founded`,
  );
  /* positive control inside the same test: the same page founds the 0.825 pair */
  const ok = runPage({ ...LEVEL, gens: 2, lineages: pair(0.825) });
  assert.equal(ok.error, null, "the page refused a pair that does touch the bee");
});
