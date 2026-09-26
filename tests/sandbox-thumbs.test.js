/*
 * Task 7c (visual critic r1, findings 4, 5, 6, 16; Task 5 minor M6): the
 * lineage cards and tiles name what they show.
 *  - On a run founded at target d the thumbnails draw THAT run's founders
 *    (foundTwoLineages' gA/gB), not the sliders, while the run's key holds.
 *  - #sReal is the sliders' separation; #sTarget is level 1's goal, shown only
 *    on level 1; a bare "not measured" on a target-d level says why.
 *  - Once the bee moves, the body map's founder rings are flagged stale.
 *  - The off-bee warning reads once per card, not once per slider.
 * Seen failing on BASE caeeb85: no Sandbox.thumbSource, #sTarget never hidden,
 * no foundersStale, the sentence under every slider.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { runPage } = require("../tools/sandbox-drive.js");

const plain = (x) => JSON.parse(JSON.stringify(x));
const GENES = ["axisLen", "mouthR", "throatR", "curve", "polarity", "antherT", "antherProject", "antherTheta"];

test("level 2 seed 3: the thumbnails draw the run's two founders, which differ", () => {
  const p = runPage({ level: 2, seed: 3 });
  const S = p.page.Sandbox;
  const doc = p.page.document;
  const R = S.result();
  assert.equal(p.error, null);
  assert.equal(S.thumbSource(), "run");
  assert.ok(R.founders && R.founders.length === 2, "the run carries no founders");
  assert.ok(
    GENES.some((k) => R.founders[0][k] !== R.founders[1][k]),
    "the two founders are the same genome",
  );
  assert.deepEqual(plain(S.thumbGenome(0)), plain(R.founders[0]));
  assert.deepEqual(plain(S.thumbGenome(1)), plain(R.founders[1]));
  /* Task 7d (M3): the founder heading is the thumbnail's caption; the
   * sliders' own label says they did not found the run */
  for (const i of [1, 2]) {
    assert.equal(doc.getElementById("thumbCap" + i).textContent, `lineage ${i} — this run's founder (founded at target d)`);
    assert.equal(doc.getElementById("genesLab" + i).textContent, `hand-set lineage ${i} (sliders) — did not found this run`);
  }
  /* the sliders are unchanged and are not what is drawn */
  assert.notDeepEqual(plain(S.lineage(0)), plain(S.thumbGenome(0)));
});

test("a hand-set run and no run: the thumbnails draw the sliders", () => {
  const p = runPage({ seed: 3 }); // free sandbox, hand-set founding
  const S = p.page.Sandbox;
  assert.equal(p.error, null);
  assert.equal(S.result().useD, false, "control: a hand-set run");
  assert.equal(S.thumbSource(), "sliders");
  assert.equal(S.result().founders, null);
  assert.deepEqual(plain(S.thumbGenome(0)), plain(S.lineage(0)));
  const doc = p.page.document;
  assert.equal(doc.getElementById("thumbCap1").textContent, "lineage 1 — from the sliders");
  assert.equal(doc.getElementById("genesLab1").textContent, "hand-set lineage 1 (sliders)");
  const q = runPage({ noRun: true });
  assert.equal(q.page.Sandbox.thumbSource(), "sliders");
});

test("target-d run, then a bee change: back to the sliders; restoring the bee: the run", () => {
  const p = runPage({ level: 2, seed: 3 });
  const S = p.page.Sandbox;
  assert.equal(S.thumbSource(), "run"); // control
  const reach = S.bee().reach;
  S.setBee({ reach: reach + 0.1 });
  assert.equal(S.bodyLayers().overlay, "hidden: shapes changed since the run");
  assert.equal(S.thumbSource(), "sliders");
  assert.deepEqual(plain(S.thumbGenome(0)), plain(S.lineage(0)));
  assert.equal(p.page.document.getElementById("thumbCap1").textContent, "lineage 1 — from the sliders");
  S.setBee({ reach });
  assert.equal(S.thumbSource(), "run");
});

