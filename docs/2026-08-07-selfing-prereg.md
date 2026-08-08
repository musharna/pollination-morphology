# Pre-registration: reproductive assurance against the mate-finding constraint

**Written before any code, any run, any result.** Registered 2026-08-07 against
master `ff82db6`.

## Why this mechanism class, and not a fifth variation

Four routes to the northstar are spent, and all four attacked the **same thing**:

| route                                | attacked   | outcome                                 |
| ------------------------------------ | ---------- | --------------------------------------- |
| second limiting factor (#24/#26)     | visitation | not available by the pollinator route   |
| NFD on placement (#25/#27)           | visitation | self-defeating — subsidises the bridge  |
| discreteness from geometry (#33/#37) | the axis   | axis is CONNECTED; premise refuted      |
| learned avoidance (#22)              | attraction | splits the ADVERTISEMENT, not the plant |

But the roadmap already localised the constraint at `:111`: the 0.70 exponent is
**a property of MATE-FINDING, not of provisioning** — _"partners are not a
resource a pollinator can supply"_ — and `:128` records that nothing so far
**repairs** mate-finding. Four consecutive failures in one mechanism class is the
point to change class, not to run a fifth variation of it.

**Reproductive assurance attacks mate-finding directly: it removes the need for a
partner.**

## The mechanism, and why it is DERIVED rather than IMPOSED

`sim/ibm.js` already refuses this by default, and says why:

> _"nobody delivered to her: she sets no outcrossed seed. Not silently replaced
> by a self, because that would manufacture the very isolation the run is trying
> to detect."_

That refusal is correct as a default, and is exactly what this experiment lifts —
deliberately, with a cost, and measured.

The advantage is frequency-dependent **without being imposed**:

- Selfing is available to **both** morphs on identical terms. No per-lineage
  quota, no rare-biased anything.
- Who benefits is decided by the model, not by me: a plant benefits only when it
  received no compatible outcross pollen, and **that happens more often to the
  rare morph because it is the mate-limited one**. The NFD is a consequence of
  the measured mate-finding constraint, not a parameter.
- It carries a real cost — inbreeding depression — so it **can fail**, and it
  should fail when the cost outweighs the assurance.

## Prediction (registered)

**H-assurance:** a small selfing rate lifts the rare morph's realised
reproductive output and **lowers the 0.70 exponent**, because assurance pays only
where outcross partners are missing.

- **Refuted** if the exponent is unmoved (screen — a candidate must move 0.70),
  or if selfing helps the common morph as much as the rare one, which would mean
  it is a flat subsidy rather than assurance.
- **Refuted as a speciation mechanism** — separately from the above — if it
  rescues the rare lineage but the rescued lineages FUSE.

## ⚠️ Trap 1: trivial isolation. This is the one that would fake a success.

If selfing is unconditional and high, both lineages simply stop outcrossing and
isolation is manufactured — the exact thing the code comment refused to do. A run
where every plant selfs would report perfect isolation and mean nothing.

**Registered in advance:** the result of interest is whether a **SMALL** selfing
rate rescues the rare morph **without producing isolation by itself**. Therefore:

- Sweep the selfing rate from 0 upward rather than testing one value, and report
  the whole curve including the region where it goes trivial.
- **Positive control for triviality:** a full-selfing arm, which MUST report
  isolation. If it does not, the isolation statistic is broken and no other arm
  is interpretable.
- **The claim is only admissible in the regime where the full-selfing control and
  the test arm are distinguishable.** If the rescue appears only where the arm is
  indistinguishable from full selfing, there is no result.

## ⚠️ Trap 2: the obvious statistic is mechanically inflated by the treatment

`anc` for an outcrossed offspring is the **parental mean**, so outcrossing pulls
ancestry toward 0.5 and shrinks `ancestryVar`. **A selfed offspring inherits the
mother's `anc` unaveraged, so it does not shrink at all.**

`HELD` is defined as `ancVar > 0.4 × ancVar0`. **So selfing raises HELD BY
CONSTRUCTION, with no biology involved.** Reading this run on HELD alone would
report a spectacular success caused entirely by removing an averaging step.

**Registered in advance:**

- HELD/`ancVar` is **not** the primary statistic here, and no headline may rest
  on it. Primary is a **placement** statistic — `twoClusterSeparation` — which
  selfing does not mechanically inflate.
- **Mechanical-null arm:** selfing ON, but each selfed offspring's `anc` set to
  the mean of the mother and a RANDOM member of the population — same averaging
  as outcrossing, same selfing genetics. Any HELD difference between this and the
  real selfing arm is the mechanical inflation, measured rather than assumed.
- Report `ancVar` alongside, explicitly labelled as carrying the artefact.

## Controls that must run, and what each rules out

1. **σ = 0** — reproduces current behaviour exactly. If it does not, the knob
   leaks into the untreated path.
2. **Full selfing** — the triviality positive control above.
3. **Equal-frequency arm** — both morphs at 50/50 with selfing on. Assurance
   should do LITTLE here, because neither morph is mate-limited. If selfing helps
   equally at 50/50, it is a flat subsidy and H-assurance is refuted.
4. **Cost sweep** — inbreeding depression from 0 to strong. At high cost the
   rescue must disappear. A mechanism that helps at every cost is not paying one.

## What this cannot show

⚠️ Selfing is a well-documented route to reproductive isolation in its own right,
independent of placement. Even a clean positive here does **not** show that
_placement_ drove the split — it shows assurance kept a mate-limited lineage
alive long enough for placement to matter. Those are different claims and the
writeup must not merge them.

⚠️ Nothing here addresses whether real orchid selfing rates sit in the rescuing
regime. That is an empirical question this model cannot answer, and the sweep
must not be read as an estimate.
