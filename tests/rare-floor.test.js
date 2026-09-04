/*
 * tests/rare-floor.test.js — guards for #56's two load-bearing assumptions.
 *
 * #56 varies the population size to ask whether the rare-lineage floor sits at a
 * COUNT of plants or at a FREQUENCY. Two properties of the sim carry that whole
 * design, neither previously covered:
 *
 *   1. `visitsPerPlant` holds per-plant pollinator service constant while N0
 *      varies. Without it `opts.visits` is a constant TOTAL, per-plant service
 *      scales as 1/n, and the sweep would confound "fewer plants" with "more
 *      service each". It must ALSO be a no-op at the founding size, or the N0=30
 *      cell is not the anchor to #55 that #56 reports it as.
 *   2. `T[j][j]` is self-pollen. #56's test of the geitonogamy explanation reads
 *      it directly, and if the diagonal were zero or meant something else the
 *      whole "self share" measurement would be inert or wrong.
 *
 * Both were checked before the run; this is what keeps them checked.
 */
const test = require("node:test");
const assert = require("node:assert");
const I = require("../sim/ibm.js");
const E = require("../sim/evolve.js");
const { selfingFor } = require("../experiments/selfing-arms.js");

const SITE_N = 160,
  D_EXCL = 8,
  S = 8,
  W = 0.12;

function run(seed, N0, vpp, gens, premiumOff) {
  const rng = E.makeRng(seed);
  const srng = I.signalRng(seed);
  const brng = I.bloomRng(seed);
  const phen = { slices: S, width: W };
  const opts = { ...I.DEFAULTS, siteN: SITE_N, phenology: phen };
  if (vpp != null) opts.visitsPerPlant = vpp;
  const built = I.foundTwoLineages(N0, rng, srng, D_EXCL, opts);
  if (!built) return null;
  let pop = built.pop;
  const out = [];
  for (let g = 0; g < gens; g++) {
    if (pop.length < 2) break;
    phen.displayProportionalVisits = !!premiumOff;
    const res = I.step(pop, opts, rng, g, srng, brng);
    out.push({ anc: res.pop.map((x) => x.anc || 0), spent: res.visitsSpent });
    pop = res.pop;
  }
  return out;
}

test("visitsPerPlant is a no-op at the founding size, so the N0=30 cell anchors to #55", () => {
  let checked = 0;
  for (const seed of [1, 2, 3]) {
    for (const off of [false, true]) {
      const a = run(seed, 30, null, 6, off); /* opts.visits = 24000 */
      const b = run(seed, 30, 800, 6, off); /* 800 * 30 = 24000 */
      assert.ok(a && b, `seed ${seed}: founding failed`);
      assert.deepStrictEqual(
        b.map((x) => x.anc),
        a.map((x) => x.anc),
        `seed ${seed} arm ${off ? "B" : "A"}: visitsPerPlant=800 changed the run at N0=30`,
      );
      assert.deepStrictEqual(
        b.map((x) => x.spent),
        a.map((x) => x.spent),
        `seed ${seed} arm ${off ? "B" : "A"}: visit spend differs at N0=30`,
      );
      checked++;
    }
  }
  assert.equal(checked, 6);
});

test("visitsPerPlant is NOT inert at another N0 — the knob actually does something", () => {
  /* ⚠️ THE COMPANION HALF. A knob that is a no-op everywhere would pass the test
   * above perfectly and make the whole sweep meaningless: every N0 would get the
   * same total service and the design would silently be testing nothing. */
  const a = run(1, 30, 800, 2, false);
  const b = run(1, 60, 800, 2, false);
  assert.ok(a && b, "founding failed");
  assert.equal(a[0].spent, 24000, "N0=30 should spend 800*30");
  assert.equal(b[0].spent, 48000, "N0=60 should spend 800*60");
  assert.notEqual(
    b[0].spent,
    a[0].spent,
    "visitsPerPlant did not change the budget at a different N0",
  );
});

test("T's diagonal is self-pollen, is non-zero, and is exactly what `received` omits", () => {
  const rng = E.makeRng(1);
  const srng = I.signalRng(1);
  const brng = I.bloomRng(1);
  const phen = { slices: S, width: W, displayProportionalVisits: false };
  const opts = {
    ...I.DEFAULTS,
    siteN: SITE_N,
    phenology: phen,
    visitsPerPlant: 800,
  };
  const built = I.foundTwoLineages(30, rng, srng, D_EXCL, opts);
  assert.ok(built, "founding failed");
  const res = I.step(built.pop, opts, rng, 0, srng, brng);
  assert.ok(res.T, "step returned no transfer matrix");

  const n = res.T.length;
  let diag = 0,
    off = 0;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      i === j ? (diag += res.T[i][j]) : (off += res.T[i][j]);

  /* if this were zero, #56's "self share" would be identically 0 and the
   * geitonogamy measurement would report a flat line whatever the biology did */
  assert.ok(
    diag > 0,
    "the diagonal is zero — the self-pollen measurement is inert",
  );
  assert.ok(off > 0, "no outcross pollen moved at all");

  /* and the diagonal must be precisely the term sim/ibm.js:1749-1753 skips */
  let worst = 0;
  for (let j = 0; j < n; j++) {
    let col = 0,
      rec = 0;
    for (let i = 0; i < n; i++) {
      col += res.T[i][j];
      if (i !== j) rec += res.T[i][j];
    }
    worst = Math.max(worst, Math.abs(rec - (col - res.T[j][j])));
  }
  assert.ok(
    worst < 1e-9,
    `received is not the column sum minus the diagonal (worst ${worst})`,
  );
});

