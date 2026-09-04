# #60 — survival is not a state, and what selfing buys is recovery at k = 1 only

_2026-09-03. Registered in
[the pre-registration](2026-09-03-survival-recovery-prereg.md), which discloses
that the one-generation point estimates were visible before registration. A
re-analysis of #58's and #59's archives; no new simulation._

## The result, in four parts

1. **Without selfing a lone plant NEVER recovers.** Arm A: 23 lone-plant
   generations across **23 distinct seeds**, and every one ends in the lineage
   being lost. P(recover) = **0.000**, under both tracer conventions.
2. **Selfing creates recovery where there was none** — P(recover) rises to
   0.079–0.108 (pure) / 0.116–0.135 (inclusive).
3. **What inbreeding depression does to recovery is decided by the tracer
   convention, not by the data.** Pure says it is destroyed (0.041 → 0.000);
   inclusive says it is roughly halved and still positive (0.122 → 0.075). The
   registered control fired.
4. **"Survival" is not a state at all.** P(survive) = **0.000** at a 10-generation
   window in every arm. Every k = 1 episode resolves — recover or lost. **Both
   of my registered hypotheses assumed otherwise, and both are wrong for that
   reason.**

## Controls

| id          | control                                     | result                                             |
| ----------- | ------------------------------------------- | -------------------------------------------------- |
| **C8′**     | every archive matches its published dump    | **PASS** — all five cost cells, to 1e-12           |
| **C-class** | every exit is the MINORITY vanishing        | **PASS** — 345 exits, 0 majority-gone              |
| **C-seed**  | distinct seeds behind each conditioning set | **PASS** — see below; arm A's 23 gens are 23 seeds |
| **C-conv**  | PURE vs INCLUSIVE                           | **FIRED** — they disagree at high cost             |

C-class matters more than it looks. A generation that stops being informative
means one pure count hit zero, and the classifier must not assume which: if the
_majority_ vanished that is the minority **winning**, and scoring it as an exit
would invert the sign of the whole result. Checked, not assumed — 345/345 are the
minority.

### C-seed — how much independent evidence is actually there

| cell            | k=1 generations / seeds | k=2 generations / seeds |
| --------------- | ----------------------- | ----------------------- |
| arm A           | 23 / **23**             | 47 / 39                 |
| rate 2.0 cost 0 | 69 / 45                 | 76 / 44                 |
| cost 0.25       | 91 / 53                 | 87 / 57                 |
| cost 0.50       | 74 / 48                 | 71 / 47                 |
| cost 0.75       | 49 / 39                 | 52 / 42                 |
| cost 0.95       | 40 / 38                 | 39 / 35                 |

The pre-registration flagged that "23 generations could be 3 seeds". It is 23
generations in 23 **different** seeds — one apiece, no pseudo-replication. Arm
A's zero is as clean as this design can produce.

## The primary — from k = 1, window 10 generations, PURE convention

| cost / arm | P(recover) [95% CI]      | P(survive) | P(exit) | n (known) |
| ---------- | ------------------------ | ---------- | ------- | --------- |
| arm A      | **0.000** [0.000, 0.000] | 0.000      | 1.000   | 23        |
| cost 0.00  | 0.087 [0.000, 0.197]     | 0.000      | 0.913   | 69        |
| cost 0.25  | 0.079 [0.011, 0.168]     | 0.000      | 0.921   | 89        |
| cost 0.50  | 0.108 [0.000, 0.235]     | 0.000      | 0.892   | 74        |
| cost 0.75  | 0.041 [0.000, 0.133]     | 0.000      | 0.959   | 49        |
| cost 0.95  | **0.000** [0.000, 0.000] | 0.000      | 1.000   | 40        |

Bootstrap over **seeds**, 2000 resamples, pooling generations within a seed —
generations within a run are not independent, and this arc has been burned by
that before.

### Every arm against arm A, both conventions

Arm A is exactly 0.000 with no variance, so these differences are the arms' own
intervals.

| cost | ΔP(recover), PURE           | ΔP(recover), INCLUSIVE      |
| ---- | --------------------------- | --------------------------- |
| 0.00 | +0.096 [0.000, 0.192]       | **+0.127 [0.017, 0.236]** ✓ |
| 0.25 | **+0.090 [0.011, 0.169]** ✓ | **+0.133 [0.039, 0.227]** ✓ |
| 0.50 | +0.118 [0.000, 0.236]       | **+0.147 [0.028, 0.266]** ✓ |
| 0.75 | +0.070 [0.000, 0.140]       | +0.135 [0.000, 0.270]       |
| 0.95 | +0.000 [0.000, 0.000]       | +0.085 [0.000, 0.170]       |

✓ = interval excludes zero. One arm clears it under PURE, three under INCLUSIVE.
Several intervals _touch_ zero at the lower bound rather than crossing it,
because a bootstrap that resamples 40–50 seeds carrying only a handful of
recoveries will sometimes draw none.

## ⚠️⚠️ The registered convention control fired — and it changes the headline

