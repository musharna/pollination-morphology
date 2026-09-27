/*
 * Story marks on the heat (sandbox intro, 2026-09-27): drawHeat draws each of
 * story(...).marks as a tick + a plated label inside the heat, never one label
 * over another, and none at all when the plot is too narrow to hold them.
 * Seen failing: drawHeat returned nothing and drew no marks.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const H = require("../ancestry-heat.js");
globalThis.window = globalThis;
require("../example-heat.js");
const X = globalThis.ExampleHeat;

const PLATE = "#101216";
const MARK_INK = "#e8e6e1"; // a mark's plate (3b: solid light plate, dark text)
const recorder = () => {
  const calls = [];
  const st = { textAlign: "left", fillStyle: "#000", strokeStyle: "#000", lineWidth: 1, globalAlpha: 1, font: "" };
  const ctx = new Proxy(st, {
    get: (t, k) => {
      if (k === "measureText") return (s) => ({ width: 6.2 * String(s).length });
      if (k in t) return t[k];
      return (...args) => calls.push({ fn: k, args, textAlign: t.textAlign, fillStyle: t.fillStyle, strokeStyle: t.strokeStyle,
        lineWidth: t.lineWidth, globalAlpha: t.globalAlpha });
    },
    set: (t, k, v) => ((t[k] = v), true),
  });
  return { ctx, calls };
};
const texts = (calls) => calls.filter((c) => c.fn === "fillText").map((c) => c.args[0]);
/* every fillRect in the plate colour, as a rect */
const plates = (calls) =>
  calls.filter((c) => c.fn === "fillRect" && c.fillStyle === PLATE)
    .map((c) => ({ x: c.args[0], y: c.args[1], w: c.args[2], h: c.args[3] }));
/* for each mark that was drawn, the plate fillRect just before its fillText */
const markPlates = (calls, marks) => {
  const out = [];
  for (const m of marks) {
    const i = calls.findIndex((c) => c.fn === "fillText" && c.args[0] === m.text);
    if (i < 0) continue;
    let j = i - 1;
    while (j >= 0 && !(calls[j].fn === "fillRect" && calls[j].fillStyle === MARK_INK)) j--;
    assert.ok(j >= 0, `no plate before ${m.text}`);
    const [x, y, w, h] = calls[j].args;
    out.push({ x, y, w, h });
  }
  return out;
};
const overlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/* synthetic columns, as tests/ancestry-story.test.js */
const col = (g, l1, mid, l2, o = {}) => {
  const counts = new Array(20).fill(0);
  counts[0] = l1; counts[10] = mid; counts[19] = l2;
  return { g, final: !!o.final, n: l1 + mid + l2, counts, hyb: mid, ancVar: 0.1, stalled: !!o.stalled };
};

test("the example's marks are drawn once each, inside the heat, on plates that do not overlap", () => {
  const marks = H.story(X.model, X.fate).marks;
  assert.ok(marks.length >= 1, "the example (one lost) must have at least the lost mark");
  const r = recorder();
  const out = H.drawHeat(r.ctx, X.model, { W: 566, H: 420, cursor: -1, fate: X.fate, marks });
  assert.equal(out.marks, marks.length);
  for (const m of marks) assert.equal(texts(r.calls).filter((t) => t === m.text).length, 1, m.text);
  const lay = H.layout(X.model, 566, 420);
  const ps = markPlates(r.calls, marks);
  assert.equal(ps.length, marks.length);
  for (const p of ps) {
    assert.ok(p.x >= lay.padL && p.x + p.w <= 566 - 16, "inside the plot horizontally");
    assert.ok(p.y >= lay.heatTop && p.y + p.h <= lay.heatBot, "inside the heat vertically");
  }
  for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) assert.ok(!overlap(ps[i], ps[j]));
});

