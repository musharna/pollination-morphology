/*
 * Flowering time — the one assortment axis independent of placement.
 *
 * ⚠️ THE INVARIANT FIRST. This project's central rule is that placement is
 * never a gene, and the way that rule dies is by a NEW locus quietly reaching
 * the contact model. The advertisement has a test for exactly this; the bloom
 * locus needs the same one, because "the population split on placement" would
 * be a statement about a flowering-time gene if it did not hold.
 *
 * Then the positive controls, because the mechanism can be present as a
 * parameter and absent as an effect: a flowering window wide enough that
 * everything overlaps everything leaves the arms differing in a setting and in
 * nothing else.
 */

const test = require("node:test");
const assert = require("node:assert");

const I = require("../sim/ibm.js");
const E = require("../sim/evolve.js");

const mean = (xs) =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;

function fixture(n, seed) {
  const built = I.foundTwoLineages(
    n,
    E.makeRng(seed),
    I.signalRng(seed),
    8,
    I.DEFAULTS,
  );
  assert.ok(built, `fixture failed at seed ${seed}`);
  return built.pop;
}

/* --------------------------------- 1. THE INVARIANT: bloom is not shape */

test("two plants differing only in flowering time have identical placements", () => {
  const pop = fixture(6, 3);
  const a = pop[0];
  const b = {
    anc: a.anc,
    h1: { ...a.h1, [I.BLOOM_GENE]: 0.05 },
    h2: { ...a.h2, [I.BLOOM_GENE]: 0.11 },
  };
  const c = {
    anc: a.anc,
    h1: { ...a.h1, [I.BLOOM_GENE]: 0.83 },
    h2: { ...a.h2, [I.BLOOM_GENE]: 0.91 },
  };
  assert.deepStrictEqual(
    I.shapeOf(b),
    I.shapeOf(c),
    "flowering time reached the shape — placement would be a bloom gene",
  );
  /*
   * ⚠️ SAME INDEX, TWO POPULATIONS — not two indices in one. `sitesOf` seeds
   * each plant's site sampling from its POSITION IN THE ARRAY, so plants 0 and
   * 1 draw different samples whatever their genomes are. The first version of
   * this test compared index 0 against index 1 and failed on that alone: it
   * could not have distinguished "bloom reaches the geometry" from "these are
   * different array slots", which means it could not have tested the invariant
   * it is named after.
   */
  const sb = I.sitesOf([b], I.DEFAULTS, 0);
  const sc = I.sitesOf([c], I.DEFAULTS, 0);
  assert.deepStrictEqual(
    I.placementOf(sb[0]),
    I.placementOf(sc[0]),
    "flowering time moved where the pollen lands",
  );

  /* the positive control: this comparison CAN fail. A genuine shape change at
   * the same index must move the placement, or the assertion above is vacuous. */
  const d = {
    anc: a.anc,
    h1: { ...a.h1, antherT: (a.h1.antherT + 0.35) % 1 },
    h2: { ...a.h2, antherT: (a.h2.antherT + 0.35) % 1 },
  };
  const sd = I.sitesOf([d], I.DEFAULTS, 0);
  assert.notDeepStrictEqual(
    I.placementOf(sb[0]),
    I.placementOf(sd[0]),
    "a real shape change did not move the placement — the comparison above " +
      "cannot detect anything",
  );
});

/* ------------------------------------------ 2. off changes nothing at all */

test("phenology:null leaves the generation bit-identical", () => {
  const pop = fixture(20, 5);
  const a = I.step(pop, I.DEFAULTS, E.makeRng(5), 0, I.signalRng(5));
  const b = I.step(
    pop,
    { ...I.DEFAULTS, phenology: null },
    E.makeRng(5),
    0,
    I.signalRng(5),
  );
  assert.deepStrictEqual(b.pop, a.pop, "an explicit null phenology moved it");
  assert.equal(a.bloomAssort, null, "assortment reported with phenology off");
  assert.ok(
    a.pop.every((ind) => ind.h1[I.BLOOM_GENE] === undefined),
    "a bloom allele was created in a model with no season",
  );
});

/* ------- 3. POSITIVE CONTROL: a narrow season really does assort pollen */

test("a narrow flowering window assorts pollen by time; a full one does not", () => {
  const measure = (width, seed) => {
    const pop = fixture(26, seed);
    const res = I.step(
      pop,
      { ...I.DEFAULTS, phenology: { width, slices: 8 } },
      E.makeRng(seed),
      0,
      I.signalRng(seed),
      I.bloomRng(seed),
    );
    return res.bloomAssort;
  };

  const narrow = [3, 4, 5]
    .map((s) => measure(0.12, s))
    .filter((x) => x != null);
  /* ⚠️ THE POSITIVE CONTROL FOR THE STATISTIC. At width 1.0 every plant is in
   * flower in every slice, so the season cannot assort anything and the ratio
   * must sit at 1. Without this arm a broken statistic that always returned a
   * small number would read as "phenology works". */
  const full = [3, 4, 5].map((s) => measure(1.0, s)).filter((x) => x != null);

  assert.ok(narrow.length && full.length, "nothing measurable");
  const N = mean(narrow),
    F = mean(full);
  assert.ok(
    Math.abs(F - 1) < 0.1,
    `a season everything flowers through reported assortment ${F.toFixed(3)} — ` +
      `the statistic is detecting something other than temporal overlap`,
  );
  assert.ok(
    N < 0.8,
    `a narrow season did not assort pollen by flowering time: ${N.toFixed(3)} ` +
      `against ${F.toFixed(3)} — the intervention did not land`,
  );
});

