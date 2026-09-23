# Northstar null tables (2026-09-13)

**Probe, not a result.** The per-seed null distribution behind every "why you failed" card in
`docs/superpowers/specs/2026-09-12-northstar-design.md` section 4, at the configuration the card
is read at, over seeds 1 to 30. Produced by `tools/northstar-null-tables.js`; the commands, the
verbatim output and the edges read off it are below. It changes nothing under `sim/` (engine at
`f6b5a7f`, unchanged under `sim/` since `d18f972`), registers no hypothesis, and supports only the
thresholds the cards open at and the smoke test's controls.

**Why per seed.** The round-2 spec set card bands at a null arm's MEAN (card 1: ten null seeds,
"1.146 to 7.495"; cards 2 and 3: the a = 1 arm means 0.129 and 0.024 from
`docs/2026-08-05-gap-occupancy.md:122`). The round-3 panel showed a mean is a value single null
seeds cross about half the time: card 1's ratio fell below 1 on 15 of 28 further null seeds, and
an a = 1 seed exceeded both gap-occupancy means. A card that can open on its own null explains
nothing, so every threshold is now set beyond the most extreme value any null seed reached, and
the whole distribution is filed here.

**Round 4 (2026-09-13).** Three additions. (1) Rows print to three decimals and the round-3 edges
were read off the printed rows, so card 2's 0.433 was the printed value of seed 13's peak
0.43333..., which is ABOVE 0.433: the null crossed its own edge. `edges` re-runs each defining
seed at full precision and rounds the edge OUTWARD (a lower edge down, an upper edge up, one more
step when the rounding lands on the value); the committed edges are the `edges` output below.
(2) Cards 2 and 3 get a second null, `card23 rm8`: the same seeds under `randomMating`, where a
filled gap is not a bridge because parentage ignores placement (`sim/ibm.js:2130,2203`). Its gap
occupancy exceeds every a = 1 edge (peaks to 0.909, means to 0.634), so the cards read a third
quantity, the LEAD (the generation ancestry variance first halved minus the generation the gap
first held 10%), whose random-mating edge is 1. (3) Card 6 gets a per-seed null, `card6null`: the
shuffled arm at `widthRng(seed)` minus the shuffled arm at `widthRng(seed + 1000)`; its edge
replaces the document's interval bound 0.140, which was a bound on a 12-seed mean.

## Configurations

- **page:** `IBM.DEFAULTS` (N = 18, 24 generations, `siteN` 90), founded by `foundTwoLineages`
  at target d, driven by `step(pop, opts, rng, g, srng)` as `population.html:727,754-760` drive
  it. Cards 1 and 4, both arms (placement-mediated, and the same seed under `randomMating`).
- **level:** N = 30, 35 generations, `siteN` 160, the configuration every cited experiment ran
  (`experiments/secondary-contact.js:66-69`; `experiments/gap-occupancy.js:52-65`) and levels 2
  to 6 load. Cards 1 and 4 both arms; cards 2 and 3 at a = 1 (null) and a = 0.25, d = 8 and
  d = 4, gap occupancy against the founding placements held fixed.
- **card 5:** `experiments/rare-floor.js` `replicate()` rebuilt (`:28-32,114-172`): N0 = 30, 35
  generations, `siteN` 160, d = 8, `phenology {slices: 8, width: 0.12}`, `visitsPerPlant` 800,
  arms `R200` (flat floor, rate 2.0, cost 0), `R200q69`, `R200q85` from
  `experiments/selfing-arms.js`. `R200q0` is not run: it is bit-identical to the flat arm
  (final-population md5 equal at seed 8, `docs/2026-09-12-northstar-page-config-probe.md`;
  `sim/ibm.js:2384-2386`).
- **card 6:** `experiments/evolving-width.js` `replicate()` rebuilt under the conserved-display
  arm `docs/FINDINGS.md:115-117` quotes: 30 plants, 35 generations, `siteN` 160, d = 8, S = 8,
  `widthMut` 0.03, `conserveDisplay`; treatment (`widthLocus`) against the same seed with
  `shuffleWidth`. `width` is the experiment's own statistic, mean expressed width over the last
  five generations.
- **cards 2 and 3, second null (round 4):** `card23 rm8`, the level configuration at d = 8 under
  `randomMating`, both a = 1 and a = 0.25 (the two are identical row for row: under random mating
  parentage ignores the transfer matrix, so `allocExponent` changes nothing that gap occupancy
  reads). Rows are tagged `card23rm`.
- **card 6, per-seed null (round 4):** `card6null`, the card-6 configuration with `shuffleWidth`
  in both arms, differing only in the width stream (`widthRng(seed)` against
  `widthRng(seed + 1000)`; `wrng` is a plain parameter of `step`, `sim/ibm.js:1131`). `diff` is
  arm A minus arm B, a draw from the null of card 6's treatment-minus-shuffled statistic.

Hybrid = ancestry strictly in (0.15, 0.85) (`experiments/hybrids-or-balance.js:87`). Card 1's
ratio = mean `received` of hybrids over mean `received` of the rest in the last generation where
both sets are non-empty; `Infinity` when the rest received nothing, `null` when no generation had
both. Seed 18 founds nothing (`foundTwoLineages` returns `null`) at either target under either
configuration and appears as `nobuild`.

## Commands

From the repository root. Each invocation was wrapped in `timeout 590` and the seed ranges were
split so that chunks could run in parallel; four level-config chunks of six seeds hit the 590 s
guard under 11-way contention and the missing seeds (6, 11, 12, 24, 30) were re-run alone, so
those seeds appear from their own chunk. Rows are one seed, one arm; order within a chunk is
seed, then target, then arm.

```
node tools/northstar-null-tables.js card14 page  1 15;  node tools/northstar-null-tables.js card14 page 16 30
node tools/northstar-null-tables.js card14 level 1 6;   ... 7 12; 13 18; 19 24; 25 30   (re-runs: 6 6; 11 12; 24 24; 30 30)
node tools/northstar-null-tables.js card23 d8 1 10;     ... 11 20; 21 30
node tools/northstar-null-tables.js card23 d4 1 10
node tools/northstar-null-tables.js card5  - 1 6;       ... 7 12; 13 18; 19 24; 25 30
node tools/northstar-null-tables.js card6  - 1 8;       ... 9 15; 16 23; 24 30
node tools/northstar-null-tables.js summarise <all row files>
# round 4 (each chunk under `timeout 600`, six or ten chunks in parallel on a loaded host)
node tools/northstar-null-tables.js card23 rm8 1 5;     ... 6 10; 11 15; 16 20; 21 25; 26 30
node tools/northstar-null-tables.js card6null - 1 3;    ... 4 6; 7 9; 10 12; 13 15; 16 18; 19 21; 22 24; 25 27; 28 30
node tools/northstar-null-tables.js summarise <all row files>
node tools/northstar-null-tables.js edges <all row files>
```

## Output

