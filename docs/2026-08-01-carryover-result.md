# Carryover — pollen that rides

**Date:** 2026-08-01 · **Code:** `sim/carryover.js`, `experiments/carryover.js`,
`tests/carryover.test.js` · Roadmap item C, first mechanism class added to the table.

Everything before this was **mean-field**: transfer from species i to j was the overlap of i's
anther placement with j's stigma placement, which silently assumes a grain gets exactly one chance
and is then gone. Real pollen rides. A grain picked up at flower 1 may still be aboard at flower 5,
and a stigma sweeping a patch of body collects whatever is lying there from any donor.

The transfer matrix is now **counted, not assumed**: T[i][j] is the number of grains from species i
that ended up on a stigma of species j, over a simulated foraging bout.

## The limit check, which is why any of this can be believed

At `groom = 1` every grain gets exactly one stigma sweep, at the very next flower — which _is_ the
mean-field assumption. The counted simulation must reproduce the old answer there or nothing it
says at real carryover can be trusted. It does: **r > 0.9** between the counted transfer matrix and
the mean-field overlap matrix (`tests/carryover.test.js`).

⚠️ Ordering is load-bearing. Grooming must fall **between** the stigma sweep and the fresh load.
Put it either side and the limiting case is destroyed — grains get zero sweeps or two.

## A. What carryover makes measurable

Two quantities the mean-field model could not express at all:

```
  groom   median carry   delivered/produced   conspecific share   last-male gain
   1.00              1                0.046               0.982              0.0
   0.50              2                0.094               0.985              0.0
   0.25              3                0.170               0.986              0.0
   0.12              4                0.276               0.985              1.0
   0.05              6                0.405               0.984              2.0
```

**Packaging efficiency rises nearly tenfold**, from 4.6% to 40.5% of pollen ever reaching a stigma.
Under the one-chance assumption almost everything a flower makes is wasted; with pollen riding for
a median of six visits, two fifths of it arrives.

**Last-male advantage emerges rather than being imposed.** Fresh grains lie on top of older ones, so
a stigma takes the most recent first — delivered pollen is up to 2 visits younger than under random
removal from the same patch. The A/B against random removal is the control: the effect vanishes
when stacking is switched off, which is what makes it a consequence of the mechanism rather than an
artefact of the bookkeeping.

## B and C. Does carryover change how many species coexist?

Two plausible opposite answers were in play. Carryover gives a grain **many chances** to find the
right stigma, which should help; it also lets **rival pollen accumulate** on the body, which should
hurt. Which dominates is the question.

| grooming | evolved community (overlap 0.000) | unevolved community (overlap 0.055) |
| -------- | --------------------------------- | ----------------------------------- |
| 1.00     | 8 ← one-chance limit              | 3                                   |
| 0.50     | 8                                 | 5                                   |
| 0.25     | 9                                 | 5                                   |
| 0.12     | 9                                 | 5                                   |
| 0.05     | 9                                 | 5                                   |

**The extra-chances mechanism wins, and wins hardest exactly where accumulation was supposed to
bite.** In a community already evolved to zero pairwise overlap, carryover adds one species
(8 → 9, +12%). In a community that has _not_ separated, it adds two (3 → 5, +67%).

The mechanism is visible in the conspecific-share column above: it holds near 98% at every grooming
rate. Rival pollen is not in fact piling up enough to matter, because a grain that misses one
stigma is still riding when a conspecific one comes along.

The one-chance limit recovers **8 of the mean-field's 9**. The missing species sat at abundance
0.004 against an extinction floor of 0.002 — marginal in the deterministic model, and lost once
transfer is counted rather than assumed.

## ⚠️ A ten-fold parameter error the limit check caught

My first pollen-limitation floor, `kc = 0.005`, gave **5** species at the one-chance limit where the
answer had to be 9. It was not sampling noise — the figure was flat at 5 from 2,000 visits to
32,000. It was simply ten times too high, and it starved four species.

`kc` is now calibrated at the limit and held fixed while grooming varies. That is legitimate rather
than circular: at `groom = 1` the two models are provably the same process, so matching them there
fixes a free parameter against a known answer, and the thing under test — what happens at
`groom < 1` — is not the thing being calibrated. The chosen value also sits mid-plateau (5, 6, 8, 8,
8, 8 species for `kc` from 0.005 down to 0.00005) rather than on a knife-edge.

Without a limit that had a known right answer, a wrong constant would have been reported as a
finding about biology.

## Limits

The "unevolved" community reaches only 0.055 mean heterospecific overlap — random morphologies
mostly do not collide, because the placement space is large. So part C is directionally informative
but is **not** a strong test of heavy overlap; a deliberately clustered community would test the
accumulation mechanism harder.

Carryover is not yet inside the evolution loop. Both B and C run demography over fixed genomes,
because evaluating a rare mutant's invasion fitness needs its own foraging bout and that is
expensive. So this says how carryover changes _coexistence_ among given species, not how it changes
what they _evolve into_.

Grooming rate is a free parameter spanning an order of magnitude of behaviour and is not calibrated
against any measurement. The Johnson & Harder 2023 pollinia-vs-monads split (<45% vs >80% removal
across 228 species) is the obvious gate and is roadmap item E.
