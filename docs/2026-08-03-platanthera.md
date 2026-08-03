# The empirical leg: placement, not size, predicts who interbreeds

**Date:** 2026-08-03 · **Code:** `experiments/platanthera.js`, `tests/platanthera.test.js`
· Roadmap A.

Every result in this project so far has been a fact about the model. This is the first one
that is a fact about the world.

## Why this system and not the one the roadmap named

Roadmap A wanted orchid species per _shared_ euglossine pollinator, to compare against the 1-D
ceiling. That source (Ackerman et al. 2023) was re-verified closed on 2026-08-02 against the
OpenAlex API. The named open-access alternative was Esposito, Merckx & Tyteca 2017 — and it turns
out to test something better than the ceiling. It tests the **founding constraint**.

Two sympatric European orchids share the same noctuid moths. Their pollinaria are glued to the
moth's head, and _where_ follows from how far apart the two viscidia sit on the column:

| morphotype      | viscidia apart | pollinaria land on |
| --------------- | -------------- | ------------------ |
| _P. bifolia_    | 0.2–1.1 mm     | the **proboscis**  |
| intermediates   | 1.3–2.3 mm     | the **cheeks**     |
| _P. chlorantha_ | 2.3–4.9 mm     | the **eyes**       |

Esposito et al. 2017 Table 1 — 11 records over 7 moth individuals, and the separation is perfect:
_bifolia_ proboscis 6/6, _chlorantha_ eyes 3/3, intermediates cheeks 2/2.

## ⚠️ The intermediates are not hybrids, and that is the whole point

The companion paper (Esposito et al. 2018, PeerJ 6:e4256) types these plants with AFLP:

> "plants with intermediate floral morphological traits, could not be genetically separated from
> _P. bifolia_ (full overlap of AFLP's profiles)"

average hybrid index 0.1. They are _P. bifolia_ carrying a wider column.

So **inside one species' own gene pool, a shape trait shifts by half a millimetre and the pollen
lands somewhere else on the animal** — on a part of the head that is nobody's adaptation, just
where the geometry put it. That is `PLACEMENT IS NEVER A GENE` observed in the wild. Nothing
selected a cheek morph; the cheek is where a 1.5 mm separation reaches.

## The test, and why it is not circular

Mapping a separation _d_ to a lateral offset _d_/2 is close to definitional, and a test resting on
that alone could not fail. What is actually tested is that the measured trait **distributions** must
predict the measured **reproductive structure**, for which the AFLP work is an independent answer
key: _bifolia_ + intermediates are one cluster, _chlorantha_ is another, with
"about 17% and 7% of all sampled individuals displayed an admixed gene pool".

And the paper supplies the control for free. It measures **four** floral traits, all of which differ
between the species. Two place the pollinarium, two do not — **declared before the run** and pinned
by a test so a later edit cannot move a trait between arms:

- **placement:** viscidia distance (the attachment coordinate), caudicle length (reach from the anchor)
- **size:** spur length (reward access — it selects _which_ moths feed, not where pollen goes), labellum length (display)

If flower size predicts the genetics as well as placement does, the test says nothing about
placement in particular.

Overlap is the project's own continuous KDE estimator, run on the raw millimetre axis, seed-averaged
over 25 draws of 96 plants per morphotype at each site.

## Result — the primary criterion splits exactly along the declared line

Does the trait separate the two **species**, as the molecular data do? (overlap < 0.1)

| trait                 | Botton bif–chl | Bois Niau bif–chl | separates species? |
| --------------------- | -------------- | ----------------- | ------------------ |
| **viscidia distance** | **1.5e-5**     | **1.8e-62**       | **yes**            |
| **caudicle length**   | **2.4e-13**    | **1.2e-85**       | **yes**            |
| spur length           | 0.663          | 0.295             | no                 |
| labellum length       | 0.574          | 0.524             | no                 |

**The two traits that decide where pollen goes separate the species completely. The two that set
flower size leave them 30–66% overlapping.** Both sites, independently. The test could have come
out otherwise, and on half the traits it does.

## ⚠️ The secondary criterion failed, and it is not re-thresholded

Pre-registered: the trait should leave _bifolia_ and the intermediates **un**separated (overlap

> 0.5), since they are one gene pool. Caudicle length passes (0.524, 0.653). **Viscidia distance
> misses at both sites — 0.397 and 0.230.**

Re-thresholding here would be the exact failure that killed a pre-registered pass elsewhere in my
work: moving a cut after seeing the number flips signs. So the cut stands and the miss is reported.
Two things are true about it:

1. **The criterion is confounded.** The intermediates are a _morphological_ class, picked out by a
   discriminant function on floral traits. Finding them morphologically distinct from _bifolia_ is
   partly built into how they were defined. The primary criterion does not have this problem —
   the species were typed by AFLP, independently of these four measurements.
2. **The number is real, and it matters more than the criterion.** Within one gene pool, placement
   has diverged far enough to move pollen from proboscis to cheek — 60–77% non-overlapping — **and
   no reproductive isolation followed.**

Point 2 bears directly on **roadmap B**. The project has been asking what breaks the symmetry so a
rare placement can invade. Here is a real population where placement diverged substantially inside a
species and produced no isolation at all. Placement divergence looks **necessary but not
sufficient** — consistent with the model's own measurement that hybrids pay 19.1% from placement
mismatch alone, a real cost that is nevertheless not a barrier.

## Part B was underpowered, and is reported rather than dropped

The two sites differ: at Botton the morphotypes sit closer on the viscidia axis (0.96 / 3.61) than at
Bois Niau (0.64 / 3.91), and Botton has more admixture (17% vs 7%). So a placement account predicts
more overlap at Botton — which it gets right. **But so do all four traits, including both size
traits.** With two sites a direction test is nearly powerless: 4/4 correct is what a coin does. It
discriminates nothing and is not counted toward the verdict.

## Part C — a falsifiable prediction about an animal nobody measured here

Viscidia straddle the midline, so separation _d_ attaches at ±*d*/2. For the observed assignment to
hold, the boundaries between the moth's attachment zones must fall between the morphotype
distributions (density crossings, halved):

| site      | proboscis \| gena | gena \| eye |
| --------- | ----------------- | ----------- |
| Botton    | 0.62 mm           | 1.24 mm     |
| Bois Niau | 0.50 mm           | 1.55 mm     |

So: the proboscis zone reaches ~0.5–0.6 mm either side of the midline, **the gena is a narrow band**
out to ~1.2–1.6 mm, and the compound eye begins beyond that — implying a head **at least ~3.1 mm
across the eyes**. That the gena comes out narrow and close in is a real check: it is the correct
anatomy of a noctuid head, and nothing in the calculation knew that.

⬜ **UNTESTED.** I could not source head morphometrics for _Cucullia umbratica_, _Autographa gamma_
or _Noctua pronuba_ — three searches and one publisher timeout — and I will not fit them, because a
constant calibrated from the artefact under test encodes its defect. Stated as a prediction for
whoever has the specimens. Nilsson's constraint that only "a suitable scale- or hairless part of the
head" can take a viscidium is the mechanism that should set these boundaries.

## ⚠️ The metric control found a real defect in the estimator

Running on a millimetre axis is legitimate only if the estimator is scale-free, so that was checked
rather than assumed — and the check failed at the bottom end. `kdeSig` floors its bandwidth at
`1e-4`; below that the kernel is wider than the data and **every distribution looks like every
other one.** At an axis scale of 1e-6 two well-separated samples report **0.997 overlap**.

The direction is what makes it worth recording. A saturating estimator does not announce itself by
returning nonsense — it returns _"these are the same"_, which here would read as **"no reproductive
isolation"** rather than as a broken measurement. That is precisely how the 24-bin histogram this
project replaced used to fail.

No existing result is affected: every other use runs on the body coordinate at scale ~1, and the
smallest SD in this dataset (0.07 mm) is 10⁵× clear of the floor. The run now measures its own
safety margin and prints it, and a test pins both the invariance and the floor, so raising or
removing the floor fails loudly.

## Tests

11 new tests, **103 in the suite** — 85 on master, plus the 7 from PR #17 (sectile), which landed
first and is merged in here. The load-bearing ones are the pair that pin **both** halves of the
scale argument — invariance across six decades, _and_ that saturation below the floor inflates
overlap toward 1 — plus the test that pins the pre-declared trait split, without which the whole
design becomes unfalsifiable.

Five mutants run, all killed: truncation removed from the sampler, the bandwidth floor raised, a
size trait smuggled into the placement arm, a published datum corrupted, and the crossing solver
stubbed to return a midpoint.

## What this does and does not close

**Closes:** the claim is no longer only _"2-D out-packs 1-D in this model."_ In a real system, the
traits that determine placement predict which plants form one gene pool and which do not, and the
traits that determine flower size do not.

**Does not close:** the original roadmap-A question. This is a test of the _mechanism_, not of the
_ceiling_ — nothing here measures how many species a shared pollinator can support. That still needs
orchid species per shared euglossine, and that source is still paywalled.
