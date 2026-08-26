/*
 * The paired design must actually be paired.
 *
 * WHAT WENT WRONG. sim/evolve.js shared one sequential rng across arms, which
 * reads like the strongest possible pairing — same seed, same draws — but only
 * holds while every arm consumes the same NUMBER of draws. Two places broke
 * that, and in both the consumption depended on the quantity being measured:
 *
 *   · init() redrew when a candidate never touched the animal. L2 can miss the
 *     bee; L0 never can. One rejection shifted every later founder, so the arms
 *     were comparing different communities from generation 0.
 *   · step() drew once per LIVE species, and extinction shrinks `live`. Arms
 *     stayed in step only while their survivor counts agreed — and survivor
 *     count IS the measurement.
 *
 * docs/2026-08-01-v2-result.md §3 of the correction records the second one and
 * calls the consequence "variance inflation rather than bias". These tests pin
 * the repair; whether the correction's claim about its size is right is a
 * measurement, not an assertion, and lives in the result document.
 *
 * WHY A PINNED PRE-FIX BUILD. Running today's code twice would agree with
 * itself no matter what shifted. The reference is extracted from the commit
 * BEFORE the repair, so the guard compares against something that genuinely
 * lacks it — and the reference is a pinned sha, not HEAD, because a guard whose
 * reference follows the thing it guards is not a guard.
 */

const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const E = require("../sim/evolve.js");
const P = require("../sim/placement.js");

/* The commit that shipped the evolving-width result — the last tree in which
 * evolve.js still drew inside loops over `live`. */
const PRE_FIX_REF = "dea2a8f";

function loadPreFixModule() {
  const dst = path.join(
    __dirname,
    "..",
    "sim",
    `.baseline-evolve-${process.pid}.js`,
  );
  const src = execFileSync("git", ["show", `${PRE_FIX_REF}:sim/evolve.js`], {
    cwd: path.join(__dirname, ".."),
    maxBuffer: 32 * 1024 * 1024,
  });
  fs.writeFileSync(dst, src);
  /* Its relative requires resolve into the CURRENT sim/, so evolve.js is the
   * only thing that differs between the two builds. */
  return { mod: require(dst), cleanup: () => fs.rmSync(dst, { force: true }) };
}

const CTX = { bee: P.DEFAULT_BEE, nSamp: 160, kdeM: 24, seed: 11 };
const base = (mod, armName, over = {}) => ({
  ctx: CTX,
  arm: mod.ARMS[armName],
  nSpecies: 8,
  generations: 40,
  sampleEvery: 10,
  mutRate: 0.06,
  extinctAt: 0.01,
  seed: 5,
  k: 1.0,
  ...over,
});

/* Runs one arm through a COUNTING rng and reports how many draws it took, plus
 * the founding community snapshotted before any step can overwrite it.
 *
 * ⚠️ The snapshot timing is load-bearing. step() assigns live[i].g = cand in
 * place, so reading species[].g after the loop reports EVOLVED genomes under
 * the label "founders" — a probe written that way during this investigation
 * reported the founders as differing across arms when the candidate stream was
 * in fact identical. */
function trace(mod, armName, over = {}) {
  const params = base(mod, armName, over);
  let draws = 0;
  const inner = mod.makeRng(params.seed);
  const rng = () => {
    draws++;
    return inner();
  };
  const state = mod.init(params, rng);
  const founders = state.species.map((s, i) => ({
    slot: s.slot === undefined ? i : s.slot,
    g: { ...s.g },
  }));
  const perGen = [];
  for (let gen = 0; gen < params.generations; gen++) {
    mod.step(state, params, rng);
    perGen.push({
      draws,
      alive: state.species.filter((s) => s.alive).length,
    });
  }
  return { draws, founders, perGen };
}

const founderKey = (t) =>
  t.founders
    .map((f) => `${f.slot}:${f.g.antherT.toFixed(9)}:${f.g.curve.toFixed(9)}`)
    .join("|");

// --------------------------------------------------------------------------
// The repair.
// --------------------------------------------------------------------------

test("every arm consumes the same number of draws, whatever survives", () => {
  const t = ["L0", "L1", "L2"].map((a) => trace(E, a));

  /* The premise of the test: the arms must actually DIVERGE in survivors here,
   * otherwise equal draw counts prove nothing. */
  const finals = t.map((x) => x.perGen[x.perGen.length - 1].alive);
  assert.ok(
    new Set(finals).size > 1,
    `arms must differ in survivors for this test to mean anything; all gave ${finals[0]}`,
  );

  assert.strictEqual(
    new Set(t.map((x) => x.draws)).size,
    1,
    `arms consumed different draw counts: ${t.map((x) => x.draws).join(" vs ")}`,
  );

  /* Per generation, not just in total — a total can match by accident. */
  for (let g = 0; g < t[0].perGen.length; g++) {
    const at = t.map((x) => x.perGen[g].draws);
    assert.strictEqual(
      new Set(at).size,
      1,
      `draw counts diverged at generation ${g}: ${at.join(" vs ")}`,
    );
  }
});

test("all arms found their community from the same flowers", () => {
  const keys = ["L0", "L1", "L2"].map((a) => founderKey(trace(E, a)));
  assert.strictEqual(
    new Set(keys).size,
    1,
    "arms started from different founding communities, so nothing downstream " +
      "is attributable to the placement rule alone",
  );
});

