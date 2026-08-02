# Carryover — pollen that rides

**Date:** 2026-08-01 · **Code:** `sim/carryover.js`, `experiments/carryover.js`,
`tests/carryover.test.js` · Roadmap item C, first mechanism class added to the table.

> ⚠️ **Numbers corrected 2026-08-02.** Every figure here was measured before the head-tip cap fix
> ([detail](2026-08-01-head-cap-result.md)), which changed the contact model and therefore moved
> everything downstream. The tables below are the post-fix re-run. **One conclusion did not
> survive**: carryover no longer raises coexistence in the already-separated community — see §B/C.
> The correction was found while building the presentation-cost experiment, not by a re-run of this
> one, which is the failure worth naming: fixing the contact model did not trigger a re-run of the
> experiments built on it.

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
   1.00              1                0.041               0.967              0.0
   0.50              1                0.080               0.966              1.0
   0.25              2                0.142               0.960              1.0
   0.12              4                0.235               0.962              0.0
   0.05              6                0.357               0.963              2.0
```

**Packaging efficiency rises nearly ninefold**, from 4.1% to 35.7% of pollen ever reaching a stigma.
Under the one-chance assumption almost everything a flower makes is wasted; with pollen riding for
a median of six visits, over a third of it arrives.

**Last-male advantage emerges rather than being imposed.** Fresh grains lie on top of older ones, so
a stigma takes the most recent first — delivered pollen is up to 2 visits younger than under random
removal from the same patch. The A/B against random removal is the control: the effect vanishes
when stacking is switched off, which is what makes it a consequence of the mechanism rather than an
artefact of the bookkeeping. ⚠️ The column is **not monotone** in grooming (0, 1, 1, 0, 2) and is
quantised to whole visits, so read it as "the effect exists and is small", not as a dose-response.

## B and C. Does carryover change how many species coexist?

Two plausible opposite answers were in play. Carryover gives a grain **many chances** to find the
right stigma, which should help; it also lets **rival pollen accumulate** on the body, which should
hurt. Which dominates is the question.

| grooming | evolved community (8 species, overlap 0.000) | unevolved community (12 species, overlap 0.055) |
| -------- | -------------------------------------------- | ----------------------------------------------- |
| 1.00     | 7 ← one-chance limit                         | 4                                               |
| 0.50     | 7                                            | 4                                               |
| 0.25     | 7                                            | 5                                               |
| 0.12     | 7                                            | 5                                               |
| 0.05     | 7                                            | 5                                               |

⚠️ **This is where the pre-head-cap version was wrong, and it was wrong in its headline.** It read
"the extra-chances mechanism wins, and wins hardest exactly where accumulation was supposed to
bite", on 8 → 9 in the evolved community and 3 → 5 in the unevolved one. Re-run:

- the evolved community is **flat at 7** across the whole grooming range. Carryover adds **nothing**
  where species have already separated;
- the unevolved community goes **4 → 5** (+25%, not +67%).

So the honest statement is narrower: **extra chances beat rival accumulation only where species
still overlap.** Once overlap is zero there are no rivals to accumulate and no misses to rescue, so
carryover has nothing left to do — which is the same reason v2 later found carryover changes ecology
but not evolution ([detail](2026-08-01-v2-result.md)). That agreement is reassuring, but it is worth
being blunt that the earlier, stronger claim was an artefact of a contact model that has since been
fixed.

The mechanism is still visible in the conspecific-share column above: it holds near 96% at every
grooming rate. Rival pollen is not in fact piling up enough to matter, because a grain that misses
one stigma is still riding when a conspecific one comes along.

The one-chance limit recovers **7 of the mean-field's 8**. The missing species sat at abundance
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

⚠️ The specific figures in this section (target 9, plateau 5/6/8/8/8/8) are **pre-head-cap** and have
not been re-swept; the limit target is now 8. The argument — calibrate against the limiting case,
where the two models are provably the same process — is unaffected, but the numbers are stale and
should not be quoted.

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
