/*
 * Is placement selection in ONE panmictic population really convergent?
 *
 * WHY THIS EXISTS. `sim/evolve.js` opens with a claim that has been load-bearing
 * since v1 was designed, and it has never been measured:
 *
 *   "In a single panmictic population, selection on placement is POSITIVELY
 *    frequency-dependent — matching the majority maximises mating success — so
 *    it converges rather than diverges, and no amount of running produces
 *    speciation."
 *
 * Two things rest on it. First, it is why the evolution loop starts with many
 * species already distinct instead of one population that splits. Second, it is
 * the entire framing of roadmap item B: if placement selection converges, then
 * something ELSE must break the symmetry, and B goes looking for that something.
 * If the claim is false — if placement selection is disruptive under some
 * conditions reachable by this model — then B is asking the wrong question.
 *
 * A claim in a comment is a hypothesis. This measures it.
 *
 * THE MEASUREMENT. One panmictic population of individuals, each with its own
 * shape genome and therefore its own computed placement. Transfer is counted
 * between INDIVIDUALS rather than species, so mating success is per plant.
 * Fitness is then regressed on how far an individual's placement sits from the
 * population mean:
 *
 *   fitness falls with deviation      -> STABILISING, the claim holds
 *   fitness flat                      -> drift, no placement selection at all
 *   fitness rises at the extremes     -> DISRUPTIVE, the claim is false
 *
 * ⚠️ THE CONTROL IS NOT OPTIONAL. A harness that can only ever report
 * "stabilising" would produce the expected answer for the wrong reason, and the
 * expected answer is exactly the one that would go unquestioned. So part B
 * builds a population that is disruptive BY CONSTRUCTION and requires the same
 * harness to say so. A negative result is worth nothing without it.
 */

const P = require("../sim/placement.js");
const C = require("../sim/carryover.js");
const E = require("../sim/evolve.js");

const bee = P.DEFAULT_BEE;
const rule = (s) => console.log("\n" + s + "\n" + "-".repeat(s.length));
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

/* Circular mean for the around-body angle; a plain mean is wrong at the wrap
 * and would place an individual straddling +/-pi at zero. */
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

/* Same body metric the transfer model uses, so "deviation" is measured in the
 * units that actually decide whether two plants exchange pollen. */
const deviation = (a, b) => C.bodyDist({ s: a.s, phi: a.phi }, b.s, b.phi);

/*
 * One panmictic population. Every individual is handed to runBout as its own
 * entry, so T[i][j] is grains from plant i reaching plant j — mating success
 * per PLANT rather than per species, which is what a within-population question
 * requires.
 */
function popFitness(sites, opts = {}) {
  const n = sites.length;
  const r = C.runBout(sites, new Array(n).fill(1 / n), {
    visits: 30000,
    seed: 5,
    ...opts,
  });
  const male = new Array(n).fill(0),
    female = new Array(n).fill(0);
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      if (i === j) continue; // outcrossed siring only; selfing is not mating success
      male[i] += r.T[i][j];
      female[j] += r.T[i][j];
    }
  return { male, female, total: male.map((m, i) => m + female[i]), raw: r };
}

/* Fitness against deviation from the population mean placement, binned. */
function gradient(sites, label) {
  const place = sites.map((s) => meanPlacement(s.anther));
  const ok = place.map((p, i) => (p ? i : -1)).filter((i) => i >= 0);
  const centre = meanPlacement(ok.flatMap((i) => sites[i].anther));
  const { total } = popFitness(sites);
  const rows = ok.map((i) => ({
    d: deviation(place[i], centre),
    f: total[i],
  }));
  rows.sort((a, b) => a.d - b.d);

  const BINS = 5;
  const per = Math.floor(rows.length / BINS);
  const binned = [];
  for (let b = 0; b < BINS; b++) {
    const slice = rows.slice(
      b * per,
      b === BINS - 1 ? rows.length : (b + 1) * per,
    );
    binned.push({
      d: mean(slice.map((x) => x.d)),
      f: mean(slice.map((x) => x.f)),
      n: slice.length,
    });
  }
  console.log(`  ${label}`);
  console.log("    deviation from mean placement   mean mating success");
  for (const b of binned)
    console.log(
      `    ${b.d.toFixed(3).padStart(22)}   ${b.f.toFixed(1).padStart(19)}  (n=${b.n})`,
    );

  const first = binned[0].f,
    last = binned[binned.length - 1].f;
  /*
   * ⚠️ The x-axis here is |deviation from the population mean|, NOT the trait.
   * That changes what each shape means, and getting it wrong is what control 2
   * caught on the first run: this originally looked for a U with an INTERIOR
   * minimum, which is the signature on a TRAIT axis. On a deviation axis the
   * population mean has been folded onto x = 0, so disruptive selection —
   * "the mean is the worst place to be" — appears as fitness RISING with
   * deviation, with the minimum in the FIRST bin. The by-construction
   * disruptive control was reported as an unnamed "rises with deviation"
   * because of it.
   */
  const verdict =
    last > first * 1.05
      ? "DISRUPTIVE (mean is the worst place to be)"
      : last < first * 0.95
        ? "STABILISING (falls with deviation)"
        : "FLAT (no detectable placement selection)";
  console.log(`    -> ${verdict}\n`);
  return { binned, verdict, slope: (last - first) / first };
}

