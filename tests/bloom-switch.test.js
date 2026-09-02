/*
 * tests/bloom-switch.test.js — guards for #54's instrument.
 *
 * #54 switches the per-slice rarity premium OFF partway through a run, by
 * mutating `phenology.displayProportionalVisits` between calls to `step`. That
 * is the entire instrument, and it rests on two properties that nothing else in
 * the suite covers:
 *
 *   1. `step` reads the flag FRESH on every call. If the phenology object were
 *      read once at construction, or the allocation cached, every switch arm
 *      would silently be arm A and the whole experiment would be one arm run
 *      seven times — with a plausible monotone sweep as output.
 *   2. A degenerate switch time collapses onto the plain arm. k=0 must BE arm B
 *      and k=GENS must BE arm A, because #54's two positive controls are read
 *      off exactly those and they are worth nothing if the switch code path is
 *      not the same path.
 *
 * ⚠️ THE FLAG'S SENSE IS INVERTED RELATIVE TO ITS NAME, so it is asserted here
 * rather than trusted: `displayProportionalVisits` FALSE is the flat per-slice
 * budget, which IS the premium; TRUE apportions by display and removes it.
 */
const test = require("node:test");
const assert = require("node:assert");
const I = require("../sim/ibm.js");
const E = require("../sim/evolve.js");

const N0 = 24;
const SITE_N = 120;
const D_EXCL = 8;
const S = 8;
const W = 0.12;

/* mirrors experiments/bloom-switch.js `replicate`: one phenology object, mutated
 * between steps, premium ON while g < switchAt */
function run(seed, switchAt, gens) {
  const rng = E.makeRng(seed);
  const srng = I.signalRng(seed);
  const brng = I.bloomRng(seed);
  const phen = { slices: S, width: W };
  const opts = { ...I.DEFAULTS, siteN: SITE_N, phenology: phen };
  const built = I.foundTwoLineages(N0, rng, srng, D_EXCL, opts);
  if (!built) return null;
  let pop = built.pop;
  const trace = [];
  for (let g = 0; g < gens; g++) {
    if (pop.length < 2) break;
    phen.displayProportionalVisits = g >= switchAt;
    const res = I.step(pop, opts, rng, g, srng, brng);
    trace.push(
      `${res.bloomAssort}|${res.bloomLineage}|${res.coflower}|${res.visitsSpent}|${I.ancestryVar(res.pop)}|${res.pop.length}`,
    );
    pop = res.pop;
  }
  return trace;
}

function step0(seed, extra = {}) {
  const rng = E.makeRng(seed);
  const srng = I.signalRng(seed);
  const brng = I.bloomRng(seed);
  const opts = {
    ...I.DEFAULTS,
    siteN: SITE_N,
    phenology: { slices: S, width: W, ...extra },
  };
  const built = I.foundTwoLineages(N0, rng, srng, D_EXCL, opts);
  if (!built) return null;
  return I.step(built.pop, opts, rng, 0, srng, brng);
}

test("the flag is read at step time, not captured at construction", () => {
  /*
   * ⚠️⚠️ THE LOAD-BEARING PROPERTY FOR THE WHOLE OF #54. The switch is delivered
   * by MUTATING an object that was handed to `step` on a previous call. If
   * `step` closed over the flag's value instead of re-reading it, every arm
   * would be arm A and the sweep would still print a monotone-looking table.
   *
   * The same phenology OBJECT is reused across both calls here — not a rebuilt
   * one — because that is exactly what the experiment does, and a test that
   * built a fresh object each time would pass on a `step` that caches.
   */
  let differed = 0;
  for (const seed of [1, 2, 3, 4, 5]) {
    const rng = E.makeRng(seed);
    const srng = I.signalRng(seed);
    const brng = I.bloomRng(seed);
    const phen = { slices: S, width: W };
    const opts = { ...I.DEFAULTS, siteN: SITE_N, phenology: phen };
    const built = I.foundTwoLineages(N0, rng, srng, D_EXCL, opts);
    if (!built) continue;

    phen.displayProportionalVisits = false;
    const flat = I.step(built.pop, opts, E.makeRng(seed), 0, srng, brng);
    /* the SAME object, mutated — and the same population and streams, so the
     * allocation rule is the only thing that changed */
    phen.displayProportionalVisits = true;
    const prop = I.step(
      built.pop,
      opts,
      E.makeRng(seed),
      0,
      I.signalRng(seed),
      I.bloomRng(seed),
    );

    assert.ok(flat.visitsPerSlice, "flat arm should report a per-slice split");
    assert.ok(prop.visitsPerSlice, "proportional arm should report one");
    const a = Array.from(flat.visitsPerSlice);
    const b = Array.from(prop.visitsPerSlice);
    if (a.join(",") !== b.join(",")) differed++;
  }
  assert.ok(
    differed >= 3,
    `mutating the flag on a reused phenology object must change the visit ` +
      `allocation; it changed in only ${differed} of 5 seeds`,
  );
});

