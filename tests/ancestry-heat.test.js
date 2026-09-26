/*
 * The ancestry heatmap's model (ancestry-heat.js). Bins must agree with the
 * engine's own hybrid test at the band edges, the final offspring must be its
 * own column, stalled generations must be flagged, and the HELD line must be
 * the line fateOf draws. Seen failing: the module did not exist.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const I = require("../sim/ibm.js");
globalThis.IBM = I;
require("../population-run.js");
const S = globalThis.SandboxRun;
const H = require("../ancestry-heat.js");

const ind = (anc) => ({ anc });
const frame = (ancs, recruits = 5) => ({
  anc: ancs,
  ancVar: I.ancestryVar(ancs.map(ind)),
  recruits,
});

test("binOf agrees with isHybrid at and around the band edges", () => {
  const probe = [0, 1e-12, 0.05, 0.1, 0.15 - 1e-12, 0.15, 0.15 + 1e-12, 0.2,
    0.4999999, 0.5, 0.8, 0.85 - 1e-12, 0.85, 0.85 + 1e-12, 0.95, 1];
  for (let k = 0; k < 500; k++) probe.push(k / 499);
  for (const a of probe) {
    const b = H.binOf(a);
    assert.ok(b >= 0 && b < H.BINS, `bin ${b} for ${a}`);
    assert.equal(b >= 3 && b <= 16, S.isHybrid(a), `a=${a} bin ${b}`);
  }
  // positive control: the plain floor(a * 20) rule puts 0.15 inside the band,
  // and the agreement check above is the kind that sees it
  const naive = (a) => Math.min(19, Math.floor(a * 20));
  assert.notEqual(naive(0.15) >= 3 && naive(0.15) <= 16, S.isHybrid(0.15));
  assert.equal(H.binOf(0.15), 2);
});

test("binOf fails loud on a value outside [0, 1]", () => {
  for (const bad of [-0.01, 1.01, NaN, undefined])
    assert.throws(() => H.binOf(bad), /outside \[0, 1\]/);
  assert.equal(H.binOf(0), 0); // control
});

test("heatModel: one column per frame plus the final offspring", () => {
  const frames = [frame([0, 0, 1, 1]), frame([0, 0.5, 1, 1], 0), frame([0, 0.5, 0.5, 1])];
  const final = [0, 0.5, 0.5, 0.5].map(ind);
  const m = H.heatModel(frames, final, frames[0].ancVar);
  assert.equal(m.cols.length, 4);
  assert.deepEqual(m.cols.map((c) => c.final), [false, false, false, true]);
  for (const c of m.cols) assert.equal(c.counts.reduce((a, b) => a + b, 0), c.n);
  assert.deepEqual(m.cols.map((c) => c.stalled), [false, true, false, false]);
  assert.deepEqual(m.cols.map((c) => c.hyb), [0, 1, 2, 3]);
  assert.equal(m.cols[3].ancVar, I.ancestryVar(final));
  assert.equal(m.heldLine, 0.4 * frames[0].ancVar);
});

test("the HELD line is fateOf's: final variance above it iff fateOf says HELD", () => {
  const found = [0, 0, 0, 0, 1, 1, 1, 1].map(ind);
  const v0 = I.ancestryVar(found);
  const cases = [
    [0, 0, 0, 0, 1, 1, 1, 1], // HELD
    [0, 0, 0, 0, 0, 0, 0, 0.1], // one lost (mean 0.0125, variance far under the line)
    [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.4, 0.6], // FUSED
  ];
  const seen = new Set();
  for (const ancs of cases) {
    const final = ancs.map(ind);
    const m = H.heatModel([frame(found.map((i) => i.anc))], final, v0);
    const fate = I.fateOf(final, v0, false, false);
    seen.add(fate);
    assert.equal(m.cols.at(-1).ancVar > m.heldLine, fate === "HELD", `${fate} ${ancs}`);
  }
  assert.deepEqual([...seen].sort(), ["FUSED", "HELD", "one lost"]);
});

test("extinction: an empty or single-plant final builds, variance null", () => {
  for (const final of [[], [ind(0)]]) {
    const m = H.heatModel([frame([0, 1])], final, 0.25);
    assert.equal(m.cols.at(-1).ancVar, null);
    assert.equal(m.cols.at(-1).n, final.length);
  }
  // drawHeat must not throw on an extinct run, and with a null final variance
  // there is nothing to plot the final-variance dot at: zero arc() calls.
  const record = () => {
    const calls = [];
    const ctx = new Proxy({}, {
      get: (t, k) => (k in t ? t[k] : (...a) => calls.push([k, ...a])),
      set: (t, k, v) => ((t[k] = v), true),
    });
    return { ctx, calls };
  };
  const mEmptyFinal = H.heatModel([frame([0, 1])], [], 0.25);
  const r1 = record();
  assert.doesNotThrow(() => H.drawHeat(r1.ctx, mEmptyFinal, { W: 760, H: 420 }));
  assert.equal(r1.calls.filter((c) => c[0] === "arc").length, 0);

  const mNoFrames = H.heatModel([], [], 0.25);
  const r2 = record();
  assert.doesNotThrow(() => H.drawHeat(r2.ctx, mNoFrames, { W: 760, H: 420 }));
  assert.equal(r2.calls.filter((c) => c[0] === "arc").length, 0);
});

test("colAt inverts layout for every column; outside the plot is -1", () => {
  const frames = Array.from({ length: 35 }, () => frame([0, 1, 0.5]));
  const m = H.heatModel(frames, [0, 1].map(ind), 0.2);
  const W = 760, Hh = 420, lay = H.layout(m, W, Hh);
  m.cols.forEach((_, i) => assert.equal(H.colAt(m, lay.xOf(i) + lay.colW / 2, W, Hh), i));
  assert.equal(H.colAt(m, 1, W, Hh), -1);
  assert.equal(H.colAt(m, W - 1, W, Hh), -1);
});

test("drawHeat always writes the declared labels; hatch only when stalled", () => {
  /* ctx.strokeStyle is a property SET, not a method call, so the recorder
   * must log sets too. The hatch block (ancestry-heat.js: the stalled-column
   * branch inside the cells loop) is the only code that ever sets strokeStyle
   * to "rgba(217,112,79,0.8)" before calling stroke() — replaying the call
   * log in order and counting stroke()s made while that colour is active
   * catches the hatch marks themselves, not merely the legend caption that
   * happens to be gated by the same stalled flag. */
  const record = () => {
    const calls = [];
    const ctx = new Proxy({}, {
      get: (t, k) => (k in t ? t[k] : (...a) => calls.push([k, ...a])),
      set: (t, k, v) => (calls.push(["set:" + k, v]), (t[k] = v), true),
    });
    const text = () => calls.filter((c) => c[0] === "fillText").map((c) => c[1]).join(" | ");
    const hatchStrokes = () => {
      let cur = null, n = 0;
      for (const c of calls) {
        if (c[0] === "set:strokeStyle") cur = c[1];
        else if (c[0] === "stroke" && cur === "rgba(217,112,79,0.8)") n++;
      }
      return n;
    };
    return { ctx, calls, text, hatchStrokes };
  };
  const plain = H.heatModel([frame([0, 1]), frame([0, 1])], [0, 1].map(ind), 0.25);
  const r1 = record();
  H.drawHeat(r1.ctx, plain, { W: 760, H: 420, cursor: 0, fate: "HELD" });
  assert.match(r1.text(), /HELD line/);
  assert.match(r1.text(), /hybrid band/);
  assert.match(r1.text(), /final: HELD/);
  assert.doesNotMatch(r1.text(), /recruited nothing/);
  assert.equal(r1.hatchStrokes(), 0, "no column is stalled — the hatch must not be drawn");
  const stalled = H.heatModel([frame([0, 1], 0), frame([0, 1], 0)], [0, 1].map(ind), 0.25);
  const r2 = record();
  H.drawHeat(r2.ctx, stalled, { W: 760, H: 420, cursor: 1, fate: "STALLED" });
  assert.match(r2.text(), /recruited nothing/);
  assert.ok(r2.hatchStrokes() > 0, "both columns are stalled — the hatch must be drawn");
});

