# Roadmap

**Canonical.** If another document disagrees about what comes next, this one wins.
Last updated 2026-08-07.

## Where this stands

Seven things are built and measured, in this order, each gating the next:

1. **The contact model** (`sim/placement.js`) — placement computed from shape, never set. 12 tests,
   three load-bearing mechanisms mutation-verified.
2. **The reveal** (`visit.html`) — one bee, two flowers, pollen loaded and not delivered. The first
   attempt failed on a user's read (_"feels more like the number on a chart changing"_); rebuilt as
   an event in time with a rigid animal, and it now lands.
   ⚠️⚠️ **RESTATED 2026-08-02 — the advantage is CONDITIONAL ON PRECISION, and the whole project is now measured on a CONTINUOUS metric.** The L1 control had been handicapped with a FIXED MEDIAN precision while L2 inherits precision from morphology; making L1's precision heritable and bounded by real morphologies collapsed the evolved advantage. The 24-bin histogram that scored placement SATURATES below one bin width, so it was replaced throughout `sim/` — in the evolution loop as well as the ablation, since L1 evolves to a precision 7× finer than a bin. TWO symmetric comparisons: **2.5× with neither arm precision-selected, and a TIE (0.92×, converged) with both**. The 2-D advantage is a fact about PRECISION as much as dimensionality — a second axis multiplies slots only while placement is imprecise. [detail](2026-08-02-continuous-metric-rebaseline.md) [decision](2026-08-02-l1-precision-decision.md)

3. **The ablation** — 2-D placement out-packs a precision-matched 1-D gene **2.1× at the 309-species
   pool it samples** (40 vs 19 at τ=0.2), rising to **~3.1× once both arms get a large enough
   candidate set**. ⚠️ The ratio is NOT a constant and the arms had never been given the SAME NUMBER
   OF CANDIDATES — 234 vs 309 vs 3760 — so every earlier figure was two points on two different
   curves. Quote the pool size with the ratio. This was the delete-the-grid test; it passed, which is
   the only reason v1 exists. [detail](2026-08-02-pool-scaling.md)
4. **v1, the evolution loop** — blind selection reaches **40%** of the achievable ceiling, and with
   both arms precision-selected the 2-D advantage is **0.92× — a tie**, stable from KDE_M 96 to 192.
   ⚠️ At the estimator's old resolution this read 0.84×, i.e. the 1-D control WINNING; that was an
   artefact of retained sample size, which biases irregular and gaussian clouds in OPPOSITE
   directions. [detail](2026-08-02-continuous-metric-rebaseline.md)
5. **The head cap** (item D below) — the coordinate edge is gone, and fixing it exposed a broken
   control. Both headline figures above are post-correction.
   [detail](2026-08-01-head-cap-result.md)
6. **Four mechanism classes** on the item-C table — carryover, reward currency, the cost of
   prolonged presentation, and pollen packaging. Castellanos et al. 2006 reproduces **4 of 4**, though
   that last cell turned out to be half missing biology and half my own carry-cap artefact.
   [detail](2026-08-02-presentation-cost-result.md)
7. **Roadmap B, six steps** — the premise verified, then four mechanism tests of which three are clean
   negatives and spatial structure a partial positive. [detail](2026-08-02-spatial.md)
   ⚠️⚠️ **THAT PARTIAL POSITIVE DID NOT SURVIVE THE MODEL THAT CAN SPECIATE.** 0.247 → 0.950 was
   measured in the v1 harness, which has no inheritance, no recombination and no hybrids. Re-run in
   the IBM: HELD 0 of 38 in every cell, and retained ancestry variance FALLS. The two results do not
   contradict each other — they show the v1 proxy did not predict the IBM, which is the reason the
   IBM exists. [detail](2026-08-25-spatial-ibm.md)
8. **A positive that survives its controls, 2026-08-25** — temporal assortment reaches placement,
   +0.289 [0.158, 0.447] under free recombination, with the supergene shown inert and the pool-size
   confound excluded by measurement. ⚠️ It does NOT answer the northstar at `:219`: a narrow season
   is imposed, not derived. [detail](2026-08-25-phenology.md)
   ⚠️ Scope condition measured 2026-08-25: it holds where the windows are effectively DISJOINT.
   Same cell at `S=32`, where width 0.12 spans ~4 slices, gives HELD 0.083 against 0.417 at `S=8`.
