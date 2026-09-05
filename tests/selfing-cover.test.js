const test = require("node:test");
const assert = require("node:assert");
const I = require("../sim/ibm.js");
const E = require("../sim/evolve.js");
const { selfingFor } = require("../experiments/selfing-arms.js");

/*
 * #64 — coverage as a dose: the flat floor withheld at random from a fraction q.
 *
 * ⚠️ NOTHING BELOW REBUILDS THE BRANCH'S ARITHMETIC AND ASSERTS ON THE COPY.
 * That is the mistake #62 shipped and #63 recorded. Every assertion here is
 * either a CONSEQUENCE that only a genuine random-coverage floor has, or a
 * comparison against ANOTHER ARM's output.
 *
 * The three defining consequences, none of which dose/clip/shift satisfy:
 *
 *   1. SHAPE PRESERVED. Every plant that is not starved gets the SAME scalar.
 *      The coverage floor changes WHO, never HOW MUCH each. Dose and both
 *      residual variants give n different values.
 *   2. COVERAGE EXACT. Exactly round(q*n) plants are at zero — not "about".
 *   3. UNCORRELATED WITH VISITATION, which is the whole difference from #63.
 *      Clipping residuals systematically SPARES the partnerless plant, because
 *      `received` ~ 0 gives her a large positive residual. A random cut does
 *      not. Test 8 measures that gap directly and is the reason #64 exists.
 */

const SITE_N = 160,
  D_EXCL = 8,
  SLICES = 8,
  WIDTH = 0.12,
  VPP = 800,
  N0 = 30;

/* One generation, with a coverage stream when the arm asks for one. Mirrors
 * experiments/rare-floor.js's driver rather than inventing a second one. */
function oneStep(selfing, seed = 7) {
  const rng = E.makeRng(seed);
  const srng = I.signalRng(seed);
  const brng = I.bloomRng(seed);
  const crng = selfing && selfing.cover != null ? I.coverRng(seed) : undefined;
  const phen = { slices: SLICES, width: WIDTH };
  const opts = {
    ...I.DEFAULTS,
    siteN: SITE_N,
    phenology: phen,
    visitsPerPlant: VPP,
    selfing,
  };
  const built = I.foundTwoLineages(N0, rng, srng, D_EXCL, opts);
  assert.ok(built, "founding failed — the fixture is wrong, not the code");
  phen.displayProportionalVisits = false;
  return I.step(built.pop, opts, rng, 0, srng, brng, null, crng);
}

/* Several generations, so per-generation redraw and accumulated rates can be
 * seen. Returns one entry per generation. */
function manySteps(selfing, seed = 7, gens = 12) {
  const rng = E.makeRng(seed);
  const srng = I.signalRng(seed);
  const brng = I.bloomRng(seed);
  const crng = selfing && selfing.cover != null ? I.coverRng(seed) : undefined;
  const phen = { slices: SLICES, width: WIDTH };
  const opts = {
    ...I.DEFAULTS,
    siteN: SITE_N,
    phenology: phen,
    visitsPerPlant: VPP,
    selfing,
  };
  const built = I.foundTwoLineages(N0, rng, srng, D_EXCL, opts);
  assert.ok(built, "founding failed — the fixture is wrong, not the code");
  phen.displayProportionalVisits = false;
  let pop = built.pop;
  const out = [];
  for (let g = 0; g < gens && pop.length >= 2; g++) {
    const res = I.step(pop, opts, rng, g, srng, brng, null, crng);
    out.push(res);
    pop = res.pop;
  }
  return out;
}

const sum = (x) => x.reduce((a, b) => a + b, 0);
const recvOf = (res) => res.received;

// ---------------------------------------------------------------- 1. C-match

test("C-match: every coverage arm spends exactly the flat floor's total", () => {
  for (const rate of [0.5, 1, 2]) {
    for (const q of [0, 0.25, 0.5, 0.69, 0.85]) {
      for (const seed of [3, 11, 29]) {
        const res = oneStep({ rate, cost: 0, cover: q }, seed);
        const target = rate * sum(recvOf(res));
        const spent = sum(res.selfW);
        const rel = Math.abs(spent - target) / Math.max(target, 1e-300);
        assert.ok(
          rel < 1e-12,
          `rate ${rate} q ${q} seed ${seed}: spent ${spent} vs target ${target} (rel ${rel})`,
        );
      }
    }
  }
});

// ------------------------------------------------------- 2. the shape is flat