test("#sTarget shows on level 1 only; #sReal names the sliders", () => {
  const one = runPage({ level: 1, noRun: true }).page.document;
  /* the TILE carries the hidden attribute: `.stat b { display: block }`
   * overrides [hidden] on #sTarget itself, so only the tile's hides anything */
  assert.equal(one.getElementById("sTargetTile").hasAttribute("hidden"), false, "level 1's target tile is hidden on level 1");
  for (const lv of [2, "free"]) {
    const d = runPage({ level: lv, noRun: true }).page.document;
    assert.equal(d.getElementById("sTargetTile").hasAttribute("hidden"), true, `level 1's target tile is not hidden on level ${lv}`);
  }
  const html = require("fs").readFileSync(require("path").join(__dirname, "..", "sandbox.html"), "utf8");
  assert.match(html, /id="sReal">—<\/b><span>sliders' separation \(hand-set\)<\/span>/);
});

test("target-d level: a 'not measured' separation band says why", () => {
  const d = runPage({ level: 2, noRun: true }).page.document;
  assert.equal(d.getElementById("sReal").textContent, "0.000", "control: identical sliders");
  assert.equal(d.getElementById("sRealBand").textContent, "the sliders' pair, not the run: not measured — these sliders did not found the shown run");
  const f = runPage({ noRun: true }).page.document; // free, hand-set founding
  assert.equal(f.getElementById("sRealBand").textContent, "the sliders' pair, not the run: not measured", "control: hand-set founding");
});

test("stale founder rings: flagged once the bee moves, cleared when it is restored", () => {
  const p = runPage({ level: 2, seed: 3 });
  const S = p.page.Sandbox;
  assert.equal(S.bodyLayers().foundersStale, false);
  const reach = S.bee().reach;
  S.setBee({ reach: reach + 0.1 });
  assert.equal(S.bodyLayers().foundersStale, true);
  S.setBee({ reach });
  assert.equal(S.bodyLayers().foundersStale, false);
  const h = runPage({ seed: 3 }).page.Sandbox; // hand-set: no rings at all
  h.setBee({ reach: reach + 0.1 });
  assert.equal(h.bodyLayers().foundersStale, false);
});

test("stall fixture: the off-bee warning reads once per card; each slider carries a marker", () => {
  const { page } = require("../tools/sandbox-drive.js").runPage({
    seed: 1, n: 30, gens: 35, siteN: 160, useD: false, noRun: true,
    lineages: (() => {
      const E = require("../sim/evolve.js");
      const g = { ...E.randomGenome(E.makeRng(4)), antherT: 0.825 };
      return [g, { ...g }];
    })(),
  });
  const doc = page.document;
  const SENT = "a bound puts this flower off the bee";
  for (const li of [1, 2]) {
    const effs = GENES.map((k) => doc.getElementById(`g${li}_${k}_eff`));
    const mark = (k) => doc.getElementById(`g${li}_${k}_off`);
    /* either form (BASE printed the sentence under the slider; now a marker
     * beside the value, titled with it) */
    const off = GENES.filter(
      (k, i) => effs[i].textContent === SENT || (mark(k) && mark(k).getAttribute("title") === SENT),
    );
    assert.ok(off.length > 0, `control: lineage ${li} has off-bee sliders`);
    for (const e of effs) assert.notEqual(e.textContent, SENT, "the sentence is repeated under a slider");
    for (const k of off) {
      assert.equal(mark(k).textContent.trim(), "⚠︎");
      assert.equal(mark(k).getAttribute("aria-label"), SENT);
    }
    const w = doc.getElementById("offBee" + li);
    assert.ok(w.textContent.startsWith(SENT), `lineage ${li}: no card-level warning (${w.textContent})`);
  }
  /* control: at load no bound is off the bee, so no card warning */
  const q = runPage({ noRun: true }).page.document;
  assert.equal(q.getElementById("offBee1").textContent, "");
});

/* Task 7c fix round 1 (I1): the stall genome's anther touches the bee (it
 * founds) and its stigma never does. The card names the stigma, and the body
 * map draws the anther's contact rather than blanking. Seen failing on c36f93c:
 * "this flower never touches the bee", no anther site drawn. */
test("stall genome: the card names the stigma; the body map shows the anther's contact", () => {
  const E = require("../sim/evolve.js");
  const g = { ...E.randomGenome(E.makeRng(4)), antherT: 0.825 };
  const { page } = runPage({ seed: 1, n: 30, gens: 35, siteN: 160, useD: false, noRun: true, lineages: [g, { ...g }] });
  const doc = page.document;
  for (const li of [1, 2]) {
    assert.equal(
      doc.getElementById("touch" + li).textContent,
      "this flower's stigma never touches the bee: it can shed pollen but never receive any",
    );
    assert.match(doc.getElementById("bodyLive").textContent, new RegExp(`lineage ${li} anther at -?[\\d.]+ along the body`));
    assert.match(doc.getElementById("bodyLive").textContent, new RegExp(`lineage ${li}'s stigma never touches the bee`));
  }
  assert.ok(page.Sandbox.bodyLayers().founders.every(Boolean), "the anther founding sites are not drawn");
  /* control: at load both parts touch, so no sentence */
  assert.equal(runPage({ noRun: true }).page.document.getElementById("touch1").textContent, "");
});
