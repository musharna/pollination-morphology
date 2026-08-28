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

/* ------------- 2. P3: on an EQUAL-WIDTH population conservation is a no-op */

test("with every plant at the same width, turning conservation on changes nothing", () => {
  /*
   * This is the prediction that protects #37, whose arms are ALL fixed-width.
   * Conservation divides every plant's display by the same constant, and all
   * three draws in carryover.js (:295, :331, :362) are scale-invariant, so the
   * bout should be untouched.
   *
   * ⚠️ It is asserted rather than argued because `r = rng() * acc` compared
   * against `cum[i]` can flip at a boundary under rounding. If this ever fails,
   * conservation is NOT neutral on equal-width populations and every fixed-width
   * result in the project is entangled with it.
   */
  for (const width of [1.0, WIDTH, 0.5])
    for (const seed of [1, 2, 3]) {
      const off = digest(I, { width, slices: SLICES }, seed);
      const on = digest(
        I,
        { width, slices: SLICES, conserveDisplay: true },
        seed,
      );
      assert.deepStrictEqual(
        on.rows,
        off.rows,
        `width ${width} seed ${seed}: conservation moved an equal-width run — ` +
          `#37 is entangled with it and cannot be protected by the flag`,
      );
      assert.strictEqual(
        on.tail,
        off.tail,
        `width ${width} seed ${seed}: stream drift`,
      );
    }
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

/* ------------------- 4. the coverage gap must not divide by zero */

test("a plant in flower in no slice at all neither crashes nor gains a display", () => {
  /*
   * Below width = 1/S some blooms fall between every slice centre — the coverage
   * gap this roadmap records at 4% of bloom-space for WIDTH 0.12, S 8. Such a
   * plant has occ = 0, and `base[i] / occ[i]` would be Infinity, which would
   * hand the emptiest possible plant the entire slice.
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
