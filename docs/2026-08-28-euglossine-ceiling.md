# Result — roadmap A's ceiling leg is unblocked, measured, and it does NOT clear the bar

**Date:** 2026-08-28 · **Status:** run, NEGATIVE (bounded, not a refutation)
**Source:** Ackerman _et al._ 2023 global orchid reproductive-biology database —
Zenodo [`10.5281/zenodo.7263689`](https://doi.org/10.5281/zenodo.7263689), **CC-BY-4.0**,
`Pollination_List_RLT_Data_For_Submission.xlsx`, 2872 orchid species
**Re-run with** `node _scratch/euglossine-ceiling.js`

## The blocker was real and it was the wrong blocker

`ROADMAP.md:66` has recorded this leg as blocked since 2026-08-02 on Ackerman _et al._ 2023
(`10.1093/botlinnean/boac082`) being paywalled. **Re-verified against OpenAlex today and the paper is
still closed** — `is_oa: false`, `oa_status: "closed"`, `any_repository_has_fulltext: false`. That
part of the record was accurate.

**But the leg never needed the paper. It needed the database the paper introduces, and that database
is openly deposited under CC-BY-4.0.** The roadmap checked whether the _article_ was readable, when
the requirement was a _dataset_ — a different object with its own deposit and its own licence. It is
the exact failure this project's own standing rules describe: an absence claim routed to the wrong
domain, where the null was re-confirmed several times without the search ever being pointed at the
thing actually required.

## What the data says

Of 2872 species rows, **279 name a euglossine genus** as pollinator; 36 identify no bee to species,
and **1 euglossine binomial was dropped as ambiguous**. That leaves **88 distinct euglossine bee
species**, of which **44 (50.0%)** are recorded on more than one orchid.

| orchid species served | bee species |
| --------------------: | ----------: |
|                     1 |          44 |
|                   2–4 |          27 |
|                   5–9 |          14 |
|                    18 |           1 |
|                    22 |           1 |
|                **35** |       **1** |

Range-wide maximum: **35 orchid species on _Eulaema cingulata_**, then 22 on _Euglossa viridissima_
and 18 on _Eulaema meriana_.

## ⚠️⚠️ And the range-wide number is the WRONG comparison

The model's ceiling is a **local packing limit** — how many species can coexist sharing one
pollinator. A bee's geographic range is not a community, and 35 orchid species scattered from Mexico
to Brazil are not competing for one animal's back. Quoting 35 against a packing ceiling would be a
category error, so the same count restricted to a single named region:

| orchid species | bee × region                   |
| -------------: | ------------------------------ |
|         **14** | _Euglossa viridissima_ @ Mex   |
|              9 | _Eulaema cingulata_ @ S Am     |
|              7 | _Eulaema meriana_ @ C Am       |
|              6 | _Eulaema meriana_ @ S Am       |
|              5 | _Eufriesea caerulescens_ @ Mex |

## The verdict

`ROADMAP.md:88` states the bar exactly: until this lands the claim is _"2-D out-packs 1-D in this
model"_ and **not** _"real richness exceeds what 1-D placement supports."_

The model's precision-matched 1-D arm packs **19 species** (τ = 0.2, at the 309-species pool it
samples; 2-D packs 40).

- Range-wide, **35 > 19** — but that is the comparison just ruled out as a category error.
- Region-restricted, **14 < 19**. **The bar is not cleared.**

**So the claim does NOT get upgraded.** After the leg is measured, this project still says "2-D
out-packs 1-D in this model", and still cannot say the stronger thing about the world.

## ⚠️ It is a bound, not a refutation, and the two biases run opposite ways

- **Literature compilation UNDER-counts.** It records the visits somebody looked for, so the true
  number of orchid species sharing a bee can only be higher than 14.
- **A region OVER-counts sympatry.** "Mex" spans thousands of kilometres; those 14 orchids are not
  demonstrably co-flowering at one site.
- ⚠️ **And the comparator itself is not a constant.** `ROADMAP.md:17` records that the 2.1× ratio is
  pool-dependent and rises to ~3.1× once both arms get a large enough candidate set — the roadmap's
  own instruction is to quote the pool size with the ratio. So "19" is one point on a curve, not a
  fixed property of one-dimensional placement.

Neither bias is quantified here. **The honest reading is that the measurement does not support the
stronger claim and does not refute it either** — and that is a different, weaker statement than "the
ceiling leg is closed", which is why this document does not say that.

## What would actually settle it

A single-site euglossine community census: one locality, the orchid species recorded on one bee
species there. The database carries a `region` field but not site-level co-occurrence, so the
resolution needed is finer than the deposit. That is a data requirement, not a paywall — which is a
better position than the roadmap has been in since 2026-08-02, but it is not the answer.

## Instrument note

The parser resolves genus abbreviations against full genus names appearing earlier in the same cell.
⚠️ **Prefix matching is wrong for this data and the parser's positive control caught it before any
number existed**: `El.` is Eu**L**aema, `Eg.` is Eu**G**lossa, `Ef.` is Eu**F**riesea — abbreviations
formed from non-adjacent letters, so `"Eulaema".startsWith("El")` is false and every `El. cingulata`
would have been silently discarded. Resolution is now two-tier (prefix, then subsequence anchored at
the initial), and **a tier yielding more than one candidate is dropped and counted rather than
resolved by preference**. One binomial was dropped that way.
