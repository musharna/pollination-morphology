/*
 * Conserved floral display — the guards, per
 * docs/2026-08-28-conserved-display-prereg.md.
 *
 * `sim/ibm.js` re-offered a plant's whole display share in every slice it was in
 * flower, so a season-long bloom MANUFACTURED S times the display of a one-slice
 * bloom. `PH.conserveDisplay` spreads a fixed share across the slices occupied
 * instead. Three things have to hold, and the first two are the ones that
 * protect every result this project has already published.
 *
 * ⚠️⚠️ ONE OF THE THREE WAS REGISTERED IN THE WRONG VARIABLE. P3 was written as
 * an equal-WIDTH claim; the quantity conservation divides by is OCCUPANCY, and
 * equal width does not imply it. Test 2 below is the corrected form and carries
 * the whole account. The prereg is left as it was written — it is a record of
 * what was predicted, not a place to put what turned out to be true.
 *
 * ⚠️ TEST 1 COMPARES AGAINST A DIFFERENT BUILD, for the reason
 * tests/evolving-width.test.js states at length: running today's code twice with
 * the flag off and finding it agrees with itself would pass just as happily if
 * the new code path had shifted every stream, because both sides shifted
 * together. The baseline is `sim/ibm.js` extracted from the commit BEFORE
 * conservation existed.
 */

const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const I = require("../sim/ibm.js");
const E = require("../sim/evolve.js");

/* The last commit before conserveDisplay existed — result(#45), 2026-08-28. */
const PRE_CONSERVE_REF = "fb53224";

const SLICES = 8;
const WIDTH = 0.12;
const N0 = 14;
const GENS = 6;
const SITE_N = 60;
const D_EXCL = 8;

const optsAt = (extra = {}) => ({ ...I.DEFAULTS, siteN: SITE_N, ...extra });

/* Same digest shape as the width-locus guard: the whole trajectory plus the
 * state of the main stream afterwards, not one summary number that could agree
 * by luck. */
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
    pop = res.pop;
  }
  return { rows, tail: rng() };
}

