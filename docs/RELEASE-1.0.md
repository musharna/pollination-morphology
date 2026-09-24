# Release 1.0 — executor handoff

> **Release evidence log, not a findings document.** Nothing here is a scientific result. It records
> what was checked, what was found and what was decided while shipping 1.0. For the results, read
> [FINDINGS.md](FINDINGS.md); for what comes next, [ROADMAP.md](ROADMAP.md).
>
> ⚠️ Annotated in release **1.0.1** (2026-09-11) where this log was wrong about itself — see §6.3
> and §7.1. Those annotations correct statements about the release process, never a measurement.

**Repo:** `pollination-morphology` · **Branch:** `release/1.0-rc` · **Start SHA:** `64e76ca`
**Plan:** an internal executor brief (panel-audited 2026-09-10), deliberately not shipped — see §7.4.

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

## **DONE:** branch exists, suite result recorded.

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

## **DONE:** clean-checkout proof and smoke assertions pass and are recorded.

## Stage 5 — Licensing, citation, hygiene

**Started:** 2026-09-10 23:10 EDT

### 5.1 Files added

| file                  | contents                                                                                                                                                                               |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LICENSE`             | MIT, © 2026 Jaret Arnold                                                                                                                                                               |
| `LICENSE-docs`        | CC-BY-4.0, with a pointer to the canonical legal text                                                                                                                                  |
| `CITATION.cff`        | cff-version 1.2.0, Jaret Arnold, ORCID `0009-0003-4055-5238`, version 1.0.0, date-released 2026-09-10. **No `doi:` field** — the coordinator adds the Zenodo concept DOI after release |
| `CHANGELOG.md`        | `## [1.0.0] — 2026-09-10`: what ships, the erratum, known limitations                                                                                                                  |
| `docs/THIRD-PARTY.md` | the inventory, with the method that produced it                                                                                                                                        |
| `.mailmap`            | canonical author identity (see 5.3)                                                                                                                                                    |

`README.md` states the file-class split: `sim/ tools/ tests/ experiments/**/*.js *.html` →
MIT; `docs/** experiments/**/*.md` and the `docs/data/` tables → CC-BY-4.0.

### 5.2 Third-party inventory — nothing, and it was checked

"None" is asserted from a file listing, not from memory. No images, fonts or binaries are
tracked; there is no package manifest, lockfile, `node_modules` or `vendor/`; the shipped
HTML references no webfont and no CDN, and all three `<script src=…>` are local. The
project has no build step and no runtime dependencies.

The one externally published dataset — the euglossine bee–orchid deposit
`10.5281/zenodo.7263689`, CC-BY-4.0 — is **cited but not vendored**, confirmed by listing:
no copy exists in the tree. `docs/THIRD-PARTY.md` records that anyone reusing the derived
figures should credit the deposit.

### 5.3 ⚠️ The brief's author-identity claim was true only on this machine

The brief records _"all commits are the owner (`.mailmap`-resolved to Jaret Arnold)"_. That
is what `git log` prints **here** — but there was **no `.mailmap` in the repository**. The
resolution was coming from the owner's _global_ git config, which is not a property of the
repo and does not travel. GitHub, and every fresh clone, would have shown the raw objects:

| raw author                                                  | commits |
| ----------------------------------------------------------- | ------- |
| `Jaret Arnold <96366172+musharna@users.noreply.github.com>` | 161     |
| `Jaret Arnold` (personal address)                           | 40      |
| **`Michael Arnold`** (a second, older personal address)     | **3**   |

The two personal addresses are deliberately **not spelled out in this document**. They are
already present in the commit objects and therefore public once the repository is, but
there is no reason to additionally render them as prose on a page people read — the
mapping that matters lives in `.mailmap`, where the literal strings are load-bearing.

This is the second time in this release that a claim turned out to rest on machine-local
state rather than on the artifact — the same shape as a working tree not being the
authoritative ref.

**Fixed causally and without rewriting history:** a repo-level `.mailmap` now maps both
older identities onto the canonical one, so the resolution ships with the code.

Verified with both directions of the control:

```
# repo .mailmap, GLOBAL config disabled — what a stranger sees
204  Jaret Arnold <96366172+musharna@users.noreply.github.com>

# control, mailmap fully OFF — must still show three, or the test proves nothing
161 / 40 / 3
```

