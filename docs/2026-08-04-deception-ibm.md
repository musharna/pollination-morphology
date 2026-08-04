# Deception splits the advertisement and not the plant (roadmap B)

**Date:** 2026-08-04 · **Code:** `sim/ibm.js`, `experiments/deception-ibm.js`,
`experiments/deception-parity.js`, `tests/deception-ibm.test.js`

Six mechanisms were scored against roadmap B's barrier using a proxy, `rare/common ~ 0.26`. Five did
nothing. Deception was the only one to push a rare placement past parity, because it is the only one
that changes whether the animal **wants to be there** rather than merely who it meets. Then the IBM
replaced the proxy with real inheritance and found that placement-mediated mating is positively
frequency-dependent — it _erased_ an imposed bimodality rather than failing to create one.

So the two results point opposite ways, and this is the collision.

> Deception supplies **negative** frequency-dependence — being rare pays.
> The mating system supplies **positive** frequency-dependence — being rare costs.

## ⚠️ They do not act on the same axis, and that is the whole question

Deception acts on the **advertisement**: what the animal has learned about a signal. The mating
system acts on **placement**: where pollen physically lands. A rare signal is rewarded; a rare
placement is punished. So the question was never "is deception strong enough" — it was whether the
negative frequency-dependence can **reach the axis the positive frequency-dependence lives on**.

That framing is what made the experiment decisive rather than another arm on a pile, because it names
a specific reason the mechanism might fail — free recombination separating a signal allele from an
anther allele in one generation — and that reason is **testable by linking them**.

### The advertisement is allowed to be a gene; placement still is not

Placement is not a gene because it is not a trait — it is where a particular animal's body touches a
particular flower, an _outcome_ of two geometries meeting. A signal is the opposite: colour and scent
are floral traits with known genetics, and in the system where rare-morph advantage was actually
measured — _Dactylorhiza sambucina_ — the polymorphism **is** a heritable colour morph. So `signal`
is inherited, and two invariants keep it away from the geometry:

1. **`shapeOf` strips it** before anything becomes a flower, so it can never reach the contact model.
2. **It draws from its own random stream.** A shared stream would mean that switching deception on
   silently re-rolled every shape mutation, so an arm with the mechanism and an arm without would
   differ in two things at once — the exact flaw `runBout`'s unconditional reward draw already exists
   to avoid. Verified bit-identical against the pre-advertisement model across 66 fields.

## The anchor gate

**1. The published IBM still reproduces exactly** — placement-mated 2.58, random-mating 2.21, both
matching 2026-08-03 to the digit. That is what proves invariant 2 held.

**2. ⚠️ Deception is LIVE at this operating point.** The 3.18× was measured at N = 24 in a single
bout with its own site draws; nothing guaranteed it survived at N = 30, siteN = 160, 24000 visits,
inside `step()`. **An arm where the mechanism is quietly inert returns "no split", which is
indistinguishable from a real negative and reads as the hypothesis surviving.**

```
  signal gap   with learning   NO LEARNER (must be 1.000)
        0.00           1.000                      1.000
        0.05           1.353                      1.000
        0.10           2.415                      1.000
        0.20           3.929                      1.000
        0.35           3.953                      1.000
```

A rare advertiser gains up to **3.95×**. The control is **exact rather than statistical**, which is
stronger than anything the earlier deception work could manage: with no learner the signal is never
read, so the deviant and matched arms are bit-identical bouts and the ratio _must_ be 1.000. One
control therefore proves both that deception works and that the advertisement cannot reach the
geometry.

**3. With mutation off the placement cloud still contracts**, 2.9× [4.3, 6.9, 2.2, 1.8, 1.1, 1.0].

## ⚠️ First, a hypothesis of my own — refuted

The IBM's anchor gate had already caught one statistic-choice error in my own work: scoring by pollen
_received_ read +0.149 (disruptive) where realized parentage reads −0.842. The "first of six
mechanisms past parity" claim was scored by **summed transfer**, which is a raw sum where parentage
is a **normalised share per mother** — so a rare morph delivering pollen to mothers already saturated
by the common morph can score high on one and near-zero on the other. That was a live and rather
deflating explanation for everything below.

It is wrong. Re-scored from the _identical_ bout (`experiments/deception-parity.js`):

```
  past parity by summed TRANSFER   : 4 of 8   (mean 1.132)
  past parity by realized PARENTAGE: 4 of 8   (mean 1.040)
```

Gated by a positive control, because two statistics that never disagree would make a disagreement
unreadable: identical morphs score 1.000 / 0.996, and a rarer _advertisement_ gains under both
(2.013 / 2.025). Parentage is systematically a little harsher, but **the published claim stands** —
so the negative below is about what happens across generations, not about a bad measurement.

## The result

```
  arm                                  PLACEMENT tail  spread     SIGNAL tail  spread
  no learner at all                      2.17 +/-0.29    1.14       3.60 +/-0.17   0.05
  learner on, all plants HONEST          2.17 +/-0.28    1.07       3.36 +/-0.10   0.05
  learner on, all plants CHEAT           2.36 +/-0.25    0.99       4.12 +/-0.21   0.18
  random mating (null)                   2.28 +/-0.31    1.79       3.64 +/-0.34   0.05

  linked, all plants HONEST              2.11 +/-0.14    1.07       3.60 +/-0.21   0.05
  linked, all plants CHEAT               2.17 +/-0.22    1.32       3.84 +/-0.37   0.20
```

