/*
 * Task 7b (visual critic round 1): the hero around the heat describes the
 * same moment as the verdict. A run ends on its LAST generation (the tiles
 * read what the fate is read on, not the founding); before any run the
 * headline names the example the heat shows, in muted ink; the fate band
 * counts stalled generations in plain words; the field legend says lineage
 * 1 / 2. Seen failing on 97eebb6 (Run showed generation 0; #sFate read "—";
 * the band read "0 of 35 generations recruited nothing"; the legend said A/B).
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { runPage } = require("../tools/sandbox-drive.js");

test("a run ends on its last generation: #scrub at its max, #sGen 'max / max'", () => {
  const p = runPage({ level: 2, seed: 3 });
  assert.equal(p.error, null, p.error);
  const d = p.page.document;
  const R = p.page.Sandbox.result();
  const max = R.gens.length - 1;
  assert.ok(max > 0, "control: the run has more than one generation");
  assert.equal(String(d.getElementById("scrub").max), String(max));
  assert.equal(d.getElementById("scrub").value, String(max));
  assert.ok(d.getElementById("sGen").textContent.startsWith(`${max} /`),
    `#sGen reads ${d.getElementById("sGen").textContent}`);
  // the tiles are the last generation's
  assert.equal(d.getElementById("sAnc").textContent, R.gens[max].ancVar.toFixed(4));
  // and #sFate is still the fate word, verbatim (the example prefix is gone)
  assert.equal(d.getElementById("sFate").textContent, R.fate);
});

test("Play at the end replays from generation 0", () => {
  const p = runPage({ level: 2, seed: 3 });
  const d = p.page.document;
  const max = p.page.Sandbox.result().gens.length - 1;
  assert.equal(d.getElementById("scrub").value, String(max), "control: the run landed at the end");
  d.getElementById("play").onclick();
  assert.equal(d.getElementById("scrub").value, "0");
  assert.ok(d.getElementById("sGen").textContent.startsWith("0 /"));
  d.getElementById("play").onclick(); // pause: stop the interval
});

test("before any run: #sFate is 'example: <fate>' in muted ink, the band names the example", () => {
  const p = runPage({ noRun: true });
  const d = p.page.document;
  const X = p.page.ExampleHeat;
  assert.ok(X && X.fate, "control: the example is loaded");
  const f = d.getElementById("sFate");
  assert.equal(f.textContent, `example: ${X.fate}`);
  assert.equal(f.style.color, "var(--ink-2)");
  assert.equal(d.getElementById("sFateBand").textContent,
    `an example run (level ${X.config.level}, seed ${X.config.seed}) — press Run for yours`);
  // a level change after a run (clearResult) restores it; control: the run replaced it
  const q = runPage({ level: 2, seed: 3 });
  assert.equal(q.fate, q.page.Sandbox.result().fate, "control: after a run #sFate is the fate word");
  assert.notEqual(q.page.document.getElementById("sFate").style.color, "var(--ink-2)");
  const r = runPage({ level: 2, seed: 3, thenLevel: 3 });
  assert.equal(r.page.document.getElementById("sFate").textContent, `example: ${X.fate}`);
});

test("the fate band reads 'stalled generations: k of N', 'none' at k = 0", () => {
  const p = runPage({ level: 2, seed: 3 });
  const band = p.page.document.getElementById("sFateBand").textContent;
  const N = p.page.Sandbox.result().gens.length;
  assert.equal(p.page.Sandbox.result().stalledGens, 0, "control: this run has no stall");
  assert.ok(band.startsWith(`stalled generations: none of ${N} · `), band);
  assert.doesNotMatch(band, /recruited nothing/);
});

test("the field legend says lineage 1 / lineage 2", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "sandbox.html"), "utf8");
  const key = /<div class="key">([\s\S]*?)<\/div>/.exec(html);
  assert.ok(key, "control: the legend is found");
  assert.match(key[1], /lineage 1<\/span>/);
  assert.match(key[1], /lineage 2<\/span>/);
  assert.doesNotMatch(key[1], /lineage [AB]\b/);
});

/* Task 7b fix round 1 (M3): while the field shows the founders, its live
 * mirror carries the founders' caption and its aria-label describes them; a
 * run restores both. Seen failing on 2effaa0. */
test("the field's live text and aria-label describe the founders before a run, the patch after", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "sandbox.html"), "utf8");
  const patchAria = /<canvas\s+id="field"[\s\S]*?aria-label="([^"]+)"/.exec(html)[1];
  const p = runPage({ noRun: true });
  const f = p.page.document.getElementById("field");
  assert.match(p.page.document.getElementById("fieldLive").textContent,
    /the two founders, from the sliders — press Run to grow a field/);
  assert.match(f.getAttribute("aria-label"), /founding flowers, from the sliders/);
  const q = runPage({ level: 2, seed: 3 });
  const g = q.page.document.getElementById("field");
  assert.equal(g.getAttribute("aria-label"), patchAria);
  assert.match(q.page.document.getElementById("fieldLive").textContent, /^Generation \d+ of \d+\./);
  // and a level change after the run (clearResult) brings the founders back
  const r = runPage({ level: 2, seed: 3, thenLevel: 3 });
  assert.match(r.page.document.getElementById("field").getAttribute("aria-label"), /founding flowers/);
});
