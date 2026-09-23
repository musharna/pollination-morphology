/*
 * STALLED: a run that never reproduces must not read HELD.
 *
 * ⚠️ A GENERATION THAT RECRUITS NOTHING HANDS THE PARENTS BACK UNCHANGED
 * (`pop: opts.demography ? next : next.length ? next : pop`, sim/ibm.js step()).
 * The ancestry variance is then the founders', and a three-argument fateOf
 * scores a population that never made a seed as HELD — a win that cannot fail.
 * The fourth argument `stalled` (northstar spec §3, the one sanctioned sim/
 * change, §8) returns STALLED after the extinction line and before HELD.
 *
 * The fixture is the spec's reach-switch protocol, stated because it cannot be
 * run any other way: found at DEFAULT_BEE (founding AT reach 0 finds no anther
 * hit and returns null), then step every generation at the switched reach.
 */
const test = require("node:test");
const assert = require("node:assert");
const I = require("../sim/ibm.js");
const E = require("../sim/evolve.js");
const P = require("../sim/placement.js");

const LEVEL = { n: 30, gens: 35, siteN: 160 };

function reachSwitch(reach) {
  const opts = { ...I.DEFAULTS, siteN: LEVEL.siteN };
  const rng = E.makeRng(1);
  const srng = I.signalRng(1);
  const built = I.foundTwoLineages(LEVEL.n, rng, srng, 8, opts);
  assert.ok(built, "fixture failed: nothing founded at DEFAULT_BEE");
  const v0 = I.ancestryVar(built.pop);
  const stepOpts = { ...opts, bee: { ...P.DEFAULT_BEE, reach } };
  let pop = built.pop;
  let extinct = false;
  const recruits = [];
  for (let g = 0; g < LEVEL.gens; g++) {
    if (pop.length < 2) {
      extinct = true;
      break;
    }
    const res = I.step(pop, stepOpts, rng, g, srng);
    recruits.push(res.recruits);
    pop = res.pop;
  }
  const stalled = recruits.some((r) => r === 0);
  return { pop, v0, extinct, recruits, stalled };
}

test("reach 0 after founding: 35 of 35 generations recruit nothing and the fate is STALLED", () => {
  const r = reachSwitch(0);
  assert.equal(r.recruits.length, 35);
  assert.equal(
    r.recruits.filter((x) => x === 0).length,
    35,
    "the stall fixture recruited something",
  );
  /* the defect: without the flag the founders read HELD */
  assert.equal(I.fateOf(r.pop, r.v0, r.extinct), "HELD");
  assert.equal(
    I.fateOf(r.pop, r.v0, r.extinct, r.stalled),
    "STALLED",
    "a run that never reproduced was not scored STALLED",
  );
});

test("control, reach 0.85: recruits and is not STALLED under either arity", () => {
  const r = reachSwitch(0.85);
  const total = r.recruits.reduce((a, b) => a + b, 0);
  assert.ok(total > 0, "the control recruited nothing");
  assert.equal(r.stalled, false);
  const three = I.fateOf(r.pop, r.v0, r.extinct);
  const four = I.fateOf(r.pop, r.v0, r.extinct, r.stalled);
  assert.notEqual(four, "STALLED");
  assert.equal(four, three, "the fourth argument changed an unstalled run");
});

test("BOTH LOST still wins over stalled", () => {
  const pop = [{ anc: 0 }];
  assert.equal(I.fateOf(pop, 0.25, false, true), "BOTH LOST");
  assert.equal(
    I.fateOf([{ anc: 0 }, { anc: 1 }], 0.25, true, true),
    "BOTH LOST",
  );
  /* positive control inside the same test: the flag does fire on a live pop */
  assert.equal(
    I.fateOf([{ anc: 0 }, { anc: 1 }], 0.25, false, true),
    "STALLED",
  );
});
