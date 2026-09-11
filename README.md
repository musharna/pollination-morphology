# pollination-morphology

A simulation in which **where a flower puts its pollen on an animal is never set — only computed.**
Two orchids can share a pollinator completely and still be unable to pollinate each other, because
one paints its pollen on the bee's back and the other on its belly. Build the flower and the bee out
of shape genes, work out where they touch, and you get mechanical isolation for free — or you find
out it isn't enough, which is mostly what happened here.

**▶ [Play with it](https://musharna.github.io/pollination-morphology/)** — three browser toys, no
install. · **📄 [Read the findings](docs/FINDINGS.md)** — four pre-registered results, most of them
negative, and the corrections they went through.

_Code: MIT. Text and figures: CC-BY-4.0._

---

Most pollination models cannot represent mechanical isolation at all: they score a visit as a match
between traits, so two species with equal match scores must exchange pollen. The field says so in
its own words — Mailly & Lihoreau 2025 note that models "assume random pollen movements", and
Ballantyne 2015 that networks record "visits… rather than clearly defined effective pollination
events."

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
| `population.html`  | a whole community evolving on one shared pollinator                            |
| `greybox.html`     | the two-flowers-one-bee reveal, stripped to its mechanism                      |
| `experiments/`     | the ablation, the pre-v1 checks, v1, the tolerance sweep                       |
| `docs/`            | groundwork, and a write-up per experiment including what went wrong            |
| `docs/FINDINGS.md` | start here — the headline results and what is still open                       |

Open any of the three `.html` files in a browser — no build step, no dependencies. Run
`node --test tests/` for the suite (**363 tests**). Every experiment is
`node experiments/<name>.js`.

## What has been measured

**The 3-D contact model earns its place — and the advantage depends on how many species are in
play.** A free 1-D placement gene, the cheap version of this project, supports 19 coexisting species
on one pollinator where morphology-derived 2-D placement supports 40, at matched precision **and
matched candidate count**. That is **2.1× at a 309-species pool**; give both arms a larger pool and
it settles near **3.1×**, because a 1-D axis runs out of line while a 2-D surface keeps finding room.
The 1-D arm is a steelman: it gets the whole body surface, the same number of candidates, and its
precision drawn from the real pool's own distribution.
[detail](docs/2026-08-02-pool-scaling.md) [metric](docs/2026-08-02-continuous-metric-rebaseline.md)

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
_winning_ — and that was an artefact of how many points the estimator retains, which biases irregular
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
one. That is a stronger claim than Armbruster's own framework makes. It is the one claim here that
has survived three independent re-measurements unchanged, each against its own positive control.
[detail](docs/2026-08-01-pre-v1-checks.md)

**Deception breaks the symmetry that stopped five other mechanisms.** A rare placement is penalised
because it has nobody to exchange pollen with (`rare/common ≈ 0.26`), and pollinator heterogeneity,
flower constancy, larger patches and recombination all failed to lift it. A rewardless flower plus
pollinator avoidance learning does: **4 of 8 morphs cross parity, mean lift 3.18×** over an identical
no-learner arm that never crosses. The property that mattered is that deception acts on the animal's
_motivation_ rather than on who it meets. ⚠️ Negative frequency-dependence is an **output** here, not
an assumption — the field literature is split, so what is built is standard associative learning and
what is measured is whether frequency-dependence emerges. It does, up to 2.01× against a measured
null band of 0.991 ± 0.028, and only when the animal can actually tell the morphs apart.
[detail](docs/2026-08-03-deception.md)

**⚠️ But inside a model that can actually breed, deception splits the _advertisement_ and not the
plant.** Deception's negative frequency-dependence acts on the **signal** axis; the mating system's
positive frequency-dependence acts on **placement**; so the real question was whether the first can
_reach_ the axis the second lives on. It cannot. Deception inflates the advertisement cloud **3.2× free / 3.6× linked**
and moves placement not at all — **and linking the advertisement directly to the anther loci does not
rescue it**, which kills the obvious explanation that free recombination merely separated them.
The mechanism: **negative frequency-dependence maintains a polymorphism, it does not complete a
split** — a rare-morph advantage evaporates the moment the morph is common, so it protects variance
without ever resolving it, and that is precisely what Gigord et al. measured in the field, a colour
polymorphism maintained _within one species_. ⚠️ My own competing hypothesis — that "past parity" was
an artefact of scoring summed transfer instead of realized parentage — was **refuted** by re-scoring
the identical bout: 4 of 8 under both. [detail](docs/2026-08-04-deception-ibm.md)

**⚠️ The advantage is a scaling law, not a multiplier — and one published finding was about the
wrong organ.** Two passes over every file that scored placement found the same bug three times:
arms were compared at different candidate counts, and the packing ceiling depends steeply on that
count. At matched pool sizes the 2-D advantage runs **2.11× at 309 candidates, levelling near 3.1×**,
and the variation across pollinator body plans is ~1.2×, not the ~1.5× published. Separately, "past
~0.15 herkogamy the stigma stops touching the animal" was **inferred from a displayed `0.000` and
never measured** — the stigma contacts 81% of visits there; the real bound acts on the anther.
[scaling](docs/2026-08-02-pool-scaling.md) · [checks](docs/2026-08-03-checks-rebaseline.md)

## What is not claimed

Overlap in the packing results is _placement overlap_, not a measured transfer rate. Carryover,
packaging efficiency and last-male advantage are now built and counted, and the **contrast between
pollen-dispersal units is calibrated** against 228 species — but the **absolute monad delivery level
is not**, running 2.9x generous (7.1% against a measured 2.4%), so magnitudes still should not be
quoted as rates. The evolution loop is adaptive dynamics, not population genetics — no standing variation, no
recombination, no hybridisation — so it speaks to coexistence among species already distinct and
**not to speciation itself**. The IBM (`sim/ibm.js`) is what addresses that, and its standing answer
is negative in both directions: **a rare placement never beats a common one.** Measured directly as
an invasion criterion, per-capita pollen receipt _rises_ with a lineage's own frequency (0.214 at 10%
frequency to 4.654 at 90%, against a flat control), so neither of two lineages can increase when rare.
⚠️ That single fact accounts for both open negatives — no split arises, and two founded lineages
cannot coexist — and it is why lifting the fixed-population-size assumption changed nothing.
[detail](docs/2026-08-04-density-dependence.md)