/* Task 5b: the labels must fit at the heat's real displayed width (~566 px in
 * the hero, narrower stacked). A recording ctx that tracks textAlign at each
 * fillText and measures text at 6.2 px per character. Seen failing on
 * b315762: "final: <fate>" was left-aligned at xOf(last) - 40 (ran off the
 * right edge) and the HELD label started at PAD.L + 4, inside the gen-0
 * cursor box. */
test("labels fit: final right-aligned at W - 16, HELD label clear of the gen-0 cursor box", () => {
  const recordText = () => {
    const texts = [];
    const state = { textAlign: "left" };
    const ctx = new Proxy(state, {
      get: (t, k) => {
        if (k === "measureText") return (s) => ({ width: 6.2 * String(s).length });
        if (k === "fillText")
          return (s, x, y, maxW) => {
            const w = Math.min(6.2 * String(s).length, maxW === undefined ? Infinity : maxW);
            const x0 = t.textAlign === "right" ? x - w : t.textAlign === "center" ? x - w / 2 : x;
            texts.push({ s, x, y, maxW, align: t.textAlign, x0, x1: x0 + w });
          };
        return k in t ? t[k] : () => {};
      },
      set: (t, k, v) => ((t[k] = v), true),
    });
    return { ctx, texts };
  };
  const frames = Array.from({ length: 35 }, () => frame([0, 0.5, 1]));
  const m = H.heatModel(frames, [0, 0.5, 1].map(ind), frames[0].ancVar);
  for (const W of [420, 566, 760]) {
    const Hh = Math.round((W * 420) / 760);
    const r = recordText();
    H.drawHeat(r.ctx, m, { W, H: Hh, cursor: 0, fate: "one lost" });
    const fin = r.texts.find((t) => /^final: one lost$/.test(t.s));
    assert.ok(fin, `W=${W}: the final label was drawn`); // control: the label exists
    assert.equal(fin.align, "right", `W=${W}: final label alignment`);
    assert.equal(fin.x, W - 16, `W=${W}: final label x`);
    const lay = H.layout(m, W, Hh);
    const held = r.texts.find((t) => /^HELD line/.test(t.s));
    assert.ok(held, `W=${W}: the HELD label was drawn`);
    const box0 = lay.xOf(0) - 2, box1 = lay.xOf(0) + lay.colW + 2;
    assert.ok(held.x1 < box0 || held.x0 > box1,
      `W=${W}: HELD label [${held.x0}, ${held.x1}] crosses the gen-0 cursor box [${box0}, ${box1}]`);
    // the gutter labels (drawn left of the plot) end 8 px before the cursor box
    const gutter = r.texts.filter((t) => t.x < lay.xOf(0) - 2);
    assert.equal(gutter.length, 6, `W=${W}: gutter labels drawn`);
    for (const g of gutter) {
      assert.ok(g.x1 + 8 <= box0, `W=${W}: gutter label ${g.s} ends at ${g.x1}, box at ${box0}`);
      // the gutter is wide enough that nothing is condensed to fit it
      assert.equal(g.maxW, undefined, `W=${W}: gutter label ${g.s} condensed to ${g.maxW}`);
    }
    for (const t of r.texts) assert.ok(t.x0 >= 0 && t.x1 <= W, `W=${W}: ${t.s} [${t.x0}, ${t.x1}] outside [0, ${W}]`);
    assert.equal(r.ctx.textAlign, "left", `W=${W}: textAlign restored`);
  }
});

