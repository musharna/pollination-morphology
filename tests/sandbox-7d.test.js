/*
 * Task 7d (visual critic round 2): the page says which run, which pair and
 * which generation each readout is about.
 *  - M2: three separations, three names (status: the founders'; #sSep: this
 *    generation's clusters, a ratio; #sReal: the sliders' pair, not the run).
 *  - M3: the founder heading captions the thumbnail; the sliders have their
 *    own label, which on a target-d run says they did not found it.
 *  - M4: the hybrid tile is this generation's share, the band counts
 *    generations, and the two say so.
 *  - M6: the body map has a key, written from what the draw drew.
 *  - M7: on load the heat is titled "example run", the thumbnails "from the
 *    sliders"; after Run the heat has no example title.
 *  - M10: the win line reads "not won — <fate>; only HELD wins" (3c: was
 *    "result: <fate> — ...", which stuttered after "win:") and names the
 *    lost lineage; #sFate stays the bare fate word.
 *  - minor: one generation count ("34 of 34", "35 generations, numbered 0–34").
 * Seen failing on BASE e0ac728 (every test below; see the task-7d report).
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { runPage } = require("../tools/sandbox-drive.js");

const L2 = runPage({ level: 2, seed: 3 }); // target d, fate "one lost", lineage 2 gone
const HAND = runPage({ seed: 3 }); // free sandbox, hand-set founding
const LOAD = runPage({ noRun: true });
const $ = (p, id) => p.page.document.getElementById(id);
const plain = (x) => JSON.parse(JSON.stringify(x)); // the page's arrays are another realm's
/* the page under test (SANDBOX_PAGE runs these against another copy, e.g. BASE) */
const SRC = require("fs").readFileSync(
  process.env.SANDBOX_PAGE || require("path").join(__dirname, "..", "sandbox.html"), "utf8");

test("M10: the win line names the fate and the lost lineage; #sFate is the bare word", () => {
  const R = L2.page.Sandbox.result();
  assert.equal(R.fate, "one lost", "control: level 2 seed 3 loses one lineage");
  const lin2 = R.final.filter((i) => (i.anc === undefined ? 0 : i.anc) >= 0.85).length;
  assert.equal(lin2, 0, "control: lineage 2 has no plant left in the final offspring");
  assert.equal($(L2, "sFate").textContent, "one lost");
  assert.equal($(L2, "levelWin").getAttribute("data-state"), "lost");
  assert.equal($(L2, "levelWin").textContent, "not won — one lost (lineage 2 gone); only HELD wins");
});

/* Fix round 1 (I1): the engine calls "one lost" on the final MEAN ancestry
 * (sim/ibm.js fateOf), not on a label count reaching zero. The shown run's
 * final offspring is replaced by a fixture the ENGINE itself calls "one lost"
 * (IBM.fateOf, asserted), and the win line redrawn (Sandbox.setBee with the
 * bee's own values runs showWin). Lineage 1 gone, and both stragglers (one
 * plant at the other end: neither label count is 0). Seen failing on c1eb511:
 * the stragglers read bare "one lost". A page hard-coding "lineage 2 gone"
 * fails the lineage-1 cases. */
test("I1: the lost lineage is read off the final mean, as the engine decides it", () => {
  const p = runPage({ level: 2, seed: 3 });
  const S = p.page.Sandbox;
  const I = p.page.IBM;
  const R = S.result();
  const saved = R.final;
  const pop = (ancs) => ancs.map((anc) => ({ ...saved[0], anc }));
  const n = (k, a) => Array(k).fill(a);
  const cases = [
    [n(30, 1), 1], // lineage 1 gone
    [[...n(29, 0), 1], 2], // straggler at lineage 2's end
    [[...n(29, 1), 0], 1], // straggler at lineage 1's end
    [n(30, 0), 2], // control: the run's own case
  ];
  try {
    for (const [ancs, gone] of cases) {
      R.final = pop(ancs);
      assert.equal(I.fateOf(R.final, R.v0, false, false), "one lost", `control: the engine calls ${ancs.slice(-2)} one lost`);
      S.setBee(S.bee());
      assert.equal(p.page.document.getElementById("levelWin").textContent,
        `not won — one lost (lineage ${gone} gone); only HELD wins`, `final: ${ancs.filter((x) => x === 0).length} at 0, ${ancs.filter((x) => x === 1).length} at 1`);
    }
  } finally {
    R.final = saved;
  }
});