```
# card14 page N=18 gens=24 siteN=90 seeds 1-15
card14 page d=8 seed 1 placed realised 8.124 fate one lost hybGens 0/24 ratio null
card14 page d=8 seed 1 null realised 8.124 fate FUSED hybGens 23/24 ratio 2.056
card14 page d=4 seed 1 placed realised 4.025 fate one lost hybGens 4/24 ratio 1.162
card14 page d=4 seed 1 null realised 4.025 fate FUSED hybGens 23/24 ratio 1.859
card14 page d=8 seed 2 placed realised 8.058 fate one lost hybGens 0/24 ratio null
card14 page d=8 seed 2 null realised 8.058 fate FUSED hybGens 23/24 ratio 1.642
card14 page d=4 seed 2 placed realised 3.940 fate one lost hybGens 0/24 ratio null
card14 page d=4 seed 2 null realised 3.940 fate FUSED hybGens 23/24 ratio 1.146
card14 page d=8 seed 3 placed realised 8.123 fate one lost hybGens 0/24 ratio null
card14 page d=8 seed 3 null realised 8.123 fate FUSED hybGens 23/24 ratio 7.495
card14 page d=4 seed 3 placed realised 4.027 fate FUSED hybGens 22/24 ratio 0.842
card14 page d=4 seed 3 null realised 4.027 fate FUSED hybGens 23/24 ratio 1.885
card14 page d=8 seed 4 placed realised 7.663 fate one lost hybGens 0/24 ratio null
card14 page d=8 seed 4 null realised 7.663 fate FUSED hybGens 23/24 ratio Infinity
card14 page d=4 seed 4 placed realised 3.953 fate FUSED hybGens 23/24 ratio 0.788
card14 page d=4 seed 4 null realised 3.953 fate FUSED hybGens 23/24 ratio 2.205
card14 page d=8 seed 5 placed realised 8.090 fate one lost hybGens 0/24 ratio null
card14 page d=8 seed 5 null realised 8.090 fate FUSED hybGens 23/24 ratio 1.385
card14 page d=4 seed 5 placed realised 3.895 fate one lost hybGens 7/24 ratio 0.667
card14 page d=4 seed 5 null realised 3.895 fate FUSED hybGens 23/24 ratio 1.278
card14 page d=8 seed 6 placed realised 7.995 fate one lost hybGens 0/24 ratio null
card14 page d=8 seed 6 null realised 7.995 fate FUSED hybGens 23/24 ratio 1.259
card14 page d=4 seed 6 placed realised 4.080 fate one lost hybGens 6/24 ratio 1.300
card14 page d=4 seed 6 null realised 4.080 fate FUSED hybGens 23/24 ratio 0.999
card14 page d=8 seed 7 placed realised 8.033 fate one lost hybGens 0/24 ratio null
card14 page d=8 seed 7 null realised 8.033 fate FUSED hybGens 23/24 ratio 0.738
card14 page d=4 seed 7 placed realised 4.025 fate one lost hybGens 0/24 ratio null
card14 page d=4 seed 7 null realised 4.025 fate FUSED hybGens 23/24 ratio 1.124
card14 page d=8 seed 8 placed realised 7.965 fate one lost hybGens 0/24 ratio null
card14 page d=8 seed 8 null realised 7.965 fate FUSED hybGens 23/24 ratio 0.832
card14 page d=4 seed 8 placed realised 4.042 fate FUSED hybGens 23/24 ratio 1.537
card14 page d=4 seed 8 null realised 4.042 fate FUSED hybGens 23/24 ratio 0.900
card14 page d=8 seed 9 placed realised 8.034 fate one lost hybGens 0/24 ratio null
card14 page d=8 seed 9 null realised 8.034 fate FUSED hybGens 23/24 ratio 0.963
card14 page d=4 seed 9 placed realised 3.963 fate FUSED hybGens 23/24 ratio 0.829
card14 page d=4 seed 9 null realised 3.963 fate FUSED hybGens 23/24 ratio 0.758
card14 page d=8 seed 10 placed realised 8.145 fate one lost hybGens 0/24 ratio null
card14 page d=8 seed 10 null realised 8.145 fate FUSED hybGens 23/24 ratio 1.959
card14 page d=4 seed 10 placed realised 3.806 fate one lost hybGens 5/24 ratio 0.669
card14 page d=4 seed 10 null realised 3.806 fate FUSED hybGens 23/24 ratio 1.260
card14 page d=8 seed 11 placed realised 7.856 fate one lost hybGens 0/24 ratio null
card14 page d=8 seed 11 null realised 7.856 fate FUSED hybGens 23/24 ratio 0.635
card14 page d=4 seed 11 placed realised 3.982 fate one lost hybGens 4/24 ratio 0.862
card14 page d=4 seed 11 null realised 3.982 fate FUSED hybGens 23/24 ratio 1.312
card14 page d=8 seed 12 placed realised 7.996 fate one lost hybGens 0/24 ratio null
card14 page d=8 seed 12 null realised 7.996 fate FUSED hybGens 23/24 ratio 0.982
card14 page d=4 seed 12 placed realised 4.229 fate one lost hybGens 0/24 ratio null
card14 page d=4 seed 12 null realised 4.229 fate FUSED hybGens 23/24 ratio 1.307
card14 page d=8 seed 13 placed realised 8.016 fate one lost hybGens 0/24 ratio null
card14 page d=8 seed 13 null realised 8.016 fate FUSED hybGens 23/24 ratio 26.389
card14 page d=4 seed 13 placed realised 3.966 fate FUSED hybGens 23/24 ratio 1.142
card14 page d=4 seed 13 null realised 3.966 fate FUSED hybGens 23/24 ratio 4.264
card14 page d=8 seed 14 placed realised 8.217 fate one lost hybGens 0/24 ratio null
card14 page d=8 seed 14 null realised 8.217 fate FUSED hybGens 23/24 ratio 2.153
card14 page d=4 seed 14 placed realised 4.291 fate FUSED hybGens 23/24 ratio 0.867
card14 page d=4 seed 14 null realised 4.291 fate FUSED hybGens 23/24 ratio 0.887
card14 page d=8 seed 15 placed realised 7.987 fate one lost hybGens 0/24 ratio null
card14 page d=8 seed 15 null realised 7.987 fate FUSED hybGens 23/24 ratio 1.031
card14 page d=4 seed 15 placed realised 3.961 fate one lost hybGens 0/24 ratio null
card14 page d=4 seed 15 null realised 3.961 fate FUSED hybGens 23/24 ratio 0.806
EXIT 0
# card14 page N=18 gens=24 siteN=90 seeds 16-30
card14 page d=8 seed 16 placed realised 8.076 fate one lost hybGens 0/24 ratio null
card14 page d=8 seed 16 null realised 8.076 fate FUSED hybGens 23/24 ratio 0.801
card14 page d=4 seed 16 placed realised 3.849 fate one lost hybGens 1/24 ratio 0.111
card14 page d=4 seed 16 null realised 3.849 fate FUSED hybGens 23/24 ratio 1.085
card14 page d=8 seed 17 placed realised 8.086 fate one lost hybGens 0/24 ratio null
card14 page d=8 seed 17 null realised 8.086 fate FUSED hybGens 23/24 ratio 0.818
card14 page d=4 seed 17 placed realised 3.818 fate FUSED hybGens 23/24 ratio 0.871
card14 page d=4 seed 17 null realised 3.818 fate FUSED hybGens 23/24 ratio 1.258
card14 page d=8 seed 18 nobuild
card14 page d=8 seed 18 nobuild
card14 page d=4 seed 18 nobuild
card14 page d=4 seed 18 nobuild
card14 page d=8 seed 19 placed realised 8.075 fate one lost hybGens 0/24 ratio null
card14 page d=8 seed 19 null realised 8.075 fate FUSED hybGens 23/24 ratio 0.666
card14 page d=4 seed 19 placed realised 3.739 fate one lost hybGens 2/24 ratio 0.138
card14 page d=4 seed 19 null realised 3.739 fate FUSED hybGens 23/24 ratio 0.642
card14 page d=8 seed 20 placed realised 8.062 fate one lost hybGens 0/24 ratio null
card14 page d=8 seed 20 null realised 8.062 fate FUSED hybGens 23/24 ratio 0.703
card14 page d=4 seed 20 placed realised 4.049 fate one lost hybGens 5/24 ratio 0.302
card14 page d=4 seed 20 null realised 4.049 fate FUSED hybGens 23/24 ratio Infinity
card14 page d=8 seed 21 placed realised 7.952 fate one lost hybGens 0/24 ratio null
card14 page d=8 seed 21 null realised 7.952 fate FUSED hybGens 23/24 ratio 1.072
card14 page d=4 seed 21 placed realised 3.935 fate one lost hybGens 10/24 ratio 0.607
card14 page d=4 seed 21 null realised 3.935 fate FUSED hybGens 23/24 ratio 1.234
card14 page d=8 seed 22 placed realised 7.976 fate one lost hybGens 0/24 ratio null
card14 page d=8 seed 22 null realised 7.976 fate FUSED hybGens 23/24 ratio 0.603
card14 page d=4 seed 22 placed realised 4.013 fate FUSED hybGens 23/24 ratio 0.844
card14 page d=4 seed 22 null realised 4.013 fate FUSED hybGens 23/24 ratio 14.177
card14 page d=8 seed 23 placed realised 8.138 fate one lost hybGens 2/24 ratio 0.637
card14 page d=8 seed 23 null realised 8.138 fate FUSED hybGens 23/24 ratio 0.674
card14 page d=4 seed 23 placed realised 3.952 fate one lost hybGens 5/24 ratio 1.614
card14 page d=4 seed 23 null realised 3.952 fate FUSED hybGens 23/24 ratio 1.135
card14 page d=8 seed 24 placed realised 8.400 fate one lost hybGens 0/24 ratio null
card14 page d=8 seed 24 null realised 8.400 fate FUSED hybGens 23/24 ratio 6.487
card14 page d=4 seed 24 placed realised 3.719 fate one lost hybGens 3/24 ratio 0.567
card14 page d=4 seed 24 null realised 3.719 fate FUSED hybGens 23/24 ratio 2.701
card14 page d=8 seed 25 placed realised 7.680 fate one lost hybGens 3/24 ratio 0.279
card14 page d=8 seed 25 null realised 7.680 fate FUSED hybGens 23/24 ratio 2.031
card14 page d=4 seed 25 placed realised 4.003 fate FUSED hybGens 23/24 ratio 0.932
card14 page d=4 seed 25 null realised 4.003 fate FUSED hybGens 23/24 ratio 1.964
card14 page d=8 seed 26 placed realised 8.089 fate one lost hybGens 0/24 ratio null
card14 page d=8 seed 26 null realised 8.089 fate FUSED hybGens 23/24 ratio 0.872
card14 page d=4 seed 26 placed realised 4.085 fate FUSED hybGens 23/24 ratio 1.210
card14 page d=4 seed 26 null realised 4.085 fate FUSED hybGens 23/24 ratio 2.004
card14 page d=8 seed 27 placed realised 7.711 fate one lost hybGens 0/24 ratio null
card14 page d=8 seed 27 null realised 7.711 fate FUSED hybGens 23/24 ratio 3.426
card14 page d=4 seed 27 placed realised 4.009 fate FUSED hybGens 23/24 ratio 1.310
card14 page d=4 seed 27 null realised 4.009 fate FUSED hybGens 23/24 ratio 0.697
card14 page d=8 seed 28 placed realised 7.832 fate one lost hybGens 0/24 ratio null
card14 page d=8 seed 28 null realised 7.832 fate FUSED hybGens 23/24 ratio 1.473
card14 page d=4 seed 28 placed realised 4.117 fate FUSED hybGens 23/24 ratio 0.753
card14 page d=4 seed 28 null realised 4.117 fate FUSED hybGens 23/24 ratio 1.505
card14 page d=8 seed 29 placed realised 7.997 fate one lost hybGens 0/24 ratio null
card14 page d=8 seed 29 null realised 7.997 fate FUSED hybGens 23/24 ratio 0.864
card14 page d=4 seed 29 placed realised 3.940 fate one lost hybGens 0/24 ratio null
card14 page d=4 seed 29 null realised 3.940 fate FUSED hybGens 23/24 ratio 1.231
card14 page d=8 seed 30 placed realised 7.814 fate one lost hybGens 0/24 ratio null
card14 page d=8 seed 30 null realised 7.814 fate FUSED hybGens 23/24 ratio 1.255
card14 page d=4 seed 30 placed realised 3.637 fate one lost hybGens 7/24 ratio 0.854
card14 page d=4 seed 30 null realised 3.637 fate FUSED hybGens 23/24 ratio 0.660
EXIT 0
# card14 level chunks 1-6, 7-12, 19-24, 25-30 hit the 590 s guard (EXIT 124) after seeds 1-5, 7-10 (+11 partial), 19-23, 25-29; those seeds' rows are kept, the rest come from the single-seed re-runs below
# card14 level N=30 gens=35 siteN=160 seeds 1-6
card14 level d=8 seed 1 placed realised 8.163 fate one lost hybGens 0/35 ratio null
card14 level d=8 seed 1 null realised 8.163 fate FUSED hybGens 34/35 ratio 1.869
card14 level d=4 seed 1 placed realised 3.995 fate FUSED hybGens 34/35 ratio 0.695
card14 level d=4 seed 1 null realised 3.995 fate FUSED hybGens 34/35 ratio 1.297
card14 level d=8 seed 2 placed realised 8.062 fate one lost hybGens 0/35 ratio null
card14 level d=8 seed 2 null realised 8.062 fate FUSED hybGens 34/35 ratio 1.445
card14 level d=4 seed 2 placed realised 3.933 fate FUSED hybGens 33/35 ratio 0.675
card14 level d=4 seed 2 null realised 3.933 fate FUSED hybGens 34/35 ratio 0.903
card14 level d=8 seed 3 placed realised 8.136 fate one lost hybGens 0/35 ratio null
card14 level d=8 seed 3 null realised 8.136 fate FUSED hybGens 34/35 ratio 1.439
card14 level d=4 seed 3 placed realised 4.027 fate FUSED hybGens 34/35 ratio 2.399
card14 level d=4 seed 3 null realised 4.027 fate FUSED hybGens 34/35 ratio 1.258
card14 level d=8 seed 4 placed realised 7.663 fate one lost hybGens 0/35 ratio null
card14 level d=8 seed 4 null realised 7.663 fate FUSED hybGens 34/35 ratio 1.254
card14 level d=4 seed 4 placed realised 3.951 fate FUSED hybGens 34/35 ratio 1.503
card14 level d=4 seed 4 null realised 3.951 fate FUSED hybGens 34/35 ratio 1.528
card14 level d=8 seed 5 placed realised 8.136 fate one lost hybGens 0/35 ratio null
card14 level d=8 seed 5 null realised 8.136 fate FUSED hybGens 34/35 ratio 0.329
card14 level d=4 seed 5 placed realised 3.898 fate FUSED hybGens 34/35 ratio 0.696
card14 level d=4 seed 5 null realised 3.898 fate FUSED hybGens 34/35 ratio 2.430
EXIT 124
# card14 level N=30 gens=35 siteN=160 seeds 7-12
card14 level d=8 seed 7 placed realised 8.032 fate one lost hybGens 0/35 ratio null
card14 level d=8 seed 7 null realised 8.032 fate FUSED hybGens 34/35 ratio 1.378
card14 level d=4 seed 7 placed realised 4.033 fate one lost hybGens 2/35 ratio 0.754
card14 level d=4 seed 7 null realised 4.033 fate FUSED hybGens 34/35 ratio 1.339
card14 level d=8 seed 8 placed realised 7.996 fate one lost hybGens 0/35 ratio null
card14 level d=8 seed 8 null realised 7.996 fate FUSED hybGens 34/35 ratio 0.601
card14 level d=4 seed 8 placed realised 4.048 fate FUSED hybGens 34/35 ratio 1.274
card14 level d=4 seed 8 null realised 4.048 fate FUSED hybGens 34/35 ratio 0.777
card14 level d=8 seed 9 placed realised 8.042 fate one lost hybGens 0/35 ratio null
card14 level d=8 seed 9 null realised 8.042 fate FUSED hybGens 34/35 ratio 0.943
card14 level d=4 seed 9 placed realised 3.970 fate FUSED hybGens 34/35 ratio 5.194
card14 level d=4 seed 9 null realised 3.970 fate FUSED hybGens 34/35 ratio 0.903
card14 level d=8 seed 10 placed realised 8.146 fate one lost hybGens 0/35 ratio null
card14 level d=8 seed 10 null realised 8.146 fate FUSED hybGens 34/35 ratio 1.593
card14 level d=4 seed 10 placed realised 3.802 fate FUSED hybGens 34/35 ratio 0.699
card14 level d=4 seed 10 null realised 3.802 fate FUSED hybGens 34/35 ratio 0.610
EXIT 124
# card14 level N=30 gens=35 siteN=160 seeds 13-18
card14 level d=8 seed 13 placed realised 8.010 fate one lost hybGens 0/35 ratio null
card14 level d=8 seed 13 null realised 8.010 fate FUSED hybGens 34/35 ratio 19.755
card14 level d=4 seed 13 placed realised 3.986 fate FUSED hybGens 34/35 ratio 0.844
card14 level d=4 seed 13 null realised 3.986 fate FUSED hybGens 34/35 ratio 4.667
card14 level d=8 seed 14 placed realised 8.213 fate one lost hybGens 0/35 ratio null
card14 level d=8 seed 14 null realised 8.213 fate FUSED hybGens 34/35 ratio 0.934
card14 level d=4 seed 14 placed realised 4.274 fate FUSED hybGens 34/35 ratio 0.913
card14 level d=4 seed 14 null realised 4.274 fate FUSED hybGens 34/35 ratio 1.017
card14 level d=8 seed 15 placed realised 8.012 fate one lost hybGens 0/35 ratio null
card14 level d=8 seed 15 null realised 8.012 fate FUSED hybGens 34/35 ratio 4.726
card14 level d=4 seed 15 placed realised 3.955 fate one lost hybGens 3/35 ratio 0.127
card14 level d=4 seed 15 null realised 3.955 fate FUSED hybGens 34/35 ratio 1.482
card14 level d=8 seed 16 placed realised 8.088 fate one lost hybGens 0/35 ratio null
card14 level d=8 seed 16 null realised 8.088 fate FUSED hybGens 34/35 ratio 1.716
card14 level d=4 seed 16 placed realised 3.846 fate one lost hybGens 0/35 ratio null
card14 level d=4 seed 16 null realised 3.846 fate FUSED hybGens 34/35 ratio 0.847
card14 level d=8 seed 17 placed realised 8.100 fate one lost hybGens 0/35 ratio null
card14 level d=8 seed 17 null realised 8.100 fate FUSED hybGens 34/35 ratio 0.701
card14 level d=4 seed 17 placed realised 3.816 fate FUSED hybGens 34/35 ratio 1.015
card14 level d=4 seed 17 null realised 3.816 fate FUSED hybGens 34/35 ratio 1.051
card14 level d=8 seed 18 nobuild
card14 level d=8 seed 18 nobuild
card14 level d=4 seed 18 nobuild
card14 level d=4 seed 18 nobuild
EXIT 0
# card14 level N=30 gens=35 siteN=160 seeds 19-24
card14 level d=8 seed 19 placed realised 8.069 fate one lost hybGens 0/35 ratio null
card14 level d=8 seed 19 null realised 8.069 fate FUSED hybGens 34/35 ratio 0.863
card14 level d=4 seed 19 placed realised 3.773 fate one lost hybGens 2/35 ratio 0.317
card14 level d=4 seed 19 null realised 3.773 fate FUSED hybGens 34/35 ratio 0.996
card14 level d=8 seed 20 placed realised 8.101 fate one lost hybGens 0/35 ratio null
card14 level d=8 seed 20 null realised 8.101 fate FUSED hybGens 34/35 ratio 2.128
card14 level d=4 seed 20 placed realised 4.200 fate FUSED hybGens 34/35 ratio 0.959
card14 level d=4 seed 20 null realised 4.200 fate FUSED hybGens 34/35 ratio 1.254
card14 level d=8 seed 21 placed realised 7.907 fate one lost hybGens 0/35 ratio null
card14 level d=8 seed 21 null realised 7.907 fate FUSED hybGens 34/35 ratio 0.829
card14 level d=4 seed 21 placed realised 3.931 fate one lost hybGens 11/35 ratio 0.551
card14 level d=4 seed 21 null realised 3.931 fate FUSED hybGens 34/35 ratio 0.624
card14 level d=8 seed 22 placed realised 8.114 fate one lost hybGens 0/35 ratio null
card14 level d=8 seed 22 null realised 8.114 fate FUSED hybGens 34/35 ratio 0.776
card14 level d=4 seed 22 placed realised 4.026 fate FUSED hybGens 34/35 ratio 1.540
card14 level d=4 seed 22 null realised 4.026 fate FUSED hybGens 34/35 ratio 1.598
card14 level d=8 seed 23 placed realised 8.143 fate one lost hybGens 0/35 ratio null
card14 level d=8 seed 23 null realised 8.143 fate FUSED hybGens 34/35 ratio 0.583
card14 level d=4 seed 23 placed realised 3.956 fate FUSED hybGens 34/35 ratio 0.691
card14 level d=4 seed 23 null realised 3.956 fate FUSED hybGens 34/35 ratio 0.765
EXIT 124
# card14 level N=30 gens=35 siteN=160 seeds 25-30
card14 level d=8 seed 25 placed realised 7.760 fate one lost hybGens 3/35 ratio 0.049
card14 level d=8 seed 25 null realised 7.760 fate FUSED hybGens 34/35 ratio 0.579
card14 level d=4 seed 25 placed realised 3.953 fate FUSED hybGens 34/35 ratio 1.315
card14 level d=4 seed 25 null realised 3.953 fate FUSED hybGens 34/35 ratio 0.864
card14 level d=8 seed 26 placed realised 8.089 fate one lost hybGens 0/35 ratio null
card14 level d=8 seed 26 null realised 8.089 fate FUSED hybGens 34/35 ratio 1.012
card14 level d=4 seed 26 placed realised 4.067 fate FUSED hybGens 34/35 ratio 0.814
card14 level d=4 seed 26 null realised 4.067 fate FUSED hybGens 34/35 ratio 0.530
card14 level d=8 seed 27 placed realised 7.719 fate one lost hybGens 0/35 ratio null
card14 level d=8 seed 27 null realised 7.719 fate FUSED hybGens 34/35 ratio 2.520
card14 level d=4 seed 27 placed realised 4.015 fate FUSED hybGens 34/35 ratio 1.603
card14 level d=4 seed 27 null realised 4.015 fate FUSED hybGens 34/35 ratio 1.111
card14 level d=8 seed 28 placed realised 7.867 fate one lost hybGens 0/35 ratio null
card14 level d=8 seed 28 null realised 7.867 fate FUSED hybGens 34/35 ratio 1.154
card14 level d=4 seed 28 placed realised 4.121 fate FUSED hybGens 34/35 ratio 1.390
card14 level d=4 seed 28 null realised 4.121 fate FUSED hybGens 34/35 ratio 3.056
card14 level d=8 seed 29 placed realised 8.013 fate one lost hybGens 0/35 ratio null
card14 level d=8 seed 29 null realised 8.013 fate FUSED hybGens 34/35 ratio 0.000
card14 level d=4 seed 29 placed realised 3.942 fate one lost hybGens 0/35 ratio null
card14 level d=4 seed 29 null realised 3.942 fate FUSED hybGens 34/35 ratio 1.577
EXIT 124
# card14 level N=30 gens=35 siteN=160 seeds 6-6
card14 level d=8 seed 6 placed realised 7.998 fate one lost hybGens 0/35 ratio null
card14 level d=8 seed 6 null realised 7.998 fate FUSED hybGens 34/35 ratio 0.757
card14 level d=4 seed 6 placed realised 4.084 fate one lost hybGens 8/35 ratio 1.277
card14 level d=4 seed 6 null realised 4.084 fate FUSED hybGens 34/35 ratio 2.008
EXIT 0
# card14 level N=30 gens=35 siteN=160 seeds 11-12
card14 level d=8 seed 11 placed realised 7.882 fate one lost hybGens 0/35 ratio null
card14 level d=8 seed 11 null realised 7.882 fate FUSED hybGens 34/35 ratio 0.669
card14 level d=4 seed 11 placed realised 3.995 fate one lost hybGens 10/35 ratio 1.305
card14 level d=4 seed 11 null realised 3.995 fate FUSED hybGens 34/35 ratio 1.100
card14 level d=8 seed 12 placed realised 8.005 fate one lost hybGens 0/35 ratio null
card14 level d=8 seed 12 null realised 8.005 fate FUSED hybGens 34/35 ratio 0.925
card14 level d=4 seed 12 placed realised 4.234 fate one lost hybGens 0/35 ratio null
card14 level d=4 seed 12 null realised 4.234 fate FUSED hybGens 34/35 ratio 1.192
EXIT 0
# card14 level N=30 gens=35 siteN=160 seeds 24-24
card14 level d=8 seed 24 placed realised 8.446 fate one lost hybGens 0/35 ratio null
card14 level d=8 seed 24 null realised 8.446 fate FUSED hybGens 34/35 ratio 1.198
card14 level d=4 seed 24 placed realised 3.733 fate one lost hybGens 8/35 ratio 1.189
card14 level d=4 seed 24 null realised 3.733 fate FUSED hybGens 34/35 ratio 0.847
EXIT 0
# card14 level N=30 gens=35 siteN=160 seeds 30-30
card14 level d=8 seed 30 placed realised 7.847 fate one lost hybGens 0/35 ratio null
card14 level d=8 seed 30 null realised 7.847 fate FUSED hybGens 34/35 ratio 0.875
card14 level d=4 seed 30 placed realised 3.636 fate FUSED hybGens 34/35 ratio 0.942
card14 level d=4 seed 30 null realised 3.636 fate FUSED hybGens 34/35 ratio 1.583
EXIT 0
# card23 d=8 N=30 gens=35 siteN=160 seeds 1-10
card23 d=8 a=1 seed 1 realised 8.163 fate one lost peak 0.033 mean 0.003 tGap -1 tAnc 3
card23 d=8 a=0.25 seed 1 realised 8.163 fate one lost peak 0.667 mean 0.238 tGap 8 tAnc 8
card23 d=8 a=1 seed 2 realised 8.062 fate one lost peak 0.033 mean 0.001 tGap -1 tAnc 8
card23 d=8 a=0.25 seed 2 realised 8.062 fate one lost peak 0.400 mean 0.143 tGap 13 tAnc 19
card23 d=8 a=1 seed 3 realised 8.136 fate one lost peak 0.067 mean 0.003 tGap -1 tAnc 4
card23 d=8 a=0.25 seed 3 realised 8.136 fate FUSED peak 0.400 mean 0.091 tGap 20 tAnc 24
card23 d=8 a=1 seed 4 realised 7.663 fate one lost peak 0.100 mean 0.018 tGap 21 tAnc 4
card23 d=8 a=0.25 seed 4 realised 7.663 fate HELD peak 0.067 mean 0.019 tGap -1 tAnc -1
card23 d=8 a=1 seed 5 realised 8.136 fate one lost peak 0.100 mean 0.006 tGap 31 tAnc 1
card23 d=8 a=0.25 seed 5 realised 8.136 fate one lost peak 0.033 mean 0.003 tGap -1 tAnc 1
card23 d=8 a=1 seed 6 realised 7.998 fate one lost peak 0.333 mean 0.106 tGap 17 tAnc 2
card23 d=8 a=0.25 seed 6 realised 7.998 fate FUSED peak 0.633 mean 0.266 tGap 14 tAnc 17
card23 d=8 a=1 seed 7 realised 8.032 fate one lost peak 0.033 mean 0.002 tGap -1 tAnc 2
card23 d=8 a=0.25 seed 7 realised 8.032 fate one lost peak 0.267 mean 0.041 tGap 27 tAnc 6
card23 d=8 a=1 seed 8 realised 7.996 fate one lost peak 0.100 mean 0.017 tGap 23 tAnc 3
card23 d=8 a=0.25 seed 8 realised 7.996 fate one lost peak 0.567 mean 0.141 tGap 11 tAnc 6
card23 d=8 a=1 seed 9 realised 8.042 fate one lost peak 0.033 mean 0.004 tGap -1 tAnc 5
card23 d=8 a=0.25 seed 9 realised 8.042 fate one lost peak 0.300 mean 0.089 tGap 17 tAnc 9
card23 d=8 a=1 seed 10 realised 8.146 fate one lost peak 0.033 mean 0.004 tGap -1 tAnc 3
card23 d=8 a=0.25 seed 10 realised 8.146 fate HELD peak 0.133 mean 0.012 tGap 32 tAnc 21
EXIT 0
# card23 d=8 N=30 gens=35 siteN=160 seeds 11-20
card23 d=8 a=1 seed 11 realised 7.882 fate one lost peak 0.034 mean 0.003 tGap -1 tAnc 3
card23 d=8 a=0.25 seed 11 realised 7.882 fate one lost peak 0.133 mean 0.012 tGap 24 tAnc 29
card23 d=8 a=1 seed 12 realised 8.005 fate one lost peak 0.100 mean 0.024 tGap 23 tAnc 5
card23 d=8 a=0.25 seed 12 realised 8.005 fate FUSED peak 0.069 mean 0.010 tGap -1 tAnc 33
card23 d=8 a=1 seed 13 realised 8.010 fate one lost peak 0.433 mean 0.170 tGap 5 tAnc 9
card23 d=8 a=0.25 seed 13 realised 8.010 fate one lost peak 0.500 mean 0.174 tGap 7 tAnc 14
card23 d=8 a=1 seed 14 realised 8.213 fate one lost peak 0.033 mean 0.002 tGap -1 tAnc 1
card23 d=8 a=0.25 seed 14 realised 8.213 fate one lost peak 0.033 mean 0.002 tGap -1 tAnc 1
card23 d=8 a=1 seed 15 realised 8.012 fate one lost peak 0.133 mean 0.017 tGap 19 tAnc 1
card23 d=8 a=0.25 seed 15 realised 8.012 fate one lost peak 0.267 mean 0.077 tGap 20 tAnc 1
card23 d=8 a=1 seed 16 realised 8.088 fate one lost peak 0.233 mean 0.049 tGap 20 tAnc 3
card23 d=8 a=0.25 seed 16 realised 8.088 fate FUSED peak 0.333 mean 0.120 tGap 15 tAnc 27
card23 d=8 a=1 seed 17 realised 8.100 fate one lost peak 0.100 mean 0.019 tGap 10 tAnc 3
card23 d=8 a=0.25 seed 17 realised 8.100 fate FUSED peak 0.633 mean 0.249 tGap 13 tAnc 16
card23 d=8 a=1 seed 18 nobuild
card23 d=8 a=0.25 seed 18 nobuild
card23 d=8 a=1 seed 19 realised 8.069 fate one lost peak 0.267 mean 0.079 tGap 13 tAnc 8
card23 d=8 a=0.25 seed 19 realised 8.069 fate HELD peak 0.300 mean 0.059 tGap 14 tAnc -1
card23 d=8 a=1 seed 20 realised 8.101 fate one lost peak 0.037 mean 0.003 tGap -1 tAnc 4
card23 d=8 a=0.25 seed 20 realised 8.101 fate FUSED peak 0.700 mean 0.166 tGap 21 tAnc 24
EXIT 0
# card23 d=8 N=30 gens=35 siteN=160 seeds 21-30
card23 d=8 a=1 seed 21 realised 7.907 fate one lost peak 0.133 mean 0.011 tGap 33 tAnc 8
card23 d=8 a=0.25 seed 21 realised 7.907 fate HELD peak 0.233 mean 0.066 tGap 12 tAnc -1
card23 d=8 a=1 seed 22 realised 8.114 fate one lost peak 0.033 mean 0.001 tGap -1 tAnc 1
card23 d=8 a=0.25 seed 22 realised 8.114 fate one lost peak 0.133 mean 0.030 tGap 20 tAnc 1
card23 d=8 a=1 seed 23 realised 8.143 fate one lost peak 0.233 mean 0.034 tGap 20 tAnc 5
card23 d=8 a=0.25 seed 23 realised 8.143 fate FUSED peak 0.800 mean 0.548 tGap 2 tAnc 5
card23 d=8 a=1 seed 24 realised 8.446 fate one lost peak 0.000 mean 0.000 tGap -1 tAnc 1
card23 d=8 a=0.25 seed 24 realised 8.446 fate one lost peak 0.300 mean 0.037 tGap 29 tAnc 1
card23 d=8 a=1 seed 25 realised 7.760 fate one lost peak 0.067 mean 0.013 tGap -1 tAnc 3
card23 d=8 a=0.25 seed 25 realised 7.760 fate FUSED peak 0.733 mean 0.416 tGap 9 tAnc 11
card23 d=8 a=1 seed 26 realised 8.089 fate one lost peak 0.400 mean 0.063 tGap 27 tAnc 5
card23 d=8 a=0.25 seed 26 realised 8.089 fate one lost peak 0.700 mean 0.232 tGap 16 tAnc 6
card23 d=8 a=1 seed 27 realised 7.719 fate one lost peak 0.067 mean 0.005 tGap -1 tAnc 6
card23 d=8 a=0.25 seed 27 realised 7.719 fate one lost peak 0.600 mean 0.167 tGap 18 tAnc 10
card23 d=8 a=1 seed 28 realised 7.867 fate one lost peak 0.167 mean 0.018 tGap 31 tAnc 6
card23 d=8 a=0.25 seed 28 realised 7.867 fate one lost peak 0.533 mean 0.160 tGap 14 tAnc 20
card23 d=8 a=1 seed 29 realised 8.013 fate one lost peak 0.033 mean 0.002 tGap -1 tAnc 1
card23 d=8 a=0.25 seed 29 realised 8.013 fate one lost peak 0.400 mean 0.070 tGap 25 tAnc 1
card23 d=8 a=1 seed 30 realised 7.847 fate one lost peak 0.133 mean 0.032 tGap 18 tAnc 1
card23 d=8 a=0.25 seed 30 realised 7.847 fate one lost peak 0.100 mean 0.031 tGap 16 tAnc 1
EXIT 0
# card23 d=4 N=30 gens=35 siteN=160 seeds 1-10
card23 d=4 a=1 seed 1 realised 3.995 fate FUSED peak 0.367 mean 0.105 tGap 1 tAnc 3
card23 d=4 a=0.25 seed 1 realised 3.995 fate FUSED peak 0.400 mean 0.231 tGap 1 tAnc 5
card23 d=4 a=1 seed 2 realised 3.933 fate FUSED peak 0.400 mean 0.191 tGap 2 tAnc 6
card23 d=4 a=0.25 seed 2 realised 3.933 fate FUSED peak 0.467 mean 0.230 tGap 2 tAnc 6
card23 d=4 a=1 seed 3 realised 4.027 fate FUSED peak 0.300 mean 0.118 tGap 1 tAnc 3
card23 d=4 a=0.25 seed 3 realised 4.027 fate FUSED peak 0.433 mean 0.289 tGap 2 tAnc 3
card23 d=4 a=1 seed 4 realised 3.951 fate FUSED peak 0.667 mean 0.311 tGap 3 tAnc 4
card23 d=4 a=0.25 seed 4 realised 3.951 fate FUSED peak 0.367 mean 0.092 tGap 4 tAnc 4
card23 d=4 a=1 seed 5 realised 3.898 fate FUSED peak 0.533 mean 0.330 tGap 1 tAnc 3
card23 d=4 a=0.25 seed 5 realised 3.898 fate FUSED peak 0.600 mean 0.354 tGap 1 tAnc 3
card23 d=4 a=1 seed 6 realised 4.084 fate one lost peak 0.300 mean 0.136 tGap 1 tAnc 2
card23 d=4 a=0.25 seed 6 realised 4.084 fate FUSED peak 0.533 mean 0.237 tGap 1 tAnc 3
card23 d=4 a=1 seed 7 realised 4.033 fate one lost peak 0.100 mean 0.011 tGap 30 tAnc 11
card23 d=4 a=0.25 seed 7 realised 4.033 fate FUSED peak 0.367 mean 0.135 tGap 8 tAnc 9
card23 d=4 a=1 seed 8 realised 4.048 fate FUSED peak 0.900 mean 0.596 tGap 1 tAnc 3
card23 d=4 a=0.25 seed 8 realised 4.048 fate FUSED peak 0.767 mean 0.371 tGap 1 tAnc 2
card23 d=4 a=1 seed 9 realised 3.970 fate FUSED peak 0.433 mean 0.111 tGap 1 tAnc 3
card23 d=4 a=0.25 seed 9 realised 3.970 fate FUSED peak 0.267 mean 0.091 tGap 1 tAnc 2
card23 d=4 a=1 seed 10 realised 3.802 fate FUSED peak 0.167 mean 0.027 tGap 2 tAnc 2
card23 d=4 a=0.25 seed 10 realised 3.802 fate FUSED peak 0.300 mean 0.106 tGap 1 tAnc 2
EXIT 0
# card5 rare-floor N0=30 gens=35 siteN=160 d=8 phenology 8/0.12 visitsPerPlant 800 seeds 1-6
card5 seed 1 arm R200 one lost
card5 seed 1 arm R200q69 HELD
card5 seed 1 arm R200q85 one lost
card5 seed 2 arm R200 one lost
card5 seed 2 arm R200q69 one lost
card5 seed 2 arm R200q85 one lost
card5 seed 3 arm R200 one lost
card5 seed 3 arm R200q69 one lost
card5 seed 3 arm R200q85 one lost
card5 seed 4 arm R200 one lost
card5 seed 4 arm R200q69 one lost
card5 seed 4 arm R200q85 one lost
card5 seed 5 arm R200 one lost
card5 seed 5 arm R200q69 one lost
card5 seed 5 arm R200q85 one lost
card5 seed 6 arm R200 one lost
card5 seed 6 arm R200q69 one lost
card5 seed 6 arm R200q85 one lost
EXIT 0
# card5 rare-floor N0=30 gens=35 siteN=160 d=8 phenology 8/0.12 visitsPerPlant 800 seeds 7-12
card5 seed 7 arm R200 one lost
card5 seed 7 arm R200q69 HELD
card5 seed 7 arm R200q85 one lost
card5 seed 8 arm R200 HELD
card5 seed 8 arm R200q69 one lost
card5 seed 8 arm R200q85 one lost
card5 seed 9 arm R200 HELD
card5 seed 9 arm R200q69 one lost
card5 seed 9 arm R200q85 one lost
card5 seed 10 arm R200 HELD
card5 seed 10 arm R200q69 one lost
card5 seed 10 arm R200q85 one lost
card5 seed 11 arm R200 HELD
card5 seed 11 arm R200q69 one lost
card5 seed 11 arm R200q85 one lost
card5 seed 12 arm R200 HELD
card5 seed 12 arm R200q69 one lost
card5 seed 12 arm R200q85 one lost
EXIT 0
# card5 rare-floor N0=30 gens=35 siteN=160 d=8 phenology 8/0.12 visitsPerPlant 800 seeds 13-18
card5 seed 13 arm R200 HELD
card5 seed 13 arm R200q69 one lost
card5 seed 13 arm R200q85 one lost
card5 seed 14 arm R200 one lost
card5 seed 14 arm R200q69 one lost
card5 seed 14 arm R200q85 one lost
card5 seed 15 arm R200 one lost
card5 seed 15 arm R200q69 one lost
card5 seed 15 arm R200q85 one lost
card5 seed 16 arm R200 one lost
card5 seed 16 arm R200q69 one lost
card5 seed 16 arm R200q85 one lost
card5 seed 17 arm R200 HELD
card5 seed 17 arm R200q69 one lost
card5 seed 17 arm R200q85 one lost
card5 seed 18 arm R200 nobuild
card5 seed 18 arm R200q69 nobuild
card5 seed 18 arm R200q85 nobuild
EXIT 0
# card5 rare-floor N0=30 gens=35 siteN=160 d=8 phenology 8/0.12 visitsPerPlant 800 seeds 19-24
card5 seed 19 arm R200 one lost
card5 seed 19 arm R200q69 HELD
card5 seed 19 arm R200q85 HELD
card5 seed 20 arm R200 one lost
card5 seed 20 arm R200q69 HELD
card5 seed 20 arm R200q85 one lost
card5 seed 21 arm R200 HELD
card5 seed 21 arm R200q69 HELD
card5 seed 21 arm R200q85 HELD
card5 seed 22 arm R200 one lost
card5 seed 22 arm R200q69 one lost
card5 seed 22 arm R200q85 one lost
card5 seed 23 arm R200 HELD
card5 seed 23 arm R200q69 one lost
card5 seed 23 arm R200q85 one lost
card5 seed 24 arm R200 one lost
card5 seed 24 arm R200q69 one lost
card5 seed 24 arm R200q85 one lost
EXIT 0
# card5 rare-floor N0=30 gens=35 siteN=160 d=8 phenology 8/0.12 visitsPerPlant 800 seeds 25-30
card5 seed 25 arm R200 one lost
card5 seed 25 arm R200q69 one lost
card5 seed 25 arm R200q85 one lost
card5 seed 26 arm R200 HELD
card5 seed 26 arm R200q69 HELD
card5 seed 26 arm R200q85 one lost
card5 seed 27 arm R200 HELD
card5 seed 27 arm R200q69 one lost
card5 seed 27 arm R200q85 one lost
card5 seed 28 arm R200 one lost
card5 seed 28 arm R200q69 one lost
card5 seed 28 arm R200q85 one lost
card5 seed 29 arm R200 one lost
card5 seed 29 arm R200q69 one lost
card5 seed 29 arm R200q85 one lost
card5 seed 30 arm R200 one lost
card5 seed 30 arm R200q69 one lost
card5 seed 30 arm R200q85 one lost
EXIT 0
# card6 evolving-width S=8 conserved N0=30 gens=35 siteN=160 d=8 widthMut 0.03 seeds 1-8
card6 seed 1 treatment 0.835 one lost shuffled 0.589 one lost diff 0.247
card6 seed 2 treatment 0.679 one lost shuffled 0.815 one lost diff -0.137
card6 seed 3 treatment 0.867 one lost shuffled 0.473 one lost diff 0.393
card6 seed 4 treatment 0.669 one lost shuffled 0.544 one lost diff 0.125
card6 seed 5 treatment 0.718 one lost shuffled 0.416 one lost diff 0.302
card6 seed 6 treatment 0.845 one lost shuffled 0.211 one lost diff 0.633
card6 seed 7 treatment 0.844 one lost shuffled 0.734 one lost diff 0.110
card6 seed 8 treatment 0.898 one lost shuffled 0.673 one lost diff 0.226
EXIT 0
# card6 evolving-width S=8 conserved N0=30 gens=35 siteN=160 d=8 widthMut 0.03 seeds 9-15
card6 seed 9 treatment 0.926 one lost shuffled 0.591 one lost diff 0.335
card6 seed 10 treatment 0.627 one lost shuffled 0.529 one lost diff 0.098
card6 seed 11 treatment 0.873 one lost shuffled 0.151 one lost diff 0.721
card6 seed 12 treatment 0.916 one lost shuffled 0.483 one lost diff 0.434
card6 seed 13 treatment 0.878 one lost shuffled 0.110 one lost diff 0.768
card6 seed 14 treatment 0.890 one lost shuffled 0.403 one lost diff 0.488
card6 seed 15 treatment 0.753 one lost shuffled 0.271 one lost diff 0.482
EXIT 0
# card6 evolving-width S=8 conserved N0=30 gens=35 siteN=160 d=8 widthMut 0.03 seeds 16-23
card6 seed 16 treatment 0.725 one lost shuffled 0.405 one lost diff 0.320
card6 seed 17 treatment 0.890 one lost shuffled 0.359 one lost diff 0.531
card6 seed 18 treatment nobuild shuffled nobuild diff null
card6 seed 19 treatment 0.781 one lost shuffled 0.392 one lost diff 0.389
card6 seed 20 treatment 0.759 one lost shuffled 0.583 HELD diff 0.176
card6 seed 21 treatment 0.669 one lost shuffled 0.653 one lost diff 0.016
card6 seed 22 treatment 0.687 one lost shuffled 0.589 one lost diff 0.097
card6 seed 23 treatment 0.666 one lost shuffled 0.673 one lost diff -0.006
EXIT 0
# card6 evolving-width S=8 conserved N0=30 gens=35 siteN=160 d=8 widthMut 0.03 seeds 24-30
card6 seed 24 treatment 0.874 one lost shuffled 0.345 one lost diff 0.529
card6 seed 25 treatment 0.838 one lost shuffled 0.552 one lost diff 0.285
card6 seed 26 treatment 0.800 one lost shuffled 0.643 one lost diff 0.157
card6 seed 27 treatment 0.827 one lost shuffled 0.785 one lost diff 0.041
card6 seed 28 treatment 0.716 one lost shuffled 0.509 one lost diff 0.206
card6 seed 29 treatment 0.853 one lost shuffled 0.289 one lost diff 0.565
card6 seed 30 treatment 0.892 one lost shuffled 0.636 one lost diff 0.256
EXIT 0
# card23rm d=8 N=30 gens=35 siteN=160 randomMating seeds 1-5
card23rm d=8 a=1 seed 1 realised 8.163 fate FUSED peak 0.733 mean 0.558 tGap 1 tAnc 1
card23rm d=8 a=0.25 seed 1 realised 8.163 fate FUSED peak 0.733 mean 0.558 tGap 1 tAnc 1
card23rm d=8 a=1 seed 2 realised 8.062 fate FUSED peak 0.767 mean 0.418 tGap 1 tAnc 1
card23rm d=8 a=0.25 seed 2 realised 8.062 fate FUSED peak 0.767 mean 0.418 tGap 1 tAnc 1
card23rm d=8 a=1 seed 3 realised 8.136 fate FUSED peak 0.667 mean 0.444 tGap 1 tAnc 1
card23rm d=8 a=0.25 seed 3 realised 8.136 fate FUSED peak 0.667 mean 0.444 tGap 1 tAnc 1
card23rm d=8 a=1 seed 4 realised 7.663 fate FUSED peak 0.767 mean 0.509 tGap 1 tAnc 2
card23rm d=8 a=0.25 seed 4 realised 7.663 fate FUSED peak 0.767 mean 0.509 tGap 1 tAnc 2
card23rm d=8 a=1 seed 5 realised 8.136 fate FUSED peak 0.633 mean 0.481 tGap 1 tAnc 1
card23rm d=8 a=0.25 seed 5 realised 8.136 fate FUSED peak 0.633 mean 0.481 tGap 1 tAnc 1
EXIT 0
# card23rm d=8 N=30 gens=35 siteN=160 randomMating seeds 6-10
card23rm d=8 a=1 seed 6 realised 7.998 fate FUSED peak 0.720 mean 0.507 tGap 1 tAnc 1
card23rm d=8 a=0.25 seed 6 realised 7.998 fate FUSED peak 0.720 mean 0.507 tGap 1 tAnc 1
card23rm d=8 a=1 seed 7 realised 8.032 fate FUSED peak 0.767 mean 0.485 tGap 1 tAnc 1
card23rm d=8 a=0.25 seed 7 realised 8.032 fate FUSED peak 0.767 mean 0.485 tGap 1 tAnc 1
card23rm d=8 a=1 seed 8 realised 7.996 fate FUSED peak 0.733 mean 0.526 tGap 1 tAnc 1
card23rm d=8 a=0.25 seed 8 realised 7.996 fate FUSED peak 0.733 mean 0.526 tGap 1 tAnc 1
card23rm d=8 a=1 seed 9 realised 8.042 fate FUSED peak 0.900 mean 0.484 tGap 1 tAnc 1
card23rm d=8 a=0.25 seed 9 realised 8.042 fate FUSED peak 0.900 mean 0.484 tGap 1 tAnc 1
card23rm d=8 a=1 seed 10 realised 8.146 fate FUSED peak 0.800 mean 0.590 tGap 1 tAnc 1
card23rm d=8 a=0.25 seed 10 realised 8.146 fate FUSED peak 0.800 mean 0.590 tGap 1 tAnc 1
EXIT 0
# card23rm d=8 N=30 gens=35 siteN=160 randomMating seeds 11-15
card23rm d=8 a=1 seed 11 realised 7.882 fate FUSED peak 0.667 mean 0.411 tGap 2 tAnc 1
card23rm d=8 a=0.25 seed 11 realised 7.882 fate FUSED peak 0.667 mean 0.411 tGap 2 tAnc 1
card23rm d=8 a=1 seed 12 realised 8.005 fate FUSED peak 0.870 mean 0.513 tGap 1 tAnc 2
card23rm d=8 a=0.25 seed 12 realised 8.005 fate FUSED peak 0.870 mean 0.513 tGap 1 tAnc 2
card23rm d=8 a=1 seed 13 realised 8.010 fate FUSED peak 0.833 mean 0.634 tGap 1 tAnc 1
card23rm d=8 a=0.25 seed 13 realised 8.010 fate FUSED peak 0.833 mean 0.634 tGap 1 tAnc 1
card23rm d=8 a=1 seed 14 realised 8.213 fate FUSED peak 0.733 mean 0.442 tGap 1 tAnc 1
card23rm d=8 a=0.25 seed 14 realised 8.213 fate FUSED peak 0.733 mean 0.442 tGap 1 tAnc 1
card23rm d=8 a=1 seed 15 realised 8.012 fate FUSED peak 0.867 mean 0.622 tGap 1 tAnc 1
card23rm d=8 a=0.25 seed 15 realised 8.012 fate FUSED peak 0.867 mean 0.622 tGap 1 tAnc 1
EXIT 0
# card23rm d=8 N=30 gens=35 siteN=160 randomMating seeds 16-20
card23rm d=8 a=1 seed 16 realised 8.088 fate FUSED peak 0.733 mean 0.489 tGap 1 tAnc 2
card23rm d=8 a=0.25 seed 16 realised 8.088 fate FUSED peak 0.733 mean 0.489 tGap 1 tAnc 2
card23rm d=8 a=1 seed 17 realised 8.100 fate FUSED peak 0.633 mean 0.452 tGap 1 tAnc 1
card23rm d=8 a=0.25 seed 17 realised 8.100 fate FUSED peak 0.633 mean 0.452 tGap 1 tAnc 1
card23rm d=8 a=1 seed 18 nobuild
card23rm d=8 a=0.25 seed 18 nobuild
card23rm d=8 a=1 seed 19 realised 8.069 fate FUSED peak 0.700 mean 0.274 tGap 1 tAnc 2
card23rm d=8 a=0.25 seed 19 realised 8.069 fate FUSED peak 0.700 mean 0.274 tGap 1 tAnc 2
card23rm d=8 a=1 seed 20 realised 8.101 fate FUSED peak 0.733 mean 0.398 tGap 1 tAnc 2
card23rm d=8 a=0.25 seed 20 realised 8.101 fate FUSED peak 0.733 mean 0.398 tGap 1 tAnc 2
EXIT 0
# card23rm d=8 N=30 gens=35 siteN=160 randomMating seeds 21-25
card23rm d=8 a=1 seed 21 realised 7.907 fate FUSED peak 0.667 mean 0.394 tGap 1 tAnc 1
card23rm d=8 a=0.25 seed 21 realised 7.907 fate FUSED peak 0.667 mean 0.394 tGap 1 tAnc 1
card23rm d=8 a=1 seed 22 realised 8.114 fate FUSED peak 0.567 mean 0.266 tGap 1 tAnc 1
card23rm d=8 a=0.25 seed 22 realised 8.114 fate FUSED peak 0.567 mean 0.266 tGap 1 tAnc 1
card23rm d=8 a=1 seed 23 realised 8.143 fate FUSED peak 0.900 mean 0.523 tGap 1 tAnc 2
card23rm d=8 a=0.25 seed 23 realised 8.143 fate FUSED peak 0.900 mean 0.523 tGap 1 tAnc 2
card23rm d=8 a=1 seed 24 realised 8.446 fate FUSED peak 0.786 mean 0.577 tGap 1 tAnc 1
card23rm d=8 a=0.25 seed 24 realised 8.446 fate FUSED peak 0.786 mean 0.577 tGap 1 tAnc 1
card23rm d=8 a=1 seed 25 realised 7.760 fate FUSED peak 0.909 mean 0.633 tGap 1 tAnc 2
card23rm d=8 a=0.25 seed 25 realised 7.760 fate FUSED peak 0.909 mean 0.633 tGap 1 tAnc 2
EXIT 0
# card23rm d=8 N=30 gens=35 siteN=160 randomMating seeds 26-30
card23rm d=8 a=1 seed 26 realised 8.089 fate FUSED peak 0.700 mean 0.436 tGap 1 tAnc 1
card23rm d=8 a=0.25 seed 26 realised 8.089 fate FUSED peak 0.700 mean 0.436 tGap 1 tAnc 1
card23rm d=8 a=1 seed 27 realised 7.719 fate FUSED peak 0.467 mean 0.290 tGap 1 tAnc 1
card23rm d=8 a=0.25 seed 27 realised 7.719 fate FUSED peak 0.467 mean 0.290 tGap 1 tAnc 1
card23rm d=8 a=1 seed 28 realised 7.867 fate FUSED peak 0.667 mean 0.372 tGap 1 tAnc 1
card23rm d=8 a=0.25 seed 28 realised 7.867 fate FUSED peak 0.667 mean 0.372 tGap 1 tAnc 1
card23rm d=8 a=1 seed 29 realised 8.013 fate FUSED peak 0.667 mean 0.407 tGap 1 tAnc 1
card23rm d=8 a=0.25 seed 29 realised 8.013 fate FUSED peak 0.667 mean 0.407 tGap 1 tAnc 1
card23rm d=8 a=1 seed 30 realised 7.847 fate FUSED peak 0.767 mean 0.607 tGap 1 tAnc 1
card23rm d=8 a=0.25 seed 30 realised 7.847 fate FUSED peak 0.767 mean 0.607 tGap 1 tAnc 1
EXIT 0
# card6null evolving-width S=8 conserved shuffled(widthRng seed) minus shuffled(widthRng seed+1000) N0=30 gens=35 siteN=160 d=8 widthMut 0.03 seeds 1-3
card6null seed 1 shuffledA 0.589 one lost shuffledB 0.325 one lost diff 0.263
card6null seed 2 shuffledA 0.815 one lost shuffledB 0.817 one lost diff -0.002
card6null seed 3 shuffledA 0.473 one lost shuffledB 0.170 one lost diff 0.303
EXIT 0
# card6null evolving-width S=8 conserved shuffled(widthRng seed) minus shuffled(widthRng seed+1000) N0=30 gens=35 siteN=160 d=8 widthMut 0.03 seeds 4-6
card6null seed 4 shuffledA 0.544 one lost shuffledB 0.256 HELD diff 0.287
card6null seed 5 shuffledA 0.416 one lost shuffledB 0.874 one lost diff -0.459
card6null seed 6 shuffledA 0.211 one lost shuffledB 0.283 one lost diff -0.071
EXIT 0
# card6null evolving-width S=8 conserved shuffled(widthRng seed) minus shuffled(widthRng seed+1000) N0=30 gens=35 siteN=160 d=8 widthMut 0.03 seeds 7-9
card6null seed 7 shuffledA 0.734 one lost shuffledB 0.602 one lost diff 0.132
card6null seed 8 shuffledA 0.673 one lost shuffledB 0.582 one lost diff 0.091
card6null seed 9 shuffledA 0.591 one lost shuffledB 0.240 HELD diff 0.351
EXIT 0
# card6null evolving-width S=8 conserved shuffled(widthRng seed) minus shuffled(widthRng seed+1000) N0=30 gens=35 siteN=160 d=8 widthMut 0.03 seeds 10-12
card6null seed 10 shuffledA 0.529 one lost shuffledB 0.389 HELD diff 0.140
card6null seed 11 shuffledA 0.151 one lost shuffledB 0.387 one lost diff -0.235
card6null seed 12 shuffledA 0.483 one lost shuffledB 0.654 one lost diff -0.171
EXIT 0
# card6null evolving-width S=8 conserved shuffled(widthRng seed) minus shuffled(widthRng seed+1000) N0=30 gens=35 siteN=160 d=8 widthMut 0.03 seeds 13-15
card6null seed 13 shuffledA 0.110 one lost shuffledB 0.275 one lost diff -0.165
card6null seed 14 shuffledA 0.403 one lost shuffledB 0.405 one lost diff -0.002
card6null seed 15 shuffledA 0.271 one lost shuffledB 0.282 one lost diff -0.011
EXIT 0
# card6null evolving-width S=8 conserved shuffled(widthRng seed) minus shuffled(widthRng seed+1000) N0=30 gens=35 siteN=160 d=8 widthMut 0.03 seeds 16-18
card6null seed 16 shuffledA 0.405 one lost shuffledB 0.825 one lost diff -0.420
card6null seed 17 shuffledA 0.359 one lost shuffledB 0.590 one lost diff -0.231
card6null seed 18 shuffledA nobuild shuffledB nobuild diff null
EXIT 0
# card6null evolving-width S=8 conserved shuffled(widthRng seed) minus shuffled(widthRng seed+1000) N0=30 gens=35 siteN=160 d=8 widthMut 0.03 seeds 19-21
card6null seed 19 shuffledA 0.392 one lost shuffledB 0.406 one lost diff -0.014
card6null seed 20 shuffledA 0.583 HELD shuffledB 0.389 one lost diff 0.195
card6null seed 21 shuffledA 0.653 one lost shuffledB 0.503 one lost diff 0.150
EXIT 0
# card6null evolving-width S=8 conserved shuffled(widthRng seed) minus shuffled(widthRng seed+1000) N0=30 gens=35 siteN=160 d=8 widthMut 0.03 seeds 22-24
card6null seed 22 shuffledA 0.589 one lost shuffledB 0.556 one lost diff 0.034
card6null seed 23 shuffledA 0.673 one lost shuffledB 0.270 one lost diff 0.403
card6null seed 24 shuffledA 0.345 one lost shuffledB 0.349 one lost diff -0.005
EXIT 0
# card6null evolving-width S=8 conserved shuffled(widthRng seed) minus shuffled(widthRng seed+1000) N0=30 gens=35 siteN=160 d=8 widthMut 0.03 seeds 25-27
card6null seed 25 shuffledA 0.552 one lost shuffledB 0.392 one lost diff 0.161
card6null seed 26 shuffledA 0.643 one lost shuffledB 0.445 one lost diff 0.199
card6null seed 27 shuffledA 0.785 one lost shuffledB 0.739 one lost diff 0.046
EXIT 0
# card6null evolving-width S=8 conserved shuffled(widthRng seed) minus shuffled(widthRng seed+1000) N0=30 gens=35 siteN=160 d=8 widthMut 0.03 seeds 28-30
card6null seed 28 shuffledA 0.509 one lost shuffledB 0.351 one lost diff 0.158
card6null seed 29 shuffledA 0.289 one lost shuffledB 0.901 one lost diff -0.612
card6null seed 30 shuffledA 0.636 one lost shuffledB 0.328 one lost diff 0.309
EXIT 0
```

