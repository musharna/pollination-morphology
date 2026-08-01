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
suite (30 tests). Every experiment is `node experiments/<name>.js`.

## What has been measured

**The 3-D contact model earns its place.** A free 1-D placement gene — the cheap version of this
project — supports 9 coexisting species on one pollinator where morphology-derived 2-D placement
supports 30, at matched precision, with both pools saturated. Confound-audited: the packer does
select roll-tight species, but re-running the 1-D arm at that exact precision does not move it,
because roll precision is worth nothing to an arm with no roll to spend.
[detail](docs/2026-08-01-ablation-result.md)

**Blind selection captures most of that.** An evolving community reaches ~64% of the achievable
ceiling, and the 2-D advantage survives almost intact — 2.7× under evolution against the
optimiser's 2.8×. [detail](docs/2026-08-01-v1-result.md)

**Precision is a modifier, not a niche axis.** Species differing only in how repeatable their
placement is cannot coexist at any realistic threshold — a tight distribution nests inside a broad
one. That is a stronger claim than Armbruster's own framework makes.
[detail](docs/2026-08-01-pre-v1-checks.md)

## What is not claimed

Overlap here is _placement overlap_, not a measured transfer rate: carryover across visits,
packaging efficiency and last-male advantage are all enumerated and all still out of the model. The
evolution loop is adaptive dynamics, not population genetics — no standing variation, no
recombination, no hybridisation — so it speaks to coexistence among species already distinct and
**not to speciation itself**.

The empirical leg is open. The packing prediction has two halves; the geometric half is confirmed
and the other is not. Whether real orchid richness on a _shared_ euglossine exceeds the 1-D ceiling
needs a number that is not yet in hand — and the figure sitting in our own notes, fifteen sympatric
_Euglossa_, is **bee** richness, a different quantity.

See [`docs/ROADMAP.md`](docs/ROADMAP.md).