test("layout exposes padL, and colAt agrees with drawHeat's plot origin", () => {
  const m = H.heatModel([frame([0, 1]), frame([0, 1])], [0, 1].map(ind), 0.25);
  const lay = H.layout(m, 566, 313);
  assert.equal(typeof lay.padL, "number");
  assert.equal(lay.xOf(0), lay.padL);
  assert.equal(H.colAt(m, lay.padL + 0.5, 566, 313), 0);
  assert.equal(H.colAt(m, lay.padL - 0.5, 566, 313), -1);
  // the optional padL moves the plot; the default is the one drawHeat uses
  assert.equal(H.layout(m, 566, 313, lay.padL + 10).xOf(0), lay.padL + 10);
});

/* Task 7b: the header is two rows (the title beside "final: <fate>", then the
 * axis row "generation 0" ... "gen N"), so the title's row is the final
 * label's, and its room is what the final label leaves. */
test("title: truncated with … to the room left of the final label, on its row", () => {
  const texts = [];
  const state = { textAlign: "left" };
  const ctx = new Proxy(state, {
    get: (t, k) => {
      if (k === "measureText") return (s) => ({ width: 6.2 * String(s).length });
      if (k === "fillText")
        return (s, x, y) => {
          const w = 6.2 * String(s).length;
          const x0 = t.textAlign === "right" ? x - w : x;
          texts.push({ s, y, x0, x1: x0 + w });
        };
      return k in t ? t[k] : () => {};
    },
    set: (t, k, v) => ((t[k] = v), true),
  });
  const frames = Array.from({ length: 35 }, () => frame([0, 0.5, 1]));
  const m = H.heatModel(frames, [0, 0.5, 1].map(ind), frames[0].ancVar);
  const title = "example: level 2, seed 3 — press Run for yours";
  for (const [W, cut] of [[420, true], [760, false]]) {
    texts.length = 0;
    H.drawHeat(ctx, m, { W, H: 232, cursor: -1, fate: "one lost", title });
    const hy = texts.find((t) => t.s.startsWith("final")).y;
    const row = texts.filter((t) => t.y === hy).sort((a, b) => a.x0 - b.x0);
    const shown = row.find((t) => t.s.startsWith("example:"));
    assert.ok(shown, `W=${W}: the title was drawn`);
    assert.equal(shown.s !== title, cut, `W=${W}: title ${JSON.stringify(shown.s)}`);
    if (cut) assert.match(shown.s, /…$/);
    for (let i = 1; i < row.length; i++)
      assert.ok(row[i].x0 >= row[i - 1].x1, `W=${W}: ${row[i - 1].s} overlaps ${row[i].s}`);
  }
});