The frequency dependence has since been pinned to a number: **receipt ratio ≈ (own-frequency
odds)^0.70**, unchanged whether pollination arrives through one animal, two sharing a budget, or two
with a budget each. 0 would be no frequency dependence and 1 pure partner-counting, so it is **mostly
partner-counting** — a property of mate-finding rather than of provisioning. Partners are not a
resource a pollinator can deliver, which is why adding animals or visits cannot help. It also gives a
cheap screen: a candidate mechanism has to move that exponent, measurable in single bouts.
[detail](docs/2026-08-04-limiting-factors.md)

**⚠️ And the reason no mechanism has completed a split: on a continuous axis, preferring the rare is
self-defeating.** Rare-biased visitation — an animal that favours the rarer morph — is the first
mechanism here to invert the invasion criterion, at visits proportional to the square root of
abundance. Real animals reach that: converting Gigord et al. 2001 gives an exponent of −0.24 against
the −0.30 needed. It still fails, and the measured reason is not a leaky barrier — at the exclusion
separation the barrier passes **exactly zero** pollen. It is that the rarest placement in a splitting
population is the **intermediate**, so a preference for rare morphs pours visits onto precisely the
plants that bridge the two lineages; at that separation an intermediate draws **136×** the visits of
an ordinary plant, and it sits where the barrier _is_ leaky. The mechanism builds the conduit that
erases the split it was recruited to protect. This is why deception splits the _advertisement_ and
not the plant: a colour dimorphism is **discrete** and has no intermediate to subsidise, while
placement is continuous. **Discrete versus continuous is what decides whether negative
frequency-dependence completes a split or only maintains a polymorphism.**
[detail](docs/2026-08-04-rare-biased-visits.md)

The empirical leg is half closed. The **mechanism** half now has real-world support: in two
sympatric _Platanthera_ populations, the floral traits that determine where pollen is placed
(viscidia distance, caudicle length) separate the two species completely, while the traits that set
flower size (spur, labellum) leave them 30–66% overlapping — scored against an independent AFLP
answer key. The intermediates there are **not hybrids**, so a shape trait shifting half a millimetre
inside one gene pool moves the pollen onto a different part of the moth's head, which is
`placement is never a gene` observed in the wild.
⚠️ It also showed placement can diverge that far **without producing any isolation**, so placement
divergence is necessary but not sufficient. [detail](docs/2026-08-03-platanthera.md)

The **ceiling** half is still open. Whether real orchid richness on a _shared_ euglossine exceeds the
1-D ceiling needs a number that is not yet in hand — and the figure sitting in our own notes, fifteen
sympatric _Euglossa_, is **bee** richness, a different quantity.

See [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Licence

Two licences, split by file class.

| files | licence |
| ----- | ------- |
| `sim/`, `tools/`, `tests/`, `experiments/**/*.js`, `*.html` | **MIT** — see [`LICENSE`](LICENSE) |
| `docs/**`, `experiments/**/*.md`, figures, and the data tables under `docs/data/` | **CC-BY-4.0** — see [`LICENSE-docs`](LICENSE-docs) |

In short: **code MIT, text and figures CC-BY-4.0.** © 2026 Jaret Arnold.

Nothing in this repository is third-party — verified by file listing rather than asserted;
the method and the one externally deposited dataset that is *cited but not copied* are in
[`docs/THIRD-PARTY.md`](docs/THIRD-PARTY.md). Citation metadata is in
[`CITATION.cff`](CITATION.cff).