## Edges (`summarise`, round 4: over the committed rows plus the `card23rm` and `card6null` rows)

```

== card 1 at page: hybrid/rest receipt ratio (finite values only; Infinity = rest received nothing, counted separately)
  d=8 null: min 0.603 max 26.389 n 28 Infinity 1 undefined 0 -> edge 0.603 (a card-1 ratio must be BELOW this)
  d=8 placed, not HELD, ratio below the edge: 1 of 29 seeds -> seeds 25 (0.279)
  d=4 null: min 0.642 max 14.177 n 28 Infinity 1 undefined 0 -> edge 0.642 (a card-1 ratio must be BELOW this)
  d=4 placed, not HELD, ratio below the edge: 5 of 29 seeds -> seeds 16 (0.111), 19 (0.138), 20 (0.302), 21 (0.607), 24 (0.567)

== card 4 at page: hybrid generations
  d=8 null hybGens: min 23.000 max 23.000 n 29 -> edge 23 (card 4 opens at 0, which must be BELOW this)
  d=8 placed, `one lost` with 0 hybrid generations: 27 of 29 seeds
  d=4 null hybGens: min 23.000 max 23.000 n 29 -> edge 23 (card 4 opens at 0, which must be BELOW this)
  d=4 placed, `one lost` with 0 hybrid generations: 5 of 29 seeds

== card 1 at level: hybrid/rest receipt ratio (finite values only; Infinity = rest received nothing, counted separately)
  d=8 null: min 0.000 max 19.755 n 29 Infinity 0 undefined 0 -> edge 0.000 (a card-1 ratio must be BELOW this)
  d=8 placed, not HELD, ratio below the edge: 0 of 29 seeds
  d=4 null: min 0.530 max 4.667 n 29 Infinity 0 undefined 0 -> edge 0.530 (a card-1 ratio must be BELOW this)
  d=4 placed, not HELD, ratio below the edge: 2 of 29 seeds -> seeds 15 (0.127), 19 (0.317)

== card 4 at level: hybrid generations
  d=8 null hybGens: min 34.000 max 34.000 n 29 -> edge 34 (card 4 opens at 0, which must be BELOW this)
  d=8 placed, `one lost` with 0 hybrid generations: 28 of 29 seeds
  d=4 null hybGens: min 34.000 max 34.000 n 29 -> edge 34 (card 4 opens at 0, which must be BELOW this)
  d=4 placed, `one lost` with 0 hybrid generations: 3 of 29 seeds

== cards 2 and 3 at level config, d=8: gap occupancy, null a=1 (29 seeds) + randomMating (58 rows, a=1 and a=0.25 are identical: parentage ignores T)
  a=1 null peak: min 0.000 max 0.433 n 29; mean: min 0.000 max 0.170 n 29 -> card 2 peak edge 0.433, card 3 mean edge 0.170 (3-decimal rows; `edges` prints the outward-rounded value)
  randomMating null peak: min 0.467 max 0.909 n 58; mean: min 0.266 max 0.634 n 58; fates HELD/FUSED/one lost/BOTH LOST: 0/58/0/0; lead (tAnc - tGap, both >= 0): min -1 max 1 n 58 -> lead edge 1 (the lead must be ABOVE this; integer, no rounding)
  randomMating null reaches every peak/mean edge (max peak 0.909, max mean 0.634), so gap occupancy alone cannot close it; the lead does
  null fates HELD/FUSED/one lost/BOTH LOST: 0/0/29/0
  null FUSED with gap-before-halving: 0
  a=1 null seeds reaching card 2's full signature: 0; card 3's: 0; randomMating null seeds reaching card 2's: 0; card 3's: 0
  a=0.25 (29 seeds) fates HELD/FUSED/one lost/BOTH LOST: 4/8/17/0
  card 2 opens (FUSED, peak > 0.433, lead > 1): 5 seeds -> 6 (0.633, lead 3), 17 (0.633, lead 3), 20 (0.700, lead 3), 23 (0.800, lead 3), 25 (0.733, lead 2)
  card 3 opens (FUSED, mean > 0.170, lead > 1): 4 seeds -> 6 (0.266, lead 3), 17 (0.249, lead 3), 23 (0.548, lead 3), 25 (0.416, lead 2)

== cards 2 and 3 at level config, d=4: gap occupancy, null a=1 (10 seeds)
  a=1 null peak: min 0.100 max 0.900 n 10; mean: min 0.011 max 0.596 n 10 -> card 2 peak edge 0.900, card 3 mean edge 0.596 (3-decimal rows; `edges` prints the outward-rounded value)
  null fates HELD/FUSED/one lost/BOTH LOST: 0/8/2/0
  null FUSED with gap-before-halving: 7
  a=1 null seeds reaching card 2's full signature: 0; card 3's: 0; randomMating null seeds reaching card 2's: 0; card 3's: 0
  a=0.25 (10 seeds) fates HELD/FUSED/one lost/BOTH LOST: 0/10/0/0
  card 2 opens (FUSED, peak > 0.900, lead > -Infinity): 0 seeds
  card 3 opens (FUSED, mean > 0.596, lead > -Infinity): 0 seeds

== card 5 at level-4 config (30 seeds): paired fate against the flat floor (q = 0 is bit-identical to flat, docs/2026-09-12-northstar-page-config-probe.md)
  R200q69: flat HELD 11, arm HELD 6; opens (flat HELD, arm not) 9 -> seeds 8, 9, 10, 11, 12, 13, 17, 23, 27; reversed (flat not, arm HELD) 4 -> seeds 1, 7, 19, 20
  R200q85: flat HELD 11, arm HELD 2; opens (flat HELD, arm not) 10 -> seeds 8, 9, 10, 11, 12, 13, 17, 23, 26, 27; reversed (flat not, arm HELD) 1 -> seeds 19

== card 6 at S = 8 conserved (29 seeds): treatment minus shuffled width
  per-seed diff: min -0.137 max 0.768 n 29 mean 0.303 sd 0.225; seeds with diff <= 0: 2
  t interval over these seeds: [0.217, 0.389] (the finding's n = 12 interval is [0.140, 0.442], docs/FINDINGS.md:115-117)
  shuffled-minus-shuffled null (29 seeds): min -0.612 max 0.403 n 29 mean 0.028 sd 0.249 -> card 6 edge 0.403 (treatment minus shuffled must be ABOVE this; 3-decimal rows, see `edges`)
  treatment minus shuffled above that edge: 9 of 29 seeds
```