/* Fix round 1 (Task 6): the final-variance dot sits at xOf(last) + colW / 2;
 * with the final variance just above the HELD line the dot was drawn at the
 * in-strip label's height, so the label had to end left of the final column
 * (seen failing on 915034e). Task 7b fix round 1 moved the label out of the
 * strip into a key row below it, so the dot cannot meet it at any height:
 * the assertion is now that the key lies wholly below the strip (and its
 * cursor box, stripBot + 3), right-aligned to W - 16. */
test("HELD key sits below the strip, clear of the final-variance dot", () => {
  const texts = [];
  const state = { textAlign: "left" };
  const ctx = new Proxy(state, {
    get: (t, k) => {
      if (k === "measureText") return (s) => ({ width: 6.2 * String(s).length });
      if (k === "fillText")
        return (s, x, y) => {
          const w = 6.2 * String(s).length;
          const x0 = t.textAlign === "right" ? x - w : x;
          texts.push({ s, x0, x1: x0 + w, y });
        };
      return k in t ? t[k] : () => {};
    },
    set: (t, k, v) => ((t[k] = v), true),
  });
  const frames = Array.from({ length: 35 }, () => frame([0, 0, 1, 1]));
  const final = [0.176, 0.824, 0.176, 0.824].map(ind);
  const m = H.heatModel(frames, final, frames[0].ancVar);
  const fin = m.cols.at(-1);
  // precondition: the final variance is just above the HELD line
  assert.ok(fin.ancVar > m.heldLine && fin.ancVar < 1.1 * m.heldLine, `final ${fin.ancVar} vs ${m.heldLine}`);
  for (const W of [420, 566, 760]) {
    texts.length = 0;
    const Hh = Math.round((W * 420) / 760);
    H.drawHeat(ctx, m, { W, H: Hh, cursor: 0, fate: "HELD" });
    const lay = H.layout(m, W, Hh);
    const last = m.cols.length - 1;
    const held = texts.find((t) => /^HELD line/.test(t.s));
    assert.ok(held, `W=${W}: the HELD label was drawn`); // control
    assert.ok(last > 0);
    assert.ok(held.y - 9 > lay.stripBot + 3 && held.y + 3 <= Hh,
      `W=${W}: HELD key baseline ${held.y}, strip bottom ${lay.stripBot}, canvas ${Hh}`);
    assert.equal(held.x1, W - 16, `W=${W}: HELD key right edge`);
  }
});

/* Task 7b (visual critic r1, findings 10, 11, 15, 19). A recording ctx that
 * logs every call and property set in order, measuring text at 6.2 px/char. */
const recordAll = () => {
  const calls = [];
  const state = { textAlign: "left", fillStyle: "#000" };
  const ctx = new Proxy(state, {
    get: (t, k) => {
      if (k === "measureText") return (s) => ({ width: 6.2 * String(s).length });
      if (k in t) return t[k];
      return (...a) => calls.push({ k, a, align: t.textAlign, fill: t.fillStyle, lw: t.lineWidth });
    },
    set: (t, k, v) => ((t[k] = v), true),
  });
  const texts = () =>
    calls.map((c, i) => ({ c, i })).filter(({ c }) => c.k === "fillText").map(({ c, i }) => {
      const s = String(c.a[0]);
      const w = Math.min(6.2 * s.length, c.a[3] === undefined ? Infinity : c.a[3]);
      const x0 = c.align === "right" ? c.a[1] - w : c.a[1];
      return { s, i, x0, x1: x0 + w, y: c.a[2], fill: c.fill };
    });
  return { ctx, calls, texts };
};
const stallFrames = (n) => Array.from({ length: n }, () => frame([0, 0.5, 1], 0));

