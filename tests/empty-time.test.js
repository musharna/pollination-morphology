/*
 * The #51 ablation — `PH.displayProportionalVisits` — and its guards, per
 * docs/2026-08-31-empty-time-prereg.md.
 *
 * Every slice normally receives `perSlice = round(per/S)` visits REGARDLESS of
 * how much display it carries, and the draw inside the bout is renormalised over
 * the plants present. Together those make EMPTY TIME VALUABLE. The flag
 * apportions the SAME total in proportion to the display each slice actually
 * carries, which removes that premium and leaves geitonogamy in place.
 *
 * ⚠️ TEST 1 COMPARES AGAINST A DIFFERENT BUILD, for the reason
 * tests/conserved-display.test.js states: today's code agreeing with itself
 * would pass just as happily if the new path had shifted every stream, because
 * both sides shifted together.
 *
 * ⚠️ `emptyVisitSlices` IS NOT COVERED HERE AND THAT IS DELIBERATE. A slice
 * carrying display and still receiving zero visits requires a display share
 * below roughly 1/(2·total); probed across budgets 24000, 800, 80 and 16 and
 * widths 0.12 and 0.3, it never fires. It is structurally unreached at any
 * realistic budget, exactly like the `occ[i] || 1` guard in
 * tests/conserved-display.test.js, and it is retained as a belt rather than
 * claimed as tested. A test named for it would be a name without coverage,
 * which is the failure this project has already paid for twice.
 */

const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const I = require("../sim/ibm.js");
const E = require("../sim/evolve.js");

/* The last commit before displayProportionalVisits existed — result(#50). */
const PRE_DPV_REF = "5602460";

const SLICES = 8;
const WIDTH = 0.12;
const N0 = 14;
const GENS = 6;
const SITE_N = 60;
const D_EXCL = 8;

const optsAt = (extra = {}) => ({ ...I.DEFAULTS, siteN: SITE_N, ...extra });

function digest(mod, phen, seed, gens = GENS) {
  const rng = E.makeRng(seed);
  const srng = mod.signalRng(seed);
  const brng = mod.bloomRng(seed);
  const wrng =
    phen && phen.widthLocus && mod.widthRng ? mod.widthRng(seed) : null;
  const opts = optsAt({ phenology: phen });
  const built = mod.foundTwoLineages(N0, rng, srng, D_EXCL, opts);
  assert.ok(built, `fixture failed at seed ${seed}`);
  let pop = built.pop;
  const rows = [];
  let spent = 0;
  for (let g = 0; g < gens; g++) {
    if (pop.length < 2) break;
    const res = mod.step(pop, opts, rng, g, srng, brng, wrng);
    rows.push(
      [
        res.popN,
        res.bloomAssort,
        res.bloomLineage,
        res.coflower,
        res.unmated,
        (res.blooms || []).map((x) => x.toFixed(12)).join(","),
      ].join("|"),
    );
    spent += res.visitsSpent || 0;
    pop = res.pop;
  }
  return { rows, tail: rng(), spent };
}

function loadPreDpvModule() {
  const dst = path.join(
    __dirname,
    "..",
    "sim",
    `.baseline-dpv-ibm-${process.pid}.js`,
  );
  const src = execFileSync("git", ["show", `${PRE_DPV_REF}:sim/ibm.js`], {
    cwd: path.join(__dirname, ".."),
    maxBuffer: 32 * 1024 * 1024,
  });
  fs.writeFileSync(dst, src);
  return {
    mod: require(dst),
    source: src.toString("utf8"),
    cleanup: () => fs.rmSync(dst, { force: true }),
  };
}

/* ------------- 1. THE GUARD: the flag off runs the old code exactly -------- */

