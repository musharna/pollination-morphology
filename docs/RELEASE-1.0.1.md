# Release 1.0.1 — executor handoff

> **Release evidence log, not a findings document.** Nothing here is a scientific result. For the
> results read [FINDINGS.md](FINDINGS.md); for what comes next, [ROADMAP.md](ROADMAP.md).

**Repo:** `pollination-morphology` · **Branch:** `release/1.0.1-rc` · **Base:** `1a18147`
(`origin/master` at the time of branching) · **Plan:**
[`superpowers/specs/2026-09-11-v1.0.1-plan.md`](superpowers/specs/2026-09-11-v1.0.1-plan.md)

This release closes the punch list produced by the ten-judge review panel convened after 1.0.0
shipped. **Every change is to what is _said_, never to what was _measured_.** No experiment was
re-run, no analysis re-registered, nothing under `sim/` touched. The coordinator owns every remote
operation from here (merge, tag, release).

---

## 0. The release candidate

| | |
| ---------------- | ------------------------------------------------------------------------------- |
| **RC SHA** | resolve with `git rev-parse origin/release/1.0.1-rc` after fetching. It is the commit that adds this very section, so naming it here would be circular; deliberately not hardcoded, as in 1.0 |
| **Branch** | `release/1.0.1-rc` — the **only** thing pushed |
| **Base** | `1a18147`, `origin/master` at branch time |
| **Position** | ahead of `origin/master`, **0 behind** — a fast-forward is available. Resolve the exact count with `git rev-list --count origin/master..origin/release/1.0.1-rc` |
| **Working tree** | clean |

Commits on this branch, oldest first — the content is settled; the tip is whichever commit last
touched this document:

```
9342a58  fix(1.0.1): close the post-ship panel punch list — documentation only
79e04eb  fix(1.0.1): close the critic pass, and add the release handoff
<tip>    docs(1.0.1): release-candidate identity
```

⚠️ **No commit count is written here, on purpose.** `RELEASE-1.0.md` gave three different counts for
one branch — §6.2 "7 ahead", §7.1 "8 ahead" and "Eight commits" over nine entries — because each was
written at a different moment of a growing branch and none was updated. That is the defect item 12
corrects. A count hardcoded in a document that is itself part of the branch it counts cannot stay
true: the first draft of this very section said "Two commits" and was already wrong by the time the
commit containing it existed. So the count is given as a command to run, not as a number.

## 1. Scope compliance

The plan's allowlist permits corrections to statements, titles, misquoted numbers, links, metadata
and documentation structure; it forbids new experiments, changes to `sim/`, retuning, and changes to
any registered analysis.

| check                              | result                                                 |
| ---------------------------------- | ------------------------------------------------------ |
| files under `sim/` touched         | **none** — verified by `git diff --stat 1a18147..HEAD` |
| files under `experiments/` touched | **none**                                               |
| files under `tests/` touched       | **none**                                               |
| `docs/data/*` touched              | **none**                                               |
| experiments run                    | **none**                                               |
| registered analyses altered        | **none**                                               |

Two `sim/` files (`sim/placement.js:4`, `sim/browser-bundle.js:22`) still carry the
string "Grey-box v0" that item 14 retires from the page title. They were **left alone deliberately**:
`sim/` is outside the allowlist, and the strings are source comments, not rendered text.

## 2. Baseline

Measured on this machine before any edit, so the release has a true before-state:

```
node --test tests/          363/363 pass, 0 fail, 225.8 s      Node v18.19.1
```

## 3. Per-item disposition

Status key: **FIXED** · **FIXED, DIFFERENTLY** (the defect is closed but not by the remedy the plan
named, with the reason given) · **NOT FIXED** (with the reason).