/* Fix round 1 (M2): the gen N tick and the hatch key are plated too; the HELD
 * key has left the strip and has no plate (next test). */
test("7b: final, generation 0, gen N and the hatch key sit on background plates, drawn after the cursor", () => {
  const frames = Array.from({ length: 35 }, (_, g) => frame([0, 0, 1, 1], g % 2 ? 0 : 5));
  const m = H.heatModel(frames, [0, 0.5, 0.5, 1].map(ind), frames[0].ancVar);
  for (const W of [420, 566, 760]) {
    const Hh = Math.round((W * 420) / 760);
    const r = recordAll();
    const last = m.cols.length - 1;
    H.drawHeat(r.ctx, m, { W, H: Hh, cursor: last - 1, fate: "one lost" });
    const cursorAt = r.calls.findIndex((c) => c.k === "strokeRect" && c.lw === 2);
    assert.ok(cursorAt >= 0, `W=${W}: control - the cursor box was drawn`);
    for (const re of [/^final: one lost$/, /^generation 0$/, /^gen 34$/, /^hatched:/]) {
      const t = r.texts().find((x) => re.test(x.s));
      assert.ok(t, `W=${W}: control - ${re} drawn`);
      assert.ok(t.i > cursorAt, `W=${W}: ${t.s} drawn before the cursor box (the box strikes through it)`);
      /* the plate: the last fillRect before the label, in #101216, covering its span */
      const plate = r.calls.slice(0, t.i).reverse().find((c) => c.k === "fillRect");
      assert.ok(plate && plate.fill === "#101216", `W=${W}: no background plate right before ${t.s}`);
      const [px, py, pw, ph] = plate.a;
      assert.ok(px <= t.x0 && px + pw >= t.x1 && py <= t.y - 8 && py + ph >= t.y + 2,
        `W=${W}: plate [${px}, ${py}, ${pw}, ${ph}] does not cover ${t.s} [${t.x0}, ${t.x1}] at y ${t.y}`);
    }
  }
});

test("7b: 'gen N' tick over the last generation column, a separator before the final column", () => {
  const frames = Array.from({ length: 35 }, () => frame([0, 0.5, 1]));
  const m = H.heatModel(frames, [0, 0.5, 1].map(ind), frames[0].ancVar);
  for (const W of [420, 566, 760]) {
    const Hh = Math.round((W * 420) / 760);
    const r = recordAll();
    H.drawHeat(r.ctx, m, { W, H: Hh, cursor: 0, fate: "HELD" });
    const lay = H.layout(m, W, Hh);
    const last = m.cols.length - 1;
    const T = r.texts();
    const g0 = T.find((t) => t.s === "generation 0");
    const gN = T.find((t) => t.s === "gen 34");
    assert.ok(g0, `W=${W}: control - generation 0 drawn`);
    assert.ok(gN, `W=${W}: no 'gen 34' tick (got ${T.map((t) => t.s).join(" | ")})`);
    // right-aligned over the last generation's column, before the final column
    assert.ok(gN.x1 <= lay.xOf(last - 1) + lay.colW && gN.x1 >= lay.xOf(last - 1),
      `W=${W}: 'gen 34' ends at ${gN.x1}, column ${lay.xOf(last - 1)}..${lay.xOf(last - 1) + lay.colW}`);
    // no header label on its baseline overlaps it (the Task 5b rule)
    for (const t of T.filter((t) => t.y === gN.y && t !== gN))
      assert.ok(t.x1 <= gN.x0 || t.x0 >= gN.x1, `W=${W}: ${t.s} overlaps gen 34 on y ${gN.y}`);
    // a 1 px vertical line strictly inside the FINAL_GAP
    const gapL = lay.xOf(last - 1) + lay.colW, gapR = lay.xOf(last);
    const seps = r.calls.filter((c, i) => c.k === "moveTo" && r.calls[i + 1] && r.calls[i + 1].k === "lineTo" &&
      r.calls[i + 1].a[0] === c.a[0] && c.a[0] > gapL && c.a[0] < gapR && c.lw === 1);
    assert.ok(seps.length >= 1, `W=${W}: no vertical separator in the final gap (${gapL}..${gapR})`);
  }
});