The positive case collapses to one identity and the negative case still shows three, so
the collapse is caused by the committed file and not by a leftover global setting.

⚠️ **For the coordinator, because it is explicitly flagged in the ship-plan memo as
"confirm with user before relicensing":** "Michael Arnold" is the owner's own full given
name (the ORCID record carries it as an other-name), so there is no third-party copyright
in this history and the MIT grant is unambiguous. Nothing here required a rewrite. Noting
it rather than deciding it.

### 5.4 Secret and privacy sweep

| sweep                                                             | result                     |
| ----------------------------------------------------------------- | -------------------------- |
| `gitleaks git --redact -v .` (full history, 200 commits, 4.12 MB) | **no leaks found**, exit 0 |
| `gitleaks dir --redact -v site/` (built artifact, 333 KB)         | **no leaks found**, exit 0 |

gitleaks 8.30.1.

**Absolute home paths — 2 hits, both justified rather than removed.**
`tools/run-bloom-fixed.sh:15` and `tools/run-rarity-premium.sh:17` default `NODE` to an
absolute nvm path. Each file already carries the reason in a comment: a non-interactive
jobd shell has no nvm shims, and `node: command not found` at dispatch is a failure this
project has hit twice. Both are overridable (`NODE_BIN`) and fail loudly (`exit 127` with
a message) rather than silently.

They were **deliberately left alone.** Adding a `command -v node` fallback would let a
run proceed on an unknown interpreter, which directly undermines the sibling guard in the
same file — _"`git rev-parse HEAD` does not identify the binary that actually ran"_. Trading
a reproducibility guarantee for a cosmetic path is the wrong trade. These are research
launchers; nothing in the published site or the suite touches them. The residual exposure
is a home-directory layout and an nvm version — no credential.

**Email addresses in tracked files — 3, all the owner's, all introduced by `.mailmap`.**
Counts (2 / 1 / 1) match that file exactly and no other tracked file contains an address.
The two older addresses were **already public in the commit objects**, so the mailmap adds
correct attribution without adding exposure; removing them would break the mapping. No
foreign emails, no `.ts.net` hostnames, no `/mnt/c/Users` paths anywhere in the tree.

## **DONE:** files exist; sweep output recorded clean.

## Stage 6 — Critic gate

**Started:** 2026-09-10 23:25 EDT

One fresh subagent, no shared context, given the locally served `site/` and
`docs/FINDINGS.md` and asked to find and rank defects. It returned **14 non-waivable and
12 waivable**. Every non-waivable claim was re-verified here before being acted on — the
critic itself retracted one of its own sub-agent's claims mid-review, so it is fallible
too, and two of its findings needed checking against the source before I would accept
them. **All 14 are now closed.** It was worth running: findings 3, 5, 6 and 12 are defects
this executor introduced, and three of them are of exactly the class this project keeps a
standing constraint about.

### 6.1 ⚠️⚠️ Two claims published EARLIER IN THIS DOCUMENT were wrong

**§4.4 said the smoke test asserted every canvas "non-blank" on load. It could not.**
Blankness was defined as PNG data-URL length `< 400`, which a **uniform fill passes**. That
is a check that cannot discriminate what it is trusted for. Replaced with a distinct-colour
count from `getImageData`, and controlled in both directions:

```
NEGATIVE CONTROL  synthetic uniform fill -> 1 distinct colour   OK
visit.html         on load: [65]
greybox.html       on load: [65]
population.html    on load: [1, 1]     <- TWO UNIFORM CANVASES
                   after #run: [65, 31]
```

So `population.html` was **uniform on load all along** and the old check reported it as
non-blank. The corrected position: population legitimately shows an empty plot area before
`#run`, so uniformity there is right and is **no longer asserted against**; what is asserted
is that `#run` draws and `#play` animates. `visit.html` and `greybox.html` genuinely render.
§4.4's row and the test's own summary line are corrected.

**§5.4 said "no `.ts.net` hostnames". True, and too narrow to mean what it implied.** The
sweep ran the brief's three patterns, none of which matches a **bare** hostname. The private
homelab nicknames `gt76` (3 documents) and `desktop` (5) are on the public surface.

