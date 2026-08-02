# Roadmap E — a calibrated transfer rate, against 228 species

**Date:** 2026-08-02 · **Code:** `sim/carryover.js` (`dispersalUnit`, `viscidium`),
`experiments/dispersal-unit.js`, `tests/dispersal-unit.test.js` · Roadmap item E.

Everything in this project rested on placement **overlap**, a proxy, and on delivery magnitudes never
calibrated against anything. Johnson & Harder 2023
([10.1098/rspb.2023.1148](https://doi.org/10.1098/rspb.2023.1148), Proc R Soc B) is the gate — pollen
fates for 228 species — and it reports a **crossed** pair that a model cannot satisfy by making one
condition uniformly worse:

> "The mean percentage of pollen removed from flowers (removal efficiency) varied almost twofold
> according to the type of pollen-dispersal unit, from less than 45% for orchids and milkweeds with
> solid pollinia, to greater than 80% for species with granular monads or sectile (segmented)
> pollinia. The mean percentage of removed pollen reaching stigmas (pollen transfer efficiency, PTE)
> varied from 2.4% for species with separate monads to 27.0% for orchids with solid pollinia."

Pollinia are **hard to get off** and **efficient once off**. Monads are the reverse. Both axes at
once, or nothing.

## The mechanism

A pollinium is one solid object. Removal falls because the whole mass comes away only on a visit
precise enough to catch the viscidium. `viscidium` (a tolerance in body-metric units) is the only
free parameter, and it was **selected on the removal axis alone** — so the transfer figure it then
produces is a prediction, not a fit.

## Removal — reproduced on both sides

```
  granular monads, 25-visit flowers    99.9%     target > 80%   ✅
  solid pollinia, viscidium 0.25       27.0%     target < 45%   ✅
```

Removal rises monotonically with the tolerance (25.8% → 100% across the sweep), which is the sanity
check that the parameter does what it claims.

## Transfer — the decomposition, at matched removal

Two confounds had to be stripped. A pollinium removes less pollen, and less removed could inflate
transfer by itself — so granular removal is starved to the same level by shortening flower life. And
a pollinarium is **not harvestable**: a bee cannot pack a glued structure into its corbiculae, which
is a separate mechanism from coherence and gets its own row.

```
  arm                                    removal   transfer
  granular, removal starved to match       25.0%       7.1%
  pollinium: coherence only                25.8%      10.3%
    + not harvestable                      27.0%      18.6%
    + adhesion (grooming 0.05)             27.1%      27.1%     target 27.0%  ✅
```

Adhesion was run as a **swept hypothesis with the target marked, not aimed at**: a pollinarium is
cemented on by the viscidium and orchid pollinaria are recovered from bees long after pickup, so it
should not be groomed off at the rate loose pollen is. The value required — grooming 0.05 against
loose pollen's 0.30 — is biologically plausible rather than extreme, and the band 0.15→0.02 spans
22.9%→31.5%, bracketing the measured 27.0%.

## What is and is not calibrated

```
  quantity                       model     measured
  removal, granular monads        99.9%     > 80%    ✅
  removal, solid pollinia         27.0%     < 45%    ✅
  transfer, solid pollinia        27.1%     27.0%    ✅
  transfer, separate monads        7.1%     2.4%     ❌ 2.9x too generous
```

Three of four. The monad side remains too generous, and that is the honest residual: two
well-separated species in a short bout have far fewer ways to lose a grain than a real meadow with
many competitors.

**⚠️ But it retires a caveat this project repeated in four documents.** Those said the delivery level
was "3–6% against Harder & Thomson's 0.6%, five to ten times too generous". That compared a
two-species bout against **one** species. PTE is the same quantity, and the 228-species mean for
separate monads is **2.4%** — so the real discrepancy is **2.9×, not 5–10×**, and it was always being
measured against the wrong benchmark.

## ⚠️ Two things I got wrong here, one of which the tests caught and one of which they caused

**The harvest asymmetry.** The first version of the control compared a pollinium at `harvest: 0`
against granular at `harvest: 0.2` and credited the whole difference to coherence. Leaving harvest
active on a glued pollinarium was also simply wrong biology, and it was what made an earlier
"limiting case of adhesion" not a limiting case at all. Real confound, correctly fixed.

**A test that passed on noise, and locked in the opposite of the truth.** Having found that confound,
I wrote a test asserting that coherence at matched removal is a _liability_. It passed. It was using
**one seed**. Measured over twelve seeds the effect is a ~1.6× **advantage** and seed 7 is an
outlier — so the test was asserting the reverse of the truth and going green on luck, which is worse
than having no test. It briefly propagated into the experiment's own conclusion text before being
caught. Both are now seed-averaged.

The general form is worth keeping: **a single-seed assertion about a stochastic quantity can be
green and backwards at the same time.**

## Limits

`viscidium` is fitted to the removal axis; only the transfer figure at that value is a prediction.
The adhesion rate is swept rather than measured, and while 0.05 against 0.30 is plausible, nothing
here derives it independently.

The monad transfer level is uncalibrated by a factor of 2.9, so absolute delivery magnitudes still
should not be quoted as rates. What is now calibrated is the **contrast between dispersal units**,
which is what roadmap E existed to buy.

Two species, one pollinator, one bout. Sectile pollinia — the intermediate condition, which Johnson &
Harder group with monads on removal — are not modelled at all, and would be the sharpest further
test, since they are packaged but not solid.
