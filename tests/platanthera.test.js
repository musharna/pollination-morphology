/*
 * Tests for the Platanthera empirical leg.
 *
 * The experiment does something no other experiment in this project does: it
 * runs the continuous overlap estimator on a RAW MILLIMETRE AXIS rather than on
 * the model's own body coordinate. That is only legitimate because the
 * estimator is scale-free, and it stops being legitimate below the bandwidth
 * floor. Both halves of that are pinned here -- the invariance AND the point
 * where it fails -- because a saturating estimator does not fail loudly, it
 * fails by reporting that everything overlaps.
 */

const test = require("node:test");
const assert = require("node:assert");
const P = require("../sim/placement.js");
const K = require("../sim/packing.js");
const T = require("../experiments/platanthera.js");

const N = 96;

/* ------------------------------------------------ the load-bearing property */

test("overlap on a millimetre axis is invariant to the unit", () => {
  const a = T.draw(1.0, 0.25, N, P.makeRng(11)).xs;
  const b = T.draw(1.6, 0.3, N, P.makeRng(12)).xs;
  const ref = K.kdeOverlap(T.sigOf(a), T.sigOf(b));
  assert.ok(ref > 0.05 && ref < 0.95, `need a discriminating case, got ${ref}`);
  for (const k of [1e-3, 1e3, 1e6]) {
    const scaled = K.kdeOverlap(
      T.sigOf(a.map((x) => x * k)),
      T.sigOf(b.map((x) => x * k)),
    );
    assert.ok(
      Math.abs(scaled - ref) < 1e-9,
      `scale ${k} moved the overlap ${ref} -> ${scaled}`,
    );
  }
});

/*
 * ...and the limit is real. If someone raises or removes the 1e-4 bandwidth
 * floor in packing.js this test fails, which is the point: it is the only
 * record that the floor exists and which way it lies.
 */
test("below the bandwidth floor the estimator saturates TOWARD one", () => {
  const a = T.draw(1.0, 0.25, N, P.makeRng(11)).xs;
  const b = T.draw(1.6, 0.3, N, P.makeRng(12)).xs;
  const ref = K.kdeOverlap(T.sigOf(a), T.sigOf(b));
  const tiny = K.kdeOverlap(
    T.sigOf(a.map((x) => x * 1e-8)),
    T.sigOf(b.map((x) => x * 1e-8)),
  );
  assert.ok(
    tiny > ref,
    `saturation must INFLATE overlap (the dangerous direction): ${ref} -> ${tiny}`,
  );
  assert.ok(tiny > 0.9, `expected near-total false overlap, got ${tiny}`);
});

/* The real data must sit clear of that floor, or every number is suspect. */
test("every measured trait sits far above the saturating scale", () => {
  const sds = T.SITES.flatMap((s) =>
    T.TRAITS.flatMap((t) => T.MORPHS.map((m) => s.traits[t][m][1])),
  );
  const smallest = Math.min(...sds);
  assert.ok(smallest > 1e-3, `smallest SD ${smallest} mm is near the floor`);
  /* and it must behave: a real trait's overlap survives rescaling */
  const t = T.SITES[1].traits["caudicle length"]; // holds the 0.07 mm SD
  const a = T.draw(...t.chlorantha, N, P.makeRng(3)).xs;
  const b = T.draw(...t.intermediate, N, P.makeRng(4)).xs;
  const ref = K.kdeOverlap(T.sigOf(a), T.sigOf(b));
  const up = K.kdeOverlap(
    T.sigOf(a.map((x) => x * 1e4)),
    T.sigOf(b.map((x) => x * 1e4)),
  );
  assert.ok(
    Math.abs(up - ref) < 1e-9,
    `tightest real trait drifted ${ref} -> ${up}`,
  );
});

/* ----------------------------------------------------- the metric behaves */

test("identical distributions overlap, twenty SDs apart do not", () => {
  const rng = P.makeRng(99);
  const same = K.kdeOverlap(
    T.sigOf(T.draw(1.0, 0.25, N, rng).xs),
    T.sigOf(T.draw(1.0, 0.25, N, rng).xs),
  );
  const far = K.kdeOverlap(
    T.sigOf(T.draw(1.0, 0.25, N, rng).xs),
    T.sigOf(T.draw(6.0, 0.25, N, rng).xs),
  );
  assert.ok(same > 0.75, `same distribution read as ${same}`);
  assert.ok(far < 0.02, `six SDs apart read as ${far}`);
});

/* -------------------------------------------------------------- the sampler */