test("with the ablation off, every phenology stream is byte-identical to the pre-ablation build", () => {
  const { mod: OLD, source, cleanup } = loadPreDpvModule();
  try {
    /* The flag is not an export, so the probe is on the source. Without this the
     * test compares the new build against itself the day PRE_DPV_REF is bumped,
     * and passes for the wrong reason. */
    assert.ok(
      !source.includes("displayProportionalVisits"),
      `${PRE_DPV_REF} already contains displayProportionalVisits — the baseline ` +
        `is not a pre-ablation build and this test proves nothing`,
    );
    for (const phen of [
      { width: 1.0, slices: SLICES },
      { width: WIDTH, slices: SLICES },
      { width: WIDTH, slices: SLICES, conserveDisplay: true },
      { slices: SLICES, widthLocus: true, widthMut: 0.03 },
      {
        slices: SLICES,
        widthLocus: true,
        widthMut: 0.03,
        conserveDisplay: true,
      },
    ])
      for (const seed of [1, 2, 3]) {
        const a = digest(OLD, phen, seed);
        const b = digest(I, phen, seed);
        assert.deepStrictEqual(
          b.rows,
          a.rows,
          `${JSON.stringify(phen)} seed ${seed}: the ablation's presence moved a ` +
            `run in which it is switched OFF`,
        );
        assert.strictEqual(b.tail, a.tail, `stream drift at seed ${seed}`);
      }
  } finally {
    cleanup();
  }
});

/* ---------- 2. THE CONFOUND GUARD: the same budget, redistributed --------- */

/* One step on a given population, so the two arms are compared on IDENTICAL
 * input. Beyond generation 0 the arms are different models and their
 * populations diverge, so their budgets legitimately differ — comparing summed
 * spend over six generations compares two trajectories, not two budgets. */
function spendOnSamePopulation(phen, seed) {
  const mk = () => {
    const rng = E.makeRng(seed);
    const srng = I.signalRng(seed);
    const opts = optsAt({ phenology: phen });
    const built = I.foundTwoLineages(N0, rng, srng, D_EXCL, opts);
    assert.ok(built, `fixture failed at seed ${seed}`);
    return { pop: built.pop, rng, srng, seed };
  };
  const run = (dpv) => {
    const { pop, rng, srng } = mk();
    const opts = optsAt({
      phenology: dpv ? { ...phen, displayProportionalVisits: true } : phen,
    });
    const res = I.step(pop, opts, rng, 0, srng, I.bloomRng(seed), null);
    return res.visitsSpent;
  };
  return { off: run(false), on: run(true) };
}

test("the ablation redistributes the visit budget without changing its size", () => {
  /*
   * ⚠️ THE WHOLE COMPARISON RESTS ON THIS. If the proportional arm spent a
   * different number of visits, "empty time is worthless" and "fewer visits"
   * would not be separable, and every ratio in the result would be
   * uninterpretable — the trap the slice-splitting note at sim/ibm.js:1334
   * already names for a different flag.
   *
   * ⚠️ THIS CAUGHT A REAL BUG ON ITS FIRST RUN. The apportionment originally
   * divided the NOMINAL `perSlice * S`, while the unablated arm skips slices
   * that carry no display and simply loses their visits. The ablated arm was
   * therefore spending the discarded visits too — a bigger budget, which is
   * precisely the confound. It now apportions `perSlice * (occupied slices)`.
   */
  for (const phen of [
    { width: WIDTH, slices: SLICES, conserveDisplay: true },
    { slices: SLICES, widthLocus: true, widthMut: 0.03, conserveDisplay: true },
    { width: 1.0, slices: SLICES, conserveDisplay: true },
  ])
    for (const seed of [1, 2, 3, 4]) {
      const { off, on } = spendOnSamePopulation(phen, seed);
      assert.ok(
        off > 0,
        `no visits were spent at all: ${JSON.stringify(phen)}`,
      );
      assert.strictEqual(
        on,
        off,
        `${JSON.stringify(phen)} seed ${seed}: on the SAME population the ` +
          `ablation spent ${on} visits against ${off} — it is changing the size ` +
          `of the budget, not just where the budget goes, and every ratio ` +
          `measured under it would be confounded with visit count`,
      );
    }
});

/* ---- 3. THE CONTROL, IN THE VARIABLE THAT GOVERNS IT: per-slice display --- */

