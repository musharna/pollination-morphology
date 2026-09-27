# Sandbox Intro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A stranger landing on `sandbox.html` knows, from the first screen, what the page asks and what the result they see means.

**Architecture:** One pure function, `AncestryHeat.story(model, fate)`, turns a heat model and the engine's fate into a plain answer ("Yes"/"No" + an authored caption) and up to three marks on the plot. `drawHeat` draws those marks. The page shows a premise sentence in the header, puts the caption under the fate word (replacing the grey subtitle) for every run and for the example on load, and tells the reader the blank stat tiles fill in on Run.

**Tech Stack:** Classic browser scripts (IIFE + CommonJS for tests), canvas 2D, `node --test` with `tools/sandbox-drive.js` (`runPage`) and `tools/fake-dom.js`; Playwright (Python) for the smoke and the screenshots.

**Spec:** the grill ledger `grill_pollen_sandbox_intro_2026-09-27.md` (user memory dir; decisions Q1–Q5, A1–A12, restated in Global Constraints below — the executor does not need the file).

## Global Constraints

- Scope: `sandbox.html`, `ancestry-heat.js`, their tests, `tools/smoke-site.py` if a pinned string moves. The engine (`sim/`, `population-run.js`) is untouched; `tools/work-count.js` must report +0 against both baselines.
- Copy is plain and short: no TL;DR boxes, no flourishes, no exclamation marks.
- Every reader-facing sentence is authored per fate — never built by regex or string surgery on other text. Numbers may be substituted into an authored template.
- The fate is the engine's (`sim/ibm.js` `fateOf`); the page never re-decides it. `story()` only explains it.
- "About this page" (`#about`) stays a collapsed `<details>` for the detail; the first screen must not depend on opening it.
- The 3D view and the stat tiles get nothing new except the "fill in when you press Run" hint.
- Marks must fit at phone width or not be drawn; the caption is always shown.
- Headless browsers: default Playwright launch only — never `--enable-gpu`, d3d12 or vulkan.
- No tracked file may contain the private paths or session URLs that `.github/workflows/leak-guard.yml` blocks.

## Review Focus

1. A "one lost" run where the lost lineage keeps a straggler to the end (engine calls "one lost" on the MEAN). Expected: caption still names the lost lineage; no "gone" mark (it is not gone). → Task 1 test.
2. A STALLED run with k < N stalled generations (some generations recruited). Expected: caption says "k of N", not "every generation". → Task 1 test.
3. Two marks on the same or adjacent columns (e.g. stall and first hybrids at generation 1). Expected: neither label is drawn over the other. → Task 2 test.
4. The narrow (phone) hero, heat ~300 px wide. Expected: no marks, no label overflowing the canvas; caption still in `#sFateSub`. → Task 2 test (canvas) + Task 3 test (caption present).
5. Changing level after a run (clearResult). Expected: caption returns to the example's, the stats hint reappears. → Task 3 test.

---

### Task 1: `story()` — the answer, the caption and the marks

**Files:**
- Modify: `ancestry-heat.js` (add `story`, `lostLineage`; export both)
- Test: `tests/ancestry-story.test.js` (create)

**Interfaces:**
- Consumes: the heat model `{ bins, v0, heldLine, cols: [{ g, final, n, counts[20], hyb, ancVar, stalled }] }` from `heatModel` (last column is the final offspring, `final: true`).
- Produces: `AncestryHeat.story(model, fate) -> { answer: "Yes" | "No", caption: string, marks: [{ col: number, row: "top" | "mid" | "bottom", text: string }] }` and `AncestryHeat.lostLineage(model) -> 1 | 2`. Throws on an unknown fate.

- [ ] **Step 1: Write the failing tests** — `tests/ancestry-story.test.js`:

```js
/*
 * The run's story (sandbox intro, 2026-09-27): story(model, fate) answers the
 * page's question — do the two lineages stay two kinds? — for each of the
 * engine's five fates, in authored words, and marks where on the plot it
 * happened. Seen failing: story did not exist.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const H = require("../ancestry-heat.js");

/* a column: l1 plants at ancestry 0 (bin 0), mid hybrids at 0.5 (bin 10),
 * l2 plants at ancestry 1 (bin 19) */
const col = (g, l1, mid, l2, o = {}) => {
  const counts = new Array(20).fill(0);
  counts[0] = l1; counts[10] = mid; counts[19] = l2;
  return { g, final: !!o.final, n: l1 + mid + l2, counts, hyb: mid, ancVar: 0.1, stalled: !!o.stalled };
};
const model = (cols) => ({ bins: 20, v0: 0.25, heldLine: 0.1, cols });

test("HELD answers Yes; no marks when nothing happened", () => {
  const s = H.story(model([col(0, 15, 0, 15), col(1, 15, 0, 15), col(2, 15, 0, 15, { final: true })]), "HELD");
  assert.equal(s.answer, "Yes");
  assert.equal(s.caption, "Yes — they stayed two kinds: the last plants' ancestry is still split between the two lineages.");
  assert.deepEqual(s.marks, []);
});

test("one lost names the lost lineage and marks where it was last seen", () => {
  const s = H.story(model([col(0, 15, 0, 15), col(1, 20, 0, 10), col(2, 30, 0, 0), col(3, 30, 0, 0, { final: true })]), "one lost");
  assert.equal(s.answer, "No");
  assert.equal(s.caption, "No — lineage 2 was lost: the last plants' ancestry is over 85% lineage 1.");
  assert.deepEqual(s.marks, [{ col: 2, row: "bottom", text: "lineage 2 gone" }]);
  const t = H.story(model([col(0, 15, 0, 15), col(1, 0, 0, 30), col(2, 0, 0, 30, { final: true })]), "one lost");
  assert.equal(t.caption, "No — lineage 1 was lost: the last plants' ancestry is over 85% lineage 2.");
  assert.deepEqual(t.marks, [{ col: 1, row: "top", text: "lineage 1 gone" }]);
});

test("one lost with a straggler to the end: named, but not marked gone", () => {
  const s = H.story(model([col(0, 15, 0, 15), col(1, 29, 0, 1), col(2, 29, 0, 1, { final: true })]), "one lost");
  assert.equal(s.caption, "No — lineage 2 was lost: the last plants' ancestry is over 85% lineage 1.");
  assert.deepEqual(s.marks, []);
});

test("FUSED marks the first hybrids", () => {
  const s = H.story(model([col(0, 15, 0, 15), col(1, 14, 2, 14), col(2, 2, 26, 2, { final: true })]), "FUSED");
  assert.equal(s.caption, "No — they blended: the last plants' ancestry mixes both lineages, and the split between them has collapsed.");
  assert.deepEqual(s.marks, [{ col: 1, row: "mid", text: "first hybrids" }]);
});

test("STALLED counts stalled generations, k of N, and marks the first", () => {
  const s = H.story(model([col(0, 15, 0, 15), col(1, 15, 0, 15, { stalled: true }), col(2, 15, 0, 15, { stalled: true }), col(3, 15, 0, 15, { final: true })]), "STALLED");
  assert.equal(s.caption, "No — it stalled: 2 of 3 generations made no new plants, so the old ones were carried forward. That is not staying two kinds.");
  assert.deepEqual(s.marks, [{ col: 1, row: "mid", text: "stalled: no new plants" }]);
});

test("BOTH LOST answers No with no marks", () => {
  const s = H.story(model([col(0, 15, 0, 15), col(1, 1, 0, 0, { final: true })]), "BOTH LOST");
  assert.equal(s.caption, "No — the population died out: fewer than two plants were left.");
  assert.deepEqual(s.marks, []);
});

test("marks come in order stall, lost, hybrids, at most three", () => {
  const s = H.story(model([col(0, 15, 0, 15), col(1, 15, 0, 15, { stalled: true }), col(2, 20, 2, 8), col(3, 30, 0, 0), col(4, 30, 0, 0, { final: true })]), "one lost");
  assert.deepEqual(s.marks.map((m) => m.text), ["stalled: no new plants", "lineage 2 gone", "first hybrids"]);
});

test("an unknown fate throws", () => {
  assert.throws(() => H.story(model([col(0, 15, 0, 15), col(1, 15, 0, 15, { final: true })]), "held"), /unknown fate/);
});
```

- [ ] **Step 2: Run to see it fail**

Run: `node --test tests/ancestry-story.test.js`
Expected: FAIL — `H.story is not a function`.

- [ ] **Step 3: Implement** — in `ancestry-heat.js`, above `const api = ...`:

```js
  /* ---- the run's story (sandbox intro, 2026-09-27). The page's question is
   * "do they stay two kinds?"; the engine's fate answers it (only HELD is a
   * yes) and this explains the answer in authored words, one sentence per
   * fate, plus up to three marks on the plot. It never re-decides the fate.
   * Pure lineage = outside the hybrid band: bins [0, HYB_FIRST) are lineage
   * 1, (HYB_LAST, BINS) lineage 2 (the band's endpoints are outside it). */
  const FATES = ["HELD", "FUSED", "one lost", "BOTH LOST", "STALLED"];
  const pure = (c, li) =>
    (li === 1 ? c.counts.slice(0, HYB_FIRST) : c.counts.slice(HYB_LAST + 1)).reduce((s, k) => s + k, 0);
  /* which lineage "one lost" lost: the engine reads the final MEAN (fateOf:
   * m < 0.15 or m > 0.85); the model keeps bins, so the mean is taken at bin
   * centres. For a "one lost" run the true mean is at least 0.35 from 0.5 and
   * a bin centre is within 0.025 of its members, so the side cannot flip. */
  function lostLineage(model) {
    const fin = model.cols[model.cols.length - 1];
    if (!fin || !fin.n) throw new Error("lostLineage: the final column is empty");
    const m = fin.counts.reduce((s, k, b) => s + k * ((b + 0.5) / BINS), 0) / fin.n;
    return m < 0.5 ? 2 : 1;
  }
  function story(model, fate) {
    if (!FATES.includes(fate)) throw new Error(`story: unknown fate ${JSON.stringify(fate)}`);
    const cols = model.cols;
    const N = cols.filter((c) => !c.final).length;
    const k = cols.filter((c) => c.stalled).length;
    const marks = [];
    const s = cols.findIndex((c) => c.stalled);
    if (s >= 0) marks.push({ col: s, row: "mid", text: "stalled: no new plants" });
    let lost = null;
    if (fate === "one lost") {
      lost = lostLineage(model);
      /* the first column from which the lost lineage has no pure plant, to
       * the end; a straggler in the final column means it is not gone */
      let i = cols.length;
      while (i > 0 && pure(cols[i - 1], lost) === 0) i--;
      if (i < cols.length) marks.push({ col: i, row: lost === 1 ? "top" : "bottom", text: `lineage ${lost} gone` });
    }
    const h = cols.findIndex((c) => c.hyb > 0);
    if (h >= 0) marks.push({ col: h, row: "mid", text: "first hybrids" });
    const caption = {
      HELD: "Yes — they stayed two kinds: the last plants' ancestry is still split between the two lineages.",
      FUSED: "No — they blended: the last plants' ancestry mixes both lineages, and the split between them has collapsed.",
      "one lost": lost && `No — lineage ${lost} was lost: the last plants' ancestry is over 85% lineage ${3 - lost}.`,
      "BOTH LOST": "No — the population died out: fewer than two plants were left.",
      STALLED: `No — it stalled: ${k} of ${N} generations made no new plants, so the old ones were carried forward. That is not staying two kinds.`,
    }[fate];
    return { answer: fate === "HELD" ? "Yes" : "No", caption, marks: marks.slice(0, 3) };
  }
```

and extend the export: `const api = { BINS, binOf, heatModel, layout, colAt, drawHeat, drawEmpty, ancHex, story, lostLineage };`

- [ ] **Step 4: Run to see it pass**

Run: `node --test tests/ancestry-story.test.js tests/ancestry-heat.test.js`
Expected: PASS, all tests.

- [ ] **Step 5: See each assertion fail for its reason** — mutate once each, run, restore with an explicit copy of the saved file (never `git checkout`): (a) `m < 0.5 ? 2 : 1` → `m < 0.5 ? 1 : 2` fails both one-lost tests; (b) drop the straggler loop (always push the mark at `cols.length - 1`) fails "straggler"; (c) `c.hyb > 0` → `c.hyb > 1` fails "FUSED marks the first hybrids" (its first hybrid column has 2 — use `c.hyb > 2`). Record the three outcomes in the report.

- [ ] **Step 6: Commit**

```bash
git add ancestry-heat.js tests/ancestry-story.test.js
git commit -m "story(): the fate as a plain answer, one authored caption per fate, up to three plot marks"
```

---

### Task 2: `drawHeat` draws the marks

**Files:**
- Modify: `ancestry-heat.js` `drawHeat` (after the cursor, before/with the labels section)
- Test: `tests/ancestry-marks.test.js` (create)

**Interfaces:**
- Consumes: `story(...).marks` from Task 1.
- Produces: `drawHeat(ctx, model, o)` accepts `o.marks` (array, optional) and returns `{ marks: <number drawn> }`. Constant `MARKS_MIN_W = 360` (plot width `W - padL - PAD.R` below which no mark is drawn), exported on the api.

- [ ] **Step 1: Write the failing tests** — `tests/ancestry-marks.test.js`. Use a recording ctx: a `Proxy` whose method calls push `{ fn, args, textAlign, fillStyle, lineWidth }` and whose `measureText(s)` returns `{ width: 6.2 * s.length }` (the pattern in `tests/sandbox-7e.test.js` `recorder`). Load `example-heat.js` into `globalThis` (`require("../example-heat.js")` with `globalThis.window = globalThis` first) for a real model. Tests:

```js
const plates = (calls) => /* every fillRect drawn in PLATE "#101216" colour, as {x, y, w, h} */;
const texts = (calls) => calls.filter((c) => c.fn === "fillText").map((c) => c.args[0]);

