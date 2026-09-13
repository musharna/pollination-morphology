# Northstar page-config probe (2026-09-12)

**Probe, not a result.** Filed so every number the northstar design spec
(`docs/superpowers/specs/2026-09-12-northstar-design.md`) quotes at the page's own
configuration has a document and a command behind it. It changes nothing under `sim/`,
registers no hypothesis, and supports only the spec's acceptance controls and the null-arm
values its cards must clear. Engine at `0562868` (`sim/` unchanged through `f6b5a7f`).

> **Superseded for the null arms (2026-09-13).** Readouts 1 and 2 below rest on ten null
> seeds. The round-3 panel showed that a band set from ten seeds is a point the null crosses:
> over seeds 6 to 30 the card-1 null ratio falls below 1 in 15 of 28 runs, and at target 8,
> seed 22, it reaches 0.603. Every card's null distribution is now tabulated over seeds 1 to
> 30 in `docs/2026-09-13-northstar-null-tables.md`, and the spec's thresholds and M2 controls
> come from there. This document still stands for readouts 3 to 6.

## Configurations

- **A, page config:** `IBM.DEFAULTS` (N = 18, 24 generations, `siteN` 90), founded by
  `foundTwoLineages` at target d, driven by `step(pop, opts, rng, g, srng)` as
  `population.html:727,754-760` and `tests/browser-bundle.test.js:183` drive it (the page's
  `logBout` option is omitted, as in that test). Hybrid = ancestry strictly in (0.15, 0.85)
  (`experiments/hybrids-or-balance.js:87`). `card1ratio` = mean `received` of hybrids over
  mean `received` of the rest, last generation where both sets are non-empty; `Infinity` when
  the rest received nothing.
- **B, secondary-contact founding:** `foundTwoLineages(30, ..., {...DEFAULTS, siteN: 160})`,
  the call `experiments/secondary-contact.js:82,99` makes at N = 30 (`:66-69`). Realised
  separation only, no run.
- **C, level 5 cell:** `phenology {slices: 8, width: 0.12}`, target d = 8, via `I.run`, at
  30/35/160 and at 18/24/90.
- **D, card 5 pairs:** `experiments/rare-floor.js` `replicate()` rebuilt (`:28-32,114-172`):
  N0 = 30, 35 generations, `siteN` 160, d = 8, `phenology {slices: 8, width: 0.12}`,
  `visitsPerPlant` 800, arms from `experiments/selfing-arms.js` (`R200` flat floor, rate 2.0,
  cost 0; `R200q69`, `R200q85` coverage; `R200q0`). ⚠️ Seeds 1-8 only: the 590 s wall-clock
  guard stopped the loop before seed 9.

## Command

From the repository root, with the script below saved as `probe.js`:

```
timeout 590 node probe.js
```