function loadPreConserveModule() {
  const dst = path.join(
    __dirname,
    "..",
    "sim",
    `.baseline-conserve-ibm-${process.pid}.js`,
  );
  const src = execFileSync("git", ["show", `${PRE_CONSERVE_REF}:sim/ibm.js`], {
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

/* ------------------- 1. THE GUARD: the flag off runs the old code exactly */

test("with conservation off, every phenology stream is byte-identical to the pre-conservation build", () => {
  const { mod: OLD, source, cleanup } = loadPreConserveModule();
  try {
    /* The analogue of the width guard's `OLD.WIDTH_GENE === undefined`: the flag
     * is not an export, so the probe is on the source. Without this the test
     * would compare the new build against itself the day PRE_CONSERVE_REF is
     * bumped, and pass for the wrong reason. */
    assert.ok(
      !source.includes("conserveDisplay"),
      "the baseline build already knows about conserveDisplay — PRE_CONSERVE_REF " +
        "is wrong, and this test has been comparing the new code against itself",
    );
    const cells = [
      ["wide", { width: 1.0, slices: SLICES }],
      ["narrow free", { width: WIDTH, slices: SLICES }],
      ["narrow linked", { width: WIDTH, slices: SLICES, link: true }],
      ["narrow shuffled", { width: WIDTH, slices: SLICES, shuffleBloom: true }],
      /* explicitly false, not merely absent — the two must be the same path */
      [
        "narrow, flag false",
        { width: WIDTH, slices: SLICES, conserveDisplay: false },
      ],
      /*
       * ⚠️⚠️ THIS CELL EXISTS BECAUSE A MUTANT SURVIVED WITHOUT IT. Forcing
       * conservation ON regardless of the flag left this whole test green,
       * because every cell above is EQUAL-WIDTH — and conservation is a no-op
       * on equal-width populations, which is exactly what test 2 asserts. The
       * inertness guard was covering only the regime in which the change it
       * guards is invisible. A differing-widths cell is the one that can fail.
       */
      [
        "width locus, widths differ between plants",
        { slices: SLICES, widthLocus: true, widthMut: 0.03 },
      ],
    ];
    for (const [name, phen] of cells)
      for (const seed of [1, 2, 3]) {
        const a = digest(OLD, phen, seed);
        const b = digest(I, phen, seed);
        assert.deepStrictEqual(
          b.rows,
          a.rows,
          `${name} seed ${seed}: the conservation-off path diverged from the pre-conservation build`,
        );
        assert.strictEqual(
          b.tail,
          a.tail,
          `${name} seed ${seed}: the main rng stream advanced by a different number of draws`,
        );
      }
  } finally {
    cleanup();
  }
});

/* --- 2. P3, AS CORRECTED: conservation is a no-op exactly where OCCUPANCY,
 *        not width, is constant across the plants that contribute at all. */

/*
 * ⚠️⚠️ THE REGISTERED FORM OF P3 WAS FALSE AND THIS TEST PASSED ANYWAY.
 *
 * The prereg (docs/2026-08-28-conserved-display-prereg.md) registered P3 as a
 * WIDTH claim — "on an equal-width population conservation changes nothing" —
 * and the first version of this test swept `width` over [1.0, 0.12, 0.5] with
 * `slices` held at 8. Job 3572 then ran experiments/evolving-width.js's
 * fixed-width control cells at S = 8, 16 and 32 with the flag on, and the
 * fixed-NARROW row moved at S=16 and S=32 while fixed-wide moved at no S.
 *
 * Conservation divides by `occ[i]`, the number of slice centres inside plant
 * i's window — and a window of length w on a grid of spacing 1/S catches
 * floor(w*S) or floor(w*S)+1 centres DEPENDING ON ITS PHASE. Equal width is
 * therefore a STAND-IN for equal occupancy, and the two coincide only when
 *
 *     w*S is an integer          — every plant catches exactly w*S; or
 *     the only nonzero occ is 1  — below w = 1/S. occ = 0 contributes nothing
 *                                  either way, so the divisor actually applied
 *                                  is 1 for every plant that contributes.
 *
 * The three widths in the original sweep each satisfied one of those AT S=8,
 * for three different reasons: 1.0*8 = 8, 0.5*8 = 4, and 0.12*8 = 0.96. The
 * test swept the stand-in and held fixed the one axis the invariance actually
 * depends on — the PRODUCT. It covered only the regime in which the change is
 * invisible, which is the failure this file's own test 3 was written to catch,
 * committed one commit later on the axis that was not swept.
 *
 * So the invariant is restated at the layer it lives on, and BOTH sides are
 * asserted from the same live predicate: where occupancy is constant the run
 * must be byte-identical, and where it is not the run MUST move. That second
 * half is what a width-only claim cannot express, and it is what kills a mutant
 * dividing by a constant (S, or 1) instead of by each plant's own occupancy —
 * such a mutant is scale-invariant, hence a no-op everywhere, and the old
 * assertion would have welcomed it in every cell.
 */

/* occ, from the SAME predicate the model uses (`I.ringDist`, sim/ibm.js:189),
 * swept over phase rather than sampled: occupancy is periodic in the bloom time
 * and a sweep cannot miss a phase band that three seeded draws could. */
function nonzeroOccupancies(width, slices, steps = 20000) {
  const seen = new Set();
  for (let n = 0; n < steps; n++) {
    const b = (n + 0.5) / steps;
    let occ = 0;
    for (let k = 0; k < slices; k++)
      if (I.ringDist(b, k / slices) <= width / 2) occ++;
    if (occ > 0) seen.add(occ);
  }
  return [...seen].sort((a, b) => a - b);
}

test("conservation is a no-op exactly where occupancy is constant, and moves where it is not", () => {
  /* (width, slices, why this cell is in the list) */
  const CELLS = [
    [1.0, 8, "#37's wide baseline"],
    [1.0, 16, "wide at S=16 — w*S is still an integer"],
    [1.0, 32, "wide at S=32"],
    [WIDTH, 8, "#37's narrow arm — the cell a published result rests on"],
    [WIDTH, 16, "narrow at S=16 — the cell job 3572 found moving"],
    [WIDTH, 32, "narrow at S=32 — likewise"],
    [
      0.5,
      8,
      "w*S = 4: an integer product at a width that is neither 1 nor tiny",
    ],
    [0.25, 8, "w*S = 2: the width tests/phenology.test.js:208 pins"],
  ];

  let nNoop = 0;
  let nMoves = 0;

  for (const [width, slices, why] of CELLS) {
    const occs = nonzeroOccupancies(width, slices);
    const noop = occs.length === 1;
    for (const seed of [1, 2, 3]) {
      const off = digest(I, { width, slices }, seed);
      const on = digest(I, { width, slices, conserveDisplay: true }, seed);
      const same =
        JSON.stringify(on.rows) === JSON.stringify(off.rows) &&
        on.tail === off.tail;
      assert.strictEqual(
        same,
        noop,
        `w=${width} S=${slices} seed ${seed} (${why}): nonzero occupancies ` +
          `{${occs.join(",")}} predict conservation is ${noop ? "a NO-OP" : "NOT a no-op"}, ` +
          `but the run came back ${same ? "IDENTICAL" : "MOVED"}. ` +
          (noop
            ? `A constant divisor cancels under the scale-invariant draws in ` +
              `carryover.js (:295, :331, :362), so a move here means either the ` +
              `divisor is not what occ says it is, or one of those draws has ` +
              `stopped being scale-invariant — and #37's protection rests on ` +
              `exactly this kind of cell.`
            : `A divisor that DIFFERS between plants cannot cancel, so a run ` +
              `that does not move means conservation is dividing by something ` +
              `constant (S, or 1) rather than by each plant's own occupancy — ` +
              `which is a no-op everywhere and leaves the duplication in place.`),
      );
    }
    if (noop) nNoop++;
    else nMoves++;
  }

  /*
   * ⚠️ A NEGATIVE RESULT NEEDS A POSITIVE CONTROL AND THE REVERSE. If every cell
   * landed on one side of the predicate, the loop above would assert only one
   * direction and would pass on a harness that always reported that direction.
   */
  assert.ok(
    nNoop >= 2 && nMoves >= 2,
    `the cell list degenerated: ${nNoop} no-op and ${nMoves} moving cells — ` +
      `both directions must be exercised or this test proves only one of them`,
  );
});

/* ---- 2b. exactly how far the correction reaches, checked not asserted ---- */

test("#37's own parameters sit in the no-op regime, read from its source", () => {
  /*
   * The narrow scope. #37 (experiments/phenology.js) runs at slices = 8 with
   * widths 1.0 and 0.12, and every other fixed-width call site in the project —
   * tests/phenology.test.js, tests/evolving-width.test.js — is also at
   * slices = 8. So no published result moves under conservation: the
   * entanglement reaches exactly the two fixed-narrow control cells that
   * experiments/evolving-width.js runs at S = 16 and S = 32, which carry no
   * result of their own.
   *
   * ⚠️ But #37 is protected by its PARAMETERS, not by the principle that was
   * registered, and that difference bites the moment someone raises S. Hence a
   * test that reads #37's OWN constants instead of a comment repeating them: if
   * that file's SLICES or WIDTH is edited into the moving regime, this fails
   * there and then, rather than silently invalidating the phenology result.
   *
   * ⚠️ The source is READ, not required — requiring it would run the whole
   * experiment as a side effect of the test suite.
   */
  const src = fs.readFileSync(
    path.join(__dirname, "..", "experiments", "phenology.js"),
    "utf8",
  );
  const num = (name) => {
    const m = src.match(new RegExp(`^const ${name} = ([0-9.]+);`, "m"));
    assert.ok(m, `experiments/phenology.js no longer declares ${name}`);
    return Number(m[1]);
  };
  const S = num("SLICES");
  for (const width of [1.0, num("WIDTH")])
    assert.strictEqual(
      nonzeroOccupancies(width, S).length,
      1,
      `#37 runs width ${width} at ${S} slices and that is no longer a single ` +
        `occupancy — the phenology result is now entangled with conservation`,
    );
});

/* --------------- 3. SEMANTICS: the duplication is actually gone */

/*
 * One generation with plant 0's width set to `focal` and everyone else at 1.0,
 * blooms spread evenly so occupancy is a property of WIDTH and not of where the
 * random draws fell. Returns plant 0's outcrossed flow, which is what selection
 * on the locus sees. Same construction as tools/width-gradient.js, smaller.
 */
function focalFlow(focal, S, seed, conserve) {
  const N = 20;
  const rng = E.makeRng(seed);
  const srng = I.signalRng(seed);
  const opts = optsAt({
    phenology: {
      slices: S,
      widthLocus: true,
      widthMut: 0,
      conserveDisplay: conserve,
    },
  });
  const built = I.foundTwoLineages(N, rng, srng, D_EXCL, opts);
  if (!built) return null;
  const pop = built.pop;
  pop.forEach((ind, i) => {
    const b = i / pop.length;
    ind.h1[I.BLOOM_GENE] = b;
    ind.h2[I.BLOOM_GENE] = b;
    const w = i === 0 ? focal : 1.0;
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
  if (!res.T) return null;
  let flow = 0;
  for (let j = 1; j < res.T.length; j++) flow += res.T[0][j] + res.T[j][0];
  return flow;
}

function ratio(conserve, S = SLICES) {
  let wide = 0,
    narrow = 0,
    n = 0;
  for (let seed = 1; seed <= 6; seed++) {
    const w = focalFlow(1.0, S, seed, conserve);
    const x = focalFlow(0.02, S, seed, conserve);
    if (w === null || x === null || !(x > 0)) continue;
    wide += w;
    narrow += x;
    n++;
  }
  assert.ok(
    n >= 4,
    `only ${n} usable seeds — the fixture, not the model, decided this`,
  );
  return wide / narrow;
}

test("unconserved, a season-long bloom out-flows a one-slice bloom by about the slice count", () => {
  /* The POSITIVE CONTROL for the test below: it establishes that this harness
   * can see the duplication at all. Without it, "conserved ratio is small" would
   * pass just as well on a harness that reports small numbers for every input. */
  const r = ratio(false);
  assert.ok(
    r > 5,
    `expected the unconserved gradient to be near S=${SLICES}, got ${r.toFixed(3)} — ` +
      `the harness cannot see the duplication, so the conserved result below is uninterpretable`,
  );
});

test("conserving the display removes most of the width gradient", () => {
  const off = ratio(false);
  const on = ratio(true);
  assert.ok(
    on < 3,
    `conserved wide/narrow ratio ${on.toFixed(3)} is still large — the display is ` +
      `not being spread across the slices it occupies`,
  );
  assert.ok(
    on < off / 2,
    `conservation cut the gradient from ${off.toFixed(3)} only to ${on.toFixed(3)}`,
  );
});

/* ------------------- 4. the coverage gap stays inert */

test("a plant in flower in no slice at all neither crashes nor gains a display", () => {
  /*
   * Below width = 1/S some blooms fall between every slice centre — the coverage
   * gap this roadmap records at 4% of bloom-space for WIDTH 0.12, S 8.
   *
   * ⚠️ WHAT THIS DOES *NOT* COVER, established by a surviving mutant rather than
   * by reading: deleting the `|| 1` zero-guard changes nothing here. `occ[i]`
   * is 0 exactly when the plant is in flower in no slice, and in that case the
   * in-flower predicate is false at every slice, so `b / occ[i]` is never
   * evaluated. The guard is UNREACHABLE while the occupancy count and the
   * display map share one predicate — which is why `sim/ibm.js` now single-
   * sources `inFlower` instead of writing the expression twice.
   *
   * So this asserts the OBSERVABLE claim — such a plant moves no pollen and the
   * run stays finite — and does not pretend to exercise the guard.
   */
  const S = 8;
  const N = 12;
  const seed = 1;
  const rng = E.makeRng(seed);
  const srng = I.signalRng(seed);
  const opts = optsAt({
    phenology: {
      slices: S,
      widthLocus: true,
      widthMut: 0,
      conserveDisplay: true,
    },
  });
  const built = I.foundTwoLineages(N, rng, srng, D_EXCL, opts);
  assert.ok(built, "fixture failed");
  const pop = built.pop;
  /* plant 0 sits exactly between two slice centres with a window far too narrow
   * to reach either; everyone else blooms on a centre and is in flower */
  pop.forEach((ind, i) => {
    const b = i === 0 ? 0.5 / S : (i % S) / S;
    ind.h1[I.BLOOM_GENE] = b;
    ind.h2[I.BLOOM_GENE] = b;
    const w = i === 0 ? 1e-6 : 1.0;
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
  assert.ok(res.T, "step produced no transfer matrix");
  let flow = 0;
  for (let j = 0; j < res.T.length; j++) flow += res.T[0][j] + res.T[j][0];
  assert.ok(
    Number.isFinite(flow),
    `a zero-occupancy plant produced non-finite flow (${flow}) — occ=0 is dividing by zero`,
  );
  assert.strictEqual(
    flow,
    0,
    `a plant in flower in no slice moved ${flow} grains — it is being given a display`,
  );
});

/* ------------------- 5. the in-flower boundary, pinned exactly */

test("a plant whose window reaches a slice centre EXACTLY is in flower there", () => {
  /*
   * ⚠️⚠️ THIS TEST EXISTS BECAUSE A MUTANT SURVIVED. Changing the shared
   * predicate from `<=` to `<` broke nothing in this file, because every other
   * test draws blooms at random and an exact boundary hit is measure-zero.
   * The boundary is nonetheless LOAD-BEARING for the published gradient: at
   * bloom 0, width 0.25 and S=8 the window reaches the neighbouring slice
   * centre exactly, and that is what makes occupancy 3 rather than 1.
   *
   * Same repair the project already made for `fateOf`: build the boundary out of
   * DYADIC RATIONALS so it lands ON the threshold instead of near it. 0.25,
   * 0.125 and 1/8 are all exact in binary, so `ringDist(0, 0.125) === 0.125 ===
   * halfOf(0)` holds with no rounding slack.
   *
   * ⚠️ BOTH SIDES ARE ASSERTED. On its own, "the boundary plant has flow" would
   * pass on a harness that reports flow for any input; the width-0.24 arm — just
   * inside, so the window does NOT reach the centre — must report exactly zero.
   * The pair pins `<=` and nothing weaker.
   */
  const S = 8;
  const N = 10;
  const seed = 3;

  function focalFlowAtWidth(width) {
    const rng = E.makeRng(seed);
    const srng = I.signalRng(seed);
    const opts = optsAt({
      phenology: { slices: S, widthLocus: true, widthMut: 0 },
    });
    const built = I.foundTwoLineages(N, rng, srng, D_EXCL, opts);
    assert.ok(built, "fixture failed");
    const pop = built.pop;
    /* the focal blooms on slice centre 0; everyone else blooms on slice centre 1
     * with a window far too narrow to reach anywhere else, so the ONLY way the
     * focal can outcross is by reaching slice 1 — which is exactly the boundary
     * question. */
    pop.forEach((ind, i) => {
      const b = i === 0 ? 0 : 1 / S;
      ind.h1[I.BLOOM_GENE] = b;
      ind.h2[I.BLOOM_GENE] = b;
      const w = i === 0 ? width : Math.pow(2, -20);
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
    assert.ok(res.T, "step produced no transfer matrix");
    let flow = 0;
    for (let j = 1; j < res.T.length; j++) flow += res.T[0][j] + res.T[j][0];
    return flow;
  }

  /* half = 0.125, and ringDist(0, 1/8) = 0.125 — equal, to the bit */
  assert.ok(
    focalFlowAtWidth(0.25) > 0,
    "a window reaching the next slice centre EXACTLY left the plant out of that " +
      "slice — the in-flower predicate has lost its boundary (`<=` became `<`)",
  );
  /* half = 0.12 < 0.125, so the window falls short and the focal is alone */
  assert.strictEqual(
    focalFlowAtWidth(0.24),
    0,
    "a window that does NOT reach the next slice centre still let the plant " +
      "outcross — this harness reports flow regardless of the predicate, so the " +
      "boundary assertion above proves nothing",
  );
});
