# #59 pre-registration — does inbreeding depression close the selfing escape?

_2026-09-03. Written and committed BEFORE the cells ran. Follows
[#58](2026-09-03-selfing-rate.md)._

## Why this exists

#58 lifted the rare-lineage floor from an exact zero: at a minority of one plant,
offspring mothered per plant went **0.000 → 0.580** as the selfed share of matings
went 0% → 67%, with the registered primary agreeing (+0.241 [+0.007, +0.475] at
rate 2.0). Coexistence followed only at that top rate (HELD +0.138 [+0.009, +0.266]).

**Every one of those numbers is an upper bound.** `cost` was 0 in all five cells,
so a selfed offspring _always_ established. `sim/ibm.js:683` documents `cost` as
inbreeding depression and says it exists so the mechanism **can fail and must be
shown to**. #58 never made it fail. This does.

## The run

Sweep `cost` ∈ {0, 0.25, 0.5, 0.75, 0.95} at **selfing rate 2.0**, N0 = 30, arm A
(premium on), **120 seeds per cell**. Rate 2.0 because it is the only rate where
#58 saw coexistence move, so it is the only rate where a cost has something to
take away. The cost-0 cell _is_ #58's `R200` and is re-run rather than reloaded,
so the demographic observables exist for every cell on identical terms.

## ⚠️ What `cost` actually does here — settled by reading the code, not assumed

With demography off the recruitment loop is `while (next.length < target)`
(`sim/ibm.js:1906`), and a selfed seed killed by `cost` returns false
(`sim/ibm.js:1941`) so the caller does `failed++; continue`. **The slot is not
lost.** The loop draws another mother, and that draw goes to whoever the
visit-weighted distribution favours.

So `cost` here is a **competitive** penalty on selfers, not a fecundity penalty
on the population. This is the single assumption the whole reading rests on, so
it is measured in every cell (recruits/generation, stalls, shortfall) and
asserted in `tests/rare-floor.test.js` — including against a mutant with the cost
check disabled, which those tests were confirmed to fail.

## Pre-flight (12 seeds, run before registering; NOT a result)

| cost | attempted selfing | established selfing | recruits/gen | unmated/gen | stall% |
| ---- | ----------------- | ------------------- | ------------ | ----------- | ------ |
| 0.00 | 66.94%            | 66.94%              | 30.000       | 0.00        | 0.00   |
| 0.25 | 66.54%            | 59.92%              | 30.000       | 5.93        | 0.00   |
| 0.50 | 66.21%            | 49.16%              | 30.000       | 15.15       | 0.00   |
| 0.75 | 66.78%            | 33.35%              | 30.000       | 30.20       | 0.00   |
| 0.95 | 66.77%            | 9.26%               | 30.000       | 51.93       | 0.00   |

The lever spreads and the confound is dead: recruits/generation is exactly 30 in
every cell, so cost does **no** demographic damage. The k = 1 outcome at 12 seeds
is far too noisy to prejudge (7–12 lone-generations a cell), which is the point —
the design is validated without the answer being visible.

⚠️ The pre-flight also caught a defect in the runner: `RF_CONFIGS` filtered
against a cell registry and **silently dropped** names not in it, so a request
for four cells ran two and said nothing. Fixed to exit 2 and list the known
cells. A sweep that quietly drops half its arms is not wrong about any number it
prints, which is the worst way to be wrong.

## ⚠️ C10 must be read on ATTEMPTED selfing

`matings` is pushed only when a seed **establishes**, so `selfedN/matingsN` falls
with cost even though the selfing _decision_ rate is untouched — the pre-flight
shows it reading **9.26%** at cost 0.95. Reporting that as C10 would say "the arm
stopped selfing" and license a confident null about cost when the real story is
an arm selfing exactly as hard whose seeds are dying. #58's C10 had to be widened
once for this class of blind spot; this is the same trap in a different coat.

`unmated` is the model's own count of seeds that failed to establish, so
**attempts = selfedN + unmated**, measured. Its positive control: at cost 0,
`unmated` must be exactly 0 (pre-flight: 0.00, and asserted in the test suite).

## Registered criteria

**PRIMARY — offspring mothered per minority plant at k ≤ 2**, mother-based, with
the tracer printed beside it, bootstrapped over seeds and differenced against
cost 0:

- any CI of (cost _c_ − cost 0) lying **entirely below 0** → inbreeding
  depression erodes the rescue;
- all CIs containing 0 with half-widths **< 0.15** → the rescue survives
  depression;
- otherwise **NO VERDICT** (underpowered), stated as such.

**SECONDARY — k = 1 alone, with intervals this time.** #58 reported this series
as bare means and explicitly declined to promote it to a shape claim on that
basis. Here it carries a bootstrap interval.

**The shape, which is the question worth registering.** Everyone expects the
rescue to shrink; the disagreement is about how fast, and it is arithmetic:

- **H1, proportional loss** — a selfed seed establishes with probability
  (1 − _c_), so the rescue is simply scaled: _m_(_c_) = _m_(0)·(1 − _c_).
- **H2, re-draw compensation** — a killed seed costs a DRAW, not a generation,
  and the loop keeps drawing until the slot fills. Total draws inflate by
  1/(1 − _s·c_) with _s_ the attempted-selfing share, while a mate-limited
  mother's share of draws is unchanged, so she gets **more attempts** as cost
  rises: _m_(_c_) = _m_(0)·(1 − _c_)/(1 − _s·c_). `s` is measured at cost 0.

They diverge most in the middle — at cost 0.5, H2 predicts about 1.5× H1 — which
is why the sweep is not just its endpoints. Decision rule: at each cost, if the
measured 95% CI excludes one prediction and contains the other, that reading is
selected; if it excludes both, neither model describes the curve; if it contains
both, **UNRESOLVED**.

**I am registering H2 as my prediction**, on the strength of having read the
loop rather than on any pilot number.

**HELD** — bootstrapped over runs, differenced against cost 0. ⚠️ Cost 0 here is
the rate-2.0 **selfing** arm (#58: 0.404), not arm A (0.266). A CI below 0 means
depression closes the coexistence escape.

**Second registered prediction, stated so it can be falsified:** the number of
lone-generations (k = 1) will **fall** with cost — the mirror of #58, where it
rose from 23 to 69 because selfing kept lineages alive in that state. If it does
not fall, my account of what cost does to a lineage's trajectory is wrong.

**Registered floor on HELD:** I predict HELD declines toward arm A's 0.266 but
does **not** fall below it, because the weight floor still hands the rare plant
draws she would otherwise never get. A cell below 0.266 would falsify that.

## Controls

- **C8′ (exact agreement)** — the re-run cost-0 cell must reproduce #58's
  archived `R200` **exactly**, row for row. `cost: 0` draws no random number
  (`S.cost > 0` is false), so this is the same simulation and anything short of
  bit-identical means the instrumentation changed the run.
- **C1** — ⚠️ **does not apply to these cells.** They are selfing arms and must
  NOT reproduce arm A's 0.289; a control demanding they matched would be wrong in
  the direction that looks rigorous.
- **C5** — lineage counts exhaust the population.
- **C9** — `cf` never exceeds k − 1.
- **C10′** — attempted selfing non-zero and roughly flat across cost; established
  selfing free to fall.
- **Demographic check** — recruits/generation at target, stalls 0, shortfall 0 in
  every cell. If this fails, cost is doing demographic damage on top of genetic
  and the two must not be reported as one.

## Known limitations, registered in advance

1. **The k = 1 sample is not fixed across cost** — and, by the prediction above,
   is expected to shrink. The comparison is conditional on k = 1.
2. **One rate, one population size, one premium setting.**
3. `cost` is applied at establishment only; it carries no effect on the
   offspring's later fitness or on subsequent generations.
4. The bootstrap resamples seeds unpaired, matching #58's estimator so the two
   sweeps stay comparable, even though the arms share seeds and a paired
   bootstrap would be tighter.
