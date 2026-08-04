/*
 * Tests for the individual-based model.
 *
 * The load-bearing one is the first: the founding constraint of the whole
 * project is that PLACEMENT IS NEVER A GENE, and an IBM is the easiest place in
 * the codebase to break it by accident — the moment a placement coordinate
 * becomes heritable, "the population split on placement" would be a statement
 * about a gene I added rather than about geometry.
 */

const test = require("node:test");
const assert = require("node:assert");
const I = require("../sim/ibm.js");
const E = require("../sim/evolve.js");
const P = require("../sim/placement.js");

/* --------------------------------------------------- the founding constraint */

test("no placement coordinate is ever heritable", () => {
  const rng = E.makeRng(1);
  const ind = I.randomIndividual(rng);
  const forbidden = ["s", "phi", "site", "placement", "stigmaTheta", "stigmaT"];
  for (const hap of [ind.h1, ind.h2, I.phenotype(ind), I.gamete(ind, rng, 0)])
    for (const k of forbidden)
      assert.ok(
        !(k in hap),
        `${k} appears in a heritable genome — placement would be a gene`,
      );
  /* and the expressed genome carries only the declared shape loci */
  for (const k of Object.keys(I.phenotype(ind)))
    assert.ok(I.ALL_KEYS.includes(k), `unexpected heritable locus ${k}`);
});

/* ------------------------------------------------------- diploid expression */

test("two identical haplotypes express as themselves", () => {
  const rng = E.makeRng(2);
  const h = E.randomGenome(rng);
  const p = I.phenotype({ h1: h, h2: h });
  for (const k of I.GENE_KEYS)
    assert.ok(Math.abs(p[k] - h[k]) < 1e-12, `${k} drifted on a homozygote`);
});

test("expression is additive — the heterozygote sits midway", () => {
  const rng = E.makeRng(3);
  const a = E.randomGenome(rng);
  const b = E.randomGenome(rng);
  const p = I.phenotype({ h1: a, h2: b });
  for (const k of I.GENE_KEYS)
    assert.ok(
      Math.abs(p[k] - (a[k] + b[k]) / 2) < 1e-12,
      `${k} is not additive`,
    );
});

/*
 * The angle locus wraps, and a plain average is WRONG at the wrap: two parents
 * either side of +/-pi would produce an offspring pointing the opposite way
 * from both of them, which is not blending, it is a third phenotype invented by
 * an arithmetic bug.
 */
test("the angle locus blends across the +/-pi wrap", () => {
  const m = I.meanAngle(3.0, -3.0);
  assert.ok(
    Math.abs(Math.abs(m) - Math.PI) < 0.15,
    `expected a mean near +/-pi, got ${m}`,
  );
  assert.ok(
    Math.abs(I.meanAngle(0.2, 0.4) - 0.3) < 1e-9,
    "ordinary case moved",
  );
});

/* ------------------------------------------------------------- inheritance */

test("with mutation off every gamete allele comes from a parent", () => {
  const rng = E.makeRng(4);
  const ind = I.randomIndividual(rng);
  for (let t = 0; t < 40; t++) {
    const g = I.gamete(ind, rng, 0);
    for (const k of I.ALL_KEYS)
      assert.ok(
        Math.abs(g[k] - ind.h1[k]) < 1e-9 || Math.abs(g[k] - ind.h2[k]) < 1e-9,
        `locus ${k} produced an allele neither parent carried`,
      );
  }
});

test("loci segregate independently and about evenly", () => {
  const rng = E.makeRng(5);
  const ind = I.randomIndividual(rng);
  const from1 = Object.fromEntries(I.ALL_KEYS.map((k) => [k, 0]));
  const T = 2000;
  for (let t = 0; t < T; t++) {
    const g = I.gamete(ind, rng, 0);
    for (const k of I.ALL_KEYS)
      if (Math.abs(g[k] - ind.h1[k]) < 1e-9) from1[k]++;
  }
  for (const k of I.ALL_KEYS) {
    const f = from1[k] / T;
    assert.ok(f > 0.4 && f < 0.6, `locus ${k} segregated ${f}, not ~0.5`);
  }
});

test("mutation actually moves alleles", () => {
  const rng = E.makeRng(6);
  const ind = I.randomIndividual(rng);
  const g = I.gamete(ind, rng, 0.3);
  const moved = I.ALL_KEYS.filter(
    (k) =>
      Math.abs(g[k] - ind.h1[k]) > 1e-9 && Math.abs(g[k] - ind.h2[k]) > 1e-9,
  );
  assert.ok(moved.length > 0, "mutation at rate 0.3 changed nothing");
});

/* ------------------------------------------------- the bimodality statistic */

/*
 * A statistic that cannot tell one cloud from two would make the whole
 * experiment unfalsifiable in the direction it actually reports.
 */
test("two clouds score far above one", () => {
  const one = [];
  const two = [];
  const rng = E.makeRng(7);
  for (let i = 0; i < 40; i++) {
    one.push({ s: 0.5 + 0.02 * (rng() - 0.5), phi: 0.1 * (rng() - 0.5) });
    two.push(
      i % 2
        ? { s: 0.2 + 0.01 * (rng() - 0.5), phi: -2.0 + 0.05 * (rng() - 0.5) }
        : { s: 0.8 + 0.01 * (rng() - 0.5), phi: 2.0 + 0.05 * (rng() - 0.5) },
    );
  }
  const a = I.twoClusterSeparation(one);
  const b = I.twoClusterSeparation(two);
  assert.ok(a && b, "statistic returned null on a populated cloud");
  assert.ok(
    b.separation > 3 * a.separation,
    `two clouds ${b.separation} must clearly beat one ${a.separation}`,
  );
  assert.ok(
    b.minorityFrac > 0.35,
    `an even split must report a large minority, got ${b.minorityFrac}`,
  );
});

test("spread is zero for identical placements and positive otherwise", () => {
  const same = new Array(10).fill({ s: 0.4, phi: 0.3 });
  assert.ok(I.spreadOf(same) < 1e-9, "identical placements reported a spread");
  const spreadOut = [
    { s: 0.1, phi: 0 },
    { s: 0.9, phi: 2 },
    { s: 0.5, phi: -1 },
  ];
  assert.ok(
    I.spreadOf(spreadOut) > 0.1,
    "a scattered cloud reported no spread",
  );
});

/* ---------------------------------------------------------------- plumbing */

test("a founded population is one lineage, not a random assortment", () => {
  const rng = E.makeRng(8);
  const founded = I.foundPopulation(30, rng, { spread: 0.02 });
  const random = Array.from({ length: 30 }, () => I.randomIndividual(rng));
  const spreadOf = (pop) => {
    const vals = pop.map((i) => I.phenotype(i).antherT);
    const m = vals.reduce((a, b) => a + b, 0) / vals.length;
    return Math.sqrt(
      vals.reduce((s, x) => s + (x - m) * (x - m), 0) / vals.length,
    );
  };
  assert.ok(
    spreadOf(founded) < spreadOf(random),
    "a founded population must be tighter than a random one",
  );
});

test("a generation returns a population of the same size", () => {
  const rng = E.makeRng(9);
  const pop = I.foundPopulation(12, rng, { spread: 0.05 });
  const out = I.step(pop, { ...I.DEFAULTS, siteN: 40, visits: 4000 }, rng, 0);
  assert.strictEqual(out.pop.length, pop.length, "population size drifted");
  assert.ok(out.spread >= 0, "spread must be defined");
});