```js
/* northstar round-2 probe, 2026-09-12. Read-only against sim/. Run from repo root:
 *   node /tmp/ns-r2/probe.js                                                    */
const R = process.cwd() + "/";
const I = require(R + "sim/ibm.js"),
  E = require(R + "sim/evolve.js");
const { selfingFor } = require(R + "experiments/selfing-arms.js");
const mean = (x) => x.reduce((a, b) => a + b, 0) / x.length;
const isHyb = (x) => x > 0.15 && x < 0.85;
const f = (x) =>
  x == null ? "null" : Number.isFinite(x) ? x.toFixed(3) : String(x);

/* the page loop: DEFAULTS, step(pop, opts, rng, g, srng) as population.html and
 * tests/browser-bundle.test.js drive it */
function page({ n = 18, gens = 24, seed, d, randomMating }) {
  const opts = { ...I.DEFAULTS, randomMating };
  const rng = E.makeRng(seed),
    srng = I.signalRng(seed);
  const built = I.foundTwoLineages(n, rng, srng, d, opts);
  const v0 = I.ancestryVar(built.pop);
  let pop = built.pop,
    extinct = false,
    sep0 = null,
    hybGens = 0,
    ratio = null;
  for (let g = 0; g < gens; g++) {
    if (pop.length < 2) {
      extinct = true;
      break;
    }
    const anc = pop.map((i) => (i.anc === undefined ? 0 : i.anc));
    const res = I.step(pop, opts, rng, g, srng);
    if (g === 0) sep0 = res.cluster.separation;
    const h = [],
      r = [];
    anc.forEach((a, i) => (isHyb(a) ? h : r).push(res.received[i]));
    if (h.length) hybGens++;
    if (h.length && r.length) ratio = mean(h) / mean(r);
    pop = res.pop;
  }
  return {
    realised: built.realised,
    sep0,
    fate: I.fateOf(pop, v0, extinct),
    hybGens,
    gens,
    ratio,
  };
}
console.log("A. page config N=18, 24 gens, siteN 90");
for (const d of [8, 4])
  for (const seed of [1, 2, 3, 4, 5])
    for (const randomMating of [false, true]) {
      const x = page({ seed, d, randomMating });
      console.log(
        `d=${d} seed ${seed} ${randomMating ? "null  " : "placed"} realised ${f(x.realised)} sep0 ${f(x.sep0)} fate ${x.fate} hybridGens ${x.hybGens}/${x.gens} card1ratio ${f(x.ratio)}`,
      );
    }

console.log(
  "\nB. realised separation at secondary-contact.js config (N=30, siteN 160), target d",
);
for (const d of [4, 8])
  console.log(
    `d=${d}`,
    [1, 2, 3, 4, 5]
      .map((s) =>
        f(
          I.foundTwoLineages(30, E.makeRng(s), I.signalRng(s), d, {
            ...I.DEFAULTS,
            siteN: 160,
          }).realised,
        ),
      )
      .join(" "),
  );

console.log(
  "\nC. level 5 cell, phenology slices 8 width 0.12, target d=8, via I.run",
);
for (const c of [
  { l: "30/35/160", n: 30, g: 35, s: 160 },
  { l: "18/24/90", n: 18, g: 24, s: 90 },
]) {
  const fates = [1, 2, 3, 4, 5].map((seed) => {
    const opts = {
      ...I.DEFAULTS,
      siteN: c.s,
      phenology: { slices: 8, width: 0.12 },
    };
    const b = I.foundTwoLineages(
      c.n,
      E.makeRng(seed),
      I.signalRng(seed),
      8,
      opts,
    );
    const o = I.run({
      n: c.n,
      generations: c.g,
      seed,
      found: b.pop,
      siteN: c.s,
      phenology: { slices: 8, width: 0.12 },
    });
    return `${seed}:${I.fateOf(o.pop, I.ancestryVar(b.pop), o.extinct)}`;
  });
  console.log(c.l, fates.join("  "));
}

console.log(
  "\nD. card 5 pairs at experiments/rare-floor.js replicate() config (N0=30, 35 gens, siteN 160, d=8, phenology 8/0.12, visitsPerPlant 800)",
);
function rf(seed, arm) {
  const rng = E.makeRng(seed),
    srng = I.signalRng(seed),
    brng = I.bloomRng(seed);
  const self = selfingFor(arm);
  const crng = self && self.cover != null ? I.coverRng(seed) : null;
  const opts = {
    ...I.DEFAULTS,
    siteN: 160,
    phenology: { slices: 8, width: 0.12 },
    visitsPerPlant: 800,
    logMatings: true,
  };
  if (self) opts.selfing = self;
  const b = I.foundTwoLineages(30, rng, srng, 8, opts);
  let pop = b.pop,
    extinct = false;
  const v0 = I.ancestryVar(pop);
  for (let g = 0; g < 35; g++) {
    if (pop.length < 2) {
      extinct = true;
      break;
    }
    opts.phenology.displayProportionalVisits = false;
    pop = I.step(pop, opts, rng, g, srng, brng, null, crng).pop;
  }
  return I.fateOf(pop, v0, extinct);
}
console.log(
  "selfingFor:",
  JSON.stringify(selfingFor("R200")),
  JSON.stringify(selfingFor("R200q85")),
);
for (let seed = 1; seed <= 10; seed++)
  console.log(
    `seed ${seed}  flat R200 ${rf(seed, "R200")}  q69 ${rf(seed, "R200q69")}  q85 ${rf(seed, "R200q85")}  q0 ${rf(seed, "R200q0")}`,
  );
```

## Output

