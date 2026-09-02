# #53 — NO VERDICT. The forcing hook destroys what the run measures.

Registered in `docs/2026-09-01-bloom-fixed-prereg.md`; the control that decided the
outcome was registered in `docs/2026-09-02-bloom-fixed-addendum-prereg.md`, after the
2x2 returned and before it was written.

**#53 set out to separate the per-slice rarity premium from the flowering-time
polymorphism it maintains, by crossing the two. It did not manage to. The instrument
that holds the polymorphism still is not neutral: imposing any foreign bloom trajectory
collapses retained ancestry to zero on its own, with the premium still switched on.**

## The 2x2, reproduced on two hosts

| cell |                                        | HELD  | ancVar/0 | R1    | R2    | bloomLin | coflow |
| ---- | -------------------------------------- | ----- | -------- | ----- | ----- | -------- | ------ |
| A    | flat budget, bloom free (=#37)         | 0.289 | 0.247    | 0.457 | 0.368 | 0.886    | 4.743  |
| B    | visits ∝ display, bloom free (=#52)    | 0.026 | 0.012    | 0.941 | 0.849 | 0.877    | 6.366  |
| C    | premium OFF, A's polymorphism restored | 0.000 | 0.000    | 0.457 | 0.368 | 0.959    | 4.743  |
| D    | premium ON, B's polymorphism imposed   | 0.000 | 0.000    | 0.941 | 0.849 | 0.965    | 6.366  |

A reproduced #37 and B reproduced #52 exactly. All five originally registered controls
passed: C2 self-donation is the identity (38/38 in both arms), C1 the forcing landed to
three decimals, C3 the lineage tie survived, C5 the budget matched at generation 0, C6 no
donor/recipient size mismatches. P1 (C recovers, >= 0.158) failed at 0.000; P2 (D
collapses, <= 0.079) passed at 0.000. The registered branch for that pair is NEITHER.

Job 3636 (gt76, 45.9 min) and a local run on the same build (`sim/ibm.js`
`39980f6f0a4b057572e6f9d8c573fe32`, node v18.19.1 on both) agree to every printed digit,
across the 2x2 and every control.

## Why NEITHER was not filed

Two manipulations pointing in opposite directions produced identical, _total_ collapse —
0.000 retained ancestry and 0.000 ancestry variance in both. "Two distinct necessary
factors, each insufficient by exactly the same complete amount" is a worse explanation
than one common cause acting on both cells: the instrument.

And **C2, the control the verdict gates on, cannot see that.** Self-donation sets donor =
recipient, so the donor/recipient trajectory mismatch — the only thing that could make
forcing costly — is identically zero under it. C2 is a real control on the mapping
arithmetic and it licenses nothing whatever about foreign donors. Its scope is narrower
than the claim it was carrying.

## C7 — the control C2 could not be

A dose-response in trajectory mismatch. Every cell keeps **the premium ON** and receives
**an A-type distribution**; only how foreign the donor trajectory is varies.

| shear | cell                                              | HELD      | ancVar/0 |
| ----- | ------------------------------------------------- | --------- | -------- |
| —     | A, bloom free (reference)                         | 0.289     | 0.247    |
| 0     | `Aself` — donor is its own trajectory             | 0.289     | 0.247    |
| 1     | `Ashift` — donor is **arm A at a different seed** | **0.000** | 0.000    |
| 2     | `Arev` — donor is **arm A, generations reversed** | **0.000** | 0.000    |

Companion: `Bshift` (premium OFF, donor arm B at another seed) 0.000, against B's 0.026.

The donor genuinely differed from what the recipient would have produced in 100.0% of
generations at shear 1 and 97.1% at shear 2 — 97.1% rather than 100% because reversing 35
generations leaves the middle one mapped to itself, which is the metric behaving correctly
rather than a defect. The run gates on this: a shear cell whose donor matched the
recipient's own output would be a control that could not fail, and it reports INERT instead
of PASS in that case. Verified by mutation before the run — donating own trajectories drove
foreignness to 0.0% and printed INERT plus NO RESULT.

**Shear 0 costs nothing and shear 1 costs everything.** A donor drawn from another
replicate of the _same arm_, under the _same allocation rule_, with the _same statistical
distribution_, collapses retained ancestry from 0.289 to 0.000. The premium is still on.
Nothing about the premium or the polymorphism was manipulated between those two rows.

## What this retracts, and what it does not

**Retracted:** C2's role as the gate. It is kept as a control on the mapping arithmetic
and demoted from licensing anything about foreign donors. The NEITHER reading of C and D
is void — both cells are instrument artefacts, and no mechanism may be read off them.

**Not retracted, and not confirmed:** #52's mechanism paragraph — that the premium acts on
ancestry through the flowering-time polymorphism it maintains — **stands exactly where it
stood before #53 ran.** #53 did not test it. This is the outcome the addendum committed to
in advance, and it is not a result in the two-step's favour: an instrument that cannot
measure a thing has not measured it. #52's own findings (the ablation, M1's reversal, M4's
fall, M3's zero excess) are untouched; only #53's crossed design is void.

## The substantive lead this leaves

The failure is more interesting than the test would have been. Retained ancestry in this
model appears to require **generation-to-generation continuity of a lineage's absolute
flowering position**, not merely a flowering-time distribution of the right shape. Every
forced cell carries its donor's distribution exactly (C1) and preserves rank, so what is
lost is only _which absolute time a lineage occupies from one generation to the next_ — and
losing that alone takes retention to zero.

Two details sharpen it and are unexplained:

- The forced cells' `bloomLineage` is **higher** than the free arms' (0.959 / 0.965 versus
  0.886 / 0.877). Relatives flower together _more_ after the rank mapping, and ancestry
  still collapses completely. Whatever carries ancestry here, it is not captured by how
  tightly relatives co-flower within a generation.
- `Bshift` (0.000) sits **below** B (0.026), so the shear costs something even in the arm
  that had almost nothing left to lose.

## Next

#53's question is still open and the crossed design cannot answer it. The replacement
should avoid an exogenous trajectory entirely — a **switch-time ablation** does: run with
the premium on for k generations so the polymorphism establishes, then switch it off and
watch, on the population's own uninterrupted trajectory. If the polymorphism carries the
effect, retention persists after the switch and decays as the polymorphism does; if the
premium acts per-generation, retention drops immediately. Nothing is imposed from outside,
so the confound found here cannot arise. Filed as #54.