test("an init rejection redraws only its own slot", () => {
  /* An arm that rejects the first candidate for one specific slot. Everything
   * else must be untouched — that is the whole repair. */
  const rejectSlot = 3;
  const seen = new Set();
  const flaky = {
    sig(g, ctx) {
      const key = `${ctx.seed}`;
      const first = !seen.has(key);
      seen.add(key);
      if (ctx.seed === CTX.seed + 13 * rejectSlot && first) return null;
      return E.ARMS.L1.sig(g, ctx);
    },
  };

  const plain = trace(E, "L1");
  const withReject = trace({ ...E, ARMS: { X: flaky } }, "X");

  /* POSITIVE CONTROL — the rejection has to have actually happened, or this
   * test passes by doing nothing. */
  const a = plain.founders.find((f) => f.slot === rejectSlot);
  const b = withReject.founders.find((f) => f.slot === rejectSlot);
  assert.ok(
    a && b,
    "both runs should fill the rejecting slot on a later attempt",
  );
  assert.notStrictEqual(
    a.g.antherT,
    b.g.antherT,
    "the rejected slot should have been refilled with a DIFFERENT flower",
  );

  /* And the actual claim: no other slot moved. */
  for (const f of plain.founders) {
    if (f.slot === rejectSlot) continue;
    const o = withReject.founders.find((x) => x.slot === f.slot);
    assert.ok(o, `slot ${f.slot} vanished after a rejection elsewhere`);
    assert.strictEqual(
      o.g.antherT,
      f.g.antherT,
      `a rejection at slot ${rejectSlot} shifted slot ${f.slot}`,
    );
  }

  assert.strictEqual(
    withReject.draws,
    plain.draws,
    "a rejection changed how far the shared stream advanced",
  );
});

/*
 * ⚠️ This asserts on the PROPOSED mutant, not on the resident after the step,
 * and that distinction is the difference between a test and a decoration.
 *
 * The first version compared species[last].g after one step. A mutant is only
 * installed if it beats the resident, and at these parameters it usually does
 * not — so both sides simply still held the founder genome, and the assertion
 * passed on the PRE-FIX build too. It was measuring "no substitution happened
 * in either run", which is true regardless of which draws the mutation used.
 * Spying on what gets handed to arm.sig reads the mutation stream directly.
 */
function proposedMutants(mod, params, killIndex) {
  const seen = [];
  const spy = {
    sig(g, ctx) {
      seen.push({ ...g });
      return mod.ARMS.L1.sig(g, ctx);
    },
  };
  const p = { ...params, arm: spy };
  const state = mod.init(p, mod.makeRng(p.seed));
  const founded = seen.length; // init's calls, not mutants
  if (killIndex !== undefined) state.species[killIndex].alive = false;
  mod.step(state, p, mod.makeRng(77));
  return seen.slice(founded);
}

test("a species' mutation stream does not depend on who died before it", () => {
  const params = base(E, "L1", { generations: 1 });

  const all = proposedMutants(E, params);
  const minusFirst = proposedMutants(E, params, 0);

  /* POSITIVE CONTROL — mutants must actually have been proposed, and killing
   * one species must actually have removed one proposal. Without this the
   * comparison below can pass on two empty lists. */
  assert.ok(all.length >= 3, `expected several mutants, got ${all.length}`);
  assert.strictEqual(
    minusFirst.length,
    all.length - 1,
    "killing one species should remove exactly one mutation proposal",
  );

  /* The claim: the LAST surviving species is offered the same mutant either
   * way. Under the old code its draws came from its index among survivors, so
   * losing an earlier species handed it somebody else's numbers. */
  assert.deepStrictEqual(
    minusFirst[minusFirst.length - 1],
    all[all.length - 1],
    "the last species was offered a different mutant purely because an " +
      "earlier one died",
  );
});

// --------------------------------------------------------------------------
// The negative control: the pre-fix build must FAIL the checks above.
// A guard never seen to fail is not known to be a guard.
// --------------------------------------------------------------------------

test("NEGATIVE CONTROL: the pre-fix build desynchronises on both counts", () => {
  const { mod, cleanup } = loadPreFixModule();
  try {
    const t = ["L0", "L1", "L2"].map((a) => trace(mod, a));

    const counts = t.map((x) => x.draws);
    assert.ok(
      new Set(counts).size > 1,
      `pre-fix build should consume different draw counts per arm; got ${counts.join(" vs ")} ` +
        "— if this passes, the reference is not actually the pre-fix build",
    );

    /* And the init half: the founding communities differed too. */
    const keys = t.map(founderKey);
    assert.ok(
      new Set(keys).size > 1,
      "pre-fix build should have started the arms from different founders",
    );

    /* Locate the first divergence, so the failure mode is documented rather
     * than merely detected. */
    let first = -1;
    for (let g = 0; g < t[0].perGen.length; g++) {
      if (new Set(t.map((x) => x.perGen[g].draws)).size > 1) {
        first = g;
        break;
      }
    }
    assert.ok(first >= 0, "expected a generation at which the arms diverged");
  } finally {
    cleanup();
  }
});
