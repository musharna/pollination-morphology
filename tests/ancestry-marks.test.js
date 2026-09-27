/*
 * Story marks on the heat (sandbox intro, 2026-09-27): drawHeat draws each of
 * story(...).marks as a tick + a plated label inside the heat, never one label
 * over another, and none at all when the plot is too narrow to hold them.
 * Seen failing: drawHeat returned nothing and drew no marks.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const H = require("../ancestry-heat.js");
globalThis.window = globalThis;
require("../example-heat.js");
const X = globalThis.ExampleHeat;

const PLATE = "#101216";
const recorder = () => {
  const calls = [];
  const st = { textAlign: "left", fillStyle: "#000", strokeStyle: "#000", lineWidth: 1, globalAlpha: 1, font: "" };
  const ctx = new Proxy(st, {
    get: (t, k) => {
      if (k === "measureText") return (s) => ({ width: 6.2 * String(s).length });
      if (k in t) return t[k];
      return (...args) => calls.push({ fn: k, args, textAlign: t.textAlign, fillStyle: t.fillStyle, lineWidth: t.lineWidth });
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
    while (j >= 0 && !(calls[j].fn === "fillRect" && calls[j].fillStyle === PLATE)) j--;
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

test("no o.marks: drawHeat draws exactly what it drew before (same fillText list)", () => {
  const a = recorder(), b = recorder();
  const outA = H.drawHeat(a.ctx, X.model, { W: 566, H: 420, cursor: -1, fate: X.fate });
  const outB = H.drawHeat(b.ctx, X.model, { W: 566, H: 420, cursor: -1, fate: X.fate, marks: [] });
  assert.deepEqual(outA, { marks: 0 });
  assert.deepEqual(outB, { marks: 0 });
  assert.deepEqual(texts(a.calls), texts(b.calls));
  assert.deepEqual(plates(a.calls), plates(b.calls));
});
