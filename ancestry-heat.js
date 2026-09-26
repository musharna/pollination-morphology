/*
 * Ancestry over generations, as a heatmap (visual-first rebuild, 2026-09-25).
 *
 * One column per generation's PARENTS — the frames the field draws — and one
 * more for the FINAL offspring, which the frames drop and which the fate is
 * read off (population-run.js runGenerations; sim/ibm.js fateOf). Rows are
 * ancestry bins, lineage 1 (ancestry 0) at the top. Below the heat, each
 * column's ancestry variance against the HELD line, 0.4 x founding — the
 * engine's predicate (sim/ibm.js:550), drawn, never re-decided here.
 *
 * ⚠️ THE BAND'S ENDPOINTS BELONG OUTSIDE IT. The hybrid band is the OPEN
 * interval (0.15, 0.85), as SandboxRun.isHybrid and fateOf use it, and 3/20
 * and 17/20 are exactly the doubles 0.15 and 0.85, so the band's edges are bin
 * edges. A plain floor(a * 20) puts 0.15 in bin 3, inside the band. So values
 * are compared against the edges k/20: below 0.5 a value goes in the bin whose
 * upper edge is >= it, at or above 0.5 in the bin whose lower edge is <= it,
 * and both endpoints land outside (tests/ancestry-heat.test.js).
 *
 * Classic script, one IIFE (as population-run.js); also CommonJS for tests.
 */
