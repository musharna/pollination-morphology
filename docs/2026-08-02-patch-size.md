# Does a larger patch cross parity? — inconclusive, and why that is the answer

**Date:** 2026-08-02 · **Code:** `experiments/patch-size.js` · Roadmap item B, sixth step.

Spatial structure lifted `rare/common` from 0.247 to 0.950 by giving a rare morph neighbours of its
own kind, stopping just short of parity. The arm that grew the patch was under-powered and its
apparent crossing was explicitly not claimed. This is that arm done properly — six independent
site-set draws, seed-averaged, bias-corrected — and **it still does not answer the question.** That
is the result, and the useful parts are the prediction and the two diagnostics.

## The pre-registered prediction

Written before running, because "does it cross 1.0" invites motivated reading:

With a symmetric foraging kernel and uniform abundance, the bee's stationary distribution over plants
is **uniform** — every plant is visited at the same rate regardless of morph. Inside a patch a
plant's neighbours are its own morph, so its visits are productive. The only asymmetry left is
**boundary dilution**: an edge plant wastes transfer on the other morph, and the rare patch's
boundary fraction is far higher (2 of 4 against 2 of 20).

So the ratio should **approach 1 from below** as the patch grows and should **not cross it**. Spatial
structure would buy _neutrality_, not advantage — enough for drift to maintain a rare placement, not
enough for disruptive selection to favour one.

## ⚠️ A diagnostic that mattered more than the result

The first version held the bout fixed at 9,000 visits while the ring grew. The identical-morph
control — which is flat at 1.0 by construction — drifted **0.976 → 1.133 → 1.228** with population
size. A control that cannot vary by construction but does is a fault in the harness, not a finding.

The cause: a locally foraging bee **diffuses**, so its time to traverse the ring scales as
(ring / step)². Holding the bout fixed meant the bee never mixed over the larger rings, and the
measurement was reading the bout length rather than the biology. Scaling visits as the square of the
ring flattens the control to **1.009 / 1.071**, which confirms the diagnosis.

## The result

```
  patch/total   boundary   raw      control   CORRECTED (95% CI)
    4/24            0.50   1.006    1.009     1.020 +/- 0.492
    8/48            0.25   0.909    1.071     0.863 +/- 0.278
```

**Inconclusive.** The intervals span everything from a clear penalty to a clear advantage, and the
point estimates fall rather than rise. Nothing here supports the crossing the under-powered arm
hinted at, and nothing here refutes it either.

This is reported as a failure to measure rather than dressed up as a confirmation. The verdict logic
now refuses to conclude when the interval exceeds ±0.2 — an earlier draft of this same experiment
printed "✅ PREDICTION HELD" off an interval of ±0.417, which is exactly the trap.

## What it would take

Visits must scale as the **square** of the ring, so a 12/72 row costs 9× a 4/24 row and a 16/96 row
costs 16×. Answering this properly means a compute budget an order of magnitude beyond what was spent
here, or a cheaper estimator — for instance measuring the boundary and interior plants separately,
since the prediction is specifically about boundary dilution and interior plants should already sit
at parity. That decomposition would test the mechanism directly at 4/24 without needing large rings
at all, and is the better next move.

## Where roadmap B stands

Six steps, and the honest scorecard:

| step                     | outcome                                        |
| ------------------------ | ---------------------------------------------- |
| panmictic premise        | ✅ verified — selection converges              |
| recombination / hybrids  | ✅ inheritance blends; hybrids pay 19.1%       |
| pollinator heterogeneity | ❌ no rare advantage                           |
| flower constancy         | ❌ makes it worse (documented minority effect) |
| spatial structure        | 🟡 0.247 → 0.950, relief but not reversal      |
| larger patch             | ⬜ inconclusive, needs ~10× the compute        |

The barrier is characterised precisely and one mechanism nearly closes it. What remains unknown is
whether anything in this model pushes a rare placement past parity — and after five mechanisms, the
live possibility is that **nothing does**, and that placement divergence in this model requires drift
plus the measured 19.1% hybrid cost rather than a rare advantage. That would itself be a result, but
it is not one this experiment establishes.

## Limits

Two patch sizes only. One bee, one continuous bout, plants evenly spaced on a 1-D ring, clustering
imposed rather than emerging from dispersal. The bias correction divides by a control that is itself
estimated with error, which widens the corrected intervals further than the raw ones.
