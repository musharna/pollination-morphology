/*
 * Critic round 1 fixes (sandbox intro, task 3b, 2026-09-27):
 *  - MAJOR 1: a STALLED run's field says its plants are the founders carried
 *    forward, so it cannot read as HELD.
 *  - MAJOR 2: no source-file reference in first-screen text; each moves to
 *    its element's title (hover provenance).
 *  - MAJOR 3: the level's long note and options sit in a collapsed
 *    "about this level" under the one-line level description.
 *  - MINOR: the answer caption is styled larger and in the main ink (CSS is
 *    checked here by rule; tools/smoke-site.py checks the computed styles).
 * Seen failing on the pre-3b page (task-3b report).
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { runPage } = require("../tools/sandbox-drive.js");
const E = require("../sim/evolve.js");

const SRC = fs.readFileSync(
  process.env.SANDBOX_PAGE || path.join(__dirname, "..", "sandbox.html"), "utf8");
const $ = (p, id) => p.page.document.getElementById(id);
const LEVEL = { seed: 1, n: 30, gens: 35, siteN: 160, useD: false };
const pair = (antherT) => {
  const g = { ...E.randomGenome(E.makeRng(4)), antherT };
  return [g, { ...g }];
};
const STALL = runPage({ ...LEVEL, lineages: pair(0.825) });
const CTRL = runPage({ ...LEVEL, lineages: pair(0.8) }); // FUSED, no stall
const L2 = runPage({ level: 2, seed: 3 }); // one lost: the level's note + "This run: ..."
const L5 = runPage({ level: 5, seed: 1, useD: true, d: 8 }); // phenology, HELD
const LOAD = runPage({ noRun: true });

test("control: the fixtures ran to the fates they stand for", () => {
  assert.equal(STALL.fate, "STALLED");
  assert.equal(CTRL.fate, "FUSED");
  assert.equal(L2.error, null);
  assert.equal(L2.fate, "one lost");
  assert.equal(L2.win, "lost");
  assert.equal(L5.error, null);
  assert.equal(L5.fate, "HELD");
});

test("MAJOR 1: a STALLED run's field caption says the plants are the first generation's, carried forward", () => {
  assert.equal(STALL.fieldCaption,
    "No new plants were made: these are the first generation's plants, carried forward unchanged.");
  assert.equal(CTRL.fieldCaption, "", "control: a run that recruits has no such caption");
  assert.equal(L5.fieldCaption, "No bee path shown: this level's flowering-season model doesn't record one.",
    "control: a phenology run that recruits keeps its own note");
});

/* 3b fix round 1 (I1): STALLED means ANY generation recruited nothing
 * (sim/ibm.js fateOf), so only k = N shows the founders; k < N gets its own
 * authored line. No page fixture stalls partway, so the page's caption
 * function is tested directly, as Sandbox.stallSentence is (7e). */
test("I1: the STALLED field caption words k = N and k < N apart", () => {
  const f = STALL.page.Sandbox.fieldCaptionFor;
  assert.equal(typeof f, "function", "the page exposes Sandbox.fieldCaptionFor");
  assert.equal(f("STALLED", 35, 35, false).text,
    "No new plants were made: these are the first generation's plants, carried forward unchanged.");
  assert.equal(f("STALLED", 10, 35, false).text,
    "Some generations made no new plants; in those, the plants were carried forward unchanged.");
  assert.equal(f("STALLED", 1, 24, true).text,
    "Some generations made no new plants; in those, the plants were carried forward unchanged.");
  /* spread: the page object is from the page's realm (vm context) */
  assert.deepEqual({ ...f("HELD", 0, 35, true) }, {
    text: "No bee path shown: this level's flowering-season model doesn't record one.",
    title: "sim/ibm.js:1432-1438: the sliced season logs no bout",
  });
  assert.deepEqual({ ...f("FUSED", 0, 35, false) }, { text: "", title: null });
  /* the page's own call agrees: the stall fixture is k = N */
  assert.equal(STALL.stalledGens, 35);
  assert.equal(STALL.fieldCaption, f("STALLED", 35, 35, false).text);
});

