# Release 1.0 — executor handoff

**Repo:** `pollination-morphology` · **Branch:** `release/1.0-rc` · **Start SHA:** `64e76ca`
**Plan:** `docs/superpowers/specs/2026-09-10-ship-plan.md` (panel-audited 2026-09-10)

This document is the handoff record. Every stage appends its evidence here. The
coordinator owns all remaining remote operations (merge, visibility flip, Pages
enablement, tag, release).

---

## Stage 1 — Branch and baseline

**Started:** 2026-09-10 22:15 EDT

### Topology check

Stop condition: fetched topology must match the recorded start SHA.

```
git fetch origin
git rev-parse origin/master  -> 64e76cab2990ad48262dc523450a24970b83f316
git rev-parse 64e76ca        -> 64e76cab2990ad48262dc523450a24970b83f316
```

`origin/master` is byte-identical to the registered start SHA. **Match — no stop
condition triggered.**

Backup branch `backup/prerewrite-local-master-2026-09-10` verified present at
`ff82db62209cb2a00634f8ea1aca16b38ca17f11`, matching the coordinator memo. Not touched;
nothing force-pushed.

### Branch

```
git switch -c release/1.0-rc 64e76ca
```

Branched from the registered start SHA, not from local `master`. Local `master` carries
one unpushed commit (`774cae0`) which is the executor brief itself — an internal working
document, not release content.

### Runtime

|            |                                                                           |
| ---------- | ------------------------------------------------------------------------- |
| Node       | `v18.19.1` (system; the brief confirms v18 is sufficient — no build step) |
| Test files | 43 (`ls tests/*.js \| wc -l`)                                             |

### Baseline suite

```
node --test tests/
```

| Metric    | Count   |
| --------- | ------- |
| tests     | 363     |
| **pass**  | **363** |
| fail      | 0       |
| cancelled | 0       |
| skipped   | 0       |
| todo      | 0       |
| exit code | 0       |
| duration  | 249.5 s |

Counts transcribed verbatim from the TAP summary block.

**DONE:** branch exists, suite result recorded.
---

## Stage 2 — Scientific disposition

**Started:** 2026-09-10 22:30 EDT

### 2.1 The z→t defect was already corrected — verified, not assumed

The brief's starting state records the z-interval defect in
`docs/2026-08-01-v2-result.md` as open and claim-invalidating. **It is not open.** The
live document already carries the correction, applied 2026-08-25:

| where                   | state on `release/1.0-rc`                               |
| ----------------------- | ------------------------------------------------------- |
| headline table, line 28 | already quotes the **t** interval `[−1.72, 0.22]`       |
| lines 31–33             | states the correction and names z as the error          |
| lines 81–84             | the "excluded zero by 0.02" paragraph is struck through |
| lines 86–91             | explicit `RETRACTED 2026-08-25 — This never happened`   |
| lines 221–223           | "What survives" already uses corrected t-intervals      |

What is stale is the **ROADMAP's** debt row, which still describes the defect in the
present tense. That is a bookkeeping lag, not an uncorrected number — annotated in 2.5.

The arithmetic was re-derived independently rather than taken on trust, from the paired
differences published in the document itself, with the t solver positive-controlled
against an independently sourced table (max deviation `4.5e-7` over df 1–15) **before**
its outputs were used:

| budget | n   | mean  | published (z)    | recomputed z        | document's t     | recomputed t        |
| ------ | --- | ----- | ---------------- | ------------------- | ---------------- | ------------------- |
| 6,000  | 8   | −1.00 | `[−1.98, −0.02]` | `[−1.98, −0.02]` ✅ | `[−2.18, +0.18]` | `[−2.18, +0.18]` ✅ |
| 18,000 | 8   | −0.75 | `[−1.56, +0.06]` | `[−1.56, +0.06]` ✅ | `[−1.72, +0.22]` | `[−1.72, +0.22]` ✅ |

Both reproduce exactly. The published intervals _are_ z; the document's corrected ones
_are_ t(df=7); and the 6,000 interval excludes zero under z but not under t, so the
retraction is arithmetically sound.

### 2.2 The inventory found four more z-sites — this is the new finding

The brief's required sweep
(`grep -rnE '1\.96|z-interval|zInterval|norm\.ppf|1\.959' docs sim tools experiments tests`)
turned up that the _estimator_ is still live outside the corrected document:

| site                                                  | verdict                                                                                                                   |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `sim/paired-stats.js:109` `Z_CRIT`                    | **not a defect** — the correct t path; z is returned deliberately alongside t so a reader can see the difference          |
| `experiments/boundary-interior.js:177` `let t = 1.96` | **not a defect** — only the fallback for df > 30, where z is the correct asymptote; a table supplies proper t for df ≤ 30 |
| `experiments/hybrid-placement.js:325`                 | **defect** — bare `1.96`, publishes to `docs/2026-08-02-hybrid-placement.md`                                              |
| `experiments/density-dependence.js:58`                | **defect** — bare `1.96`, publishes to `docs/2026-08-04-density-dependence.md`                                            |
| `experiments/secondary-contact.js:255`                | **defect** — bare `1.96`, publishes to `docs/2026-08-04-secondary-contact.md`                                             |
| `experiments/limiting-factors.js:56`                  | **defect in code, no published interval** — the helper exists but no `±` reaches its documents                            |

`docs/2026-08-25-selfing-sweep.md` was checked and cleared: its intervals come from
`experiments/selfing.js`, which contains no bare z.