test("7b: the hatch key sits in the heat-strip gap, clear of rows and of the cursor, in the new words", () => {
  const m = H.heatModel(stallFrames(35), [0, 0.5, 1].map(ind), 0.2);
  for (const W of [420, 566, 760]) {
    const Hh = Math.round((W * 420) / 760);
    const r = recordAll();
    for (const cursor of [0, 20]) {
      r.calls.length = 0;
      H.drawHeat(r.ctx, m, { W, H: Hh, cursor, fate: "STALLED" });
      const lay = H.layout(m, W, Hh);
      const k = r.texts().find((t) => /^hatched:/.test(t.s));
      assert.ok(k, `W=${W}: control - the hatch key was drawn on a stalled model`);
      assert.equal(k.s, "hatched: a stalled generation (recruited nothing; parents handed back)");
      // its text box (baseline - 9 .. baseline + 3) lies in the gap between the heat and the strip
      assert.ok(k.y - 9 > lay.heatBot && k.y + 3 < lay.stripTop - 3,
        `W=${W}: hatch key at y ${k.y}, gap ${lay.heatBot}..${lay.stripTop}`);
      // away from the "lineage 2" gutter label: it does not start at the plot's left edge
      assert.ok(k.x0 > lay.padL + 8, `W=${W}: hatch key starts at ${k.x0}, beside the lineage 2 label`);
      // no cursor stroke crosses the key's rows
      for (const c of r.calls.filter((c) => c.k === "strokeRect" && c.lw === 2)) {
        const [, y, , h] = c.a;
        assert.ok(y + h + 1 < k.y - 9 || y - 1 > k.y + 3,
          `W=${W} cursor ${cursor}: cursor box y ${y}..${y + h} crosses the hatch key at ${k.y}`);
      }
    }
  }
});

/* Task 7b fix round 1 (I1): nothing may cover the variance strip. An opaque
 * plate behind an in-strip HELD label deleted trace points just above the
 * HELD line, where the verdict turns, on the last generation's column where
 * every run lands. No fillRect may intersect the strip's plot rect
 * [padL, stripTop, W - padR, stripBot]. Seen failing on 2effaa0. Positive
 * control: the trace was stroked inside that rect, and the HELD key drawn. */
test("7b fix 1: no filled rect covers the variance strip; the HELD key is below it with a dashed swatch", () => {
  const frames = Array.from({ length: 35 }, (_, g) => frame(g < 20 ? [0, 0, 1, 1] : [0, 0.5, 0.5, 1]));
  const m = H.heatModel(frames, [0, 0.5, 0.5, 1].map(ind), frames[0].ancVar);
  for (const W of [420, 566, 760]) {
    const Hh = Math.round((W * 420) / 760);
    const r = recordAll();
    H.drawHeat(r.ctx, m, { W, H: Hh, cursor: m.cols.length - 2, fate: "one lost" });
    const lay = H.layout(m, W, Hh);
    const R = [lay.padL, lay.stripTop, W - lay.padR, lay.stripBot];
    const inStrip = (x, y) => x >= R[0] && x <= R[2] && y >= R[1] && y <= R[3];
    assert.ok(r.calls.some((c) => c.k === "lineTo" && inStrip(c.a[0], c.a[1])), `W=${W}: control - the trace is in the strip`);
    for (const c of r.calls.filter((c) => c.k === "fillRect")) {
      const [x, y, w, h] = c.a;
      assert.ok(x + w <= R[0] || x >= R[2] || y + h <= R[1] || y >= R[3],
        `W=${W}: fillRect [${x}, ${y}, ${w}, ${h}] (${c.fill}) covers the strip [${R.join(", ")}]`);
    }
    const held = r.texts().find((t) => /^HELD line = 0\.4 × founding = /.test(t.s));
    assert.ok(held, `W=${W}: the HELD key was drawn`);
    assert.ok(held.y - 9 > lay.stripBot, `W=${W}: HELD key at ${held.y}, strip bottom ${lay.stripBot}`);
    assert.equal(held.x1, W - lay.padR);
    // the swatch: an 18 px horizontal stroke ending left of the text, at its row
    const sw = r.calls.find((c, i) => c.k === "moveTo" && r.calls[i + 1] && r.calls[i + 1].k === "lineTo" &&
      r.calls[i + 1].a[0] - c.a[0] === 18 && c.a[1] === r.calls[i + 1].a[1] && r.calls[i + 1].a[0] <= held.x0 &&
      c.a[1] > lay.stripBot);
    assert.ok(sw, `W=${W}: no 18 px swatch before the HELD key`);
  }
});