test("the example's marks are drawn once each, inside the heat, on plates that do not overlap", () => {
  const X = globalThis.ExampleHeat;
  const marks = H.story(X.model, X.fate).marks;
  assert.ok(marks.length >= 1, "the example (one lost) must have at least the lost mark");
  const r = recorder();
  const out = H.drawHeat(r.ctx, X.model, { W: 566, H: 420, cursor: -1, fate: X.fate, marks });
  assert.equal(out.marks, marks.length);
  for (const m of marks) assert.equal(texts(r.calls).filter((t) => t === m.text).length, 1, m.text);
  const lay = H.layout(X.model, 566, 420);
  const ps = markPlates(r.calls, marks); // the plate drawn just before each mark's fillText
  for (const p of ps) {
    assert.ok(p.x >= lay.padL && p.x + p.w <= 566 - 16, "inside the plot horizontally");
    assert.ok(p.y >= lay.heatTop && p.y + p.h <= lay.heatBot, "inside the heat vertically");
  }
  for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) assert.ok(!overlap(ps[i], ps[j]));
});

test("two marks on adjacent columns in the same row do not overlap (the second moves or is dropped)", () => {
  /* synthetic model: stall at gen 1, first hybrids at gen 2 — both row "mid" */
});

test("narrow heat: no marks, returns 0; no label runs past the canvas", () => {
  const out = H.drawHeat(r.ctx, X.model, { W: 300, H: 420, cursor: -1, fate: X.fate, marks });
  assert.equal(out.marks, 0);
  /* every fillText's right edge (by textAlign, measured 6.2 px/char or maxWidth) <= 300 */
});

test("no o.marks: drawHeat draws exactly what it drew before (same fillText list)", () => {
  /* compare against a call with marks: [] */
});
```

Fill in `markPlates` / `overlap` / the synthetic model as ordinary helpers — they are test plumbing, not requirements.

- [ ] **Step 2: Run to see it fail** — `node --test tests/ancestry-marks.test.js` → FAIL (`out` is undefined).

- [ ] **Step 3: Implement** in `drawHeat`, in the labels section (after the axis row, before the hatch key), when `Array.isArray(o.marks) && o.marks.length && (W - lay.padL - PAD.R) >= MARKS_MIN_W`:
  - a 1 px tick in `#e8e6e1` at the column's centre, the full heat height (`heatTop`..`heatBot`), `globalAlpha` 0.6;
  - the label, `plated()`, 11px, ink `#e8e6e1`, at y by row: `top` → `lay.heatTop + 26` (below the "lineage 1" gutter row's baseline), `mid` → `(lay.heatTop + lay.heatBot) / 2 - 16` (above the "hybrid band" gutter label's baseline), `bottom` → `lay.heatBot - 18`;
  - x: left-aligned at the tick + 4; if its right edge would pass the separator `sepX - 4`, right-aligned at the tick − 4 instead;
  - before drawing, test the plate rect against every mark plate already drawn this call: on overlap move it down 14 px once; if it still overlaps or leaves the heat, skip it;
  - count what was drawn and `return { marks: count }` at the end of `drawHeat` (also when none).

