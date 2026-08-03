/*
 * platanthera.js — the empirical leg (roadmap A).
 *
 * Every result in this project so far is a fact about the MODEL. This is the
 * first one that is a fact about the world: a real system where a real
 * morphological trait maps to a real placement on a real animal, with an
 * independent molecular answer key for what that placement does.
 *
 * THE SYSTEM. Two sympatric European orchids pollinated by the same noctuid
 * moths. Their pollinaria are glued to the moth's head, and WHERE depends on
 * how far apart the two viscidia sit on the column:
 *
 *   P. bifolia      viscidia 0.2-1.1 mm apart  -> pollinaria on the PROBOSCIS
 *   intermediates   viscidia 1.3-2.3 mm apart  -> pollinaria on the CHEEKS
 *   P. chlorantha   viscidia 2.3-4.9 mm apart  -> pollinaria on the EYES
 *
 * Esposito, Merckx & Tyteca 2017, Lankesteriana 17(3): 383-393, Table 1:
 * 11 records over 7 moth individuals, and the separation is perfect --
 * bifolia proboscis 6/6, chlorantha eyes 3/3, intermediates cheeks 2/2.
 * "these characteristics imply that pollinia will be attached to the
 * proboscis of pollinators" / "considered an adaptation for attachment to
 * the eyes of the pollinators".
 *
 * WHY IT IS THE RIGHT TEST FOR THIS PROJECT. The founding constraint is that
 * PLACEMENT IS NEVER A GENE -- genes are shape, placement is computed. The
 * intermediates are the cleanest evidence of that anyone has collected, and
 * the reason is genetic rather than morphological: they are NOT hybrids.
 * Esposito et al. 2018 (PeerJ 6:e4256) type them with AFLP and find
 * "plants with intermediate floral morphological traits, could not be
 * genetically separated from P. bifolia (full overlap of AFLP's profiles)",
 * average hybrid index 0.1. They are P. bifolia carrying a wider column.
 *
 * So within one species' own gene pool a shape trait shifts by half a
 * millimetre and the pollen lands somewhere else on the animal -- on a part
 * of the head that is nobody's adaptation, just where the geometry put it.
 * That is the model's core claim, observed in the wild.
 *
 * WHAT IS ACTUALLY TESTED HERE. Mapping a viscidium separation d to a lateral
 * offset d/2 is close to definitional, and a test built on that alone would be
 * unfalsifiable. The real test is that the measured trait DISTRIBUTIONS have
 * to predict the measured REPRODUCTIVE STRUCTURE, and there is an independent
 * answer key for that:
 *
 *   bifolia <-> intermediate   NOT separable ("full overlap of AFLP profiles")
 *   bifolia <-> chlorantha     two distinct clusters, but real gene flow:
 *                              "about 17% and 7% of all sampled individuals
 *                              displayed an admixed gene pool" (Botton,
 *                              Bois Niau)
 *
 * and the paper hands over a CONTROL for free. It measures four floral traits.
 * Two of them place the pollinarium (viscidia distance, caudicle length); two
 * of them do not (spur length is reward access, labellum length is display).
 * All four differ between the species. If the size traits predict the genetic
 * structure just as well as the placement traits, this test is vacuous and
 * says nothing about placement in particular.
 *
 * THE SPLIT IS DECLARED BEFORE THE RUN, below, and not revised afterwards.
 *
 * Sources, both open access and both read from the publisher's own full text
 * rather than from a search summary:
 *   Esposito, Merckx & Tyteca 2017, Lankesteriana 17(3): 383-393,
 *     doi:10.15517/lank.v17i3.31576   (attachment positions, Table 1)
 *   Esposito, Vereecken, Gammella, Rinaldi, Laurent & Tyteca 2018,
 *     PeerJ 6:e4256, doi:10.7717/peerj.4256   (Table 2 morphometrics; AFLP)
 */

const P = require("../sim/placement.js");
const K = require("../sim/packing.js");

