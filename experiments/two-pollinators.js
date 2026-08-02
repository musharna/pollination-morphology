/*
 * What breaks the symmetry? — testing pollinator heterogeneity.
 *
 * Roadmap B, third step, at the central question.
 *
 * WHERE THIS COMES FROM. Placement selection in a panmictic population is
 * stabilising (-48.9% +/- 16.2pp; spread collapses 12.6x with mutation off), and
 * placement inheritance BLENDS (detour 1.01, transgressives 2%). Hybrids pay
 * 19.1%, so reinforcement has something to act on — but reinforcement cannot
 * start until divergence starts, and nothing has yet made divergence pay.
 *
 * Adding "assortative mating" is not the answer on its own: mating here is
 * ALREADY assortative by placement — the transfer matrix IS placement matching.
 * Assortment on a trait whose payoff rises with commonness produces conformity.
 * A rare placement has to be WORTH something first.
 *
 * THE HYPOTHESIS. Pollinator heterogeneity. A plant visited by two animals with
 * different geometry faces two placement optima and the resident is a
 * compromise; a morph specialising on one animal may beat the compromise there
 * by more than it loses elsewhere. This is the documented route to
 * pollination-syndrome divergence and needs no new mechanism, only a second
 * animal.
 *
 * ⚠️⚠️ HOW THIS EXPERIMENT WAS FIRST BUILT, AND WHY THAT WAS USELESS.
 * The first version measured invasion fitness of ONE rare mutant against 20
 * identical resident clones. It returned 0% invaders everywhere, under one
 * animal and two, at every body-plan separation — a beautifully uniform null.
 * It was an artefact of the readout. With 20 identical residents, a resident is
 * perfectly matched to 19 partners while the mutant is at best partially matched
 * to 20, so relative fitness is bounded near N/(N-1) and "the mutant wins" can
 * essentially never happen no matter what the biology does. The positive control
 * — a deliberately mediocre resident, which mutants MUST be able to beat — also
 * returned 0%, which is what exposed it. Without that control the null would
 * have been written up as a fact about pollinators.
 *
 * WHAT IS MEASURED NOW: FREQUENCY DEPENDENCE, which is the actual question.
 * The same morph is measured at two frequencies in the same population, RARE and
 * COMMON. Quality is held constant by construction because it is the same
 * genome, so the ratio isolates the frequency effect:
 *
 *   rare/common  < 1   positive frequency dependence — being common pays,
 *                      the population converges (the panmictic result)
 *   rare/common  > 1   NEGATIVE frequency dependence — a rare placement gains,
 *                      which is what disruptive selection needs
 *
 * ⚠️ CALIBRATION CONTROL: a morph IDENTICAL to the resident must score 1.00,
 * because there is then no difference for frequency to act on. Any departure is
 * bias in the readout rather than biology.
 *
 * Pollen is carried on a body, so a grain picked up from animal A can only be
 * delivered by animal A: the two-pollinator arm is two SEPARATE bouts summed,
 * never one mixed bout.
 */

const P = require("../sim/placement.js");
const C = require("../sim/carryover.js");
const E = require("../sim/evolve.js");

const rule = (s) => console.log("\n" + s + "\n" + "-".repeat(s.length));
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

function meanPlacement(hits) {
  if (!hits.length) return null;
  let cs = 0,
    sn = 0;
  for (const h of hits) {
    cs += Math.cos(h.phi);
    sn += Math.sin(h.phi);
  }
  return { s: mean(hits.map((h) => h.s)), phi: Math.atan2(sn, cs) };
}
const dist = (a, b) => C.bodyDist({ s: a.s, phi: a.phi }, b.s, b.phi);