test("FALSE is the flat budget — the premium — and TRUE apportions by display", () => {
  /*
   * The flag's name says what TRUE does; the experiment's whole reading depends
   * on FALSE being the premium. Asserted directly rather than inferred from the
   * name, because #52's result inverts if this is backwards.
   */
  let checked = 0;
  for (const seed of [1, 2, 3, 4, 5]) {
    const flat = step0(seed, { displayProportionalVisits: false });
    const prop = step0(seed, { displayProportionalVisits: true });
    if (!flat || !prop) continue;
    const a = Array.from(flat.visitsPerSlice).filter((x) => x > 0);
    if (a.length < 2) continue;
    checked++;
    /* flat: every occupied slice receives the SAME budget regardless of how
     * much display it carries. That constancy IS the premium. */
    assert.strictEqual(
      new Set(a).size,
      1,
      `seed ${seed}: with the flag false every occupied slice must receive the ` +
        `same number of visits, got ${a.join(",")}`,
    );
  }
  assert.ok(checked >= 3, `only ${checked} seeds were usable`);
});

test("a degenerate switch time IS the plain arm", () => {
  /*
   * #54's two positive controls are k=0 reproducing #52 and k=GENS reproducing
   * #37. They are worth nothing unless the switch code path with a degenerate k
   * is byte-identical to never switching at all — otherwise the controls would
   * be validating a different implementation from the one the sweep uses.
   */
  const G = 6;
  for (const seed of [1, 2, 3]) {
    const alwaysOn = run(seed, G + 100, G); /* switch never fires */
    const k0 = run(seed, 0, G); /* switched before generation 0 */
    const kAll = run(seed, G, G); /* switch fires only past the end */
    assert.ok(alwaysOn && k0 && kAll, "populations should build");
    assert.deepStrictEqual(
      kAll,
      alwaysOn,
      `seed ${seed}: k=GENS must be the premium-always-on arm exactly`,
    );
    assert.notDeepStrictEqual(
      k0,
      alwaysOn,
      `seed ${seed}: k=0 must NOT equal the premium-always-on arm, or the flag ` +
        `is doing nothing`,
    );
  }
});

test("a switch arm is identical to arm A before the switch and diverges after", () => {
  /*
   * This is control C5 as a unit test. The experiment checks it across every
   * seed and every k at run time and refuses to report a verdict if it fails;
   * having it here as well means a regression is caught without paying for a
   * five-hour run.
   *
   * ⚠️ AND THE DIVERGENCE HALF IS THE HALF THAT MATTERS. Asserting only that
   * the prefix matches would pass on a switch that never fires — the exact bug
   * that would turn all seven arms into arm A.
   */
  const G = 8;
  const K = 4;
  let diverged = 0,
    seeds = 0;
  for (const seed of [1, 2, 3, 4, 5]) {
    const A = run(seed, G + 100, G);
    const sw = run(seed, K, G);
    if (!A || !sw || A.length < G || sw.length < G) continue;
    seeds++;
    for (let g = 0; g < K; g++) {
      assert.strictEqual(
        sw[g],
        A[g],
        `seed ${seed} gen ${g}: before the switch the arm must be identical to A`,
      );
    }
    if (sw.slice(K).join("\n") !== A.slice(K).join("\n")) diverged++;
  }
  assert.ok(seeds >= 3, `only ${seeds} seeds were usable`);
  assert.ok(
    diverged >= 3,
    `the arms must diverge AFTER the switch; they diverged in only ` +
      `${diverged} of ${seeds} seeds`,
  );
});