Disposition: **kept, deliberately.** They appear as run provenance — "jobd 3514 on `gt76`",
"Job 3636 (gt76, 45.9 min)" — and this project uses which-host-ran-it as a real
cross-machine determinism check. Scrubbing them would damage the scientific record to hide
a machine nickname that is not an address, not resolvable and not a credential. What was
wrong was the **claim**, not the decision, and the claim is corrected here.

### 6.2 Non-waivable findings and their dispositions

| #   | finding                                                                                                                              | disposition                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | the internal executor brief sits on the merge target (`master`, `774cae0`) with two private paths, so the release sweep never saw it | **coordinator action, flagged in §7** — verified: absent from `release/1.0-rc`, present on `master`; `release/1.0-rc` is **7 ahead / 0 behind `origin/master`**, so a fast-forward publishes without touching `master`                                                                                                                                                                                                                            |
| 2   | the landing page's "Read the findings" link targets `blob/master/...`, which 404s until the merge lands                              | **sequence-dependent, not a defect** — Pages deploys _from_ `master`, so the site cannot exist before the merge that makes the link valid; recorded in §7 so the order is not broken                                                                                                                                                                                                                                                              |
| 3   | headline 3 cited a prereg registering none of its endpoints, and omitted that prereg's refuted prediction                            | **FIXED** — both pre-registrations now cited with what each registers, and the refutation of **P3 (equal-width invariance)** is stated in FINDINGS with its consequence                                                                                                                                                                                                                                                                           |
| 4   | headline 2 called the pool-size confound "excluded" while the source records it spanning zero under an equally defensible visit rule | **FIXED** — `HELD 0.289 → 0.026` and `H-pool +0.026 [0.000, 0.079]` now sit beside the headline at equal weight                                                                                                                                                                                                                                                                                                                                   |
| 5   | the bolded `−0.211` is registered **secondary 2**, under a rule saying "primary endpoints only"                                      | **FIXED** — the registered primary `−0.221 [−0.339, −0.101]` now leads; the secondary is labelled as one and the selection rule restated to match                                                                                                                                                                                                                                                                                                 |
| 6   | `hybrid-placement.md` printed two different intervals for one quantity after this release's correction                               | **FIXED** — the superseded z column is marked superseded beside the corrected t column, and the unqualified inference at `:66` now carries the qualifier                                                                                                                                                                                                                                                                                          |
| 7   | the `S=32` scope figure is pre-conservation, and that cell moved under the conservation fix                                          | **FIXED** — labelled pre-conservation, with the note that the scope condition has not been re-measured on the conserved build                                                                                                                                                                                                                                                                                                                     |
| 8   | private hostnames on the public surface; the §5.4 claim was narrower than it implied                                                 | **kept + claim corrected**, see 6.1                                                                                                                                                                                                                                                                                                                                                                                                               |
| 9   | a literal `/home/<user>/...` was the default value of `NODE` in two launchers                                                      | **FIXED** — `NODE=${NODE_BIN:?…}`, required rather than defaulted. The critic's fix is better than the justification I had written: it fails just as loudly, earlier, and **without** adding a PATH fallback, which would have let a run proceed on an unknown interpreter and undermined the sibling build-identity guard. ⚠️ **Behaviour change: these two scripts now require `NODE_BIN`.** The tree now contains **zero** absolute home paths |
| 10  | the three playables carry no link home, no repo, no author and no licence                                                            | **FIXED** — an inert footer added to each (home · findings · source · `MIT / CC-BY-4.0 © 2026 Jaret Arnold`), system fonts only, no outbound request                                                                                                                                                                                                                                                                                              |
| 11  | `CITATION.cff`'s single `license: MIT` contradicts the documented CC-BY-4.0 scope                                                    | **FIXED** — field scoped to code with an adjacent comment; CFF 1.2.0 cannot express a split licence, so the limitation is stated rather than hidden                                                                                                                                                                                                                                                                                               |
| 12  | the blankness check could not discriminate a uniform canvas                                                                          | **FIXED**, see 6.1                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 13  | an old personal address was spelled out in rendered public prose                                                                     | **FIXED** — replaced with a description; the literal strings remain only in `.mailmap`, where they are load-bearing                                                                                                                                                                                                                                                                                                                               |
| 14  | `gt76` appears in commit `0320110`'s message, reachable from the release branch                                                      | **accepted, recorded** — verified an ancestor of `release/1.0-rc`, one occurrence across all 205 commits. Same residual class as 6.1; removing it needs a history rewrite, which this release forbids. Coordinator may decide otherwise                                                                                                                                                                                                           |

