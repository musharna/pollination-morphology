/*
 * Tests for the evolution loop.
 *
 * The first version of this model produced INVERTED controls — L0 held all 40
 * species while L1 and L2 collapsed to one — because per-capita fitness rose
 * without bound in abundance, so monopoly was the only attractor, and because
 * a community seeded at exactly equal abundance with exactly equal fitness sat
 * on an unstable equilibrium that a deterministic update never left. Both
 * failures are cheap to detect and neither shows up in a run that only reports
 * the final species count, so they are pinned here.
 */

const test = require("node:test");
const assert = require("node:assert");
const P = require("../sim/placement.js");
const K = require("../sim/packing.js");
const E = require("../sim/evolve.js");

const CTX = {
  bee: P.DEFAULT_BEE,
  nSamp: 40,
  sSd: 0.043,
  phiSd: 0.42,
  seed: 1234,
};
/*
 * 150 generations is measured, not guessed. L0 reaches a single species at
 * generation 75-89 across community sizes 8, 12 and 40 — the collapse is
 * driven by noise-amplified frequency dependence and takes time, so a
 * 60-generation test reported "12 species survive" and looked like a broken
 * model when it was only an under-powered test.
 */
const base = (over = {}) => ({
  ctx: CTX,
  nSpecies: 12,
  generations: 150,
  sampleEvery: 30,
  k: 0.0005,
  mutRate: 0.03,
  extinctAt: 0.002,
  seed: 5,
  ...over,
});

// --------------------------------------------------------------------------
// The paired controls. Neither means anything without the other: an arm that
// always collapses would pass the L0 test alone, and an arm that never
// collapses would pass the L2 test alone.
// --------------------------------------------------------------------------

test("NEGATIVE CONTROL: with no placement the community collapses to one species", () => {
  const { state } = E.run(base({ arm: E.ARMS.L0 }));
  const alive = state.species.filter((s) => s.alive).length;
  assert.strictEqual(
    alive,
    1,
    `all pollen reaches all stigmas, so only one species can persist; got ${alive}`,
  );
});

test("POSITIVE CONTROL: with placement the community does NOT collapse", () => {
  const { state } = E.run(base({ arm: E.ARMS.L2 }));
  const alive = state.species.filter((s) => s.alive).length;
  assert.ok(
    alive > 1,
    `placement should permit coexistence; collapsed to ${alive}`,
  );
});

test("2-D placement sustains more species than a 1-D gene", () => {
  const l2 = E.run(base({ arm: E.ARMS.L2 })).state.species.filter(
    (s) => s.alive,
  ).length;
  const l1 = E.run(base({ arm: E.ARMS.L1 })).state.species.filter(
    (s) => s.alive,
  ).length;
  assert.ok(l2 > l1, `expected L2 > L1, got L2 ${l2} vs L1 ${l1}`);
});

// --------------------------------------------------------------------------
// The two mechanisms whose absence produced the inverted controls.
// --------------------------------------------------------------------------

test("abundance cannot run away — total occupancy is conserved", () => {
  const params = base({ arm: E.ARMS.L2, generations: 1 });
  const rng = E.makeRng(3);
  const state = E.init(params, rng);
  const before = state.species.reduce((a, s) => a + s.n, 0);
  for (let i = 0; i < 25; i++) E.step(state, params, rng);
  const after = state.species
    .filter((s) => s.alive)
    .reduce((a, s) => a + s.n, 0);
  assert.ok(
    Math.abs(after - before) < 0.05,
    `occupancy drifted from ${before.toFixed(3)} to ${after.toFixed(3)} — the ` +
      `lottery is not conserving sites, which is how monopoly crept in before`,
  );
});

test("a symmetric community does not sit frozen on its unstable equilibrium", () => {
  // Identical fitnesses with a deterministic update leave abundances exactly
  // where they started, which reads as coexistence but is only symmetry never
  // being broken. Demographic noise must move them.
  const params = base({ arm: E.ARMS.L0, generations: 1 });
  const rng = E.makeRng(9);
  const state = E.init(params, rng);
  const start = state.species.map((s) => s.n);
  E.step(state, params, rng);
  const moved = state.species.some((s, i) => Math.abs(s.n - start[i]) > 1e-9);
  assert.ok(moved, "abundances did not move at all under identical fitness");
});

// --------------------------------------------------------------------------
// The fitness model.
// --------------------------------------------------------------------------

test("heterospecific pollen on a stigma lowers fitness", () => {
  const sig = (s0, phi0) => ({
    A: K.sig2D(K.syntheticHits(s0, phi0, 0.04, 0.3, { n: 200, seed: 4 })),
    S: K.sig2D(K.syntheticHits(s0, phi0, 0.04, 0.3, { n: 200, seed: 4 })),
  });
  // species 0 is alone in its placement; species 1 and 2 sit on top of each other
  const sigs = [sig(0.2, 0), sig(0.7, 0), sig(0.7, 0)];
  const n = [1 / 3, 1 / 3, 1 / 3];
  const O = E.overlapMatrixOf(sigs, E.ARMS.L2);
  const w = E.fitnesses(sigs, n, O, 0.0005);
  assert.ok(
    w[0] > w[1] && w[0] > w[2],
    `isolated species should beat two overlapping ones: ${[...w].map((v) => v.toFixed(3))}`,
  );
});

test("identical species receive identical fitness", () => {
  const one = {
    A: K.sig2D(K.syntheticHits(0.5, 0, 0.04, 0.3, { n: 200, seed: 8 })),
    S: K.sig2D(K.syntheticHits(0.5, 0, 0.04, 0.3, { n: 200, seed: 8 })),
  };
  const sigs = [one, one, one];
  const n = [1 / 3, 1 / 3, 1 / 3];
  const w = E.fitnesses(sigs, n, E.overlapMatrixOf(sigs, E.ARMS.L2), 0.0005);
  assert.ok(Math.abs(w[0] - w[1]) < 1e-12 && Math.abs(w[1] - w[2]) < 1e-12);
});

// --------------------------------------------------------------------------
// Genome plumbing. Placement must never become directly heritable.
// --------------------------------------------------------------------------

test("mutation stays inside the gene bounds", () => {
  const rng = E.makeRng(17);
  let g = E.randomGenome(rng);
  for (let i = 0; i < 400; i++) {
    g = E.mutate(g, rng, 0.4); // deliberately violent
    for (const key in E.GENE_BOUNDS) {
      const [lo, hi] = E.GENE_BOUNDS[key];
      assert.ok(
        g[key] >= lo - 1e-9 && g[key] <= hi + 1e-9,
        `${key} escaped to ${g[key]}`,
      );
    }
    assert.ok(
      Math.abs(g.antherTheta) <= Math.PI + 1e-9,
      "angle failed to wrap",
    );
  }
});

test("a genome carries no placement gene — the stigma tracks the anther", () => {
  const rng = E.makeRng(21);
  const g = E.randomGenome(rng);
  assert.ok(
    !("s" in g) && !("phi" in g),
    "a placement coordinate leaked into the genome",
  );
  const f = E.toFlower(g);
  assert.strictEqual(f.stigmaTheta, g.antherTheta);
  assert.ok(f.stigmaT > f.antherT, "stigma must sit deeper than the anther");
});

test("the same seed gives the same community", () => {
  const a = E.run(base({ arm: E.ARMS.L2, generations: 25 }));
  const b = E.run(base({ arm: E.ARMS.L2, generations: 25 }));
  assert.deepStrictEqual(
    a.state.species.map((s) => [s.alive, s.n]),
    b.state.species.map((s) => [s.alive, s.n]),
  );
});