/* ------------------------------------------------------------------ #59 */

/* arm A (premium on) at #58's rate 2.0, with inbreeding depression dialled in */
function runCost(seed, cost, gens) {
  const rng = E.makeRng(seed);
  const srng = I.signalRng(seed);
  const brng = I.bloomRng(seed);
  const phen = { slices: S, width: W };
  const opts = {
    ...I.DEFAULTS,
    siteN: SITE_N,
    phenology: phen,
    visitsPerPlant: 800,
    selfing: { rate: 2.0, cost },
    logMatings: true,
  };
  const built = I.foundTwoLineages(30, rng, srng, D_EXCL, opts);
  if (!built) return null;
  let pop = built.pop;
  const out = [];
  for (let g = 0; g < gens; g++) {
    if (pop.length < 2) break;
    phen.displayProportionalVisits = false;
    const res = I.step(pop, opts, rng, g, srng, brng);
    out.push({
      recruits: res.recruits,
      target: res.target,
      unmated: res.unmated,
      selfed: (res.matings || []).filter((m) => m.selfed).length,
      matings: (res.matings || []).length,
    });
    pop = res.pop;
  }
  return out;
}

test("inbreeding depression is a COMPETITIVE penalty, not a demographic one", () => {
  /* ⚠️ THE INTERPRETIVE CLAIM #59'S WHOLE READING RESTS ON. With demography off
   * the recruitment loop runs `while (next.length < target)`, so a selfed seed
   * killed by `cost` does not cost the population a recruit — the loop draws
   * another mother and the slot goes to whoever the visit-weighted draw
   * favours. If that were wrong, every cost cell would be confounded with a
   * shrinking population and the sweep would be measuring two things at once.
   * Asserted rather than assumed, because the task brief flags exactly this. */
  for (const seed of [1, 2, 3]) {
    const hi = runCost(seed, 0.95, 5);
    assert.ok(hi && hi.length, `seed ${seed}: founding failed`);
    for (const r of hi)
      assert.equal(
        r.recruits,
        r.target,
        `seed ${seed}: cost 0.95 left a generation short (${r.recruits}/${r.target}) — cost IS demographic here`,
      );
    assert.ok(
      hi.some((r) => r.unmated > 0),
      `seed ${seed}: cost 0.95 killed nothing — the lever is inert`,
    );
  }
});

test("`unmated` is the cost-death counter — it is exactly 0 when cost is 0", () => {
  /* The positive control for the line above. `unmated` is read as "selfed seeds
   * that failed to establish", which is only legitimate if nothing ELSE
   * increments it on this path — the father<0 branch is documented unreachable
   * off `floorOnly`. If this ever fires, the attempted-selfing rate computed as
   * selfed+unmated is measuring something else too. */
  for (const seed of [1, 2, 3]) {
    const zero = runCost(seed, 0, 5);
    assert.ok(zero && zero.length, `seed ${seed}: founding failed`);
    for (const r of zero)
      assert.equal(
        r.unmated,
        0,
        `seed ${seed}: cost 0 still reported ${r.unmated} unmated — something other than inbreeding depression increments it`,
      );
  }
});

test("cost suppresses ESTABLISHED selfing while leaving ATTEMPTED selfing alone", () => {
  /* ⚠️ #58's C10 blind spot, turned into an assertion. `matings` is pushed only
   * when a seed establishes, so selfedN/matingsN COLLAPSES with cost even
   * though the selfing DECISION rate is untouched. Reading C10 off that alone
   * would report "the arm stopped selfing" and hand back a confident null about
   * cost when the arm is selfing exactly as hard and the seeds are dying. */
  let est0 = 0,
    estD0 = 0,
    att0 = 0,
    attD0 = 0;
  let est9 = 0,
    estD9 = 0,
    att9 = 0,
    attD9 = 0;
  for (const seed of [1, 2, 3]) {
    for (const r of runCost(seed, 0, 5)) {
      est0 += r.selfed;
      estD0 += r.matings;
      att0 += r.selfed + r.unmated;
      attD0 += r.matings + r.unmated;
    }
    for (const r of runCost(seed, 0.95, 5)) {
      est9 += r.selfed;
      estD9 += r.matings;
      att9 += r.selfed + r.unmated;
      attD9 += r.matings + r.unmated;
    }
  }
  const e0 = est0 / estD0,
    e9 = est9 / estD9;
  const a0 = att0 / attD0,
    a9 = att9 / attD9;
  assert.ok(
    e0 - e9 > 0.3,
    `established selfed share barely moved (${e0.toFixed(3)} -> ${e9.toFixed(3)}); cost is not suppressing establishment`,
  );
  assert.ok(
    Math.abs(a0 - a9) < 0.1,
    `ATTEMPTED selfing moved with cost (${a0.toFixed(3)} -> ${a9.toFixed(3)}); the decision rate should be untouched, so selfed+unmated is not recovering it`,
  );
});