## Committed edges (`edges`, round 4: the defining seed of each edge re-run at full precision, rounded outward)

```
# edges: the defining seed of each null edge re-run at full precision; committed edge = outward rounding (card 1 DOWN, cards 2, 3, 6 UP)
card1 page d=8 defining seed 22 null ratio 0.6032441066314166 (row 0.603) -> edge 0.603 (ratio must be BELOW this; the seed is not)
card1 page d=4 defining seed 19 null ratio 0.6420531009068156 (row 0.642) -> edge 0.642 (ratio must be BELOW this; the seed is not)
card1 level d=8 defining seed 29 null ratio 0 (row 0.000) -> no edge (null reaches 0; the card is grey here)
card1 level d=4 defining seed 26 null ratio 0.5303547107955984 (row 0.530) -> edge 0.530 (ratio must be BELOW this; the seed is not)
card2 d=8 defining seed 13 a=1 null peak 0.43333333333333335 (row 0.433) -> edge 0.434 (peak must be ABOVE this; the seed is not)
card3 d=8 defining seed 13 a=1 null mean 0.16952380952380952 (row 0.170) -> edge 0.170 (mean must be ABOVE this; the seed is not)
cards 2 and 3 d=8 randomMating null lead (tAnc - tGap): max 1 over 58 rows -> lead edge 1 (the lead must be ABOVE this; integer, exact)
card2 d=4 defining seed 8 a=1 null peak 0.9 (row 0.900) -> edge 0.901 (peak must be ABOVE this; the seed is not)
card3 d=4 defining seed 8 a=1 null mean 0.5961904761904763 (row 0.596) -> edge 0.597 (mean must be ABOVE this; the seed is not)
card6 defining seed 23 shuffled-minus-shuffled diff 0.4027742215535734 (row 0.403) -> edge 0.403 (treatment minus shuffled must be ABOVE this; the seed is not)
```

