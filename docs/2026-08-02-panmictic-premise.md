# The premise under roadmap B, measured instead of assumed

**Date:** 2026-08-02 · **Code:** `experiments/panmictic.js` · First step on roadmap item B.

`sim/evolve.js` has opened, since v1 was designed, with a claim in a comment:

> "In a single panmictic population, selection on placement is POSITIVELY frequency-dependent —
> matching the majority maximises mating success — so it converges rather than diverges, and no
> amount of running produces speciation."

Two things rest on it. It is why the evolution loop **starts with many species already distinct**
rather than one population that splits. And it is the entire framing of roadmap B: if placement
selection converges, something else must break the symmetry, and B goes looking for that something.
If it were false, B would be asking the wrong question.

It had never been measured. This measures it — before building the individual-based model that B
calls for, because that model's whole justification is this claim.

## The measurement

One panmictic population, every individual with its own shape genome and therefore its own computed
placement (**placement is still never a gene**). Transfer is counted between _individuals_ rather
than species, so `T[i][j]` is grains from plant i reaching plant j and mating success is per plant:
male = grains sired elsewhere, female = grains received, selfing excluded. Fitness is then taken
against how far an individual's placement sits from the population mean, in the same body metric
that decides whether two plants can exchange pollen at all.

On a **|deviation from the mean|** axis: falling with deviation = stabilising; rising = disruptive,
because the mean is then the worst place to be; flat = no placement selection.

## ⚠️ The control failed first, and it caught a bug in the measurement

A harness that can only ever report "stabilising" would return the expected answer for the wrong
reason — and the expected answer is exactly the one nobody would question. So two synthetic
populations with known answers, both required:

| control                           | must read   | result |
| --------------------------------- | ----------- | ------ |
| unimodal cloud                    | STABILISING | ✅     |
| two separated clusters + a bridge | DISRUPTIVE  | ✅\*   |

\*on the second attempt. The first run reported the by-construction disruptive population as an
unnamed "rises with deviation", because the verdict function was looking for a **U with an interior
minimum** — which is the signature on a _trait_ axis. On a deviation axis the population mean has
been folded onto x = 0, so disruptive selection puts the minimum in the **first** bin and the curve
rises monotonically. The shape test was written for the wrong axis.

Had the control been skipped, part A's "STABILISING" would have been reported from a harness that
could not have said anything else about a disruptive population. The controls are cheap; this is
what they buy.

## A. The gradient — stabilising, and it repeats

One population is one draw, and a single 6% decline over five bins of six plants is noise. Across
**8 independent populations** (7 met the size threshold), fitness change from the nearest bin to the
furthest:

```
  -48.9%  +/- 16.2pp   (95% CI, t, df=6)
  per-population: -20%  -42%  -69%  -55%  -71%  -36%  -49%
```

All seven negative, interval excluding zero. **Placement selection in a panmictic population is
stabilising.**

## C. The dynamic — and the arm that makes it a test

The claim is about a trajectory, not an instant, so the population is run forward. ⚠️ But "spread
must shrink" is only the right test with **mutation switched off**: stabilising selection against a
live mutation rate settles at a mutation–selection balance with non-zero variance. Measured only
with mutation on, this part would have read as evidence against a claim it does not test. Both arms:

```
  mutation OFF                          mutation ON
  gen   spread   mating success         gen   spread   mating success
    0    5.690          2034              0    5.690          2034
    3    2.440          3716              3    5.442          1331
    6    1.272          4728              6    4.982          1831
    9    0.972          4806              9    6.029          1364
   11    0.453          5118             11    5.282          1543
```

With mutation off the spread **collapses 12.6×** (5.690 → 0.453) while mean mating success rises
**2.5×** — convergence, monotone, exactly as claimed. With mutation on it holds near 5.3, which is
balance rather than a failure to converge. The two arms answer different questions and only the
first one tests the claim.

## Verdict

**The comment was right, and it is now evidence rather than an assertion.** Placement selection in a
single panmictic population converges: the gradient is stabilising across independent populations,
and the trajectory collapses onto a point once mutation stops feeding it.

**Roadmap B is therefore asking the right question.** Something other than placement selection has
to break the symmetry, and B's individual-based model — real inheritance, recombination, hybrids —
is the instrument for finding out what. This result is what licenses building it.

## Limits

`popFitness` weights every plant equally as a pollinator target and runs one bout per generation, so
demography is fitness-proportional reproduction rather than an ecology. There is **no
recombination** — offspring are mutated clones — which is deliberate here (it isolates selection on
placement) and is precisely what B must add next; frequency-dependent selection with recombination
can behave differently from the asexual case.

Populations are small (N = 30–40) and a sizeable fraction of random genomes make no contact with
the animal at all, so part C's live count fluctuates and some of the selection is on
contact-at-all rather than on placement. The gradient in part A is measured on the contacting
subset only.

Twelve generations is short. It is enough to see a 12.6× collapse, not enough to say anything about
what happens at the converged state.