test("two marks on adjacent columns in the same row do not overlap (the second moves or is dropped)", () => {
  const model = { bins: 20, v0: 0.25, heldLine: 0.1, cols: [
    col(0, 15, 0, 15), col(1, 15, 0, 15, { stalled: true }), col(2, 14, 2, 14), col(3, 14, 2, 14),
    col(4, 14, 2, 14), col(5, 14, 2, 14, { final: true }),
  ] };
  const marks = H.story(model, "STALLED").marks;
  assert.deepEqual(marks.map((m) => [m.col, m.row]), [[1, "mid"], [2, "mid"]], "control: adjacent, same row");
  const r = recorder();
  const out = H.drawHeat(r.ctx, model, { W: 566, H: 420, cursor: -1, fate: "STALLED", marks });
  const ps = markPlates(r.calls, marks);
  assert.equal(out.marks, ps.length);
  assert.ok(out.marks >= 1, "the first mark is drawn");
  const lay = H.layout(model, 566, 420);
  for (const p of ps) assert.ok(p.y >= lay.heatTop && p.y + p.h <= lay.heatBot, "inside the heat vertically");
  for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++)
    assert.ok(!overlap(ps[i], ps[j]), `plates overlap: ${JSON.stringify(ps[i])} ${JSON.stringify(ps[j])}`);
});

test("narrow heat: no marks, returns 0; no label runs past the canvas", () => {
  const marks = H.story(X.model, X.fate).marks;
  const r = recorder();
  const out = H.drawHeat(r.ctx, X.model, { W: 300, H: 420, cursor: -1, fate: X.fate, marks });
  assert.equal(out.marks, 0);
  for (const m of marks) assert.ok(!texts(r.calls).includes(m.text), m.text);
  /* positive control: the same marks at the hero width are drawn */
  assert.equal(H.drawHeat(recorder().ctx, X.model, { W: 566, H: 420, cursor: -1, fate: X.fate, marks }).marks, marks.length);
  for (const c of r.calls.filter((c) => c.fn === "fillText")) {
    const [s, x, , maxW] = c.args;
    const w = Math.min(6.2 * String(s).length, maxW === undefined ? Infinity : maxW);
    const right = c.textAlign === "right" ? x : c.textAlign === "center" ? x + w / 2 : x + w;
    assert.ok(right <= 300, `"${s}" ends at ${right}`);
  }
});

/* a STALLED synthetic model: stall at col 1, first hybrids at col 2 */
const stallModel = () => ({ bins: 20, v0: 0.25, heldLine: 0.1, cols: [
  col(0, 15, 0, 15), col(1, 15, 0, 15, { stalled: true }), col(2, 14, 2, 14), col(3, 14, 2, 14),
  col(4, 14, 2, 14), col(5, 14, 2, 14, { final: true }),
] });
/* a plain 12-generation model with no stalls, for hand-made marks */
const plainModel = () => ({ bins: 20, v0: 0.25, heldLine: 0.1,
  cols: Array.from({ length: 13 }, (_, g) => col(g, 15, 0, 15, { final: g === 12 })) });

/* the drawHeat from before the marks existed (plan commit 903b849), loaded
 * from git into a temp file for the call-list comparison */
const baselineDrawHeat = () => {
  const src = execFileSync("git", ["show", "903b849:ancestry-heat.js"], { cwd: path.join(__dirname, ".."), encoding: "utf8" });
  const f = path.join(os.tmpdir(), `ancestry-heat-903b849-${process.pid}-${Date.now()}.js`);
  const had = globalThis.AncestryHeat;
  fs.writeFileSync(f, src);
  try {
    return require(f).drawHeat;
  } finally {
    fs.unlinkSync(f);
    globalThis.AncestryHeat = had;
  }
};
const callList = (calls) => calls.map((c) => ({ fn: c.fn, args: c.args, fillStyle: c.fillStyle, strokeStyle: c.strokeStyle }));