Read against the cards: card 1 keeps 0.603 (seed 22's 0.60324 is above it) and the level
configuration has no edge (a null ratio of exactly 0; round 5: `edges` now prints "no edge" there
instead of the impossible -0.001); card 2's edge moves from 0.433 to **0.434**;
card 3's 0.170 already sat above seed 13's 0.16952; at target 4 no card-2 or card-3 threshold
exists (`edges` 0.901 / 0.597, and 0 of 10 a = 0.25 seeds above); the random-mating lead edge is
**1** for both; card 6's edge is **0.403** (seed 23's 0.40277 rounded up), cleared by 9 of 29
treatment-minus-shuffled seeds.

## M2 re-measurement under the hand-set recipe (2026-09-22)

The same two genomes `foundTwoLineages` picks, founded by the page's hand-set recipe
(`population-run.js` `foundFromGenomes`, executed by the tool) on fresh streams at the same seed,
then stepped with those streams. Page configuration. No edge is recalibrated from these rows.

```
node tools/northstar-null-tables.js card14hand page 1 5;  node tools/northstar-null-tables.js card14hand page 16 16
```

```
# card14hand page N=18 gens=24 siteN=90 seeds 1-5 (foundTwoLineages genomes, founded by population-run.js foundFromGenomes)
card14hand page d=8 seed 1 placed realised 8.124 fate one lost hybGens 0/24 ratio null stalledGens 0
card14hand page d=8 seed 1 null realised 8.124 fate FUSED hybGens 23/24 ratio 0.843 stalledGens 0
card14hand page d=4 seed 1 placed realised 4.025 fate FUSED hybGens 23/24 ratio 0.850 stalledGens 0
card14hand page d=4 seed 1 null realised 4.025 fate FUSED hybGens 23/24 ratio 0.794 stalledGens 0
card14hand page d=8 seed 2 placed realised 8.058 fate one lost hybGens 0/24 ratio null stalledGens 0
card14hand page d=8 seed 2 null realised 8.058 fate FUSED hybGens 23/24 ratio 124.472 stalledGens 0
card14hand page d=4 seed 2 placed realised 3.940 fate one lost hybGens 0/24 ratio null stalledGens 0
card14hand page d=4 seed 2 null realised 3.940 fate FUSED hybGens 23/24 ratio 0.710 stalledGens 0
card14hand page d=8 seed 3 placed realised 8.123 fate one lost hybGens 0/24 ratio null stalledGens 0
card14hand page d=8 seed 3 null realised 8.123 fate FUSED hybGens 23/24 ratio 0.772 stalledGens 0
card14hand page d=4 seed 3 placed realised 4.027 fate one lost hybGens 5/24 ratio 1.059 stalledGens 0
card14hand page d=4 seed 3 null realised 4.027 fate FUSED hybGens 23/24 ratio 0.746 stalledGens 0
card14hand page d=8 seed 4 placed realised 7.663 fate one lost hybGens 0/24 ratio null stalledGens 0
card14hand page d=8 seed 4 null realised 7.663 fate FUSED hybGens 23/24 ratio 0.592 stalledGens 0
card14hand page d=4 seed 4 placed realised 3.953 fate FUSED hybGens 23/24 ratio 3.236 stalledGens 0
card14hand page d=4 seed 4 null realised 3.953 fate FUSED hybGens 23/24 ratio 0.590 stalledGens 0
card14hand page d=8 seed 5 placed realised 8.090 fate one lost hybGens 0/24 ratio null stalledGens 0
card14hand page d=8 seed 5 null realised 8.090 fate FUSED hybGens 23/24 ratio 0.887 stalledGens 0
card14hand page d=4 seed 5 placed realised 3.895 fate FUSED hybGens 23/24 ratio 1.062 stalledGens 0
card14hand page d=4 seed 5 null realised 3.895 fate FUSED hybGens 23/24 ratio 0.670 stalledGens 0
# card14hand page N=18 gens=24 siteN=90 seeds 16-16 (foundTwoLineages genomes, founded by population-run.js foundFromGenomes)
card14hand page d=8 seed 16 placed realised 8.076 fate one lost hybGens 0/24 ratio null stalledGens 0
card14hand page d=8 seed 16 null realised 8.076 fate FUSED hybGens 23/24 ratio 1.584 stalledGens 0
card14hand page d=4 seed 16 placed realised 3.849 fate one lost hybGens 2/24 ratio 1.167 stalledGens 0
card14hand page d=4 seed 16 null realised 3.849 fate FUSED hybGens 23/24 ratio 1.939 stalledGens 0
```

Read against the `foundTwoLineages` rows above: card 4's control (target 8, seed 1) still reads
`one lost`, 0 of 24, and opens. Card 1's control (target 4, seed 16) reads `one lost`, 2 of 24,
ratio 1.167, and does NOT open (edge 0.603). In the random-mating null block, target 8 seed 4 (0.592)
and target 4 seed 4 (0.590) fall BELOW card 1's 0.603 edge, and 9 of 10 null ratios fall below the
spec's 1.146; every null block row keeps 23 of 24 hybrid generations. The `d` switch stays.
