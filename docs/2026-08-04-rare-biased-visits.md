# Rare-biased visitation is self-defeating on a continuous trait axis (roadmap B)

**Date:** 2026-08-04 · **Code:** `sim/ibm.js`, `experiments/rare-biased-visits.js`

## This run exists because the last one left a number

The limiting-factors run closed the pollinator route and pinned the frequency dependence at
`receipt ratio ≈ (own-frequency odds)^0.70` — mostly partner-counting, so a property of mate-finding
rather than of provisioning. It named the one candidate that could move it and made the bar cheap:
**rare-biased visit allocation**, measurable in single bouts before anyone spends 35 generations.

The knob needed no new mechanism. `runBout` already accepts a free per-plant abundance vector, so a
plant in a morph of frequency `f` gets weight `f^a / n_m` and the morph's share of visits becomes
`f^a`. `a = 1` is uniform per plant — every earlier result, bit-identical. `a = 0` splits visits
50/50 regardless of frequency.

## The screen: the criterion inverts, but as a subsidy

```
    a        real     control     real - control = the MATE-FINDING part
    1.00     0.663    -0.007          0.670
    0.75     0.243    -0.246          0.488
    0.50    -0.138    -0.485          0.347
    0.35    -0.360    -0.624          0.264
    0.25    -0.500    -0.714          0.214
    0.00    -0.849    -0.941          0.092
```

`a = 1` independently reproduces the published 0.70 (0.663 here; the earlier figure was a tail-pair
fit, this is a 5-point log-odds regression). **The criterion inverts at `a ≤ 0.5`** — visits
proportional to the square root of abundance — the first time anything in this project has made a
rare lineage do better than a common one.

⚠️ **The control had to be swept at every strength, and a first pass that swept it only at `a=1`
would have misread the result.** One lineage wearing both labels has no placement difference at all,
yet its exponent still swings to −0.49 at `a=0.5`, because handing a label more visits than its share
of plants raises per-capita receipt as pure arithmetic. Analytically the control is `odds^(a-1)` and
the real arm `odds^(2a-1)` — both confirmed to ~0.03 — so the gap between them is exactly `a`. **The
mate-finding penalty _is_ the allocation exponent**, and it reaches zero only when abundance stops
predicting visits at all, which is not a behaviour but the absence of one.

## The bar is met in nature — and still is not enough

Converting Gigord et al. 2001 (_PNAS_ 98:6253, _Dactylorhiza sambucina_) onto this scale: they fit
relative reproductive success against morph frequency with `RRSy = 2·RSy/(RSy + RSp)`, which inverts
to a plain morph ratio, giving exponents of **−0.259 / −0.248 / −0.228** for pollinia removal,
pollinia deposition and fruit set. That is `a ≈ 0.43` — it clears the crossing.

For contrast, rewarding systems go the _wrong_ way: Smithson & Macnair 1997 (_Biol. J. Linn. Soc._
60:401) found bumblebees consistently preferred the **commonest** morph, and Eckhart et al. 2006
(_Oikos_ 112:412) found no frequency-dependent foraging at the assemblage level, with the most
effective pollinator positively frequency-dependent. **The only attested route to `a < 1` is
deception.**

Yet the dynamical arm at the calibrated strength fails:

```
    arm                        HELD / FUSED / one lost      pooled
    a=1.00  reference            0 /  0 / 19                 0/34
    a=0.43  GIGORD-CALIBRATED       (1/15, shown noise)      0/10 on replication
    a=0.30  probe                3 /  5 / 11                 3/19   p = 0.0414
    a=0.25  twice measured       3 /  8 /  8                 6/29   p = 0.0070
```

Coexistence is real in the model — 6/29 against 0/34, with a dose-response of 0% → 6.7% → 15.8% →
20.7% — but needs roughly **twice the measured strength**, and even there four of five replicates
still lose the split. ⚠️ Two tests were run; Bonferroni leaves `a=0.25` significant (0.014) but
`a=0.30` does not (0.083).

**An inverted invasion criterion is therefore necessary but not sufficient.** Mutual invasibility is
the standard coexistence condition and this model satisfies it while still losing a lineage, because
the criterion is evaluated at fixed composition while the dynamical model lets mating blend the
lineages.

## ⚠️ Why it fuses — and the general result

The obvious explanation is that the exclusion separation leaks. It does not:

```
     d        m (cross-lineage pollen)     Nm
     1              0.483                14.49   LEAKY
     2              0.333                10.00   LEAKY
     4              0.083                 2.48   LEAKY
     6              0.003                 0.10   isolating
     8              0.000                 0.00   isolating
```

**`d=8` leaks exactly zero**, against a ceiling control of 0.516. With `m=0` ancestry variance cannot
collapse, so every run should read HELD — yet strong bias produced 5 and 8 FUSED.

The answer is in the definition of rarity. Weight goes as `dens^(a-1)`, so under `a<1` the
**lowest-density placement draws the most visits** — and in a two-cluster population that is the gap
between the clusters:

```
     d      intermediate's visit weight vs a cluster member
            a=0.50    a=0.30    a=0.25
     4        1.8       2.2       2.3
     8       26.5      98.3     136.4
    12      510.8    6187.8   11544.1
```

At `d=8` an intermediate draws **136×** the visits of an ordinary plant, and it sits `d/2 = 4` from
each cluster — exactly where the barrier _is_ leaky (`m=0.083`, `Nm=2.5`). Rare-bias manufactures a
conduit that does not exist at founding, and the FUSED counts track the subsidy: 0 → 5 → 8 against
ratios 1 → 98 → 136.

> **Rare-biased visitation is self-defeating for speciation on a continuous trait axis.** The rarest
> phenotype in a splitting population is the intermediate, so any mechanism rewarding rarity rewards
> hybrids most of all, building the bridge that erases the split it was recruited to protect.

This is not an artefact of the kernel: for a continuous trait, rarity _must_ be local density — a
pollinator cannot define it any other way.

⚠️ **And it resolves the deception result rather than echoing it.** Gigord's system is a _discrete_
colour dimorphism, with no intermediate colour to subsidise, so negative frequency-dependence there
maintains a polymorphism cleanly. Placement is _continuous_, so the same preference pours visits into
the gap. That is why deception split the **advertisement** and not the plant, and why linking the
advertisement to the anther loci did not rescue it. **Discrete versus continuous is the distinction
that decides whether negative frequency-dependence can complete a split or only maintain a
polymorphism** — and it was the thing this arc was missing.

## What is not established

The intermediate subsidy is measured as the weight an intermediate **would** receive, not as
intermediates actually arising and bridging in the fused replicates. The direct test is cheap and has
not been run: in fused runs, check whether occupancy of the gap rises _before_ `ancVar` collapses.
Until that is done the mechanism is strongly supported, not proven.
