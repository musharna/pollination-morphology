# Addendum to #53's pre-registration: is the forcing hook itself destructive?

Registered 2026-09-02, **after** job 3636 returned and **before** the control below
was written or run. The 2x2's numbers are already known and are restated here so
that nothing about this addendum is hidden:

| cell | | HELD | ancVar/0 |
|---|---|---|---|
| A | flat budget, bloom free (=#37) | 0.289 | 0.247 |
| B | visits proportional to display, bloom free (=#52) | 0.026 | 0.012 |
| C | premium OFF + A's polymorphism | **0.000** | 0.000 |
| D | premium ON + B's collapsed bloom | **0.000** | 0.000 |

All five registered controls passed and the registered branch is NEITHER.

## Why an addendum is needed anyway

Two manipulations in opposite directions produced identical, total collapse —
0.000 retained-ancestry fraction and 0.000 ancestry variance in both forced
cells. "Two distinct necessary factors, each individually insufficient by exactly
the same complete amount" is a worse explanation than one common cause: **the
forcing hook destroys ancestry retention whenever the donor trajectory is not the
recipient's own.**

The mechanism that would do it: the hook preserves each plant's *rank* but
re-imposes *absolute* bloom values from an exogenous multiset every generation. A
lineage that occupies a stable absolute position under free evolution — and so
meets the same partners generation after generation — instead gets re-mapped onto
whatever the donor's generation-t distribution happens to be. Rank heritability
survives; positional stability does not.

**C2 cannot see this.** C2 sets donor = recipient trajectory, which makes the
donor-recipient mismatch identically zero by construction. It is a genuine control
on the *mapping arithmetic* and it licenses nothing about foreign donors — yet the
verdict block gates on it as though it did. That is a control whose scope is
narrower than the claim it carries, which is a failure this project has logged
before.

## The control: C7, a dose-response in trajectory mismatch

Three cells, all with **the premium ON** (dpv false) and all receiving **an
A-type bloom distribution**, differing only in how foreign the donor trajectory is:

- **shear 0** — donor is the recipient's own trajectory. This is C2 (already the
  identity, 38/38).
- **C7a `Ashift`** — donor is arm A at a *different seed* (next seed, cyclic).
  Same allocation rule, same statistical distribution, different trajectory.
- **C7b `Arev`** — donor is arm A at the recipient's *own* seed with the
  generations *reversed*. Same distribution family, maximal trajectory mismatch.

Plus a companion with no gating role:

- **C7c `Bshift`** — premium OFF, donor is arm B at a different seed. Should stay
  collapsed like B; confirms the shift does not *create* retention.

Population size is constant (`sim/ibm.js:712` — `step()` fills exactly
`pop.length` slots), which is why C6 counted zero size mismatches; a cross-seed
donor therefore adds no quantile-remapping confound. The run reports the mismatch
count anyway rather than assuming it.

## Committed decision rule

Bands are the ones already registered for P1/P2, unchanged.

- **Both C7a and C7b >= 0.158** — the hook tolerates trajectory mismatch at two
  levels while the premium is on. C and D are interpretable and **the NEITHER
  verdict stands**, carrying the residual caveat below.
- **Either C7a or C7b <= 0.079** — the hook destroys ancestry retention on a
  foreign donor. C and D are then confounded with the instrument and **#53 issues
  NO VERDICT on the mechanism.** C2 is retracted as insufficient, the 2x2 is
  reported as an instrument failure, and #52's mechanism paragraph stands
  unchallenged because #53 never tested it.
- **Anything between** — PARTIAL. The instrument is partly confounded; no
  mechanism is named and the run does not get to pick the reading it prefers.

## The residual caveat, committed in advance

Passing C7 is **necessary, not sufficient**. C7a and C7b hold the donor's
*distribution* matched to the recipient's own arm and vary only trajectory. Cell C
mismatches both — arm B receives a distribution arm B would never generate. So C7
passing shows the hook survives trajectory mismatch, not that it survives
distribution mismatch. If C7 passes, the write-up must say so in those words
rather than claiming the instrument is clean.

## What would make this addendum wrong to have written

If C7a and C7b both come back at ~0.289, the suspicion motivating this document
was unfounded and the extra hour of compute bought a stronger negative control
than the prereg had. That is a fine outcome and gets reported as such.

Claude-Session: https://claude.ai/code/session_01HzohYchgND5CTDDrinLf1D
