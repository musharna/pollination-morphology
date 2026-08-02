# pollination-morphology

A simulation in which **where a flower puts its pollen on an animal is never set — only computed.**

Two orchids can share a pollinator completely and still be unable to pollinate each other, because
one paints its pollen on the bee's back and the other on its belly. That is mechanical isolation,
and it is a real barrier to gene flow that most pollination models cannot represent at all: they
score a visit as a match between traits, so two species with equal match scores must exchange
pollen. The field says so in its own words — Mailly & Lihoreau 2025 note that models "assume random
pollen movements", and Ballantyne 2015 that networks record "visits… rather than clearly defined
effective pollination events."

Here, placement falls out of geometry. A genome is a set of **shape** parameters — tube length,
mouth and throat radius, curvature, a CYCLOIDEA-like polarity term, anther depth and angle. Where
the pollen lands is then computed from tube shape, body shape and how far the animal can push in.
**Placement is never a gene**, because the moment it becomes one the whole structure collapses into
a model that does not need geometry at all.

## What is here

|                    |                                                                                |
| ------------------ | ------------------------------------------------------------------------------ |
| `sim/placement.js` | the contact model — placement derived from shape                               |
| `sim/packing.js`   | overlap metric and species-packing ceiling                                     |
| `sim/evolve.js`    | the evolution loop: shared pollinator, stigma interference, lottery demography |
| `visit.html`       | watch one bee load pollen in one flower and fail to deliver it to the next     |
| `experiments/`     | the ablation, the pre-v1 checks, v1, the tolerance sweep                       |
| `docs/`            | groundwork, and a write-up per experiment including what went wrong            |

Open `visit.html` in a browser — no build step, no dependencies. Run `node --test tests/` for the
suite (71 tests). Every experiment is `node experiments/<name>.js`.

## What has been measured

**The 3-D contact model earns its place.** A free 1-D placement gene — the cheap version of this
project — supports 16 coexisting species on one pollinator where morphology-derived 2-D placement
supports 40, at matched precision, with both pools saturated. The 1-D arm is a steelman: it is
handed the whole body surface and draws its precision from the real pool's own distribution.
That 2.5× holds across every isolation tolerance (2.4–2.9×).
[detail](docs/2026-08-02-continuous-metric-rebaseline.md) [origin](docs/2026-08-01-ablation-result.md)

**Blind selection captures about 40% of that, and the advantage is a fact about precision.** An
evolving community reaches 40% of the achievable ceiling. When **both** arms are allowed to select
their precision, 2-D and 1-D placement are **indistinguishable — 0.92×**, with replicate counts of
6/10/9 against 10/7/6. A second placement axis multiplies the available slots only while placement is
imprecise, which is where real morphologies actually sit; at the best precision any real flower
achieves, one axis already affords enough slots that the second buys nothing.

⚠️ Two things had to be corrected before that number meant anything. The L1 control had been handed a
fixed median precision while L2 inherits precision from morphology; and the 24-bin histogram used to
score placement **saturates below one bin width**, which is exactly where a precision-evolving L1
lands. On the continuous metric that replaced it, the loop first read 0.84× — the 1-D control
*winning* — and that was an artefact of how many points the estimator retains, which biases irregular
and gaussian clouds in opposite directions. The converged answer is a tie.
[detail](docs/2026-08-02-continuous-metric-rebaseline.md) [decision](docs/2026-08-02-l1-precision-decision.md)

**The pollen dilemma has a price, and it is large.** Pollen is reward and gamete at once, so a
pollen-rewarding flower must spend gametes to advertise. Nectar breaks that coupling: its best
dispensing schedule is **four times more gradual and yields 2.2× the male fitness**. Harder &
Thomson's saturating gain curve is reproduced — and the mechanism turns out to be finite stigma
capacity, not grooming. [detail](docs/2026-08-01-reward-result.md)

**Pollen packaging is calibrated against 228 species.** Johnson & Harder 2023 report a _crossed_
result — solid pollinia are hard to remove (<45%) yet efficient once removed (27.0% transfer), while
granular monads are the reverse (>80%, 2.4%). One mechanism reproduces three of the four numbers:
a pollinium is a single solid object, so it comes away only on a visit precise enough to catch the
viscidium, and once glued on it is neither harvested nor groomed off grain by grain.
[detail](docs/2026-08-02-dispersal-unit.md)

**Pollen presentation theory reproduces in full — after one of the four cells turned out to be my
own bug.** Castellanos' two-sided prediction now comes out right in all four pollinator regimes. It
took a real missing mechanism (pollen senescing in the anther, which costs a gradual disperser
everything and a simultaneous one exactly nothing) _and_ the discovery that a carry cap sized for an
8-grain dose was silently destroying 44% of simultaneous presentation in exactly the cell under
dispute. Neither alone was enough, and the cost alone would have "fixed" the cell while quietly
breaking a working one. [detail](docs/2026-08-02-presentation-cost-result.md)

**The measurement surface itself had a defect, and closing it moved the numbers.** The front of the
animal was a coordinate edge that collapsed 38.5% of morphologies onto one along-body coordinate,
and the "ideal" ceiling arm was built at median precision — which made it a bound the measured arm
could beat. Both are fixed; the ~3× headline survived, but the claim that morphology reaches 88% of
the ideal placement surface did not, and is now 39%.
[detail](docs/2026-08-01-head-cap-result.md)

**Precision is a modifier, not a niche axis.** Species differing only in how repeatable their
placement is cannot coexist at any realistic threshold — a tight distribution nests inside a broad
one. That is a stronger claim than Armbruster's own framework makes.
[detail](docs/2026-08-01-pre-v1-checks.md)

## What is not claimed

Overlap in the packing results is _placement overlap_, not a measured transfer rate. Carryover,
packaging efficiency and last-male advantage are now built and counted, and the **contrast between
pollen-dispersal units is calibrated** against 228 species — but the **absolute monad delivery level
is not**, running 2.9x generous (7.1% against a measured 2.4%), so magnitudes still should not be
quoted as rates. The evolution loop is adaptive dynamics, not population genetics — no standing variation, no
recombination, no hybridisation — so it speaks to coexistence among species already distinct and
**not to speciation itself**.

The empirical leg is open. The packing prediction has two halves; the geometric half is confirmed
and the other is not. Whether real orchid richness on a _shared_ euglossine exceeds the 1-D ceiling
needs a number that is not yet in hand — and the figure sitting in our own notes, fifteen sympatric
_Euglossa_, is **bee** richness, a different quantity.

See [`docs/ROADMAP.md`](docs/ROADMAP.md).
