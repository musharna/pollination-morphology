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
---

## Stage 3 — Write-up

**Started:** 2026-09-10 23:05 EDT

### 3.1 `docs/FINDINGS.md` (new)

Written for a stranger. Four headline findings, selected under the brief's rule —
**pre-registered primary endpoints only**, each registered in a committed pre-registration
before its experiment ran:

| #   | finding                                      | number                   | study | doc                                      | commit    |
| --- | -------------------------------------------- | ------------------------ | ----- | ---------------------------------------- | --------- |
| 1   | a floor given to few is worse than none      | −0.211 [−0.303, −0.119]  | #64   | `2026-09-06-selfing-cover.md`            | `64e76ca` |
| 2   | flowering time reaches placement             | +0.289 [0.158, 0.447]    | #37   | `2026-08-25-phenology.md`                | `94d61c0` |
| 3   | a narrow season cannot be derived            | +0.291 / +0.084 / +0.233 | #50   | `2026-08-31-evolving-width-conserved.md` | `5602460` |
| 4   | spatial structure does not rescue divergence | HELD 0 of 38, every cell | #36   | `2026-08-25-spatial-ibm.md`              | `239c6cc` |

The 2.1× ablation and the 19.1% hybrid cost are reported in a separate **foundation**
section, explicitly marked as pre-dating pre-registration, so the selection rule stays
honest rather than being quietly widened to admit the project's best-known numbers.

### 3.2 The agreement check that was actually run

Finding 1 was **re-derived from the shipped archive**, not transcribed:

```
node experiments/selfing-cover.js docs/data/2026-09-06-selfing-cover.json.gz
```

exit 0, and the analyser printed
`HELD: no floor -> q=0.85   0.266 -> 0.055   diff -0.211 [-0.303, -0.119]   (109 seeds)`,
matching the FINDINGS sentence exactly, along with the registered primary
`-0.221 [-0.339, -0.101]`. Findings 2–4 were checked by reading the number off the cited
table in its own document (`phenology.md:55`, `evolving-width-conserved.md:21`,
`spatial-ibm.md:28`) rather than from memory or from the ROADMAP summary.

### 3.3 `README.md`

Top rewritten for a stranger: one paragraph, a play link
(`https://musharna.github.io/pollination-morphology/` — the coordinator verifies it live
after the flip), a FINDINGS link, and the licence line. The existing "What is here" table
is kept, extended with the two playables it omitted (`population.html`, `greybox.html`) and
a FINDINGS row.

⚠️ **A stale published number was corrected here.** The README advertised the suite as
**71 tests**; it is **363**. Not a computation error — a count that stopped being true 292
tests ago and was never re-read. Exactly the failure mode the roadmap's own standing
constraint calls "a live count in a ledger line is a staleness generator".

### 3.4 Citations

`docs/dois.txt` (new): **176 unique DOIs**, extracted from `docs/` and `README.md` and
normalised to lowercase with trailing markdown punctuation stripped.

⚠️ The first extraction returned **zero** DOIs — a malformed bracket expression in the
grep. It was caught by a **positive control** (grep for the bare `10.xxxx/` prefix, which
found 180 occurrences), not by inspection. A zero from a sweep is a claim about the world
and needs a control saying the sweep can find anything at all.

`ghostcite 0.5.2`, retraction source _Retraction Watch snapshot 2026-07-14 (71,059 rows)_:

```
ghostcite --format doi --json --max-rps 3 --fail-on retraction docs/dois.txt
```

**exit 0. 176/176 resolved. 0 retracted. 0 unresolvable.** 11 findings, all tier `U`, and
all of them Dryad / Zenodo / Cambridge **data deposits** — registered with DataCite rather
than CrossRef, and each confirmed by ghostcite to resolve at doi.org. Neither non-waivable
class is present.

