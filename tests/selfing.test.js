/*
 * Tests for reproductive assurance (`selfing`).
 *
 * ⚠️ THE FIRST IMPLEMENTATION OF THIS OPTION WAS COMPLETELY INERT, and these
 * tests exist mostly because of it. Selfing was hooked to the "she was chosen as
 * a mother but nobody delivered pollen to her" branch, which reads like the
 * definition of mate limitation and is in fact UNREACHABLE: mothers are drawn in
 * proportion to `received`, so being picked at all proves a sire exists. The
 * knob would have been settable, documented, and would have changed nothing —
 * and every arm of the experiment would have been the same arm.
 *
 * So test 1 is not "does the option exist", it is `unmated === 0` on the default
 * path: the standing proof that the branch the first version hooked never fires.
 * Test 2 is the one that would have failed against that version.
 */

const test = require("node:test");
const assert = require("node:assert");
const I = require("../sim/ibm.js");
const E = require("../sim/evolve.js");

const RUN = { n: 24, generations: 6, seed: 7, siteN: 60, visits: 2000 };
const runWith = (extra = {}) => I.run({ ...RUN, ...extra });
const fingerprint = (out) =>
  out.history.map((r) => [r.spread, r.separation, r.ancVar, r.unmated]);

/* -------------------------------------------------- the unreachable branch */

test("mate limitation is never being CHOSEN, so the sire branch cannot fire", () => {
  /* The premise the whole option is built on. If this ever starts failing,
   * `unmated` has become reachable and the note in step() is stale. */
  for (const visits of [200, 2000, 20000]) {
    const h = runWith({ visits }).history;
    assert.ok(
      h.every((r) => r.unmated === 0),
      `unmated fired at visits=${visits}: ${h.map((r) => r.unmated)}`,
    );
  }
});

/* ------------------------------------------------------------- inertness */

test("the option off leaves the random stream untouched", () => {
  const off = fingerprint(runWith());
  /* rate 0 must short-circuit BEFORE any rng draw, not draw-and-discard */
  const zero = fingerprint(runWith({ selfing: { rate: 0 } }));
  assert.deepStrictEqual(zero, off, "rate 0 perturbed the random stream");
});

/* ----------------------------------------------------------------- it bites */

test("selfing changes the run, and the inert version would have failed here", () => {
  const off = fingerprint(runWith());
  const on = fingerprint(runWith({ selfing: { rate: 0.5 } }));
  assert.notDeepStrictEqual(
    on,
    off,
    "selfing at rate 0.5 changed nothing — the option is inert",
  );
});

/* ------------------------------------------------------- the cost can bite */

test("inbreeding depression kills selfed seed, and the free arm still fills", () => {
  /* A negative needs a positive control in the same test: cost 1 must starve
   * the run, and cost 0 must NOT, or a broken harness reads as "cost works". */
  const free = runWith({ selfing: { rate: 4, cost: 0 } });
  const dear = runWith({ selfing: { rate: 4, cost: 1 } });

  const freeFail = free.history.reduce((a, r) => a + r.unmated, 0);
  const dearFail = dear.history.reduce((a, r) => a + r.unmated, 0);

  assert.ok(
    dearFail > freeFail,
    `cost=1 did not cost anything (${dearFail} vs ${freeFail} failures)`,
  );
  assert.equal(freeFail, 0, "cost=0 starved the run — the harness is broken");
});

/* ------------------------------------------- the tracer artefact is REAL */

test("selfing inflates ancVar mechanically, and ancNull measures how much", () => {
  /* This is the trap the pre-registration names: a selfed offspring inherits
   * `anc` unaveraged while an outcrossed one takes the parental mean, so HELD
   * rises for arithmetic reasons. Both arms have IDENTICAL selfing genetics and
   * differ only in whether the tracer is averaged — so any gap is the artefact,
   * and it must be non-zero or the control is not measuring anything. */
  /* ⚠️ run() has NO `lineages` option — two lineages come from
   * foundTwoLineages and are handed in as `found`. Passing {lineages: 2} would
   * be silently ignored, both arms would be ONE lineage with anc all 0, and the
   * test would compare 0 against 0 while looking like it exercised the tracer. */
  const built = I.foundTwoLineages(
    RUN.n,
    E.makeRng(RUN.seed),
    I.signalRng(RUN.seed),
    6,
    I.DEFAULTS,
  );
  assert.ok(
    built,
    "could not found two lineages — the fixture failed, not the code",
  );
  assert.ok(
    I.ancestryVar(built.pop) > 0,
    "founded population has no ancestry variance to inflate",
  );

  const real = runWith({ found: built.pop, selfing: { rate: 4 } });
  const nulled = runWith({
    found: built.pop,
    selfing: { rate: 4, ancNull: true },
  });

  const last = (o) => o.history[o.history.length - 1].ancVar;
  assert.notEqual(
    last(real),
    last(nulled),
    "ancNull changed nothing — the mechanical-null control is inert",
  );
});

/* --------------------------------------------------- the triviality control */

test("the full-selfing control severs mating from pollination entirely", () => {
  /* `always` must not depend on the transfer matrix at all. Two very different
   * visit budgets change who gets pollinated; under `always` that must not
   * change the outcome, because nobody is using pollen to reproduce. */
  const a = fingerprint(runWith({ visits: 200, selfing: { always: true } }));
  const b = fingerprint(runWith({ visits: 20000, selfing: { always: true } }));
  assert.deepStrictEqual(
    a.map((r) => r[2]),
    b.map((r) => r[2]),
    "full selfing still depended on the visit budget",
  );
});

/* ------------------------------------------------ the floor is not the trick */

test("the floor alone rescues nobody — it needs the selfing to do anything", () => {
  /* floorOnly flattens maternal weights exactly as the real arm does but still
   * demands an outcross sire, separating "the floor changed who reproduces"
   * from "selfed offspring exist".
   *
   * ⚠️ It is also the only setting under which the unreachable branch above can
   * fire — but ONLY under severe pollen limitation, because the floor can just
   * pick a mother nobody visited and a plant with zero receipt only exists when
   * visits are scarce. Measured for n=24: fires at 20-60 visits, never at 400+.
   * The first version of this test used the module's default budget and failed
   * for exactly that reason.
   *
   * The high-visit arm is the positive control: without it, a floorOnly that had
   * silently stopped applying the floor would read the same as one that applied
   * it in a well-pollinated population. */
  const starved = runWith({
    visits: 20,
    selfing: { rate: 4, floorOnly: true },
  });
  const fed = runWith({ visits: 2000, selfing: { rate: 4, floorOnly: true } });

  const fails = (o) => o.history.reduce((a, r) => a + r.unmated, 0);
  assert.ok(
    fails(starved) > 0,
    "floorOnly never selected an unpollinated mother even when starved",
  );
  assert.equal(
    fails(fed),
    0,
    "floorOnly refused seed in a population where everyone was pollinated",
  );
});
