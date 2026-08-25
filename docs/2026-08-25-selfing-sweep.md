# Reproductive assurance, swept — 2026-08-25

**No tested rate met the conjunction. Across seven doses spanning 0.05 to 0.7,
neither the admissibility gate nor the attribution gate opens anywhere — and the
positive control confirms the knob was live at every one of them.**

Closes the open item at roadmap `:300`, which asked whether a SMALLER rate sits
in a window that is both admissible and effective. The 2026-08-07 run tested one
rate; the pre-registration had asked for a sweep.

Result at n=30, d=8, 8 seeds × 5 frequencies per rate, siteN=160. jobd 3323 on
`gt76`, branch `selfing-sweep`.

## The sweep

| rate | admissibility (vs ALWAYS) | attribution (− floorOnly) | realised effect | loss free/dead |
| ---- | ------------------------- | ------------------------- | --------------- | -------------- |
| 0.05 | 0.248 ± 0.383             | −0.095 ± 0.410            | −0.112 ± 0.420  | 5 / 14         |
| 0.1  | 0.070 ± 0.587             | −0.184 ± 0.579            | −0.290 ± 0.616  | 4 / 15         |
| 0.2  | 0.085 ± 0.493             | −0.144 ± 0.504            | −0.274 ± 0.529  | 3 / 15         |
| 0.3  | 0.008 ± 0.472             | −0.196 ± 0.465            | −0.352 ± 0.495  | 3 / 13         |
| 0.4  | −0.034 ± 0.342            | −0.197 ± 0.299            | −0.393 ± 0.362  | 3 / 13         |
| 0.5  | 0.013 ± 0.251             | −0.175 ± 0.263            | −0.347 ± 0.286  | 1 / 14         |
| 0.7  | 0.033 ± 0.233             | −0.150 ± 0.223            | −0.327 ± 0.252  | 1 / 16         |

| gate                               | opens at      |
| ---------------------------------- | ------------- |
| distinguishable from total selfing | **(none)**    |
| separable from the weight floor    | **(none)**    |
| a rare advantage                   | 0.4, 0.5, 0.7 |
| **all three**                      | **(none)**    |

## Why an empty answer was the interesting one

The two gates squeeze from opposite directions, which is why the roadmap note
said the answer was not obvious:

- **ADMISSIBILITY wants a LOW rate.** The claim is only admissible where the arm
  is DISTINGUISHABLE from total selfing. A treatment behaving like the trivial
  control _is_ the trivial control, whatever its parameter says.
- **ATTRIBUTION wants a HIGH rate.** The selfing-specific effect is
  selfing-minus-floorOnly, and floorOnly carries the maternal-weight flattening
  WITHOUT the selfing. A small rate barely selfs, so nothing survives the
  subtraction.

A window exists only where both clear zero at the SAME rate. Neither clears zero
at ANY rate, so the squeeze is not merely tight — there is no dose where the
mechanism is both itself and distinguishable from its own trivial limit.

## ✅ The positive control, which is why the null is about biology

⚠️ **A negative result's first suspicion should be a dead harness, not a dead
mechanism.** Free-versus-fully-costed lineage loss separates at **every** rate —
5→14, 4→15, 3→15, 3→13, 3→13, 1→14, 1→16 of 40 cells. The knob was connected and
doing something at every dose. **The gates are rejecting WHAT the mechanism did,
not whether it ran.**

## ⚠️ How this must be worded

**Safe:** none of the tested rates simultaneously showed the registered effect,
remained distinguishable from ALWAYS, and survived the floor-only attribution
control.

**NOT safe:** "no admissible selfing window exists." Failure to distinguish an
arm from ALWAYS is not statistical proof of equivalence — that would need a
pre-declared equivalence margin, and none was registered. The result bounds what
this design detected across seven doses; it does not prove absence throughout the
parameter space.

The realised effect is also **negative at every rate** — the exponent moves the
wrong way. Assurance makes frequency-dependence stronger, not weaker. That is a
finding in its own right and it is consistent across the whole swept range.

## ⚠️ The sweep drives the published experiment rather than re-implementing it

Every number comes from `experiments/selfing.js` — the same file, estimator and
gates that produced the single-rate result — driven through `SELF_RATE` with a
machine-readable line built from the same objects its own verdict reads. A sweep
carrying its own copy of the estimator would be testing the copy. Not
hypothetical: this project has shipped two green tests over a `step()` that
ignored the flag they claimed to exercise.

Verified faithful: a default run reproduces the published attribution figure
exactly, **−0.175 ± 0.263**.

## ⚠️⚠️ A defect this run did not trip, and the next positive would

`experiments/selfing.js:419` consults admissibility and attribution ONLY inside
the "effect not established" branch. The green branch at `:431` is reached
without either boolean. **The gates are checked only on the path where the answer
is already negative** — a future POSITIVE walks straight past the machinery the
pre-registration wrote to catch it.

The comment two lines above says _"the gates are applied HERE rather than
reported and walked past."_ That is true of the branch it sits in and false of
the success branch. This sweep took the negative path, so the gates fired; that
was luck, not design. Tracked as an open item.

The same shape exists at `reachability.js:175/:224`,
`two-pollinator-coexistence.js:314`, and `secondary-contact.js:506/:572`.

## What this closes

Reproductive assurance is spent as a route to a derived minority advantage, now
across a swept range rather than at a single point. It joins the table at
roadmap `:219` — ⚠️ as **one route tested thoroughly**, not as an additional
independent negative. The 2026-08-07 single-rate result and this sweep are the
same route; counting them separately would inflate the tally.

[single-rate result](2026-08-07-selfing.md) · [prereg](2026-08-07-selfing-prereg.md)
· raw output: jobd 3323
