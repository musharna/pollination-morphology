# The cost of prolonged presentation — and the artefact that was hiding it

**Date:** 2026-08-02 · **Code:** `sim/carryover.js` (senescence, cap accounting), `sim/reward.js`
(upkeep), `experiments/presentation-cost.js`, `tests/presentation-cost.test.js` · Roadmap item C,
third mechanism class.

The reward experiment reproduced Castellanos et al. 2006
([10.1086/498854](https://doi.org/10.1086/498854)) in three cells of four and left a diagnosis on
the record: gradual dispensing bore no cost in this model except stranding, so once visits were
plentiful it could tie but never lose, and a **cost of staying open** was the missing mechanism.

That diagnosis was half right, and it was wrong about which half mattered.

## D0. The diagnosis makes an arithmetic prediction, and it is unflattering

Before building anything, the existing table already constrains what a cost can do. Gradual beats
simultaneous by **1.68×** in frequent+wasteful and by **1.79×** in frequent+efficient. The margin is
_larger_ in the cell that is supposed to reverse. So a cost that acts the same way in both regimes
flips the wasteful cell — which theory says must stay gradual — at a **weaker** setting than the
efficient one:

```
  regime                    gradual  simultaneous   flips at m
  frequent + wasteful        5.007%        2.990%        0.593
  frequent + efficient      19.356%       10.812%        0.559
```

**Prediction, registered before measuring: no regime-independent cost reaches 4/4.** Repairing the
broken cell must break a working one first.

## D1 / D2. Both costs, and both confirm it

Two costs, each real biology and each worth having regardless:

- **Pollen senescence in the anther.** Viability decays on a clock after anthesis (Dafni & Firmage
  2000, [10.1007/bf00984098](https://doi.org/10.1007/bf00984098)). Measured in bout ticks, because
  pollen dies on a clock rather than per visitor. Inviable grains still **land and occupy a stigma
  slot** — dead pollen crowds live pollen, so this is not merely a discount on delivery.
- **Floral upkeep while open.** Floral longevity is itself an optimised trait balancing maintenance
  against the pollination it buys (Ashman & Schoen 1994,
  [10.1038/371788a0](https://doi.org/10.1038/371788a0)). Charged per visit-open, so a flower needing
  twenty visits to shed its pool pays twenty times the upkeep of one that sheds in a single visit.

Both are **schedule-selective by construction** — a simultaneous presenter empties on the visit its
flower opens, so its anther residence is zero and senescence costs it _exactly_ nothing. That is
asserted exactly in the test suite rather than approximately, and it is what makes this a mechanism
instead of a thumb on the scale.

Swept across the whole 2×2, neither reaches 4/4:

```
  senescence      best score 3/4   — at life 25 the wasteful cell breaks as the efficient one flips
  upkeep          best score 3/4   — and passes through 2/4 at m = 0.1, breaking wasteful while
                                     the efficient cell is still stubbornly gradual
```

The prediction holds. **A cost of prolonged presentation, on its own, cannot repair this table.**

## ⚠️ D3. The fourth cell was mostly my own artefact

The third hypothesis was the uncomfortable one: that the cell fails for a reason internal to this
model. Under the efficient regime grooming is 0.03 and harvest 0.03, so almost nothing leaves the
animal except by delivery. A simultaneous presenter hands over 60 grains per visit while a stigma
accepts at most `pickup`, so the load climbs until the **carry cap** truncates it — and the cap
discards the _oldest_ grains, precisely the ones that have not yet found a stigma.

```
  regime / schedule           final load   cap    truncated
  efficient / gradual                 26   140            0
  efficient / simultaneous           140   140      451,299
  wasteful / gradual                   2   140            0
  wasteful / simultaneous             58   140            0
```

The cap binds in **exactly one cell of the four** — the one that failed. Removing it:

```
  regime                 cap         gradual  simultaneous  winner
  frequent + efficient   140          19.356%       10.812%  GRADUAL
  frequent + efficient   unlimited    19.356%       19.615%  TIE
  frequent + wasteful    140           5.007%        2.990%  GRADUAL
  frequent + wasteful    unlimited     5.007%        2.990%  GRADUAL   (unchanged)
```

The cap was suppressing simultaneous presentation by **44%** in one cell and doing nothing anywhere
else. `cap = 140` was chosen when a visit deposited 8 grains; the presentation sweep varies the dose
from 3 to 60, and at 60 the cap binds on the first visit. **A constant calibrated under one regime
was reused across a sweep of exactly that regime.**

**Root cause of the non-discovery, which is the part worth keeping:** cap truncation was being added
to `groomedOff`, where it was indistinguishable from ordinary passive loss. A mechanism discarding
451,299 grains looked like grooming. The fix is not to raise the cap — that would tune a constant
and leave the next such artefact just as invisible — but to **count cap losses separately**, so that
a cap which bites announces itself. `capTruncated` is now its own return value with its own
regression test.

## D4. The two were never rivals — the artefact was masking the cost

Removing the cap does not finish the job either: the efficient cell becomes a **tie**, not a
simultaneous win. But it changes D0's arithmetic completely. With the cap unbound, gradual no longer
leads that cell at all, so an arbitrarily small cost tips it — while the wasteful cell still needs a
cost of 0.593 to move. The separation that a repair requires did not exist until D3.

Together, they reach **4/4 across a wide plateau**:

```
  senescence, uncapped     4/4 for pollenLife 400 down to 40   (3/4 at 25: wasteful finally breaks)
  upkeep, uncapped         4/4 for m = 0.01 to 0.05            (3/4 at 0.10)
```

The margins are not knife-edge. At `pollenLife = 100`, simultaneous leads the efficient cell by
**20.0%** while gradual holds the wasteful cell by **27.2%** — opposite directions, both far outside
the 2% tie band, across a full decade of the decay clock. And simultaneous scores **exactly**
19.615% at every lifetime, which is the schedule-selectivity property confirming itself independently
of the test that asserts it.

**All four of Castellanos' regimes now come out right at once**, which no single change achieved.

## What this actually says

The roadmap named "a missing cost of prolonged presentation" as the cause. Measured, the cause was
**two things that could only be seen together**: a real missing cost, and an artefact of my own carry
cap that was suppressing the alternative strategy by 44% in exactly the cell under dispute. Either
one alone leaves the table broken. That is the substantive correction, and it is a case where the
single-hypothesis diagnosis would have produced a tuned constant and a false result — the senescence
sweep alone would have "reached" the efficient cell at `life 25` while quietly breaking the wasteful
one, and 3/4 would have looked like progress.

## Limits

The reproduction is now complete, but it is a reproduction of a **qualitative** two-sided
prediction — which strategy wins in each regime — not of any measured magnitude. Delivery level
remains uncalibrated (3–6% against Harder & Thomson's 0.6%, unchanged from the reward work), and
roadmap item E is still where that gets settled.

`pollenLife` is quoted in bout ticks with no conversion to hours, so "40 to 400" is a statement about
this model's clock rather than about any species. Upkeep in grain-equivalents is a currency
conversion and an assumption, not a measurement; its role here was to be the second, non-selective
cost against which senescence could be told apart, and it earned that role by behaving differently.

The carry cap is now **visible** rather than fixed: the default is unchanged at 140 so no earlier
result moves, and the presentation experiments run uncapped. Any future sweep that varies dose must
check `capTruncated` — that is what the new test exists to enforce.

None of this is inside the evolution loop. These are fixed strategies compared against each other,
not strategies that evolved.