test("no o.marks: drawHeat makes exactly the calls the pre-marks drawHeat (903b849) made", () => {
  const old = baselineDrawHeat();
  assert.notEqual(old, H.drawHeat, "control: the baseline is a different function");
  const cases = [
    [X.model, { W: 566, H: 420, cursor: 3, fate: X.fate, title: "an example run" }],
    [stallModel(), { W: 566, H: 420, cursor: -1, fate: "STALLED" }],
    [X.model, { W: 300, H: 420, cursor: -1, fate: X.fate }],
  ];
  for (const [model, o] of cases) {
    const a = recorder(), b = recorder(), c = recorder();
    old(a.ctx, model, o);
    assert.deepEqual(H.drawHeat(b.ctx, model, o), { marks: 0 });
    assert.deepEqual(H.drawHeat(c.ctx, model, { ...o, marks: [] }), { marks: 0 });
    assert.ok(a.calls.length > 50, "control: the baseline drew something");
    assert.deepEqual(callList(b.calls), callList(a.calls));
    assert.deepEqual(callList(c.calls), callList(a.calls));
  }
});

test("marks leave the hatch key in its own ink (INK2), as without marks", () => {
  const model = stallModel();
  const marks = H.story(model, "STALLED").marks;
  const r = recorder();
  const out = H.drawHeat(r.ctx, model, { W: 566, H: 420, cursor: -1, fate: "STALLED", marks });
  assert.ok(out.marks >= 1, "control: a mark was drawn");
  const key = r.calls.filter((c) => c.fn === "fillText" && String(c.args[0]).startsWith("hatched:"));
  assert.equal(key.length, 1, "control: the hatch key is drawn");
  assert.equal(key[0].fillStyle, "#9aa0a8");
});

test("a mark whose slot and moved-down slot are both taken is dropped, and not counted", () => {
  const marks = [
    { col: 4, row: "mid", text: "first hybrids" },
    { col: 4, row: "mid", text: "lineage 1 gone" },
    { col: 4, row: "mid", text: "stalled: no new plants" },
  ];
  const r = recorder();
  const out = H.drawHeat(r.ctx, plainModel(), { W: 566, H: 420, cursor: -1, marks });
  assert.equal(out.marks, 2);
  const t = texts(r.calls);
  assert.ok(t.includes("first hybrids") && t.includes("lineage 1 gone"), "the first two are drawn");
  assert.ok(!t.includes("stalled: no new plants"), "the third is dropped");
});

test("a second mark on the same slot moves down 14 px", () => {
  /* the mid row: a top or bottom mark moved 14 px would cross a band line
   * and is dropped (3b) */
  const marks = [
    { col: 4, row: "mid", text: "first hybrids" },
    { col: 4, row: "mid", text: "lineage 1 gone" },
  ];
  const r = recorder();
  const out = H.drawHeat(r.ctx, plainModel(), { W: 566, H: 420, cursor: -1, marks });
  assert.equal(out.marks, 2);
  const [p1, p2] = markPlates(r.calls, marks);
  assert.equal(p2.y, p1.y + 14);
  assert.ok(!overlap(p1, p2));
});

test("a mark near the separator hangs left of its tick (right-aligned)", () => {
  const model = plainModel();
  const lay = H.layout(model, 566, 420);
  const c = model.cols.length - 2; // the last generation, just before the separator
  const marks = [{ col: c, row: "top", text: "stalled: no new plants" }];
  const r = recorder();
  assert.equal(H.drawHeat(r.ctx, model, { W: 566, H: 420, cursor: -1, marks }).marks, 1);
  const tx = Math.round(lay.xOf(c) + lay.colW / 2) + 0.5;
  const ft = r.calls.find((k) => k.fn === "fillText" && k.args[0] === marks[0].text);
  assert.equal(ft.textAlign, "right");
  const [p] = markPlates(r.calls, marks);
  assert.ok(p.x + p.w <= tx - 4 + 2 + 1e-9, `plate ends at ${p.x + p.w}, tick at ${tx}`);
  assert.ok(p.x >= lay.padL);
  /* positive control: the same mark mid-plot is left-aligned */
  const r2 = recorder();
  H.drawHeat(r2.ctx, model, { W: 566, H: 420, cursor: -1, marks: [{ ...marks[0], col: 2 }] });
  assert.equal(r2.calls.find((k) => k.fn === "fillText" && k.args[0] === marks[0].text).textAlign, "left");
});

