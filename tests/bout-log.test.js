/*
 * The visit log — the renderer's window into the bout.
 *
 * ⚠️ WHY THESE TESTS AND NOT OTHERS. The log exists so a page can draw the
 * pollination EVENT rather than its summary, and the whole value of that
 * picture is the claim "this is the model, not an animation next to it". Two
 * ways that claim can be false, and each gets a test:
 *
 *   1. THE LOG MOVES THE MODEL. If recording consumed a random number, or a
 *      branch that consumes randomness tested the log, then a logged bout would
 *      be a DIFFERENT bout from the one every published number came from. The
 *      picture would be honest about itself and wrong about the model.
 *      ⚠️ Seen to fail: adding `rng()` inside the `if (rec)` block breaks
 *      test 1 immediately (T diverges).
 *
 *   2. THE LOG IS EMPTY OR INERT. A bee drawn from a log with no transfers in
 *      it flies a real route and pollinates nothing, which looks exactly like a
 *      working renderer. Test 3 is the positive control for that.
 */

const test = require("node:test");
const assert = require("node:assert");

const fs = require("fs");
const path = require("path");

const I = require("../sim/ibm.js");
const C = require("../sim/carryover.js");
const E = require("../sim/evolve.js");

function fixture(n = 16, seed = 4) {
  const built = I.foundTwoLineages(
    n,
    E.makeRng(seed),
    I.signalRng(seed),
    8,
    I.DEFAULTS,
  );
  assert.ok(built, "fixture failed to found two lineages");
  return built.pop;
}

function bout(pop, log) {
  const sites = I.sitesOf(pop, I.DEFAULTS, 0);
  return C.runBout(sites, I.allocWeights(sites, null, pop.length), {
    visits: 4000,
    seed: 11,
    log,
  });
}

/* ------------------------------------------- 1. it cannot move the model */

test("a logged bout is bit-identical to an unlogged one", () => {
  const pop = fixture();
  const off = bout(pop, null);
  const on = bout(pop, { from: 0, count: 200 });

  /* The transfer matrix IS the model's output — parentage is drawn from it. */
  for (let i = 0; i < off.T.length; i++)
    for (let j = 0; j < off.T.length; j++)
      assert.equal(
        on.T[i][j],
        off.T[i][j],
        `T[${i}][${j}] moved when the log was switched on — the picture would ` +
          `be of a different bout than the published numbers`,
      );

  for (const k of [
    "produced",
    "landedRight",
    "landedWrong",
    "groomedOff",
    "harvested",
    "senesced",
    "retained",
  ])
    assert.equal(on[k], off[k], `${k} moved when the log was switched on`);
});

/* ------------------------------------------------ 2. it is a WINDOW */

test("the log records the window it was asked for and nothing else", () => {
  const pop = fixture();
  const r = bout(pop, { from: 50, count: 30 });
  assert.ok(r.visitLog.length > 0, "asked for 30 visits and got none");
  assert.ok(
    r.visitLog.length <= 30,
    `asked for 30 visits and got ${r.visitLog.length}`,
  );
  for (const rec of r.visitLog) {
    assert.ok(
      rec.t >= 50 && rec.t < 80,
      `visit ${rec.t} is outside the requested window`,
    );
    assert.ok(
      Number.isInteger(rec.j) && rec.j >= 0 && rec.j < pop.length,
      `visit names plant ${rec.j}, which is not in the population`,
    );
  }

  const none = bout(pop, null);
  assert.equal(none.visitLog.length, 0, "logged without being asked to");
});

/* ------------- 3. POSITIVE CONTROL: there is something to draw in there */

test("the logged window actually contains pollen moving", () => {
  const pop = fixture();
  /* Deep into the bout, so the animal is carrying pollen — at visit 0 it is
   * empty by construction and a window there would legitimately show nothing
   * being delivered. That is the point: the window has to be chosen. */
  const r = bout(pop, { from: 500, count: 400 });

  const took = r.visitLog.filter((v) => v.nTook > 0).length;
  const gave = r.visitLog.filter((v) => v.nGave > 0).length;
  assert.ok(
    took > 0,
    "no visit in the window delivered a single grain — a bee drawn from this " +
      "log would tour the patch and pollinate nothing",
  );
  assert.ok(gave > 0, "no visit in the window picked pollen up");
  assert.ok(
    r.visitLog.some((v) => v.carry > 0),
    "the animal never carries anything between flowers",
  );
});

/* --------------- 4. the coordinates are drawable and mean what they say */