(function (global) {
  "use strict";
  const BINS = 20;
  const EDGES = Array.from({ length: BINS + 1 }, (_, k) => k / BINS);
  const HYB_FIRST = 3,
    HYB_LAST = 16; // bins 3..16 are exactly (0.15, 0.85)
  const TAU = Math.PI * 2;

  function binOf(a) {
    if (typeof a !== "number" || !Number.isFinite(a) || a < 0 || a > 1)
      throw new Error(`ancestry ${a} is outside [0, 1]`);
    if (a < 0.5) {
      for (let i = 0; i < BINS; i++) if (a <= EDGES[i + 1]) return i;
    }
    for (let i = BINS - 1; i >= 0; i--) if (EDGES[i] <= a) return i;
    throw new Error(`ancestry ${a}: no bin`);
  }

  const ancOf = (ind) => (ind.anc === undefined ? 0 : ind.anc);
  function counts(ancs) {
    const c = new Array(BINS).fill(0);
    for (const a of ancs) c[binOf(a)]++;
    return c;
  }

  function heatModel(frames, final, v0) {
    const I = global.IBM,
      S = global.SandboxRun;
    if (!I || !S) throw new Error("AncestryHeat needs IBM and SandboxRun loaded first");
    const cols = frames.map((f, g) => ({
      g,
      final: false,
      n: f.anc.length,
      counts: counts(f.anc),
      hyb: f.anc.filter(S.isHybrid).length,
      ancVar: f.ancVar,
      /* step() hands the parents back when nothing recruits, so the next
       * column repeats this one: flagged, or a stall reads as HELD */
      stalled: f.recruits === 0,
    }));
    const fa = (final || []).map(ancOf);
    cols.push({
      g: frames.length,
      final: true,
      n: fa.length,
      counts: counts(fa),
      hyb: fa.filter(S.isHybrid).length,
      ancVar: fa.length >= 2 ? I.ancestryVar(final) : null,
      stalled: false,
    });
    return { bins: BINS, v0, heldLine: 0.4 * v0, cols };
  }

  const PAD = { L: 74, R: 16, T: 30, B: 24 };
  const FINAL_GAP = 12;
  function layout(model, W, H) {
    const n = model.cols.length;
    const heatTop = PAD.T,
      heatBot = Math.round(H * 0.64);
    const stripTop = heatBot + 26,
      stripBot = H - PAD.B;
    const colW = (W - PAD.L - PAD.R - FINAL_GAP) / n;
    const xOf = (i) => PAD.L + i * colW + (model.cols[i] && model.cols[i].final ? FINAL_GAP : 0);
    return { W, H, colW, xOf, heatTop, heatBot, stripTop, stripBot, rowH: (heatBot - heatTop) / BINS };
  }
  function colAt(model, x, W, H) {
    const lay = layout(model, W, H);
    for (let i = 0; i < model.cols.length; i++) {
      const x0 = lay.xOf(i);
      if (x >= x0 && x < x0 + lay.colW) return i;
    }
    return -1;
  }

  /* ancestry -> tint, moved here verbatim from sandbox.html so the field, the
   * body-map dots and the heat share one colour source */
  function ancHex(a) {
    const A = [232, 178, 58],
      B = [204, 102, 153];
    const toWhite = 1 - Math.abs(a - 0.5) * 2;
    const base = a < 0.5 ? A : B;
    const c = base.map((v) => Math.round(v + (226 - v) * toWhite * 0.8));
    return "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("");
  }

  const INK2 = "#9aa0a8",
    RULE = "#2f343d";

  function drawEmpty(ctx, W, H, msg) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = INK2;
    ctx.font = "13px system-ui";
    ctx.fillText(msg, PAD.L, H / 2);
  }

  function drawHeat(ctx, model, o) {
    const { W, H } = o;
    const lay = layout(model, W, H);
    ctx.clearRect(0, 0, W, H);
    ctx.font = "11px system-ui";
    /* cells: hue = the bin's ancestry, opacity = its share of the column */
    model.cols.forEach((c, i) => {
      const x = lay.xOf(i);
      c.counts.forEach((k, b) => {
        if (!k) return;
        ctx.globalAlpha = 0.18 + 0.82 * (k / c.n);
        ctx.fillStyle = ancHex((b + 0.5) / BINS);
        ctx.fillRect(x, lay.heatTop + b * lay.rowH, lay.colW - 1, lay.rowH);
      });
      ctx.globalAlpha = 1;
      if (c.stalled) {
        ctx.strokeStyle = "rgba(217,112,79,0.8)";
        ctx.lineWidth = 1;
        for (let y = lay.heatTop; y < lay.heatBot; y += 8) {
          ctx.beginPath();
          ctx.moveTo(x, y + 8);
          ctx.lineTo(x + lay.colW - 1, y);
          ctx.stroke();
        }
      }
    });
    /* the hybrid band, the engine's (0.15, 0.85) */
    ctx.strokeStyle = INK2;
    ctx.setLineDash([4, 4]);
    for (const b of [HYB_FIRST, HYB_LAST + 1]) {
      const y = lay.heatTop + b * lay.rowH;
      ctx.beginPath();
      ctx.moveTo(PAD.L, y);
      ctx.lineTo(W - PAD.R, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.fillStyle = "#e8b23a";
    ctx.fillText("lineage 1", 6, lay.heatTop + 12);
    ctx.fillStyle = "#cc6699";
    ctx.fillText("lineage 2", 6, lay.heatBot - 4);
    ctx.fillStyle = INK2;
    ctx.fillText("hybrid band", 6, (lay.heatTop + lay.heatBot) / 2);
    ctx.fillText("(0.15–0.85)", 6, (lay.heatTop + lay.heatBot) / 2 + 13);
    /* x: generations, then the final offspring */
    const last = model.cols.length - 1;
    ctx.fillText("generation 0", lay.xOf(0), lay.heatTop - 8);
    ctx.fillText(`final${o.fate ? ": " + o.fate : ""}`, Math.max(PAD.L, lay.xOf(last) - 40), lay.heatTop - 8);
    if (o.title) ctx.fillText(o.title, PAD.L + 90, lay.heatTop - 8);
    if (model.cols.some((c) => c.stalled))
      ctx.fillText("hatched: this generation recruited nothing (parents handed back)", PAD.L, lay.heatBot + 16);
    /* the strip: ancestry variance against the HELD line */
    const vals = model.cols.map((c) => c.ancVar).filter((v) => v !== null);
    const top = Math.max(model.v0, ...vals, 1e-9) * 1.1;
    const yOf = (v) => lay.stripBot - (v / top) * (lay.stripBot - lay.stripTop);
    ctx.strokeStyle = RULE;
    ctx.strokeRect(PAD.L, lay.stripTop, W - PAD.L - PAD.R, lay.stripBot - lay.stripTop);
    ctx.strokeStyle = "#d9704f";
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(PAD.L, yOf(model.heldLine));
    ctx.lineTo(W - PAD.R, yOf(model.heldLine));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#d9704f";
    ctx.fillText(`HELD line 0.4 × founding = ${model.heldLine.toFixed(4)}`, PAD.L + 4, yOf(model.heldLine) - 4);
    ctx.fillStyle = INK2;
    ctx.fillText("ancestry", 6, lay.stripTop + 12);
    ctx.fillText("variance", 6, lay.stripTop + 25);
    ctx.strokeStyle = "#e8e6e1";
    ctx.beginPath();
    let started = false;
    model.cols.forEach((c, i) => {
      if (c.final || c.ancVar === null) return;
      const x = lay.xOf(i) + lay.colW / 2;
      if (started) ctx.lineTo(x, yOf(c.ancVar));
      else ctx.moveTo(x, yOf(c.ancVar));
      started = true;
    });
    ctx.stroke();
    const fin = model.cols[last];
    if (fin.ancVar !== null) {
      ctx.fillStyle = fin.ancVar > model.heldLine ? "#6fbf73" : "#d9704f";
      ctx.beginPath();
      ctx.arc(lay.xOf(last) + lay.colW / 2, yOf(fin.ancVar), 4, 0, TAU);
      ctx.fill();
    }
    /* the scrubbed generation */
    if (Number.isInteger(o.cursor) && o.cursor >= 0 && o.cursor < model.cols.length) {
      ctx.strokeStyle = "#e8e6e1";
      ctx.lineWidth = 2;
      ctx.strokeRect(lay.xOf(o.cursor) - 1, lay.heatTop - 2, lay.colW + 1, lay.stripBot - lay.heatTop + 4);
      ctx.lineWidth = 1;
    }
  }

  const api = { BINS, binOf, heatModel, layout, colAt, drawHeat, drawEmpty, ancHex };
  global.AncestryHeat = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