test("the floor's SHAPE is untouched: every covered plant gets the same scalar", () => {
  for (const q of [0, 0.25, 0.5, 0.69, 0.85]) {
    const res = oneStep({ rate: 2, cost: 0, cover: q }, 5);
    const nz = res.selfW.filter((x) => x !== 0);
    const distinct = new Set(nz);
    assert.strictEqual(
      distinct.size,
      1,
      `q ${q}: covered plants got ${distinct.size} different values, not 1 — ` +
        `that is a shape change, which is #62/#63's axis and not this one`,
    );
  }
});

test("and that is what separates it from dose and both residual variants", () => {
  const cover = oneStep({ rate: 2, cost: 0, cover: 0.5 }, 5);
  for (const other of [
    { rate: 2, cost: 0, dose: true },
    { rate: 2, cost: 0, resid: "clip" },
    { rate: 2, cost: 0, resid: "shift" },
  ]) {
    const res = oneStep(other, 5);
    const distinct = new Set(res.selfW.filter((x) => x !== 0));
    assert.ok(
      distinct.size > 1,
      `${JSON.stringify(other)} gave a flat non-zero set — the fixture is not ` +
        `discriminating and this test would pass for the wrong reason`,
    );
    assert.notDeepStrictEqual(
      cover.selfW,
      res.selfW,
      `coverage and ${JSON.stringify(other)} produced identical assurance`,
    );
  }
});

// -------------------------------------------------------- 3. coverage is EXACT

test("exactly round(q*n) plants are starved — not approximately", () => {
  for (const q of [0, 0.25, 0.5, 0.69, 0.85]) {
    for (const seed of [2, 13]) {
      const res = oneStep({ rate: 2, cost: 0, cover: q }, seed);
      const n = res.selfW.length;
      const zeros = res.selfW.filter((x) => x === 0).length;
      assert.strictEqual(
        zeros,
        Math.round(q * n),
        `q ${q} n ${n} seed ${seed}: ${zeros} starved, expected ${Math.round(q * n)}`,
      );
    }
  }
});

test("the covered fraction is paid exactly n/(n-starved) times the flat floor", () => {
  /* the LOTTERY magnitude, and the reason coverage is not merely a kill switch:
   * under a matched total, withholding from q pays the rest 1/(1-q) each */
  for (const q of [0.25, 0.5, 0.69, 0.85]) {
    const flat = oneStep({ rate: 2, cost: 0 }, 5);
    const cov = oneStep({ rate: 2, cost: 0, cover: q }, 5);
    const n = flat.selfW.length;
    const nKeep = n - Math.round(q * n);
    const w = cov.selfW.find((x) => x !== 0);
    const ratio = w / flat.selfW[0];
    assert.ok(
      Math.abs(ratio - n / nKeep) < 1e-9,
      `q ${q}: covered plants got ${ratio}x the flat floor, expected ${n / nKeep}x`,
    );
  }
});

// ------------------------------------------------------------ 4. the C-null

test("q = 0 reproduces the flat floor EXACTLY, value for value", () => {
  for (const seed of [1, 7, 23]) {
    const flat = oneStep({ rate: 2, cost: 0 }, seed);
    const q0 = oneStep({ rate: 2, cost: 0, cover: 0 }, seed);
    assert.deepStrictEqual(
      q0.selfW,
      flat.selfW,
      `seed ${seed}: q=0 assurance differs from the flat floor`,
    );
    /* and nothing else moved either — the coverage draw comes off its own
     * stream, so the transfer matrix and the offspring are untouched */
    assert.deepStrictEqual(q0.received, flat.received);
    assert.deepStrictEqual(q0.T, flat.T);
    assert.strictEqual(q0.pop.length, flat.pop.length);
  }
});

test("q = 0 stays identical across MANY generations, not just the first", () => {
  /* the per-generation redraw is where a shared stream would show up */
  const flat = manySteps({ rate: 2, cost: 0 }, 9, 10);
  const q0 = manySteps({ rate: 2, cost: 0, cover: 0 }, 9, 10);
  assert.strictEqual(q0.length, flat.length);
  for (let g = 0; g < flat.length; g++) {
    assert.deepStrictEqual(q0[g].selfW, flat[g].selfW, `generation ${g}`);
    assert.deepStrictEqual(q0[g].received, flat[g].received, `generation ${g}`);
  }
});

// ------------------------------------------- 5. the set is redrawn every generation

test("the starved set is REDRAWN each generation, not fixed for the run", () => {
  const gens = manySteps({ rate: 2, cost: 0, cover: 0.5 }, 4, 10);
  assert.ok(gens.length >= 5, "fixture died too early to see a redraw");
  const sets = gens.map((r) =>
    r.selfW.map((x) => (x === 0 ? "1" : "0")).join(""),
  );
  const distinct = new Set(sets);
  assert.ok(
    distinct.size > 1,
    "every generation starved the identical set of plants — the coverage " +
      "stream is being re-seeded per call, which is the silent failure the " +
      "missing-stream throw exists to prevent",
  );
});