**Negative control — the gate was seen to fail before its pass was believed.** Feeding it
a known-retracted DOI (`10.1016/S0140-6736(97)11096-0`, Wakefield 1998) alongside a valid
one produced tier `R`, `RETRACTED per Retraction Watch`, and **exit 1**, while the valid
DOI beside it passed in the same run. So the green above is evidence rather than a
harness that cannot fire.

⚠️ **Known limitation of this gate, stated rather than glossed.** Run in `--format doi`
mode against a bare DOI list, ghostcite checks resolvability and retraction but **cannot**
check author–year correspondence, because a DOI list carries no claimed byline to compare
against (`claimed_author` is null in every finding). Wrong-author-for-right-DOI is the
dominant ghost-citation failure mode and this configuration is blind to it.

The two citations on the **public front page** were therefore verified by hand against
CrossRef:

- **Ballantyne, Baldock & Willmer 2015** `10.1098/rspb.2015.1130` — CrossRef returns
  authors _Ballantyne, Baldock, Willmer_, year _2015_, _Proc. R. Soc. B_, titled
  "Constructing more informative plant–pollinator networks: visitation and pollen
  deposition networks in a heathland plant community". Byline, year and venue all match,
  and the title is directly on the proposition it is cited for. ✅
- **Mailly & Lihoreau 2025** — a thesis (`docs/2026-07-31-groundwork-axes.md:32` records it
  as Mailly, Riotte-Lambert & Lihoreau 2025), carrying **no DOI**. Not in either
  non-waivable class, but it is an unverifiable-by-DOI citation on the front page and is
  recorded here as such rather than passed over.

**DONE:** FINDINGS written and its headline re-derived by execution; README rewritten and a
stale count corrected; ghostcite clean with a seen-to-fail control and its blind spot named.
---

## Stage 4 — Static site and Pages workflow

**Started:** 2026-09-10 23:00 EDT

### 4.1 What ships

`site/` is an allowlisted staging directory — **never the repo root**. Seven files:

```
site/.nojekyll              site/sim/placement.js
site/index.html             site/sim/browser-bundle.js
site/visit.html             site/greybox.html
site/population.html
```

The two `sim/` modules are the only ones the playables load, read off their own
`<script src=…>`: `visit.html` and `greybox.html` take `placement.js`,
`population.html` takes `browser-bundle.js`. Nothing else in `sim/` is published.

`.nojekyll` is present because Pages runs Jekyll by default and Jekyll **silently**
drops `_`-prefixed paths — a missing-asset class that only appears in production.

New tracked files: `tools/build-site.sh` (the assembler), `tools/site-index.html` (the
landing page, tracked as source so the committed thing is an input rather than an
output), `tools/smoke-site.py` (the smoke test), `.github/workflows/pages.yml`.
**`site/` itself is gitignored** — the script is the artifact, not its result.

### 4.2 The build script refuses to publish an incomplete site

`tools/build-site.sh` re-reads each playable's `<script src=…>` after copying and fails
if any referenced file is absent from `site/`. **Seen to fail before being trusted:** run
with `placement.js` removed from the manifest it printed

```
build-site: visit.html references 'sim/placement.js' which is not in site/
build-site: greybox.html references 'sim/placement.js' which is not in site/
build-site: refusing to publish an incomplete site
```

and exited 1. This is the check that catches a page whose script 404s in production.

### 4.3 Clean-checkout proof

```
git clone --depth=1 --branch release/1.0-rc file://$PWD <tmp>
cd <tmp> && tools/build-site.sh
```

Cloned at `68ac8e9`; `site/` confirmed **absent from the clone before the build** (so
nothing is being smuggled in as committed output); all seven required files produced; and
`diff -r` against the working-tree build reports **no differences — the build is
deterministic**.

### 4.4 Smoke test — and the assertion that was wrong

`tools/smoke-site.py` serves `site/` on an ephemeral port and drives headless Chromium
(Playwright) over every entry point.