| #   | item                                                                                 | status                 | evidence / reason                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --- | ------------------------------------------------------------------------------------ | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | README quotes 40% of the achievable ceiling; source says 52%                         | **FIXED**              | `README.md:96` now reads 52%, names the underlying figures (evolved L2 8.3 against a ceiling of 16) and cites `docs/2026-08-01-v1-result.md:51` with `:136` as the restatement. Both occurrences of "40%" in the old sentence pair are gone                                                                                                                                                                                                                                              |
| 2   | finding 1's title states the registered secondary                                    | **FIXED**              | Retitled `docs/FINDINGS.md:32` to the registered **primary** (spreading the floor thinner reduces coexistence, −0.221 vs the flat floor). The secondary (−0.211, the anchor crossing) is kept and still explicitly labelled a secondary. The landing-page note `tools/site-index.html:219-225` is rewritten the same way. The forking-paths disclosure now appears at `docs/FINDINGS.md:39-44`, quoting the prereg's own wording                                                         |
| 3   | +0.289 labelled `H-pool`, which was never registered                                 | **FIXED**              | `docs/FINDINGS.md:67` relabels the headline as the registered **`H-free`** contrast; `:72-77` states that `H-free` was registered as the expected NULL and that **the registered null was refuted**; `:85-89` marks `H-pool` post-hoc (verified) and notes it is numerically identical to `H-free` in the published table (`docs/2026-08-25-phenology.md:55,59`)                                                                                                                                    |
| 4   | ROADMAP prints the retracted z-interval; pool-size bullet overstates                 | **FIXED**              | `docs/ROADMAP.md` annotates the interval in place with the repo's `✅ CORRECTED @<sha>` convention — `~~[0.708, 0.910]~~ → ✅ CORRECTED @1d92b24 [0.706, 0.912]` — and annotates the "excluded by measurement" bullet to match FINDINGS (`H-pool` spans zero at `+0.026 [0.000, 0.079]` under the proportional visit rule, and is post-hoc). "Last updated" refreshed to 2026-09-11 with the previous date kept                                                                          |
| 5   | README says the ceiling number is "not yet in hand"                                  | **FIXED**              | Replaced with the measured result (14 within one region against the 1-D arm's 19), citing `docs/2026-08-28-euglossine-ceiling.md:56,67,71`, plus the caveat that the bound is loose in **both** directions and that settling it needs a single-site census                                                                                                                                                                                                                                  |
| 6   | README promises four results and never lists them                                    | **FIXED**              | New `## What was measured` table at `README.md:32` — number, interval, one caveat and a link per finding. The pre-pre-registration lab notebook now sits under `## Foundation` (`README.md:71`), with `### What is not claimed` beneath it. `L0`, `L1`, `L2`, `τ` and `IBM` are defined once in a terms table, each with a source reference                                                                                                                                              |
| 7   | euglossine re-run command points into gitignored `_scratch/`                         | **FIXED, DIFFERENTLY** | The plan's first choice — commit the parser verbatim — is **impossible**, not merely inconvenient. See §4                                                                                                                                                                                                                                                                                                                                                                                |
| 8   | three playable footers link a nonexistent `index.html`                               | **FIXED**              | All three now point at `https://musharna.github.io/pollination-morphology/`. Verified this does not perturb the smoke test: `tools/smoke-site.py:117-120` filters absolute `http(s)` hrefs out of its link check, and only `index.html` is link-checked at all — it still reports 3 same-origin links, all 200                                                                                                                                                                           |
| 9   | "Node 18 or newer" understates the real requirement                                  | **FIXED, DIFFERENTLY** | Requirements tables added to both `docs/FINDINGS.md` and `README.md` covering `NODE_BIN` and Playwright/Chromium. The plan's "**tests need Node ≥ 18.19**" is **not asserted**, because it could not be evidenced. See §4                                                                                                                                                                                                                                                                |
| 10  | re-run cost not stated                                                               | **FIXED, DIFFERENTLY** | A cost table now sits beside the four commands, stating plainly that **only finding 1 re-derives from a shipped archive** and findings 2–4 re-run a full sweep with no archive. Only finding 3's runtime is quoted (29.8 min, job 3572, `docs/2026-08-31-evolving-width-conserved.md:3`) because it is the only one on record. See §4                                                                                                                                                    |
| 11  | README cites a thesis with no DOI                                                    | **FIXED**              | Now cites the paper, _Mailly, Riotte-Lambert & Lihoreau 2025_, `10.3389/fevo.2025.1504480`. Verified against CrossRef this session: byline `Mailly Juliane; Riotte-Lambert Louise; Lihoreau Mathieu`, year `2025`, type `journal-article`, _Frontiers in Ecology and Evolution_. The DOI was **already** in `docs/dois.txt` (no addition needed)                                                                                                                                         |
| 12  | §6.3 waives an unnamed quote; §7.1 commit counts disagree                            | **FIXED**              | The quote is named as `README.md:20-21` (Ballantyne) and **fixed rather than de-quoted** — see §5. The three counts (7 / 8 / "Eight" over nine entries) are reconciled to the measured **9**, with the earlier figures left in place as the record of what was believed when written. A banner marks the file a release evidence log                                                                                                                                                     |
| 13  | a local home-directory path to an unpublished sibling project, in a shipped document | **FIXED**              | Three occurrences (`docs/2026-07-31-groundwork-axes.md:225,226,423` — the plan named two; a third was adjacent) replaced with "a sibling project (not published)". ⚠️ The path string is deliberately not repeated here or in `CHANGELOG.md`: naming it in the release notes would re-publish exactly what the item redacts. Grepping the tree for it now matches only the executor brief under `docs/superpowers/specs/`, which the plan itself flagged as an internal working document |
| 14  | `greybox.html` title carries a stale "v0"                                            | **FIXED**              | Title only. The two `sim/` comment occurrences are left, per §1                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 15  | `CITATION.cff` licence scope and `license-url`                                       | **FIXED, DIFFERENTLY** | The dual-licence comment was **already present** (the plan half-anticipated this). It has been corrected, because its stated reason was wrong, and `license-url` is deliberately **not** added. See §5                                                                                                                                                                                                                                                                                   |
| 16  | `CHANGELOG.md` needs a 1.0.1 section                                                 | **FIXED**              | `## [1.0.1] — 2026-09-11` added, listing every item above by number and grouped by the plan's own A/B/C tiers                                                                                                                                                                                                                                                                                                                                                                            |
| 17  | (optional) mixed-run-length table needs a warning                                    | **FIXED**              | A warning box now sits at the Round-2 table itself in `docs/2026-08-01-v2-result.md`, not only in the §2 prose 75 lines below it, and the two rows whose run length is actually established are marked inline                                                                                                                                                                                                                                                                            |

## 4. Three places the plan could not be followed as written

These are the items where doing exactly what the plan said would have put an unsupported claim into
the release. In each case the defect is still closed; the remedy differs.

### 4.1 Item 7 — the euglossine parser is unrecoverable, not merely missing

The plan says to commit the parser "verbatim from `_scratch/` if it still exists on the author's
machine — ask via the handoff if not". **It does not exist, and this is settled rather than assumed.**
Three independent checks, all negative:

| check                     | command                                                                                   | result                                                                          |
| ------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| ever tracked in any ref?  | `git rev-list --all` × `git ls-tree -r --name-only`, grepping every tree for `euglossine` | only `docs/2026-08-28-euglossine-ceiling.md` has ever existed under that name   |
| present anywhere on disk? | `find /home/mjarnold -name '*euglossine*'`                                                | two hits, both the `.md` — the repo copy and a copy inside a jobd run directory |
| is the input still here?  | `find /home/mjarnold -iname 'Pollination_List_RLT*'`                                      | **no hits** — the source spreadsheet is gone too                                |
| recoverable from stash?   | `git stash list`                                                                          | empty                                                                           |

So the plan's fallback applies. `docs/2026-08-28-euglossine-ceiling.md:7` now states that the
analysis script is not shipped, and — going slightly beyond the fallback — states the input and the
procedure (which Zenodo release, which file, count distinct orchid species per bee species,
range-wide and again per `region`) so the number can be re-derived by a fresh parse rather than
merely disbelieved. The gap is recorded in `docs/FINDINGS.md` under "How to reproduce".

**Coordinator decision available:** if a copy of that parser survives somewhere not searched here
(another machine, a backup), committing it under `tools/euglossine-ceiling.js` would close this
properly and the wording above should then be reverted.

### 4.2 Item 9 — the "Node ≥ 18.19" floor is not evidenced, so it is not claimed

The plan says to state that "tests need Node ≥ 18.19 (tested at 18.19.1)". The tested-at half is
true and is stated. **The floor half could not be sourced:**

- there is no `package.json`, no `engines` field, no `.nvmrc`, and no Node version pinned in
  `.github/workflows/`;
- the suite uses only `test()` and `it()` from `node:test` — no API that moves the floor to a
  specific 18.x patch (no `mock.timers`, no `--experimental-test-coverage`, no `--env-file`).

Publishing "≥ 18.19" would have been a number with no source, in a release whose own acceptance
criterion is that every number cites one. The documents therefore say: **Node 18 or newer for the
built-in test runner, verified on v18.19.1, which is the only version this release was tested
against.** That is strictly weaker and strictly true.

### 4.3 Item 10 — runtimes exist for one of the three findings, and none was invented

The plan describes findings 2–4 as "30–46-minute sweeps" and asks for the runtime beside each
command. Only **one** of the three has a runtime on record:

| finding                 | runtime in its result document                                                            |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| 2 (`phenology.js`)      | **none recorded**                                                                         |
| 3 (`evolving-width.js`) | **29.8 min**, job 3572, desktop, exit 0 — `docs/2026-08-31-evolving-width-conserved.md:3` |
| 4 (`spatial-ibm.js`)    | **none recorded**                                                                         |

Measuring the missing two would mean running the sweeps, which the scope allowlist forbids. So
finding 3's runtime is quoted with its source, findings 2 and 4 are marked "no runtime recorded",
and the 26–47 min figures from two _comparable_ sweeps (`docs/2026-09-01-empty-time.md:113`,
`docs/2026-09-01-rarity-premium.md:3`) are offered **explicitly as an analogy, not a measurement of
those two runs**. The load-bearing half of the item — which findings re-derive from an archive and
which re-run — is stated unambiguously and is fully verifiable from `docs/data/`.

## 5. Two findings the plan did not anticipate

### 5.1 The unnamed non-verbatim quote, identified

`RELEASE-1.0.md` §6.3 waived "a non-verbatim quote" without naming it, which made the waiver
unauditable — the point of item 12. It is **`README.md:20-21`**, the Ballantyne quotation. As
published:

> networks record "visits… rather than clearly defined effective pollination events."

The source abstract (`10.1098/rspb.2015.1130`, fetched from CrossRef this session) reads:

> "most networks to date are based on recording **visits to flowers, rather than recording** clearly
> defined effective pollination events"

The ellipsis stands in for "to flowers, rather than" — but the quote also silently drops the second
"recording", which falls **outside** the elided span. That is what made it non-verbatim rather than
merely abridged. Fixed by quoting the source span in full. The other front-page quote (Mailly
_et al._) was checked in the same pass against its own abstract and **was** verbatim.

### 5.2 `CITATION.cff` — the stated reason was wrong, and `license-url` does not apply

The existing comment said CFF 1.2.0 "provides only ONE `license` field". Checked against the
published schema (`citation-file-format/schema.json`): `license` is a `oneOf` that **does** accept an
array. The real obstacle is different and sharper — the schema annotates the array branch:

> "When there are multiple licenses, it is assumed their relationship is **OR**, not AND"

This repository's split is **AND**, by file class: code MIT _and_ prose CC-BY-4.0. A list would
therefore tell a reader they may take the **whole** work under either licence — a materially wrong
permission grant, not a cosmetic imprecision. The single identifier plus an explicit note is the
closest honest encoding, and the comment now gives that as the reason.

`license-url` is **deliberately not set**, contrary to the plan's "add `license-url` for both". Two
reasons, both from the schema: it is a single `url`, so it cannot carry two; and it is documented as
"only for non-standard licenses **not included in the SPDX License List**", while both `MIT` and
`CC-BY-4.0` are present in the schema's own 459-entry SPDX enum. Setting it would assert that this
project's licences are non-standard.

## 6. Acceptance gates

| gate                | command                                                     | result                                                                                                                                                                                                                  |
| ------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| suite               | `node --test tests/`                                        | **363/363 pass, 0 fail, exit 0**, 278.8 s — ⚠️ run locally under `heavy-run`, not via the broker; see §6.1 |
| site build          | `tools/build-site.sh`                                       | **exit 0** — 7 files written                                                                                                                                                                                            |
| site smoke          | `python3 tools/smoke-site.py`                               | **exit 0** — all four entry points HTTP 200, 0 console errors, 0 uncaught exceptions; 3 same-origin links 200; `visit` animating 1/1, `greybox` non-blank static, `population` idle 0/2 then `#run` 2/2 and `#play` 2/2 |
| citations           | `ghostcite --format doi --fail-on retraction docs/dois.txt` | **exit 0** — 176 entries, 176 with DOIs, **zero retractions** against the Retraction Watch snapshot 2026-07-14 (71,059 rows)                                                                                            |
| secrets, history    | `gitleaks git --redact .`                                   | **exit 0** — 206 commits, 4.20 MB, **no leaks found**                                                                                                                                                                   |
| secrets, built site | `gitleaks dir --redact site/`                               | **exit 0** — **no leaks found**                                                                                                                                                                                         |
| fresh critic        | independent pass over the landing page, FINDINGS and README | **1 non-waivable found and FIXED**; 0 secondary-as-primary; 0 dead links; 8 of 9 waivables also fixed; 1 critic finding rejected on re-check — see §6.2 |

⚠️ **Known limitation of the citation gate, carried forward from 1.0.** In `--format doi` mode
against a bare DOI list, ghostcite checks resolvability and retraction but **cannot** check
author–year correspondence, because a DOI list carries no claimed byline to compare against. Eleven
entries return tier `U` — DOIs that resolve at doi.org but are not in CrossRef, all of them DataCite
deposits (8 × Dryad, 3 × Zenodo/Cambridge). That is expected for data deposits and is not a defect.
The one citation this release actually changed was therefore verified **by hand against CrossRef**,
byline and year, and so was the other front-page quote's source (§5.1).

### 6.1 Suite

```
node --test tests/     363/363 pass · 0 fail · 0 skipped · 0 todo · exit 0 · 278.8 s
```

Against the pre-edit baseline of **363/363 in 225.8 s** (§2): same pass count, same fail count. The
wall-clock difference is host contention, not the suite — see below. This release changes no `.js`
file (§1), so the suite is expected to be untouched; it was run anyway rather than assumed.

⚠️ **This ran outside the job broker, and that was a deliberate call.** It was first submitted as
jobd job **3724** (`host_pin=laptop`). The pin was forced, not preferred: the repository and a `node`
binary exist only on this host — checked, `desktop` has neither. The broker then reported

```
blocked: non-preemptible job 3713 on laptop is holding the only eligible worker;
preempt with `job preempt 3713`
```

Job 3713 belongs to **another project**, had been running **4 h 42 min**, is non-preemptible, and
reports no ETA. Preempting it would have destroyed another session's in-flight work to unblock a
documentation release, so it was not preempted. Job 3724 was **cancelled** and the suite was run
locally under `heavy-run` (a memory-capped systemd user scope), once. The host was also carrying an
unrelated load spike (1-min load average 23.7 on 16 cores) during the run, which accounts for
278.8 s against the baseline's 225.8 s.

**Consequence for the coordinator:** the suite evidence above is from a local capped run, not from a
broker-scheduled one. If broker provenance is required for a release gate, this repo cannot supply
it today — `node` would first have to exist on a second host.

### 6.2 Fresh-critic pass

An independent pass was run over `tools/site-index.html`, `docs/FINDINGS.md` and `README.md`, with
the three non-waivable classes defined in advance: **(a)** a number disagreeing with its source,
**(b)** a title stating a secondary as primary, **(c)** a dead link. It traced every quantitative
claim in those files to its source document, resolved every link, built and checked `site/`, and
cross-checked against `ROADMAP.md` and `CHANGELOG.md`.

**Result by class:**

| class                                | found | disposition                                                                                                                     |
| ------------------------------------ | ----- | ------------------------------------------------------------------------------------------------------------------------------- |
| **(a)** number disagrees with source | **1** | **FIXED** — see below                                                                                                           |
| **(b)** secondary stated as primary  | **0** | all four headline findings verified against their pre-registrations. This was the 1.0.0 defect; items 2 and 3 closed it         |
| **(c)** dead link                    | **0** | all 22 relative targets in `README.md`, 20 in `FINDINGS.md` and 3 in `site-index.html` exist; the `github.com` links return 200 |

**The one non-waivable, in full**, because it is the most serious thing this release found and it
was **not** on the panel's list:

> `README.md` read: "Rare-biased visitation … Real animals reach that: converting Gigord et al. 2001
> gives an exponent of **−0.24** against the **−0.30** needed."

Neither number exists anywhere else in the repository. The source
(`docs/2026-08-04-rare-biased-visits.md:44-47`) gives exponents of **−0.259 / −0.248 / −0.228**,
i.e. `a ≈ 0.43`, against a criterion that "**inverts at `a ≤ 0.5`**" (`:30-31`) — and states "**it
clears the crossing**". `docs/ROADMAP.md:202-203` agrees: "**The bar IS met in nature**". So the
published sentence invented a threshold, and then used it to assert a **shortfall** in the same
breath as "Real animals reach that" — an inverted verdict on the front page, against the project's
own source. Corrected to the measured exponents and the real crossing.

Nine further findings were classified waivable/presentation. **Eight were fixed anyway** — all are
cheap, all are factual, and all fall inside the plan's allowlist (statements, titles, numbers that
misquote their source). They are listed as items 19–26 in `CHANGELOG.md`. The most substantive:
finding 3 was quoting three values with no intervals, one of which (`S=16`, `[−0.061, 0.228]`)
**spans zero**; and `docs/2026-08-25-phenology.md` headed its contrast table "The registered
contrasts" while listing the unregistered `H-pool` — the same defect as item 3, left in the source
document, which would have had FINDINGS disagreeing with its own citation.