// ------------------------------------------------ 6. fail loud, with a positive control

test("a coverage arm without its own rng stream THROWS rather than degrading", () => {
  const rng = E.makeRng(7);
  const srng = I.signalRng(7);
  const brng = I.bloomRng(7);
  const phen = { slices: SLICES, width: WIDTH };
  const opts = {
    ...I.DEFAULTS,
    siteN: SITE_N,
    phenology: phen,
    visitsPerPlant: VPP,
    selfing: { rate: 2, cost: 0, cover: 0.5 },
  };
  const built = I.foundTwoLineages(N0, rng, srng, D_EXCL, opts);
  assert.ok(built);
  phen.displayProportionalVisits = false;
  assert.throws(
    () => I.step(built.pop, opts, rng, 0, srng, brng),
    /cover needs its own rng stream/,
    "a missing coverage stream must throw, not silently starve the same plants",
  );
  /* ⚠️ POSITIVE CONTROL, in the same test: the fixture is capable of NOT
   * throwing, so the assertion above is about the missing stream and not about
   * the fixture being broken in some unrelated way */
  const ok = I.step(built.pop, opts, rng, 0, srng, brng, null, I.coverRng(7));
  assert.ok(ok.selfW && ok.selfW.length === built.pop.length);
});

test("a coverage outside [0,1] throws rather than being clamped", () => {
  for (const q of [-0.1, 1.5]) {
    assert.throws(
      () => oneStep({ rate: 2, cost: 0, cover: q }, 7),
      /cover must be in \[0,1\]/,
      `cover ${q} was accepted`,
    );
  }
});

test("q = 1 degenerates to no assurance at all, without dividing by zero", () => {
  const res = oneStep({ rate: 2, cost: 0, cover: 1 }, 7);
  assert.ok(
    res.selfW.every((x) => x === 0),
    "q=1 must withhold from everyone",
  );
  assert.ok(
    res.selfW.every(Number.isFinite),
    "q=1 produced a non-finite assurance — the empty-survivor case divides by zero",
  );
});

// --------------------------------------------- 7. no negative / NaN assurance

test("no arm produces a negative, NaN or infinite assurance", () => {
  for (const q of [0, 0.25, 0.5, 0.69, 0.85, 1]) {
    for (const seed of [3, 17]) {
      const res = oneStep({ rate: 2, cost: 0, cover: q }, seed);
      for (const x of res.selfW) {
        assert.ok(
          Number.isFinite(x) && x >= 0,
          `q ${q} seed ${seed}: assurance ${x}`,
        );
      }
    }
  }
});

// ------------------------------------- 8. THE DIFFERENCE FROM #63, MEASURED

