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
  const record = () => {
    const calls = [];
    const ctx = new Proxy({}, {
      get: (t, k) => (k in t ? t[k] : (...a) => calls.push([k, ...a])),
      set: (t, k, v) => ((t[k] = v), true),
    });
    return { ctx, calls, text: () => calls.filter((c) => c[0] === "fillText").map((c) => c[1]).join(" | ") };
  };
  const plain = H.heatModel([frame([0, 1]), frame([0, 1])], [0, 1].map(ind), 0.25);
  const r1 = record();
  H.drawHeat(r1.ctx, plain, { W: 760, H: 420, cursor: 0, fate: "HELD" });
  assert.match(r1.text(), /HELD line/);
  assert.match(r1.text(), /hybrid band/);
  assert.match(r1.text(), /final/);
  assert.doesNotMatch(r1.text(), /recruited nothing/);
  const stalled = H.heatModel([frame([0, 1], 0), frame([0, 1], 0)], [0, 1].map(ind), 0.25);
  const r2 = record();
  H.drawHeat(r2.ctx, stalled, { W: 760, H: 420, cursor: 1, fate: "STALLED" });
  assert.match(r2.text(), /recruited nothing/);
});