test("MAJOR 2: no source-file reference in first-screen text; each is kept as a title", () => {
  const ids = ["sFate", "sFateSub", "sFateBand", "fieldCaption", "levelBrief", "levelNote", "status", "levelWin"];
  const REF = /sim\/|docs\/|\.js\b|\.md\b/;
  for (const [tag, p] of [["stall", STALL], ["fused", CTRL], ["level 2", L2], ["level 5", L5], ["load", LOAD]])
    for (const id of ids) {
      const t = $(p, id).textContent || "";
      assert.doesNotMatch(t, REF, `${tag} #${id}: ${t}`);
    }
  assert.ok(L2.note.length > 0 && CTRL.page.document.getElementById("sFateBand").textContent.length > 0,
    "control: the texts checked are not empty");
  for (const p of [STALL, CTRL, L2, L5]) assert.equal($(p, "sFateBand").getAttribute("title"), "sim/ibm.js fateOf");
  assert.equal($(L5, "fieldCaption").getAttribute("title"), "sim/ibm.js:1432-1438: the sliced season logs no bout");
  assert.equal($(CTRL, "fieldCaption").getAttribute("title"), null, "no caption, no title");
  assert.equal($(L2, "levelNote").getAttribute("title"), "docs/2026-08-04-secondary-contact.md:36-40");
});

test("MAJOR 2: level 2's note keeps every word of the level's own text but the repo path", () => {
  const own = L2.page.SandboxRun.levelOf("2").noKnownWin;
  const ref = "docs/2026-08-04-secondary-contact.md:36-40; ";
  assert.ok(own.includes(ref), "control: the level's text carries the path");
  /* test-side drift check: the page's authored note is the level's text
   * without the path (the page itself never edits the level's string) */
  assert.ok(L2.note.startsWith(own.replace(ref, "") + " This run: seed 3, "), L2.note);
});

test("MAJOR 3: the level's options and note sit in a collapsed 'about this level' under the description", () => {
  assert.match(SRC,
    /<p id="levelBrief" class="note"><\/p>\s*(?:<!--[\s\S]*?-->\s*)?<details id="levelMore" hidden>\s*<summary>about this level<\/summary>\s*<p id="levelOpts" class="band"><\/p>\s*<p id="levelNote" class="note"><\/p>\s*<\/details>/);
  assert.equal($(L2, "levelMore").hidden, false, "level 2 has a note: shown");
  assert.equal($(L2, "levelMore").hasAttribute("open"), false, "collapsed");
  assert.equal($(L5, "levelMore").hidden, false, "level 5 has options: shown");
  assert.equal($(LOAD, "levelMore").hidden, true, "the free sandbox has neither: hidden");
  assert.equal($(L2, "levelBrief").textContent, "Now make them stay two kinds. Win: HELD.", "the one-line description stays");
});

test("MINOR: the answer caption's rule is the main ink and larger than the detail band", () => {
  const rule = (sel) => {
    /* the rule whose selector is exactly `sel`, at the start of a line */
    const m = SRC.match(new RegExp("^\\s*" + sel.replace(/[.#]/g, (c) => "\\" + c) + "\\s*\\{([^}]*)\\}", "m"));
    assert.ok(m, `no rule ${sel}`);
    return m[1];
  };
  const sub = rule(".verdict #sFateSub");
  assert.match(sub, /color:\s*var\(--ink\);/);
  const px = (r) => +/font-size:\s*(\d+(?:\.\d+)?)px/.exec(r)[1];
  /* #sFateBand's size comes from `.verdict span` (it beats `.band` on
   * specificity), so the caption is compared with that rule, not a constant
   * (3b fix round 1, M1). tools/smoke-site.py answer_style_check compares the
   * computed sizes in Chromium, the real guard; this is the fast proxy. */
  const band = px(rule(".verdict span"));
  assert.ok(band > 0, "control: the band's rule has a size");
  assert.ok(px(sub) >= 1.1 * band, `caption ${px(sub)}px vs band ${band}px`);
});