test("random coverage starves the partnerless; #63's clip systematically spares her", () => {
  /*
   * ⚠️ THIS IS THE TEST #64 EXISTS FOR, and it is the one that would have
   * caught the filed task's wrong prediction.
   *
   * A plant with `received === 0` is the only plant coverage can KILL: her
   * maternal weight is entirely the floor, so withholding it leaves her at
   * exactly zero and `pick()` never returns her (#61). Under clip she has a
   * large POSITIVE residual precisely because `received` is 0, so clipping at
   * zero keeps her. Under a random cut she is starved at rate q like anyone
   * else.
   *
   * Accumulated over generations and seeds so the rate is a rate, not a coin.
   */
  const q = 0.69;
  /* per arm: plants at received===0 and how many of them were starved, plus the
   * arm's OVERALL starved share — which is that arm's own BLIND null */
  const tally = (selfing) => {
    let exposed = 0,
      killed = 0,
      all = 0,
      starved = 0;
    for (const seed of [2, 5, 8, 11, 14, 17, 20, 23])
      for (const res of manySteps(selfing, seed, 12))
        for (let i = 0; i < res.received.length; i++) {
          all++;
          if (res.selfW[i] === 0) starved++;
          if (res.received[i] !== 0) continue;
          exposed++;
          if (res.selfW[i] === 0) killed++;
        }
    return { exposed, killed, rate: killed / exposed, overall: starved / all };
  };
  const cov = tally({ rate: 2, cost: 0, cover: q });
  const clip = tally({ rate: 2, cost: 0, resid: "clip" });

  assert.ok(
    cov.exposed > 50 && clip.exposed > 50,
    `too few fully floor-dependent plants to measure a rate ` +
      `(cover ${cov.exposed}, clip ${clip.exposed}) — the fixture cannot see this`,
  );

  /*
   * ⚠️ EACH ARM IS COMPARED AGAINST ITS OWN BLIND NULL, not against the other
   * and not against a ratio I picked. A rule blind to visitation starves the
   * exposed class at exactly its overall starved share. That makes the two
   * assertions below symmetric and threshold-free in the part that matters:
   * random must SIT ON its null, clip must sit clearly BELOW its own.
   */
  assert.ok(
    Math.abs(cov.rate - cov.overall) < 0.1,
    `random coverage killed the partnerless at ${cov.rate.toFixed(3)} while ` +
      `starving ${cov.overall.toFixed(3)} overall — a random cut must be BLIND ` +
      `to visitation, and these must agree`,
  );
  assert.ok(
    clip.rate < clip.overall - 0.1,
    `#63's clip killed the partnerless at ${clip.rate.toFixed(3)} while starving ` +
      `${clip.overall.toFixed(3)} overall — if those agree then clip is BLIND ` +
      `too, and #64's registered prediction rests on nothing`,
  );
  /*
   * ⚠️ AND THE SCOPE OF THAT PROTECTION, RECORDED HERE BECAUSE THE FIRST
   * VERSION OF THIS TEST OVERSTATED IT AND FAILED.
   *
   * Pre-flight A measured clip sparing the k=1 minority plant 90% of the time
   * against a 69.1% nominal cut. Across the WHOLE received===0 class the
   * protection is real but far weaker — clip kills roughly half of them. Both
   * are true: at received===0 the residual is `self - a`, so sparing turns on a
   * plant's own self-pollen against the intercept, and only the plants with
   * substantial display clear it. The k=1 minority plant is the extreme member
   * of the class (partnerless AND heavily geitonogamous), not a typical one.
   *
   * So clip's protection is CONCENTRATED AT LOW k rather than uniform. The
   * assertion is therefore that clip is not blind — which is what #64's
   * prediction needs — and NOT that it spares nearly everyone, which is false
   * and which the pre-registration was corrected to say before the sweep ran.
   */
  assert.ok(
    clip.rate < cov.rate,
    `clip killed the exposed class at ${clip.rate.toFixed(3)} against random's ` +
      `${cov.rate.toFixed(3)} — clip must spare them MORE than a blind cut does`,
  );
});

// ---------------------------------------------------------- 9. the name seam

test("the coverage arms parse, and mean what they say", () => {
  for (const [name, cover] of [
    ["R200q0", 0],
    ["R200q25", 0.25],
    ["R200q50", 0.5],
    ["R200q69", 0.69],
    ["R200q85", 0.85],
    ["R200q100", 1],
  ]) {
    assert.deepStrictEqual(selfingFor(name), { rate: 2, cost: 0, cover });
  }
  assert.deepStrictEqual(selfingFor("R200c25q50"), {
    rate: 2,
    cost: 0.25,
    cover: 0.5,
  });
  assert.deepStrictEqual(selfingFor("R200q69n"), {
    rate: 2,
    cost: 0,
    cover: 0.69,
    ancNull: true,
  });
});

test("a name cannot carry both a shape and a coverage", () => {
  for (const bad of [
    "R200dq50",
    "R200q50r",
    "R200rq50",
    "R200q50d",
    "R200sq25",
  ]) {
    assert.strictEqual(
      selfingFor(bad),
      null,
      `${bad} names two floors and must return null, not silently pick one`,
    );
  }
});

test("near-miss coverage names are rejected", () => {
  for (const bad of [
    "R200q",
    "R200qq50",
    "R200q101",
    "R200q50c25",
    "R200nq50",
    "Rq50",
    "R200Q50",
  ]) {
    assert.strictEqual(selfingFor(bad), null, `${bad} parsed`);
  }
});

test("no arm that predates #64 acquires a coverage", () => {
  const before = [
    "S",
    "Sn",
    "R25",
    "R50",
    "R100",
    "R200",
    "R200n",
    "R200c25",
    "R200c50",
    "R200c75",
    "R200c95",
    "R200d",
    "R200r",
    "R200s",
  ];
  for (const a of before) {
    const s = selfingFor(a);
    assert.ok(s, `${a} stopped parsing`);
    assert.strictEqual(
      s.cover,
      undefined,
      `${a} silently acquired cover=${s.cover}`,
    );
  }
});

// ------------------------------------------------------ 10. the gate is a gate

test("selfing off leaves selfW null, coverage or not", () => {
  const res = oneStep(null, 7);
  assert.strictEqual(res.selfW, null);
});

test("`always` still overrides coverage", () => {
  const res = oneStep({ rate: 2, cost: 0, cover: 0.85, always: true }, 7);
  assert.ok(
    res.selfW.every((x) => x === 1),
    "the always-self control arm must not be reshaped by a coverage",
  );
});