/* --------------------------- 4. the supergene arm actually links, and the
 *                                free arm actually does not */

test("linkBloom co-segregates bloom with the anther loci; free recombination does not", () => {
  /* One doubly heterozygous parent, with distinguishable alleles at an anther
   * locus and at bloom. Whether a gamete is RECOMBINANT is then readable
   * directly, which is a far sharper test than watching LD decay in a run. */
  const base = E.randomGenome(E.makeRng(2));
  const ind = {
    h1: { ...base, antherT: 0.2, signal: 0.1, [I.BLOOM_GENE]: 0.1 },
    h2: { ...base, antherT: 0.8, signal: 0.9, [I.BLOOM_GENE]: 0.9 },
  };

  const recombinantRate = (linkBloom) => {
    const rng = E.makeRng(17);
    const brng = I.bloomRng(17);
    let rec = 0;
    const N = 400;
    for (let k = 0; k < N; k++) {
      /* mutation off, so an allele's ORIGIN is still readable after mutation */
      const g = I.gamete(ind, rng, 0, {
        bloom: true,
        brng,
        bloomMut: 0,
        linkBloom,
        srng: I.signalRng(17),
      });
      const fromH1Anther =
        Math.abs(g.antherT - 0.2) < Math.abs(g.antherT - 0.8);
      const fromH1Bloom =
        Math.abs(g[I.BLOOM_GENE] - 0.1) < Math.abs(g[I.BLOOM_GENE] - 0.9);
      if (fromH1Anther !== fromH1Bloom) rec++;
    }
    return rec / N;
  };

  const linked = recombinantRate(true);
  const free = recombinantRate(false);

  assert.equal(
    linked,
    0,
    `the supergene arm produced ${(linked * 100).toFixed(1)}% recombinants — ` +
      `it is not a linkage group`,
  );
  /* the positive control: free recombination must actually recombine, or
   * "linked" above would be trivially true of both arms */
  assert.ok(
    Math.abs(free - 0.5) < 0.08,
    `free recombination gave ${free.toFixed(3)} recombinants, not ~0.5 — the ` +
      `two arms are not the contrast this test claims`,
  );
});

/* ---------------------------------------- 5. the locus is actually heritable */

test("flowering time is inherited rather than redrawn each generation", () => {
  const pop = fixture(24, 8);
  const opts = { ...I.DEFAULTS, phenology: { width: 0.25, slices: 8, mut: 0 } };
  const rng = E.makeRng(8);
  const srng = I.signalRng(8);
  const brng = I.bloomRng(8);

  const first = I.step(pop, opts, rng, 0, srng, brng);
  const parents = first.blooms.slice().sort((a, b) => a - b);
  const kids = I.step(first.pop, opts, rng, 1, srng, brng).blooms;

  /* ⚠️ NOT a correlation across index — offspring are not aligned with
   * parents. With mutation off, every allele in the child generation must have
   * come from SOME parent, so each child's bloom must sit near a parental
   * value. A redrawn locus would scatter uniformly and fail this. */
  const nearest = kids.map((b) =>
    Math.min(...parents.map((p) => I.ringDist(p, b))),
  );
  assert.ok(
    mean(nearest) < 0.05,
    `offspring flowering times are not drawn from the parents (mean distance ` +
      `${mean(nearest).toFixed(3)}) — the locus is being redrawn, not inherited`,
  );
});

/* ------------------------- 6. the confound arm: shuffleBloom does what it says */

/*
 * ⚠️ THE ARM EXISTS TO HOLD POOL SIZE FIXED WHILE DESTROYING HERITABILITY, so
 * both halves of that sentence get a test. A permutation that quietly changed
 * how many plants are in flower would make the confound arm differ from its
 * control in the very thing it is supposed to hold constant.
 */
test("shuffleBloom preserves the multiset of flowering times exactly", () => {
  const pop = fixture(24, 11);
  const base = { width: 0.12, slices: 8, mut: 0.02 };
  const plain = I.step(
    pop,
    { ...I.DEFAULTS, phenology: base },
    E.makeRng(5),
    0,
    I.signalRng(5),
    I.bloomRng(5),
  );
  const shuf = I.step(
    pop,
    { ...I.DEFAULTS, phenology: { ...base, shuffleBloom: true } },
    E.makeRng(5),
    0,
    I.signalRng(5),
    I.bloomRng(5),
  );

  const sorted = (xs) => xs.slice().sort((a, b) => a - b);
  assert.deepStrictEqual(
    sorted(shuf.blooms).map((x) => x.toFixed(9)),
    sorted(plain.blooms).map((x) => x.toFixed(9)),
    "shuffleBloom changed WHICH flowering times exist, not just who holds them — " +
      "the per-slice pool size is no longer held fixed and the arm is confounded " +
      "with the thing it controls for",
  );
});

