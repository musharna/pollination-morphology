/*
 * Flowering-window WIDTH as a heritable locus — the guards, per
 * docs/2026-08-25-evolving-width-prereg.md.
 *
 * ⚠️⚠️ THE FIRST TEST COMPARES AGAINST A DIFFERENT BUILD, ON PURPOSE. The
 * pre-registration requires that with the locus off "not a single extra draw is
 * taken from any stream", verified "by a test that runs the existing phenology
 * config with the locus off and asserts byte-identity, NOT by inspection".
 *
 * A same-build comparison cannot do that. Running today's code twice with the
 * locus off and finding it agrees with itself would pass just as happily if the
 * new code path had shifted every stream, because both sides shifted together —
 * the exact failure this project logged when its deception inertness test could
 * not see a shared-path change. So the baseline is `sim/ibm.js` extracted from
 * the commit BEFORE the locus existed, required as a second module, and run side
 * by side. That comparison can fail.
 *
 * The pin is a commit, not HEAD: HEAD moves, and a guard whose reference follows
 * the thing it guards stops being a guard.
 */

const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const I = require("../sim/ibm.js");
const E = require("../sim/evolve.js");

/* The last commit before WIDTH_GENE existed — docs(prereg), 2026-08-25. */
const PRE_LOCUS_REF = "947be96";

const SLICES = 8;
const WIDTH = 0.12;
const N0 = 14;
const GENS = 6;
const SITE_N = 60;
const D_EXCL = 8;

const optsAt = (extra = {}) => ({ ...I.DEFAULTS, siteN: SITE_N, ...extra });

const mean = (xs) =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;

/*
 * A digest of everything a phenology run observably produces, so the comparison
 * is over the whole trajectory rather than over one summary number that could
 * agree by luck.
 */
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
  /* the state of the MAIN stream after the run — the sharpest single check that
   * no extra draw was taken from it */
  return { rows, tail: rng(), pop };
}

/* Extracts sim/ibm.js as it stood before the locus and loads it as a module.
 * Lives beside the real one so its relative requires resolve to the same
 * siblings — the comparison is then about ibm.js and nothing else. */
function loadPreLocusModule() {
  const dst = path.join(
    __dirname,
    "..",
    "sim",
    `.baseline-ibm-${process.pid}.js`,
  );
  const src = execFileSync("git", ["show", `${PRE_LOCUS_REF}:sim/ibm.js`], {
    cwd: path.join(__dirname, ".."),
    maxBuffer: 32 * 1024 * 1024,
  });
  fs.writeFileSync(dst, src);
  return { mod: require(dst), cleanup: () => fs.rmSync(dst, { force: true }) };
}

/* ------------------------- 1. THE GUARD: locus off changes nothing at all */

