# #55 — the premium cancels a destabilising force, and that cancellation has a floor

_2026-09-02. Registered in [the pre-registration](2026-09-02-rare-advantage-prereg.md) before the
run. Follows [#54](2026-09-02-bloom-switch.md), which returned NO VERDICT._

## The result in one paragraph

The per-slice premium creates a large, graded per-capita **visit** advantage for whichever
lineage is rarer — 3.5x at minority frequency below 0.1, falling smoothly to 1.08 at parity —
and arm B has none of it, reading 0.99 to 1.02 in every bin. But that advantage does **not**
become a fitness advantage. What it does instead is **cancel a destabilising force**: without
the premium a lineage that drifts rare gets rarer still (positive frequency dependence, clean
and monotone), and with it that force is flattened to approximately zero. The premium does not
push a minority back up; it stops the system from pushing it down. Below a minority frequency
of about 0.1 even that protection fails. Feeding the measured per-generation selection and the
measured effective population size into a two-type Wright-Fisher, **with no free parameters,
reproduces the observed HELD in both arms**.

## What #52-#54 were actually measuring

`anc` is documented as "the standard admixture tracker" (`sim/ibm.js:431-449`), and it exists to
separate three outcomes that all look like "the split went away": FUSION, EXTINCTION,
PERSISTENCE. The tracker was built to answer that question and nobody had read the answer off
it. Measured on the instrumented build, 40 seeds, 38 founded, 39,900 matings per arm:

| quantity                                       | arm A (premium on) | arm B (premium off) |
| ---------------------------------------------- | ------------------ | ------------------- |
| **true lineage crosses** (both parents pure)   | **2**              | **3**               |
| matings whose parents differed in `anc` at all | 2                  | 842                 |
| hybrid plant-generations                       | 2                  | 881                 |
| largest number of distinct `anc` values ever   | 3                  | 29                  |
| runs ending with one lineage gone              | 27/38              | 36/38               |
| HELD                                           | 11/38 = **0.289**  | 1/38 = **0.026**    |

Both HELD figures reproduce #52-#54 exactly, so this is the same experiment rather than a
near-miss of it.

⚠️ **CORRECTION TO AN EARLIER DRAFT OF THIS PAGE, which claimed the arms "differ 400-fold in
gene flow".** They do not. Hybridisation is equally rare in both: **2 crosses in arm A against
3 in arm B**, out of ~39,900 matings each. The 842 figure is the looser "parents differ in
`anc` at all", which also counts hybrid x pure matings and therefore counts the CONSEQUENCES of
a cross, not the crosses. The runner reports both definitions side by side precisely so this
could not be quoted one way and read the other.

What genuinely differs is what happens **after** a cross: 2 hybrid plant-generations in arm A
against 881 in arm B. ⚠️ With only two and three founding events, that difference is not
attributable — establishment failure and unlucky timing are indistinguishable at n=2. It is
reported as an observation, not a mechanism.

So the tracer stays a two-valued lineage label in arm A, where ancestry variance is `p(1-p)` in
the lineage frequency and can fall only by **exclusion**. In arm B, admixture does accumulate
(29 distinct `anc` values), so it loses ancestry variance by both routes.

That reframes the two-step. It was written as

> premium maintains the flowering-time polymorphism -> the polymorphism assorts -> assortment
> retains ancestry

with "assorts" doing unexamined work. Bloom separation has **two** consequences, not one, and
they are one cause seen twice:

> premium keeps the lineages in **separate bloom slices** -> **(a)** they seldom co-flower, so
> pollen rarely crosses, **and (b)** each lineage's slice draws a FULL flat budget, so whichever
> lineage is rarer gains per capita

Route (b) is what #52-#54 never measured, and it is what the rest of this page is about.

## Controls

38 founded of 40 seeds in each arm; `sim/ibm.js` carrying the `logMatings` observation only.

| id     | control                                                   | result                                                      |
| ------ | --------------------------------------------------------- | ----------------------------------------------------------- |
| **C1** | arm A HELD on seeds 1..40                                 | 0.289 vs 0.289 **PASS**                                     |
| **C2** | arm B HELD on seeds 1..40                                 | 0.026 vs 0.026 **PASS**                                     |
| **C3** | visits vs slice crowding, the flat budget's own signature | A **-0.431**, B **+0.017**, RM **-0.617**                   |
| **C4** | visits spent per generation                               | A 15,956 vs B 10,135, ratio **1.574** — reported, see below |
| **C5** | lineage counts exhaust the population                     | **PASS**                                                    |
| **C6** | the primary can separate the arms at all                  | separation 0.109, pooled sd 0.169, **d = 0.64 PASS**        |

**C3 is the control that earns its keep.** It needs no lineages at all: under a flat per-slice
budget the visits in a slice are shared among whoever flowers there, so a plant in a crowded
slice should collect fewer. It is strongly negative in **both** premium-on arms (A -0.431, RM
-0.617) and flat in the premium-off arm (B +0.017), so it tracks the **allocation rule** and
not the mating system. The `randomMating` arm could not carry the primary statistic — random
mating dissolves the lineages, leaving no minority to measure, so it contributes only 6 usable
seeds — and C3 is what replaced it.

## Q1 — the advantage exists, in visits, and only under the premium

Per-capita visit ratio, minority over majority, by minority frequency. Intervals bootstrap over
**seeds**, not generations, since generations within a seed are one trajectory:

| minority freq | arm A (95% CI)           | arm B | arm RM |
| ------------- | ------------------------ | ----- | ------ |
| < 0.1         | **3.516** [2.545, 4.662] | 0.989 | —      |
| 0.1-0.2       | **1.865** [1.684, 2.068] | 0.994 | 1.037  |
| 0.2-0.3       | **1.222** [1.093, 1.396] | 1.024 | 0.856  |
| 0.3-0.4       | **1.238** [1.082, 1.415] | 1.010 | 1.265  |
| 0.4-0.5       | 1.082 [0.988, 1.162]     | 1.001 | 0.878  |

Arm A's interval excludes 1 in every bin below 0.4 and the effect is graded — largest exactly
where the lineage is rarest. **Arm B reads 0.99 to 1.02 across the whole range**, which is as
clean a null as this project has produced.

⚠️ This frequency dependence is **emergent**. `allocExponent` is `null` — the explicit
rare-bias knob from #27 is off — so no rule anywhere in the model mentions rarity. It falls out
of giving every occupied slice the same budget.

## The advantage does not convert into fitness

Realised per-capita offspring ratio, same bins:

| minority freq | arm A (95% CI)           | arm B | arm RM |
| ------------- | ------------------------ | ----- | ------ |
| < 0.1         | **0.477** [0.130, 0.732] | 0.255 | —      |
| 0.1-0.2       | 1.242 [0.988, 1.451]     | 0.483 | 0.000  |
| 0.2-0.3       | 1.108 [0.964, 1.264]     | 0.680 | 0.000  |
| 0.3-0.4       | **1.211** [1.048, 1.347] | 0.984 | 0.687  |
| 0.4-0.5       | 1.098 [0.965, 1.203]     | 0.985 | 0.793  |

Only the 0.3-0.4 bin excludes 1 from above; the rest straddle it. So a **fitness advantage
above the floor is not established**. What is established is the **floor itself**: at minority
frequency below 0.1 arm A's fitness ratio is 0.477 with an interval excluding 1, and this is
where the visit advantage is at its largest, 3.5x.

The model's own documentation names the likely reason. `visitsTo[i]` is "how many times the
animal landed on plant i — **NOT** how much outcrossed pollen moved. The two differ exactly by
the geitonogamy term" (`sim/ibm.js:2058`). A rare, bloom-isolated lineage is visited generously
and has almost no co-flowering conspecific to be visited _from_. **This is not tested here**;
[#56](#what-comes-next) is the test.

## What the premium actually does: it cancels a destabilising force

The clearest table in the run. A **fixed** lineage is followed across the whole frequency range
— no selecting on who is currently the minority, so no regression-to-the-mean artefact — and
absorbed states are excluded because a lost lineage contributes a hard zero forever:

| p(lineage 0) | arm A E[dp] | arm B E[dp] |
| ------------ | ----------- | ----------- |
| 0.0-0.1      | -0.0179     | **-0.0400** |
| 0.1-0.2      | +0.0064     | **-0.0556** |
| 0.2-0.3      | -0.0131     | **-0.0565** |
| 0.3-0.4      | +0.0222     | **-0.0163** |
| 0.4-0.5      | +0.0018     | **-0.0067** |
| 0.5-0.6      | +0.0344     | **+0.0585** |
| 0.6-0.7      | -0.0046     | **+0.0403** |
| 0.7-0.8      | -0.0122     | **+0.0958** |
| 0.8-0.9      | -0.0140     | **+0.0778** |
| 0.9-1.0      | -0.0200     | **+0.0367** |

**Arm B is monotone and unambiguous: negative in every bin below 0.5, positive in every bin
above it.** Whichever lineage drifts rare gets rarer — positive frequency dependence, which is
runaway exclusion, and it is why 36 of 38 arm-B runs end with a lineage gone.

**Arm A flattens that to approximately zero below 0.5** and turns mildly negative above 0.6.
The premium does not supply a restoring force that pushes a minority back up; it **removes the
force that was pushing it down**. Stated as a mechanism sentence:

> the premium does not rescue a rare lineage — it stops the common one from running away

That also explains #54's non-bankability without further assumption. A cancelled force leaves
no residue: switch the premium off and the destabilising force returns immediately, at whatever
frequency the population happens to sit at, with nothing banked.

⚠️ Arm A's own bins hover around zero rather than showing a clean restoring pattern, and the
overall `corr(p, dp) = -0.035` against a standard error of about 0.044 is **within noise**. The
claim is cancellation, not restoration, and the arm-B contrast is what carries it.

## Q3 — sufficiency, with no free parameters

A two-type Wright-Fisher driven by the measured `w(p)` and the measured `Ne`, both taken from
within-run quantities, run to 35 generations:

| arm | measured Ne (census 30) | transitions | predicted HELD | observed | band  | result     |
| --- | ----------------------- | ----------- | -------------- | -------- | ----- | ---------- |
| A   | 13.2                    | 509         | 0.192          | 0.289    | ±0.10 | **WITHIN** |
| B   | 11.7                    | 268         | 0.003          | 0.026    | ±0.05 | **WITHIN** |

Both arms land inside their registered bands, arm A near its edge. The measured per-generation
selection plus the measured drift account for the observed outcome in both arms, which is what
sufficiency means here — and it is the first time in this arc that a mechanism has been shown
to be quantitatively enough, rather than merely present.

## Q2 — underpowered, as flagged before the run

| bloom-segregation bin | mean r-1 | n   |
| --------------------- | -------- | --- |
| 0.00-0.25             | +0.312   | 2   |
| 0.25-0.50             | -0.121   | 46  |
| 0.50-0.75             | +0.229   | 58  |
| 0.75-1.01             | +0.376   | 414 |

The direction fits H1 (mediated — the advantage concentrates where the lineages flower apart),
but **414 of 520 observations sit in the top bin**: under the premium the lineages are almost
always well separated, so the within-arm contrast rests on very few low-segregation
generations. **No verdict on Q2.** Separating H1 from H2 needs a design that varies segregation
independently rather than waiting for it to vary on its own.

## Limitations, stated rather than buried

1. **The arms do not spend the same budget.** A flat per-slice budget spends a full allowance on
   every occupied slice, so arm A spends 1.574x arm B's visits. The visit ratio `r` is a
   within-arm minority/majority ratio and is therefore **scale-invariant and immune**; realised
   fitness `w`, HELD and Q3 are **not**. A budget-matched arm via `opts.visits` is the first item
   of #56.
2. **Q2 has no verdict** (above).
3. **The hybrid-persistence difference is an observation, not a mechanism** — n = 2 and 3
   founding crosses.
4. **The floor's cause is untested.** Geitonogamy and mate limitation are the candidate; #56 is
   the discriminating experiment.
5. **The primary statistic and mean fitness disagree in sign.** P(w>1) is 0.335 in arm A —
   below half — while mean `w` exceeds 1 in four of five bins, which a right-skewed ratio does
   routinely. They answer different questions, and #54's lesson is that disagreeing summaries
   mean something is unresolved. Here there is an adjudicator: Q3 is driven by the mean and
   reproduces the observed HELD in both arms, which is evidence that the mean is the
   outcome-governing summary rather than the flattering one. The registered A-vs-B comparison
   passes on the primary as well (0.335 vs 0.226, C6 d = 0.64).

## What comes next

**#56 — is the floor a count or a frequency?** At N=30 a minority frequency of 0.1 IS three
plants, so mate limitation and frequency dependence are confounded. Running N0 in {20, 30, 60}
separates them: a mate-finding floor stays at ~3 plants and therefore MOVES to p ~ 0.05 at
N=60, while a frequency-based floor stays at p ~ 0.1. The predictions are opposite in `p` and
identical in count, so unlike #53 and #54 the design cannot return ambiguous. It also carries
the budget-matched arm, and a direct measurement of per-lineage outcross pollen receipt from
the transfer matrix `T`, which would test the geitonogamy explanation head-on.

⚠️ Nothing in #52, #53 or #54 is overturned. Every HELD number stands. What changes is the
mechanism sentence attached to them.

## The #54 sweep, re-derived from its archive

Quoted here from `docs/data/2026-09-02-bloom-switch-sweep-40seed.json.gz` rather than from the
earlier write-up, because a remembered number is not a verified one:

| k (premium on for k gens) | 0    | 5    | 10   | 15   | 20   | 25   | 35       |
| ------------------------- | ---- | ---- | ---- | ---- | ---- | ---- | -------- |
| HELD                      | .026 | .000 | .026 | .000 | .026 | .053 | **.289** |
| ancVar/0 (last)           | .012 | .000 | .015 | .000 | .021 | .053 | .247     |
| R1 (last 5)               | .941 | .946 | .927 | .944 | .877 | .766 | .457     |

Flat at arm B's level until k=25: twenty-five of thirty-five generations of premium leave a
population indistinguishable from one that never had it. Under the reading above this is what a
frequency-protecting mechanism must look like — the protected quantity is a frequency, and a
frequency has no memory beyond its present value.

## A one-generation misalignment in #54, quantified

`res.blooms` is built from the **input** population (`sim/ibm.js:1168`) — the parents — while `v`
is measured on `res.pop`, the offspring. So `R1[g]` and `v[g]` describe different cohorts, and
`v[g]` pairs with `R1[g+1]`. #54 compared them unshifted. Recomputed both ways on the archived
272-seed trajectories, changing nothing else:

| R1 index       | mean Delta                   | median | sign test |
| -------------- | ---------------------------- | ------ | --------- |
| as #54 ran it  | +0.0568 [-0.090, +0.204]     | -0.394 | 91+/181-  |
| cohort-aligned | **+0.0091** [-0.137, +0.155] | -0.426 | 89+/183-  |

The first row reproduces #54's published headline to the digit, which is an independent check on
that result. Correcting the alignment collapses the mean by ~84% to essentially zero and leaves
the median and the sign test where they were.

**#54's NO VERDICT is unchanged, and the reason for it is sharpened rather than weakened**: it
rested on estimator disagreement and on the discriminator sharing the artefact's signature, and
after correction the disagreement is starker — a mean of 0.009 against a median of -0.426 with
sign p < 0.0001.

## Why the pulse design was abandoned

#55 was filed as a pulse experiment, to separate a one-stage filter from a two-stage cascade by
the shape of the response. Four instruments were built for it and **every one failed on its own
control, before any compute was spent**:

| instrument                                       | why it was dropped                                                              |
| ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `t90/t50` against the textbook 3.32 vs 2.32      | the in-system one-stage reference R1 read 2.57, so the bands do not apply here  |
| `S = (t90-t50)/(t50-t10)`, shift- and scale-free | control passed, but bootstrap put S(ancestry) anywhere in [2.55, 6.21]          |
| whole-curve least squares, M1 vs M2              | R1 — which must prefer M1 — preferred M2 in 63% of resamples                    |
| bounded per-seed slope score                     | endpoints 0.746 vs 0.687; and its floor censored 63-93% of seeds on the outcome |

The common cause is not the estimators. Under a single step the premium and the polymorphism are
**collinear for the whole trajectory**, so the two hypotheses differ only in fine curve shape,
which noise swamps. Counting #53 and #54 that is six attempts in one mechanism class. The
project's own rule — two failures in a class means change the class, not the estimator — says
stop, and the gene-flow measurement above says which class to move to: **measure the selective
force per generation instead of inferring the pathway from trajectories**.

A fifth instrument was nearly added on top: a bootstrap whose distribution did not contain its
own point estimate. The cause was a textbook LCG whose multiplier overflows float64 in
JavaScript, degenerating the generator; `Math.imul`-based mulberry32 fixed it and reconciled the
two. It is recorded because the symptom looked like a statistical subtlety and was arithmetic.