test("truncated draws recover the mean and SD they were given", () => {
  const { xs, rejected } = T.draw(1.48, 0.45, 20000, P.makeRng(7));
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  const s = Math.sqrt(
    xs.reduce((a, x) => a + (x - m) * (x - m), 0) / (xs.length - 1),
  );
  assert.ok(Math.abs(m - 1.48) < 0.02, `mean ${m}`);
  assert.ok(Math.abs(s - 0.45) < 0.02, `sd ${s}`);
  assert.ok(rejected < xs.length * 0.01, `too many rejects: ${rejected}`);
});

test("a length is never drawn negative", () => {
  /* 0.64 +/- 0.25 is the tightest-to-zero real case, Bois Niau bifolia. */
  const { xs } = T.draw(0.64, 0.25, 20000, P.makeRng(8));
  assert.ok(Math.min(...xs) > 0, "a negative millimetre length was returned");
});

/* ------------------------------------------------------ the crossing solver */

/* Known answer: equal SDs put the crossing exactly at the midpoint. */
test("equal-SD distributions cross at the midpoint", () => {
  const x = T.crossing(1.0, 0.3, 3.0, 0.3);
  assert.ok(Math.abs(x - 2.0) < 1e-3, `expected 2.0, got ${x}`);
});

/* Asymmetric case: the crossing sits nearer the TIGHTER distribution, because
 * its density falls away faster. Gets the direction of Part C's prediction. */
test("the crossing shifts toward the tighter distribution", () => {
  const x = T.crossing(1.0, 0.1, 3.0, 0.8);
  assert.ok(x > 1.0 && x < 3.0, `outside the means: ${x}`);
  assert.ok(x < 2.0, `expected a shift toward the tight side, got ${x}`);
});

/* --------------------------------------------- the declaration stays honest */

/*
 * The whole test rests on the trait split having been declared in advance. If a
 * later edit quietly moves a size trait into the placement list, the result
 * becomes unfalsifiable -- so the split is pinned to the four names.
 */
test("the placement/size split is the one that was pre-declared", () => {
  assert.deepStrictEqual(T.PLACEMENT_TRAITS, [
    "viscidia distance",
    "caudicle length",
  ]);
  assert.deepStrictEqual(T.TRAITS, [
    "viscidia distance",
    "caudicle length",
    "spur length",
    "labellum length",
  ]);
  for (const t of T.PLACEMENT_TRAITS) assert.ok(T.TRAITS.includes(t));
  assert.strictEqual(
    T.TRAITS.filter((t) => !T.PLACEMENT_TRAITS.includes(t)).length,
    2,
    "the control arm must keep two traits",
  );
});

test("published morphometrics are present and physical for every cell", () => {
  assert.strictEqual(T.SITES.length, 2, "both sympatric sites must be present");
  for (const site of T.SITES) {
    assert.ok(site.admixedPct > 0, `${site.name} needs its admixture figure`);
    for (const t of T.TRAITS)
      for (const m of T.MORPHS) {
        const cell = site.traits[t][m];
        assert.ok(
          Array.isArray(cell) && cell.length === 2,
          `${site.name} ${t} ${m}`,
        );
        assert.ok(cell[0] > 0, `${site.name} ${t} ${m} mean must be positive`);
        assert.ok(cell[1] > 0, `${site.name} ${t} ${m} SD must be positive`);
      }
    /* the ordering the two papers report: bifolia < intermediate < chlorantha */
    const v = site.traits["viscidia distance"];
    assert.ok(
      v.bifolia[0] < v.intermediate[0] && v.intermediate[0] < v.chlorantha[0],
      `${site.name} viscidia ordering is not bifolia < intermediate < chlorantha`,
    );
  }
});

/* ------------------------------------------------------------- the result */

/*
 * The finding itself, pinned so a refactor cannot silently reverse it: the
 * placement traits separate the two SPECIES and the size traits do not. Run at
 * both sites, since a single site would be a single draw.
 */
test("placement traits separate the species; size traits do not", () => {
  for (const site of T.SITES) {
    for (const name of T.TRAITS) {
      const o = T.overlapsFor(site.traits[name], 1000 + name.length * 31);
      const isPlacement = T.PLACEMENT_TRAITS.includes(name);
      if (isPlacement)
        assert.ok(
          o.bifChl[0] < T.SEPARABLE,
          `${site.name} ${name}: placement trait must separate the species, got ${o.bifChl[0]}`,
        );
      else
        assert.ok(
          o.bifChl[0] > T.SEPARABLE,
          `${site.name} ${name}: size trait must NOT separate the species, got ${o.bifChl[0]}`,
        );
    }
  }
});