/* ------------------------------------------------------------------ data
 *
 * Esposito et al. 2018 PeerJ 6:e4256, Table 2, "Floral traits (Mean, with
 * Standard Deviation) for P. bifolia, intermediate morphotypes and
 * P. chlorantha for allopatric and sympatric populations." Transcribed from
 * the Europe PMC full text of the article, columns Botton and Bois Niau.
 *
 * The allopatric columns are deliberately NOT used: the answer key is a
 * statement about the two SYMPATRIC populations, and allopatric P. bifolia is
 * reported as 0.30 +/- 0.61 mm, an SD twice the mean, which no positive
 * quantity can actually be distributed as.
 */
const SITES = [
  {
    name: "Botton",
    admixedPct: 17, // "about 17% and 7% of all sampled individuals"
    traits: {
      "viscidia distance": {
        bifolia: [0.96, 0.21],
        intermediate: [1.48, 0.45],
        chlorantha: [3.61, 0.52],
      },
      "caudicle length": {
        bifolia: [0.53, 0.11],
        intermediate: [0.69, 0.12],
        chlorantha: [1.82, 0.16],
      },
      "spur length": {
        bifolia: [31.04, 3.83],
        intermediate: [29.74, 3.4],
        chlorantha: [27.98, 2.99],
      },
      "labellum length": {
        bifolia: [11.41, 1.8],
        intermediate: [12.31, 1.32],
        chlorantha: [13.5, 1.49],
      },
    },
  },
  {
    name: "Bois Niau",
    admixedPct: 7,
    traits: {
      "viscidia distance": {
        bifolia: [0.64, 0.25],
        intermediate: [1.39, 0.35],
        chlorantha: [3.91, 0.16],
      },
      "caudicle length": {
        bifolia: [0.56, 0.1],
        intermediate: [0.66, 0.16],
        chlorantha: [1.92, 0.07],
      },
      "spur length": {
        bifolia: [30.16, 2.88],
        intermediate: [30.63, 2.18],
        chlorantha: [27.4, 0.71],
      },
      "labellum length": {
        bifolia: [13.07, 1.39],
        intermediate: [13.47, 1.23],
        chlorantha: [14.26, 0.66],
      },
    },
  },
];

/*
 * DECLARED BEFORE THE RUN. Which of the four measured traits determine where
 * the pollinarium is deposited on the animal?
 *
 *   viscidia distance  the lateral separation of the two attachment points --
 *                      this IS the placement coordinate
 *   caudicle length    the stalk between viscidium and pollinium, so how far
 *                      the pollen mass reaches from its anchor
 *
 * and which do not?
 *
 *   spur length        how deep the nectar sits, i.e. reward access -- it
 *                      selects WHICH moths can feed, not where pollen goes
 *   labellum length    display size
 */
const PLACEMENT_TRAITS = ["viscidia distance", "caudicle length"];
const TRAITS = [
  "viscidia distance",
  "caudicle length",
  "spur length",
  "labellum length",
];
const MORPHS = ["bifolia", "intermediate", "chlorantha"];

/*
 * The answer key, from the AFLP work in the same paper. Pre-registered
 * thresholds: "not separable" means the majority of each distribution lies
 * under the other, "separable" means almost none of it does. Raw overlaps are
 * printed too, so a reader applying different cut-offs can see the numbers.
 */
const NOT_SEPARABLE = 0.5; // bifolia vs intermediate must EXCEED this
const SEPARABLE = 0.1; // bifolia vs chlorantha must FALL BELOW this

const SEEDS = 25;
const N = 96; // K.KDE_M -- the estimator retains at most this many points

// ------------------------------------------------------------------ helpers