9. 🛑 **AND THE NARROW SEASON CANNOT BE DERIVED — it is selected AGAINST, 2026-08-25.** With width
   a heritable per-plant locus it evolves WIDE, +0.422 [0.292, 0.551] over the shuffled control at
   `S=8` and the same at 16 and 32, with S-invariance PASSING so the slice grid is not responsible.
   Cause measured rather than inferred: **flowering longer is free in this model** — the visit draw
   is renormalised over the plants present in a slice, so skipping one forgoes it and attending one
   costs nothing. The route through time is closed; what is missing is a COST OF DURATION.
   [detail](2026-08-25-evolving-width-result.md)
   ⚠️⚠️ **THAT CAUSE IS WRONG, AND NOTHING WAS MISSING — SOMETHING WAS BEING CREATED (2026-08-28).**
   A plant's display share was re-offered whole in every slice it was in flower, so flowering all
   season **manufactured `S` times** the floral display of flowering once. Duplication predicts the
   wide/narrow flow ratio equals **exactly `S`**, and it measures **8.26 at `S=8`, 16.52 at `S=16`**;
   a missing cost predicts nothing about `S`. Conserving the display — **which costs no parameter** —
   collapses it to **1.698 / 2.707**, so **four fifths of that gradient was manufacture**. The
   direction survives, the explanation does not, and a COST OF DURATION was never the remedy.
   [detail](2026-08-28-conserved-display.md)
   ✅ **RUN AT FULL SCALE 2026-08-31 (#50, job 3572): the direction SURVIVES conservation and the
   magnitude is roughly HALVED.** Treatment − shuffled **+0.422 → +0.291**, **+0.445 → +0.084**,
   **+0.444 → +0.233** at `S =` 8/16/32; clear of zero at 8 and 32, not at 16, and the three
   intervals overlap so `S=16` is not a finding. **The narrow season still cannot be derived**, but
   the manufacture is no longer why. ⚠️⚠️ The run's own control also **falsified P3**: the no-op is a
   property of **OCCUPANCY, not width** — nothing published moves (every fixed-width site is `S=8`),
   but #37 is protected by its parameters rather than by the principle.
   [detail](2026-08-31-evolving-width-conserved.md)
   ✅ **AND THE REMAINING CAUSE IS NOW SPLIT THREE WAYS, 2026-09-01 (#51, job 3606).** Ablating the
   empty-time premium — the same total visits apportioned by the display each slice carries — drops
   the gradient **1.698 → 1.368** (`S=8`) and **2.707 → 1.814** (`S=16`), i.e. **empty time is about
   40% of it, geitonogamy about 40%, and a named-but-unmodelled higher-order term about 19%.** The
   decisive check was VISITS, which are blind to geitonogamy: the derived premium `(29+S)/30`
   predicted the measured 1.2494 / 1.5031 to within 1.3% / 0.2%, and the ablation collapses it to
   1.008 / 1.005. 🛑 **So the northstar's answer does not move — narrow flowering still does not
   arise on its own — and its cause has now been corrected three times without ever reversing.**
   [detail](2026-09-01-empty-time.md)

## Next

### A. Close the empirical leg — 🟡 mechanism leg CLOSED 2026-08-03; ceiling leg UNBLOCKED and MEASURED 2026-08-28, and it does NOT clear the bar

⚠️⚠️ **THE CEILING LEG WAS NEVER BLOCKED ON WHAT THIS SECTION SAYS IT WAS (2026-08-28).** The paper
is still closed — re-verified against OpenAlex today, `is_oa: false`, `oa_status: "closed"`, no
repository full text — so that half of the record was accurate. **But the leg needs the DATABASE the
paper introduces, not the paper, and that database is openly deposited under CC-BY-4.0**
(Zenodo `10.5281/zenodo.7263689`, 2872 species). This section checked whether the ARTICLE was
readable when the requirement was a DATASET — a different object, its own deposit, its own licence —
and re-confirmed the null several times without ever pointing the search at the thing required.
**Measured: 88 euglossine bee species, 50.0% recorded on more than one orchid.** Range-wide maximum
**35** orchid species on _Eulaema cingulata_ — but a bee's geographic range is not a community, and
the model's ceiling is a LOCAL packing limit, so that number is a category error against it.
🛑 **Restricted to one named region the maximum is 14** (_Euglossa viridissima_, Mex) against the
precision-matched **1-D arm's 19** at τ = 0.2 and the 309-species pool. **14 < 19: the bar at `:88`
is NOT cleared, and the claim does NOT get upgraded** — this project still says "2-D out-packs 1-D in
this model" and still cannot say "real richness exceeds what 1-D placement supports."
⚠️ A BOUND, NOT A REFUTATION: literature compilation UNDER-counts sharing, a region OVER-counts
sympatry, the two biases run opposite ways, neither is quantified — and per `:17` the comparator
itself is pool-dependent, so 19 is one point on a curve. What would settle it is a single-site
census; the deposit carries `region`, not site-level co-occurrence. That is a data requirement rather
than a paywall. [detail](2026-08-28-euglossine-ceiling.md)

The packing prediction has two halves and only the geometric one is closed. Needed: **orchid species
per _shared_ euglossine pollinator**, to compare against the 1-D ceiling. The figure in the
enumeration doc — fifteen sympatric _Euglossa_ — is **bee** richness and must not be reused.
Named source: Ackerman, Phillips, Tremblay, Karremans & Reiter 2023, `10.1093/botlinnean/boac082` —
global orchid reproductive-biology database, >2900 species, pollinator identity tabulated.

⚠️ **Re-probed 2026-08-02 and it IS genuinely closed** — verified against the OpenAlex API
(`is_oa: false`, `oa_status: closed`, no OA URL), not assumed. Worth having checked: the same roadmap
recorded Johnson & Harder 2023 as a gate to work toward and that one turned out to be open access.
Three further searches for orchid-species-per-shared-euglossine found no open source carrying the
number.

Two things the probe did yield. The abstract gives **median 1 pollinator species per orchid** — the
extreme specificity mechanical isolation predicts, though it is the orchid→pollinator direction and
not the richness figure needed here. And an alternative empirical route exists that is open access
and tests the MECHANISM rather than the ceiling: Esposito, Merckx & Tyteca 2017
(`10.15517/lank.v17i3.31576`, diamond OA) identify which moth species carried pollinaria and of which
orchid species, for sympatric _Platanthera bifolia_ and _P. chlorantha_ — the textbook
pollinaria-on-proboscis vs pollinaria-on-eyes pair.

Until this lands the claim is _"2-D out-packs 1-D in this model"_, **not** _"real richness exceeds
what 1-D placement supports."_ Only the second is about the world.

✅ **THE MECHANISM LEG IS CLOSED 2026-08-03 — the first result in this project that is a fact about
the world rather than about the model.** The Esposito route above turned out to test something better
than the ceiling: it tests the **founding constraint**. The companion paper (Esposito et al. 2018,
PeerJ 6:e4256) types these plants with AFLP and the intermediates are **NOT hybrids** — "could not be
genetically separated from _P. bifolia_ (full overlap of AFLP's profiles)", hybrid index 0.1. So
inside ONE gene pool a shape trait shifts half a millimetre and the pollen lands somewhere else on
the animal, on a cheek that is nobody's adaptation. That is `placement is never a gene` in the wild.

The paper measures **four** floral traits and so supplies its own control. Split declared before the
run — placement (viscidia distance, caudicle length) vs size (spur length, labellum length) — and
scored against an independent molecular answer key. **Only the placement traits separate the two
species** (bif–chl overlap 1.5e-5 and 2.4e-13) ; the size traits leave them **30–66% overlapping**.
Both sympatric sites, independently.

⚠️ **The secondary criterion FAILED and was not re-thresholded.** Viscidia distance misses the
pre-registered bifolia–intermediate cut (0.397, 0.230 vs 0.5). The criterion is confounded — the
intermediates were _defined_ morphologically — but the number is real and points at **B**: placement
diverged this far **inside one gene pool with no isolation following**, so placement divergence is
necessary but not sufficient. ⚠️ The cross-site gradient arm (17% vs 7% admixture) is **uninformative**
— all four traits get the direction right, which is what a coin does with two sites.
⚠️ **The metric control found a real defect**: below the `1e-4` bandwidth floor the KDE estimator
reports **0.997 overlap for well-separated samples** — it saturates toward "these are the same",
which here would read as "no isolation". No existing result is affected (all run at scale ~1;
smallest real SD is 10⁵× clear) and a test now pins both the invariance and the floor.
⬜ Still open at the time this was written: the **ceiling** half. Nothing in the Platanthera route
measures how many species a shared pollinator supports. [detail](2026-08-03-platanthera.md)
⚠️ **"Needing the paywalled source" was wrong — see the head of this section.** The number came out
of the open CC-BY database the paywalled paper introduces, and the answer is **14 in one region
against the 1-D arm's 19**: measured, and NOT clearing the bar.

### B. Speciation, which v1 explicitly cannot address — ✅ ORIGIN **and** MAINTENANCE both fail, and the two are ONE PROBLEM (2026-08-04); fusion vs exclusion SEPARATED (2026-08-07), but exclusion is only preventable by IMPOSING a minority subsidy

⚠️⚠️ **THE UNIFYING RESULT (2026-08-04, density dependence).** Origin and maintenance both need the
same thing — **a rare placement doing better than a common one** — and the invasion criterion says
this model has the opposite sign at every frequency tested (0.214 → 4.654 across f = 0.1…0.9, flat
control). So the coexistence gap is not a second problem to solve after the speciation barrier: it is
the speciation barrier seen from the far side, and neither demography nor pollinator number can close
it. What would: **negative** frequency dependence on placement, or a genuinely second limiting factor.

⚠️⚠️ **AND A SECOND LIMITING FACTOR IS NOT AVAILABLE BY THE POLLINATOR ROUTE (2026-08-04, limiting
factors).** The two-pollinator run's own control — SPLIT the visit budget — keeps ONE limiting factor,
so its negative was partly built in. Tested with **INDEPENDENT budgets** (two factors, 2× visits)
against a **ONE-ANIMAL DOUBLE-BUDGET** arm at the SAME volume. Delivered pollen genuinely doubles
(51,985 → 103,738, measured) and absolute per-capita receipt doubles with it — **but the RATIO between
lineages is unchanged to within a percent at every frequency**, log-slope 3.46 / 3.42 / 3.41. All four
arms lose a lineage 5/5; the null fuses.
⚠️⚠️ **THE EXPONENT IS THE QUOTABLE NUMBER: receipt ratio ≈ (own-frequency odds)^0.70**, identical
across all three service regimes (0.72/0.70, 0.70/0.70, 0.70/0.71). 0 = no frequency dependence,
1 = pure partner-counting — so it is **mostly partner-counting**, softened by carryover. That is a
property of MATE-FINDING, not of provisioning: **partners are not a resource a pollinator can
deliver**, so a second limiting factor cannot be manufactured by adding animals or visits.
✅ **The bar is now QUANTITATIVE and CHEAP:** a candidate mechanism must move the 0.70 exponent, and
the exponent is measurable in single bouts — screen mechanisms there before spending 35 generations.
What would move it is **rare-biased visit allocation**, which is what deception was recruited to
supply and it acted on the advertisement axis instead. **RUN 2026-08-04 — see immediately below.**

⚠️⚠️ **RARE-BIASED VISITATION IS SELF-DEFEATING ON A CONTINUOUS TRAIT AXIS (2026-08-04).** The
textbook route to negative frequency dependence, and the last mechanism that could plausibly overturn
the exclusion result. `allocExponent: a` gives a morph of frequency f a share `f^a` of the visits;
a = 1 is visits-proportional-to-abundance and every earlier result is bit-identical under it. ⚠️ Rarity
is read off the population's own **placement cloud, NEVER off `anc`** — ancestry is bookkeeping the
pollinator cannot perceive, so biasing on it would be the same mistake as making placement a gene.
**The criterion inverts at a ≤ 0.5** and a = 1 independently reproduces the published 0.70 (0.663) —
⚠️ but the no-placement-difference **control swings just as hard**, so the statistic is real − control,
and the analytic identities (control `= odds^(a-1)`, real `= odds^(2a-1)`) make the mate-finding gap
**exactly a**. It shrinks 0.670 → 0.092 and never reaches zero: rare-bias **subsidises** the rare
type, it does not **repair** mate-finding.
⚠️ **The bar IS met in nature, against my prior expectation** — Gigord et al. 2001 converts to
**a ≈ 0.43**; rewarding systems go the other way (Smithson & Macnair 1997), so **deception is the only
route to a < 1**. The calibrated value nonetheless fails dynamically (0/10); a = 0.25 works
(6/29 vs 0/34, p = 0.0070, clean dose–response) but is **twice the measured bias**, and a = 0.30
(p = 0.0414) does not survive Bonferroni.
⚠️⚠️ **THE MECHANISM, AND IT IS SELF-DEFEATING.** At d = 8 the barrier leaks **exactly zero**, yet
strong bias still FUSES the clusters. Weighting by `dens^(a-1)` means the lowest-density placement is
the **GAP BETWEEN the two clusters**, so a preference for rare morphs pours visits onto the
intermediates that bridge them — **136×** — and those intermediates sit at d/2 where the barrier IS
leaky (m = 0.083). **That is why deception splits the ADVERTISEMENT** — a discrete colour dimorphism,
with no intermediate to subsidise — **rather than the plant.** Discrete-vs-continuous is what this
adds. [detail](2026-08-04-rare-biased-visits.md)

✅ **AND THE INTERMEDIATE IS REAL, NOT JUST A WEIGHT ON PAPER (2026-08-05).** ⚠️ The 136× above was
the weight an intermediate _would_ receive — computed by dropping a hypothetical plant at the midpoint
of a FOUNDING population. Nothing had observed one appearing. Traced the model's own generation loop
(`run({trace:true})`, opt-in, bit-identical when off) and scored occupancy of the gap against the
**founding** geometry.
⚠️ **The reference points must be FIXED at founding**: re-deriving "the gap" from the current cloud
drifts with the merging clusters and would report an empty gap forever — the statistic would confirm
the hypothesis it exists to test.
**In 11 of 12 FUSED replicates the gap filled BEFORE ancestry variance halved** (sign test one-sided
**p = 0.0032**, median lead 3 generations, 40 seeds). ⚠️⚠️ **And the causal arm is the symmetric one
I nearly did not run: the gap fills ONLY under rare-bias** — mean occupancy 0.107/0.143 at a = 0.25/0.50
against **0.024/0.028/0.006** at a = 1/1.5/2, where the intermediate is the rarest placement and gets
starved. a = 1 independently reproduces the exclusion result 12/12. Had occupancy been the same at
a ≥ 1, the subsidy would have explained nothing.
⚠️⚠️ **MY OWN PRE-REGISTERED CRITERION FOR "BRIDGE VS MERGE" WAS UNSATISFIABLE** — it required both
cores to stay occupied while the gap fills, which at FIXED POPULATION SIZE cannot happen, since the
gap can only fill by draining the cores. Rewritten to read the END STATE (a merge leaves cores < 0.1;
the fused runs keep ~38%), so the bridge conclusion is **post hoc and needs a pre-registered re-run**.
⚠️ **Gap-filling is NOT sufficient for fusion** — several `one lost` replicates peak at 0.43–0.67.
What decides fusion vs exclusion is not identified — ✅ **IDENTIFIED 2026-08-07, below.** ⚠️ Peak gap declines monotonically in a but
**mean gap does not** (0.024 → 0.028 → 0.006). [detail](2026-08-05-gap-occupancy.md)
⚠️ A surviving mutant caught two worthless tests: they measured delivered pollen with a helper that
REIMPLEMENTED the budget rule, so a `step()` that ignored the flag left them green. **A test that
recomputes the behaviour under test is testing the recomputation.**
[detail](2026-08-04-limiting-factors.md)

✅ **WHAT DECIDES FUSION VS EXCLUSION IS NOW IDENTIFIED, AND THE TWO ARE DIFFERENT LEVERS
(2026-08-07).** The question left open immediately above. At the SAME parameters (d = 8, a = 0.25) the
same model gives all three outcomes across seeds — **8 HELD / 12 FUSED / 18 `one lost`** of 38 founded —
so the outcome is not a parameter. **H3 refuted: it is not set at founding either** (realised separation
p = 0.290, founding spread p = 0.127, founding ancVar p = 1.000). The dynamics do the work.
⚠️⚠️ **A CONTROL FAILED IN THE WINDOW WHERE THE SIGNAL LIVED, AND THE SPATIAL CLAIM WAS RETRACTED.**
Permuting ancestry labels should destroy hybrid-gap occupancy's discrimination; at window 0..4 it did
(p = 0.399), at window 0..8 it **SURVIVED** (p = 0.0020). Cause: `one lost` replicates contain **exactly
zero** hybrids, so the permutation has nothing to move and the statistic stays 0 however labels are
shuffled. The measure read WHETHER HYBRIDS EXIST, not WHERE THEY ARE — so the gap decomposition reduces
to "hybrids form at all", and ⬜ **the bridge conclusion above is still not re-established.**
⚠️ **The tell was already in the table**: hybrid-gap and hybrids-anywhere returned an IDENTICAL
p (0.0007) though one is a STRICT SUBSET of the other. Two measures agreeing to 4 dp on a permutation
test are one measure. ⚠️ Declaring TWO windows in advance is what exposed this — the PASSING control
belonged to the window where the signal was weak, and reporting only that one would have read clean.
[detail](2026-08-07-fusion-vs-exclusion.md)

✅ **SEPARATED BY INTERVENTION (2026-08-07).** Fusion and balance are correlated by construction, so
only an intervention could order them: **HYB** forced real F1s through the model's own `gamete()`,
**BAL** forced composition back to 50/50 using MINORITY parents (creating no hybrid), **CLONE** was the
matched disturbance control. **HYB vs CLONE fusion .826 vs .348, p = 0.0029 — gene flow CAUSES fusion.
BAL vs CLONE p = 0.555 — forcing balance does NOT; balance is a CONSEQUENCE. CLONE vs NONE p = 0.756 —
the disturbance itself is inert**, which is the enabling control.
⚠️⚠️ **THE BIT-IDENTITY ANCHOR FAILED FIRST TRY AND CAUGHT A REAL BUG:** `run()` builds a FRESH rng from
the seed **even when handed a `found` population**, so founding and the generation loop consume SEPARATE
streams, while the experiment's loop carried the founding stream forward — a different model, silently.
⚠️ HYB acted in only 4.9 of 35 generations (it self-limits once hybrids dominate), so the arms are NOT
dose-matched. [detail](2026-08-07-hybrids-or-balance.md)

⚠️⚠️ **BALANCE ACTS ON THE OTHER OUTCOME, AND IT REPLICATES UNDER PRE-REGISTRATION (2026-08-07).**
Forcing ancestry balance without gene flow cuts EXCLUSION — post hoc in the run above, since that
pre-registration named FUSION rate. Re-run with the primary declared before results existed: exclusion
rate, BAL vs CLONE at J = 2, one-sided Fisher, α 0.05, **seeds 101–132 disjoint** from the 1–24 that
generated the hypothesis. **J = 2 PRIMARY: 5/28 vs 16/28, p = 0.0026 — PASSES. J = 4: 0/28 vs 14/28.**
Dose-response monotone 12 → 5 → 0, Cochran–Armitage **z = −3.85, p = 0.00006**. Fusion rate UNMOVED
(.286/.321/.250), so the "different levers" reading survives a test that could have refuted it.
⚠️ **J = 1 is not significant** (p = 0.297): the effect needs dose. A regression arm reproduced the
previous run's row EXACTLY (5 HELD / 6 FUSED / 12 one lost), and **no generation loop was rewritten** —
the merged experiment was reused through its own env knobs, so the replication cannot disagree with the
original for reasons unrelated to the biology.
⚠️⚠️ **THIS IS NOT A COEXISTENCE MECHANISM THE MODEL PRODUCED ON ITS OWN.** BAL is a **demographic
subsidy to the minority**, uncomfortably close to the per-lineage quota ruled out above as
question-begging: at J = 4 it redirects ~13% of the population toward the losing lineage every
generation, and "imposed negative frequency-dependence prevents competitive exclusion" is close to a
restatement of what negative frequency-dependence means. **The NON-tautological content is that the
rescued lineages STAY DISTINCT** — fusion flat at every dose, hybrid frequency indistinguishable from
control, HELD rising 8 → 14 → 21 — when a subsidy keeping both lineages present and able to interbreed
could as easily have MERGED them. And it locates the exclusion in **DEMOGRAPHY rather than pollination**:
placement-mediated mating is untouched by BAL and exclusion still vanishes.
[detail](2026-08-07-bal-replication.md)

⬜ **THE NORTHSTAR QUESTION THIS LEAVES: can a minority advantage be DERIVED from pollination rather
than IMPOSED?** ⚠️ **SIX ROUTE FAMILIES ARE NOW SPENT** — and five of the six attacked the same two
things, visitation or attraction:

| route                                | attacked     | outcome                                                       |
| ------------------------------------ | ------------ | ------------------------------------------------------------- |
| second limiting factor (#24/#26)     | visitation   | not available by the pollinator route                         |
| NFD on placement (#25/#27)           | visitation   | self-defeating — rare-bias subsidises the bridge              |
| learned avoidance (#22)              | attraction   | splits the ADVERTISEMENT, not the plant                       |
| discreteness from geometry (#33/#37) | the axis     | axis CONNECTED; and the morphology premise refuted            |
| reproductive assurance (#38, swept)  | MATE-FINDING | no TESTED rate met the conjunction, at any of 7 doses         |
| **spatial structure (#36)**          | **SPACE**    | **REFUTED — and its active half acts AGAINST the hypothesis** |

⚠️ **THE ASSURANCE ROW IS ONE ROUTE TESTED THOROUGHLY, NOT TWO NEGATIVES.** The 2026-08-07
single-rate run and the 2026-08-25 sweep are the same mechanism; counting them separately would
inflate this table. Neither gate opens at any dose from 0.05 to 0.7, and the positive control fires
at every one of them, so the gates are rejecting WHAT the mechanism did rather than whether it ran.
⚠️ It is a BOUND, not an equivalence: no pre-declared margin was registered, so "no admissible
window exists" is not available. [detail](2026-08-25-selfing-sweep.md)

⚠️⚠️ **THE SPATIAL ROW CLOSES THE ROUTE THIS ROADMAP CALLED FAVOURED, AND CLOSES IT IN THE WRONG
DIRECTION.** `:530` below named spatial structure _"the only remaining candidate that gives a rare
morph neighbours of its own kind"_, and it is the one mechanism ever measured moving the barrier
(0.247 → 0.950, v1 harness). In the model that can speciate: **HELD 0 of 38 in every cell**, exact
one-sided 95% upper bound **7.58%**, with the clustering control landing (0.983 → 0.800). And the
continuous readout that the four-way label cannot express does move — **retained ancestry variance
falls**, −0.082 [−0.143, −0.030] and −0.121 [−0.211, −0.035]. Local foraging does not merely fail to
protect a rare morph; it costs it.
⚠️ **Every readout that moved tracks FORAGING, not dispersal** — and dispersal is the half `:530`
argued for. ⚠️ The "limited dispersal alone" cell **cannot** differ from baseline: `carryover.js`
reads `positions` only when `forageRange` is finite, so that cell is an identity, not a null, and
the 2×2 has three distinct cells. ⚠️ Which makes the positive control necessary but NOT sufficient:
it proves kin structure was built while that structure is causally inert unless foraging is local.
[detail](2026-08-25-spatial-ibm.md)

🎯 **AND ONE ROUTE IS NO LONGER A CANDIDATE BUT A RESULT — the seventh, and the first positive in
this project that survives its own controls.**

| route                         | attacked | outcome                                                      |
| ----------------------------- | -------- | ------------------------------------------------------------ |
| **temporal assortment (#37)** | **TIME** | **+0.289 [0.158, 0.447] — reaches placement, controls hold** |

**Temporal assortment REACHES placement, and the pre-registration that said it could not is
refuted.** Registered contrast, recombination held fixed: **+0.368 [0.211, 0.526]**. Under FREE
recombination — where a bloom allele is torn from its placement allele every generation, the arm
that should have been hardest — **+0.289 [0.158, 0.447]**. FUSED never occurs. Absent from the
random-mating null.

- ✅ **Not the supergene.** Linkage alone is 0/38 HELD, bound 7.58%. The first version of this
  experiment had no `wide+linked` cell and its published contrast moved season width and
  recombination structure together; the 2×2 shows the supergene is inert.
- ✅ **Not small mating pools.** The shuffled-bloom arm permutes the expressed schedules, holding
  the multiset of flowering times fixed and destroying only the bloom-to-lineage tie: HELD collapses
  0.289 → **0.000**. Realised pool size measured rather than assumed — 4.743 against 4.343
  co-flowering plants of 30, ratio 0.916 — and the residual points the **wrong way** for the
  confound: the shuffled arm is slightly MORE fragmented and scored ZERO.
- ⚠️⚠️ **IT DOES NOT ANSWER THE NORTHSTAR ABOVE.** A narrow flowering season is a parameter this
  model sets, exactly as imposed as the BAL demographic subsidy this roadmap already ruled
  question-begging. The finding is that temporal assortment reaches placement — not that
  pollination ecology produced it. **The northstar stays open.**
- ⚠️ **The prereg's MECHANISM failed, not just its prediction.** Its premise is true — recombination
  does tear the alleles apart each generation — and its conclusion is false: assortative mating
  restricts who mates with whom, and that reaches ancestry whether or not any allele pair survives
  meiosis. **Independence of the axis does not imply independence of the outcome.**

[detail](2026-08-25-phenology.md)

⚠️⚠️ **THE NARROW ARM IS NOT A SHORT SEASON — IT IS 8 DISJOINT MATING BINS PLUS A 4% DEAD ZONE.**
Found while designing the evolving-width experiment, by enumerating the presence predicate
(`ringDist(bloom, k/S) <= width/2`, `ibm.js:1198`) over bloom-space rather than reading it.
Slice centres are `1/S = 0.125` apart while `WIDTH = 0.12` covers only `0.12`, so at the
published narrow width **no plant is ever in flower in two slices at once, and 4.0% of
bloom-space catches ZERO slices** — reproductively invisible by grid alignment alone.
✅ **This does NOT retract #37**: `shuffleBloom` preserves the multiset of bloom times, so the
grid structure is identical in both arms and HELD still collapses 0.289 → 0.000. The grid cannot
be what produced the positive. ⚠️ But it is decisive for anything that lets width VARY, because
width is the quantity that crosses those thresholds. Re-derive with `node tools/slice-coverage.js`.

⚠️⚠️ **AND IT IS NOW A MEASURED SCOPE CONDITION, NOT ONLY A CAVEAT ABOUT WORDING (2026-08-25).**
The evolving-width sweep ran the SAME fixed-narrow cell at three slice counts. `WIDTH = 0.12`
covers one slice at `S=8`, about two at `S=16` and about four at `S=32` — and HELD goes
**0.417 → 0.417 → 0.083** (5, 5 and 1 of 12 seeds). The effect survives while the windows are
effectively disjoint and collapses once they genuinely overlap. Mechanistically coherent — more
overlap is less assortment is less retained ancestry — but it means **#37 holds in the
disjoint-bin regime specifically**, and anything quoting +0.289 should quote `SLICES = 8` beside it.

🛑 **AND THE NORTHSTAR ROUTE THROUGH TIME IS NOW CLOSED — NEGATIVE. Width does not evolve narrow;
it evolves WIDE.** Making the season a heritable per-plant locus was the one move that could turn
#37's imposed parameter into a derived result. Treatment reaches width **0.92** from a start of
0.50 against a shuffled control at 0.48: **+0.422 [0.292, 0.551]** at `S=8`, and the same at 16
and 32 — an interval excluding zero in the WRONG DIRECTION, three times.
✅ S-invariance PASSED (`CV(width) 0.0086` vs `CV(width·S) 0.6630`), so the grid is not
responsible and the direction is real. ❌ `bloomLineage` did not move and HELD stayed 0.000.
⚠️ **The cause is that FLOWERING LONGER IS FREE HERE.** `carryover.js:295-341` draws
`r = rng() * acc` with `acc` summing only the plants in flower in that slice, so the visit draw is
renormalised over whoever is present: skipping a slice forgoes it, attending one costs nothing.
Measured, not inferred — `node tools/width-gradient.js` shows focal pollen flow rising monotonically
`423 → 3494` against a wide resident and `2747 → 12946` against a narrow one, a **4.7x** advantage
to a wide mutant invading a narrow population, with no interior optimum.
⚠️ The prereg's P2 named the right mechanism and drew the wrong conclusion from it: budget-splitting
is a cost of NARROWING, monotone, not a floor that stops narrowing near zero.
[detail](2026-08-25-evolving-width-result.md)

⚠️⚠️ **THE PARAGRAPH ABOVE NAMES THE WRONG CAUSE, AND IT WAS NOT A COST THAT WAS MISSING — IT WAS A
RESOURCE BEING CREATED (2026-08-28).** `sim/ibm.js:1290` computes `base` — a display share
normalised over the population — ONCE, and the slice loop re-offered **the same `base[i]` in every
slice a plant was in flower**. Season-integrated display was therefore `base[i] × k_i`: flowering
all season **MANUFACTURED S times** the floral display of flowering once, out of nothing, consumed
uncapped by both fitness paths (`received` `:1490`, siring `:1698`).
⚠️ **The discriminator was already sitting in the table above and went unread.** Duplication
predicts the wide-to-narrow ratio equals **exactly `S`**; a missing cost predicts nothing about `S`.
`423 → 3494` is **8.26** at `S = 8`, and the same probe at `S = 16` gives **16.52**.
✅ **FIXED — `PH.conserveDisplay`, and it costs NO PARAMETER**: `base` is already normalised, so the
constraint is only that a plant has a finite reproductive investment. A cost coefficient would have
left the duplication in place and taxed it, making the evolved width a statement about the
coefficient — the imposition this route was built to escape. The gradient collapses **8.26 → 1.698**
at `S=8` and **16.52 → 2.707** at `S=16`, i.e. **four fifths of it was manufacture**, and at 24
seeds there is still no interior optimum.
⚠️ **#47 KEEPS ITS DIRECTION AND LOSES ITS EXPLANATION** — width still evolves wider, but not
because duration is free. ✅ **#37 IS UNTOUCHED** — but ⚠️ **THE REASON GIVEN HERE WAS WRONG AND
IS CORRECTED BELOW (2026-08-31)**: conservation is a no-op on equal-**OCCUPANCY** populations,
not equal-width ones, and #37 is protected by running at `S = 8` rather than by the principle.
⚠️ The residual pro-wide gradient is the **per-slice budget being `per/S` regardless of how much
display is in the slice** — which makes EMPTY TIME VALUABLE, and that is the northstar's own
negative frequency-dependence arising from pollination rather than imposed on it. The duplication
was swamping it by a factor of `S`.
✅ **MEASURED 2026-09-01 (#51): that candidate is REAL AND IS ABOUT 40% OF THE GRADIENT, NOT ALL OF
IT.** Ablating it leaves the gradient at **1.368 / 1.814**, still pro-wide. See below.
[detail](2026-08-28-conserved-display.md)
[detail](2026-08-28-conserved-display-prereg.md)

⚠️⚠️ **#50 RAN IT AT FULL SCALE, AND HALF THE EFFECT WAS THE MANUFACTURE (2026-08-31).** Job 3572,
both arms in one job on one host, `sim/ibm.js` md5 `bdfdbf29…`. Under conserved display the evolved
width falls **0.915 → 0.808** (`S=8`), **0.915 → 0.731** (16), **0.929 → 0.795** (32), and
treatment − shuffled falls **+0.422 → +0.291 [0.140, 0.442]**, **+0.445 → +0.084 [−0.061, 0.228]**,
**+0.444 → +0.233 [0.115, 0.352]**. So the drift is roughly halved, **stays clear of zero at `S=8`
and `S=32`, and does not reverse.** ⚠️ The three conserved intervals overlap heavily, so `S=16`
being lowest is **not a finding** — it is one of three draws at n=12. All four registered conditions
still fail in both arms: **narrow flowering still does not arise on its own.**

⚠️⚠️ **AND THE BUILT-IN CONTROL FIRED: P3 IS FALSE AS REGISTERED.** The two fixed-width cells carry
the flag, so they test it. Fixed WIDE was unchanged at every `S`; fixed NARROW was unchanged at
`S=8` and **MOVED at `S=16` and `S=32`**. **The invariance is a property of OCCUPANCY, not of
width.** Conservation divides by the number of slice centres inside a window, and a window of length
`w` on centres `1/S` apart catches `floor(w·S)` or `floor(w·S)+1` of them **depending on its PHASE**
— so it is neutral only when `w·S` is an integer, or when the only nonzero occupancy is 1. Verified
against the live predicate: the occupancy column predicts the model-level byte comparison in 7/7
cells (`0.12·16 = 1.92 → {1,2}`, `0.12·32 = 3.84 → {3,4}`; `1.0·S` integer at every `S`).
✅ **NOTHING PUBLISHED MOVES** — every fixed-width call site in the repo runs at `S = 8` (checked
across all seven files containing `slices` in `experiments/`, `tools/`, `tests/`), so the
entanglement reaches exactly this experiment's own two fixed-narrow control cells at `S ≥ 16`, which
carry no result. ⚠️ But **#37 is protected by its PARAMETERS, not by the principle**, so the test now
reads #37's own `SLICES` and `WIDTH` out of its source and fails if either moves.
⚠️ **A SECOND DEFECT THE FLAG REMOVES, NEVER REGISTERED:** under the duplication, at `w·S = 1.92`
**PHASE ALONE was worth up to 2× in fitness** between two plants of identical width. `:1355` warns
about the discretisation BELOW `w = 1/S`; this lottery lives ABOVE it.
[detail](2026-08-31-evolving-width-conserved.md)

✅ **#51 MEASURED WHAT EMPTY TIME IS WORTH, AND IT IS NOT THE WHOLE RESIDUAL (2026-09-01).** Job
3606, `sim/ibm.js` md5 `7da6ce55`, registered in `2026-08-31-empty-time-prereg.md` BEFORE the flag
existed. `PH.displayProportionalVisits` apportions the SAME total visits across slices in
proportion to the display each carries, by largest remainder — an ABLATION, not a fix.
⚠️⚠️ **P2, THE DECISIVE PREDICTION, PASSES.** Visits are blind to geitonogamy, so they isolate the
empty-time premium from the concentration penalty. Derived premium `(29+S)/30` = **1.2333 / 1.5000**;
measured **1.2494 / 1.5031** (within 1.3% and 0.2%); after ablation **1.0080 / 1.0053** against a
registered 1.000. **One number arrived at twice by different routes** — `(29+S)/30` is
independently the P1 registered in the #49 prereg — **and then measured.**
⚠️ **P1: ONE HIT, ONE MISS, REPORTED AS A MISS.** Flow ratio falls to **1.368** at `S=8` (band
[1.233, 1.377], inside) and **1.814** at `S=16` (band [1.500, 1.805], **0.49% ABOVE the top**).
The band carried #49's unexplained higher-order factor forward unchanged; it rose 1.203 → 1.209.
📊 **THE THREE-FACTOR DECOMPOSITION IS CONFIRMED**: gradient = empty-time × geitonogamy ×
higher-order = `1.2333 × 1.2336 × 1.116 = 1.698` and `1.500 × 1.500 × 1.203 = 2.707`, against
measured 1.6984 / 2.7066. As shares of the log gradient, stable across `S`: **empty time ~40%,
geitonogamy ~40%, higher-order ~19%.**
🛑 **SO THE ANSWER IS NO — empty time is not what still selects for wider flowering, it is 40% of
it.** "Narrow flowering does not arise on its own" has now survived three explanations of its own
cause: duration-is-free (#47, wrong), the manufacture (#49, real but half), and this three-way
split. Each correction shrank the effect without reversing it.
⚠️ **AND THE ABLATION IS NOT A CLAIM THAT THE OTHER MODEL IS WRONG.** A constant per-slice budget
is a fixed forager population; a proportional one is foragers aggregating on abundance. Real
pollinators sit between, and this run does not settle which. What it establishes is a SCOPE
CONDITION: ~40% of the pro-wide gradient is a consequence of the allocation convention rather than
of pollination.
⚠️ **The budget guard CAUGHT A REAL BUG on its first run**: the apportionment divided the NOMINAL
`perSlice · S`, while the unablated arm skips display-free slices and LOSES their visits — so the
ablated arm was also spending what the other arm discards. A bigger budget is exactly the confound
this ablation must not have. Now `perSlice × (occupied slices)`; `spent` reads 24000 in all four
tables. ⚠️ And the guard was wrong the OTHER way first: it summed spend over six generations of two
arms that, being different models, diverge after gen 0 — comparing trajectories, not budgets.
⚠️ **P4, THE EVOLUTIONARY CONFIRMATION, FAILS AS REGISTERED (job 3619).** Arm A reproduces #50
exactly. Treatment − shuffled was registered to fall at every `S` and went **+0.291 → +0.131**
(down), **+0.084 → +0.136** (UP), **+0.233 → +0.289** (UP): **down at 1 of 3.** ⚠️ It is NOT rescued
by evolved width, which did fall at 3/3 (0.808/0.731/0.795 → 0.709/0.682/0.714) and became far more
S-invariant (`CV` 0.0531 → 0.0246) — that was not the registered statistic, the runner computes no
A-vs-B interval for it, and the S-invariance is post-hoc. **Every interval overlaps its counterpart,
so P4 is UNINFORMATIVE at n=12, exactly as the prereg warned.** A null there would not have been
evidence of absence, so these moves are not evidence of presence.
⚠️⚠️ **AND THE RUN'S REAL FINDING IS IN A CONTROL CELL: THE PREMIUM IS WHAT HOLDS THE LINEAGES
APART.** Under the ablation the fixed-narrow arm loses a lineage in **36 of 36 seeds** — HELD
`0.417 / 0.250 / 0.250 → 0.000 / 0.000 / 0.000` at `S =` 8/16/32, with `ancVar/ancVar0` verified
**0.0000 in every seed** at `S=8` outside the runner. A constant per-slice budget pays a plant for
blooming when few others do — **negative frequency-dependence generated by the ALLOCATION RULE** —
and apportioning by display sets every plant's expected visits to `V·base_i` regardless of slice, so
the minority lineage loses its refuge. **Temporal assortment retains ancestry here because of the
per-slice budget, not because of assortment as such.** ⚠️ This does NOT retract #37, whose cells run
without conservation and without this flag — it is two steps away — but it names the run that would
test it directly. **Open as its own task.**
[detail](2026-09-01-empty-time.md)
[detail](2026-08-31-empty-time-prereg.md)

🛑🛑 **#52 RAN THAT TEST DIRECTLY, AND ROADMAP B'S POSITIVE RESTS ON THE PREMIUM (2026-09-01).** Job
3631, `sim/ibm.js` md5 `9a27e842`, registered in `2026-09-01-rarity-premium-prereg.md` BEFORE
`phenology.js` had any flag. ⚠️ **The premise was upgraded from analogy to IDENTITY before the run:**
#51's collapsing cell used `conserveDisplay` and #37 does not, but at `WIDTH=0.12`/`S=8` every plant
occupies **0 or 1 slices (4.00% / 96.00%)**, so conservation divides by 1 — verified byte-exactly,
identical in 12/12 seeds with the flag on and off and **differing in 12/12 at `W=0.3`** as the
positive control. The two runs are ONE configuration.
✅ **ARM A REPRODUCES #37 EXACTLY** — `HELD` 0.000 / 0.289 / 0.368 / 0.000 / 0.000, `bloomLineage`
0.886 → 1.000, pool ratio 0.916. The gate that licenses the comparison passes.
🛑 **ALL FOUR REGISTERED PREDICTIONS PASS ⇒ COLLAPSE.** `narrow·free HELD` **0.289 → 0.026** (P1,
band ≤0.079); `H-link` +0.368 [0.211, 0.526] → **0/38 vs 0/38** (P2); **`H-pool` +0.289 [0.158,
0.447] → +0.026 [0.000, 0.079]** (P3 — the contrast that licensed "heritable temporal assortment"
over "small mating pools"); wide cells **byte-identical 38/38** (P4).
⚠️⚠️ **THE MECHANISM IS NOT THE ONE REGISTERED, AND MY OWN STATISTIC REFUTED IT.** M2 was registered
to test "the rare LINEAGE is subsidised" and reads **1.327 in the WIDE cells, where the premium
cannot operate at all** (every plant in every slice, M1 undefined, wCrowd exactly 1.000) — while the
narrow control reads **1.291, BELOW that baseline.** Direct subsidy is refuted by its own registered
statistic. **What the run shows is a TWO-STEP: the premium MAINTAINS THE FLOWERING-TIME
POLYMORPHISM** (`R1` 0.457 → **0.941**, `R2` 0.368 → 0.849, scattered → CONCENTRATED; co-flowering
4.743 → 6.366) **and the polymorphism is what assorts.** ⚠️ Post-hoc but decisive as an internal
control: the season concentrates ONLY where bloom is heritable — the SHUFFLED arm, which has no
locus to concentrate, does not move (`R1` 0.708 → 0.690).
✅ **BOTH RIVAL MECHANISMS EXCLUDED.** M1 −0.843 → **+0.001** (the positive control on the ablation
itself: the premium was real and is gone). H_B needed the CV of visits to RISE; it **FELL** 0.677 →
0.082. H_C excluded: the excess over what apportionment mathematically entails is **−0.000**, and no
display-carrying slice went unvisited.
⚠️⚠️ **THREE OF MY OWN GUARDS WERE WRONG, IN THREE DIFFERENT WAYS.** (a) M3's weighted crowd is
`1 + CV²(occupancy)` EXACTLY under apportionment — a function of the occupancy distribution, so it
cannot tell a collapsed season from an ablation that merely ran; caught BEFORE the run and replaced
by the excess. (b) M2 was contaminated, and **only the wide no-op cells revealed it** — narrow-only
cells would have read 1.291 as confirmation. (c) The registered gen-0 criterion was MIS-SPECIFIED BY
ME: it lumped `bloomAssort`, which is read off the transfer matrix and MUST move, in with
who-flowers-when. Decomposed, `blooms`/`coflower`/`bloomLineage` are **38/38 identical** and only
`bloomAssort` differs. ⚠️ And the `visits` column is a TRAJECTORY, not a budget (558,474 vs 354,711
over 35 divergent generations); the budget guard is one step on the same population, where the arms
match **38/38**.
⚠️ **#37 IS NOT RETRACTED — every number reproduces.** The claim is rescoped to "temporal assortment
reaches placement, GIVEN a constant per-slice visit budget", and the imposition runs deeper than
`WIDTH=0.12`: the mechanism sustaining the flowering-time variation is imposed too.
⚠️ **THE TWO-STEP IS INFERRED, NOT ISOLATED** — the ablation removes the premium AND, downstream, the
polymorphism. The clean test re-imposes arm A's realised bloom multiset on the ablated arm each
generation. **Open as #53.**
[detail](2026-09-01-rarity-premium.md)
[detail](2026-09-01-rarity-premium-prereg.md)

⚠️ **THE TWO SMALL-POOL RESULTS POINT OPPOSITE WAYS, AND THAT IS THE FINDING UNDER BOTH.** Local
foraging shrinks the mating neighbourhood and ancestry variance falls; a narrow season shrinks it and
divergence is retained. The discriminator is whether the pool is **ALIGNED WITH LINEAGE**. Founders
are scattered at random, so a foraging neighbourhood is ancestrally mixed and a smaller sample is
simply more drift; heritable flowering time makes the pool track ancestry, and the same shrinkage
becomes assortative mating. Predicted from the spatial run BEFORE the phenology confound arm
reported, and it held.

The candidate this paragraph used to name as live — **make the placement axis discrete from the
animal's own body geometry** — is CLOSED, twice over: the axis is connected (below), and the
morphology that would justify a constricted plan does not hold for the pollinator being modelled.
⚠️ The trap it was written to avoid still stands for anything that replaces it: discreteness must
EMERGE from the body morphology already in `sim/placement.js`, not be imposed as two bins, or it
assumes the answer.

⚠️⚠️ **THE PREMISE OF THAT PROPOSAL WAS MEASURED 2026-08-07, AND IT FAILS: THE AXIS IS CONNECTED.**
The cheap version — that the existing geometry already supplies discreteness, since `DEFAULT_BEE` is a
capsule chain with a radius step at the face/scutum junction (0.32 → 0.42) — is refuted. Across
**38,915 placed genomes the default bee's reachable placement set is CONNECTED end to end**, and so are
all three other plans. ⚠️ The right object is REACHABILITY, NOT DENSITY: a merely sparse gap is still
subsidised, so only placements that CANNOT EXIST starve the bridge; this samples the image of genome
space under the contact map.
⚠️⚠️ **THE FIRST PASS WAS A FALSE POSITIVE IN 3 OF 4 PLANS, AND THE DISCRIMINATOR IS THE CONTRIBUTION:
A REAL HOLE IS STATIONARY.** Empty bins in sparse tails are a fact about the draw. At 4× the draws
`long slender` became connected outright and `large robust`'s hole MOVED with its tail (0.454 → 0.491
as the range grew 0.476 → 0.540), while a pinched positive control held still at [0.158, 0.417] against
a waist built at [0.16, 0.42]. ⚠️ And the control is BLIND to the stability filter — a filter wired to
accept would flip all four plans and still pass it — so the filter has its own anchor, confirmed to
FAIL at a relaxed threshold rather than assumed to work.
⚠️ The four plans could not have differed: `checks.js` builds them all with `scaleBee`, so they share
s-boundaries by construction. The enumeration is EXHAUSTED, not sampled.
⬜ **So a discrete axis is now a MODELLING CHOICE, not a measurement.** Choosing a constricted body
BECAUSE it delivers the needed discreteness is the per-lineage quota again. The honest form: fix the
constriction from published wasp morphometry, treat the reachability gap as a PREDICTION that follows,
and only then ask whether exclusion changes. Tune the waist until exclusion moves and the result is the
tuning. [detail](2026-08-07-placement-reachability.md)
⚠️⚠️ **AND THE MORPHOLOGY CLAIM ABOVE WAS WRONG — CHECKED 2026-08-07 BEFORE BUILDING ANYTHING.** The
line justifying the plan read _"that is defensible morphology (Apocrita are named for the wasp
waist)"_. True, and it does not license the plan. **Every apocritan has the propodeal–metasomal
constriction — that is what the name means — but an ELONGATED, thread-like petiole is a FAMILY-level
character.** Sphecidae are literally thread-waisted wasps; **Thynninae, the pollinators this project
models, are reported to LACK an elongated petiole.** The `PINCHED` control is r=0.02 against
neighbours of ~0.42, a ~20:1 pinch — a sphecid caricature, not a thynnine. The sentence generalised
from the name of the SUBORDER to the geometry of ONE FAMILY, and the taxon in between — the actual
pollinator — was never checked.
⚠️ **I could not source a published waist measurement for ANY flower-visiting wasp** (this repo, four
searches, OpenAlex, and the full text of the two candidate measurement papers — which turn out to
report petiole height/length and head width respectively, never waist width). Same wall as
`2026-08-03-platanthera.md:127`: taxonomy does not publish the radius profile this model needs.
**So: do NOT add the constricted plan to make the axis discrete** — it would answer a question about
Sphecidae and be read as an answer about the orchid system. Unblocked by a thynnine waist from Brown's
Zootaxa revision (not accessed), a micro-CT radius profile, or an explicit re-scope to Sphecidae with
the orchid framing dropped. ⚠️ NOT established: that a thynnine waist leaves the axis connected — there
is no measurement either way. [detail](2026-08-07-wasp-waist-premise.md)

⚠️⚠️ **REPRODUCTIVE ASSURANCE — THE FIRST CANDIDATE TO ATTACK MATE-FINDING ITSELF, AND IT IS
INADMISSIBLE (2026-08-07).** The four routes above all attacked visitation or attraction, but `:111`
already localised the constraint in MATE-FINDING. Selfing removes the need for a partner: offered to
both morphs on identical terms with no quota, it can only pay where partners are missing, which is
more often the rare morph, and it carries inbreeding depression so it can fail.
✅ **The specificity control passed exactly** — receipt exponent 0.828 ± 0.506, IDENTICAL across all
seven arms, since selfing acts at the mother draw strictly downstream of the bout.
❌ On the pre-registered unpaired comparison the intervals overlap (baseline 0.366 ± 0.152 against
0.019 ± 0.312). The PAIRED delta does exclude 0 at −0.347 ± 0.286 — ⚠️ but that test was chosen AFTER
seeing the overlap, so it is post hoc.
⛔ **AND IT FAILS BOTH GATES THE PRE-REGISTRATION WROTE BEFORE THE RUN.** Admissibility: selfing vs the
full-selfing control is **0.013 ± 0.251, INDISTINGUISHABLE** — a rate-0.5 arm that behaves like total
selfing IS total selfing. Attribution: selfing vs `floorOnly` is **−0.175 ± 0.263, spanning 0** — about
half the movement is maternal-weight FLATTENING, not selfing.
⚠️⚠️ **Both gates were in the prereg and NEITHER was implemented in the first verdict**, which would
have printed the paired delta and walked past them. The prereg is the only reason an inadmissible
positive became visible rather than publishable.
⚠️ **The published 0.70 screen COULD NOT have scored this**: `perCapita` stops at receipt and selfing is
strictly downstream, so reusing it would have guaranteed a null for reasons unrelated to the biology.
Any future candidate acting at or after mating needs its own realised-reproduction estimator.
⚠️ POST HOC and UNTESTED: single-generation lineage extinction runs 8/40 baseline, 1/40 selfing, 6/40
floorOnly, 14/40 at full cost. Suggestive of a selfing-specific rescue; no significance test applied.
✅ **CLOSED 2026-08-25 — the sweep ran and the window does not exist anywhere in it.** This asked
whether a SMALLER rate sits in a window that is both admissible and effective. Across seven doses
from 0.05 to 0.7, **neither gate opens at any rate**: nothing is distinguishable from total selfing,
and nothing is separable from the weight floor. The suspicion that the two gates squeeze from
opposite directions was right, and they squeeze the window shut.
✅ The knob was live at every dose — free-vs-fully-costed lineage loss separates 5→14, 4→15, 3→15,
3→13, 3→13, 1→14, 1→16 of 40 — so the gates reject WHAT the mechanism did, not whether it ran.
⚠️ **Worded as a bound, not an equivalence.** No pre-declared margin was registered, so the claim is
"no TESTED rate met the conjunction", not "no admissible window exists".
⚠️ The realised effect is NEGATIVE at every rate: assurance makes frequency-dependence stronger, not
weaker. [sweep](2026-08-25-selfing-sweep.md) · [detail](2026-08-07-selfing.md) ·
[prereg](2026-08-07-selfing-prereg.md)

v1 is adaptive dynamics over species already distinct. It has no standing variation, no
recombination and no hybridisation, so it cannot speak to how a lineage _splits_. The interesting
question sits exactly there: placement selection in one panmictic population is positively
frequency-dependent and converges, so what breaks that symmetry in the first place? Needs an
individual-based model with real inheritance and hybrid formation. **This is the biggest open
scientific question in the project.**

✅ **THE IBM IS BUILT 2026-08-03 (`sim/ibm.js`), and the proxy is retired.** Every mechanism above was
scored against `rare/common ~ 0.26` in machinery that cannot speciate. This one can: `runBout`'s
`T[i][j]` IS a mating matrix, so a mother is drawn by the pollen she received and her mate by who
delivered it — **parentage is decided by the placement geometry and assortative mating is an OUTPUT,
not a parameter.** Diploid, free recombination, additive expression (because the hybrid work MEASURED
additive shape to give blending placement), placement still computed.

**Neither arm splits.** A placement-mated population is indistinguishable from a null whose mating is
severed from placement (tail separation 2.20 vs 2.32). ⚠️⚠️ **The stronger half: fecundity selection
pointed at two REACHABLE placements at k=8 still did not go bimodal — it CONTRACTED, spread 0.73
against the null's 1.97.** Whichever cluster falls behind loses its mates, so placement-mediated
mating is positively frequency-dependent and **ERASES an imposed bimodality rather than merely
failing to create one**. That is the rare-morph mate-finding problem with real inheritance, and it is
what sympatric Platanthera shows in the field.

⚠️⚠️ **Two positive controls FAILED before one worked, both in the same mechanism class**, and the
tell was identical each time: the forced arm had LESS spread than the null, which no real split does.
`exp(k·distance-from-mean)` is disruptive on a 1-D trait axis but on a 2-D body surface rewards a
direction-free shell and then collapses onto the leading extreme — **the second time this project has
hit that**, the panmictic experiment recorded it first. The control that worked **changed mechanism
class**: it selects nothing, hands the pipeline a population that IS two lineages, and asks only
whether the measurement can see one — up to **23x** the one-cloud baseline. A control sharing a
mechanism with the thing under test cannot separate "selection can't beat the mating system" from
"the statistic can't see a split", because the mechanism under test is free to defeat it.
⚠️ **The anchor gate also caught a broken diagnostic**: correlating deviation against pollen RECEIVED
(the female half of fitness) read +0.149, i.e. disruptive; realized parentage reads **-0.842**.
N=30 over 35 generations bounds the effect rather than proving impossibility. [detail](2026-08-03-ibm.md)

✅ **DECEPTION IS NOW WIRED IN 2026-08-04, and it splits the ADVERTISEMENT and not the plant.** The
framing is what made it decisive: deception's negative frequency-dependence acts on the **signal**
axis, the mating system's positive frequency-dependence acts on **placement**, so the question was
whether the first can **reach** the axis the second lives on. Signal is allowed to be a gene (colour
morphs are heritable; _D. sambucina_'s polymorphism is one) while placement still is not — kept apart
by `shapeOf` and by giving the advertisement **its own rng stream**, so switching deception on cannot
silently re-roll every shape mutation. Verified bit-identical to the pre-advertisement model.

Deception inflates the advertisement cloud **3.2× free / 3.6× linked** (spread 0.055 → 0.175) and
**does not move placement at all** (2.36 vs a random-mating band of 2.90). ⚠️⚠️ **And LINKING the advertisement to the anther
loci does not rescue it** (2.17) — the discriminator the supergene arm existed for, killing the
attractive explanation that free recombination merely separated them. Flat across a 7.5× sweep of the
one unanchored parameter.

⚠️⚠️ **The mechanism: NEGATIVE FREQUENCY-DEPENDENCE MAINTAINS A POLYMORPHISM, IT DOES NOT COMPLETE A
SPLIT.** The numbers separate the claims — advertisement **spread** inflates reliably, **bimodality**
clears its matched honest band only marginally. A rare-morph advantage must evaporate once the morph
is common, so it protects variance without ever resolving it into two morphs, and **a protected
polymorphism is the opposite of a completed split**. That is what Gigord et al. 2001 actually
reported: maintenance of a colour polymorphism **within one species**. ⚠️ **My own hypothesis was
refuted first** — that "past parity" was an artefact of scoring summed transfer rather than realized
parentage; re-scored from the identical bout it is 4 of 8 under **both** (parentage mean 1.040 vs
transfer 1.132), so the claim stands and the negative is about generations, not measurement.
⚠️ A verdict bug scored the linked arm against the **unlinked** control's band; fixed and the run
regenerated rather than reinterpreted. **Seven mechanisms, and two of them now break a real symmetry
on an axis that is not the one reproductive isolation lives on.** [detail](2026-08-04-deception-ibm.md)

✅ **The premise is now measured rather than asserted** (2026-08-02). It had lived only in a comment
at the top of `sim/evolve.js`, and it justifies both B's framing and why the evolution loop starts
with many species. Measured in a panmictic population with per-plant mating success: the selection
gradient is stabilising at **−48.9% ± 16.2pp across 7 independent populations** (all seven negative),
and with mutation off the placement spread **collapses 12.6×** while mating success rises 2.5×.
⚠️ The disruptive-detection control **failed on the first run** and caught a real bug — the shape
test was written for a trait axis, but on a |deviation| axis disruptive selection rises rather than
forming an interior U. Without that control, a harness that could only say "stabilising" would have
returned the expected answer. **B is asking the right question**, and this is what licenses building
the individual-based model. [detail](2026-08-02-panmictic-premise.md)

✅ **Recombination and hybrids, measured 2026-08-02.** ⚠️ **My hypothesis was refuted.** Because
placement is computed from shape rather than inherited, I expected hybrids to land off-axis — giving
isolation a placement gene could not. Measured: additive inheritance of shape produces **almost
perfectly blending placement** (detour 1.01, nearest 0.45 — indistinguishable from the L1 control),
and transgressive hybrids are **rare at 2%**. Geometry does not rescue divergence from blending.
**But hybrids still pay 19.1% [0.708, 0.910]** in mating success, purely from placement mismatch —
and the clonal-population control matters, because hybrids are also slightly worse flowers (0.960)
and that accounted for 6 of the 25 raw points. So selection against hybrids is real without any
genetic incompatibility. [detail](2026-08-02-hybrid-placement.md)

✅ **Pollinator heterogeneity tested 2026-08-02 — it is NOT the symmetry-breaker.** Assortment by
placement is already present (the transfer matrix _is_ placement matching) and is conformist, so a
rare placement must first be worth something. Two pollinators with different geometry do not make it
so: frequency dependence stays strongly positive, `rare/common` = **0.325 at distance ~10 under two
animals against 0.258 under one** — a real 26% relief, nowhere near the 1.0 a rare morph needs.
Pushing the body plans further apart does not help (9%, 5%, 0%, 0% rare-advantage morphs).
⚠️ **The first version of this experiment was structurally incapable of answering it** and returned a
uniform 0% null that only the positive control exposed — see the doc, it is the most instructive part.
[detail](2026-08-02-two-pollinators.md)

✅ **Flower constancy tested 2026-08-02 — it makes things WORSE.** The obvious candidate, and the
hypothesis was backwards. `rare/common` falls **0.296 → 0.198** as constancy rises; no morph gains a
rare advantage at any level. ⚠️ My explanation for the refutation was also wrong: it is not partner
exhaustion, because the penalty is **scale-invariant** (−0.211 → −0.183 while the rare morph triples
at fixed frequency). Constancy amplifies the encounter rate — a bee that lands on the majority stays
there — so it **reinforces the majority**, which is the documented minority disadvantage of flower
constancy. Only the BASELINE penalty eases with population size (0.471 → 0.550), and that part is
partner availability. [detail](2026-08-02-constancy.md)

✅ **Spatial structure BUILT 2026-08-02 — the first mechanism in five that helps.** Plants on a ring,
bee foraging from a Gaussian kernel. ⚠️ It is a genuine INTERACTION, which was the test: only
clustered+local pays (0.360) against scattered+global 0.148, clustered+global 0.142 and
scattered+local **0.048** — each factor alone is worse than neither. Tightening the kernel lifts
`rare/common` **0.247 → 0.950**, a fourfold relief tracking the patch width as predicted.
⚠️ **Parity is not an advantage** — 0.950 is ~0.876 once corrected for a real +8.4% bias the
calibration control shows in exactly that cell (it survived seed-averaging). The penalty is
RELIEVED, not reversed. ⚠️ The patch-growing arm (corrected 0.889, 0.800, 1.220) is non-monotone and
single-draw; the crossing it hints at is **not claimed**. [detail](2026-08-02-spatial.md)

⚠️ **Larger patch: MEASURED AND INCONCLUSIVE 2026-08-02.** Corrected 1.020 ± 0.492 (4/24) and
0.863 ± 0.278 (8/48) — intervals spanning penalty to advantage, point estimates falling not rising.
Reported as a failure to measure rather than dressed up; the verdict logic now refuses to conclude
above ±0.2, after an earlier draft printed "✅ PREDICTION HELD" off ±0.417.
⚠️ **The diagnostic was worth more than the result**: holding the bout fixed while the ring grew made
the identical-morph control drift 0.976 → 1.133 → 1.228, and a control that cannot vary by
construction but does is a broken harness. A locally foraging bee DIFFUSES, so mixing time scales as
(ring/step)²; scaling visits accordingly flattens the control to 1.009/1.071.
✅ **THE PENALTY IS COMPOSITION, NOT RARITY — measured separately 2026-08-07.** Boundary dilution
depends on STRUCTURAL POSITION, not on which morph you carry, so it predicts BOTH sub-ratios at
parity while the pooled ratio sits below 1 — refuted if either sub-ratio is clearly below 1. At 4/24,
24 draws × 3 bout seeds: boundary **1.172 ± 0.457** and interior **0.878 ± 0.298** both span parity
against a pooled **0.754 ± 0.234** that EXCLUDES 1. A rare plant and a common plant in the same
structural position do equally well; the rare patch is penalised for being mostly boundary, since an
arc of any length on a ring has exactly TWO boundary members (2 of 4 against 2 of 20).
⚠️ **The control is a result in its own right** — boundary plants receive **0.570 ± 0.118** of
interior per-capita transfer under local foraging and **1.085 ± 0.191** under global. That is the
premise the whole patch-size prediction rested on, measured directly for the first time.
⚠️⚠️ **Two guards would have passed on nothing.** The control first used the IDENTICAL-morph layout —
but with no other morph present there is nothing to be diluted BY, so it had removed the mechanism it
was certifying. And at 6 draws the verdict printed "✅ HELD" because _"both sub-ratios span 1"_ is
satisfied automatically by intervals wide enough to span everything; a pooled ratio that does not
exclude 1 now routes to UNDERPOWERED.
⚠️ Spanning 1.0 is NOT proving parity — an interior penalty of ~10–15% would not have been detected,
and nothing here says spatial structure produces an ADVANTAGE. It says the residual penalty is
boundary composition, consistent with the ratio approaching 1 from below without crossing.
[detail](2026-08-07-boundary-interior.md) · [patch-size](2026-08-02-patch-size.md)

⚠️ **THE COEXISTENCE DISCREPANCY IS NOT POLLINATOR NUMBER (2026-08-04).** The exclusion result
predicts a pair past d=8 ends with ONE MEMBER LOST, yet orchid communities contain coexisting
congeners — so the IBM was extended from one pollinator to N (separate bouts summed, never one mixed
bout; visit budget SPLIT so arms differ in geometry not in how much pollination they get; single-animal
path bit-identical across 45 fields). **It does not work: one lineage is still lost 5/5 with two very
different body plans.** The decisive control is **two IDENTICAL animals** — same bouts, same split
budget, same summation, no new geometry — which also loses 5/5, so it is not the machinery. ⚠️ The
animals genuinely differ: **106.9x** the sampling floor measured from two identical animals drawing
sites independently.
⚠️⚠️ **The leading remaining candidate is a MODELLING ASSUMPTION, not biology: POPULATION SIZE IS
FIXED.** The IBM fills exactly N slots every generation, so two isolated lineages are forced into a
zero-sum contest that is built into the demography rather than derived from pollination. Testable by
letting size follow total seed set — ⚠️ but giving each lineage its own quota would ASSUME coexistence.
✅ **TESTED AND REFUTED 2026-08-04, below.**
[detail](2026-08-04-two-pollinator-coexistence.md)

⚠️⚠️ **IT IS NOT THE FIXED POPULATION SIZE EITHER — AND PART C SAYS NO DEMOGRAPHY COULD EVER FIX IT
(2026-08-04).** Filling exactly N slots is **soft selection** (Wallace 1975), so only relative success
can matter; letting recruits follow total seed set is **hard selection**. ⚠️ It is TWO constants, not
one — `visits` is also a constant total shared over n plants, and lifting only the first would have
been inert. Both were lifted as a 2×2 with a **shared** ceiling (a per-lineage quota would assume the
answer). **Every viable regime still loses a lineage 5/5 at d=8**, including the one that genuinely
tracks its own seed set (mean N 28.5, range 7–45, **0.0% at the ceiling**); the null still fuses.
⚠️ One cell is unevaluable and that is a finding: constant PER-PLANT service has **no density
regulation at all** (critical branching — 3/5 seeds extinct), so removing the fixed limiting factor
removes the regulation with it.
⚠️⚠️ **THE MECHANISM: the invasion criterion fails in BOTH directions.** Per-capita receipt vs own
frequency at d=8 = **0.214 / 0.580 / 0.981 / 1.789 / 4.654** at f = 0.1…0.9 — a rare lineage does
WORSE, monotonically. 0.981 at 50/50 and near-exact reciprocity (1/0.214 = 4.67 vs 4.654) make it pure
symmetric frequency dependence, not an intrinsic advantage; **0.214 sits on the same order as the
rare/common ≈ 0.26 proxy**, reached from a different construction. Control: one lineage wearing BOTH
labels (exact null) reads 1.011/0.991/0.992/0.947/0.997 — flat, so the statistic can report absence.
**Coexistence needs a STABILISING niche difference and this model has the opposite sign, so the
constant was never the cause.**
⚠️⚠️ **THIS UNIFIES B AND THE COEXISTENCE GAP:** coexistence needs a rare lineage to beat a common
one, and so does the ORIGIN of a split — the same requirement, failed by eight mechanisms. The
coexistence gap is the speciation barrier seen from the far side.
⚠️ **And it explains why two pollinators could not have worked:** the split budget keeps ONE limiting
factor. Two animals become two limiting factors only with INDEPENDENT budgets — which needs a
one-animal double-budget control to separate that from "more visits".
⚠️ The anchor gate fired once and was WRONG: it demanded HELD in every seed and got 4/5, but seed 5
genuinely loses a lineage in 3 generations. The predicate's scope exceeded its claim (reachability),
so it could not discriminate its target from ordinary behaviour.
[detail](2026-08-04-density-dependence.md)

✅ **SECONDARY CONTACT RUN 2026-08-04 — the standing alternative fails too, and the failure CHANGES
CHARACTER.** Everything before asked whether a split can ARISE. This asked whether one PERSISTS: two
lineages founded at a controlled placement separation (genomes DRAWN and SELECTED on the placement
they produce — placement still never a gene), run forward under ordinary mating.
**Below d≈4 they interbreed and FUSE, exactly as the random-mating null does. At d=8 they do not fuse
at all — ONE LINEAGE IS LOST OUTRIGHT in every seed, while the null at the SAME separation fuses.**
Same demography, same drift, same N: the exclusion is the geometry. ⚠️⚠️ **NOT DRIFT — the lineage is
still lost at N=60.**
⚠️ Every arm ends at ancestry variance 0.000, so a **neutral ancestry tracer** is what distinguishes
fusion from extinction; without it they are the same row. ⚠️ **The hybrid cost is
SEPARATION-DEPENDENT** (1.018/0.997/1.105/1.109 at d=0.5–4, **0.268 at d=8**) — absent exactly where
it would be needed and arriving only once the lineages have already stopped exchanging genes.
**Reproductive isolation does not protect a lineage: once two groups stop competing for MATES they
compete for OFFSPRING SLOTS, and one is excluded.** Placement-mediated mating erases a minority
whether it ARISES, is IMPOSED, or is FOUNDED.
⚠️⚠️ **THE TENSION THIS CREATES:** Platanthera sits in the fusion regime and is consistent, but the
model predicts a pair past the exclusion separation ends with ONE MEMBER LOST — and real orchid
communities contain coexisting congeners. Something outside this model permits that; the obvious
candidate is **more than one pollinator** (roadmap C). ⚠️ The anchor gate blocked this run THREE times
and was right each time (wrong frequency → sign inverted; wrong construction; underpowered n).
[detail](2026-08-04-secondary-contact.md)

⚠️ **Live possibility after five mechanisms: NOTHING in this model pushes a rare placement past
parity**, and placement divergence needs drift plus the measured 19.1% hybrid cost rather than a rare
advantage. That would be a result, but no experiment has established it.

✅ **CLOSED 2026-08-03 by the sixth mechanism. Deception pushes a rare placement past parity in 4 of
8 morphs**, mean lift 3.18× over an identical no-learner arm that never crosses (max 0.679). The
no-learner arm independently reproduces the 0.26 barrier it was not tuned for (0.236/0.249/0.253),
so the harness is measuring the right thing. **The property that mattered is that deception acts on
the animal's MOTIVATION rather than on its encounter rate** — the other five redistribute visits
among plants the animal already wants to visit. ⚠️ It is not a general rare-morph advantage: the
surrounding community must itself be deceptive (a rare cheat among honest flowers is punished), and
it assumes a new placement morph also carries a new signal, which is unmodelled pleiotropy.
[detail](2026-08-03-deception.md)

⬜ _Superseded framing:_ does a LARGER PATCH push `rare/common` past 1.0? The mechanism argues yes — more un-emptied partners, the separate
partner-availability effect already measured in the constancy work (0.471 → 0.550 at fixed
frequency) — and the under-powered arm hints yes. Needs many more draws. After that: clustering that
EMERGES from limited dispersal rather than being imposed, and temporal assortment by flowering time.

⛔ _Superseded framing, kept for the record — **and BOTH of its two candidates have now reported,
in opposite directions**. See the route table at `:219`._ **spatial structure, favoured.** It is the only remaining candidate that
gives a rare morph _neighbours of its own kind_ rather than merely more visits: a new morph's
offspring land near it, so it is locally common while globally rare. That attacks the measured
barrier in the one way neither a second pollinator nor constancy does. Temporal assortment by
flowering time is the other, and is genuinely independent of placement.

⚠️⚠️ **THE FAVOURED ONE WAS REFUTED AND THE OTHER ONE WORKED — and the reasoning above is why the
prediction inverted.** "Offspring land near it, so it is locally common while globally rare" is true
of positions and false of ancestry: founders are scattered at RANDOM, so a foraging neighbourhood is
ancestrally MIXED and shrinking it is simply more drift. Retained ancestry variance FELL
(−0.082 [−0.143, −0.030]). Meanwhile heritable flowering time makes the pool track ancestry, and the
same shrinkage becomes assortative mating: +0.289 [0.158, 0.447].
⚠️ **The paragraph treated "locally common" as if it followed from limited dispersal alone. It does
not — it needs the local pool to be ALIGNED WITH LINEAGE**, which dispersal from random founders does
not supply and a heritable schedule does. That is the correction, and it is the reason the two
results disagree while sharing a mechanism class.

⬜ _Superseded framing, kept for the record:_ `rare/common ≈ 0.26` is the **rare-morph
mate-finding problem** — a novel placement is penalised because there is nobody to exchange pollen
with, not because it is badly built. So the mechanisms to try are the ones that let a rare morph
**meet itself**: spatial structure / limited dispersal, **pollinator constancy** (real bee behaviour,
and it converts the rare morph's penalty directly into an advantage), or temporal assortment by
flowering time — an assortment axis genuinely independent of placement. Then hybrid zones across
generations (the F1 test has no backcrossing).

### C. Widen the table, which is where value scales — ✅ five classes shipped, table complete

Groundwork §4.6: rows are mechanism classes, columns are pollinator body plans. v1 implements
**one cell**. Value scales with how many classes are implemented, not with render quality.
Nearest, in order of cheapness:

- ✅ **carryover between visits** — BUILT 2026-08-01, `sim/carryover.js`. Packaging efficiency rises
  4.1% → 35.7%; last-male advantage emerges from stacking rather than being imposed. ⚠️ **Numbers
  corrected 2026-08-02 and one conclusion retracted**: re-run after the head-cap fix, carryover
  raises coexistence **only where species still overlap** (4→5), and is **flat at 7** in the
  already-separated community — the earlier "8→9 separated, 3→5 overlapping" was an artefact of the
  old contact model. [detail](2026-08-01-carryover-result.md). ✅ **Now inside the evolution loop
  too** (v2) — and it
  changes ecology but **not, demonstrably, evolution**: no effect on evolved species count survives a
  strict paired measurement, because selection drives overlap to zero under both transfer models and
  carryover's benefit is worth nothing once nothing overlaps.
  [detail](2026-08-01-v2-result.md)
- ✅ **reward currency** — BUILT 2026-08-01, `sim/reward.js`. Harder & Thomson's saturating gain
  curve reproduced (1.75× fall), and ⚠️ the mechanism is **finite stigma capacity, not grooming** —
  grooming only sets the level. The pollen dilemma quantified: **nectar's best schedule is 4×
  more gradual and yields 2.2× the male fitness**, because a pollen-rewarding flower must spend
  gametes to advertise. ⚠️ Castellanos' two-sided prediction reproduces in **3 of 4 cells**;
  frequent+efficient robustly fails and three of my explanations for it were refuted — the model
  gives gradual dispensing no cost except stranding. [detail](2026-08-01-reward-result.md)
  ✅ **Now 4 of 4** — see the next item.
- **more body plans as first-class** — check 2 showed the 2-D advantage runs **2.06–2.47×** across
  four animals at a matched pool size, clearing 2× on every one. ⚠️ The original "largest for small
  compact ones" did **not** survive the head-cap re-run — the default bee leads, not the small
  slender plan. Only the coarse compact-above-elongated pattern holds. ⚠️ **And the variation is
  about half what was claimed**: at unmatched pool sizes it read 2.1–3.0× (~1.5× modulation); at a
  common N = 337 it is ~1.2×. Still a real parameter, but most of the apparent spread across animals
  was the spread in how many candidates each animal's pool contained.
  [detail](2026-08-03-checks-rebaseline.md)
- ✅ **cost of prolonged presentation** — BUILT 2026-08-02. Pollen senescence in the anther and
  floral upkeep while open, both schedule-selective (a simultaneous presenter's anther residence is
  zero, so senescence costs it exactly nothing). **Castellanos now reproduces 4 of 4** across a wide
  plateau — but ⚠️ **not for the reason the roadmap predicted**. A cost alone provably cannot repair
  the table: gradual's margin was _larger_ in the cell meant to reverse, so any regime-independent
  cost breaks frequent+wasteful (m = 0.593) before it fixes frequent+efficient (m = 0.559), and
  neither cost exceeded 3/4 alone. The rest was **my own artefact** — the carry cap bound in exactly
  one cell of the four, suppressing simultaneous presentation by 44%, because `cap = 140` was
  calibrated for an 8-grain deposit and then reused across a sweep running to 60.
  [detail](2026-08-02-presentation-cost-result.md)
- ✅ **pollen packaging** — BUILT 2026-08-02 as roadmap E's mechanism; solid pollinia vs granular
  monads, calibrated against 228 species. [detail](2026-08-02-dispersal-unit.md)
- ✅ **deception** — BUILT 2026-08-03, `sim/deception.js`. Rescorla-Wagner associative learning over
  a ring of signal space with a stimulus-generalisation gradient; a cheat advertises and pays
  nothing, and what limits it is what the animal has LEARNED. **Negative frequency-dependence is an
  OUTPUT, not an assumption** — the literature is split (Gigord et al. 2001 measured a rare-morph
  advantage; the same group found no diversity advantage in 2007; avoidance learning is
  short-lived per Whitehead & Peakall 2012), so building it in would have assumed the answer.
  A rare cheat gains up to **2.01×** against a measured null band of 0.991 ± 0.028, the effect
  survives a 3-visit memory half-life, and **Internicola & Harder reproduces** — a cheat's advantage
  falls 1.69× → 0.42× as its neighbours become honest. ⚠️ A perfect memory is WORSE than a leaky one
  (saturated aversion generalises onto the rare morph too), so the mechanism has an optimum memory
  length. [detail](2026-08-03-deception.md)

### D. Close the head-tip boundary artefact ✅ _found and closed 2026-08-01_

The head is now a rounded cap rather than a coordinate edge: contacts ahead of the spine end are
relabelled onto it at s = −r0·(u·fwd)/L, and the along-body histogram gained six bins ahead of zero
**at the same width**, so species that never touch the cap keep numerically identical histograms.
38.5% of sampled morphologies touched that boundary.

**The headline survived and one conclusion did not.** 2-D placement supports 3.0× a 1-D gene
(was 3.3×); the τ→0 ceiling moved 14 → 16 and the evolved community 9 → 8.3, so evolution reaches
52% rather than 64%. Separately, the fix exposed that **CTRL-2D-ideal was not a ceiling** — L2 beat
it, because the control gave every blob the _median_ precision while 71 of 309 real species are
tighter than median on both axes. With the control drawing precision pairs from the pool's own
distribution, L2 sits at **39% of the ideal surface, not 88%**. That is the substantive correction.

My own leading hypothesis — that φ was numerically degenerate for pinned contacts — was **refuted by
the probe**: `|perp|/|w|` measures 0.87–0.99, not the vanishing value I predicted.
[detail](2026-08-01-head-cap-result.md)

✅ **DECIDED 2026-08-02: precision is a second heritable gene in L1, bounded by what real
morphologies achieve** (s sd 0.0077–0.0670, phi sd 0.0788–0.9655 rad). Granting direct genetic
control of WHERE pollen goes while withholding control of HOW TIGHTLY is an arbitrary handicap, and
the whole claim rests on L1 being a steelman. The bound is load-bearing: unbounded precision packs
unlimited species, which is not a fact about dimensionality.

⚠️⚠️ **It costs most of the result.** The evolved 2-D advantage falls **3.07× → 1.24×** (L1 2.7 → 6.7;
L2 unchanged at 8.3). Two consequences that must not be buried: **L1's ceiling constant is now stale**
(it reports 111% of a bound computed under the old assumption — the "ceiling must be re-checked every
time" constraint firing again), and **the static ablation's 3.0× is subject to the same objection**
and has not been re-measured. Implemented on two loci that were previously INERT for L1, so L2's
numbers provably cannot move — verified by the suite. [detail](2026-08-02-l1-precision-decision.md)

**⚠️ SUPERSEDED — all three figures in the paragraph above are pre-re-baseline.** Both numbers were
measured on the saturating histogram, which the loop was still using. On the continuous metric the
evolved advantage is **0.92× (a tie)**, the stale ceiling constant is **recomputed and now asserted**
rather than commented, and the static ablation **has** been re-measured at 2.5×.
[detail](2026-08-02-continuous-metric-rebaseline.md)

### E. Replace overlap with a transfer rate — 🟡 three of four targets met

Everything rests on _placement overlap_, a proxy. The gate is Johnson & Harder 2023
(10.1098/rspb.2023.1148, 228 species) — ⚠️ **open access, not blocked as this roadmap previously
recorded** — and it is a CROSSED pair, which is why it can fail: removal <45% for solid pollinia
against >80% for granular monads, while transfer efficiency runs 27.0% against 2.4%.

✅ **BUILT 2026-08-02** (`dispersalUnit` in `sim/carryover.js`). One mechanism — a pollinium is one
solid object — with `viscidium` selected on the REMOVAL axis alone, so the transfer figure is a
prediction. Removal: 99.9% granular, 27.0% pollinia, both targets met. Transfer decomposes at matched
removal as granular 7.1% → coherence 10.3% → not-harvestable 18.6% → adhesion **27.1%** against the
measured 27.0%.

⚠️ **The monad side is still 2.9x too generous** (7.1% vs 2.4%), so absolute delivery magnitudes are
still not quotable as rates. What IS calibrated is the contrast between dispersal units.
⚠️ **Retires a caveat repeated in four documents**: "3–6% against Harder & Thomson's 0.6%, five to ten
times too generous" compared against ONE species; PTE is the same quantity and the 228-species monad
mean is 2.4%, so the discrepancy was always 2.9x.
⬜ Next here: **sectile pollinia**, the intermediate condition — packaged but not solid, and grouped
with monads on removal — which is the sharpest remaining test.

⚠️ **RUN 2026-08-03, AND THE MECHANISM DOES NOT REACH IT.** Two corrections to the framing above:
sectile groups with monads on **both** axes, not just removal ("massula and monad dispersal with
higher removal _and lower transfer efficiency_ ... was not expected a priori"), and the structure
worth predicting is a **split** — on net export sectile groups with the SOLID pollinia while monads
sit alone and worst. Selected on carryover length so transfer stayed a prediction, sectile lands at
**6.9%, i.e. −3% of the way** from monad to pollinium where the measured unit sits at 67%; the export
grouping fails too. **The negative survives a hundredfold resolution control** — transfer depends on
the massula COUNT alone and is identical at pools of 60, 600 and 6000, so grains-per-massula is
irrelevant to transfer here. What binds is a **tension between the two axes**: carryover pushes the
count up and transfer falls as it rises, so the model cannot match sectile's carryover and its
transfer at once. Points at a missing mechanism — massula adhesion, or the pollinarium bending that
places successive massulae on successive stigmas — rather than at a tuning failure.
[detail](2026-08-03-sectile.md)
[detail](2026-08-02-dispersal-unit.md)

### F. Renderer, only where it serves the above ⬜

Known defects: flowers read as long trumpets rather than compact blooms (that is the model's own
aspect ratio, so it is a biology change); near petals occlude the mouth at some rotations; the
flight arc has no real deceleration into a hover. **Not a priority** — the event lands, and the
project's value scales with mechanism classes rather than polish.

## Instrument debt — open, and it is load-bearing

⚠️⚠️ **THIS SECTION EXISTS BECAUSE THE ROADMAP TRACKED MECHANISMS AND NOT MEASUREMENT.** Almost every
headline result in this project is a NEGATIVE, so what is actually being sold is that the negatives
are trustworthy — which makes the instruments, not the findings, the load-bearing part. An external
audit on 2026-08-25 found defects in five of them. All were LATENT except the sectile one; none has
been shown to corrupt a published result; every one would have bitten the first time this project
reported a positive.

| item                                                                                           | state                                                                                                                                                      |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`v2` result is a snapshot of a superseded model** (was: "not reproducible")                  | ✅ DIAGNOSED — Round 2 reproduces bit-exactly at `a9e45d4`; Round 3 does not                                                                               |
| sectile "flowers serviced" counts deposition objects, not distinct flowers — calibration wrong | ✅ FIXED 2026-08-28 — `servicedPairs`; NO massula count reaches the 3-20 target (max 1.5), so the old selection was an artefact. Transfer result unchanged |
| gates consulted only on the negative path (`selfing.js:419`, +3 more sites)                    | ✅ FIXED @a084f5b — `sim/verdict-gates.js`; the positive text is unreachable except through `claim()`                                                      |
| `twoClusterSeparation` unbounded in majority tightness; `minorityFrac` printed, never gated    | ✅ FIXED @11b9a5c — returns `gap`/`dispersion`; `experiments/ibm.js` gates the minority against the null                                                   |
| no semantic test of `fateOf` — the mutation's only red light is a staleness tripwire           | ✅ FIXED @11b9a5c — `tests/fate-of.test.js`; the HELD/FUSED swap dies on 7 tests, 6/6 mutants killed                                                       |
| `seasonSplit` maximised on fixation                                                            | ✅ FIXED — replaced by circular moments R1/R2                                                                                                              |
| paired bootstrap quoting zero-width intervals over a constant                                  | ✅ FIXED — degeneracy detected, exact binomial bound reported instead                                                                                      |

⚠️⚠️ **RESOLVED 2026-08-25 — AND THE DIAGNOSIS ABOVE WAS WRONG.** It is true that
`experiments/v2.js` has `SEEDS = [1,2]`, `visits: 3000` and no interval code, and true that no
committed code ever produced the published tables — an exhaustive scan of all 655 git objects
finds `18000` in two Markdown blobs and nowhere else. But **the numbers are genuine.** Against
`sim/` pinned at `a9e45d4`, at **120 generations** (the committed runner hardcodes 250) with
seeds 1–3, Round 2 reproduces **bit-exactly** on four of five rows. The real defect is that the
model moved underneath the result: 8 commits since have changed `sim/carryover.js`, 3
`sim/evolve.js`, 3 `packing.js`/`placement.js` — incl. `0af4ba7` (transfer-rate recalibration)
and `6b7c8e1` (continuous overlap metric). **A result is not unreproducible merely because
today's code disagrees with it; pin the model version before concluding that.**

Three defects remain, recorded in the document's own Correction section:

- ⚠️⚠️ **The published intervals are z-intervals at n = 8.** Under the correct t (df = 7) the
  6,000 interval is `[-2.18, +0.18]` and does **not** exclude zero — so the document's entire
  "excluded zero by 0.02, then did not replicate" narrative describes an event that never
  happened. A fourth measurement artefact, inside the document written to warn about three.
- **The Round-2 table mixes run lengths** — its `v=6000` row is a 250-generation run printed
  beside a 120-generation mean-field row.
- **Round 3 does not reproduce** under any of four configurations tried; best fit 6 of 8 diffs.

⚠️ The conclusion — "no demonstrated effect on what evolves" — survives all of it; every
correction pushes toward less evidence, not more. ⚠️ For contrast, `docs/2026-08-03-ibm.md`
REPRODUCES exactly from its committed runner, so this was one specific failure and not systemic.

⚠️ **A GATE CHECKED ONLY ON THE NEGATIVE PATH IS NOT A GATE.** `selfing.js:419` consults
admissibility and attribution only inside the "effect not established" branch; the green branch at
`:431` is reached without either. The comment two lines above says the gates are applied rather than
reported and walked past — true of the branch it sits in, false of the success branch. Same shape at
`reachability.js:175/:224`, `two-pollinator-coexistence.js:314`, `secondary-contact.js:506/:572`.

⚠️ **AND THE ONE TEST THAT FIRES ON A `fateOf` MUTATION CARRIES NO INFORMATION.** Swapping the
`HELD` and `FUSED` returns leaves 186 of 187 green; the single failure is
`tests/browser-bundle.test.js` reporting the bundle stale, which fires identically on a no-op
comment appended to `sim/ibm.js`. A red light that cannot distinguish an inverted classifier from a
comment is worse than no test, because it invites the reader who checks and stops.

⚠️⚠️ **AND A NEW INSTRUMENT CLASS, FOUND BY MUTATION RATHER THAN BY READING (2026-08-28).** Three
mutants survived the conserved-display guards, and all three were real.

- **An inertness guard that covered only the regime where its change is invisible.** Forcing
  conservation ON regardless of its flag left the byte-identity test GREEN, because every cell in
  that test was **equal-width** — which is exactly the regime the accompanying no-op theorem says
  conservation cannot move. **The guard and the theorem it sat beside shared one blind spot**, so
  the test could confirm the theorem and never notice the flag being ignored.
- **An unreachable guard whose test's name claimed to exercise it.** `occ[i] === 0` holds exactly
  when a plant is in flower nowhere, so the in-flower predicate is false at every slice and the
  division it guards never runs. Deleting the guard killed nothing. The occupancy count and the
  display map are now single-sourced through one `inFlower`, making the unreachability structural.
- **A `<=` → `<` boundary mutant, surviving for the second time in this project.** Every test drew
  blooms at random, where an exact hit on a slice centre has probability zero — while the boundary
  decides the published occupancies. Same repair as `fateOf`: **dyadic rationals land ON the
  threshold**, and both sides get asserted.

⚠️⚠️ **AND THE FIRST OF THOSE THREE RECURRED ONE COMMIT LATER, INSIDE THE TEST WRITTEN TO CATCH IT
(2026-08-31).** The repaired no-op test swept `width` over `[1.0, 0.12, 0.5]` with `slices` **held at
8** — and all three of those widths sit in the invisible regime at `S=8` for three DIFFERENT reasons
(`1.0·8 = 8`, `0.5·8 = 4`, `0.12·8 = 0.96`). The invariance depends on the **product** `w·S`, so the
test swept the stand-in and pinned the axis that decides. Job 3572's fixed-narrow control caught it
at `S=16` and `S=32`. **Naming a failure mode in a document does not stop it reappearing in the next
artefact, because the axis it hides on changes each time** — the first instance hid on
_equal-width_, the second hid on _S_.
✅ The replacement asserts **both directions from the live predicate**: occupancy constant ⇒ run must
be byte-identical, occupancy varying ⇒ run **must move**, with the prediction computed from
`I.ringDist` rather than hardcoded and a degeneracy guard requiring ≥2 cells on each side. **Seen to
fail**: a mutant dividing by the constant `S` instead of `occ[i]` — scale-invariant, hence a no-op
everywhere, hence welcome under the old assertion in every cell — is now killed. ⚠️ The lesson that
generalises is that **a no-op test needs a cell where the thing is NOT a no-op**, or it cannot tell
"correctly neutral" from "never ran".

⚠️⚠️ **AND THE HARNESS ITSELF CORRUPTED FOUR MEASUREMENTS.** It rewrites `sim/ibm.js` in place;
four runs launched during its window read a mutated model. **The tell was a result that was too
clean** — a conserved and an unconserved run agreeing byte-for-byte on every number, which is what
a flag-disabling mutant produces and is not otherwise plausible. **Nothing may be run against the
model while a mutation loop is live**, and the restore must be an in-memory copy over a committed
baseline, never `git checkout`.

## Standing constraints

- **Placement must never be a gene.** Genes are shape; placement is computed. The moment that
  breaks, the geometry is ornament and the ablation result is void.
- **Every null ships a positive control.** Three separate inversions have already been caught this
  way — the packing harness, the L0/L2 pair in v1, and the seed control that killed an apparent
  herkogamy asymmetry.
- **Never compare an evolved outcome to an optimiser's bound at a tolerance the evolutionary
  process does not use.** Cost one wrong headline already (30% vs the true 64%).
- **A single-seed assertion about a stochastic quantity can be green and backwards at the same
  time.** A test asserting that coherence is a liability at matched removal passed on one seed; over
  twelve seeds the effect is a ~1.6x advantage in the opposite direction, and it had already
  propagated into an experiment's conclusion text. Seed-average anything directional.
- **A new mechanism needs a limiting case or a deterministic reference with a known right answer,
  and any effect it reports must survive a stricter measurement before it is believed.** Three
  measurement artefacts impersonated results on 2026-08-01 alone: a 10× wrong pollen-limitation
  floor, an 8.0→7.0 "reversal" that was bout noise, and a paired interval that cleared zero by 0.02
  and then swallowed it when the budget tripled.
- **A ceiling arm must be checked against the measured arm every time it is used, not once when it
  is written.** CTRL-2D-ideal read as a valid ceiling for as long as L2 happened to sit under it,
  and only announced itself as broken when a _different_ fix pushed L2 past it. If the measured arm
  can beat the bound, the bound is a lower bound wearing the wrong label.
- **A constant calibrated under one regime must be re-checked by any sweep that varies that
  regime.** `cap = 140` was chosen when a visit deposited 8 grains, then reused across a dispensing
  sweep running to 60, where it bound on the first visit and decided a published cell. The sweep
  varied exactly the quantity the constant had been sized against.
- **Two loss mechanisms sharing one counter hide whichever binds.** Cap truncation was added to
  `groomedOff`, so a mechanism destroying 451,299 grains was indistinguishable from ordinary
  grooming. Give each loss its own counter; a mechanism that cannot be seen separately cannot be
  ruled out.
- **Fixing a shared model obliges a re-run of everything built on it.** The head-cap fix moved every
  downstream number, but only the two experiments re-run at the time were annotated. The carryover
  result kept its pre-fix figures — and one of its conclusions — for a day, and was caught only
  incidentally. A superseded contact model supersedes every result that used it.
- **An empty bin is not a hole — a real gap is STATIONARY.** Finite sampling leaves gaps in sparse
  tails, so a single-sample verdict found "discreteness" in three of four body plans that have none.
  The test is whether the gap stays in place when the sample grows: one vanished, one migrated with
  its tail, and only the constructed control held still. Any claim that something is ABSENT from a
  sampled set needs the same treatment — absence at one sample size is a fact about the draw.
- **A positive control can be blind to the filter that consumes it.** The pinched body plan proves
  the probe can find a gap, but a stability filter hard-wired to accept would keep every artefact,
  invert the verdict, and leave that control passing. Whatever sits DOWNSTREAM of a control needs its
  own check — and confirm it by breaking it, not by reasoning that it works.
- **A shuffle control cannot falsify a claim when one arm has zero items to permute.** Hybrid-gap
  occupancy survived its own label permutation because `one lost` replicates contain exactly zero
  hybrids, so the statistic could not move however the labels were shuffled — the control was
  structurally incapable of firing. Pre-check that both arms carry non-zero mass in the permuted
  quantity. The companion tell is cheap: **if a measure and its own superset return an identical
  p-value, they are one measure**, and the narrower one is adding nothing.
- **Assert bit-identity against the model's own entry point before driving its loop yourself.**
  `run()` rebuilds its rng from the seed even when handed a founded population, so an experiment that
  carried the founding stream forward was running a different model in silence. The no-intervention arm
  must reproduce `run()` bit-for-bit before any other arm is believed.
- **An intervention that rescues an outcome by supplying the thing being competed for has proved
  nothing about the mechanism.** Forcing ancestry balance prevents competitive exclusion, but it is a
  demographic subsidy — near-tautological on its own. What made it worth keeping is the part that could
  have gone the other way: the rescued lineages stayed DISTINCT rather than merging. State which half of
  such a result is tautological before quoting the p-value.
- **Matching a distribution by its median is not matching it.** The synthetic arms were built at
  median precision under a rule that said precision must be matched; a quarter of the real pool was
  sharper than any blob they contained. Match the distribution, or state plainly that you matched
  one moment of it.