**One critic finding was rejected on re-checking.** It reported `README.md`'s "three independent
re-measurements" as an over-count. `docs/2026-08-03-checks-rebaseline.md:114` says "it survives its
**third** independent re-measurement". The README is correct; no change made. Recorded here because
a critic pass that is never wrong has not been checked.

⚠️ **Informational, not a defect.** The live site at
`https://musharna.github.io/pollination-morphology/` returns **200** — Pages is already enabled — but
still serves the **1.0.0** landing page, including the secondary-as-headline note that item 2
retires. It resolves on deploy; nothing in the RC needs changing. The coordinator should expect the
public page to be wrong until the merge lands.

## 7. What the coordinator owns

1. **Merge.** `release/1.0.1-rc` is the only branch pushed.
2. **Tag and release** for 1.0.1.
3. **Item 7**, if a copy of the euglossine parser exists somewhere not searched here (§4.1).
4. **The Pages ordering hazard** from 1.0 still applies — see `RELEASE-1.0.md` §7.4.
5. ⚠️ **A residual that item 13 cannot close from inside this release.** The executor brief for
   this release, `docs/superpowers/specs/2026-09-11-v1.0.1-plan.md:77`, is **tracked and already on
   `origin/master`**, and it quotes the very path string item 13 removes from
   `groundwork-axes.md`. So the redaction is complete in the document a reader is pointed at, and
   incomplete in the repository as a whole.

   This is **low severity and stated rather than glossed**: it is a bare `~/<project>/...` fragment
   with no username, no hostname, no email; `gitleaks dir docs/superpowers/` is clean; and the whole
   sweep found exactly this one occurrence. It is left for the coordinator rather than fixed here
   because editing the brief an executor is executing corrupts the audit trail — the brief should
   record what was asked, not what was done.

   Note the contrast with 1.0: `RELEASE-1.0.md` §7.4 flagged that release's brief as carrying local
   machine paths **and personal email domains**, and it was deliberately **not shipped**. This
   release's brief _was_ shipped. If the coordinator wants parity, the options are (a) rewrite
   line 77 to "a local home-directory path" and amend, (b) untrack
   `docs/superpowers/specs/` as 1.0 did, or (c) accept and record it. Removing it from **history**
   would need a rewrite, which this release forbids.