// ==========================================================================
// A — a real morphological population
// ==========================================================================
function realPop(seed, N = 40) {
  const rng = E.makeRng(seed);
  /* Drawn around a common centre and then mutated hard, so this is ONE
   * population with standing variation rather than a random assortment — the
   * claim under test is about a population, not about arbitrary shapes. */
  const centre = E.randomGenome(rng);
  const genomes = [];
  for (let i = 0; i < N; i++) genomes.push(E.mutate(centre, rng, 1.0));
  return genomes
    .map((g, i) =>
      C.siteSet(E.toFlower(g), bee, { n: 160, seed: seed * 7 + i }),
    )
    .filter((s) => s.anther.length && s.stigma.length);
}

function partA() {
  rule("A — one panmictic population of real morphologies");
  console.log(
    "  One population is one draw. The gradient is measured across independent\n" +
      "  populations, because a single 6% decline over five bins of six plants is\n" +
      "  noise until it is shown to repeat.\n",
  );
  const live = realPop(17);
  console.log(`  first population: ${live.length} individuals make contact\n`);
  gradient(live, "real morphological variation (seed 17)");

  const SEEDS = [17, 31, 53, 79, 101, 137, 163, 191];
  const slopes = [];
  for (const s of SEEDS) {
    const pop = realPop(s);
    if (pop.length < 20) continue;
    slopes.push(gradientQuiet(pop));
  }
  const m = mean(slopes);
  const sd = Math.sqrt(
    slopes.reduce((a, x) => a + (x - m) * (x - m), 0) / (slopes.length - 1),
  );
  const half = (2.365 * sd) / Math.sqrt(slopes.length); // t, df = n-1 = 7
  console.log(
    `  across ${slopes.length} independent populations, fitness change from the\n` +
      `  closest bin to the furthest: ${(100 * m).toFixed(1)}% +/- ${(100 * half).toFixed(1)}pp (95% CI)\n` +
      `  per-population: ${slopes.map((x) => (100 * x).toFixed(0) + "%").join(" ")}\n`,
  );
  const sig = m + half < 0 ? "STABILISING" : m - half > 0 ? "DISRUPTIVE" : null;
  console.log(
    sig
      ? `  -> ${sig}: the interval excludes zero.`
      : "  -> ⚠️ THE INTERVAL INCLUDES ZERO. On this evidence placement selection in a\n" +
          "     panmictic population is NOT detectably directional either way, which is\n" +
          "     not the same as the convergence sim/evolve.js asserts.",
  );
}

/* Same computation, no printing — for replication. */
function gradientQuiet(sites) {
  const place = sites.map((s) => meanPlacement(s.anther));
  const centre = meanPlacement(sites.flatMap((s) => s.anther));
  const { total } = popFitness(sites);
  const rows = sites
    .map((_, i) => ({ d: deviation(place[i], centre), f: total[i] }))
    .sort((a, b) => a.d - b.d);
  const per = Math.floor(rows.length / 5);
  const f0 = mean(rows.slice(0, per).map((x) => x.f));
  const f1 = mean(rows.slice(4 * per).map((x) => x.f));
  return (f1 - f0) / f0;
}

// ==========================================================================
// B — THE CONTROL. A population that is disruptive by construction.
// ==========================================================================
/*
 * Placement is set directly here rather than derived from shape. That is
 * deliberate and is not a violation of the project's standing constraint: this
 * is not a model of anything, it is a CALIBRATION TARGET with a known right
 * answer. Two tight clusters on opposite sides of the body cannot exchange
 * pollen, so an individual sitting between them mates with nobody and the
 * gradient must come out U-shaped. If the harness cannot see that, its verdict
 * in part A means nothing.
 */
function synthPop(spec, n, seed) {
  const rng = E.makeRng(seed);
  const gauss = () =>
    Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(2 * Math.PI * rng());
  const out = [];
  for (let i = 0; i < n; i++) {
    const c = spec(i, n);
    const hits = [];
    for (let k = 0; k < 160; k++)
      hits.push({
        s: c.s + 0.004 * gauss(),
        phi: c.phi + 0.04 * gauss(),
      });
    out.push({
      anther: hits,
      stigma: hits.map((h) => ({ ...h })),
      contactRate: 1,
    });
  }
  return out;
}

