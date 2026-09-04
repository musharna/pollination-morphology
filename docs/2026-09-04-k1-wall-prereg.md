# Pre-registration — #61: what is the k = 1 wall made of?

_2026-09-04. Registered before the discriminating quantities were read. The
three hypotheses below were committed at `36fae2b` (2026-09-03, task #61 as
filed at #60's close), before any of this data was touched._

## The discontinuity

| k   | per-capita fitness `w` (#56) | P(recover to k≥3), arm A (#60) |
| --- | ---------------------------- | ------------------------------ |
| 1   | **0.000**                    | **0.000** (23 gens / 23 seeds) |
| 2   | 0.734                        | 0.298 [0.175, 0.419]           |
| 3   | 1.646                        | —                              |

k = 2 is an ordinary state with an ordinary escape probability **in every arm,
including the one with no selfing at all**. k = 1 is an exact zero. That is a
wall, not a gradient, and every result from #56 onward sits on top of it. No task
so far has said what it is made of.

## The three hypotheses (committed at `36fae2b`)

- **H1 — NEVER POLLINATED.** She is alone in her flowering slice, receives
  nothing, and is never drawn as a mother. Predicts `minMothered` = 0 at k = 1.
- **H2 — POLLINATED BUT DEFINITIONALLY HYBRIDISED.** She reproduces fine, but her
  only available sires carry a different `anc`, so every offspring is scored a
  hybrid **by the averaging rule** rather than by any failure to reproduce.
  Predicts `minMothered` > 0 with hybrid offspring.
- **H3 — DEMOGRAPHIC.** She mothers pure offspring, but one plant cannot compound
  to k ≥ 3 against a 29-plant majority. Predicts `minMothered` > 0, offspring
  pure, count never reaching 3.

⚠️ **If H2 holds, "the floor" is substantially a TRACER ARITHMETIC FACT rather
than mate limitation, and #56–#59's framing needs revisiting.** That is exactly
why it is being discriminated rather than assumed.

## A prediction derived from the model's own source, registered in advance

Read out of live code before measuring anything:

- outcrossed offspring take `anc = (anc_m + anc_f) / 2` — `sim/ibm.js:2015`
- a selfed seed with `ancNull` off takes `anc = anc_mother` **exactly**, skipping
  the averaging — `sim/ibm.js:1952`
- `label()` calls a plant pure only at `anc` exactly 0 or exactly 1, and returns
  −1 (hybrid, in neither lineage count) for anything strictly between —
  `experiments/rare-floor.js:74-78`

**Therefore, algebraically:** at k = 1 the lone minority plant is the _only_
carrier of her `anc` value. Any outcross she takes part in yields
`(1 + a_f)/2` with `a_f < 1`, which is strictly between 0 and 1, hence a hybrid.
There is **no assignment of fathers** that produces a pure offspring for her.
A pure lineage needs **two** pure parents; selfing is the only mechanism in the
model that manufactures one from a single parent.

**P1 (registered):** P(pure minority offspring | k = 1, selfing off) is **exactly
zero for a structural reason, not a stochastic one** — which is what an exact
0.000 across 23 independent seeds should look like, and what a merely small
probability should not.

**P2 (registered):** this predicts the k = 1 → k = 2 discontinuity without any
appeal to demography. At k = 2 the two pure plants can sire each other, so a
pure offspring becomes possible, and recovery should be positive **even with no
selfing** — which #60 already measured at 0.298 in arm A.

⚠️ **P1 is a claim about what is possible, not about what happens.** It is
consistent with H2 _and_ with H1: if she is never drawn as a mother at all, P1 is
vacuously true and H1 is the operative mechanism. **The measurement below is what
separates them, and P1 does not pre-empt it.**

## The discriminator

Conditioning set: every informative generation with k = 1, seeds pooled within a
run and bootstrapped over seeds (2000 resamples), as #60.

| observable             | H1                 | H2        | H3     |
| ---------------------- | ------------------ | --------- | ------ |
| `minMothered` at k = 1 | **0**              | > 0       | > 0    |
| hybrids present (`nh`) | ~0                 | **rises** | ~0     |
| next-gen pure minority | 0                  | 0         | ≥ 1    |
| `selfShare` non-null   | no (receives none) | either    | either |

**Decision rule, fixed in advance.** H1 is adopted if `minMothered` = 0 in the
large majority of k = 1 generations in arm A. H2 is adopted if `minMothered` > 0
**and** the hybrid count moves with it. H3 is adopted if pure minority offspring
exist at k = 1 and the failure is one of compounding. If `minMothered` = 0 and
`nh` is also ~0, then **H1 and P1 are both true and P1 is not doing the work** —
that combination must be reported as H1, not as H2, however attractive the
arithmetic is.

⚠️ **The arithmetic in P1 is seductive and it is not self-certifying.** It says
what cannot happen; it does not say that the thing that fails is the thing it
forbids. Naming P1 the cause when `minMothered` = 0 would be diagnosing the
symptom's layer instead of the mechanism's — the exact error the
`causal-vs-bandaid` gate exists to catch.

## Reflexivity, and how it is handled

A k = 1 generation is **defined by the pure labels**, so if H2 holds the
conditioning set is itself shaped by the thing under test. Handled as #60 handled
it: the conditioning set is defined once, on the PURE labels, and **held fixed**
across every convention and every arm. Nothing is re-conditioned on a quantity
downstream of the hypothesis.

## Controls

- **C8′** — every archive matches its published dump before re-analysis
  (`tools/rare-cost-anchor.js`, seen to fail on a 1e-9 perturbation).
- **C-seed** — distinct seeds reported beside every generation count.
- **C-conv** — PURE and INCLUSIVE reported as a pair, per the standing rule that
  a verdict which flips with the convention is the tracer's and not the
  biology's. This is the fifth consecutive task to require it.
- **C-arity (new, and the one that can falsify P1)** — at k = 2, pure offspring
  must be _possible_ and observed. If pure minority offspring never appear at
  k = 2 either, then P1's arity story is wrong and the wall is something else.

## Disclosure

The availability pre-flight (field presence and generation/seed counts) ran
before this registration; it reproduced #60's C-seed table exactly and revealed
that `selfShare` is non-null at all 23 of arm A's k = 1 generations, which
implies self-pollen receipt is non-zero there. No fitness, mothering, or offspring
quantity was read. Following #60's precedent, this is stated rather than
implied.