```
A. page config N=18, 24 gens, siteN 90
d=8 seed 1 placed realised 8.124 sep0 31.620 fate one lost hybridGens 0/24 card1ratio null
d=8 seed 1 null   realised 8.124 sep0 31.620 fate FUSED hybridGens 23/24 card1ratio 2.056
d=8 seed 2 placed realised 8.058 sep0 31.486 fate one lost hybridGens 0/24 card1ratio null
d=8 seed 2 null   realised 8.058 sep0 31.486 fate FUSED hybridGens 23/24 card1ratio 1.642
d=8 seed 3 placed realised 8.123 sep0 31.317 fate one lost hybridGens 0/24 card1ratio null
d=8 seed 3 null   realised 8.123 sep0 31.317 fate FUSED hybridGens 23/24 card1ratio 7.495
d=8 seed 4 placed realised 7.663 sep0 16.248 fate one lost hybridGens 0/24 card1ratio null
d=8 seed 4 null   realised 7.663 sep0 16.248 fate FUSED hybridGens 23/24 card1ratio Infinity
d=8 seed 5 placed realised 8.090 sep0 30.303 fate one lost hybridGens 0/24 card1ratio null
d=8 seed 5 null   realised 8.090 sep0 30.303 fate FUSED hybridGens 23/24 card1ratio 1.385
d=4 seed 1 placed realised 4.025 sep0 19.879 fate one lost hybridGens 4/24 card1ratio 1.162
d=4 seed 1 null   realised 4.025 sep0 19.879 fate FUSED hybridGens 23/24 card1ratio 1.859
d=4 seed 2 placed realised 3.940 sep0 10.813 fate one lost hybridGens 0/24 card1ratio null
d=4 seed 2 null   realised 3.940 sep0 10.813 fate FUSED hybridGens 23/24 card1ratio 1.146
d=4 seed 3 placed realised 4.027 sep0 15.435 fate FUSED hybridGens 22/24 card1ratio 0.842
d=4 seed 3 null   realised 4.027 sep0 15.435 fate FUSED hybridGens 23/24 card1ratio 1.885
d=4 seed 4 placed realised 3.953 sep0 9.622 fate FUSED hybridGens 23/24 card1ratio 0.788
d=4 seed 4 null   realised 3.953 sep0 9.622 fate FUSED hybridGens 23/24 card1ratio 2.205
d=4 seed 5 placed realised 3.895 sep0 14.204 fate one lost hybridGens 7/24 card1ratio 0.667
d=4 seed 5 null   realised 3.895 sep0 14.204 fate FUSED hybridGens 23/24 card1ratio 1.278

B. realised separation at secondary-contact.js config (N=30, siteN 160), target d
d=4 3.995 3.933 4.027 3.951 3.898
d=8 8.163 8.062 8.136 7.663 8.136

C. level 5 cell, phenology slices 8 width 0.12, target d=8, via I.run
30/35/160 1:one lost  2:one lost  3:HELD  4:HELD  5:one lost
18/24/90 1:one lost  2:one lost  3:one lost  4:one lost  5:one lost

D. card 5 pairs at experiments/rare-floor.js replicate() config (N0=30, 35 gens, siteN 160, d=8, phenology 8/0.12, visitsPerPlant 800)
selfingFor: {"rate":2,"cost":0} {"rate":2,"cost":0,"cover":0.85}
seed 1  flat R200 one lost  q69 HELD  q85 one lost  q0 one lost
seed 2  flat R200 one lost  q69 one lost  q85 one lost  q0 one lost
seed 3  flat R200 one lost  q69 one lost  q85 one lost  q0 one lost
seed 4  flat R200 one lost  q69 one lost  q85 one lost  q0 one lost
seed 5  flat R200 one lost  q69 one lost  q85 one lost  q0 one lost
seed 6  flat R200 one lost  q69 one lost  q85 one lost  q0 one lost
seed 7  flat R200 one lost  q69 HELD  q85 one lost  q0 one lost
seed 8  flat R200 HELD  q69 one lost  q85 one lost  q0 HELD
```

## What the spec reads off this

1. At the page defaults, target 8, seeds 1-5: placement-mediated `one lost` 5/5 with **0 of 24**
   generations holding a hybrid; the random null at the same seeds `FUSED` 5/5 with hybrids in
   **23 of 24**. Card 4's quantity separates the two arms at every seed.
2. Card 1's receipt ratio on the null is **1.146 to 7.495, or Infinity**, in 10 of 10 null runs
   (targets 4 and 8, seeds 1-5): never below 1. Card 1's first placement-mediated opening is target 4:
   **seed 3 `FUSED`, ratio 0.842** (same seed null 1.885); also seed 4 `FUSED` 0.788 and seed 5
   `one lost` 0.667.
3. Cluster separation at generation 0 is 31.62 for realised 8.124 (seed 1) and 16.25 for
   realised 7.663 (seed 4): not a proxy for realised separation.
4. Realised separation of a target-8 founding: 7.663 to 8.124 at the page config, 7.663 to 8.163 at
   N = 30, `siteN` 160; target 4: 3.895 to 4.027 and 3.898 to 4.027.
5. Level 5 cell: HELD 2 of 5 at 30/35/160 (seeds 3, 4), 0 of 5 at 18/24/90.
6. Card 5: `q0` equals the flat arm at every seed (the C-null bit-identity, seen from outside).
   **Seed 8**: flat `HELD`, q = 0.69 and q = 0.85 `one lost`. Seeds 1 and 7 run the other way at
   q = 0.69 (`HELD` against a flat `one lost`). One seed pair at a time is not a test; the rates are
   `docs/2026-09-06-selfing-cover.md`'s.