**A z→t correction needs only the published half-width and n.** Both intervals are the
same standard error times a different critical value, so `h_t = h_z · t(df)/z` is an
exact rescale — no stored per-observation data and **no re-running**, which is what keeps
this inside the scope allowlist.

### 2.3 Recomputation, and what it does and does not move

`docs/2026-08-02-hybrid-placement.md` — n = 58 stated, so exactly correctable (t/z = 1.0217):

| row                                          | published (z)                    | corrected (t)                    | excludes 1.0? |
| -------------------------------------------- | -------------------------------- | -------------------------------- | ------------- |
| rare among both parent morphs                | 0.751 ± 0.091 → `[0.660, 0.842]` | 0.751 ± 0.093 → `[0.658, 0.844]` | yes → yes     |
| **NET matching effect (the 19.1% headline)** | 0.809 ± 0.101 → `[0.708, 0.910]` | 0.809 ± 0.103 → `[0.706, 0.912]` | **yes → yes** |
| clonal control                               | 0.960 ± 0.040 → `[0.920, 1.000]` | 0.960 ± 0.041 → `[0.919, 1.001]` | **no → no**   |

`docs/2026-08-04-secondary-contact.md` — anchor-gate diagnostics, no verdict moves:

| row                            | published (z)                    | corrected (t)                    | doc's claim                     |
| ------------------------------ | -------------------------------- | -------------------------------- | ------------------------------- |
| wrong construction             | 1.145 ± 0.252                    | 1.145 ± 0.283 (n≈12)             | "still found nothing" — holds   |
| wrong sample size, n=12        | 0.877 ± 0.305 → `[0.572, 1.182]` | 0.877 ± 0.343 → `[0.534, 1.220]` | "too wide to exclude 1" — holds |
| matched `makePairs(41,60,2.0)` | 0.628 ± 0.121, upper 0.749       | 0.628 ± 0.124, upper 0.752       | "reproduction in kind" — holds  |

`docs/2026-08-04-density-dependence.md` — **n is not recorded in the document.** The
runner draws over `SEEDS = [1,2,3,4,5]` with `continue` guards that can drop seeds, so
n ≤ 5 and the exact t-interval **cannot be reconstructed**. Per the brief's rule the
interval is therefore not silently re-stated; it is bounded, and the bound is reported:

| row                        | published (z) | t at n=5 (+42%)            | t at n=3 (+119%)           | directional claim       |
| -------------------------- | ------------- | -------------------------- | -------------------------- | ----------------------- |
| rare B at freq 0.10        | 0.214 ± 0.072 | ± 0.102 → `[0.112, 0.316]` | ± 0.158 → `[0.056, 0.372]` | below 1.0 throughout ✅ |
| symmetric point, freq 0.50 | 0.981 ± 0.142 | ± 0.201 → `[0.780, 1.182]` | ± 0.312 → `[0.669, 1.293]` | spans 1.0 throughout ✅ |
| common B at freq 0.90      | 4.654 ± 0.556 | ± 0.788 → `[3.866, 5.442]` | ± 1.221 → `[3.433, 5.875]` | above 1.0 throughout ✅ |

**Every directional verdict survives at every admissible n**, including the worst case.
"The sign is backwards — a rare lineage does worse" does not depend on the estimator.

### 2.4 Disposition table

| #   | item                                                                                                | class                   | treatment                                                                                                                                                                                                                                         |
| --- | --------------------------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | v2 published intervals are z at n=8                                                                 | claim-invalidating      | **already corrected** 2026-08-25 in the source document; re-verified here by independent recomputation; erratum table added; ROADMAP row annotated                                                                                                |
| 2   | `hybrid-placement.md:97` "the clonal control's own interval (0.960 ± 0.040) only just excludes 1.0" | **claim-invalidating**  | The printed interval's upper limit is **exactly 1.000**, so the sentence is unsupported by its own numbers under z, and under the correct t the limit rises to ≈1.001. Sentence corrected in place; the 19.1% headline it qualifies is unaffected |
| 3   | hybrid-placement's other two intervals are z at n=58                                                | interpretation-limiting | corrected inline (+2.2%); no verdict moves                                                                                                                                                                                                        |
| 4   | density-dependence intervals are z, n unrecorded                                                    | interpretation-limiting | qualifier placed beside the table stating the intervals are ≥42% too narrow and that n was not recorded; directional verdict shown to survive to n=3                                                                                              |
| 5   | secondary-contact anchor diagnostics are z                                                          | interpretation-limiting | qualifier beside the block; no verdict moves                                                                                                                                                                                                      |
| 6   | Round-2 table mixes 120- and 250-generation runs                                                    | interpretation-limiting | already disclosed in the document's §2; carried into FINDINGS "what is open"                                                                                                                                                                      |
| 7   | Round 3 does not reproduce                                                                          | interpretation-limiting | already disclosed in §4; carried into FINDINGS "what is open"                                                                                                                                                                                     |
| 8   | four experiments hand-roll a `ci()` helper instead of routing through `sim/paired-stats.js`         | **future work**         | the causal fix is to delete the duplicated helpers and route through the single correct estimator — but that changes experiment output, and re-running is outside this release's scope, so it is registered for post-1.0 rather than half-applied |

No item required a withdrawal: every claim-invalidating row is either already corrected
upstream (1) or correctable in place from published statistics (2).

### 2.5 ROADMAP annotation

The Instrument-debt row describing the z defect in the present tense was annotated to
record that the correction landed, per the repo's own `✅ CORRECTED @<sha>` convention.
The ROADMAP was not otherwise restructured.