test("M2: the status names the founders' separation; #sSep and #sReal say what they measure", () => {
  const R = L2.page.Sandbox.result();
  assert.equal($(L2, "status").textContent, `founders' separation ${R.realised.toFixed(3)}`);
  /* static text: the fake DOM does not parse it, so read the source */
  /* 7e (critic r3 #3) reworded it: clusters of this generation's placements, split by placement alone */
  assert.match(SRC, /id="sSepBand"\s*>how far apart the two clusters in this generation's placements/);
  assert.match(SRC, /multiples of their own spread \(a ratio, not\s+the founders' distance\)/);
  for (const p of [L2, HAND, LOAD])
    assert.ok($(p, "sRealBand").textContent.startsWith("the sliders' pair, not the run"),
      `#sRealBand reads ${$(p, "sRealBand").textContent}`);
});

test("M3: target-d run: the founder heading is the thumbnail's caption, the sliders say they did not found it", () => {
  const html = SRC;
  for (const n of [1, 2]) {
    assert.equal($(L2, "thumbCap" + n).textContent, `lineage ${n} — this run's founder (founded at target d)`);
    assert.equal($(L2, "genesLab" + n).textContent, `hand-set lineage ${n} (sliders) — did not found this run`);
    assert.equal($(L2, "h-lin" + n).textContent, "", "the card heading was rewritten to name the founder");
    assert.match(SRC, new RegExp(`<h2 id="h-lin${n}">lineage ${n}</h2>`));
    assert.equal($(L2, "thumbSrc" + n), null, "the 7c one-line note is still on the page");
    assert.equal($(L2, "genes" + n).getAttribute("aria-labelledby"), "genesLab" + n);
    /* source order: the caption directly under its canvas; the sliders' label heads them */
    const at = (id) => html.indexOf(`id="${id}"`);
    const between = html.slice(at("thumb" + n), at("thumbCap" + n));
    // the only opening tag in the span is the caption's own <p
    assert.equal((between.match(/<(p|div|h2)\b/g) || []).length, 1, "something sits between the thumbnail and its caption");
    assert.ok(at("thumbCap" + n) < at("genesLab" + n) && at("genesLab" + n) < at("genes" + n));
    assert.equal($(HAND, "genesLab" + n).textContent, `hand-set lineage ${n} (sliders)`, "control: a hand-set run");
  }
});

test("M4: the hybrid tile is this generation's percentage; the band counts generations", () => {
  const S = L2.page.Sandbox;
  const R = S.result();
  const g = R.gens.length - 1;
  const G = R.gens[g];
  const frac = G.anc.filter(L2.page.SandboxRun.isHybrid).length / G.anc.length;
  const tile = $(L2, "sHyb").textContent;
  const m = /^(\d+(?:\.\d)?)% of plants$/.exec(tile);
  assert.ok(m, `#sHyb reads ${tile}`);
  assert.ok(Math.abs(+m[1] - frac * 100) <= 0.05, `${tile} vs ${frac}`);
  const b = /^generations with any hybrid: (\d+) of (\d+)/.exec($(L2, "sHybBand").textContent);
  assert.ok(b, `#sHybBand reads ${$(L2, "sHybBand").textContent}`);
  assert.equal(+b[2], R.gens.length);
  assert.equal(+b[1], R.q.hybGens, "the band's number changed");
  const html = SRC;
  assert.match(html, /id="sHyb">—<\/b><span>hybrids, this generation<\/span>/);
});

test("minor: one generation count — '34 of 34' beside '35 generations, numbered 0–34'", () => {
  const N = L2.page.Sandbox.result().gens.length;
  assert.equal($(L2, "sGen").textContent, `${N - 1} of ${N - 1}`);
  assert.equal($(L2, "sGenBand").textContent, `${N} generations, numbered 0–${N - 1}`);
  assert.match($(L2, "sFateBand").textContent, new RegExp(`of ${N} ·`));
});

test("M7: load names its sources; after Run the heat has no example title", () => {
  for (const n of [1, 2]) assert.equal($(LOAD, "thumbCap" + n).textContent, `lineage ${n} — from the sliders`);
  /* record drawHeat's options on a page that has run, then clear it by a level change */
  const p = runPage({ level: 2, seed: 3 });
  const A = p.page.AncestryHeat;
  const seen = [];
  const orig = A.drawHeat;
  A.drawHeat = (ctx, m, o) => (seen.push(o), orig(ctx, m, o));
  const scrub = p.page.document.getElementById("scrub");
  scrub.oninput({ target: scrub });
  assert.equal(seen.length, 1, "control: a scrub redrew the heat");
  assert.equal(seen[0].title, undefined, "the run's heat carries a title");
  const sel = p.page.document.getElementById("level");
  sel.value = "3";
  sel.onchange({ target: sel });
  const ex = seen.at(-1);
  assert.ok(ex.title && ex.title.startsWith("example run: level "), `example title ${ex.title}`);
  A.drawHeat = orig;
});

test("M6: the body map's key lists every kind of mark drawn, in the colours the draw used", () => {
  const H = LOAD.page.AncestryHeat.ancHex;
  const dotsOf = (p) =>
    $(p, "bodyLegend").children.map((item) => ({
      colours: item.children.filter((c) => c.tagName === "I").map((c) => c.getAttribute("data-colour")),
      label: item.children.filter((c) => c.tagName === "SPAN").map((c) => c.textContent).join(""),
    }));
  /* load: the sliders' anther clouds and stigma contacts */
  const k0 = plain(LOAD.page.Sandbox.bodyLayers().key);
  assert.deepEqual(k0.map((k) => k.colours), [["#e8b23a"], ["#cc6699"], ["#8fd694"]]);
  assert.deepEqual(plain(dotsOf(LOAD)), k0.map((k) => ({ colours: k.colours, label: k.label })));
  /* target-d run: the two founder rings and the generation's plants, by ancestry */
  const k1 = plain(L2.page.Sandbox.bodyLayers().key);
  assert.ok(L2.page.Sandbox.bodyLayers().dots > 0, "control: plants were drawn");
  assert.deepEqual(k1.filter((k) => k.ring).map((k) => k.colours), [["#e8b23a"], ["#cc6699"]]);
  const plants = k1.find((k) => /plants, by ancestry/.test(k.label));
  assert.ok(plants, "no key entry for the plants");
  assert.deepEqual(plants.colours, [H(0), H(0.5), H(1)]);
  assert.deepEqual(plain(dotsOf(L2)), k1.map((k) => ({ colours: k.colours, label: k.label })));
});

test("M1: the field key's swatches are the drawn tints, ancHex(0 / 0.5 / 1)", () => {
  const H = LOAD.page.AncestryHeat.ancHex;
  assert.equal($(LOAD, "keyL1").style.background, H(0));
  assert.equal($(LOAD, "keyMix").style.background, H(0.5));
  assert.equal($(LOAD, "keyL2").style.background, H(1));
  assert.notEqual(H(0.5), "#e8e6e1", "control: the old hard-coded swatch is not the drawn tint");
  const html = SRC;
  assert.match(html, /pale mixed/);
  assert.doesNotMatch(html, /white mixed/);
});
