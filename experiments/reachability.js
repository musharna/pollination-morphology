/*
 * reachability.js — is the placement axis CONNECTED, or are there placements no
 * genome can reach?
 *
 * WHY THIS EXISTS. #25 established that rare-biased visitation is self-defeating
 * on a continuous trait axis: weighting by `dens^(a-1)` makes the LOWEST-density
 * placement the GAP BETWEEN the two clusters, so a preference for rare morphs
 * pours visits (136x) onto exactly the intermediates that bridge them. That is
 * why deception splits the ADVERTISEMENT — a discrete colour dimorphism, with no
 * intermediate to subsidise — rather than the plant.
 *
 * ⚠️ THE DISTINCTION THAT MATTERS IS REACHABILITY, NOT DENSITY. A merely SPARSE
 * gap is still subsidised; a subsidy only starves the bridge if the intermediate
 * placements cannot exist at all. So the question is about the IMAGE of genome
 * space under the contact map, and it is asked here before any body plan is
 * changed, because the cheap version of the discrete-axis proposal is that the
 * existing geometry ALREADY supplies the discreteness. `DEFAULT_BEE` is a
 * capsule chain of named regions with a radius step at the face/scutum junction
 * (0.32 -> 0.42), which looks like it might.
 *
 * ⚠️ THE REGIONS ARE NOT EVIDENCE FOR IT. They exist because retention and
 * grooming reach differ per region (groundwork 4.4, surface heterogeneity), so
 * reading them as a discrete placement axis would be projecting a purpose onto
 * them that they were not built for. Only the measured reachable set can say.
 *
 * ⚠️ EVERY NULL HERE SHIPS A POSITIVE CONTROL. "connected" is the expected
 * answer, and a probe that could never FIND a hole would report connectivity on
 * every input. The PINCHED plan is a bee whose mid-body is a thread; if the hole
 * is not found there, no null in this file means anything.
 *
 * ⚠️ AND AN EMPTY BIN IS NOT A HOLE. Finite sampling leaves empty bins in sparse
 * tails, which is a fact about the draw and not about the geometry. The
 * discriminator is that a REAL hole is STATIONARY: it stays in place when the
 * sample grows, while a sampling artefact moves with the tail or vanishes. So
 * every plan is probed at two sample sizes and a hole is only reported when it
 * survives in place. A verdict that could not distinguish those two would find
 * "discreteness" in any sparse distribution.
 */

const I = require("../sim/ibm.js");
const E = require("../sim/evolve.js");
const P = require("../sim/placement.js");

const SMOKE = process.env.RE_SMOKE === "1";
const N1 = SMOKE ? 1500 : Number(process.env.RE_N || 12000);
const N2 = 4 * N1;
const BINS = 60;
const SEED = 12345;

/* a hole must overlap its counterpart in the larger sample by at least this
 * fraction of its own width to count as the same hole holding still */
const OVERLAP = 0.5;

if (SMOKE)
  console.log(
    "\n*** RE_SMOKE=1 — tiny configuration. Exercises the code path and the\n" +
      "*** reporting. THE NUMBERS BELOW ARE NOT RESULTS.\n",
  );

const rule = (s) => console.log("\n" + s + "\n" + "-".repeat(s.length));

/* The four body plans are the ones check 2 already uses: uniform scalings of the
 * default region profile. They share s-boundaries by construction, which is
 * itself worth measuring rather than assuming. */
const scaleBee = (k, lenK = 1) => ({
  bodyLen: 1.75 * lenK,
  regions: P.DEFAULT_BEE.regions.map((r) => ({
    ...r,
    r0: r.r0 * k,
    r1: r.r1 * k,
  })),
  reach: P.DEFAULT_BEE.reach,
});

/*
 * THE POSITIVE CONTROL. Not a scaling — a real constriction, the mid-body pinched
 * to a thread. Wasp waists are real morphology (Apocrita are named for it), so
 * this is the shape the discrete-axis proposal would have to appeal to, and it is
 * here to prove the probe can see one.
 */
const PINCHED = {
  bodyLen: 1.75,
  regions: [
    { name: "face", s0: 0.0, s1: 0.16, r0: 0.3, r1: 0.32 },
    { name: "waist", s0: 0.16, s1: 0.42, r0: 0.02, r1: 0.02 },
    { name: "scutellum", s0: 0.42, s1: 0.52, r0: 0.44, r1: 0.38 },
    { name: "abdomen", s0: 0.52, s1: 1.0, r0: 0.38, r1: 0.14 },
  ],
  reach: P.DEFAULT_BEE.reach,
};

const PLANS = [
  ["default bee", P.DEFAULT_BEE, false],
  ["small slender", scaleBee(0.65, 0.8), false],
  ["large robust", scaleBee(1.35, 1.15), false],
  ["long slender", scaleBee(0.7, 1.5), false],
  ["PINCHED (control)", PINCHED, true],
];

/* Sample the image of genome space under the contact map, for one plan. */
function reachSet(bee, n) {
  const opts = { ...I.DEFAULTS, siteN: 1, bee };
  const rng = E.makeRng(SEED);
  const ss = [];
  let unplaced = 0;
  for (let i = 0; i < n; i++) {
    const ind = I.randomIndividual(rng);
    const p = I.sitesOf([ind], opts, 0).map(I.placementOf)[0];
    if (!p) unplaced++;
    else ss.push(p.s);
  }
  return { ss, unplaced };
}