test("with the width locus off, every phenology stream is byte-identical to the pre-locus build", () => {
  const { mod: OLD, cleanup } = loadPreLocusModule();
  try {
    assert.ok(
      OLD.WIDTH_GENE === undefined,
      "the baseline build already has the width locus — PRE_LOCUS_REF is wrong, " +
        "and this test has been comparing the new code against itself",
    );
    const cells = [
      ["wide", { width: 1.0, slices: SLICES }],
      ["narrow free", { width: WIDTH, slices: SLICES }],
      ["narrow linked", { width: WIDTH, slices: SLICES, link: true }],
      ["narrow shuffled", { width: WIDTH, slices: SLICES, shuffleBloom: true }],
    ];
    for (const [name, phen] of cells)
      for (const seed of [1, 2, 3]) {
        const a = digest(OLD, phen, seed);
        const b = digest(I, phen, seed);
        assert.deepStrictEqual(
          b.rows,
          a.rows,
          `${name} seed ${seed}: the locus-off path diverged from the pre-locus build`,
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

/*
 * ⚠️ AND THE GUARD ABOVE MUST BE SHOWN TO FAIL ON A BUILD THAT REALLY DIFFERS,
 * or it is a test whose passing carries no information. Turning the locus ON is
 * a difference the old build cannot express at all — it has no width stream — so
 * the digests must NOT match. If they do, `widthLocus` is being ignored.
 */
test("the guard fires when the locus is actually on", () => {
  const { mod: OLD, cleanup } = loadPreLocusModule();
  try {
    const phen = { width: WIDTH, slices: SLICES, widthLocus: true };
    const a = digest(OLD, phen, 1);
    const b = digest(I, phen, 1);
    assert.notDeepStrictEqual(
      b.rows,
      a.rows,
      "locus ON produced the pre-locus trajectory — widthLocus is inert",
    );
  } finally {
    cleanup();
  }
});

/* ------------------- 2. SWITCHING THE LOCUS ON DOES NOT DISTURB BLOOM */

test("the width stream is its own: founder bloom times are unchanged by the locus", () => {
  /* Bloom alleles are assigned and expressed before any width draw, so the FIRST
   * generation's flowering times must be identical with the locus on and off.
   * They diverge later, which is the locus doing its job rather than a leak. */
  const off = digest(I, { width: WIDTH, slices: SLICES }, 4, 1);
  const on = digest(
    I,
    { width: WIDTH, slices: SLICES, widthLocus: true },
    4,
    1,
  );
  const bloomsOf = (d) => d.rows[0].split("|").pop();
  assert.strictEqual(
    bloomsOf(on),
    bloomsOf(off),
    "switching the width locus on shifted the bloom stream",
  );
});

/* ------------- 3. THE CONTROLS DIFFER IN MECHANISM, NOT IN DRAW COUNT */

test("treatment, shuffled and non-heritable arms consume identical draws", () => {
  const base = { width: WIDTH, slices: SLICES, widthLocus: true };
  const arms = [
    ["treatment", base],
    ["shuffled", { ...base, shuffleWidth: true }],
    ["non-heritable", { ...base, widthNonHeritable: true }],
  ];
  const tails = arms.map(([, phen]) => digest(I, phen, 5).tail);
  for (let i = 1; i < tails.length; i++)
    assert.strictEqual(
      tails[i],
      tails[0],
      `${arms[i][0]} left the main stream in a different state than the treatment — ` +
        "the arms differ in how far they walked the random sequence, not only in mechanism",
    );
});

/* --------------------------- 4. THE WIDTH IS ACTUALLY APPLIED PER PLANT */

test("a plant's own width decides which slices it is in flower in", () => {
  const rng = E.makeRng(11);
  const srng = I.signalRng(11);
  const opts = optsAt({
    phenology: { width: WIDTH, slices: SLICES, widthLocus: true },
  });
  const built = I.foundTwoLineages(N0, rng, srng, D_EXCL, opts);
  assert.ok(built);
  const pop = built.pop;
  /* every plant blooms at the same instant; only the WIDTHS differ */
  pop.forEach((ind, i) => {
    ind.h1[I.BLOOM_GENE] = 0;
    ind.h2[I.BLOOM_GENE] = 0;
    const w = i === 0 ? 0 : 1;
    ind.h1[I.WIDTH_GENE] = w;
    ind.h2[I.WIDTH_GENE] = w;
  });
  const res = I.step(pop, opts, rng, 0, srng, I.bloomRng(11), I.widthRng(11));
  assert.ok(res.widths, "step did not report expressed widths");
  assert.strictEqual(res.widths[0], 0, "the zero-width plant was widened");
  assert.strictEqual(res.widths[1], 1, "the full-width plant was narrowed");

  /* ⚠️ THE NEGATIVE NEEDS A POSITIVE CONTROL IN THE SAME TEST. A width of 0 must
   * remove the plant from every slice — but "received nothing" also happens when
   * the harness is broken, so the full-width plants must be shown to have
   * exchanged pollen in the same run. */
  const T = res.T || null;
  if (T) {
    const inflow = (j) =>
      T.reduce((c, row, i) => c + (i === j ? 0 : row[j]), 0);
    const outflow = (i) => T[i].reduce((c, x, j) => c + (i === j ? 0 : x), 0);
    assert.strictEqual(
      inflow(0) + outflow(0),
      0,
      "a plant with width 0 is in no slice and cannot exchange pollen",
    );
    const others = pop.map((_, i) => i).slice(1);
    assert.ok(
      others.some((i) => inflow(i) + outflow(i) > 0),
      "no pollen moved between the full-width plants either — the bout is dead, " +
        "so the zero-width assertion above proves nothing",
    );
  }
});

test("with the locus off the global width still governs", () => {
  const digestOff = digest(I, { width: 1.0, slices: SLICES }, 6, 1);
  assert.ok(digestOff.rows.length, "the locus-off run produced nothing");
  const rng = E.makeRng(6);
  const srng = I.signalRng(6);
  const opts = optsAt({ phenology: { width: 1.0, slices: SLICES } });
  const built = I.foundTwoLineages(N0, rng, srng, D_EXCL, opts);
  const res = I.step(built.pop, opts, rng, 0, srng, I.bloomRng(6), null);
  assert.strictEqual(
    res.widths,
    null,
    "widths were expressed with the locus off",
  );
});

/* ------------------------------ 5. WIDTH IS A MAGNITUDE, NOT A RING */

test("width clamps rather than wraps", () => {
  /*
   * A width mutation that walked off the top must NOT reappear at the bottom:
   * that would turn the widest possible plant into the narrowest in one step.
   *
   * ⚠️ THE MUTATIONAL STEP HAS TO BE SMALL FOR THIS TO DISCRIMINATE, and the
   * first version of the test got that wrong. At a step size of 0.5 a genuine
   * clamp lands at 0.000 often enough — a draw of -1.1 from 1.0 is unremarkable
   * — so "some value ended up near zero" is true under BOTH clamping and
   * wrapping, and the assertion could not tell them apart. At 0.05 a downward
   * excursion past 1.0 is a twenty-sigma event that never happens, so starting
   * every plant AT the ceiling separates the two cleanly: under a clamp the
   * upward half of the steps pile up at exactly 1, under a wrap they land just
   * above 0. Substituting wrap01 for clamp01 in gamete() fails this.
   */
  const ind = {
    h1: { [I.WIDTH_GENE]: 1 },
    h2: { [I.WIDTH_GENE]: 1 },
  };
  const near = [];
  for (let s = 1; s <= 200; s++) {
    const wr = I.widthRng(s);
    const g = { ...E.randomGenome(E.makeRng(s)) };
    ind.h1 = { ...g, [I.WIDTH_GENE]: 1 };
    ind.h2 = { ...g, [I.WIDTH_GENE]: 1 };
    const m = I.gamete(ind, E.makeRng(s), 0.05, {
      width: true,
      wrng: wr,
      widthMut: 0.05,
    });
    near.push(m[I.WIDTH_GENE]);
  }
  assert.ok(
    near.every((x) => x >= 0 && x <= 1),
    "a width escaped [0,1]",
  );
  assert.ok(
    near.some((x) => x === 1),
    "no mutation was clamped at the ceiling — the test never exercised the bound",
  );
  assert.ok(
    !near.some((x) => x < 0.5),
    `a width mutation of 0.05 from 1.0 landed at ${Math.min(...near).toFixed(3)} — ` +
      "unreachable by a clamped gaussian step, so the locus is wrapping",
  );
});

/* --------------------- 6. THE INVARIANT: width is not a placement gene */

test("two plants differing only in window width have identical placements", () => {
  const rng = E.makeRng(9);
  const srng = I.signalRng(9);
  const opts = optsAt({
    phenology: { width: WIDTH, slices: SLICES, widthLocus: true },
  });
  const built = I.foundTwoLineages(6, rng, srng, D_EXCL, opts);
  assert.ok(built);
  const a = built.pop[0];
  const b = {
    h1: { ...a.h1, [I.WIDTH_GENE]: 0.05 },
    h2: { ...a.h2, [I.WIDTH_GENE]: 0.05 },
    anc: a.anc,
  };
  a.h1[I.WIDTH_GENE] = 0.95;
  a.h2[I.WIDTH_GENE] = 0.95;
  /*
   * ⚠️ SAME INDEX, TWO POPULATIONS. `sitesOf` seeds each plant's site sampling
   * from its POSITION IN THE ARRAY, so indices 0 and 1 draw different samples
   * whatever their genomes are. The first version of this test compared index 0
   * against index 1 and failed on that alone — it could not have distinguished
   * "width reaches the geometry" from "these are different array slots". The
   * bloom locus's test carries the same note because it made the same mistake.
   */
  assert.deepStrictEqual(
    I.shapeOf(a),
    I.shapeOf(b),
    "window width reached the shape — placement would be a width gene",
  );
  const pa = I.placementOf(I.sitesOf([a], opts, 0)[0]);
  const pb = I.placementOf(I.sitesOf([b], opts, 0)[0]);
  assert.deepStrictEqual(
    pa,
    pb,
    "window width reached the contact model — placement is never a gene",
  );
});

module.exports = { digest, mean };