/* ---- 3b (critic r1 #9, #8) ------------------------------------------- */
/* the page's heat is 760x420 scaled to its width: W 566 is the 1400 px hero,
 * W 462 the narrowest plot that still draws marks (MARKS_MIN_W + padL + PAD.R) */
const SIZES = [[566, Math.round((566 * 420) / 760)], [462, Math.round((462 * 420) / 760)], [566, 420]];

test("a mark's label sits on a solid light plate with dark text, drawn over the hatch", () => {
  assert.equal(H.layout(stallModel(), 462, 255).padL + 360 + 16, 462, "control: 462 is the narrowest width with marks");
  for (const [W, Ht] of SIZES) {
    const model = stallModel();
    const marks = H.story(model, "STALLED").marks;
    const r = recorder();
    const out = H.drawHeat(r.ctx, model, { W, H: Ht, cursor: -1, fate: "STALLED", marks });
    assert.ok(out.marks >= 1, `control: a mark is drawn at ${W}x${Ht}`);
    const lastHatch = r.calls.map((c) => c.strokeStyle === "rgba(217,112,79,0.8)" && c.fn === "stroke").lastIndexOf(true);
    assert.ok(lastHatch > 0, "control: the hatch was drawn");
    for (const m of marks) {
      const i = r.calls.findIndex((c) => c.fn === "fillText" && c.args[0] === m.text);
      if (i < 0) continue;
      const plate = r.calls[i - 1];
      assert.equal(plate.fn, "fillRect", `${m.text}: the plate is drawn right before the label`);
      assert.equal(plate.fillStyle, MARK_INK, `${m.text}: the plate is the light ink, not the canvas background`);
      assert.equal(plate.globalAlpha, 1, "the plate is opaque");
      assert.equal(r.calls[i].fillStyle, PLATE, `${m.text}: dark text on the light plate`);
      assert.ok(i - 1 > lastHatch, "the plate is drawn after every hatch stroke");
      const [px, py, pw, ph] = plate.args;
      const [, tx, ty] = r.calls[i].args;
      const tw = 6.2 * m.text.length;
      const x0 = r.calls[i].textAlign === "right" ? tx - tw : tx;
      assert.ok(px <= x0 - 2 && px + pw >= x0 + tw + 2 && py <= ty - 10 && py + ph >= ty + 3, `${m.text}: the plate covers the text`);
    }
  }
});

test("every row's plate clears both dashed band lines by >= 2 px", () => {
  const gap = H.MARK_LINE_GAP;
  assert.ok(gap >= 2);
  for (const [W, Ht] of SIZES) {
    const model = plainModel();
    const lay = H.layout(model, W, Ht);
    const lines = [3, 17].map((b) => lay.heatTop + b * lay.rowH);
    for (const row of ["top", "mid", "bottom"]) {
      const marks = [{ col: 4, row, text: "stalled: no new plants" }];
      const r = recorder();
      const out = H.drawHeat(r.ctx, model, { W, H: Ht, cursor: -1, marks });
      assert.equal(out.marks, 1, `control: the ${row} mark is drawn at ${W}x${Ht}`);
      const [p] = markPlates(r.calls, marks);
      for (const L of lines)
        assert.ok(p.y + p.h <= L - 2 || p.y >= L + 2,
          `${row} at ${W}x${Ht}: plate ${p.y.toFixed(1)}-${(p.y + p.h).toFixed(1)} vs line ${L.toFixed(1)}`);
      assert.ok(p.y >= lay.heatTop && p.y + p.h <= lay.heatBot, "inside the heat");
    }
    /* the rows stay in their zones: top above line 1, bottom below line 2 */
    const yOf = (row) => {
      const marks = [{ col: 4, row, text: "first hybrids" }];
      const r = recorder();
      H.drawHeat(r.ctx, model, { W, H: Ht, cursor: -1, marks });
      return markPlates(r.calls, marks)[0];
    };
    assert.ok(yOf("top").y + yOf("top").h <= lines[0], "top is in the lineage 1 zone");
    assert.ok(yOf("bottom").y >= lines[1], "bottom is in the lineage 2 zone");
  }
});
