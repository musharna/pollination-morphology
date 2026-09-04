# #60 pre-registration — survival is not recovery

_2026-09-03. Follows [#58](2026-09-03-selfing-rate.md) and
[#59](2026-09-03-selfing-cost.md), which measured the same gap from opposite
sides._

## Why this exists

#58: the floor rescue is gradual while HELD moves only at the extreme. #59: the
floor rescue survives inbreeding depression while HELD does not. **Both say a
lineage can be rescued at k = 1 and still not coexist**, and nothing has measured
what happens between those two states.

The decomposition: being rescued at k = 1 is **survival**. Coexisting needs
**recovery** — getting back to a k where the floor no longer binds. #56 measured
w = 0.000 at k = 1, 0.734 at k = 2 and 1.646 at k = 3, so **k ≥ 3** is the
registered escape threshold.

## ⚠️ DISCLOSURE: THE PRE-FLIGHT WAS OUTCOME-REVEALING, AND THIS IS NOT A BLIND REGISTRATION

The #60 brief required settling one threat before anything else: **`k` is itself
a tracer quantity.** `k = nMin` counts only PURE lineage labels
(`experiments/rare-floor.js:157`); `label()` returns −1 for anything strictly
between 0 and 1 (`:70`), so a hybrid is in neither count, and `informative`
demands both pure counts be non-zero. A minority plant whose offspring are all
hybrids therefore reads as **extinction** while her genes are still present.

Testing that threat requires classifying what follows each k = 1 generation —
**which is the same classification as the outcome.** So the one-generation point
estimates were visible before this document existed. They are reproduced here
rather than hidden:

| cell     | k=1 gens | HOLD | RECOVER | ABSORBED | LOST | ABSORBED as % of exits |
| -------- | -------- | ---- | ------- | -------- | ---- | ---------------------- |
| arm A    | 23       | 0    | 0       | 0        | 23   | 0.0%                   |
| cost 0   | 69       | 18   | 10      | 1        | 40   | 2.4%                   |
| cost .25 | 91       | 35   | 7       | 3        | 45   | 6.3%                   |
| cost .50 | 74       | 23   | 7       | 2        | 42   | 4.5%                   |
| cost .75 | 49       | 8    | 3       | 2        | 36   | 5.3%                   |
| cost .95 | 40       | 2    | 0       | 3        | 35   | 7.9%                   |

**So this registration governs the INFERENCE, not the discovery.** What is
genuinely open, and what the verdict will rest on:

1. **Intervals.** These are generation counts pooled across seeds, and the
   standing lesson of this whole arc is that a point estimate clearing a
   threshold is not a result. Generations within a seed are not independent;
   every number above could be a handful of seeds. **The bootstrap over seeds has
   not been run and is where the verdict lives.**
2. **The windowed definition.** The table is one generation ahead. The registered
   statistic is a 5- and 10-generation window (below), which is not computed.
3. **The convention check.** Whether the answer survives counting hybrids as
   alive is not known.

Anything the intervals do not support will be reported as NO VERDICT, exactly as
#59's primary was.

## The tracer threat, resolved

ABSORBED — the minority's pure count reaching zero **while hybrids exist** — is
the tracer-convention route to a false extinction. It runs **0.0 / 2.4 / 6.3 /
4.5 / 5.3 / 7.9%** of exits, rising with cost as expected but never dominating.
`k` is therefore usable, provided the convention's effect is **measured and
reported** rather than assumed away. Hence the two conventions below.

✅ A guard on the classification itself: every one of the 232 exits across all six
cells is the **minority** vanishing, never the majority (which would be the
minority winning, and would invert the reading). Checked, not assumed.

## Registered statistics

For each cell, conditioned on a generation at **k = 1**, and separately at
**k = 2** so the escape is a curve rather than one number:

- **P(recover)** — reaches **k ≥ 3** within a window of **W generations**, before
  the lineage exits. Registered at **W = 5 and W = 10**, reported separately.
- **P(survive)** — the lineage is still present at generation +W.
- **P(exit)** — the complement.

**Estimator: bootstrap over SEEDS, resampling seeds and pooling the generations
inside them**, 2000 resamples, matching #58/#59 so the three are comparable.
Generation-level intervals are not admissible here and will not be reported.

### Two conventions, and the difference between them IS the measurement

- **PURE** (the current code): a lineage is alive only while it has pure-labelled
  plants. ABSORBED counts as an exit.
- **INCLUSIVE**: a lineage is alive if it has pure plants **or** hybrids, and
  k_incl = nMin + nh. ABSORBED counts as survival.

Registered rule: **if the two conventions disagree on any verdict below, the
verdict is the tracer's and not the biology's**, and it will be reported as
convention-dependent rather than as a result. This is the same move #58 made with
`ancNull` — measure what the convention does instead of assuming it is neutral —
and it is the fourth consecutive task in this arc to need it.

## The discriminator

- **H_S — selfing buys survival, not recovery.** P(survive) rises with selfing
  while P(recover) intervals overlap across arms. This would explain #58 and #59
  at once: the floor rescue never converts into coexistence.
- **H_R — selfing buys both.** P(recover) rises too, and the coexistence failure
  lies further downstream (recovery happens but fusion still wins).

Decision rule: **H_S** if the P(recover) interval for cost 0 minus arm A contains
zero while the P(survive) difference excludes it; **H_R** if the P(recover)
difference excludes zero; **NO VERDICT** if neither, or if half-widths exceed
0.15 as in #59.

⚠️ Arm A has **0 recoveries in 23 generations**, so its P(recover) interval will
be one-sided and narrow only if the seed count behind those 23 generations is
large. **Report the number of distinct seeds contributing, not just the
generation count** — 23 generations could be 3 seeds.

## Controls

- **C8′** — every archive re-analysed is verified against its published dump by
  `tools/rare-cost-anchor.js` before any statistic is computed.
- **C-class** — the classification guard above (every exit is the minority),
  re-asserted at full n.
- **C-seed** — report distinct contributing seeds per cell alongside every
  generation count, so no interval rests on a handful of runs.
- **C-conv** — the PURE/INCLUSIVE comparison, above.

## Limitations, registered in advance

1. **This is a re-analysis of #58/#59 archives**, so it inherits their design:
   one population size, one premium setting, rate 2.0 for the cost arms.
2. **Conditioning on k = 1 conditions on a state whose frequency itself varies
   across arms** (#59: 69 → 91 → 74 → 49 → 40, a rise this arc has not
   explained). The windowed statistics are conditional and are not a claim about
   how often lineages arrive at the floor.
3. The point estimates were seen first (disclosed above).