### 6.3 Waivable

12 reported. None fixed, none required: they are presentation (mobile overflow on one
control, a clipped select, project vocabulary in FINDINGS, a non-verbatim quote, footer
code wrapping, stale authorship counts, three stale remote branches). Listed here as
**known presentation defects** rather than silently dropped. The three stale `origin`
branches (`flowering-time`, `selfing-sweep`, `spatial-ibm` — each strictly behind the
release with **0** commits ahead) are a remote operation and therefore the coordinator's;
they are noted in §7.

> ⚠️ **CORRECTED (release 1.0.1): "a non-verbatim quote" was waived without naming it, which made
> the waiver unauditable.** It was **`README.md:20-21`**, the Ballantyne quotation. As published it
> read `networks record "visits… rather than clearly defined effective pollination events."` The
> source (abstract, `10.1098/rspb.2015.1130`, verified against CrossRef) reads "most networks to
> date are based on recording **visits to flowers, rather than recording** clearly defined effective
> pollination events" — the ellipsis concealed the elision of a second "recording", so the span was
> not verbatim. **Fixed in 1.0.1** by quoting the source span in full rather than by dropping the
> quotation marks. The other front-page quote, Mailly _et al._ `10.3389/fevo.2025.1504480`, was
> re-checked against its abstract in the same pass and **was** verbatim.

### 6.4 Re-verification after the fixes

```
tools/build-site.sh && python3 tools/smoke-site.py      exit 0
```

All four entry points: HTTP 200, zero console errors, zero uncaught exceptions, links
resolving, `#run` drawing 2/2 and `#play` animating 2/2.

## **DONE: zero non-waivable remain.**

## Stage 7 — Handoff

**Completed:** 2026-09-11 00:05 EDT · **Executor stops here.**

### 7.1 The release candidate

|                  |                                                                                                                                                                                                                              |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **RC SHA**       | the tip of `release/1.0-rc` — resolve it with `rev-parse origin/release/1.0-rc` after fetching. It is the commit that adds this very section, so naming it inside itself would be circular; it is deliberately not hardcoded |
| **Branch**       | `release/1.0-rc` — the **only** thing pushed                                                                                                                                                                                 |
| **Base**         | `64e76ca`, the registered start SHA                                                                                                                                                                                          |
| **Position**     | **9 ahead / 0 behind `origin/master`** — a fast-forward is available. ⚠️ CORRECTED in 1.0.1; see the note below                                                                                                              |
| **Working tree** | clean                                                                                                                                                                                                                        |

> ⚠️ **CORRECTED (release 1.0.1): this document gave three different commit counts for one branch.**
> §6.2 row 1 says "**7** ahead", this table said "**8** ahead", and the listing below is headed
> "**Eight** commits" while containing **nine** entries. All three were written at different moments
> of a growing branch and none was updated. The settled number is **9**, measured after the fact:
> `git rev-list --count 64e76ca..origin/release/1.0-rc` → `9`. The earlier figures are left in place
> above and at §6.2 as the record of what was believed when each was written; this note is the
> correction. Nothing downstream depended on the count — the fast-forward it describes is unaffected.

Nine commits, oldest first (the eight below plus the tip that adds this section):

```
836a19c  release(1.0): stage 1 — branch from 64e76ca, baseline suite 363/363
1d92b24  fix(1.0): z-to-t corrections across four documents, clonal-control claim withdrawn
23ad2e6  docs(1.0): annotate the ROADMAP z-interval debt row, record the four-site inventory
545d16f  docs(1.0): FINDINGS for a stranger, README top rewritten, DOI inventory + ghostcite
68ac8e9  feat(1.0): static site staging dir, deterministic build script and Pages workflow
4b62830  test(1.0): headless smoke test asserting each page's own contract
96aa6ea  feat(1.0): licences, citation metadata, changelog, third-party inventory, mailmap
9d59eea  fix(1.0): close all 14 non-waivable critic findings
<tip>    docs(1.0): stage 7 handoff            <- this section, the RC tip
```

### 7.2 Evidence summary