test("shuffleBloom destroys the bloom-lineage association, and the control can see it", () => {
  const base = { width: 0.12, slices: 8, mut: 0.02 };

  /* run several generations so heritable bloom has time to cluster within a
   * lineage — one generation from a fresh founding is not a test of heritability */
  const evolve = (shuffle) => {
    const opts = {
      ...I.DEFAULTS,
      phenology: shuffle ? { ...base, shuffleBloom: true } : base,
    };
    const rng = E.makeRng(7);
    const srng = I.signalRng(7);
    const brng = I.bloomRng(7);
    let pop = fixture(30, 7);
    const seen = [];
    for (let g = 0; g < 12; g++) {
      if (pop.length < 2) break;
      const res = I.step(pop, opts, rng, g, srng, brng);
      if (res.bloomLineage != null) seen.push(res.bloomLineage);
      pop = res.pop;
    }
    return seen;
  };

  const heritable = evolve(false);
  const shuffled = evolve(true);
  assert.ok(
    heritable.length > 3 && shuffled.length > 3,
    "not enough generations retained ancestry variation to measure association",
  );

  const h = mean(heritable);
  const s = mean(shuffled);

  /* ⚠️ THE POSITIVE CONTROL. Below 1 means plants of the same lineage flower
   * closer together than chance. If the heritable arm does not sit below 1 there
   * is no association to destroy and the negative below would be vacuous. */
  assert.ok(
    h < 0.97,
    `heritable bloom shows NO lineage association (${h.toFixed(3)}), so this ` +
      `test cannot demonstrate that shuffling removes one`,
  );
  /* and the manipulation itself */
  assert.ok(
    s > h,
    `shuffleBloom did not weaken the bloom-lineage association ` +
      `(heritable ${h.toFixed(3)} vs shuffled ${s.toFixed(3)}) — the arm is not ` +
      `doing what the experiment will claim it does`,
  );
});

test("with a WIDE season, shuffleBloom is a no-op down to the last bit", () => {
  /*
   * ⚠️ THE STREAM-ALIGNMENT TEST, AND MY FIRST VERSION OF IT COULD NOT PASS.
   * It counted bloom-stream draws through a whole step and demanded the shuffled
   * arm equal its control. But once the permutation changes WHO is in flower the
   * bout changes, the recruits change, and gamete() is called a different number
   * of times — so the counts diverge for a legitimate reason. The test asserted
   * a condition that can only hold if the mechanism does nothing, which would
   * have made a working arm look broken. It failed at 179 draws against 181.
   *
   * The invariant that IS available: at width 1.0 every plant is in flower in
   * every slice whatever its schedule, so permuting the schedules cannot change
   * who can exchange pollen with whom. If the permutation is drawn in both modes
   * the two must then agree BIT FOR BIT — and if it were drawn only when the
   * flag is set, the streams would be off by n-1 draws and the populations would
   * visibly diverge. So this tests the alignment through its consequence.
   */
  const wide = { width: 1.0, slices: 8, mut: 0.02 };

  /*
   * ⚠️⚠️ A FRESH FIXTURE PER ARM, BECAUSE `step` MUTATES THE POPULATION IT IS
   * GIVEN. Founders arrive with no bloom allele and step ASSIGNS one in place,
   * drawing 2n values from the bloom stream to do it. Run two arms off the SAME
   * `pop` object and the first call pays that cost while the second finds the
   * alleles already present and skips it — so the arms are offset in the stream
   * before the mechanism under test has done anything, and they diverge for a
   * reason with no biology in it. This test failed exactly that way, and the
   * failure looked like "the permutation is not stream-aligned" when the real
   * cause was a shared fixture.
   */
  const run = (phen) =>
    I.step(
      fixture(20, 13),
      { ...I.DEFAULTS, phenology: phen },
      E.makeRng(4),
      0,
      I.signalRng(4),
      I.bloomRng(4),
    );

  const plain = run(wide);
  const shuf = run({ ...wide, shuffleBloom: true });

  assert.deepStrictEqual(
    shuf.pop,
    plain.pop,
    "at width 1.0 nothing is ever out of flower, so a permutation of the " +
      "schedules must be invisible — a difference here means the two arms are " +
      "walking the bloom stream differently, not modelling different biology",
  );

  /* ⚠️ AND THE NEGATIVE NEEDS A POSITIVE CONTROL IN THE SAME TEST: if the
   * fixture were degenerate — every bloom identical — the permutation would be
   * trivially invisible and the assertion above would pass on a broken build. */
  const spread = Math.max(...plain.blooms) - Math.min(...plain.blooms);
  assert.ok(
    spread > 0.1,
    `the flowering times are nearly identical (spread ${spread.toFixed(3)}), so ` +
      `permuting them is vacuous and the bit-identity above proves nothing`,
  );
});