Name the constant with a comment giving the measured reason: at 11px system-ui "stalled: no new plants" is the widest mark (~120 px measured in headless Chromium — measure it and write the number); two marks plus the gutter need ≥ 360 px of plot.

- [ ] **Step 4: Run** — `node --test tests/ancestry-marks.test.js tests/ancestry-heat.test.js tests/sandbox-heat.test.js tests/sandbox-7e.test.js` → PASS.

- [ ] **Step 5: See it fail** — mutate `MARKS_MIN_W` to 0 (narrow test fails) and remove the overlap check (adjacent test fails); restore from a saved copy; record both.

- [ ] **Step 6: Commit** — `git commit -m "drawHeat draws story marks: tick + plated label per mark, no overlap, none below 360 px of plot"`

---

### Task 3: the page tells its story

**Files:**
- Modify: `sandbox.html` — header `.lede` (line ~437), `#sFateSub` (verdict, ~588), a new `#statsHint` before `.stats` (~644), `showResult`, `clearResult`, `drawHeat` (the page's, ~2866), `heatLive` text
- Modify: `tests/sandbox-7e.test.js:224-225` (the two `#sFateSub` asserts move to the captions)
- Test: `tests/sandbox-intro.test.js` (create)
- Check: `tools/smoke-site.py` for any pinned lede / subtitle string (none found at plan time: `grep -rn "Pick a level\|run's last offspring" tools` was empty); update only if the run shows one.

**Interfaces:**
- Consumes: `AncestryHeat.story(model, fate)` (Task 1); `drawHeat(..., { marks })` (Task 2).
- Produces: `#sFateSub` = the caption; `#statsHint` shown with no run, `hidden` after one.

- [ ] **Step 1: Write the failing tests** — `tests/sandbox-intro.test.js`, fixtures copied from `tests/sandbox-7e.test.js` (STALL = `pair(0.825)`, CTRL = `pair(0.8)` at `LEVEL`), plus `runPage({ noRun: true })` and `runPage({ level: 2, seed: 3, thenLevel: 3 })`:

```js
test("the header states the premise and the question before any run", () => {
  const p = runPage({ noRun: true });
  const lede = $(p, "wrap").querySelector(".lede").textContent.replace(/\s+/g, " ").trim();
  assert.equal(lede, "In nature, two orchids can share one bee and still never cross-pollinate, when one puts its pollen on the bee's back and the other on its belly. Here two flower lineages start with their pollen in different places on the bee. Press Run and watch the generations: do they stay two kinds, or blend into one?");
  assert.equal($(p, "about").hasAttribute("open"), false, "about stays collapsed");
});

test("on load the caption answers for the example, and the stats say they wait for Run", () => {
  const p = runPage({ noRun: true });
  assert.equal($(p, "sFateSub").textContent,
    "example run's answer: No — lineage 2 was lost: the last plants' ancestry is over 85% lineage 1.");
  assert.equal($(p, "statsHint").hidden, false);
  assert.equal($(p, "statsHint").textContent, "These fill in when you press Run.");
});

test("a run's caption is its fate's, and the hint hides", () => {
  assert.match($(STALL, "sFateSub").textContent, /^No — it stalled: 35 of 35 generations made no new plants/);
  assert.equal($(CTRL, "sFateSub").textContent,
    "No — they blended: the last plants' ancestry mixes both lineages, and the split between them has collapsed.");
  assert.equal($(STALL, "statsHint").hidden, true);
});

test("a level change after a run restores the example's caption and the hint", () => {
  const p = runPage({ level: 2, seed: 3, thenLevel: 3 });
  assert.match($(p, "sFateSub").textContent, /^example run's answer: /);
  assert.equal($(p, "statsHint").hidden, false);
});

test("the heat's live text carries the caption", () => {
  assert.match($(STALL, "heatLive").textContent, /No — it stalled/);
});
```

(Adjust how `runPage` exposes the document if `$(p, id)` differs — `tests/sandbox-7e.test.js` uses `p.page.document.getElementById(id)`.)

- [ ] **Step 2: Run to see it fail** — `node --test tests/sandbox-intro.test.js` → FAIL on the lede.

- [ ] **Step 3: Implement**
  - `.lede` text: exactly the string in the first test (keep it in the `<p class="lede">`; wrap as the file does).
  - `<p id="statsHint" class="note">These fill in when you press Run.</p>` as the first child of `.heroFoot`'s `.stats` sibling position (just before `<div class="stats">`); `clearResult` sets `hidden = false`, `showResult` sets `hidden = true`.
  - `showResult(R)`: `const S = window.AncestryHeat.story(HEAT, R.fate);` — `HEAT` must already be built for this run when `showResult` runs; if it is not, build the story where `HEAT` is set and store it (`STORY`). `$("sFateSub").textContent = S.caption;` (replacing both current subtitle strings). Keep `#sFateBand` as it is (the detail: stall sentence, counts, the HELD rule).
  - `clearResult`: with the example present, `$("sFateSub").textContent = "example run's answer: " + story(X.model, X.fate).caption;` with none, `"fate (the run's last offspring)"` stays as the no-example fallback.
  - page `drawHeat()`: pass `marks: STORY.marks` (run) / `story(X.model, X.fate).marks` (example) into `A.drawHeat`; append `" " + caption` to both `heatLive` texts.
  - `tests/sandbox-7e.test.js:224-225`: assert the new captions (STALL's starts `No — it stalled`; CTRL's is the FUSED caption) — the old strings are gone by design.

- [ ] **Step 4: Run** — `node --test tests/sandbox-intro.test.js tests/sandbox-7e.test.js tests/sandbox-hero.test.js tests/sandbox-heat.test.js tests/sandbox-m2-stall.test.js tests/a11y.test.js` → PASS (7e takes ~11 min; it is not hung).

- [ ] **Step 5: See it fail** — revert the lede only (saved copy) → test 1 fails; make `showResult` skip the caption → test 3 fails; restore; record.

- [ ] **Step 6: Build + smoke** — `tools/build-site.sh && python3 tools/smoke-site.py site` → exit 0.

- [ ] **Step 7: Commit** — `git commit -m "sandbox: premise in the header, every run's fate captioned as the page's answer, marks on the heat, stats hint"`

---

### Task 4: independent visual critic (controller-run)

Screens (default Playwright launch, 1440×900 and 390×844 at DPR 2): (1) load, (2) level 2 seed 3 run, (3) the stall fixture via `window.Sandbox.setLineage` both lineages `antherT 0.825` + Run, (4) level 5 run, (5) the narrow load. A fresh critic subagent (opus) that has never seen the project gets the screenshots and the question "do they stay two kinds?" framing only, and returns MAJOR/MINOR findings with a PASS/FAIL. Fix MAJORs in a fix task, re-critic with a new fresh critic; stop at PASS or after 3 rounds (then rule on residuals in the ledger).

### Task 5: cold-reader gate (controller-run)

- Current page: build `dd139f8`'s `sandbox.html` (`git show dd139f8:sandbox.html`, served beside the same scripts from a `git worktree` at dd139f8); new page: this branch's build.
- States: (A) default landing, first screen only (1440×900); (B) the stall fixture run, first screen only.
- 12 readers: 3 fresh subagents (opus, no project context, no tools except Read of their one image) × {current, new} × {A, B}. Prompt (verbatim to all): "This is a screenshot of a web page someone sent you. In two sentences: what question is this page asking? And what is the result shown — what does it mean for that question?"
- Scoring (controller, against the rubric, before seeing which arm a reply came from — arms are shuffled and labelled R1..R12): question correct = says two flower lineages/kinds sharing a pollinator and whether they stay separate/distinct (vs blend/merge); result correct = A: one lineage lost / did not stay two kinds; B: the run stalled / no new plants / not a hold. Any reader of B who says the lineages "stayed separate / held / stayed two kinds" is a stall-as-hold failure.
- PASS: new page ≥ 2/3 correct on both question and result in A and in B, zero stall-as-hold on new B, and the current page scores lower than the new one in at least one state. FAIL → one fix round from the readers' wrong answers, then re-gate once; a second FAIL is reported, not merged.
- Persist all 12 replies, the scoring and the verdict to the ledger before acting.

### Task 6: full gate and merge (controller-run)

`node --test tests/` (~29 min), `node tools/work-count.js` (+0 both baselines), `tools/build-site.sh`, `python3 tools/smoke-site.py site`; CHANGELOG `[Unreleased] → Added` one entry; `git merge --no-ff intro` onto master, push, watch Pages + leak-guard, live check (load / stall / level 2 captions, 0 page errors), remove the worktree, delete the branch.
