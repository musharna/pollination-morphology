/*
 * Task 7e (visual critic round 3).
 *  - #1 (MAJOR): a STALLED run reads as a loss. #sFateBand opens with why
 *    ("no offspring were recruited in k of N generations ..."), naming the
 *    part that misses the bee on a hand-set run; the HELD rule states both
 *    halves (every generation recruits AND the variance test); the variance
 *    strip hatches the stalled generations with the heat's own hatch.
 *  - #3: the cluster-separation band says the split is by placement alone.
 *  - #5: the example heat (no run) draws no cursor.
 *  - #7: #sAncBand has no "fused or lost" threshold.
 *  - #12: the HELD key names the end dot.
 *  - #6: the body-map key lists the plants only when they are drawn.
 *  - #10: the level-5 bout note is printed once (#fieldCaption's).
 * Seen failing on BASE da0e494 or on a named mutant (task-7e report).
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

/* a recording ctx: every call in order, with the stroke/fill state and line
 * width at the time; text measured at 6.2 px per character */
const recorder = () => {
  const calls = [];
  const st = { textAlign: "left", fillStyle: "#000", strokeStyle: "#000", lineWidth: 1 };
  const ctx = new Proxy(st, {
    get: (t, k) => {
      if (k === "measureText") return (s) => ({ width: 6.2 * String(s).length });
      if (k in t) return t[k];
      return (...a) =>
        calls.push({ k, a, stroke: t.strokeStyle, fill: t.fillStyle, lw: t.lineWidth, align: t.textAlign });
    },
    set: (t, k, v) => ((t[k] = v), true),
  });
  return { ctx, calls };
};
/* hatch strokes: a moveTo then a lineTo rising to the right, in the hatch colour */
const hatchSegs = (calls) =>
  calls
    .map((c, i) => [c, calls[i + 1]])
    .filter(([m, l]) => m.k === "moveTo" && l && l.k === "lineTo" && l.stroke === "rgba(217,112,79,0.8)" &&
      l.a[0] > m.a[0] && l.a[1] < m.a[1])
    .map(([m, l]) => ({ x0: m.a[0], y0: m.a[1], x1: l.a[0], y1: l.a[1] }));

test("#1: a STALLED run's fate band opens with why, naming the part that misses the bee", () => {
  assert.equal(STALL.fate, "STALLED", "control: the fixture stalls");
  assert.equal(STALL.stalledGens, 35, "control: every generation stalled (the harness still parses the count)");
  /* final review I2: the contacts are sampled at the run's own siteN */
  assert.equal(STALL.page.Sandbox.result().siteN, 160, "the run records its siteN");
  const band = $(STALL, "sFateBand").textContent;
  assert.ok(band.startsWith(
    "no offspring were recruited in 35 of 35 generations, so the variance below is the founders' carried forward, not a hold — the stigma never touches the bee · "),
    `#sFateBand reads: ${band}`);
  assert.equal(CTRL.fate, "FUSED", "control: antherT 0.80 does not stall");
  assert.ok(!$(CTRL, "sFateBand").textContent.startsWith("no offspring"), "a run that recruits has no stall sentence");
});

test("#1: the HELD rule states both halves wherever it is stated", () => {
  for (const p of [STALL, CTRL]) {
    const band = $(p, "sFateBand").textContent;
    assert.match(band, /HELD needs every generation to recruit AND ancestry variance above 0\.4 × founding \(sim\/ibm\.js fateOf\)/);
  }
});