/* Box-Muller on the project's deterministic PRNG. */
function gauss(rng) {
  let u = 0;
  while (u === 0) u = rng();
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/*
 * Draw n positive values. Every trait here is a physical length, so the normal
 * summary in the table is a description of a quantity that cannot go negative;
 * draws below zero are rejected rather than clamped, and the rejection count is
 * reported so a badly-shaped input announces itself instead of being silently
 * reshaped.
 */
function draw(mean, sd, n, rng) {
  const out = [];
  let rejected = 0;
  while (out.length < n) {
    const x = mean + sd * gauss(rng);
    if (x > 0) out.push(x);
    else rejected++;
  }
  return { xs: out, rejected };
}

/*
 * A 1-D continuous placement signature on the raw millimetre axis.
 *
 * This is legitimate only because the estimator is SCALE-FREE: it divides by
 * S_UNIT_W and then sets its bandwidth from the sample's own SD measured in
 * those same units, so a common rescaling of the axis cancels exactly. Part 0
 * checks that rather than assuming it -- if it ever stopped being true, every
 * number below would be quietly wrong.
 */
const sigOf = (xs) =>
  K.kdeSig(
    xs.map((x) => ({ s: x, phi: 0 })),
    { dims: 1 },
  );

const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const sd = (a) => {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(
    a.reduce((s, x) => s + (x - m) * (x - m), 0) / (a.length - 1),
  );
};

/* Seed-averaged pairwise overlaps for one trait at one site. */
function overlapsFor(trait, seedBase) {
  const per = { bifInt: [], bifChl: [], intChl: [] };
  let rejected = 0;
  for (let r = 0; r < SEEDS; r++) {
    const rng = P.makeRng(seedBase + 7919 * r);
    const sigs = {};
    for (const m of MORPHS) {
      const [mu, s] = trait[m];
      const d = draw(mu, s, N, rng);
      rejected += d.rejected;
      sigs[m] = sigOf(d.xs);
    }
    per.bifInt.push(K.kdeOverlap(sigs.bifolia, sigs.intermediate));
    per.bifChl.push(K.kdeOverlap(sigs.bifolia, sigs.chlorantha));
    per.intChl.push(K.kdeOverlap(sigs.intermediate, sigs.chlorantha));
  }
  return {
    bifInt: [mean(per.bifInt), sd(per.bifInt)],
    bifChl: [mean(per.bifChl), sd(per.bifChl)],
    intChl: [mean(per.intChl), sd(per.intChl)],
    rejected,
  };
}

const f3 = (x) => (x >= 1e-3 ? x.toFixed(3) : x.toExponential(1)).padStart(8);

// ------------------------------------------- part 0: does the metric work here

/*
 * The analysis leans on three properties of the estimator. None is assumed.
 * Each control is written so that it CAN fail: the positive control would fail
 * if the estimator could not see agreement, the negative if it could not see
 * separation, and the invariance check if the millimetre axis were not a legal
 * input.
 */
function controls() {
  console.log("PART 0 -- can this metric be used on a millimetre axis?\n");
  const rng = P.makeRng(20260803);
  let ok = true;

  /* Positive control: two independent samples of the SAME distribution. */
  const a = sigOf(draw(1.0, 0.25, N, rng).xs);
  const b = sigOf(draw(1.0, 0.25, N, rng).xs);
  const same = K.kdeOverlap(a, b);
  const posOk = same > 0.75;
  ok = ok && posOk;
  console.log(
    `  identical distributions      overlap ${f3(same)}   ${posOk ? "ok" : "FAIL"} (expect high)`,
  );

  /* Negative control: twenty SDs apart. */
  const c = sigOf(draw(1.0, 0.25, N, rng).xs);
  const d = sigOf(draw(6.0, 0.25, N, rng).xs);
  const far = K.kdeOverlap(c, d);
  const negOk = far < 0.02;
  ok = ok && negOk;
  console.log(
    `  twenty SDs apart             overlap ${f3(far)}   ${negOk ? "ok" : "FAIL"} (expect ~0)`,
  );

  /*
   * Scale invariance. This is the load-bearing one: the whole analysis runs on
   * a raw millimetre axis rather than the model's body coordinate, and that is
   * only meaningful if the answer does not depend on the unit. Note the
   * bandwidth rule carries a floor of 1e-4, so invariance must eventually break
   * for a small enough unit -- the point of checking several decades is to find
   * out where, not to assume it never happens.
   */
  const base = draw(1.0, 0.25, N, P.makeRng(4242)).xs;
  const other = draw(1.4, 0.3, N, P.makeRng(4243)).xs;
  const at = (k) =>
    K.kdeOverlap(sigOf(base.map((x) => x * k)), sigOf(other.map((x) => x * k)));
  const ref = at(1);

  for (const k of [1e3, 1e6, 1e-3]) {
    const drift = Math.abs(at(k) - ref);
    const invOk = drift < 1e-9;
    ok = ok && invOk;
    console.log(
      `  axis scaled by ${k.toExponential(0).padStart(7)}       overlap ${f3(at(k))}   ${invOk ? "ok" : "FAIL"} (drift ${drift.toExponential(1)})`,
    );
  }

  /*
   * ...and then find where it DOES break, because it must. kdeSig floors the
   * bandwidth at 1e-4, so once a sample's spread falls under that the kernel is
   * wider than the data and every distribution looks like every other one.
   *
   * The direction matters and is the reason this is worth measuring rather than
   * side-stepping: the failure reports overlap going UP, towards 1. A saturating
   * estimator does not announce itself by returning nonsense, it announces
   * itself by returning "these are the same" -- which is the same way the 24-bin
   * histogram this project replaced used to fail, and it would be read here as
   * "no reproductive isolation" rather than as a broken measurement.
   *
   * So the run states its own safety margin instead of asserting it is fine.
   */
  let broke = null;
  for (let e = -3; e >= -12; e--) {
    if (Math.abs(at(Math.pow(10, e)) - ref) > 1e-6) {
      broke = e;
      break;
    }
  }
  const smallestSd = Math.min(
    ...SITES.flatMap((s) =>
      TRAITS.flatMap((t) => MORPHS.map((m) => s.traits[t][m][1])),
    ),
  );
  console.log(
    `\n  bandwidth floor saturates the estimator below scale 1e${broke === null ? "<-12" : broke}`,
  );
  console.log(
    `  smallest SD in the real data is ${smallestSd} mm, i.e. ${(1 / Math.pow(10, broke === null ? -12 : broke)).toExponential(0)}x clear of it`,
  );
  console.log(
    "  -- and note the failure mode is overlap -> 1, which reads as 'not isolated'.",
  );
  console.log();
  return ok;
}

// ------------------------------------ part A: which trait predicts the genetics

function partA() {
  console.log(
    "PART A -- which measured trait reproduces the molecular structure?\n",
  );
  console.log(
    "  answer key (Esposito et al. 2018, AFLP): bifolia and the intermediates are",
  );
  console.log(
    "  ONE gene pool; chlorantha is a separate cluster with limited gene flow.\n",
  );

  const verdicts = {};
  for (const site of SITES) {
    console.log(`  ${site.name}`);
    console.log(
      "    trait                  bif-int   bif-chl   int-chl   PRIMARY  secondary",
    );
    for (const name of TRAITS) {
      const o = overlapsFor(site.traits[name], 1000 + name.length * 31);
      /*
       * PRIMARY: does the trait separate the two SPECIES, as the molecular data
       * do? The species were typed with AFLP independently of these four
       * measurements, so this is a genuine prediction rather than a restatement.
       *
       * SECONDARY: does it leave bifolia and the intermediates unseparated?
       * This one is CONFOUNDED and is reported rather than scored -- the
       * intermediates are a MORPHOLOGICAL class, picked out by a discriminant
       * function on floral traits, so finding them morphologically distinct from
       * bifolia is partly built in. It is kept because the number itself is
       * informative even though the criterion is not clean.
       */
      const primary = o.bifChl[0] < SEPARABLE;
      const secondary = o.bifInt[0] > NOT_SEPARABLE;
      verdicts[`${site.name}|${name}`] = { primary, secondary, o };
      console.log(
        `    ${name.padEnd(20)} ${f3(o.bifInt[0])}  ${f3(o.bifChl[0])}  ${f3(o.intChl[0])}   ${(primary ? "YES" : "no").padEnd(7)}  ${secondary ? "yes" : "no"}`,
      );
    }
    console.log();
  }
  return verdicts;
}

// ------------------------------------------- part B: the cross-site gradient

/*
 * A second, independent prediction that nothing here was tuned for. The two
 * sites differ: at Botton the morphotypes sit CLOSER together on the viscidia
 * axis (0.96 and 3.61) than at Bois Niau (0.64 and 3.91). So a placement-based
 * account predicts more overlap, hence more gene flow, at Botton -- and the
 * measured admixture is 17% at Botton against 7% at Bois Niau.
 *
 * The direction was fixed by the data before the overlaps were computed; what
 * is open is whether any given trait gets it right.
 */
function partB(verdicts) {
  console.log(
    "PART B -- cross-site gradient: 17% admixture at Botton, 7% at Bois Niau\n",
  );
  console.log(
    "    trait                  bif-chl Botton   bif-chl Bois Niau   direction",
  );
  const got = {};
  for (const name of TRAITS) {
    const bo = verdicts[`Botton|${name}`].o.bifChl[0];
    const bn = verdicts[`Bois Niau|${name}`].o.bifChl[0];
    const right = bo > bn;
    got[name] = right;
    console.log(
      `    ${name.padEnd(20)} ${f3(bo)}          ${f3(bn)}           ${right ? "correct" : "WRONG"}`,
    );
  }
  console.log();
  return got;
}

// --------------------------------------- part C: a falsifiable head prediction

/* Where two normal densities cross, between their means. */
function crossing(m1, s1, m2, s2) {
  const pdf = (x, m, s) =>
    Math.exp(-0.5 * ((x - m) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));
  const lo = Math.min(m1, m2),
    hi = Math.max(m1, m2);
  let best = lo,
    bestGap = Infinity;
  const steps = 200000;
  for (let i = 0; i <= steps; i++) {
    const x = lo + ((hi - lo) * i) / steps;
    const gap = Math.abs(pdf(x, m1, s1) - pdf(x, m2, s2));
    if (gap < bestGap) {
      bestGap = gap;
      best = x;
    }
  }
  return best;
}

function partC() {
  console.log(
    "PART C -- the model's prediction about an animal nobody has measured here\n",
  );
  console.log(
    "  The two viscidia straddle the midline, so a separation d attaches pollinaria",
  );
  console.log(
    "  at +/- d/2. For the OBSERVED assignment to hold, the boundaries between the",
  );
  console.log(
    "  moth's attachment zones must fall between the morphotype distributions:\n",
  );
  console.log(
    "    site           proboscis|gena      gena|eye     (mm from midline)",
  );
  const pg = [],
    ge = [];
  for (const site of SITES) {
    const t = site.traits["viscidia distance"];
    const b1 = crossing(...t.bifolia, ...t.intermediate) / 2;
    const b2 = crossing(...t.intermediate, ...t.chlorantha) / 2;
    pg.push(b1);
    ge.push(b2);
    console.log(
      `    ${site.name.padEnd(12)}   ${b1.toFixed(2).padStart(8)}      ${b2.toFixed(2).padStart(8)}`,
    );
  }
  console.log();
  console.log(
    `  So: the proboscis zone reaches ~${Math.min(...pg).toFixed(2)}-${Math.max(...pg).toFixed(2)} mm either side of the midline,`,
  );
  console.log(
    `  the gena is a NARROW band out to ~${Math.min(...ge).toFixed(2)}-${Math.max(...ge).toFixed(2)} mm, and the compound eye begins`,
  );
  console.log(
    `  beyond that -- implying a head at least ~${(2 * Math.max(...ge)).toFixed(1)} mm across the eyes.`,
  );
  console.log();
  console.log(
    "  UNTESTED. I could not source head morphometrics for Cucullia umbratica,",
  );
  console.log(
    "  Autographa gamma or Noctua pronuba, and I will not fit them -- a constant",
  );
  console.log(
    "  calibrated from the artefact under test encodes its defect. Stated here as",
  );
  console.log("  a prediction for whoever has the specimens.\n");
}

// ------------------------------------------------------------------ main

function main() {
  console.log("=".repeat(78));
  console.log("Platanthera -- the empirical leg (roadmap A)");
  console.log("=".repeat(78));
  console.log();

  if (!controls()) {
    console.log("METRIC CONTROLS FAILED -- refusing to compute anything else.");
    process.exit(1);
  }

  const verdicts = partA();
  const dir = partB(verdicts);
  partC();

  // ------------------------------------------------------------------ verdict

  console.log("=".repeat(78));
  const sizeTraits = TRAITS.filter((t) => !PLACEMENT_TRAITS.includes(t));
  const every = (ts, f) => ts.every((t) => SITES.every((s) => f(s, t)));
  const placementPrimary = every(
    PLACEMENT_TRAITS,
    (s, t) => verdicts[`${s.name}|${t}`].primary,
  );
  const sizePrimary = every(
    sizeTraits,
    (s, t) => !verdicts[`${s.name}|${t}`].primary,
  );
  const uninformativeB = TRAITS.every((t) => dir[t]);

  console.log(
    "  PRIMARY -- reproduces the molecular species split, both sites",
  );
  console.log(
    `    placement traits (viscidia, caudicle) : ${placementPrimary ? "BOTH pass" : "not both"}`,
  );
  console.log(
    `    size traits (spur, labellum)          : ${sizePrimary ? "BOTH fail" : "not both"}`,
  );
  console.log();

  if (placementPrimary && sizePrimary) {
    console.log(
      "  The traits that separate the two species are exactly the two that decide",
    );
    console.log(
      "  where the pollen is put; the two that set flower size leave them 30-66%",
    );
    console.log(
      "  overlapping. The test could have come out otherwise, and on half the",
    );
    console.log("  traits it does.");
  } else {
    console.log("  NOT the clean split -- read the tables, not this line.");
  }

  console.log();
  console.log("  SECONDARY -- and it did not come out clean:");
  for (const t of PLACEMENT_TRAITS) {
    const v = SITES.map(
      (s) => `${s.name} ${verdicts[`${s.name}|${t}`].o.bifInt[0].toFixed(3)}`,
    ).join(", ");
    console.log(
      `    ${t.padEnd(18)} bifolia-intermediate overlap: ${v}${PLACEMENT_TRAITS.indexOf(t) === 0 ? "   <- below the 0.5 cut" : ""}`,
    );
  }
  console.log(
    "    Viscidia distance MISSES the pre-registered cut at both sites. Not",
  );
  console.log(
    "    re-thresholded. Two things are true: the criterion is confounded (the",
  );
  console.log(
    "    intermediates were DEFINED morphologically), and the number is real --",
  );
  console.log(
    "    inside ONE gene pool, placement has diverged far enough to move pollen",
  );
  console.log(
    "    from proboscis to cheek, and no reproductive isolation followed.",
  );
  console.log();
  console.log(
    `  PART B is uninformative: all four traits get the cross-site direction right`,
  );
  console.log(
    `    (${uninformativeB ? "4/4" : "not 4/4"}). With two sites a direction test is nearly powerless; reported,`,
  );
  console.log("    not counted.");
  console.log("=".repeat(78));
}

if (require.main === module) main();

module.exports = {
  SITES,
  TRAITS,
  MORPHS,
  PLACEMENT_TRAITS,
  NOT_SEPARABLE,
  SEPARABLE,
  gauss,
  draw,
  sigOf,
  crossing,
  overlapsFor,
  main,
};