/* Interior runs of empty bins, in s units. */
function holesOf(ss) {
  if (ss.length < 50) return null;
  const lo = Math.min(...ss);
  const hi = Math.max(...ss);
  const w = (hi - lo) / BINS;
  const bins = new Array(BINS).fill(0);
  for (const s of ss)
    bins[Math.min(BINS - 1, Math.floor(((s - lo) / (hi - lo || 1)) * BINS))]++;
  let first = -1;
  let last = -1;
  for (let k = 0; k < BINS; k++)
    if (bins[k] > 0) {
      if (first < 0) first = k;
      last = k;
    }
  const out = [];
  let run = null;
  for (let k = first; k <= last; k++) {
    if (bins[k] === 0) run = run ? { a: run.a, b: k } : { a: k, b: k };
    else if (run) {
      out.push(run);
      run = null;
    }
  }
  if (run) out.push(run);
  return {
    lo,
    hi,
    w,
    holes: out.map((h) => [lo + h.a * w, lo + (h.b + 1) * w]),
  };
}

const overlaps = (x, y) => {
  const a = Math.max(x[0], y[0]);
  const b = Math.min(x[1], y[1]);
  const inter = Math.max(0, b - a);
  return inter / Math.max(1e-12, x[1] - x[0]) >= OVERLAP;
};

/*
 * ⚠️ THE STABILITY FILTER NEEDS ITS OWN CHECK, AND THE POSITIVE CONTROL BELOW
 * DOES NOT PROVIDE ONE. The pinched plan proves `holesOf` can find a hole — if
 * hole-detection broke, that control fails loudly. But `overlaps` is invisible
 * to it: a filter hard-wired to `true` would keep every sampling artefact, flip
 * all four real plans to "has holes", and the control would STILL PASS. That is
 * the guard-that-cannot-discriminate pattern, so the filter is exercised
 * directly, on a stationary pair and on a moving one, both taken from real
 * measurements rather than invented.
 */
rule("ANCHOR — can the stability filter actually reject?");
const HELD_PAIR = [
  [0.16, 0.42],
  [0.1632, 0.4147],
]; /* the control's hole, as measured at both sample sizes */
const MOVED_PAIR = [
  [0.4537, 0.4649],
  [0.4911, 0.5033],
]; /* large robust, drifting with its tail */
const anchorKeep = overlaps(HELD_PAIR[0], HELD_PAIR[1]);
const anchorDrop = !overlaps(MOVED_PAIR[0], MOVED_PAIR[1]);
console.log(
  `  1. a stationary hole is KEPT                  ${anchorKeep ? "ok" : "FAIL"}`,
);
console.log(
  `  2. a hole that moved with the tail is DROPPED ${anchorDrop ? "ok" : "FAIL"}`,
);
if (!anchorKeep || !anchorDrop)
  console.log(
    "\n  ⚠️ THE FILTER CANNOT DISCRIMINATE. Every verdict below is meaningless.",
  );

rule(
  `Reachable placement set: connected, or discrete? (${N1} then ${N2} genomes per plan)`,
);
console.log(
  "  A hole counts only if it SURVIVES IN PLACE at the larger sample.\n" +
    "  Empty bins that move or vanish are the draw, not the geometry.\n",
);

const verdicts = [];
for (const [name, bee, isControl] of PLANS) {
  const r1 = reachSet(bee, N1);
  const r2 = reachSet(bee, N2);
  const h1 = holesOf(r1.ss);
  const h2 = holesOf(r2.ss);
  if (!h1 || !h2) {
    console.log(`  ${name.padEnd(20)} too few placements — NO VERDICT`);
    verdicts.push({ name, isControl, stable: null });
    continue;
  }
  const stable = h1.holes.filter((x) => h2.holes.some((y) => overlaps(x, y)));
  const dropped = h1.holes.length - stable.length;
  console.log(
    `  ${name.padEnd(20)} placed ${String(r1.ss.length).padStart(5)}/${String(r2.ss.length).padStart(6)}  ` +
      `s ${h2.lo.toFixed(3)}..${h2.hi.toFixed(3)}  bin ${h2.w.toFixed(4)}  ` +
      `${stable.length ? `${stable.length} STABLE HOLE(S)` : "CONNECTED"}` +
      `${dropped ? `  (${dropped} unstable, discarded)` : ""}`,
  );
  for (const s of stable)
    console.log(
      `${" ".repeat(22)}hole s in [${s[0].toFixed(4)}, ${s[1].toFixed(4)}]`,
    );
  verdicts.push({ name, isControl, stable: stable.length });
}

/* ------------------------------------------------------------------ verdict */

rule("VERDICT");

const control = verdicts.find((v) => v.isControl);
const real = verdicts.filter((v) => !v.isControl);

if (!control || !control.stable) {
  console.log(
    "  ⚠️ THE POSITIVE CONTROL FOUND NO HOLE. The pinched plan has an\n" +
      "  unreachable mid-body by construction, so the probe cannot see what it\n" +
      "  exists to see. EVERY NULL BELOW IS VOID.",
  );
} else {
  console.log(
    `  positive control: ${control.stable} stable hole(s) — the probe can see a real gap.`,
  );
  const withHoles = real.filter((v) => v.stable);
  if (withHoles.length === 0) {
    console.log(
      `\n  ALL ${real.length} REAL BODY PLANS ARE CONNECTED. Discreteness does NOT\n` +
        "  emerge from the existing geometry — not even from the radius step at the\n" +
        "  face/scutum junction. A discrete placement axis would have to come from a\n" +
        "  body plan with a genuine constriction, which is a MODELLING CHOICE and has\n" +
        "  to be justified from morphology rather than from the answer it produces.",
    );
  } else {
    console.log(
      `\n  ${withHoles.length} of ${real.length} real plans carry a stable hole: ` +
        withHoles.map((v) => v.name).join(", "),
    );
  }
}