test("selfingFor recognises every arm the sweeps actually use", () => {
  /* ⚠️ THE REGRESSION C10 SUFFERED TWICE. The control used to decide whether an
   * arm selfs by matching its NAME against a list of shapes, so each new naming
   * dimension silently made it fail correct cells: #58's R-rate arms broke the
   * S/Sn list, and #59's R*c* cost arms broke the widened `/^R\d+$/`. Both
   * times the simulation was right and the control was wrong.
   *
   * This asserts the mapping directly, INCLUDING the combination that defeats
   * both historical patterns (R200c25n), so a third naming dimension has to
   * break a test rather than a silent FAIL in a report nobody re-reads. */
  assert.deepStrictEqual(selfingFor("S"), { rate: 0.5, cost: 0 });
  assert.deepStrictEqual(selfingFor("Sn"), {
    rate: 0.5,
    cost: 0,
    ancNull: true,
  });
  assert.deepStrictEqual(selfingFor("R25"), { rate: 0.25, cost: 0 });
  assert.deepStrictEqual(selfingFor("R200"), { rate: 2, cost: 0 });
  assert.deepStrictEqual(selfingFor("R200n"), {
    rate: 2,
    cost: 0,
    ancNull: true,
  });
  assert.deepStrictEqual(selfingFor("R200c25"), { rate: 2, cost: 0.25 });
  assert.deepStrictEqual(selfingFor("R200c95"), { rate: 2, cost: 0.95 });
  /* the combination that defeats BOTH historical predicates */
  assert.deepStrictEqual(selfingFor("R200c25n"), {
    rate: 2,
    cost: 0.25,
    ancNull: true,
  });
  /*
   * ⚠️ #62's dose dimension — the THIRD naming axis, and the one this file's
   * whole comment block predicted would arrive. `d` means the assurance floor is
   * proportional to the plant's own self-pollen instead of a shared scalar.
   * Asserted here, at the name-to-config seam, because tests/selfing-dose.test.js
   * exercises the CONFIG OBJECT against sim/ibm.js and never goes through
   * selfingFor — so without these lines the sweep could run a cell called
   * "R200d" that silently self-configured as the flat R200 and the two arms
   * would report an honest, carefully-controlled null.
   */
  assert.deepStrictEqual(selfingFor("R200d"), {
    rate: 2,
    cost: 0,
    dose: true,
  });
  assert.deepStrictEqual(selfingFor("R25d"), {
    rate: 0.25,
    cost: 0,
    dose: true,
  });
  /* dose composes with cost and with the tracer null, in that order */
  assert.deepStrictEqual(selfingFor("R200c50d"), {
    rate: 2,
    cost: 0.5,
    dose: true,
  });
  assert.deepStrictEqual(selfingFor("R200c25dn"), {
    rate: 2,
    cost: 0.25,
    dose: true,
    ancNull: true,
  });
  /* and the arms that already exist must NOT acquire a dose by accident */
  for (const arm of ["R200", "R200c25", "R200n", "R200c25n", "S", "Sn"])
    assert.ok(
      !("dose" in selfingFor(arm)),
      `${arm} silently became dose-dependent — every archive before #62 is now incomparable`,
    );
});

test("selfingFor returns null for the arms that must NOT self", () => {
  /* The other half, and the one that makes the control able to fail: if this
   * ever returned a config for arm A, C10 would stop demanding a 0% selfed
   * share there and the premium arms could self unnoticed. */
  for (const arm of ["A", "B", "Bx"])
    assert.equal(
      selfingFor(arm),
      null,
      `arm ${arm} must not be configured to self`,
    );
  /* and it must not accept a name it does not understand — including near-misses
   * of the new dose suffix, which is where a third naming axis would slip in */
  for (const arm of [
    "R",
    "Rx",
    "R200c",
    "200",
    "",
    "SS",
    "R200dd",
    "R200nd",
    "Rd",
    "R200dc25",
  ])
    assert.equal(
      selfingFor(arm),
      null,
      `"${arm}" is not a valid arm name but was given a selfing config`,
    );
});
