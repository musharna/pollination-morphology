/*
 * M3a acceptance (northstar spec §5 Levels, §9 M3a row), in the fake browser,
 * executing the page's own script. Nothing here computes a fate, a win or a
 * card state: every value is read off the DOM the page wrote.
 *
 *  - level 3 loads N 30, 35 generations, siteN 160 into the controls BEFORE any run;
 *  - level 1 reaches realised separation 8 by moving sliders alone, and its
 *    win is that readout (it reads not-won at load: the two lineages are identical);
 *  - level 2 at seed 1, target 8: `one lost`, lost, and the authored no-known-win copy;
 *  - STALLED is a loss on a level (the M2 stall fixture under level 2);
 *  - loading any level opens no card, even straight after a run that opened one.
 */
const test = require("node:test");
const assert = require("node:assert");
const { runPage, CARDS } = require("../tools/sandbox-drive.js");
const E = require("../sim/evolve.js");

test("level 3 loads N 30, 35 generations, siteN 160 before running", () => {
  const p = runPage({ level: 3, noRun: true });
  assert.deepEqual(
    [p.controls.n, p.controls.gens, p.controls.siteN, p.controls.mode],
    ["30", "35", "160", "real"],
  );
  assert.match(p.brief, /prefers the rarer flower/);
  /* control: the free sandbox keeps the page defaults */
  const f = runPage({ level: "free", noRun: true });
  assert.deepEqual(
    [f.controls.n, f.controls.gens, f.controls.siteN],
    ["18", "24", "90"],
  );
});

test("level 1: separation 8 by sliders alone is the win; no run", () => {
  const at0 = runPage({ level: 1, noRun: true });
  assert.equal(
    at0.separation,
    "0.000",
    "level 1 does not start from two identical lineages",
  );
  assert.equal(at0.win, "pending", "level 1 read won at load");
  assert.ok(at0.controls.runDisabled, "level 1 has no run, but Run is enabled");
  /* lineage 2's anther depth swept to its upper bound moves its dot 11.2
   * body distances at DEFAULT_BEE (spec §9 M1); the page is driven by the
   * slider's own oninput, not by setLineage */
  const [, hi] = E.GENE_BOUNDS.antherT;
  const p = runPage({
    level: 1,
    noRun: true,
    slide: [[1, "antherT", hi - 0.02]],
  });
  assert.ok(+p.separation >= 8, `sliders reached only ${p.separation}`);
  assert.equal(
    p.win,
    "won",
    `separation ${p.separation} did not read as the win`,
  );
  /* a slide short of 8 is not a win */
  const lo = runPage({ level: 1, noRun: true, slide: [[1, "antherT", 0.5]] });
  assert.ok(+lo.separation < 8, `control separation ${lo.separation}`);
  assert.equal(lo.win, "pending");
});

test("level 2 at seed 1 (target 8): one lost, lost, no-known-win copy", () => {
  const p = runPage({ level: 2, seed: 1, useD: true, d: 8 });
  assert.equal(p.error, null, p.error);
  assert.deepEqual(
    [p.controls.n, p.controls.gens, p.controls.siteN],
    ["30", "35", "160"],
  );
  assert.equal(p.fate, "one lost");
  assert.equal(p.win, "lost");
  assert.match(
    p.note,
    /No win from placement alone \(the sliders, no option\) is known here/,
  );
  assert.match(
    p.note,
    /seed 1/,
    "the page does not ask for the seed and settings",
  );
});

test("level 6 copy lists the known wins of levels 4 and 5", () => {
  const p = runPage({ level: 6, noRun: true });
  assert.match(
    p.note,
    /No known win from a pollination-derived minority advantage/i,
  );
  assert.match(p.note, /level 4/);
  assert.match(p.note, /level 5/);
  /* control: level 3 carries no such copy */
  const q = runPage({ level: 3, noRun: true });
  assert.doesNotMatch(q.note || "", /No known win/i);
});

test("STALLED loses on a level", () => {
  const g = { ...E.randomGenome(E.makeRng(4)), antherT: 0.825 };
  /* the stalled pair is the hand-set founding; level 2 loads target 8 */
  const p = runPage({ level: 2, seed: 1, useD: false, lineages: [g, { ...g }] });
  assert.equal(p.fate, "STALLED");
  assert.equal(p.win, "lost", "a run that never reproduced was not a loss");
});

for (const lv of [1, 2, 3, 4, 5, 6])
  test(`loading level ${lv} opens no card`, () => {
    /* positive control first: the M2 card-4 seed opens card 4 at the page config */
    const p = runPage({
      seed: 1,
      useD: true,
      d: 8,
      n: 18,
      gens: 24,
      siteN: 90,
      thenLevel: lv,
    });
    assert.equal(p.level, String(lv));
    for (const c of CARDS)
      assert.notEqual(
        p.cards[c],
        "open",
        `${c} open after loading level ${lv}`,
      );
  });

test("control: the card-4 run does open card 4 before a level is loaded", () => {
  const p = runPage({ seed: 1, useD: true, d: 8, n: 18, gens: 24, siteN: 90 });
  assert.equal(p.cards.card4, "open");
});