| gate                     | result                                                                                                                                                   |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Test suite**           | **363 / 363 pass**, 0 fail, 0 skipped, 0 todo, exit 0 — run on the RC SHA                                                                                |
| **Disposition table**    | 8 rows, §2.4. No withdrawals needed: every claim-invalidating row was either already corrected upstream or exactly correctable from published statistics |
| **Erratum**              | 3 rows appended to `docs/2026-08-01-v2-result.md`. **One verdict change**, and it is the one that document had already retracted. No headline moved      |
| **ghostcite**            | 176/176 DOIs resolved, **0 retracted, 0 unresolvable**, exit 0. Seen to fail first against a known-retracted DOI (tier R, exit 1)                        |
| **gitleaks 8.30.1**      | **no leaks** over full history (205 commits, all refs) and over the built `site/`, exit 0 both                                                           |
| **Site smoke**           | 4/4 entry points HTTP 200, zero console errors, zero uncaught exceptions, links resolving, `#run` draws 2/2 and `#play` animates 2/2, exit 0             |
| **Clean-checkout build** | builds from a fresh clone and is **byte-identical** to the working-tree build                                                                            |
| **Critic gate**          | 14 non-waivable, **all 14 closed**; 12 waivable listed as known presentation defects                                                                     |

### 7.3 Rebuilding the site

```
cd pollination-morphology
tools/build-site.sh          # writes site/ — 7 files, deterministic, gitignored
python3 tools/smoke-site.py  # serves site/ and drives headless Chromium; exit 0 = green
```

CI does the same thing: `.github/workflows/pages.yml` runs `tools/build-site.sh`, asserts
the four files whose absence is silent in production, then uploads and deploys.

### 7.4 ⚠️⚠️ FOUR THINGS THE COORDINATOR MUST DECIDE — read before merging

**1. Merging on local `master` as it stands PUBLISHES THE INTERNAL BRIEF.** Local `master`
carries one unpushed commit, `774cae0`, adding
`docs/superpowers/specs/2026-09-10-ship-plan.md` — the executor brief, which contains
local machine paths and a grep recipe naming personal email domains. **It is absent from
`release/1.0-rc`, so this release's privacy sweep never covered it.** Because the RC is
9 ahead / 0 behind `origin/master` (⚠️ this read "8 ahead" as published; corrected in 1.0.1, see
§7.1 — the route below is unaffected), the clean route needs no merge at all:

```
git push origin release/1.0-rc:master     # fast-forward; local master untouched
```

If you prefer to merge locally, `git reset --hard origin/master` on `master` first.

**2. The Pages workflow fires on push to `master`, and your stated order merges BEFORE the
flip.** While the repo is private that run executes on a **billed** GitHub-hosted runner,
and it **fails anyway** because Pages is not enabled yet. Either flip before merging, or
leave the trigger as `workflow_dispatch`-only until Pages is on. A comment at the top of
the workflow records this.

**3. Both Pages actions are one major behind.** `upload-pages-artifact` is pinned `v3`
(current `v5.0.0`); `deploy-pages` is pinned `v4` (current `v5.0.1`). Both pinned tags were
resolved against the API and exist. They were kept deliberately — this workflow gets its
first execution in production and an untested major bump is the wrong risk to take
unattended — but bumping them is a reasonable call and yours to make.

**4. Two accepted residuals, both recorded rather than hidden.** The homelab nicknames
`gt76` and `desktop` appear as run provenance in 8 documents and, once, in the body of
commit `0320110` — which is an ancestor of the RC and can only be removed by rewriting
history, which this release forbids. Neither is an address or a credential. Kept for the
sake of the cross-machine determinism record; see §6.1 and finding 14.

Also noted, non-blocking: three `origin` branches — `flowering-time`, `selfing-sweep`,
`spatial-ibm` — are strictly behind the release with **0** commits ahead, and will publish
as dead clutter. Deleting them is a remote operation and therefore yours.

### 7.5 What the coordinator owns from here

Review this handoff → merge (or fast-forward, per 7.4 item 1) → audit non-branch surfaces
(wiki, issues, releases, deploy keys, webhooks) → flip public → enable Pages (source:
Actions) → smoke the live URL → tag `v1.0.0` on the deployed SHA → release → mint the
Zenodo concept DOI → add it to `CITATION.cff` → set description and topics → verify the
README's playable URL resolves.

**The executor has pushed `release/1.0-rc` and nothing else, and stops here.**