Registered in advance: **if the two conventions disagree on a verdict, the
verdict is the tracer's and not the biology's.** They disagree, and precisely
where the effect is largest.

| cell      | P(recover) PURE | P(recover) INCLUSIVE |
| --------- | --------------- | -------------------- |
| arm A     | 0.000           | 0.000                |
| cost 0.00 | 0.087           | 0.116                |
| cost 0.25 | 0.079           | 0.124                |
| cost 0.50 | 0.108           | 0.135                |
| cost 0.75 | **0.041**       | **0.122**            |
| cost 0.95 | **0.000**       | **0.075**            |

Under PURE, inbreeding depression **abolishes** recovery. Under INCLUSIVE it
barely erodes it — 0.116 → 0.075, and the whole cost series is nearly flat. **So
"depression closes recovery" is a statement about the tracer convention, and is
reported as convention-dependent rather than as a result.** This is the fourth
consecutive task in this arc where the convention decided the answer (#57's
factor of seven, #58's `ancNull`, #59's 0.150-vs-0.050, now this) — and the first
where a control registered in advance caught it before the claim was written.

⚠️ **The two conventions are not equally appropriate here, and saying so is an
argument rather than a measurement.** PURE asks whether the lineage persists as a
distinguishable entity; INCLUSIVE asks whether her genes persist at all, which
**fusion also satisfies**. Coexistence is the former, so for the question #58 and
#59 were asking, absorption into hybrids is a failure and PURE is the right
reading. ⚠️ But note the corollary before treating that as confirmation: HELD is
computed by `fateOf` on ancestry variance, which is **also** a pure-lineage
measure, so PURE-recovery agreeing with HELD's closure at cost 0.95 is **not
independent evidence** — the two share a convention.

## Both registered hypotheses were wrong, and for the same reason

- **H_S** — selfing raises P(survive) and leaves P(recover) flat. **Falsified,
  backwards.** P(survive) does not rise; P(recover) does.
- **H_R** — selfing raises both. **Half right at best**: recovery yes, survival
  no.

Both framings presupposed that survival at k = 1 is a persistent state a lineage
can sit in. **It is not.** At a 10-generation window P(survive) is 0.000 in every
arm: a lone-plant episode always resolves, and the only question is which way.
The correct decomposition was never survive-vs-recover — it is **recover
vs. lost**, and the pre-registration got the axis wrong.

Strictly on the registered contrast (cost 0 − arm A, PURE), ΔP(recover) =
+0.096 [0.000, 0.192] does not exclude zero, so **the registered discriminator
returns NO VERDICT**; the same contrast under INCLUSIVE, and cost 0.25 under
PURE, do exclude it.

## The floor is specifically k = 1

From k = 2, with the same estimator and window:

| cost / arm | P(recover) [95% CI]  |
| ---------- | -------------------- |
| arm A      | 0.298 [0.175, 0.419] |
| cost 0.00  | 0.338 [0.210, 0.469] |
| cost 0.25  | 0.302 [0.178, 0.430] |
| cost 0.50  | 0.296 [0.152, 0.446] |
| cost 0.75  | 0.346 [0.189, 0.492] |
| cost 0.95  | 0.359 [0.191, 0.538] |

**Every arm sits at 0.30–0.36 and every difference is NO VERDICT** (half-widths
0.17–0.21 against the registered 0.15). Selfing does nothing measurable at k = 2.
Its entire effect is at k = 1 — which is exactly where #56 measured w = 0.000 and
#57 found a lone plant mothers nothing. **The floor is one plant deep.**

## What this adds to #58 and #59

#58 and #59 measured the same gap from opposite sides: the floor rescue is
gradual while HELD moves only at the extreme, and the floor rescue survives
depression while HELD does not. #60 says what the gap is made of.

A lone plant's episode always resolves within ten generations. Without selfing it
resolves as loss **every single time**. Selfing converts roughly one episode in
eleven into a recovery — real, but small, and confined entirely to k = 1. That is
why lifting the floor is not the same as rescuing coexistence: **a ~9% chance of
escape, available only at the very bottom, is not enough to move an outcome
measured over 35 generations.** The rescue is real and it is nearly all spent
before it reaches the thing #58 and #59 were measuring.

## Limitations

1. **Re-analysis, not new simulation** — inherits #58/#59's design: N0 = 30, one
   premium setting, rate 2.0 for every cost arm.
2. **Conditional on reaching k = 1**, and how often lineages arrive there varies
   across arms (69 → 91 → 74 → 49 → 40, still unexplained from #59). None of
   this speaks to arrival rates.
3. **The point estimates were seen before registration** (disclosed in the
   prereg): the pre-flight that tested whether `k` is safe produces the same
   classification as the outcome. The intervals, windows and convention
   comparison were not.
4. **Several intervals touch zero** rather than clearing it; only one PURE arm
   strictly excludes.
5. **W = 5 and W = 10 give identical k = 1 results**, so the registered pair of
   windows turned out to be one statistic — everything resolves within five
   generations.