/* Body plans built as experiments/checks.js builds them. */
const scaleBee = (k, lenK) => ({
  bodyLen: 1.75 * lenK,
  regions: P.DEFAULT_BEE.regions.map((r) => ({
    ...r,
    r0: r.r0 * k,
    r1: r.r1 * k,
  })),
  reach: P.DEFAULT_BEE.reach,
});
const BEE_A = scaleBee(0.65, 0.8); // small slender
const BEE_B = scaleBee(1.35, 1.15); // large robust

const build = (g, bee, seed) => C.siteSet(E.toFlower(g), bee, { n: 130, seed });
const viable = (s) => s.anther.length && s.stigma.length;

/*
 * Per-capita mating success of the FOCAL morph in a population that is `nFocal`
 * focal plants and `nOther` residents, summed over both sex roles and over every
 * pollinator (separate bouts, summed).
 */
function focalPerCapita(focalG, resG, nFocal, nOther, bees, tag) {
  const n = nFocal + nOther;
  const sitesPerBee = bees.map((bee, bi) => {
    const ss = [];
    for (let i = 0; i < nFocal; i++)
      ss.push(build(focalG, bee, tag + bi * 1000 + i));
    for (let i = 0; i < nOther; i++)
      ss.push(build(resG, bee, tag + bi * 1000 + 500 + i));
    return ss;
  });
  /* A morph that cannot contact a given animal simply earns nothing through it;
   * runBout already skips visits to a plant with no sites. Requiring viability
   * on EVERY animal would exclude the specialists this experiment is about. */
  if (!sitesPerBee.some((ss) => ss.every(viable))) return null;

  let focal = 0;
  for (const sites of sitesPerBee) {
    const r = C.runBout(sites, new Array(n).fill(1 / n), {
      visits: 20000,
      seed: 13,
    });
    for (let i = 0; i < nFocal; i++)
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        focal += r.T[i][j] + r.T[j][i];
      }
  }
  return focal / nFocal;
}

/*
 * The frequency-dependence statistic. Same genome, two frequencies, same total
 * population size — so nothing but frequency differs.
 */
function freqDependence(focalG, resG, bees, tag) {
  const N = 24;
  const rare = focalPerCapita(focalG, resG, 4, N - 4, bees, tag);
  const common = focalPerCapita(focalG, resG, N - 4, 4, bees, tag + 7);
  if (!rare || !common || !(common > 0)) return null;
  return rare / common;
}

function sweep(label, bees, resG, rng, nMut = 34) {
  const rows = [];
  for (let k = 0; k < nMut; k++) {
    const rate = 0.15 + 1.35 * (k / nMut);
    const mg = E.mutate(resG, rng, rate);
    const ms = bees.map((bee, bi) => build(mg, bee, 6000 + bi * 300 + k));
    if (!ms.some(viable)) continue;
    const ref = ms.findIndex(viable);
    const rs = build(resG, bees[ref], 100 + ref);
    if (!viable(rs)) continue;
    const d = dist(meanPlacement(ms[ref].anther), meanPlacement(rs.anther));
    const f = freqDependence(mg, resG, bees, 30000 + k * 40);
    if (f === null) continue;
    rows.push({ d, f });
  }
  if (!rows.length) return null;
  rows.sort((a, b) => a.d - b.d);
  const BINS = 4;
  const per = Math.floor(rows.length / BINS);
  const binned = [];
  console.log(`  ${label}   (n=${rows.length} morphs)`);
  console.log("    placement distance    rare/common per-capita success");
  for (let b = 0; b < BINS; b++) {
    const sl = rows.slice(
      b * per,
      b === BINS - 1 ? rows.length : (b + 1) * per,
    );
    const m = mean(sl.map((x) => x.f));
    binned.push(m);
    console.log(
      `    ${mean(sl.map((x) => x.d))
        .toFixed(2)
        .padStart(17)}    ${m.toFixed(3).padStart(28)}`,
    );
  }
  const neg = rows.filter((r) => r.f > 1).length / rows.length;
  console.log(
    `    -> morphs with a RARE ADVANTAGE (>1): ${(100 * neg).toFixed(0)}%\n`,
  );
  return { binned, neg, rows };
}