test("#1: the variance strip hatches the stalled generations, the heat's hatch", () => {
  const H = STALL.page.AncestryHeat;
  for (const [p, stalled] of [[STALL, true], [CTRL, false]]) {
    const m = p.page.Sandbox.heat();
    for (const W of [566, 760]) {
      const Hh = Math.round((W * 420) / 760);
      const r = recorder();
      H.drawHeat(r.ctx, m, { W, H: Hh, cursor: 0, fate: p.fate });
      const lay = H.layout(m, W, Hh);
      const segs = hatchSegs(r.calls);
      /* a stroke's top end (y1) is the hatch loop's row: which band it marks */
      const heat = segs.filter((s) => s.y1 >= lay.heatTop && s.y1 < lay.heatBot);
      const strip = segs.filter((s) => s.y1 >= lay.stripTop && s.y1 < lay.stripBot);
      if (!stalled) {
        assert.equal(segs.length, 0, `W=${W}: a run with no stall has no hatch`);
        continue;
      }
      m.cols.forEach((c, i) => {
        const x = lay.xOf(i);
        const inCol = (s) => s.x0 === x && s.x1 <= x + lay.colW - 1 + 1e-9;
        assert.equal(heat.some(inCol), c.stalled, `W=${W}: control - heat hatch on column ${i}`);
        assert.equal(strip.some(inCol), c.stalled, `W=${W}: strip hatch on column ${i} (stalled ${c.stalled})`);
      });
      // no strip stroke leaves the strip (the last is cut at its bottom)
      for (const s of strip)
        assert.ok(s.y0 <= lay.stripBot, `W=${W}: stroke leaves the strip ${JSON.stringify(s)}`);
      // under the trace: the strip's hatch is drawn before the HELD line
      const lastHatch = r.calls.map((c) => c.stroke).lastIndexOf("rgba(217,112,79,0.8)");
      const trace = r.calls.findIndex((c, i) => i > lastHatch && c.k === "lineTo" && c.stroke === "#e8e6e1");
      assert.ok(trace > lastHatch, `W=${W}: the trace is drawn after (over) the hatch`);
    }
  }
});

/* #5: with no run the heat is the example, and there is nothing to scrub */
test("#5: the example heat draws no cursor", () => {
  const p = runPage({ noRun: true });
  const A = p.page.AncestryHeat;
  const orig = A.drawHeat;
  const seen = [];
  A.drawHeat = (ctx, m, o) => {
    const r = recorder();
    orig(r.ctx, m, o);
    seen.push({ o, calls: r.calls });
  };
  try {
    const sel = $(p, "level");
    sel.value = "free";
    sel.onchange({ target: sel });
    assert.ok(seen.length >= 1, "control: the page redrew the heat");
    const last = seen.at(-1);
    assert.ok(last.o.title && last.o.title.startsWith("example run"), "control: the example was drawn");
    assert.equal(last.calls.filter((c) => c.k === "strokeRect" && c.lw === 2).length, 0,
      `the example heat drew a cursor box (cursor ${last.o.cursor})`);
  } finally {
    A.drawHeat = orig;
  }
});

test("#5 control: after a run the heat's cursor box is drawn", () => {
  const H = STALL.page.AncestryHeat;
  const m = STALL.page.Sandbox.heat();
  const r = recorder();
  H.drawHeat(r.ctx, m, { W: 566, H: 313, cursor: m.cols.length - 2, fate: "STALLED" });
  assert.equal(r.calls.filter((c) => c.k === "strokeRect" && c.lw === 2).length, 2);
});