function partB() {
  rule("B — CONTROLS: can this harness detect disruptive selection at all?");

  console.log(
    "  A unimodal cloud must read STABILISING; two separated clusters must read\n" +
      "  DISRUPTIVE. Both are required — one of them alone proves nothing.\n",
  );

  /* Unimodal: everyone near one placement, a few stragglers further out. */
  const uni = synthPop(
    (i, n) => ({ s: 0.5, phi: ((i / n) * 2 - 1) * 1.4 }),
    40,
    3,
  );
  gradient(uni, "control 1: unimodal cloud (must be STABILISING)");

  /* Bimodal: half at phi = -pi/2, half at +pi/2, plus a handful between them
   * which are the individuals that should do badly. */
  const bi = synthPop(
    (i, n) => {
      const t = i / n;
      if (t < 0.45) return { s: 0.5, phi: -1.4 };
      if (t > 0.55) return { s: 0.5, phi: 1.4 };
      return { s: 0.5, phi: -1.4 + ((t - 0.45) / 0.1) * 2.8 }; // the bridge
    },
    40,
    9,
  );
  gradient(bi, "control 2: two separated clusters (must be DISRUPTIVE)");
}

// ==========================================================================
// C — does the variance actually shrink?
// ==========================================================================
/*
 * The gradient is an instantaneous measurement. The claim is about a dynamic:
 * "converges rather than diverges, and no amount of running produces
 * speciation". So run it forward.
 *
 * ⚠️ BUT "spread must shrink" is only the right test with the mutation input
 * switched OFF. Stabilising selection running against a live mutation rate
 * settles at a mutation-selection BALANCE with non-zero variance, so a spread
 * that holds steady under mutation is the expected outcome and says nothing
 * about whether selection converges. Measured only that way, this part would
 * have read as evidence against a claim it does not test. Both arms are run.
 */
function partC(mutRate, label) {
  rule(`C — forward run: does placement spread shrink? (${label})`);
  const rng = E.makeRng(23);
  const N = 30,
    GENS = 12;
  let genomes = [];
  const centre = E.randomGenome(rng);
  for (let i = 0; i < N; i++) genomes.push(E.mutate(centre, rng, 1.0));

  console.log("  gen   placement spread   mean mating success   live");
  for (let g = 0; g < GENS; g++) {
    const sites = genomes.map((gm, i) =>
      C.siteSet(E.toFlower(gm), bee, { n: 120, seed: 400 + g * 100 + i }),
    );
    const idx = sites
      .map((s, i) => (s.anther.length && s.stigma.length ? i : -1))
      .filter((i) => i >= 0);
    if (idx.length < 6) {
      console.log(
        `  ${String(g).padStart(3)}   population collapsed to ${idx.length}`,
      );
      break;
    }
    const live = idx.map((i) => sites[i]);
    const { total } = popFitness(live);
    const place = live.map((s) => meanPlacement(s.anther));
    const c = meanPlacement(live.flatMap((s) => s.anther));
    const spread = mean(place.map((p) => deviation(p, c)));
    console.log(
      `  ${String(g).padStart(3)}   ${spread.toFixed(3).padStart(16)}   ${mean(total).toFixed(1).padStart(19)}   ${idx.length}`,
    );

    /* Fitness-proportional reproduction with mutation. No recombination yet —
     * that is the next thing roadmap B needs and is deliberately absent here,
     * so this measures selection on placement alone. */
    const tot = total.reduce((a, b) => a + b, 0);
    const next = [];
    for (let k = 0; k < N; k++) {
      let r = rng() * tot,
        pick = 0;
      for (let i = 0; i < total.length; i++) {
        r -= total[i];
        if (r <= 0) {
          pick = i;
          break;
        }
      }
      next.push(mutRate > 0 ? E.mutate(genomes[idx[pick]], rng, mutRate) : genomes[idx[pick]]);
    }
    genomes = next;
  }
  console.log(
    "\n  With mutation OFF a shrinking spread confirms convergence directly. With\n" +
      "  mutation ON a steady spread is mutation-selection balance, NOT a failure\n" +
      "  to converge — the two arms answer different questions.\n" +
      "  Divergence would look like a spread that GROWS with mutation off. It does\n" +
      "  not: it collapses, which is the claim in sim/evolve.js measured rather\n" +
      "  than asserted.",
  );
}

partB(); // controls first — if these fail, nothing else is worth reading
partA();
partC(0, "mutation OFF — the actual convergence test");
partC(0.35, "mutation ON — mutation-selection balance");
console.log();
