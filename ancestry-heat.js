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

  /* PAD.L is the left gutter: its widest label plus 8 px must end before the
   * gen-0 cursor box at xOf(0) - 2. Measured in headless Chromium (default
   * launch, 2026-09-26), 11px system-ui: "hybrid band" 66.2, "(0.15–0.85)"
   * 63.1, "lineage 1/2" 50.8, "ancestry" 47.6, "variance" 47.4 px. Drawn at
   * x = GUTTER_X: 6 + 66.2 + 8 + 2 = 82.2, so 86 leaves ~4 px for a wider
   * system font; drawHeat measures again and condenses any label that would
   * not fit (fillText maxWidth), never moving the plot. One constant, so
   * drawHeat and colAt (which has no ctx) share one layout. */
  /* PAD.T holds two header rows: the title and "final: <fate>" (HEAD_Y), then
   * the axis row just above the columns, "generation 0" and "gen N" (AXIS_DY
   * above heatTop, clear of the cursor box's top edge at heatTop - 2) */
  const PAD = { L: 86, R: 16, T: 40, B: 24 };
  const HEAD_Y = 13,
    AXIS_DY = 7,
    KEY_DY = 16; // the HELD key's baseline below stripBot, inside PAD.B (24)
  const GUTTER_X = 6;
  /* story marks (sandbox intro, 2026-09-27) are drawn only when the plot,
   * W - padL - PAD.R, is at least this wide. Measured in headless Chromium
   * (default launch, 2026-09-27), 11px system-ui: "stalled: no new plants"
   * 121.1 px is the widest mark ("lineage 1/2 gone" 81.8, "first hybrids"
   * 65.7); two marks side by side plus their ticks, offsets and the final
   * column need >= 360 px of plot. The phone hero (~300 px heat, ~200 px of
   * plot) gets none; the caption carries the story there. */
  const MARKS_MIN_W = 360;
  const FINAL_GAP = 12;
  function layout(model, W, H, padL = PAD.L) {
    const n = model.cols.length;
    const heatTop = PAD.T,
      heatBot = Math.round(H * 0.64);
    const stripTop = heatBot + 26,
      stripBot = H - PAD.B;
    const colW = (W - padL - PAD.R - FINAL_GAP) / n;
    const xOf = (i) => padL + i * colW + (model.cols[i] && model.cols[i].final ? FINAL_GAP : 0);
    return { W, H, padL, padR: PAD.R, colW, xOf, heatTop, heatBot, stripTop, stripBot, rowH: (heatBot - heatTop) / BINS };
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
    RULE = "#2f343d",
    PLATE = "#101216"; // the canvas's CSS background (sandbox.html canvas {})

  function drawEmpty(ctx, W, H, msg) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = INK2;
    ctx.font = "13px system-ui";
    ctx.fillText(msg, PAD.L, H / 2);
  }

  /* measured width, or null on a ctx that cannot measure (no measureText, or
   * the node fake DOM's no-op context, tools/fake-dom.js, which returns nothing) */
  const widthOf = (ctx, s) => {
    const m = typeof ctx.measureText === "function" ? ctx.measureText(s) : null;
    return m && typeof m.width === "number" ? m.width : null;
  };

  /* A stalled generation's hatch, over [y0, y1] of a column at x, w wide:
   * one source for the heat and the variance strip (Task 7e), so the flat
   * trace of a stalled run visibly sits in the same hatched generations.
   * Each stroke rises 8 px across the column; the last is cut at y1 on the
   * same slope, so no stroke leaves the band it marks. */
  const HATCH = "rgba(217,112,79,0.8)";
  function hatch(ctx, x, w, y0, y1) {
    ctx.strokeStyle = HATCH;
    ctx.lineWidth = 1;
    for (let y = y0; y < y1; y += 8) {
      const yb = Math.min(y + 8, y1);
      ctx.beginPath();
      ctx.moveTo(x, yb);
      ctx.lineTo(x + (w * (yb - y)) / 8, y);
      ctx.stroke();
    }
  }

  function drawHeat(ctx, model, o) {
    const { W, H } = o;
    const lay = layout(model, W, H);
    ctx.clearRect(0, 0, W, H);
    ctx.font = "11px system-ui";
    ctx.textAlign = "left";
    /* a gutter label ends 8 px before the gen-0 cursor box (xOf(0) - 2) */
    const gutterMax = lay.padL - 2 - 8 - GUTTER_X;
    const gutter = (s, y) => {
      const w = widthOf(ctx, s);
      /* maxWidth: browsers squash the glyphs horizontally to fit, never clip */
      if (w !== null && w > gutterMax) ctx.fillText(s, GUTTER_X, y, gutterMax);
      else ctx.fillText(s, GUTTER_X, y);
    };
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
      if (c.stalled) hatch(ctx, x, lay.colW - 1, lay.heatTop, lay.heatBot);
    });
    /* the hybrid band, the engine's (0.15, 0.85) */
    ctx.strokeStyle = INK2;
    ctx.setLineDash([4, 4]);
    for (const b of [HYB_FIRST, HYB_LAST + 1]) {
      const y = lay.heatTop + b * lay.rowH;
      ctx.beginPath();
      ctx.moveTo(lay.padL, y);
      ctx.lineTo(W - PAD.R, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    const last = model.cols.length - 1;
    /* the separator: 1 px in the FINAL_GAP, heat and strip, not the gap between */
    const sepX = Math.round(lay.xOf(last) - FINAL_GAP / 2) + 0.5;
    ctx.strokeStyle = "#5a606b";
    ctx.lineWidth = 1;
    for (const [y0, y1] of [[lay.heatTop, lay.heatBot], [lay.stripTop, lay.stripBot]]) {
      ctx.beginPath();
      ctx.moveTo(sepX, y0);
      ctx.lineTo(sepX, y1);
      ctx.stroke();
    }
    /* the strip: ancestry variance against the HELD line */
    const vals = model.cols.map((c) => c.ancVar).filter((v) => v !== null);
    const top = Math.max(model.v0, ...vals, 1e-9) * 1.1;
    const yOf = (v) => lay.stripBot - (v / top) * (lay.stripBot - lay.stripTop);
    ctx.strokeStyle = RULE;
    ctx.strokeRect(lay.padL, lay.stripTop, W - lay.padL - PAD.R, lay.stripBot - lay.stripTop);
    /* the stalled generations again, under the trace: a stalled run's
     * variance is the parents' handed back, flat, not a hold (Task 7e) */
    model.cols.forEach((c, i) => {
      if (c.stalled) hatch(ctx, lay.xOf(i), lay.colW - 1, lay.stripTop, lay.stripBot);
    });
    ctx.strokeStyle = "#d9704f";
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(lay.padL, yOf(model.heldLine));
    ctx.lineTo(W - PAD.R, yOf(model.heldLine));
    ctx.stroke();
    ctx.setLineDash([]);
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
      /* keyed on the run's fate, not on the line: a STALLED run keeps its
       * variance above the line and is not a win; no fate (the example
       * state) gets the neutral ink */
      ctx.fillStyle = !o.fate ? "#e8e6e1" : o.fate === "HELD" ? "#6fbf73" : "#d9704f";
      ctx.beginPath();
      ctx.arc(lay.xOf(last) + lay.colW / 2, yOf(fin.ancVar), 4, 0, TAU);
      ctx.fill();
    }
    /* the scrubbed generation: BEFORE the labels, so they sit on top of it.
     * Two boxes, heat and strip, leaving the gap between them (where the
     * hatch caption sits) clear. */
    if (Number.isInteger(o.cursor) && o.cursor >= 0 && o.cursor < model.cols.length) {
      ctx.strokeStyle = "#e8e6e1";
      ctx.lineWidth = 2;
      const cx = lay.xOf(o.cursor) - 1;
      ctx.strokeRect(cx, lay.heatTop - 2, lay.colW + 1, lay.heatBot - lay.heatTop + 4);
      ctx.strokeRect(cx, lay.stripTop - 2, lay.colW + 1, lay.stripBot - lay.stripTop + 4);
      ctx.lineWidth = 1;
    }

    /* ---- labels, last. A plotted label sits on a plate: a rect in the
     * canvas background colour, measured (an estimate on a ctx that cannot
     * measure), so a trace, a line or the cursor never strikes through it. */
    const plated = (s, x, y, align, maxW) => {
      const m = widthOf(ctx, s);
      const w = Math.min(m === null ? 6.2 * s.length : m, maxW === undefined ? Infinity : maxW);
      const x0 = align === "right" ? x - w : x;
      const fill = ctx.fillStyle;
      ctx.fillStyle = PLATE;
      ctx.fillRect(x0 - 2, y - 10, w + 4, 13);
      ctx.fillStyle = fill;
      ctx.textAlign = align;
      if (maxW === undefined) ctx.fillText(s, x, y);
      else ctx.fillText(s, x, y, maxW);
      ctx.textAlign = "left";
    };
    ctx.fillStyle = "#e8b23a";
    gutter("lineage 1", lay.heatTop + 12);
    ctx.fillStyle = "#cc6699";
    gutter("lineage 2", lay.heatBot - 4);
    ctx.fillStyle = INK2;
    gutter("hybrid band", (lay.heatTop + lay.heatBot) / 2);
    gutter("(0.15–0.85)", (lay.heatTop + lay.heatBot) / 2 + 13);
    gutter("ancestry", lay.stripTop + 12);
    gutter("variance", lay.stripTop + 25);
    /* header row: the final offspring's label, right-aligned to the plot's
     * right edge so it never runs off the canvas, and the title left of it */
    const finalText = `final${o.fate ? ": " + o.fate : ""}`;
    plated(finalText, W - PAD.R, HEAD_Y, "right");
    /* the title, TRUNCATED with "…" to the room left of the final label
     * (measured); the full text is the page's #heatLive */
    if (o.title) {
      const fw = widthOf(ctx, finalText);
      const tx = lay.padL;
      let t = o.title;
      if (fw !== null) {
        const room = W - PAD.R - fw - 16 - tx;
        while (t && widthOf(ctx, t === o.title ? t : t + "…") > room) t = t.slice(0, -1).trimEnd();
        if (t !== o.title) t = t ? t + "…" : "";
      }
      if (t) ctx.fillText(t, tx, HEAD_Y);
    }
    /* axis row: generation 0 over the first column, "gen N" right-aligned
     * over the last generation's column (before the separator and the final
     * column), drawn only where it clears the generation-0 label */
    const ay = lay.heatTop - AXIS_DY;
    const gen0 = "generation 0";
    plated(gen0, lay.xOf(0), ay, "left");
    if (last >= 2) {
      const gN = `gen ${model.cols[last - 1].g}`;
      const gx = lay.xOf(last - 1) + lay.colW - 1;
      const w0 = widthOf(ctx, gen0),
        wN = widthOf(ctx, gN);
      const est = (s, w) => (w === null ? 6.2 * s.length : w);
      if (gx - est(gN, wN) > lay.xOf(0) + est(gen0, w0) + 8) plated(gN, gx, ay, "right");
    }
    /* story marks: a tick at the column's centre down the heat, and a plated
     * label beside it in the mark's row. Placed first, all of them, so every
     * tick is drawn under every label. A label that would overlap one already
     * placed moves down 14 px once; if it still overlaps, or leaves the heat,
     * the mark (tick and label) is dropped. */
    let drawnMarks = 0;
    if (Array.isArray(o.marks) && o.marks.length && W - lay.padL - PAD.R >= MARKS_MIN_W) {
      const MARK_INK = "#e8e6e1";
      const rowY = {
        top: lay.heatTop + 26, // below the "lineage 1" gutter row's baseline
        mid: (lay.heatTop + lay.heatBot) / 2 - 16, // above the "hybrid band" gutter label
        bottom: lay.heatBot - 18,
      };
      /* the plate plated() draws for (s, x, y, align) */
      const plateOf = (s, x, y, align) => {
        const m = widthOf(ctx, s);
        const w = m === null ? 6.2 * s.length : m;
        return { x: (align === "right" ? x - w : x) - 2, y: y - 10, w: w + 4, h: 13 };
      };
      const hit = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
      const inHeat = (r) => r.x >= lay.padL && r.x + r.w <= W - PAD.R && r.y >= lay.heatTop && r.y + r.h <= lay.heatBot;
      const placed = [];
      for (const mk of o.marks) {
        if (!(mk.col >= 0 && mk.col < model.cols.length) || !(mk.row in rowY))
          throw new Error(`drawHeat: bad mark ${JSON.stringify(mk)}`);
        const tx = Math.round(lay.xOf(mk.col) + lay.colW / 2) + 0.5;
        let x = tx + 4,
          align = "left",
          y = rowY[mk.row];
        const r0 = plateOf(mk.text, x, y, align);
        if (r0.x + r0.w - 2 > sepX - 4) {
          /* the label's right edge would pass the separator: hang it left */
          x = tx - 4;
          align = "right";
        }
        let r = plateOf(mk.text, x, y, align);
        if (placed.some((p) => hit(r, p.r))) {
          y += 14;
          r = plateOf(mk.text, x, y, align);
        }
        if (placed.some((p) => hit(r, p.r)) || !inHeat(r)) continue;
        placed.push({ mk, tx, x, y, align, r });
      }
      /* the labels after this block (the hatch key) draw in the ink left
       * here, so the block hands back the fill and stroke it found */
      const fill0 = ctx.fillStyle,
        stroke0 = ctx.strokeStyle;
      ctx.strokeStyle = MARK_INK;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.6;
      for (const p of placed) {
        ctx.beginPath();
        ctx.moveTo(p.tx, lay.heatTop);
        ctx.lineTo(p.tx, lay.heatBot);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = MARK_INK;
      for (const p of placed) plated(p.mk.text, p.x, p.y, p.align);
      ctx.fillStyle = fill0;
      ctx.strokeStyle = stroke0;
      drawnMarks = placed.length;
    }
    /* the hatch key, in the gap between the heat and the strip (the cursor
     * is not drawn there), right-aligned to end before the separator: away
     * from the "lineage 2" gutter label it must not read as a caption of */
    if (model.cols.some((c) => c.stalled))
      plated("hatched: a stalled generation (recruited nothing; parents handed back)",
        sepX - 6, lay.heatBot + 17, "right", sepX - 6 - lay.padL - 16);
    /* the HELD line's key: a caption row BELOW the strip, right-aligned to
     * W - PAD.R, an 18 px dashed swatch then the text, no plate. Nothing is
     * drawn over the strip, whose trace crosses the line exactly where the
     * verdict turns (fix round 1: an in-strip plate hid trace points there). */
    const heldText = `HELD line = 0.4 × founding = ${model.heldLine.toFixed(4)}`;
    const ky = lay.stripBot + KEY_DY;
    const hw = widthOf(ctx, heldText);
    const hx0 = W - PAD.R - (hw === null ? 6.2 * heldText.length : hw);
    ctx.strokeStyle = "#d9704f";
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(hx0 - 6 - 18, ky - 4);
    ctx.lineTo(hx0 - 6, ky - 4);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#d9704f";
    ctx.textAlign = "right";
    ctx.fillText(heldText, W - PAD.R, ky);
    ctx.textAlign = "left";
    /* the end dot's key (Task 7e), on the same row from the plot's left
     * edge, ending 12 px before the HELD swatch. Measured 205 px at 11px
     * system-ui (headless Chromium, 2026-09-26): it fits whole from a heat
     * ~550 px wide (the 1400 px hero is 566); narrower, it is condensed
     * (maxWidth) down to 60% of its width, a heat ~470 px wide; below that
     * the row has no room and it is not drawn. */
    const dotText = "dot: final variance, green when HELD";
    const room = hx0 - 6 - 18 - 12 - lay.padL;
    const dw = widthOf(ctx, dotText);
    const dwEst = dw === null ? 6.2 * dotText.length : dw;
    ctx.fillStyle = INK2;
    if (dwEst <= room) ctx.fillText(dotText, lay.padL, ky);
    else if (room >= 0.6 * dwEst) ctx.fillText(dotText, lay.padL, ky, room);
    return { marks: drawnMarks };
  }

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

  const api = { BINS, binOf, heatModel, layout, colAt, drawHeat, drawEmpty, ancHex, story, lostLineage, MARKS_MIN_W };
  global.AncestryHeat = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