⚠️ **The first version of this test failed two pages, and the test was what was wrong.**
It asserted "every canvas must animate on load" — which is a belief about the pages, not
their specification. Reading them settled it: `greybox.html` has **zero**
`requestAnimationFrame`, **zero** `setInterval` and no controls, so it is a **static
diagram by design**; `population.html` has a `<button id="run">` and waits for the user.
Only `visit.html` autoplays. Weakening the check to "the page loaded" would have made a
test that cannot fail, so the assertions were made **per-page** instead:

| page              | contract asserted                                                      |
| ----------------- | ---------------------------------------------------------------------- |
| `index.html`      | no canvas; every same-origin link resolves 200                         |
| `visit.html`      | autoplays — canvas non-blank **and changing** on load                  |
| `greybox.html`    | static by design — canvas non-blank, **not** required to animate       |
| `population.html` | non-blank and **idle** on load; `#run` must draw; `#play` must animate |

`population.html`'s branch was corrected a second time for the same reason. It first
asserted "animates after `#run`", which also failed — because the page's real contract,
read at `population.html:1060–1088`, is that `#run` **computes and draws once**, then
enables `#scrub` and `#play`; playback is what animates. The check now waits on the page's
own completion signal (`#play:not([disabled])`, 60s budget) rather than a fixed sleep,
requires the canvas to differ from its pre-run snapshot, then clicks `#play` and requires
animation. **That is a genuine end-to-end check that the evolution loop runs in a
browser**, which the original assertion never was.

Final result, run from the repo root as a stranger would (`python3 tools/smoke-site.py`),
**exit 0**:

```
  index.html       HTTP 200  console-err 0  uncaught 0  [links] 3 same-origin links checked
  visit.html       HTTP 200  console-err 0  uncaught 0  [autoplay] animating on load 1/1
  greybox.html     HTTP 200  console-err 0  uncaught 0  [static] 1 canvas rendered non-blank
  population.html  HTTP 200  console-err 0  uncaught 0  [click] idle 0/2, #run drew 2/2, #play animating 2/2
```

### 4.5 Workflow, and a hazard the coordinator owns

`.github/workflows/pages.yml` — `on: push: branches: [master]` + `workflow_dispatch`;
`permissions: contents: read, pages: write, id-token: write`; `concurrency: pages` without
cancel-in-progress; build job runs `tools/build-site.sh`, asserts the four
silent-in-production files exist, then `upload-pages-artifact` with `path: site`; deploy
job `needs: build`, `environment: github-pages`.

**Every pinned tag was resolved against the API before pinning**, not recalled:

| action                          | pinned | resolves                   |
| ------------------------------- | ------ | -------------------------- |
| `actions/checkout`              | `v4`   | `refs/tags/v4` → commit ✅ |
| `actions/upload-pages-artifact` | `v3`   | `refs/tags/v3` → commit ✅ |
| `actions/deploy-pages`          | `v4`   | `refs/tags/v4` → commit ✅ |

⚠️ **Both Pages actions are behind current: `upload-pages-artifact` is at v5.0.0 and
`deploy-pages` at v5.0.1.** The brief specified v3/v4 and those tags exist, so they are
what shipped — deliberately, because **this workflow cannot be executed before the flip**
(Pages is not enabled and the repo is private), and pinning an untested newer major into a
workflow that gets its first run in production is the "merge ≠ deploy" trap. Flagged for
the coordinator to bump if preferred.

⚠️⚠️ **ORDERING HAZARD — the coordinator's stated sequence merges to `master` BEFORE the
visibility flip.** This workflow triggers on push to `master`, so that merge produces a
run that (a) executes on a **GitHub-hosted runner while the repo is private, which is
billed**, and (b) **fails anyway**, because Pages is not enabled until the following step.
Two clean fixes, either acceptable: flip before merging, or leave the trigger as
`workflow_dispatch`-only until Pages is enabled and add the push trigger afterwards. A
comment at the top of the workflow records this. Not a blocker for the RC — but it is a
remote operation and therefore the coordinator's call, not the executor's.

**DONE:** clean-checkout proof and smoke assertions pass and are recorded.