/* Total display in each slice, from the same predicate the model uses. A
 * population whose slices all carry the SAME total gets `perSlice` back from
 * proportional apportionment, exactly, so the flag is a no-op there. */
function sliceTotals(phen, seed) {
  const rng = E.makeRng(seed);
  const srng = I.signalRng(seed);
  const opts = optsAt({ phenology: phen });
  const built = I.foundTwoLineages(N0, rng, srng, D_EXCL, opts);
  assert.ok(built, `fixture failed at seed ${seed}`);
  const res = I.step(built.pop, opts, rng, 0, srng, I.bloomRng(seed), null);
  const blooms = res.blooms || [];
  const S = phen.slices;
  const half = (phen.width === undefined ? 0.25 : phen.width) / 2;
  const totals = [];
  for (let k = 0; k < S; k++) {
    let d = 0;
    for (const b of blooms) if (I.ringDist(b, k / S) <= half) d++;
    totals.push(d);
  }
  return totals;
}

test("the ablation is a no-op exactly where every slice carries the same display, and moves where it does not", () => {
  /*
   * ⚠️⚠️ STATED IN THE VARIABLE THAT GOVERNS IT. The equivalent control for
   * `conserveDisplay` was registered as an equal-WIDTH claim and was FALSE —
   * the governing variable there was occupancy (see
   * docs/2026-08-31-evolving-width-conserved.md). Here the governing variable is
   * the per-slice display TOTAL, and both directions are asserted from it.
   */
  const CELLS = [
    [
      { width: 1.0, slices: SLICES },
      "every plant in every slice: all slices equal",
    ],
    [
      { width: 1.0, slices: SLICES, conserveDisplay: true },
      "same, with display conserved: still all slices equal",
    ],
    [
      { width: WIDTH, slices: SLICES, conserveDisplay: true },
      "narrow windows at random phases: slice totals differ",
    ],
    [
      {
        slices: SLICES,
        widthLocus: true,
        widthMut: 0.03,
        conserveDisplay: true,
      },
      "widths differ between plants: slice totals differ",
    ],
  ];

  let nNoop = 0;
  let nMoves = 0;

  for (const [phen, why] of CELLS) {
    for (const seed of [1, 2, 3]) {
      const totals = sliceTotals(phen, seed);
      const equal = totals.every((x) => x === totals[0]);
      const off = digest(I, phen, seed);
      const on = digest(I, { ...phen, displayProportionalVisits: true }, seed);
      const same =
        JSON.stringify(on.rows) === JSON.stringify(off.rows) &&
        on.tail === off.tail;
      assert.strictEqual(
        same,
        equal,
        `${JSON.stringify(phen)} seed ${seed} (${why}): slice occupancy counts ` +
          `[${totals.join(",")}] are ${equal ? "EQUAL" : "UNEQUAL"}, predicting the ` +
          `ablation is ${equal ? "a NO-OP" : "NOT a no-op"}, but the run came back ` +
          `${same ? "IDENTICAL" : "MOVED"}. ` +
          (equal
            ? `Equal totals apportion to exactly perSlice each, so a move here ` +
              `means the apportionment is not proportional to display.`
            : `Unequal totals must send different budgets to different slices; a ` +
              `run that does not move means the flag is handing every slice the ` +
              `same number anyway, which ablates nothing.`),
      );
      if (equal) nNoop++;
      else nMoves++;
    }
  }

  /* ⚠️ A NO-OP TEST NEEDS A CELL WHERE THE THING IS NOT A NO-OP, or it cannot
   * tell "correctly neutral" from "never ran". This is the lesson #50 paid for
   * and it is enforced rather than remembered. */
  assert.ok(
    nNoop >= 2 && nMoves >= 2,
    `the cell list degenerated: ${nNoop} no-op and ${nMoves} moving cells — ` +
      `both directions must be exercised or this test proves only one of them`,
  );
});

/* ------ 4. THE REGISTERED MECHANISM (P2): visits stop tracking width ------ */

