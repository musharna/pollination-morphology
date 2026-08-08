# The wasp-waist premise, checked before building on it — 2026-08-07

**The roadmap justified a constricted body plan with _"Apocrita are named for the
wasp waist"_. That sentence is true and it does not license the plan that was
built. The orchid-pollinating wasps this project actually models — Thynninae —
are reported to LACK an elongated petiole.**

No experiment was run. This is the pre-registration step catching its own
premise, which is the only stage where that is cheap.

## What the premise had to carry

The reachability probe found all four bee plans CONNECTED, so a discrete
placement axis became a modelling choice rather than a measurement. The stated
honest form was: _fix the constriction from published wasp morphometry, treat the
reachability gap as a prediction, and only then ask whether exclusion changes._

That makes one number load-bearing — the waist radius — and it has to come from
the animal being modelled, not from a family-level slogan.

## The distinction the premise skipped

Both of these are true, and only the first one is universal:

1. **Every apocritan has a constriction.** The propodeal–metasomal articulation
   is the defining apomorphy of Apocrita. This is what "wasp waist" names.
2. **An ELONGATED, thread-like petiole is a family-level character.** Sphecidae
   are literally "thread-waisted wasps". Thynninae are not.

The `PINCHED` positive control is a waist of **r = 0.02** against neighbouring
radii of ~0.42 — roughly a **20:1 pinch**, sustained across s 0.16–0.42. That is
a thread-waist caricature. Premise (1) licenses a modest constriction; only
premise (2) licenses the pinch, and premise (2) does not hold for the pollinator.

So the sentence in the roadmap generalised from the name of the suborder to the
geometry of one family, and the taxon in the middle — the actual pollinator —
was never checked.

## What I could and could not source

⚠️ **I could not source a published waist measurement for any flower-visiting
wasp.** Searched: this repo (nothing), four web searches, OpenAlex (0 hits for
petiole allometry), and the full text of two candidate measurement papers.

- Tschinkel 2013, _The Morphometry of Solenopsis Fire Ants_, PLoS ONE
  `10.1371/journal.pone.0079559` — 24 body parts, but petiole **height and
  length** only, no width, and reported as regression slopes; the raw mm values
  sit in an appendix I did not retrieve.
- Nalepa et al. 2018, _Cerceris fumipennis_, Insects `10.3390/insects9030086` —
  measures **head width only** (4.22–5.09 mm at one site) and states explicitly
  that body length, thorax width and petiole are not measured.

⚠️ Both DOIs above were verified against the articles themselves, and the second
one caught a **ghost citation of my own**: I had written `10.1093/jisesa/iey083`
for the _Cerceris_ paper, pattern-matched from the journal I assumed rather than
read. It is in _Insects_, not the _Journal of Insect Science_. The habit that
caught it is checking every DOI before the doc leaves my hands, not after.

⚠️ **The Thynninae claim is naturalist-sourced, not taxonomic.** It comes from
field references stating plainly that "Thynninae do not have an elongated
petiole", corroborated across two of them. The authority is Brown's revision of
the Australian Thynnidae (Zootaxa `zootaxa.5681.1.1`, 817 species), which I have
**not** accessed. Treat this as strong enough to stop a build, not strong enough
to publish.

⚠️ This project has hit the same wall before: `2026-08-03-platanthera.md:127`
records failing to source head morphometrics for the moth pair. Insect body
morphometry in the form this model needs — a radius profile along the body — is
not what taxonomy publishes.

## What follows for the discrete-axis question

**Do not add the constricted plan as a way to make the placement axis discrete.**
Not because it would fail, but because it would answer a question about
Sphecidae and be read as an answer about the orchid system. The exclusion result
is about sexually deceptive orchids and their thynnine pollinators; a
thread-waisted plan is the wrong animal, and tuning its waist until exclusion
moves is the per-lineage quota wearing morphology.

Three things would each unblock it, in descending order of what they'd be worth:

1. **A waist measurement for a thynnine** from the Zootaxa revision. If the
   constriction is modest, the honest prediction is that the axis stays
   CONNECTED — a real prediction that can fail, and the one worth making.
2. **A radius profile from a micro-CT specimen** of any flower-visiting
   apocritan. This is the data type the model wants and taxonomy does not
   publish; segmentation pipelines for it exist (`10.1002/ntls.20230010`).
3. **Re-scope explicitly to Sphecidae** — thread-waisted wasps do visit flowers
   for nectar — and drop the orchid framing from any result that comes out.

⚠️ What is NOT established: that a thynnine waist leaves the axis connected. I
have no measurement either way. The claim here is only that the premise as
written does not support the plan as built.