**Deception inflates the advertisement cloud 3.2× free and 3.6× linked** — spread 0.055 → 0.175 and
0.054 → 0.196 — while every control sits near 0.05. **It does not move placement at all**: 2.36 and
2.17 against a random-mating band of 2.90 (null 2.28 ± 0.31).

> ⚠️ **Those ratios were wrong in the first version of this document, and the error is instructive.**
> I reported 3.6× and 4.0× by dividing the **printed two-decimal** spreads (0.18 / 0.05). With a
> denominator near 0.05, rounding the inputs moves the quotient by ~12%. The full-precision values
> give 3.2× and 3.6×. A derived quantity must never be recomputed from a display value — so the
> column now prints three decimals and the experiment computes the ratio itself.

**And linking does not rescue it.** That is the discriminator the supergene arm existed for, and it
kills the most attractive explanation: the failure is _not_ that free recombination separated the
advertisement from the anther loci. Even co-segregating with them, deception moves one axis and not
the other.

Three levels isolate the mechanism from its own machinery — no learner, learner with every plant
honest, learner with every plant cheating — and the honest arm is indistinguishable from no learner
at all, so none of this is the learning code path.

### It does not depend on the one unanchored parameter

The advertisement's mutation rate is the only quantity here with no measured value behind it, so it
was swept rather than picked. Across a 7.5× range the placement answer does not move:

```
  signalMut   free: PLACEMENT   SIGNAL      linked: PLACEMENT   SIGNAL
       0.02        2.36          4.12              2.17          3.84
       0.06        2.23          4.17              2.31          4.19
       0.15        2.02          4.13              2.18          4.12
```

Every placement number is far below the 2.90 band, and the trend if anything runs the wrong way for
divergence. The signal tails are stable at ~4.1.

### ⚠️ A correction to my own verdict logic

The first version scored the **linked** cheating arm against the **unlinked** honest band. That is
the wrong comparison and it flattered the result: linkage changes how alleles travel, so the linked
arm has its own honest control and that control's band (4.02) is the one it must clear — not the free
arm's (3.56). Against the correct band, the linked arm's signal bimodality at the default mutation
rate is **marginal rather than a split**. The placement conclusion is untouched, but the difference
between reporting an effect and reporting the control you happened to compare it to is exactly the
kind of thing this project keeps catching, so the code was fixed and the run regenerated rather than
the numbers reinterpreted in prose.

## What it means

**Negative frequency-dependence maintains a polymorphism. It does not complete a split.**

That is not a restatement of the negative, it is the mechanism, and the numbers separate the two
claims: the advertisement's **spread** inflates ~4× reliably, but its **bimodality** clears the
honest control only marginally in the free arm (4.12 vs 3.56) and not at all in the linked one (3.84
vs 4.02). Deception generates and protects variance without ever resolving it into two discrete
morphs — which is exactly what a rare-morph advantage _must_ do, because the moment a morph becomes
common its advantage evaporates. A protected polymorphism is the opposite of a completed split.

**This is what the field actually reports.** Gigord et al. 2001 measured rare-morph advantage in
_D. sambucina_ as the maintenance of a colour polymorphism **within one species** — not as
speciation. The model reproduces the maintenance result and declines to produce the one nobody
observed.

And it converges with the empirical leg from a completely different direction: in sympatric
_Platanthera_, the traits that determine placement separate the species completely while size traits
do not — yet the two remain a single interbreeding gene pool. Placement divergence is **necessary and
not sufficient**, measured there in the field and here in a model that breeds.

**Seven mechanisms now, and the sharper statement is not "they failed" but that two of them broke a
real symmetry on an axis that is not the one reproductive isolation lives on.**

## What this does not establish

That no mechanism can split a population. N = 30 over 35 generations is small and drift is loud at
that size — the mutation-off collapse ranges 1.0–6.9× across seeds, and two of six seeds barely
contract at all — so this bounds the effect rather than proving impossibility. The learning
parameters are the ones the earlier experiment measured a rare-morph advantage under and were
deliberately **not** re-tuned here; re-tuning them against this harness would be calibrating a
constant from the artifact under test.

## Tests

13 new tests. The load-bearing pair are the invariants: two individuals differing **only** in
advertisement must produce byte-identical placements, and the shape dynamics must be bit-identical to
the model that existed before the advertisement did.

⚠️ **The second of those exists because a mutant survived.** The test I wrote first compared two
advertisement mutation _rates_ — and it cannot catch signal mutation being drawn from the shape
stream, because that draw happens the same number of times at either rate, so both arms shift
together, match each other perfectly, and are both wrong. Changing `gauss(srng)` to `gauss(rng)`
passed it. The invariant that matters is not "the rate does not matter" but "the advertisement
changed nothing about the model that existed before it", and that needs an **external** reference:
the golden values come from commit `63c4cb5`, not from the code under test. Seven mutants were
injected in total; the surviving one was the coverage report.