test("every logged contact is a real point on the animal's body", () => {
  const pop = fixture();
  const r = bout(pop, { from: 300, count: 300 });
  let checked = 0;
  for (const rec of r.visitLog) {
    assert.ok(rec.stig, `visit ${rec.t} recorded no stigma contact`);
    for (const g of [rec.stig, ...rec.took, ...rec.gave]) {
      assert.ok(
        Number.isFinite(g.s) && g.s >= -0.5 && g.s <= 1.5,
        `body coordinate s=${g.s} is off the animal`,
      );
      assert.ok(
        Number.isFinite(g.phi) && Math.abs(g.phi) <= Math.PI + 1e-9,
        `body coordinate phi=${g.phi} is outside [-pi,pi]`,
      );
      checked++;
    }
    /* Truncation must lose DETAIL, never counts — the renderer draws a sample
     * of grains but the tallies beside it have to be the real ones. */
    assert.ok(
      rec.nTook >= rec.took.length && rec.nGave >= rec.gave.length,
      "a count came out smaller than the sample drawn from it",
    );
  }
  assert.ok(checked > 50, `only ${checked} contacts checked — window too thin`);
});

/* ------------------------ 5. the IBM hands the same log up to the caller */

test("step() surfaces the bout log without disturbing the generation", () => {
  const pop = fixture();
  const rng = E.makeRng(9);
  const srng = I.signalRng(9);
  const plain = I.step(pop, I.DEFAULTS, rng, 0, srng);

  const rng2 = E.makeRng(9);
  const srng2 = I.signalRng(9);
  const logged = I.step(
    pop,
    { ...I.DEFAULTS, logBout: { from: 100, count: 120 } },
    rng2,
    0,
    srng2,
  );

  assert.equal(plain.visitLog, null, "step logged without being asked to");
  assert.ok(
    logged.visitLog && logged.visitLog.length > 0,
    "step logged nothing when asked",
  );

  /*
   * ⚠️ THE OFFSPRING, NOT THE SUMMARY STATISTICS — and this test asserted the
   * wrong thing first, which the mutation run caught.
   *
   * The original version compared `spread`, `ancVar` and the split separation.
   * Every one of those is computed from `sites` or from the PARENT generation,
   * so none of them touches T — and a deliberate `rng()` inside the logging
   * path, which visibly corrupted the transfer matrix, left all three
   * identical. The test passed on a model the log had demonstrably moved.
   *
   * Parentage is drawn FROM T, so the offspring are the observable that can
   * actually report a disturbed bout.
   */
  assert.equal(
    logged.recruits,
    plain.recruits,
    "a different number of offspring was set under logging",
  );
  assert.deepStrictEqual(
    logged.pop,
    plain.pop,
    "the offspring generation differs under logging — the log changed who bred",
  );
});

/* ---- 6. the WINDOW THE PAGE ASKS FOR has something in it worth drawing */

/*
 * ⚠️ THE CONSTANTS COME OUT OF THE PAGE, not out of this file. The window is a
 * choice — open it at visit 0 and the animal is empty by construction, so the
 * renderer would honestly show a bee touring the patch and delivering nothing,
 * which is indistinguishable by eye from a broken replay. Hard-coding the same
 * numbers here would test this file's opinion of the page rather than the page.
 *
 * M1 moved the page's generation loop, and with it these constants, out of
 * population.html's inline script into population-run.js, which the page loads
 * by <script src>. The file the constants are read from moved; the rule that
 * they are read rather than retyped did not.
 */
test("the page's own bout window contains a real transfer", () => {
  const src = fs.readFileSync(
    path.join(__dirname, "..", "population-run.js"),
    "utf8",
  );
  const from = src.match(/BOUT_FROM\s*=\s*(\d+)/);
  const count = src.match(/BOUT_N\s*=\s*(\d+)/);
  assert.ok(from && count, "could not find the page's bout window constants");

  const pop = fixture(24, 3);
  const res = I.step(
    pop,
    { ...I.DEFAULTS, logBout: { from: +from[1], count: +count[1] } },
    E.makeRng(3),
    0,
    I.signalRng(3),
  );
  const log = res.visitLog || [];
  assert.ok(log.length > 0, `the page's window (${from[1]}) logged nothing`);
  const moved = log.filter((v) => v.nTook > 0).length;
  assert.ok(
    moved > 0,
    `the page's window contains no transfer at all — the animation would show ` +
      `a bee working ${log.length} flowers and pollinating none of them`,
  );
  assert.ok(
    log.some((v) => v.carry > 0),
    "the animal carries nothing anywhere in the page's window",
  );
});