function pickResident(seed, bees) {
  const rng = E.makeRng(seed);
  let best = null;
  for (let i = 0; i < 300; i++) {
    const g = E.randomGenome(rng);
    const ss = bees.map((bee, bi) => build(g, bee, 100 + bi * 400 + i));
    if (!ss.every(viable)) continue;
    const score = Math.min(...ss.map((s) => s.contactRate));
    if (!best || score > best.score) best = { g, score, ss };
  }
  return best;
}

// ==========================================================================
const res = pickResident(5, [BEE_A, BEE_B]);
console.log(
  `\n  resident: contact ${res.ss[0].contactRate.toFixed(2)} on the small animal, ` +
    `${res.ss[1].contactRate.toFixed(2)} on the large one`,
);

rule("CALIBRATION CONTROL — an identical morph must score 1.00");
console.log(
  "  Same genome as the resident, so there is no difference for frequency to act\n" +
    "  on. Anything far from 1.00 is bias in the readout, not biology.\n",
);
for (const [label, bees] of [
  ["one pollinator", [BEE_A]],
  ["two pollinators", [BEE_A, BEE_B]],
]) {
  const f = freqDependence(res.g, res.g, bees, 90000);
  console.log(`  ${label.padEnd(20)} rare/common = ${f.toFixed(3)}`);
}

rule("A — one pollinator: the known answer");
console.log(
  "  The panmictic result says this must come out BELOW 1 — being common pays.\n",
);
const rngA = E.makeRng(77);
const oneA = sweep("single pollinator (small slender)", [BEE_A], res.g, rngA);

rule("B — two pollinators: does a rare specialist gain?");
console.log(
  "  If pollinator heterogeneity breaks the symmetry, some morph should show a\n" +
    "  rare advantage here that it does not show under one animal.\n",
);
const rngB = E.makeRng(77);
const twoB = sweep("two pollinators, 50/50", [BEE_A, BEE_B], res.g, rngB);

rule("C — how far apart must the two animals be?");
console.log("  second animal                        rare-advantage morphs");
for (const [k, lenK] of [
  [0.7, 0.85],
  [1.35, 1.15],
  [2.2, 1.6],
  [3.5, 2.4],
]) {
  const other = scaleBee(k, lenK);
  const lr = pickResident(5, [BEE_A, other]);
  const tag = `${k}x radius, ${lenK}x length`;
  if (!lr) {
    console.log(`  ${tag.padEnd(36)} no viable resident`);
    continue;
  }
  const saved = console.log;
  console.log = () => {};
  const r = sweep("", [BEE_A, other], lr.g, E.makeRng(77), 22);
  console.log = saved;
  console.log(
    `  ${tag.padEnd(36)} ${r ? (100 * r.neg).toFixed(0) + "%" : "n/a"}`,
  );
}

rule("VERDICT");
if (oneA && twoB) {
  console.log(
    `  one pollinator : ${(100 * oneA.neg).toFixed(0)}% of morphs gain when rare` +
      `   (far bin ${oneA.binned[3].toFixed(3)})`,
  );
  console.log(
    `  two pollinators: ${(100 * twoB.neg).toFixed(0)}% of morphs gain when rare` +
      `   (far bin ${twoB.binned[3].toFixed(3)})`,
  );
  console.log(
    twoB.neg > oneA.neg + 0.1
      ? "\n  Pollinator heterogeneity creates a rare advantage that a single animal\n" +
          "  does not. That is a symmetry-breaker this model reaches with no new\n" +
          "  mechanism — only a second pollinator."
      : "\n  ⚠️ No rare advantage appears under two pollinators either. Within the body\n" +
          "  plans reachable here, pollinator heterogeneity ALONE does not break the\n" +
          "  symmetry, and roadmap B needs a different source.",
  );
}
console.log();