test("#7: no 'fused or lost' threshold in the variance band; the HELD line stays", () => {
  for (const p of [STALL, CTRL]) {
    const t = $(p, "sAncBand").textContent;
    assert.match(t, /HELD line 0\.\d{4} \(0\.4 × founding/, `control: ${t}`);
    assert.doesNotMatch(t, /fused or lost/);
  }
});

test("#12: the HELD key names the end dot, on its row, clear of the HELD text", () => {
  const H = STALL.page.AncestryHeat;
  const m = CTRL.page.Sandbox.heat();
  for (const [W, whole] of [[566, false], [760, true]]) {
    const Hh = Math.round((W * 420) / 760);
    const r = recorder();
    H.drawHeat(r.ctx, m, { W, H: Hh, cursor: 0, fate: "FUSED" });
    const lay = H.layout(m, W, Hh);
    const texts = r.calls.filter((c) => c.k === "fillText");
    const held = texts.find((c) => /^HELD line = /.test(c.a[0]));
    const dot = texts.find((c) => c.a[0] === "dot: final variance, green when HELD");
    assert.ok(held, `W=${W}: control - the HELD key`);
    assert.ok(dot, `W=${W}: no end-dot key`);
    assert.equal(dot.a[2], held.a[2], `W=${W}: the dot key is on the HELD key's row`);
    assert.equal(dot.a[1], lay.padL, `W=${W}: from the plot's left edge`);
    const heldX0 = held.a[1] - 6.2 * held.a[0].length;
    const dotW = dot.a[3] === undefined ? 6.2 * dot.a[0].length : dot.a[3];
    assert.ok(dot.a[1] + dotW + 18 + 6 <= heldX0, `W=${W}: the dot key runs into the HELD swatch`);
    assert.equal(dot.a[3] === undefined, whole, `W=${W}: condensed ${dot.a[3]}`);
  }
});

test("#6: the body-map key lists the plants only while they are drawn", () => {
  const S = STALL.page.Sandbox;
  const plants = () => S.bodyLayers().key.filter((k) => /plants/.test(k.label));
  assert.equal(S.bodyLayers().overlay, "shown", "control: the stall run's plants are drawn");
  assert.ok(S.bodyLayers().dots > 0, "control: dots drawn");
  assert.equal(plants().length, 1, "control: the key lists the drawn plants");
  const g0 = { ...S.lineage(0) };
  S.setLineage(0, { ...g0, antherT: g0.antherT - 0.05 });
  try {
    assert.equal(S.bodyLayers().overlay, "hidden: shapes changed since the run", "control: hidden");
    assert.equal(plants().length, 0, "the key lists plants that are hidden");
  } finally {
    S.setLineage(0, g0);
  }
});

test("#3: the cluster band says the split is by placement, not lineage", () => {
  assert.match(SRC, /id="sSepBand"\s*>how far apart the two clusters in this generation's placements\s+on the bee sit/);
  assert.match(SRC, /the split is by placement alone, not\s+lineage, so both clusters can be one lineage/);
});

test("#10: the level-5 bout note is written once, by #fieldCaption", () => {
  const n = SRC.split("the sliced season does not log one").length - 1;
  assert.equal(n, 1, `the bout note appears ${n} times in the page source`);
  assert.match(SRC, /"bout not drawn: the sliced season does not log one \(sim\/ibm\.js:1432-1438\)"/, "control: the one kept");
});

/* ---- fix round 1 (review + critic r4) ---------------------------------- */

/* review I1: the stall sentence's every branch, from the page's own words
 * function. A `${N} of ${N}` mutant fails the k < N case. */
test("fix 1: the stall sentence counts k of N, words k < N and k = N apart, and omits a missing-part suffix it lacks", () => {
  const f = STALL.page.Sandbox.stallSentence;
  assert.equal(typeof f, "function", "the page exposes Sandbox.stallSentence");
  /* final review I2: with k < N some generation recruited, so no part
   * "never" touches — the sentence names no cause even when one is passed */
  assert.equal(f("STALLED", 3, 35, ["stigma never touches the bee", ""]),
    "no offspring were recruited in 3 of 35 generations, so the variance below is carried forward unchanged through them, not a hold · ");
  assert.equal(f("STALLED", 35, 35, ["stigma never touches the bee", ""]),
    "no offspring were recruited in 35 of 35 generations, so the variance below is the founders' carried forward, not a hold — lineage 1's stigma never touches the bee · ");
  assert.equal(f("STALLED", 35, 35, ["stigma never touches the bee", "stigma never touches the bee"]),
    "no offspring were recruited in 35 of 35 generations, so the variance below is the founders' carried forward, not a hold — the stigma never touches the bee · ");
  assert.equal(f("STALLED", 12, 24, ["", ""]),
    "no offspring were recruited in 12 of 24 generations, so the variance below is carried forward unchanged through them, not a hold · ");
  assert.equal(f("FUSED", 0, 35, ["", ""]), "", "a fate other than STALLED has no stall sentence");
});

/* critic r4 #1: STALLED is not read off offspring */
test("fix 1: the fate's subtitle names what STALLED is read on", () => {
  assert.equal($(STALL, "sFateSub").textContent, "fate (a generation recruited no offspring)");
  assert.equal($(CTRL, "sFateSub").textContent, "fate (the run's last offspring)", "control: FUSED");
});

/* critic r4 #3: the no-ratio case has a verb and says what "both" is */
test("fix 1: the hybrid band says the receipt ratio was not measured, and why", () => {
  const p = runPage({ seed: 1, d: 8, useD: true }); // page config, card 4's positive: no hybrid ever
  assert.equal(p.hybGens, 0, "control: no generation held a hybrid");
  const t = $(p, "sHybBand").textContent;
  assert.match(t, / · receipt ratio: not measured — no generation held both hybrids and non-hybrids · /, t);
  assert.equal(p.ratio, null, "the harness still reads no ratio");
  assert.match($(CTRL, "sHybBand").textContent, / · receipt ratio (\d+\.\d{3}|Infinity) · /, "control: a measured ratio");
});

/* critic r4 #4: a target-d run's founder labels are drawn after the plants,
 * each on a background plate */
test("fix 1: the founder labels are drawn over the plant dots, on plates", () => {
  const p = runPage({ level: 2, seed: 3 });
  const ctx = p.page.document.getElementById("bodyMap").getContext("2d");
  const calls = [];
  for (const k of ["arc", "fillText", "fillRect", "strokeText"])
    ctx[k] = (...a) => calls.push({ k, a, fill: ctx.fillStyle, alpha: ctx.globalAlpha });
  const b = p.page.Sandbox.bee();
  p.page.Sandbox.setBee({ reach: b.reach }); // redraw, shapes unchanged
  const dots = calls.map((c, i) => [c, i]).filter(([c]) => c.k === "arc" && c.a[2] === 4.4);
  assert.ok(dots.length > 0, "control: the generation's plants were drawn");
  const lastDot = dots.at(-1)[1];
  for (const n of [1, 2]) {
    const i = calls.findIndex((c) => c.k === "fillText" && c.a[0] === `lineage ${n} founder`);
    assert.ok(i >= 0, `control: lineage ${n}'s founder label drawn`);
    assert.ok(i > lastDot, `lineage ${n}'s founder label (call ${i}) is drawn before the last plant dot (call ${lastDot})`);
    const plate = calls.slice(0, i).reverse().find((c) => c.k === "fillRect");
    assert.ok(plate && plate.fill === "#101216" && plate.alpha === 0.85, `no plate under lineage ${n}'s label`);
    const [lx, ly] = calls[i].a.slice(1, 3);
    const [px, py, pw, ph] = plate.a;
    assert.ok(px < lx && px + pw > lx && py < ly - 8 && py + ph > ly + 2, `plate [${plate.a}] misses the label at ${lx}, ${ly}`);
  }
});

/* ---- final review minors ------------------------------------------------ */

/* m4: below 6 placed plants twoClusterSeparation returns null and the loop
 * stores 0; the tile prints "—" and the band says why. The shown run's
 * generation 1 has its placements emptied (the page reads GENS, which is
 * the run's own gens array), then shown by the scrubber. */
test("m4: cluster separation with fewer than 6 placements reads '—', not measured", () => {
  const p = runPage({ level: 2, seed: 3 });
  const R = p.page.Sandbox.result();
  const scrub = $(p, "scrub");
  const showGen = (g) => {
    scrub.value = String(g);
    scrub.oninput({ target: scrub });
  };
  showGen(0);
  assert.match($(p, "sSep").textContent, /^\d+\.\d\d$/, "control: a measured generation");
  const saved = R.gens[1].places;
  R.gens[1].places = saved.map((x, i) => (i < 5 ? x : null));
  try {
    showGen(1);
    assert.equal($(p, "sSep").textContent, "—");
    assert.equal($(p, "sSepBand").textContent, "not measured (fewer than 6 placements)");
    showGen(0);
    assert.notEqual($(p, "sSepBand").textContent, "not measured (fewer than 6 placements)", "the band returns");
  } finally {
    R.gens[1].places = saved;
  }
});

test("m5: the page title names the hero's question", () => {
  const h1 = /<h1>([^<]+)<\/h1>/.exec(SRC)[1];
  assert.equal(/<title>([^<]+)<\/title>/.exec(SRC)[1], `${h1} — pollination sandbox`);
});