/* The width-gradient configuration in miniature: focal is plant 0, blooms spread
 * evenly so occupancy is a property of width rather than of where a random draw
 * landed, residents saturated at width 1.0, display conserved. */
function focalVisits(focalWidth, S, seed, dpv) {
  const rng = E.makeRng(seed);
  const srng = I.signalRng(seed);
  const opts = optsAt({
    phenology: {
      slices: S,
      widthLocus: true,
      widthMut: 0,
      conserveDisplay: true,
      displayProportionalVisits: dpv,
    },
  });
  const built = I.foundTwoLineages(24, rng, srng, D_EXCL, opts);
  assert.ok(built, `fixture failed at seed ${seed}`);
  const pop = built.pop;
  pop.forEach((ind, i) => {
    const b = i / pop.length;
    ind.h1[I.BLOOM_GENE] = b;
    ind.h2[I.BLOOM_GENE] = b;
    const w = i === 0 ? focalWidth : 1.0;
    ind.h1[I.WIDTH_GENE] = w;
    ind.h2[I.WIDTH_GENE] = w;
  });
  const res = I.step(
    pop,
    opts,
    rng,
    0,
    srng,
    I.bloomRng(seed),
    I.widthRng(seed),
  );
  return res.visitsTo[0];
}

test("under the ablation a plant's VISITS stop depending on its flowering width", () => {
  /*
   * ⚠️ THIS IS THE REGISTERED PREDICTION P2, AS A TEST SO IT CAN FAIL.
   * Visits are blind to geitonogamy — `T[0][j]` excludes self-transfer but
   * `visitsTo` counts every landing — so this isolates the empty-time premium
   * from the concentration penalty in a way no flow number can.
   *
   * Under proportional apportionment, slice k receives `V·D_k` and the focal
   * takes share `w_fk/D_k`, so its expected visits are `V·Σ_k w_fk = V·base_f`:
   * independent of width AND of phase. Without it the narrow focal is short by
   * the empty-time premium, which against a saturated resident is `(29+S)/30`.
   *
   * ⚠️ THE TOLERANCE IS 8% AND IS NOT ZERO, because the bout is not a pure
   * proportional draw — flower constancy and the carryover cap act within a
   * bout, which is hypothesis H3 in the prereg and is not what this flag
   * touches. 8% sits well below the premium being ablated (23% at S=8) and well
   * above the residual actually observed (about 2%), so the two are separable.
   */
  const S = 8;
  const TOL = 0.08;
  for (const seed of [1, 2, 3]) {
    const onNarrow = focalVisits(0.02, S, seed, true);
    const onWide = focalVisits(1.0, S, seed, true);
    const offNarrow = focalVisits(0.02, S, seed, false);
    const offWide = focalVisits(1.0, S, seed, false);

    assert.ok(
      onNarrow > 0 && onWide > 0 && offNarrow > 0 && offWide > 0,
      `seed ${seed}: a focal received no visits at all — the harness is not ` +
        `measuring what the assertions below assume`,
    );

    const onRatio = onWide / onNarrow;
    const offRatio = offWide / offNarrow;

    /* ⚠️ THE POSITIVE CONTROL, IN THE SAME TEST. Without it, a harness that
     * always returned equal counts would pass the assertion below while
     * measuring nothing. */
    assert.ok(
      offRatio > 1 + TOL,
      `seed ${seed}: WITHOUT the ablation the wide focal should collect the ` +
        `empty-time premium and take about (29+S)/30 = ${((29 + S) / 30).toFixed(3)}x ` +
        `the narrow focal's visits, but the ratio is ${offRatio.toFixed(3)}. ` +
        `If there is no premium to remove, this whole experiment has no subject.`,
    );
    assert.ok(
      Math.abs(onRatio - 1) <= TOL,
      `seed ${seed}: WITH the ablation the focal's visits should not depend on ` +
        `its width (expected ratio 1.000), but wide/narrow is ${onRatio.toFixed(3)}. ` +
        `Apportioning the budget by display should make expected visits equal ` +
        `V·base_f regardless of how many slices that display is spread over.`,
    );
  }
});
