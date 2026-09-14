# Northstar A: the sandbox with a goal (2026-09-12)

Revised 2026-09-12 after an llm-panel audit (impaired: codex/astra unavailable); findings in the
coordinator's memory memo `northstar_panel_audit_2026-09-12.md`. Revised after round-2 panel audit
(R1-R21, each re-run against the engine); page-default numbers are filed in
`docs/2026-09-12-northstar-page-config-probe.md`.
Revised a third time 2026-09-13 after the round-3 panel: every card now opens only when its
measurement clears the EDGE of its null distribution over 30 seeds, tabulated per seed in
`docs/2026-09-13-northstar-null-tables.md` (the null tables) by `tools/northstar-null-tables.js`;
card 1's control moved (its old pair sat inside the null); card 2 carries a founding eligibility;
card 3 reads FUSED only; `demography` joins the reserved keys; M1 keeps the `d` path until M2
re-measures.
Revised a fourth time 2026-09-13 after the round-4 panel (29 findings, every one re-run against the
engine by an independent verifier; the responses are the last section of this document). Its two
root classes: **a stall that returns the parents is a win that cannot fail** (a run with zero
recruits in every generation read HELD), and **an edge defined by a seed is crossed by that seed**
(card 2's edge 0.433 was the rounded value of the seed that defined it, 0.4333...). A stalled
generation is now a loss at the engine (`fateOf` gains a `stalled` argument and a fifth string,
STALLED) and on every level; every edge is re-run at full precision and rounded outward
(`tools/northstar-null-tables.js edges`); cards 2 and 3 carry a second null (`randomMating`), a
founding eligibility and edges beyond both nulls; card 6 gets a per-seed null; ONE rng protocol,
the page's, is named and the tables are shown to use it; M1's founding recipe carries the signal
locus and its acceptance cannot pass on either branch; the grey rule compares the whole option
signature, not only N, generations and siteN.
Revised a fifth time 2026-09-14 after the round-5 panel (astra, 13 findings, 11 confirmed and 2 partial by an
independent verifier, plus 3 the verifier added). Root classes: **a fixture the spec prescribes must be run before
it is written down** (the reach-0 STALLED pair cannot found at reach 0; the fixture founds at `DEFAULT_BEE` and
switches `reach` for the loop, section 3), **a recipe written as "and the same for" drops a plant** (M1's founding
now writes `half` and `N - half`, section 3), and **a test that executes a copy tests the copy** (the fidelity test
now executes the page's own loop file, section 9). Also: the deck's test gets an owner (M3b), a recursive value
check and a sixth must-fail row; the smoke asserts card state per acceptance line; ONE reserved-key criterion
(distributional) applied to `linkSignal` and `space` alike; chapter 5's tube weight rewritten so selfing falls
with outcross receipt and the floor survives at zero; chapter 6's control is a two-morph founding under
`randomMating`; chapter 8's input is `dispersalUnit`. Responses to all 16 findings at the end.

Design spec. Engine at master `2fc9414` (unchanged under `sim/` since `d18f972`; `git log
d18f972..HEAD -- sim/` is empty). Every claim about current code carries a `file:line`; every
number carries its result document and the configuration (N, generations, siteN) it was measured
at. Nothing here changes a measurement; the one change registered under `sim/` (section 8) adds a
fate string and alters no existing caller's result.

## 1. Northstar

A visitor sees two flowers and one bee, with every shape gene of both flowers as a labelled
slider, and watches the pollen dot on the bee's body move as the sliders move. They are asked to
make the two lineages coexist: press RUN, and the population evolves under the same loop the
experiments used until the fate reads HELD. They fail, and the page tells them which measured
quantity failed them and which finding already recorded that failure.

## 2. What exists today and is reused

What you would see: `population.html` already runs the IBM in the browser, draws a field of
flowers from their genomes, draws the pollen on a bee, and prints a fate. The sandbox is that
page with the genomes opened up and a goal attached.

| piece                | where                                                                                                                                   | what it does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| shape genome         | `sim/evolve.js:28-38`                                                                                                                   | seven bounded loci `GENE_BOUNDS` plus the wrapping `antherTheta` (`ANGLE_GENE`, `:38`)                                                                                                                                                                                                                                                                                                                                                                                                               |
| genome to flower     | `sim/evolve.js:134-141`                                                                                                                 | `toFlower`: stigma tracks anther, `stigmaT: Math.min(0.92, g.antherT + HERKOGAMY)` (`:139`, clamp included) with `HERKOGAMY = 0.05` (`:52`)                                                                                                                                                                                                                                                                                                                                                          |
| placement            | `sim/placement.js:7-9`                                                                                                                  | "PLACEMENT IS NEVER A GENE. Nothing here takes a placement site as an input"; the two contact mechanisms at `:21-37`                                                                                                                                                                                                                                                                                                                                                                                 |
| the bee              | `sim/placement.js:150-159`                                                                                                              | `DEFAULT_BEE`: `bodyLen` (`:151`), four named regions (`:152-157`), `reach` (`:158`). Not a genome anywhere                                                                                                                                                                                                                                                                                                                                                                                          |
| IBM genome           | `sim/ibm.js:53,72-73`                                                                                                                   | `GENE_KEYS = Object.keys(E.GENE_BOUNDS)`; additive diploid expression at `:283-287`; `shapeOf` at `:301` drops the signal locus                                                                                                                                                                                                                                                                                                                                                                      |
| two founded lineages | `sim/ibm.js:561-594`                                                                                                                    | `foundTwoLineages(n, rng, srng, targetD, opts)` mutates a base genome until a placement `targetD` away is found; ancestry labels 0 and 1 (`:584-592`); returns `{ pop, realised: best.d, gA, gB }` (`:594`)                                                                                                                                                                                                                                                                                          |
| a generation         | `sim/ibm.js:1124-1133`                                                                                                                  | `step(pop, opts, rng, gen, srng, brng, wrng, crng)`; returns `received` (`:2279`), `cluster` (`:2281`), `ancVar` (`:2286`)                                                                                                                                                                                                                                                                                                                                                                           |
| fate                 | `sim/ibm.js:539-546`                                                                                                                    | `BOTH LOST` if extinct or fewer than 2 plants (`:540`); `HELD` if final ancestry variance > 0.4 x founding (`:543`); `one lost` if mean ancestry < 0.15 or > 0.85 (`:544`); else `FUSED` (`:545`). Canonical, not the only copy: the comment at `:525-532` says five experiments hold a copy; `grep -l "function fate(" experiments/*.js` finds eight (`experiments/secondary-contact.js:108` has no `BOTH LOST`) and the page has one (`population.html:1025-1032`); the sandbox calls `IBM.fateOf` |
| ancestry variance    | `sim/ibm.js:470-474`                                                                                                                    | plain variance of the tracer                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| hybrid definition    | `experiments/hybrids-or-balance.js:64-65,87`                                                                                            | ancestry strictly between 0.15 and 0.85 (not in `sim/`, page-side arithmetic on the `anc` array)                                                                                                                                                                                                                                                                                                                                                                                                     |
| gap occupancy        | `sim/ibm.js:1107`                                                                                                                       | `gapOccupancy(places, pA, pB)` against founding placements                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| the mating rule      | `sim/ibm.js:2120-2204`                                                                                                                  | parentage from the transfer matrix `T`: mother by `weight` (`:2130`), sires by `r.T[i][mother]` (`:2201-2203`), father drawn at `:2204`; `randomMating` severs exactly this link (`:2123-2130`, uniform sires `:2203`). See the paragraph in section 13                                                                                                                                                                                                                                              |
| the page's run loop  | `population.html:717-776`                                                                                                               | `buildRun`: reads N, seed, generations, d, mating mode (`:718-722`); calls `I.foundTwoLineages` (`:727`); drives `I.step(pop, opts, rng, g, srng)` itself, no `brng`/`wrng`/`crng` (`:754-760`); stores `flowers`, `sites`, `sep = res.cluster.separation`, `ancVar` per generation (`:762-772`); returns `realised` (`:775`)                                                                                                                                                                        |
| loop fidelity test   | `tests/browser-bundle.test.js:157-200`                                                                                                  | "the page's own generation loop reproduces run() exactly"; it calls `I.step(pop, opts, rng, g, srng)` with `DEFAULTS` only (`:165,183`). It asserts a COPY of the loop with restarted streams (`const rng = E.makeRng(seed)` at `:177-178`, after founding) against `run({found})`, which restarts them too (`sim/ibm.js:2373-2376`); the page founds and steps on ONE `rng` (`population.html:725-727`). It does not test the page's protocol; M1 rewrites it (section 9, the protocol paragraph)                                                                                                                                                                                                                                                                                                                                                              |
| bundle               | `sim/browser-bundle.js`, built by `tools/build-browser-bundle.js:29-45`                                                                 | globals `Placement`, `Packing`, `Carryover`, `Evolve`, `Deception`, `IBM`; page aliases at `population.html:270-272`                                                                                                                                                                                                                                                                                                                                                                                 |
| 3D renderer          | `population.html:437` (ancestry tint), `:645` (pollen at the model's own `(s, phi)`), `:686` (scene dressing labelled as such)          | canvas `#field` (`:220`), drag to orbit. Draws the logged bout: `draw` clears the canvas (`:814`), reads `G.log` and returns if it is empty (`:826-828`). Under `phenology` the engine logs no bout, `log: !PH && opts.logBout && bi === 0 ? opts.logBout : null` (`sim/ibm.js:1438`, "THE SLICED PATH DOES NOT LOG", `:1432-1437`), so on levels 4 and 5 the field would be blank; M3b adds the no-log fallback (section 9)                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| body map             | `population.html:248-261`, `drawMap` ending at `:1023`                                                                                  | placements plotted on the animal, along the body vs around it                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| fate tile            | `population.html:236-243`, `fateOf` copy at `:1025-1032`, `show` at `:1034-1049`                                                        | tiles: generation, cluster separation, ancestry variance, fate                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| site build           | `tools/build-site.sh:19-25`                                                                                                             | allowlist `visit.html population.html greybox.html` plus `sim/placement.js sim/browser-bundle.js`; script-src check `:56-69`                                                                                                                                                                                                                                                                                                                                                                         |
| smoke                | `tools/smoke-site.py:40-45` SPEC; `:162-186` clicks `#run`, waits up to 60 s for `#play` to enable (`:165`), asserts the canvas changed | NOT run by CI: `.github/workflows/pages.yml:27-44` runs `build-site.sh` and four `test -f` asserts, and `grep smoke .github/` is empty. Adding it is an M4 item (section 9)                                                                                                                                                                                                                                                                                                                          |

Not reused: `visit.html` exposes two controls on flower B only (`theta` at `:147`, `pol` at
`:152`, applied at `:907-912`), loads `sim/placement.js` alone (`:174`), and animates a scripted
nine-phase visit (`:690-698`). `greybox.html` has the same two sliders (`:149,154`) and no run.

**Two configurations, stated once.** The page runs N = 18 for 24 generations
(`population.html:194-198`) at `siteN: 90` (`sim/ibm.js:600`); every experiment cited below ran
N = 30, 35 generations, siteN 160 (`experiments/secondary-contact.js:66-69`;
`experiments/gap-occupancy.js:52-65`; `experiments/phenology.js:40-42`;
`experiments/rare-floor.js:28-32`; `docs/2026-08-31-evolving-width-conserved.md:6`;
`docs/2026-09-06-selfing-cover.md:5-7`). No band or rate from a result document applies at the page
defaults. The few page-default numbers used here (the cluster-tile example, the level 5 check, the
card 5 seed pairs) come from one dated probe with its commands and output,
`docs/2026-09-12-northstar-page-config-probe.md` (the probe doc). The null distribution every card
must clear, seed by seed at both configurations, is in `docs/2026-09-13-northstar-null-tables.md`
(the null tables), produced by `tools/northstar-null-tables.js`; that is where M2's controls and
every card's edge now come from.

## 3. The sandbox screen

What you would see, top to bottom:

1. **Two gene panels, "lineage 1" and "lineage 2"**, each with eight labelled sliders whose
   ranges are read from `Evolve.GENE_BOUNDS` at load, never retyped:

   | gene            | bounds (`sim/evolve.js:29-35`)   | label on the page              |
   | --------------- | -------------------------------- | ------------------------------ |
   | `axisLen`       | 1.8 to 3.2                       | tube length                    |
   | `mouthR`        | 0.55 to 1.0                      | mouth radius                   |
   | `throatR`       | 0.16 to 0.5                      | throat radius                  |
   | `curve`         | 0.0 to 0.6                       | tube curvature                 |
   | `polarity`      | 0.05 to 0.95                     | symmetry (radial to bilateral) |
   | `antherT`       | 0.35 to 0.85                     | anther depth                   |
   | `antherProject` | 0.15 to 0.5                      | anther projection              |
   | `antherTheta`   | wraps, -pi to pi (`:38`, `:118`) | anther angle around the tube   |

   No stigma control: `toFlower` derives it, `Math.min(0.92, antherT + HERKOGAMY)`
   (`sim/evolve.js:139`), and the page says so under the panel, clamp included. No placement
   control of any kind (`docs/ROADMAP.md:1783`).

2. **The bee**, drawn once between the panels, with its regions named from
   `DEFAULT_BEE.regions` (`sim/placement.js:152-157`). `reach` (`:158`) and `bodyLen` (`:151`)
   are two sliders labelled "bee, fixed for the run" (section 12, answered). Both lineages'
   anther and stigma sites are drawn on the body live as the sliders move, via
   `Placement.placementDistribution(toFlower(g), bee, {part})` (the call `sim/evolve.js:155-165`
   already makes) and `IBM.placementOf` on `sitesOf` (`sim/ibm.js:563-564`). The label under the
   bee reads "computed from the shapes above, not settable". A flower whose distribution has no
   hits (`sim/evolve.js:165`, "never touches the animal") draws no dot and the panel reads "this
   flower never touches the bee".

3. **Realised separation**, the body distance between the two lineages' anther sites, computed
   as `foundTwoLineages` computes `realised` (`dist(p0, p)`, `sim/ibm.js:575`, returned as
   `best.d` at `:594`; `dist` at `:825`), with the band from section 6 and level 1's target
   "reach 8" beside it from the moment the page loads, so there is a gradient before any run. It
   is NOT the "cluster separation" tile: that is `res.cluster.separation` (`population.html:767`),
   a ratio with an unbounded denominator (`sim/ibm.js:920`) reading 31.62 at generation 0 for
   realised 8.124 and 16.25 for realised 7.663 (page defaults, seeds 1 and 4, probe doc). The two are labelled differently and never share a band.

4. **Run controls**, from `population.html:184-217`: seed, N, generations, mating mode
   (placement-mediated vs random null). The `d` input (`:188-191`) goes away: the sandbox founds
   the two lineages from the two hand-set genomes, so `foundTwoLineages`'s search
   (`sim/ibm.js:568-579`) is replaced by
   `foundPopulation(half, rng, {spread: 0.02, srng, base: {...g1, [IBM.SIGNAL_GENE]: srng()}, anc: 0})`
   for lineage 1 and `foundPopulation(N - half, rng, {spread: 0.02, srng, base: {...g2, [IBM.SIGNAL_GENE]: srng()}, anc: 1})`
   for lineage 2, with `half = Math.floor(N / 2)`, exactly as `foundTwoLineages` splits it (`:584-592`);
   round 5: an earlier draft wrote "and the same for `g2`", which an executor reads as `half` twice,
   and at odd N that founds N - 1 plants (verified: N = 5 gives 4 founders, N = 31 gives 30) while
   passing the finite-allele acceptance, so M1's acceptance now counts founders and labels.
   The `base` MUST carry the signal locus:
   `foundPopulation` takes `base` whole (`b = base || {...randomGenome, [SIGNAL_GENE]: sr()}`,
   `:438`) and then wraps `h[SIGNAL_GENE] + gauss * spread` (`:442`), so a base of the eight shape
   sliders alone gives `NaN` signal on every founder (round 4, verified: founders' signal
   `[[NaN, NaN], ...]`; with `signal: 0.5` in the base, 0.476 to 0.538). The two signal draws come
   from `srng` in the order lineage 1, lineage 2, as `foundTwoLineages` draws its own (`:562,572`).
   Placement stays derived; only the founding genomes change source. Levels set N, generations
   and `siteN` (section 5); the free sandbox keeps the page defaults.

5. **The field and the body map**, as today (`population.html:220`, `:248`), plus the scrubber and
   the four tiles, plus two new tiles computed from data the page already holds:
   **hybrid fraction** = share of `G.anc` strictly between 0.15 and 0.85
   (`experiments/hybrids-or-balance.js:64-65,87`; `anc` per generation at `population.html:742`)
   and **gap occupancy** = `IBM.gapOccupancy(places, p1, p2)` (`sim/ibm.js:1107`) with `p1, p2` the
   founding placements held fixed, each `IBM.placementOf(IBM.sitesOf([{ h1: g, h2: g }], opts, 0)[0])`
   on a founding genome, the recipe `foundTwoLineages` uses (`sim/ibm.js:563-564`) (`docs/ROADMAP.md:252-253`: re-deriving the gap from the current
   cloud "would report an empty gap forever"). Round 5: a founding genome that never touches the
   bee has a `null` placement (`:813-815`), and `gapOccupancy` with a `null` reference throws
   (`dist(pA, pB)` at `:1089` reads `.s` of it; verified `TypeError`), so the page never calls it
   with one: founding on the page requires both placements non-null at the bee the sliders set (a
   `null` blocks the run with "this flower never touches the bee", item 2), and the gap tile reads
   "unavailable: a founder never touches the bee" on any frame where either is `null`.

**The goal, in the engine's terms.** "Coexist" means the fate tile reads **HELD** at the last
generation: `ancestryVar(finalPop) > 0.4 * ancVar0` (`sim/ibm.js:543`), the engine's own
predicate. For an even split of labels 0 and 1 the founding variance is 0.25, so the HELD line
sits at 0.10 (arithmetic on `:470-474` and `:584-592`; the page draws the line from the run's own
`GENS[0].ancVar`, not from this constant). The edge of that predicate is printed: at N = 18, 3 plants
of one label and 15 of the other give variance 0.139, above 0.10, so HELD can read with one
lineage down to 3 of 18; the tile shows the label counts beside the fate. The other fates are the
engine's: `one lost`, `FUSED`, and `BOTH LOST` when extinct or below 2 plants (`:540,544-545`).
The page prints "one lineage lost" today (`population.html:1030`) where the engine prints "one
lost" (`sim/ibm.js:545`); the sandbox uses the engine's strings verbatim, and
`tests/browser-bundle.test.js:157` is extended to assert the page's `fateOf` returns them.

**A stall is a loss.** A generation that recruits nothing hands the parents back unchanged:
`pop: opts.demography ? next : next.length ? next : pop` (`sim/ibm.js:2246`), with `recruits:
next.length` (`:2256`) and `stalled: next.length < target` (`:2345`) returned beside it. The
population, its ancestry variance and therefore `fateOf` are then those of the founders, and a run
that never reproduces reads HELD: at the level configuration, founded at `DEFAULT_BEE` and stepped
with `bee.reach` 0, 35 of 35 generations recruit zero, the final variance is 0.25 = the founding
variance, and the fate reads HELD; the control stepped at `reach` 0.85 recruits 1050 and reads
`one lost` (round 4, verified; round 5 re-run). **The fixture's protocol, stated because it cannot
be run any other way** (round 5): `foundTwoLineages(30, rng, srng, 8, {...DEFAULTS, siteN: 160})`
at `DEFAULT_BEE`, then every `step` with `{...opts, bee: {...DEFAULT_BEE, reach}}`; founding AT
reach 0 returns `null` (`foundTwoLineages`, `:565-566`, no anther hits, `:813-815`), so a fixture
that sets `reach` before founding founds nothing and throws in `gapOccupancy`. That is
a win that cannot fail, so the sandbox never scores a stalled run as HELD. Engine level (the one
change under `sim/`, section 8): `fateOf(finalPop, ancVar0, extinct, stalled = false)` returns
**STALLED** when `stalled` is true, tested AFTER the extinction line (`:540`, `BOTH LOST` on an
extinct or sub-2 population) and before the HELD line (`:543`); every existing caller passes three
arguments and is unchanged. Under `demography` a generation that recruits nothing returns an EMPTY
population (`:2246`, `next` not `pop`; verified with K = 0: recruits 0, length 0, `stalled` false)
and reads `BOTH LOST`, never STALLED; `demography` is reserved and no level sets it, so that case
is the engine's, not the page's (round 5). The page passes `stalled` = true when any generation's
`recruits` (`:2256`) was 0, the exact case in which `:2246` returns the parents; the broader
engine flag at `:2345` (an under-filled generation that still shrank) is printed as a count and
does not score. STALLED is a loss on every level (section 5) and opens no card: no card's fate
condition names it, and the tile itself prints "k of G generations recruited nothing" as the
reason. `experiments/density-dependence.js:432-435` already keeps stalls visible for the same
reason ("a frozen run would otherwise read as a clean result").

## 4. Why you failed

What you would see: after a run ends, one or two cards open under the fate tile, each naming a
measured quantity, its value, the band it crossed, and the finding. Cards 1 to 5 read a run that
ended `one lost` or FUSED; card 6 reads any fate, because it explains a trait, not a failure; a
STALLED run opens none (section 3). No card is attached to a level.

**The trigger rule.** Every card opens on a quantity measured on this run, or on this run paired
with its named rerun, never on an input: not an option's value, not the founding separation, not
the mating mode. Each card names its null arm, the run where its explanation cannot be true, and
its threshold sits beyond the EDGE of that arm's distribution: the most extreme value any null seed
reached in the null tables (seeds 1 to 30 per arm, at the configuration the card is read at; seed
18 founds nothing at either target under either configuration and is the one gap), never the arm's
mean. A mean is a value the null crosses about half the time; the round-3 panel found card 1's old
band, set from ten null seeds, inside the null on 15 of 28 further seeds. **An edge is rounded
outward** (round 4): rows print to three decimals, and card 2's committed 0.433 was the printed
value of the seed that defined it, whose peak is 0.43333..., ABOVE 0.433, so the null crossed its
own edge; every edge below comes from `tools/northstar-null-tables.js edges`, which re-runs the
defining seed at full precision and rounds an upper edge up and a lower edge down (one more step
when the rounding lands on the value), so the defining seed sits strictly on the null side. An
option condition may narrow when a card is eligible; it is never the reason a card is closed on
its null: for every null arm the card names, the count of null seeds reaching the card's FULL
signature is 0 in the tables, and the row says which measured component closes it. The null arms:
cards 1 and 4, the same seed under `randomMating` (`population.html:722`), which severs placement
from parentage (`sim/ibm.js:2123-2130`, uniform sires `:2203`) but not from receipt, so a receipt
quantity is placement-derived on both arms; cards 2 and 3, TWO nulls (round 4): a = 1, where no
subsidy exists, and the same seed under `randomMating`, where a filled gap is not a bridge because
parentage ignores placement (the round-4 panel opened both cards there), closed by the lead
statistic in the row; card 5, the same seed at q = 0, the flat floor; card 6, the same seed with
`shuffleWidth`, whose edge is the per-seed shuffled-against-shuffled null (round 4). **The
signature rule** (round 4, replacing the N / generations / siteN rule): a card is drawn grey on any
run whose (N, generations, siteN, mating mode, option object) is not the exact signature its null
table was run at, in both directions, and prints "measured at ...; this run ..." instead of
opening. Cards 1 and 4: `DEFAULTS` plus `siteN` at either configuration, no option key set, so
`demography`, `space`, `allocExponent`, `selfing`, `phenology` and `linkSignal` all grey them
(round 4: with `demography {K: 2}` a run reads `one lost` with 0 hybrid generations from
demographic loss, which would have opened card 4). Cards 2 and 3: the level configuration with
`allocExponent` alone. Card 5: level 4's exact object. Card 6: the null tables' exact phenology
object (`{slices: 8, widthLocus: true, widthMut: 0.03, conserveDisplay: true}`), because its edge
was measured with `conserveDisplay` and `widthMut` 0.03 and a flipped `widthLocus` on level 5's
first object loads neither (round 4). The smoke test (section 9) runs each null and asserts the
quantity sits on the null side of the edge, not that the card is closed.

| card                                            | fate condition | option condition                                                                                                                                                                  | measured quantity and band                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | what the card says, with source and its config                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1. hybrids pay from geometry | `one lost` or FUSED | signature: `DEFAULTS` at the page configuration, placement-mediated (`!randomMating`), no option key set | the run's own hybrid receipt: mean `received` (`sim/ibm.js:1777-1782`, returned `:2279`) of plants whose `anc` is strictly in (0.15, 0.85) over mean `received` of the rest, read on the PARENTS of each generation (the `anc` array is taken before `step`, `population.html:742`; `tools/northstar-null-tables.js:112-116`), in the last generation where both sets are non-empty; the card prints how many generations' parents held a hybrid. Opens when the ratio is below **0.603**, the lowest value any of the 58 null runs reached at the page configuration (target 8, seed 22, re-run at full precision 0.60324 and rounded DOWN, so the seed is not below it; the target-4 null floor is 0.642, seed 19 at 0.64205; two null runs read Infinity, the rest received nothing; null tables, `edges`). Closed when either set is always empty. At the level configuration a null run reaches exactly 0 (target 8, seed 29: hybrids present, none received), so no threshold exists there (`edges` prints "no edge", round 5, where it printed -0.001) and the card is grey on levels 2 to 6. Control at the page configuration: target 4, seed 16 reads `one lost`, hybrids in 1 of 24 generations, ratio 0.111; the same seed's null reads FUSED, 23 of 24, 1.085. Five of 58 placement-mediated runs clear the edge (target 4 seeds 16, 19, 20, 24; target 8 seed 25). The round-2 control, target 4 seed 3 at 0.842, sat inside the null and is retired. Round 4: the statistic is maternal-role, non-clonal receipt, not the document's (next cell); with identical hand-set genomes it opens only under `mutRate` 0 and `visits` 10 (ratio 0.309, seed 1), neither a page control, and at the page defaults identical genomes read 0.819 to 1.330 over seeds 1 to 5, card closed | the card says "hybrids received less than the rest of the field": hybrids land between their parents (`sim/ibm.js:38-41`). The constructed experiment's 0.809 [0.706, 0.912], a 19.1% cost from geometry alone (`docs/2026-08-02-hybrid-placement.md:60-64,75`; `docs/FINDINGS.md:196-198`), is a DIFFERENT statistic: transfer summed over both sex roles, `T[i][j] + T[j][i]` (`experiments/hybrid-placement.js:262-274`), as the ratio of the hybrid rare among its parents to the hybrid among clones of itself (`docs/2026-08-02-hybrid-placement.md:54-57`); the card prints it labelled as that statistic, as the document's number, never as this run's second reading |
| 2. the shared pollinator is the bridge | FUSED | signature: level configuration, `allocExponent` set and < 1 (`sim/ibm.js:686`, `null` = no bias), placement-mediated; founded at target 8 (realised separation 7.6 or more, printed as eligibility, never the trigger). At target 4 the card has no threshold: the a = 1 null there reaches its whole signature (8 of 10 seeds FUSED, peaks to 0.900, leads to 4; `edges` 0.901 / 0.597 with 0 of 10 a = 0.25 seeds above), so it is grey there, as answered question 4 provides | three quantities on this run, together beyond BOTH nulls: (i) fate FUSED; (ii) peak gap occupancy over the run (`IBM.gapOccupancy`, founding placements fixed) above **0.434**, the a = 1 edge (seed 13, `one lost`, whose peak is 0.43333..., re-run at full precision and rounded UP; the round-3 value 0.433 sat below it and the seed crossed it); (iii) the LEAD, the generation ancestry variance first halved minus the generation the gap first held 10% of plants (the ordering of `docs/2026-08-05-gap-occupancy.md:66-68`), above **1**, the `randomMating` edge. Under random mating the same seeds fuse at once (58 of 58 rows FUSED, variance halves at generation 1 or 2, lead -1 to 1) with peaks 0.467 to 0.909 and means 0.266 to 0.634, so gap occupancy alone cannot tell a bridge from random mating; a lead can, because a bridge fills the gap before the lineages merge and random mating merges them first. Counts (null tables, d = 8, N = 30, 35 generations, siteN 160): the a = 1 null reaches the full signature in 0 of 29 seeds (0 fuse; max peak 0.4333); the `randomMating` null in 0 of 58 rows (max lead 1); at a = 0.25 the card opens in 5 of 29 seeds (6, 17, 20, 23, 25; peaks 0.633 to 0.800, leads 2 to 3) of 8 that fused. The document's 0.129 (`docs/2026-08-05-gap-occupancy.md:122`) is the a = 1 arm's mean over 12 seeds and sat inside the null | intermediates sit at d/2 where the barrier is leaky, m = 0.083 (`docs/2026-08-04-rare-biased-visits.md:103-104`); at a = 0.25, d = 8, 35 generations, 40 seeds, in 11 of the 12 FUSED replicates the gap filled first (`docs/2026-08-05-gap-occupancy.md:66-73`; `docs/ROADMAP.md:254-255`). That count is a = 0.25 only; at a = 1 no replicate fused (`:122`, 0 / 0 / 12) |
| 3. preferring the rare defeats itself | FUSED | the same signature and founding eligibility as card 2 (round 4: card 3 had none, and at target 4 its a = 1 null reaches means to 0.596, so only the option kept it closed there; and at a = 1 - epsilon a run is identical to its a = 1 null, seed 8 at target 4, mean 0.596 either way, which the eligibility now greys) | three quantities, together beyond both nulls: fate FUSED; mean gap occupancy over the run above **0.170**, the a = 1 edge (seed 13, mean 0.16952, so 0.170 already sits above it; the document's 0.024 at `docs/2026-08-05-gap-occupancy.md:122` is the arm mean and sat inside the null); and the lead above **1**, the `randomMating` edge as on card 2 (the random-mating null reaches means to 0.634, so the mean alone cannot close it). FUSED only: at a = 0.25 the gap fills and one lineage is still lost in 17 of 29 seeds (seeds 1 and 2, means 0.238 and 0.143), and the document says gap-filling is not sufficient for fusion (`docs/2026-08-05-gap-occupancy.md:78-81`), so a `one lost` run does not show the subsidy defeating itself. Null counts: a = 1 reaches the full signature in 0 of 29 seeds, `randomMating` in 0 of 58 rows. Opens in 4 of 29 a = 0.25 seeds (6, 17, 23, 25; means 0.249 to 0.548, leads 2 to 3). No visit-weight trigger: `allocWeights(sites, a, n)` (`sim/ibm.js:845`) weighs a site set, and the engine offers no midpoint-plant call | the document's constructed intermediate at d/2 draws 136x the visits of an ordinary plant at d = 8, computed, not measured on a run (`docs/2026-08-04-rare-biased-visits.md:96-99,103-104`); mean gap 0.107 at a = 0.25 against 0.024 at a = 1 (`docs/2026-08-05-gap-occupancy.md:120,122`, 12 seeds per arm) |
| 4. secondary contact excludes | `one lost` | signature: `DEFAULTS` at either configuration, placement-mediated (`!randomMating`), no option key set: `allocExponent`, `selfing`, `phenology`, and (round 4) `demography` and `space` all grey it. With `demography {K: 2, seedsPerGrain: 1}` and identical genomes a run reads `one lost` with 0 hybrid generations and a final N of 2, demographic loss with no bee in it, which the old exclusion list admitted | hybrid generations: the count of generations whose PARENTS included a plant with `anc` strictly in (0.15, 0.85) (`population.html:742`, the `anc` array taken before `step`; a hybrid born in the final step is therefore not counted, and the card says "parents"); opens at 0, the two lineages never made a seed together before one was lost. Null arm: 23 of 24 in every one of the 58 null runs at the page configuration, 34 of 35 in every one of the 58 at the level configuration (null tables), so 0 is beyond the edge at both. Placement-mediated at target 8: `one lost` with 0 hybrid generations in 27 of 29 seeds (page) and 28 of 29 (level). Realised separation (`sim/ibm.js:594`) is printed beside it, never the trigger: it is the founding input. No FUSED branch: below d = 4 the model fuses exactly as the null does (`docs/2026-08-04-secondary-contact.md:36-40`), so fusion names no bee; card 1 carries it | at target d of 0.5 to 4 every seed fuses, at d = 8 one lineage is lost in every seed while the random null fuses (`docs/2026-08-04-secondary-contact.md:36-40,47-50`, 5 seeds per cell, N = 30, 35 generations, siteN 160, `experiments/secondary-contact.js:66-69`); per-capita receipt at 10% frequency is 0.214 of the majority's at d = 8 (`docs/2026-08-04-density-dependence.md:90-94`), exponent 0.70 on own-frequency odds (`docs/2026-08-04-limiting-factors.md:53`); both quoted, never read off the run |
| 5. a floor spread thin is worse than a flat one | `one lost` or FUSED | `selfing.rate > 0 && selfing.cover > 0 && selfing.cover < 1` (`sim/ibm.js:1844,1963`): the cover branch sits inside `rate > 0 \|\| always`, so `cover` without `rate` runs no floor and throws nothing; and (round 4) `cover` = 1 sets `nKeep = n - Math.round(q * n)` to 0 (`:2015`), every `selfW` to 0, and no mother selfs, so the old condition `cover > 0` opened the card on a run that spent no assurance at all (seed 8 at q = 1: `one lost` with zero self weight, flat HELD). Signature: level 4's exact object, placement-mediated | the paired fate: the same seed rerun in-page at q = 0 with the same `rate` (bit-identical to the flat floor, `sim/ibm.js:2384-2386`; `docs/2026-09-06-selfing-cover.md:41`) ends HELD while this run did not. Null arm: that flat run; the card opens only when it HELD. The starved count `round(q x N)` (`:2015`) is printed as the input it is, never as the measurement. Over seeds 1 to 30 at level 4's configuration (null tables) the flat floor HELD in 11, q = 0.69 in 6, q = 0.85 in 2 (the document's 0.404 / 0.183 / 0.055 over 109 seeds); the card opens in 9 pairs at q = 0.69 and 10 at q = 0.85 (seed 8 among them), and the pair runs the other way, flat lost and cover HELD, in 4 pairs at q = 0.69 (seeds 1, 7, 19, 20) and 1 at q = 0.85 (seed 19). One pair is one draw and the card says so; the rates are the document's, and the 0.266 with no floor at all is printed as copy, never compared | at q = 0.69 HELD is 0.183 and at q = 0.85 it is 0.055, against 0.404 for the flat floor and 0.266 with no floor at all (`docs/2026-09-06-selfing-cover.md:14,40,44-46`; N0 = 30, rate 2.0, cost 0, 35 generations, 109 seeds per cell, `:5-7`; `phenology` 8 slices width 0.12 and `visitsPerPlant` 800, `experiments/rare-floor.js:28-32,127-133`); the harm 0.349 exceeds the floor's whole benefit 0.138 (`:60`) |
| 6. flowering width evolves wide | any fate | signature (round 4): the exact phenology object the null tables ran, `{slices: 8, widthLocus: true, widthMut: 0.03, conserveDisplay: true}` (`widthLocus` at `sim/ibm.js:1185`; `widthMut` otherwise defaults to `mutRate` 0.02, `:409`), placement-mediated, AND the in-page shuffled arm (M3b). A flipped `widthLocus` on level 5's first object loads neither `conserveDisplay` nor `widthMut` 0.03 and is grey | mean expressed width (`:1312-1313`, `WIDTH_GENE` at `:127`), the experiment's statistic (mean over the last five generations, `experiments/evolving-width.js` `replicate()`), treatment minus the same seed run with `phenology.shuffleWidth` (`:1340`), the primary comparison the engine names (`:1299-1304`); opens when the paired difference exceeds **0.403**, the edge of a per-seed null (round 4): the shuffled arm at `widthRng(seed)` minus the shuffled arm at `widthRng(seed + 1000)`, the width stream being a plain parameter of `step` (`:1131`) and the only thing the second arm changes; over seeds 1 to 30 (null tables, `card6null`) that difference runs -0.612 to 0.403, mean 0.028, and seed 23's 0.40277 rounded up gives the edge. Between 0 and 0.403 it prints the difference uncoloured; at or below 0 it stays closed. Over seeds 1 to 30 the treatment-minus-shuffled difference runs -0.137 to 0.768, 9 of 29 clear 0.403 (seeds 6, 11, 12, 13, 14, 15, 17, 24, 29), 2 are at or below 0, t interval [0.217, 0.389]. The document's 0.140 is the lower end of the t interval on the 12-seed MEAN (`docs/FINDINGS.md:115-117`, "n = 12, t"), not a per-seed edge, and is printed as the document's interval, never as the line. The founding mean is not the comparator: the engine says a drop from 0.5 alone "would put an arithmetic artefact on the same footing as a result" (`:1302-1304`) | width drifts wider, +0.291 / +0.084 / +0.233 at S = 8 / 16 / 32, treatment minus shuffled, the middle one spanning zero (`docs/FINDINGS.md:115-117,132-134`; 30 plants, 35 generations, 12 seeds, d = 8, `docs/2026-08-31-evolving-width-conserved.md:6`); conserving display removed four fifths of the gradient and the direction survived (`docs/FINDINGS.md:143-148`) |

Cards 2, 3, 5 and 6 are not eligible outside a run that sets their option, because `DEFAULTS`
leaves `allocExponent`, `selfing` and `phenology` null (`sim/ibm.js:686,722,670`), and cards 2
and 3 (round 4: card 3 had no founding condition) are not eligible outside a target-8 founding,
because at target 4 the a = 1 arm reaches both cards' whole signature (null tables, d = 4: 8 of 10
seeds FUSED, 7 with the gap filling before ancestry variance halved, peaks to 0.900, means to
0.596, and 0 of 10 a = 0.25 seeds above those). That is eligibility, not the trigger: each card
still opens only on its measured quantities against its nulls' edges, and reads the option or the
founding, never the level id. Cards 5 and 6 ship only with their in-page paired arm (M3b),
because without it they have no valid comparator.

## 5. Levels

What you would see: a "level" select above the gene panels. Choosing one loads a starting
configuration into the sliders and run controls and shows a one-line brief. Every slider stays
live in every level; from level 2 on the win is the fate tile reading HELD, nothing else (level 1
has no run; its win is the separation readout). STALLED, `one lost`, FUSED and `BOTH LOST` all
lose: a run in which some generation recruited nothing reads STALLED, never HELD (section 3), so
the win can fail on a run that never reproduced. Every rate below names its configuration; levels 2 to 6 load it
(N = 30, 35 generations, `siteN` 160), so the quoted rate and every card band are the visitor's. The
free sandbox keeps the page defaults, where no HELD rate is measured.

| #   | start                                                                                                                                                                                                                                                                                                                    | brief                                                                                                                                            | lesson                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | finding                      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| 1   | lineage 1 = lineage 2 = a random genome; bee default; no run                                                                                                                                                                                                                                                             | Move one lineage's pollen to a different part of the bee. Win: realised separation at or above 8 before any run; the target is on screen at load | placement is two-dimensional (along and around the body); a shape change moves the dot, not a placement number. 2-D out-packs a 1-D gene 2.1x at the 309-species pool, 40 against 19 at tau = 0.2, rising to ~3.1x (`docs/FINDINGS.md:192-195`; `docs/2026-08-02-pool-scaling.md:54,62`)                                                                                                                                                                                                  | foundation, pre-registration |
| 2   | the pair from level 1; N = 30, 35 generations, `siteN` 160, placement-mediated                                                                                                                                                                                                                                           | Now make them stay two kinds. Win: HELD. No configuration is known to win here; the page says so and asks the visitor to note seed and settings  | nothing holds: HELD 0 of 5 at every target d from 0.5 to 8; fuse at or below 4, one lost at 8, and the random null fuses at 8 where the model excludes (`docs/2026-08-04-secondary-contact.md:36-40,47-50`; N = 30, 35 generations, siteN 160, `experiments/secondary-contact.js:66-69`). Same disclosure as level 6                                                                                                                                                                      | secondary contact            |
| 3   | level 2 pair at realised separation 8; `allocExponent` = 0.25; N = 30, 35 generations, `siteN` 160                                                                                                                                                                                                                       | The bee now prefers the rarer flower. Win: HELD; measured 4 of 12 at this setting                                                                | the rarest placement is the intermediate; the subsidy builds the bridge (`docs/2026-08-04-rare-biased-visits.md:103-109`); a = 0.25 gives 4 HELD of 12 with mean gap 0.107 and peak 0.298 (`docs/2026-08-05-gap-occupancy.md:120`, 12 seeds, d = 8; the 11 of 12 ordering at `:66-73`, 35 generations, 40 seeds)                                                                                                                                                                          | rare-bias self-defeat        |
| 4   | level 2 pair; `selfing` = `{rate: 2.0, cost: 0, cover: q}`, q = 0.69 then 0.85 (the engine holds the budget at `rate` x total receipt, `sim/ibm.js:2014`); `phenology` 8 slices, width 0.12, and `visitsPerPlant` 800, as the sweep ran (`experiments/rare-floor.js:28-32,127-133`); N = 30, 35 generations, `siteN` 160 | A floor under the rare lineage, spread over some plants. Win: HELD; measured 0.183 at q = 0.69 and 0.055 at q = 0.85, against 0.404 flat         | thinner cover harms: primary -0.221 [-0.339, -0.101] against the flat floor (`docs/FINDINGS.md:34`); at q = 0.85 below no floor at all, 0.055 against 0.266 (`docs/2026-09-06-selfing-cover.md:14,44-46`; N0 = 30, rate 2.0, cost 0, 35 generations, 109 seeds per cell, `:5-7`)                                                                                                                                                                                                          | selfing budget               |
| 5   | level 2 pair; `phenology` with `slices` = 8 (`sliceCountOf`, `sim/ibm.js:204`) and a narrow fixed `width` = 0.12 (read at `:1473`); registered visit rule; N = 30, 35 generations, `siteN` 160. The second run loads the exact object card 6 was measured with, `phenology = {slices: 8, widthLocus: true, widthMut: 0.03, conserveDisplay: true}` (the null tables' `card6` and `card6null`; `widthMut` otherwise defaults to `mutRate` 0.02, `sim/ibm.js:409`), not a flipped `widthLocus` on the first object                                                                                                                           | Give them different seasons. Win: HELD; measured 11 of 38 at this setting, replicated 5 of 12. Then load the width-locus object and run again           | HELD 0.289 at S = 8, 11 of 38 built seeds, under the registered visit rule (`docs/2026-08-25-phenology.md:37-38,46`; `docs/FINDINGS.md:65-70`; N = 30, 35 generations, siteN 160, d = 8); the evolving-width sweep replicated the cell at 0.417, 5 of 12 (`docs/ROADMAP.md:403-405`); conditional on the allocation rule: proportional visits drop it to 0.026 (`:94-102`); with width heritable it evolves wide (`:139-141`). At S = 32 the same cell gives 0.083 (`docs/ROADMAP.md:61`) | phenology, evolving width    |
| 6   | level 2 pair; every option exposed; N = 30, 35 generations, `siteN` 160, so cards 2, 3, 5 and 6 read bands at their measured configuration                                                                                                                                                                               | Find a way for the rare lineage to gain from being rare. No known win FROM A POLLINATION-DERIVED MINORITY ADVANTAGE; the phenology and selfing wins of levels 4 and 5 are reachable here too (level 5's cell reads HELD at seeds 1 and 3 at this configuration under one option, section 9) and the page lists them as already known, so a HELD that reuses them is not the northstar. Win: HELD by a route the page does not list                                                                                | six route families spent, five attacking visitation or attraction (`docs/ROADMAP.md:324-335`); the northstar is open (`docs/FINDINGS.md:202-207`)                                                                                                                                                                                                                                                                                                                                         | the open northstar           |

Per level, what the cited document measured: level 2, fate per cell at 5 seeds, HELD 0 of 5
everywhere at N = 30, 35, 160 (`docs/2026-08-04-secondary-contact.md:36-40`); level 3, HELD / FUSED / one lost of
12 at each a (`docs/2026-08-05-gap-occupancy.md:120-122`); level 4, HELD rate over 109 seeds
per q (`docs/2026-09-06-selfing-cover.md:44-46`); level 5, HELD of 38 at S = 8
(`docs/2026-08-25-phenology.md:46`) and of 12 at each S (`docs/ROADMAP.md:405`). Levels 2 and 6 offer no seed known to win; the page says so and asks
for the seed and settings. That is copy, not a gate: the fate tile still decides.

## 6. Legibility: reference bands

What you would see: every numeric tile carries a thin band and one word beside the value, and
every band names the configuration it came from.

| readout                                                                   | band                                                                                                                                                                                                                                                                                                                                                                | source and config                                                                                                                                                              |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| realised separation                                                       | printed with the experiment's founding outcomes as labels: realised 3.898 to 4.027 (target 4) "fused 5 of 5", 7.663 to 8.163 (target 8) "one lost 5 of 5", anything else "not measured"; never on the cluster tile                                                                                                                                                  | fates `docs/2026-08-04-secondary-contact.md:36-40,47-50`, by target d, 5 seeds per cell, N = 30, 35 generations, siteN 160; realised values of those same foundings, probe doc |
| ancestry variance                                                         | founding value from the run; HELD line at 0.4 x founding (`sim/ibm.js:543`); "fused or lost" at 0.000, which every secondary-contact arm reached (`docs/2026-08-04-secondary-contact.md:28`); the 3-of-18 edge printed beside the line (section 3)                                                                                                                  | engine predicate                                                                                                                                                               |
| fate                                                                      | HELD / one lost / FUSED / BOTH LOST, with the base rates the visitor is up against at the level's configuration: 0 of 5 at every d (level 2, `docs/2026-08-04-secondary-contact.md:36-40`), 0 of 38 in every spatial cell (`docs/FINDINGS.md:166`), 0.266 with no floor (`docs/2026-09-06-selfing-cover.md:46`), 0.289 at S = 8 (`docs/2026-08-25-phenology.md:46`) | each at the config named in section 5; none applies at the page defaults until re-measured                                                                                     |
| hybrid fraction | any value above 0 is labelled "hybrids present"; the receipt ratio beside it, "hybrids received less than the rest" below the null edge 0.603 (page configuration; grey at any other) and the experiment's 0.809 [0.706, 0.912] as the comparison, labelled as its own statistic (card 1), never as the run's number | edge from the null tables; threshold from `experiments/hybrids-or-balance.js:64-65`; `docs/2026-08-02-hybrid-placement.md:54-57,60-64,75` |
| gap occupancy | the a = 1 edges, peak 0.434 and mean 0.170 (outward-rounded from the most any of 29 seeds reached), and the random-mating lead edge 1; the document's arm means, peak 0.129 and mean 0.024 "no bias", mean 0.107 and 0.143, peak 0.298 and 0.406 "rare-biased", printed as means, never as a line a run must cross | null tables (`card23`, `card23rm`, `edges`), 29 seeds, d = 8, N = 30, 35 generations, siteN 160; `docs/2026-08-05-gap-occupancy.md:120-122`, 12 seeds per arm at the same configuration |
| cross receipt at 10% frequency (shown on the secondary-contact card only) | 0.214                                                                                                                                                                                                                                                                                                                                                               | `docs/2026-08-04-density-dependence.md:90-94`, d = 8                                                                                                                           |
| visit-allocation rule (level 5 switch)                                    | 0.289 registered against 0.026 proportional                                                                                                                                                                                                                                                                                                                         | `docs/FINDINGS.md:97-98`; N = 30, 35 generations, siteN 160 (`docs/2026-08-25-phenology.md:37-38`)                                                                             |

Every band is a constant in one table at the top of the page's script, each with its source line
and its (N, generations, siteN) as a comment, so a future correction to a document has one place
to land.

## 7. Consolidation

What you would see on the live site: the landing page's first link is the sandbox; the page list
has two entries, sandbox and visit.

- `greybox.html` is deleted. It duplicates `visit.html`'s two sliders (`greybox.html:149,154`
  against `visit.html:147,152`) and has no run; its "two flowers, one bee" framing (`:126`) is the
  sandbox's default screen. Removed from `tools/build-site.sh:24`, from `tools/smoke-site.py:43`,
  from `tools/site-index.html:194`, and from `README.md:54`.
- `population.html` becomes the sandbox in place (same filename through M3, so the smoke contract
  `#run` then `#play` at `tools/smoke-site.py:162-186` keeps running unchanged and
  `tests/browser-bundle.test.js:128,157` and `tests/bout-log.test.js:216-235` keep reading it).
  It is renamed to `sandbox.html` at M4 (section 12, answered), with the two tests and the smoke
  SPEC updated in the same commit.
- `visit.html` stays as the scripted reveal; the landing page moves it to second position.
- `tools/site-index.html:185-201` "Play with it" is rewritten to lead with the sandbox and its
  goal; `README.md:9` "three browser toys" becomes two.

## 8. Non-goals

- No new sim mechanics: the arc is a UI on `sim/` as shipped at `d18f972`; a change under `sim/`
  would need a pre-registration, and this is not an experiment. The one registered exception
  (round 4) is scoring, not mechanics: `fateOf` (`sim/ibm.js:539-546`) gains a fourth argument
  `stalled` and returns STALLED before testing HELD (section 3). No draw, weight, or offspring
  changes; every caller that passes three arguments gets the four strings it gets today, asserted
  by a test that runs the reach-0 level-configuration pair of section 3 (STALLED with the flag,
  HELD without it; the reach-0.85 control `one lost` under both) beside `tests/fate-of.test.js`.
- No new experiments: every band and card text quotes a result document at its measured
  configuration. The two exceptions are the probe doc and the null tables, dated probes (not
  results) of what the page itself shows: M2's controls, every card's null distribution seed by
  seed, the level 4 and 5 checks. A number in none of them is out of scope.
- No renderer rewrite: the `#field` canvas stays; the only drawing added is the two live sites on
  the bee and the bands on the tiles (`docs/ROADMAP.md:1656` says polish is "Not a priority").
- No save or share backend: the level plus seed plus gene values fit in the URL hash, which is
  enough to reproduce a run and costs no server.
- No web worker: a 24-generation run at the page defaults completes inside the smoke test's 60 s
  (`tools/smoke-site.py:165`); M3a times the 35-generation, `siteN` 160 run against that budget.
- No bee genome: `DEFAULT_BEE` is a parameter object (`sim/placement.js:150-159`), and making it
  evolve is a mechanism, not a UI. The two bee sliders set the parameter object for the run.

## 9. Milestones

|     | scope                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | size | acceptance a stranger can check on the live page                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1 | all eight genes for both lineages as sliders: seven with bounds read from `Evolve.GENE_BOUNDS` (`sim/evolve.js:28-36`) plus `antherTheta`, which is `IBM.ALL_KEYS[7]` (`sim/ibm.js:73`), has no row in `GENE_BOUNDS`, and wraps to (-pi, pi] (`sim/evolve.js:118`); `reach` and `bodyLen` sliders labelled "bee, fixed for the run"; live anther and stigma sites of both on the bee; realised separation with band and level 1's target "reach 8" shown at load; founding from the two hand-set genomes via `foundPopulation` with the signal locus in the `base` (section 3, item 4); `tests/browser-bundle.test.js:157-200` rewritten to the page protocol (section 9), the page's loop moved into `population-run.js` and executed by that test. The `d` input and the `foundTwoLineages` search stay behind a "found at target d" switch until M2 has re-measured its seeds against the hand-set founding: M2's acceptance pairs are `foundTwoLineages` seeds, and a hand-set founding draws a different stream | M | level 1's start genome is fixed, the one `Evolve.randomGenome(Evolve.makeRng(1))` draws (`sim/evolve.js:112,54`) with `signal` 0.5, and at `DEFAULT_BEE` each slider swept bound to bound moves lineage 2's anther dot by (body distance, `sim/ibm.js:825`; the founding placement recipe `:563-564`): `antherT` 11.216, `throatR` 7.544, `antherTheta` (0 to pi) 7.465, `axisLen` 4.376, `polarity` 0.642, `mouthR` 0.415, `antherProject` 0.188, `curve` 0.000 (`tmp/v4-pollen/probe5_gene_sensitivity.out`; `curve` moves nothing at three base genomes, and `antherT` at 0.85 on base seed 2 never touches the bee). Round 4: the old line passed on either branch ("moves a dot" or "no effect"), so the acceptance now names both: the test asserts that each of the seven moving genes shifts the dot by at least 0.1 body distance AND that `curve` alone carries "no effect at this bee"; a slider wired to nothing fails the first, a label on a moving gene fails the second. Founders: every allele at every key of `IBM.ALL_KEYS` on both haplotypes of every founder is finite (`Number.isFinite`) for both lineages, asserted on the recipe (a base without `signal` was seen to give `NaN` on every founder); and (round 5) at N = 5 the recipe founds exactly 5 plants, 2 with `anc` 0 and 3 with `anc` 1, and at N = 30 exactly 30, 15 and 15, so a recipe that writes `half` twice fails. The rewritten fidelity test executes `population-run.js`'s `runGenerations` in the fake browser (section 9), shares `rng` and `srng` with founding, and asserts the loop's fate and quantities at the page configuration equal the null tables' rows: target 8 seed 1 `one lost`, 0 of 24 hybrid generations, realised 8.124; target 4 seed 16 `one lost`, 1 of 24, ratio 0.111; the target reads beside the separation before any click |
| M2 | RUN on the hand-set pair; the page keeps the FINAL offspring (today `buildRun` stores the parents each generation and drops the last `res.pop`, `population.html:761-775`, and fate is read off the last stored frame, `:1025-1032`) and prints `IBM.fateOf(pop, v0, extinct, stalled)` on it as the tool does (`tools/northstar-null-tables.js:130`), with `stalled` = any generation's `recruits` (`sim/ibm.js:2256`) equal to 0 and the stalled count on the tile; hybrid fraction and gap occupancy tiles; bands on every tile with their signature; the engine's five fate strings; cards 1 and 4, each opening on its measured quantity beyond its null's edge | M | page defaults, each pair founded by `foundTwoLineages` as `population.html:727` founds it today (seed 18 founds nothing at either target and is skipped), under the page protocol the null tables use. Card 4: target 8, seed 1, placement-mediated reads `one lost`, 0 of 24 hybrid generations, card 4 open, realised 8.124 printed. Card 1: target 4, seed 16 reads `one lost`, hybrids in 1 of 24 generations, receipt ratio 0.111, card 1 open. The page's fate and quantities on both equal the tool's rows (`node tools/northstar-null-tables.js card14 page 16 16`, `1 1`), which is the assertion that the page and the tool run ONE protocol. Null: the null tables' seeds 1 to 5 at both targets under the random null read 23 of 24 hybrid generations in all 10 (card 4's quantity beyond its edge) and ratios of 1.146 or more (seed 4 target 8 reads Infinity, the rest received nothing; card 1's quantity on the null side of 0.603); the smoke asserts those ten quantities AND `data-state` closed on all ten cards (round 5). Stall: the smoke drives section 3's pair at the level configuration by section 3's protocol (found at `DEFAULT_BEE`, then step at `bee.reach` 0 against 0.85) and asserts STALLED with 35 stalled generations against `one lost` with 0; the STALLED run opens no card (`data-state` closed on every card). A hand-set founding of the same genomes draws a different stream, so these seeds are re-measured before the `d` switch is removed |
| M3a | the level select, briefs, the per-level (N, generations, siteN) load, STALLED as a loss on every level, the level 2 and level 6 "no known win" copy (level 6 lists the known wins of levels 4 and 5); the 35-generation, `siteN` 160 run timed inside 60 s | M | pick level 3 and read N = 30, 35, 160 in the controls before running; pick level 1 and reach separation 8 by sliders alone; pick level 2 at seed 1 (target 8): `one lost`, and the page says no configuration is known to win |
| M3b | options from the page: `allocExponent`, `selfing` (`rate`, `cost`, `cover`, as level 4 loads them), `phenology` (`slices`, `width`, `widthLocus`, `conserveDisplay`, `displayProportionalVisits` at `sim/ibm.js:204,1185-1188,1473,1552,1570`), `visitsPerPlant`, and the visit-allocation switch with its band; cards 2, 3, 5, 6; the two in-page paired arms (q = 0 for card 5; `shuffleWidth`, `:1340`, for card 6); the three rng streams; the deck file and its test (section 14); the no-log field for phenology runs: the engine logs no bout under `phenology` (`sim/ibm.js:1438`) and `draw` returns on an empty log (`population.html:826-828`), so on levels 4 and 5 the field draws the flowers and both lineages' sites from `G.flowers` and `G.sites` with no flight and the caption reads "bout not drawn: the sliced season does not log one (`sim/ibm.js:1432-1438`)"                                                                                                                                                                                                                                                                                                                                                                       | L | pick level 5 and run seeds 1 to 5 at its config under the page protocol: seeds 1 and 3 end HELD, seeds 2, 4 and 5 `one lost`, no generation recruits nothing (`tmp/v4-pollen/probe5b_level5_protocol.out`; the probe doc's seeds 3 and 4 were the restart protocol's and are retired); pick level 4 at q = 0.85, seed 8: the run reads `one lost`, its in-page flat arm reads HELD, card 5 opens; at q = 1, seed 8: `one lost` again, flat HELD again, and the card stays CLOSED (cover < 1 fails: zero self weight was spent); at q = 0.69, seed 1 reads HELD, its flat arm `one lost`, card 5 stays closed and the card prints the reversed pair (null tables); pick level 3 at seed 6: FUSED, peak gap 0.633, mean 0.266, lead 3, cards 2 and 3 open; at seed 1: `one lost`, both closed; seed 6 under `randomMating`: FUSED, peak 0.720, mean 0.507, lead 0, both closed by the lead and grey by the signature (null tables, `card23rm`); the second level-5 run with the width-locus object at seed 3: treatment minus shuffled 0.393, below 0.403, card 6 prints the difference uncoloured; at seed 13: 0.768, card 6 opens; at seed 23: -0.006, closed (null tables, `card6`); `node --test tests/deck.test.js` passes on the committed deck and reports all six must-fail fixture rows |
| M4  | consolidation: greybox removed, `population.html` renamed `sandbox.html` with its two tests and the smoke SPEC updated, landing page leads with the sandbox, README and build allowlist updated, `python3 tools/smoke-site.py` added as a step of `.github/workflows/pages.yml` after `build-site.sh`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | S    | the live index's first link opens the sandbox; `greybox.html` returns 404; the Pages run shows the smoke step green                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

**ONE rng protocol, the page's (round 4).** The page makes `rng = E.makeRng(seed)` and
`srng = I.signalRng(seed)` once, founds the pair with them (`population.html:725-727`) and drives
every generation with the same two (`:754-760`): founding's draws are consumed before generation 0.
`run({found})` makes fresh `rng` and `srng` (`sim/ibm.js:2373-2376`), so the same seed, founding,
configuration and options give a different run: at level 5's cell (30 / 35 / 160, `phenology`
8 slices width 0.12, seeds 1 to 5) the restart protocol reads `one lost / one lost / HELD / HELD /
one lost` and the page's reads `HELD / one lost / HELD / one lost / one lost` (seeds 1 and 4 differ;
round 4, verified and re-run for this revision, `tmp/v4-pollen/probe5b_level5_protocol.out`). The
probe doc's level-5 seeds (3 and 4) were the restart protocol's and are retired. The null tables
use the page's protocol: `tools/northstar-null-tables.js` makes one `rng` (`:92`), founds with it
(`:94`) and steps with it (`:113`), so every edge and every control seed in section 4 is the
page's. The experiments use `run({found})` (`experiments/secondary-contact.js:382-388`,
`experiments/gap-occupancy.js:115-121`); their rates are quoted as copy at their configuration and
are never a seed the page must reproduce. `tests/browser-bundle.test.js:157-200` restarts the
streams (`:177-178`) and evaluates only the bundle (`:38-44`) against a loop hand-copied into the
test (`:176-190`, "verbatim in structure"), so it proves the copy matches `run()`, never that the
page does. Round 5: M1 moves the page's generation loop out of the inline script
(`population.html:717-775`) into one file the page loads by `<script src>`, `population-run.js`
(added to the allowlist at `tools/build-site.sh:19-25`), exposing `window.SandboxRun.runGenerations(found, opts, rng, srng, gens)`;
`buildRun` calls it and keeps only the DOM reads. The rewritten fidelity test loads that file into
the same fake-browser context after the bundle and EXECUTES it, founding with the shared `rng` and
`srng`, and asserts its frames' fate and quantities against the null tables' rows; a loop written
into the test is the defect the test exists to catch and is forbidden by a check that the test file
contains no call to `I.step`.

**The three other streams (M3b).** `run()` creates `brng` when `phenology` is set
(`sim/ibm.js:2379`), `wrng` when `widthLocus` is set (`:2382-2383`) and `crng` when
`selfing.cover` is set (`:2387-2388`), and `step` takes them as its sixth to eighth arguments
(`:1130-1132`). `selfing.cover` throws without `crng` (`:2005-2010`) and runs only inside
`rate > 0` (`:1844`); the page loop passes none (`population.html:754-760`). M3b builds the three
from the seed as `run()` does (founding draws only `rng` and `srng`, so they are untouched by it)
and extends the rewritten fidelity test with one case per stream, asserted against the null
tables' card-5 and card-6 rows (the page protocol with `brng`, `crng`, `wrng`).

Each milestone extends `tools/smoke-site.py` with one assertion for its acceptance line and one
negative control: the card's null arm at the null tables' seeds 1 to 5, asserting each quantity sits
on the null side of the edge (section 4), so the control is a fixed block of seeds, not one seed
chosen from the passing half; for cards 2 and 3 the block is run under BOTH nulls. Every quantity
assertion is a number or a fate string, and, round 5, every acceptance line that names a card state
("card 4 open", "the card stays CLOSED", "grey by the signature", "the STALLED run opens no card")
also asserts that state on the DOM: each card carries `data-state` in `open | closed | grey`, and
the smoke reads it on the positive seed, the null block, one grey-signature run and the STALLED
run, so an implementation that computes every quantity and renders no card, never closes a card,
or breaks the grey rule fails the line that names it. Every acceptance line above names the branch
that fails it. Until M4 the smoke runs locally only.

## 10. B, the empirical turn (next arc, not designed here)

What a visitor would see: real flowers and a real bee, measured, replacing the sliders. Feed
recorded morphometrics for the plants and the pollinators of one site into the same contact
model, predict which recorded visits in that site's network are mechanically non-pollinating,
and compare against effective-pollination records from the same site. The data requirement is
a single-site census with morphometrics for both partners, the same requirement the ceiling
leg already names (`docs/FINDINGS.md:211-215`; `README.md:233-243`, "a data requirement, not a
paywall"). Nothing about its readouts, its statistics, or its pre-registration is decided here.

## 11. Risks

1. **The sliders move nothing visible.** At the default bee some loci may shift a site by less
   than a pixel, and the page then reads as a chart with knobs. Guard: M1's per-gene sensitivity
   check is an acceptance line; a locus that fails it is labelled on the page, not hidden.
2. **The cards become narration.** A card keyed to a level id is a caption, not a diagnosis.
   Guard: section 4's trigger rule, a quantity measured on the run whose threshold sits beyond the
   edge of its null arm's 30-seed distribution (the null tables), and the smoke test drives that
   null over a fixed block of seeds and asserts the quantity, beside the run that opens the card.
3. **The levels become a slideshow of findings.** If each level can only reproduce its finding,
   the visitor never fails differently and never learns the model. Guard: every slider and
   every option stays live in every level, the win is the engine's `fateOf` and nothing else,
   and levels 2 and 6 ship with no known winning configuration and say so.
4. **A band quoted at the wrong configuration.** Level 5 measured 0 of 5 HELD at the page
   defaults (probe doc) against 2 of 5 at the experiment's configuration (seeds 1 and 3 under the
   page protocol, section 9). Guard: every band carries its config, levels 2
   to 6 load it, and section 8 forbids quoting a band where it was not measured.

## 12. Open questions

Answered 2026-09-12:

1. `population.html` keeps its filename through M3 and is renamed to `sandbox.html` at M4,
   updating `tests/browser-bundle.test.js:128,157`, `tests/bout-log.test.js:216-235` and the
   smoke SPEC (`tools/smoke-site.py:40-45`) in the same commit, when the landing copy changes.
2. The bee's `reach` and `bodyLen` (`sim/placement.js:151,158`) are sliders in M1, labelled
   "bee, fixed for the run": the ruling says "designs a flower and a bee"; neither is a gene.
3. Level 5 exposes the visit-allocation rule as a visible switch (`displayProportionalVisits`,
   `sim/ibm.js:1570`) with its own band, 0.289 registered against 0.026 proportional
   (`docs/FINDINGS.md:97-98`), since that condition is the finding's own caveat.

Answered 2026-09-13:

4. A card's threshold is the edge of its null distribution over 30 seeds (the null tables), not
   a document's arm mean; a card whose null reaches its own quantity at some seed has no
   threshold at that configuration and is grey there (card 1 on levels 2 to 6). Cards open less
   often as a result, and that is accepted: a card that can open on its null explains nothing.
5. (round 4) There is ONE rng protocol, the page's: `rng` and `srng` are made once from the seed,
   found the pair and drive every generation (`population.html:725-727,754-760`). `run({found})`
   restarts both (`sim/ibm.js:2373-2376`) and is a different protocol that changes fates (section
   9, the streams paragraph). The null tables use the page's (`tools/northstar-null-tables.js:92-94,
   113`), so every edge in this document is the page's; no acceptance seed is quoted from the other.
6. (round 4) A generation with zero recruits under fixed N is a loss, STALLED, on every level
   (section 3; under `demography`, which no level sets, it is `BOTH LOST`). The check "fate reads HELD" can now fail on a run that never reproduced.
7. (round 4) An edge is committed only after its defining seed is re-run at full precision and the
   edge rounded outward (`edges` mode), because rows print to three decimals and the printed value
   can sit on the wrong side of the true one.

## 13. The story after the sandbox

Ruling (2026-09-12): sections 1 to 9 are Act One. What follows is the arc after it, chapter by
chapter, under the same discipline: a chapter changes an INPUT or adds a registered question.
Each gives what a visitor sees first, one checkable question, inputs and anchors, and a size.
Anything not in the repo is marked UNGROUNDED or "verify via CrossRef before citing in-repo".
Chapters are ordered as a story; nothing below is scheduled.

**What the mating rule IS.** The mating rule is code acting after `received` is summed
(`sim/ibm.js:1777-1782`) and before the mother is drawn by `pick` (defined at `:2063`, first called
at `:2130`), then parentage itself (`:2120-2204`: mother by `weight`, the selfing branch
`:2189-2199`, sires by `r.T[i][mother]` `:2201-2203`, father `:2204`), so who mates with whom is
read off where pollen landed; plus `fateOf` (`:539-546`), which scores the result. Read as code,
that region calls `placementOf` (`:1784`), `dist` (`:1812`, only under `optima`), `crng` (`:2024`,
only under `selfing.cover`), `poisson` (`:2059`, only under `demography`) and `gauss` on the main
stream (`:2092-2093`, seed positions, only under the spatial option), and reads these option keys
(round 4: the list is now complete, checked by grep over `:1777-2256`): `optima` and `optimaK`
(`:1809-1813`); `selfing.rate`, `always`, `dose`, `resid` and `cover` (`:1844-2041`);
`demography.K` and `demography.seedsPerGrain` (`:2055-2059`); `logMatings` (`:2119`, observation
only, not a `DEFAULTS` key); `randomMating` (`:2130`, `:2203`); `space` (`SP.seedRange`, the
child's position after the pair is drawn, `:2090-2098`); and, inside the parentage block after the
pair is drawn, the gamete options `linkSignal`, `signalMut`, `phenology.link`, `phenology.mut`,
`phenology.widthMut` and (round 5) `phenology.widthLocus` (`gopts`, `:2135-2147`, `width` at
`:2145`) and `mutRate` (`:2225-2226`); the selfing keys `cost`, `ancNull` and `floorOnly` read
inside the region are listed with the `selfing` block below. Called per child, not before the
first draw: `pick` (`:1984`), `withPos` (`:2168`), `gamete` (`:2139`), `setSelfedSeed` (`:2194`)
and `wrap01` (`:2095`). The reserved set is
the keys that change WHICH parents are drawn or HOW MANY: `randomMating`, `optima`, `optimaK`,
`demography` and every `selfing` key. **The criterion is distributional** (round 5, ONE rule for
every key): a key is reserved when it changes the PROBABILITY of a parent pair, or the number of
pairs, at fixed receipt. Round 4 reserved `linkSignal` and `phenology.link` because a supergene
arm draws its coin on the main stream (`linkCoin = rng() < 0.5`, `:344`) and so changes the
REALISED pairs at identical receipt (pairs `(8,2)(15,13)(2,5)` against `(8,2)(16,9)(3,1)`, seed 1),
while exempting `space`, which does the same thing by the same mechanism (`withPos` draws `rng()`
and `gauss(rng)` per child, `:2090-2096`; verified: base pairs `(0,1)(5,7)(15,9)(17,16)`, under
`space` `(0,1)(14,11)(17,11)(10,15)`, under `linkSignal` `(0,1)(14,13)(15,16)(11,16)`, `received`
identical in all three). Two rulings for one mechanism is no rule; and the realised criterion
reserves `mutRate` too (`:2225-2226` draws per child), which is absurd. So `linkSignal`,
`phenology.link`, `mutRate`, `signalMut`, `phenology.mut`, `phenology.widthMut` and `space` are
INPUTS: each acts on the child after the pair is drawn and leaves P(pair | receipt) unchanged, as
a different seed does. Every one of them is grey for every card wherever the run's option object
differs from the card's canonical signature (the signature rule, section 4; the mutation options
included, so card 6's `widthMut: 0.03` is not grey on card 6 and is grey on every other card).
Stream consumption alone is not "the rule": a different seed also changes every realised draw. "Placement is never a gene"
(`sim/placement.js:7-9`; `sim/ibm.js:60-64`) is the other invariant. Neither is touched by any
chapter or card. Reserved under that criterion, and settable by no card: `randomMating` (`:613`;
`:2130`, `:2203`); `optima` and `optimaK` (`:610-611`), which reweight after receipt
(`:1809-1813`); `demography` (`DEFAULTS.demography` is `null`, `:2055-2059`), which resets the
number of offspring drawn from total receipt after `received` is summed and before any mother is
picked, so it changes how many parents the landed pollen makes, not where pollen lands; and every
key of the `selfing` option, `DEFAULTS.selfing` being `null` (`:722`) with the block at
`:1843-2042`: `rate` (`:1844,2037-2040`), `always` (`:1845-1849`; "a CONTROL, not a mechanism" is
the comment at `:710`, not a `DEFAULTS` key), `dose` (`:1850`), `resid` (`:1880`), `cover`
(`:1963-2035`), `floorOnly` (`:2191`), and `cost` (`:2155`) and `ancNull` (`:2163-2164`) inside
the selfed-seed path. `linkSignal` (`DEFAULTS`, `:797`) and `phenology.link` (`:2143`) are inputs
under the distributional criterion (round 5). A pre-registration is never written by the code that checks it: every question
below is registered in a dated `docs/*-prereg.md` before the run, and the test that scores it
reads the predicate from that document, never from a constant the scorer defines. The reservation binds the card deck (section 14), not
the sandbox's option controls, which set a registered engine option for a run; level 4 loads
`rate`, `cost` and `cover` exactly as the sweep ran them. `allocExponent` (`:1413`) and
`phenology` (width read at `:1473`) are inputs by the same criterion: they act in the bout that
builds `T`, before `received` exists, so they move where pollen lands, not how landed pollen
becomes parents. Anything that reweights `T` after receipt and before parentage changes the rule, so chapter 5 and the S-locus card (section 14) are not in
the input-only tier: each needs its own pre-registration before a run.

### Act 2, the animal side

**1. The bee gets a genome.**
Seen: the bee panel, two sliders in Act One, opens into more sliders of its own, and then those
sliders are taken away from the visitor and given to selection. Over generations the tube grows,
the tongue grows after it, and the pollen dot drifts along the body as both change. Darwin's
race, watched.
Question: with placement still derived, does a tube-versus-tongue arms race emerge from the
contact model alone, and does it run away or stop at a bound?
Inputs and anchors: `DEFAULT_BEE` is a parameter object with `bodyLen`, four named regions and
`reach` (`sim/placement.js:150-159`); today no bee value is heritable (section 8 above). The
chapter gives the animal a bounded genome (`bodyLen`; `reach`, which is insertion depth in tube
fractions, `sim/placement.js:158`, the model's proxy for tongue; a per-region hair value
for chapter 2) expressed the way flower genes are (`sim/ibm.js:283-287`) and selected on pollen
or nectar received; placement stays the output of `placementDistribution` on two shapes. Tongue
length is measurable and allometric from body size in a named dataset
(`docs/2026-07-31-groundwork-axes.md:126-129`, `pollimetry`, 4,438 specimens).
_Angraecum sesquipedale_ and _Xanthopan_, Darwin's 1862 prediction of the moth: UNGROUNDED, needs a
source; verify via CrossRef before citing in-repo.
Size: M.

**2. The animal eats the gametes.**
Seen: between two flowers the bee grooms, and the dot on its back shrinks; then it packs what it
reached into its leg baskets, and that pollen is drawn grey, dead as a gamete. Only the part of
the dot the bee cannot reach is still gold at the next flower.
Question: does harvest plus per-region grooming, and nothing else, select for precise placement
onto the unreachable sites, the enumeration's unverified load-bearing candidate?
Inputs and anchors: grooming already exists as one per-grain probability, uniform over the body
(`sim/carryover.js:93`, `groom: 0.18`; the IBM bout at `sim/ibm.js:1442` passes no override, so
that default applies; `sim/evolve.js:331` passes 0.12). Harvest exists too (`sim/carryover.js:105`
default 0, active packing at `:664-671`; the pollen dilemma stated at `sim/reward.js:8-14`). What
does not exist is a per-region value: `sim/placement.js:146-149` says regions are separate
"because retention and grooming reach differ per region", and no line in `sim/carryover.js` or
`sim/reward.js` reads a region. The input this chapter adds is a grooming reach per region on the
bee (chapter 1's hair value); the output is which sites survive. The empirical status is stated on
the page: the enumeration lists grooming / safe sites as UNVERIFIED after two failed queries and
load-bearing (`docs/2026-07-31-pollination-mechanism-enumeration.md:634`), later superseded by
IPT as the selective explanation (`:620-622`); per-region pilosity data is NOT VERIFIED
(`docs/2026-07-31-groundwork-axes.md:500-502`). Westerkamp's pollen dilemma framing: UNGROUNDED,
needs a source (the repo cites Oliveira et al. 2020 for the dilemma, `sim/reward.js:12`).
Size: M.

**3. The pollinator is an agent, and often a society.**
Seen: the bee has a fuel gauge. Each flower pays nectar, each flight costs, and when the gauge
runs low the bee goes home. With a hive on the page, a bee that came home full sends out more
bees to the same kind of flower; the common flower gets commoner on the visit log.
Question: at the same energy budget, is the HELD rate under a social pollinator with recruitment
lower than under a solitary one, as a paired difference over a seed count fixed in its
pre-registration?
Inputs and anchors: today visits are allocated by `allocExponent` (`sim/ibm.js:686`) through
`allocWeights` (`:1413`), rarity read off the placement cloud and never off ancestry
(`docs/ROADMAP.md:226-228`); the learner exists but is null by default (`sim/ibm.js:791,1412`).
The inputs added are an energy budget (nectar gained against flight cost; the enumeration's own
ruling that the currency must be chosen and named, `enumeration.md:502-505`, with the mechanical
optimum at `:506-509`) and, for the social case, recruitment as POSITIVE frequency dependence:
the majority gets more visits. That is the direct antagonist of the northstar, which asks for a
minority advantage derived from pollination (`docs/ROADMAP.md:324-335`, six route families spent,
five on visitation or attraction), and no run in the project has ever contained it. Colony
recruitment (dance communication) is UNGROUNDED in the repo, needs a source; the only `recruit`
lines are ants as a herbivore filter (`enumeration.md:328-329`) and lottery recruitment in
demography (`sim/evolve.js:429`), which is a different word.
Size: L.

**4. Syndromes without an enum.**
Seen: five animals on the page instead of one, each a body plan with its own reach and regions,
and one flower population. Over a run the field sorts itself into shape clusters, one cluster per
animal, or it does not.
Question: with several animal body plans and continuous flower genes, do convergent flower shapes
fall out of the contact geometry as clusters, one per animal?
Inputs and anchors: the animals are parameter objects in the shape of `DEFAULT_BEE`
(`sim/placement.js:150-159`), no enum anywhere. The engine has no k-cluster statistic:
`twoClusterSeparation` is two-medoid only (`sim/ibm.js:880-895`), so this chapter pre-registers
a k-cluster criterion before any run: k, the assignment rule (k medoids on body distance, `:825`,
seeded from the k most mutually distant points as `:884-889` seeds two), and the pass condition
(each animal's cluster holds a majority of the plants whose anther site lies in its contact
region). k-medoids at a fixed k always partitions, so the criterion carries a control (round 4): the
same run scored against a SHUFFLED animal assignment (each plant's contact region relabelled by a
permutation drawn once per seed), and the registration asks for the majority pass on the real
assignment over a seed count fixed in advance, with the shuffled pass rate reported beside it; a
pass rate the shuffle matches is no cluster. Doctrine: syndromes must be EMERGENT, not an
enum (`enumeration.md:22-28`); two heavyweight tests disagree on whether syndromes predict
pollinators at all (Ollerton et al. 2009 against Rosas-Guerrero et al. 2014, 417 species,
`:25-27`), so either answer on the page is a result. The hummingbird syndrome has evolved more
than 100 times in one region (`enumeration.md:445-448`); one tribe spans six syndromes (`:204`).
Bat and hawkmoth body plans: reach and region values are UNGROUNDED, need morphometric sources.
Size: L.

**5. Landing is not the end: the stigma runs a race.** Needs its own pre-registration; it
reweights `T` after receipt, so it is not an input-only chapter (see the mating-rule paragraph).
Seen: under the stigma tile a second, smaller tile: the grains that landed, and the tubes that
won. When the stigma prefers outcross tubes, a self grain that landed first can still lose.
Question: with a stigma that discounts self tubes, does the minority's fitness at k = 2 rise
above the measured k = 2 value? Not asked at k = 1: the self-pollen share there is EXACTLY
1.0000 (`docs/ROADMAP.md:714-716`), so no tube weight can change which grain wins.
Inputs and anchors: the wall is measured, not modelled: at k = 1 the minority's fitness is
EXACTLY 0.000, its self-pollen share EXACTLY 1.0000, at all three N0 in both arms
(`docs/ROADMAP.md:714-716`), and selfing lifts the floor to 0.111 (`:781`). Round 4: a discount on
self tubes applied to `T` is INERT, because self grains never count: receipt skips the diagonal
(`if (i === j) continue; // selfing is not mating success`, `sim/ibm.js:1781`) and the sire draw
gives the mother weight 0 (`i === mother ? 0 : ...`, `:2203`); the only place a self grain wins is
the selfing branch, where a mother selfs when `rng() * weight[mother] < selfW[mother]`
(`:2189-2193`) with `selfW` set from the floor (`:2014-2015`). The mechanism this chapter
registers is therefore a per-mother tube weight INSIDE that test. Round 5: the test already makes
selfing fall with outcross receipt, because `weight[mother] = received[mother] + selfW[mother]`
(`:2035`, `:2040`) and `received` is the outcross receipt (`:1780-1781` skips the diagonal): at a
floor of 50 the untouched P(self) = 50 / (received + 50) runs 0.833 / 0.500 / 0.357 at received
10 / 50 / 90. Scaling `selfW` by the outcross SHARE, as round 4 wrote, makes selfing RISE with
share and vanish at zero outcross (P(self) = 50·share / (received + 50) = 0.083 at share 0.1,
0.321 at 0.9; verified), the reverse of the intent. The registered term is a discount on the
self weight by the outcross grains landed, `selfW[mother] / (1 + received[mother])`: P(self) is
then 50/11 / (10 + 50/11) = 0.313 at received 10 and 50/91 / (90 + 50/91) = 0.006 at 90, against
0.833 and 0.357 untouched, and at received 0 the weight is the floor unchanged, P(self) = 1, the
assurance where it is needed. What the chapter adds over the denominator effect is that increment
(0.833 to 0.313, 0.357 to 0.006) and it is registered as the primary. It changes a non-zero
quantity (the k = 2 selfing test) and leaves `T`, receipt and the sire draw untouched. It cannot change what lands, only what wins,
and sitting between `T` and the parents it changes the mating rule and must be registered as
such; it is asked at the selfing floor (`selfing.rate` > 0), where `selfW` is non-zero. Pollen tube competition and
late-acting self-incompatibility are enumerated (`enumeration.md:196`) but cryptic
self-incompatibility as a named mechanism is UNGROUNDED, needs a source.
Size: S.

**6. Two morphs, one species: heterostyly.**
Seen: a level. Two lineages of one species, pin and thrum, anthers high in one and low in the
other, stigmas the reverse. The visitor must make the two morphs coexist by placement alone.
Question: does reciprocal herkogamy keep both morphs above the persistence floor (below) with no
genetic incompatibility and no season, from placement alone?
Inputs and anchors: today the stigma is derived from the anther,
`stigmaT: Math.min(0.92, g.antherT + HERKOGAMY)` with `HERKOGAMY = 0.05` fixed
(`sim/evolve.js:52,134-141`), so reciprocity is unreachable. The input this chapter opens is the
sign and size of herkogamy as a locus in `toFlower`, inside the same 0.92 clamp; placement stays
derived from the resulting shape. Heterostyly is enumerated as reciprocal herkogamy
(`enumeration.md:142,147`). This is the empirical anchor the thesis has lacked: DISASSORTATIVE
mating mediated by placement inside one species, measured since Darwin: pin anthers load the site
thrum stigmas sweep and the reverse, so the morphs mate BETWEEN themselves. Round 4: HELD is the
wrong predicate for it. The tracer averages parents (`anc: (m + f) / 2`, `sim/ibm.js:2229`), so a
population that mates between morphs collapses its ancestry variance and reads FUSED (`:543-545`)
while both morphs persist. The registered predicate is morph-frequency persistence: with the
herkogamy sign as the morph label, both morphs above a floor (registered before the run) at the
last generation over a fixed seed count, and never `fateOf`. The control (round 5): the SAME
two-morph founding and seed under `randomMating` (`:2130`, `:2203`), so the sign locus is present,
both morphs start at their founding frequencies, and only the placement-mediated contact is
ablated. A one-morph control (`HERKOGAMY` fixed, `sim/evolve.js:52,139`), as round 4 wrote, starts
with the second morph at frequency 0 and fails the floor by construction, so any run in which two
morphs merely survived would beat it: a contrast that cannot fail. Darwin 1877 and Barrett's
heterostyly work: UNGROUNDED, need sources; verify via CrossRef before citing in-repo (the
Barrett hit in the enumeration, `:125`, is the wind paper, not this).
Size: M.

### Act 3, the flower fights back

**7. Moving parts.**
Seen: the bee touches a trigger and the flower moves: a column snaps down, or the pollen packet is
fired onto the animal. One shot per flower.
Question: does an active mechanism reach placements that passive contact cannot, and what does a
one-shot flower pay in visits that fire on the wrong animal?
Inputs and anchors: placement still derived. The input added is a trigger depth, a flower coordinate like `antherT`, and a one-shot
state; the fired packet's trajectory is derived from the flower's geometry (`antherT`,
`antherProject`, `antherTheta`) and the animal's position in the tube at the trigger, with no
player-set vector, because `sim/placement.js:7-9` forbids any placement input. Enumerated: _Catasetum_ fires its pollinarium
and _Medicago_ trips (`enumeration.md:136`), the _Salvia_ lever (`:137`). The _Stanhopea_ chute
and _Coryanthes_ bucket escape trajectory is UNVERIFIED (`enumeration.md:620-622,644`), the
contact site set by a constrained escape path if real; it needs a primary source before it can
be a level. _Stylidium_'s column snap: UNGROUNDED, needs a source.
Size: M.

**8. Pollen as a package.**
Seen: the dot on the bee becomes one glued lump at one site, not a powder. It is lost WHOLE when
groomed (fewer chances to be groomed, each one total), it does not dilute across many stigmas, and
if it lands wrong it is lost whole.
Question: does discrete packaging change which separations hold, at the cost of removal chances?
Inputs and anchors: the input is `dispersalUnit` (`sim/carryover.js:132`, default `"granular"`;
`"sectile"` at `:257` with `massulae` segments, `"pollinium"` at `:256`), so it exists in the bout
and is not exposed on the page. Round 5: `massulae` alone does nothing (under the granular default
`massulae` 12 against 3 is bit-identical, `perMassula` is 0 at `:266`), and packets ARE groomed:
the grooming loop tests every carried unit (`:506-507`, `if (rng() < groom) groomedOff += g.mass`),
so a sectile load at `groom` 0.3 lost 14,780 grains and a pollinium 1,320; `:144` says "resists
grooming", per-unit odds, not immunity. Enumerated as pollinaria attachment, low removal efficiency 1.4 (`enumeration.md:134`), with
a 496-pollinaria collection named (`:212`). This is the mechanical face of "a discrete axis is a
MODELLING CHOICE, not a measurement" (`docs/ROADMAP.md:1207`; route #33/#37, `:333`) and of the
euglossine ceiling leg (`docs/FINDINGS.md:211-215`, 14 orchid species per bee against the 1-D
arm's 19).
Size: S.

**9. The price of the animal.**
Seen: three economies side by side. In one the moth lays eggs in the flower and its larvae eat
some seeds; in one the wasp is lured to a flower that pays nothing; in one a fly is sent to a
flower that smells of what it wanted to lay eggs on.
Question: when the animal is paid in offspring, or robbed, does the placement that holds two
lineages differ from the nectar case?
Inputs and anchors: the reward currency is already a named input (`sim/reward.js:8-17`, pollen or
nectar). This chapter adds a third and fourth currency, offspring and nothing, as inputs to the
same bout. Nursery pollination is enumerated as a mutualism-antagonism continuum held by
sanctions (`enumeration.md:287-292`) and, in the open list, asserted not verified (`:635`). Sexual
deception has DOIs (`:86-88`) and hybrid scent novelty attracting a different pollinator (`:89-93`).
Brood-site deception is "not yet explored in depth" (`:94-95`).
Size: L.

### Levels 7 and 8, the escape hatches

Two rows appended to section 5's table by number. Each needs a registered question before any
mechanic; they are levels because the visitor can already try both by hand.

| #   | start                                                         | brief                                                                                                                           | lesson                                                                                                                                                                                                                                                                                                                                                                                                | finding                         |
| --- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| 7   | level 2 pair; mating mode set to the random null              | Give up on the animal: wind. Placement still lands (receipt is still read off the bee, section 4); parentage ignores it (`sim/ibm.js:2123-2130,2203`). Win: HELD                                                                        | the random null is the model's wind; it fuses at 8 where placement excludes (`docs/2026-08-04-secondary-contact.md:40,47-50`). Wind pollinates >=10% of angiosperms (`enumeration.md:125`); ambophily UNGROUNDED, needs a source                                                                                                                                                                      | none registered; question first |
| 8   | level 2 pair; hybrids allowed to found a third ancestry label | Let the bridge become a lineage. No win line: the fate rule scores two labels, so "three labels held" is a question, not a tile | hybrids land between their parents and pay 19.1% (`docs/FINDINGS.md:196-198`); `fateOf` reads one tracer with two labels (`sim/ibm.js:539-546`), so a third outcome needs a registered predicate before it can be scored. Hybrid speciation and polyploidy as instant isolation UNGROUNDED, need sources (`enumeration.md:417` mentions polyploidy in perception only; hybrid scent novelty `:89-93`) | none registered; question first |

### Act 4: Darwin's prediction is B

Given a flower, the model names the body plan that can be pollinated by it: run the contact model
over a bank of animal parameter objects and report which ones receive and deliver. The empirical
turn (section 10) is the test of that mode: a real site's recorded visits, and which of them the
geometry says cannot pollinate.

### Cards, no inputs

Each is a card in the sense of section 4: it names a measured quantity or a documented reason,
and it never moves the model. None is a level.

- **Ants.** Some visitors pollinate badly for a chemical reason: pollen exposed to ants shows
  reduced viability, reduced germination and shorter pollen tubes, attributed to antibiotic
  secretions (`docs/2026-07-31-pollination-mechanism-enumeration.md:318-323`, Beattie et al.
  1984). This is an ANNOTATION on a visitor body plan in the animal bank (Act 4), shown whenever
  that body plan is on the page; it is not a card of section 4, because a flag on an input is an
  input, not a run measurement, and it says "reduced", as the source does, never "never".
  Mechanism detail beyond that row: UNGROUNDED.
- **Nectar robbing.** A hole in the tube defeats the geometry: reward without contact. Named in
  the interaction list (`enumeration.md:178`), observed as a switch under florivory (`:238`),
  resolved in batch 3 (`:627`).
- **Third parties.** Ambush predators, florivores, nectar microbes: all batch-3 rows
  (`enumeration.md:178,238,627`). The card says the visit log the visitor is reading omits them.
- **The animal's eyes.** Signal scored in the receiver's colour space, UV included; hummingbird
  flowers differ from bee flowers in UV, not red (`enumeration.md:396-401`). Extends the
  deception finding that the advertisement splits, not the plant (`docs/ROADMAP.md:243-245`).
- **Across-years mismatch.** Flowering time reaches placement (`docs/FINDINGS.md:65-70`); a
  season that moves with warming moves that result. Phenological mismatch under warming:
  UNGROUNDED, needs a source; present-day stakes only.

## 14. The speculative tier

Rule, carried verbatim from the `~/dyson-tree` speculative-tier spec: **a card moves an input,
never the mating rule.** The mating rule is defined in section 13: the `T` to parents map plus
`fateOf`, with the reserved keys `randomMating`, `optima`, `optimaK`, `demography` and every
`selfing` key (round 5: `linkSignal` and `phenology.link` are inputs under the one distributional
criterion, section 13). Every card names one input the engine already has or one this document registers;
none names `fateOf`, a placement site, or a reserved key.

Anchor badges on every card:

- **MEASURED**: a number in `docs/` with a line.
- **DEMONSTRATED**: a mechanism with a DOI in the enumeration or groundwork, not yet in a run.
- **DECLARED**: an idea with no source in the repo. A DECLARED card cannot enter a registered run;
  it can only propose a question.

The deck is a data table, one JSON file beside the page (no `web/` directory exists today; the
site allowlist is `tools/build-site.sh:19-25`, and the file would be added there). One test asserts
that every row's `input` resolves to one of: a locus in `IBM.ALL_KEYS` (`sim/ibm.js:73`, where
`signal` lives; it is in neither `DEFAULTS` nor `GENE_BOUNDS`); a top-level `IBM.DEFAULTS` key; a
dotted path whose tail the test lists for its option (`phenology.width`, read at `:1473`, since
`DEFAULTS.phenology` is `null`); a key of `DEFAULT_BEE`; a bout parameter on a named allowlist
(`groom`, `harvest`: `sim/carryover.js:93,105`, not `DEFAULT_BEE` keys); or an input registered in
section 13. It also asserts that no row names `fateOf` and that no row's path is or starts with
`randomMating`, `optima`, `optimaK`, `demography` or `selfing` (round 5, section 13). Round 5: a
row's `value` may be an object (an option object such as `phenology`), and the check is applied
to every effective LEAF of it, `input` joined to each nested key, under the same rules, so an
object value cannot carry a key the row's `input` alone would hide. The test carries its own
must-fail rows, so it is not satisfied by an empty deck: a fixture deck with one row naming
`selfing.rate`, one naming `demography.K`, one naming `optima`, one naming `fateOf`, one naming a
key in none of the lists and one with a legal `input` (`phenology`) whose object `value` carries a
leaf in none of the lists must fail the test with all six rows reported, and the same fixture
minus those rows must pass; the test runs both in one case, so a broken loader reads as a failure
rather than a pass. The deck file and this test are M3b's (section 9), where the cards it sits
beside are built; no earlier milestone ships a row. Round 4: the fixture
alone leaves the REAL deck untested, so the same test loads the committed deck file and asserts
it has at least the five rows of the backbone table below, each resolving under the rules above;
an empty or missing deck fails.

### The grounded backbone

This is what pollination has and the dyson tier did not: real floral genes behind the sliders.
Each is a card whose input is a slider that already exists, or (round 5) a locus the founding draws:
`signal` is `IBM.ALL_KEYS[8]`, drawn by `srng` at founding (section 3, item 4), and M1's eight
sliders are the seven `GENE_BOUNDS` genes plus `antherTheta`; the two `signal` rows print the
founding draw and carry the badge text "not a slider: the founding signal draw" until a slider
exists. A group row names an array of inputs, each resolving under the rules above.

| card                      | input                                        | badge        | anchor                                                                                                                                                                                                                                                                                                                                               |
| ------------------------- | -------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CYCLOIDEA knockout        | `polarity` (`sim/evolve.js:29-35`)           | DEMONSTRATED | CYC-like genes control symmetry, orientation and nectar guides together (`enumeration.md:577-580`, Yang et al. 2023); knockdown measured as 3D shape (`:592-593`, Berger et al. 2017). Caveat on the card: the three traits are pleiotropically coupled (`:581-584`), and the slider moves one of them. Verify before citing outside the enumeration |
| spur-length genes         | `axisLen`                                    | DECLARED     | _Aquilegia_ spur genetics: zero hits in the repo. UNGROUNDED, needs a source                                                                                                                                                                                                                                                                         |
| scent by structural genes | `signal` (`sim/ibm.js:60-72`, `SIGNAL_GENE`) | DEMONSTRATED | gain and loss of scent via structural genes in _Petunia_ (`enumeration.md:452-453`, Amrad et al. 2016). A signal genome, never a shape gene: `shapeOf` keeps it out of the geometry (`sim/ibm.js:70-71,301`)                                                                                                                                         |
| MYB colour factors        | `signal`                                     | DECLARED     | MYB: zero hits in the repo. UNGROUNDED, needs a source                                                                                                                                                                                                                                                                                               |
| architecture is simple    | `["axisLen", "mouthR", "throatR", "antherT", "antherProject", "curve", "polarity", "antherTheta"]` (the eight M1 sliders, a group row) | DEMONSTRATED | major QTL under syndrome divergence in _Penstemon_; hummingbird syndrome evolved more than 100 times (`enumeration.md:445-448`); "simple genetic architecture and low constraint" in _Jaltomata_ (`:449-451`)                                                                                                                                        |

### DECLARED cards

- **Robot pollinators.** A drone body plan in `DEFAULT_BEE`'s shape: no grooming, no harvest, no
  learner. Input: the bee parameter object (`sim/placement.js:150-159`) with `groom` and `harvest`
  at zero (`sim/carryover.js:93,105`). DECLARED.
- **Sonar flowers.** A bat-pollinated vine's concave leaf as an acoustic retroreflector; echoes
  classified by CNN, so a dataset exists (`enumeration.md:103-105`, Simon et al. 2021). Input: a
  signal channel the bat body plan reads. DEMONSTRATED as a mechanism; the body plan is DECLARED.
- **Design the moth.** A flower for an animal that does not exist: the chapter 1 race run
  backwards, the visitor sets the flower and the page reports the body plan that would be needed.
  Input: the animal bank from Act 4. DECLARED.
- **No-insect worlds.** A Mars greenhouse or the inside of a Dyson tree: no animal, so placement
  is none and the only routes are wind (level 7) and self (cleistogamy, registered below); the cross-over with
  `~/dyson-tree` is one line, that its speculative tier and this one share the rule at the top of
  this section. DECLARED.

### Needs its own pre-registration (not in the input-only tier)

- **Cleistogamy.** A closed flower that only selfs, the floor at its maximum with no animal. Not
  `selfing.cover` at 1: that sets `nKeep = 0` (`sim/ibm.js:2015`) and every `selfW` to zero, so
  the selfing test `rng() * weight[mother] < selfW[mother]` (`:2189-2193`) never passes and no
  mother selfs. The engine's only all-self path is `selfing.always` (`:1845-1849`), a reserved
  control. A cleistogamous morph is a change inside the selfing branch: registered question first.
  Cleistogamy: zero hits in the repo, UNGROUNDED.
- **S-locus self-incompatibility.** The selfing branch (`sim/ibm.js:1843-2042`) with chapter 5's
  per-grain self rejection. That weight sits between `T` and the parents, so it changes the mating
  rule (section 13) and cannot be a card here. Late-acting self-incompatibility is enumerated
  (`enumeration.md:196`); the S-locus itself is UNGROUNDED. Registered question first.
- **Chapter 5, the stigma race**, for the same reason, at k = 2 (section 13).

## Round 4 responses

Each finding of the round-4 verified table (29 rows, all CONFIRMED by the verifier's own re-runs)
and what changed, by line of this revision. Every engine number quoted above was taken from the
verified table, the null tables, or a probe run for this revision (`tmp/v4-pollen/probe5_*`,
`rm8_*`, `card6null_*`, `edges.out`, `summarise.out`).

- **A0a-A0d** (pre-checks, confirmed): no change needed; the fresh seeds 31 to 35 are not added
  to the committed tables (the edges are defined over seeds 1 to 30 and the fresh seeds crossed
  none of them at d = 8; the d = 4 crossings are the reason cards 2 and 3 are grey at target 4,
  :225-226, :231-239).
- **A1** (card 2 edge crossed by its defining seed): fixed. `edges` mode re-runs the defining seed
  at full precision and rounds outward (:196-201, :417-426 item 7; `tools/northstar-null-tables.js`
  `edges`, null tables "Committed edges"); card 2's edge is 0.434 (:225), card 3's 0.170 stands
  (seed 13 at 0.16952, :226), card 1's 0.603 stands (seed 22 at 0.60324, :224), card 6's is 0.403
  (:229).
- **A2** (card 3 without founding eligibility; a = 1 - epsilon opens it): fixed. Card 3 carries
  card 2's target-8 eligibility (:226, :231-239); at target 4 neither card has a threshold and both
  are grey (`edges` 0.901 / 0.597, 0 of 10 a = 0.25 seeds above).
- **A3** (cards 2 and 3 open under `randomMating` + a = 0.25): fixed with a measured quantity, not
  an option condition. `randomMating` is a second null arm for both cards, tabulated over the same
  seeds (null tables `card23rm`, 58 rows); its gap occupancy exceeds every a = 1 edge, so the cards
  read the LEAD (variance-halving generation minus gap-filling generation), whose random-mating
  edge is 1; 0 of 58 random-mating rows and 0 of 29 a = 1 seeds reach either card's full
  signature, and the same 5 and 4 a = 0.25 seeds open them (:192-215, :225-226). The signature
  rule (:209-215) additionally greys every card on a run whose mating mode differs from the one
  its table ran at.
- **A4** (card 1's statistic is not the document's; identical shapes open it): fixed in wording.
  The card says "hybrids received less than the rest of the field", and prints 0.809 labelled as
  the document's both-role, clonal-control statistic (`experiments/hybrid-placement.js:262-274`;
  `docs/2026-08-02-hybrid-placement.md:54-57`), never as the run's second reading (:224, :278);
  the identical-shape counterexample needs `mutRate` 0 and `visits` 10, neither a page control,
  and at the page defaults reads 0.819 to 1.330, closed (:224).
- **A5** (`demography` opens card 4; hybrid generations counted on parents): fixed. The signature
  rule greys cards 1 and 4 on any run with `demography`, `space` or any other option key set
  (:209-215, :227); the quantity is named "generations whose parents held a hybrid" (:224, :227).
- **A6** (q = 1 opens card 5 with zero assurance spent): fixed. Option condition
  `cover > 0 && cover < 1` with the `nKeep = 0` mechanism stated (:228); M3b acceptance asserts
  the q = 1, seed 8 pair stays closed (:334).
- **A7** (card 6's 0.140 is a CI on a 12-seed mean): fixed. Card 6 opens beyond a per-seed null,
  shuffled against shuffled at a second width stream (`card6null`, 29 seeds, edge 0.403, 9 of 29
  treatment seeds clear it); 0.140 is printed as the document's interval, never the line (:229).
- **A8** (grey rule keys on N / generations / siteN only): fixed. The signature rule compares
  mating mode and the option object too (:209-215); card 6's eligibility is the exact phenology
  object; level 5's second run loads that object, not a flipped `widthLocus` (:229, :258).
- **A9** (two rng protocols): fixed. ONE protocol, the page's, is named; the null tables are shown
  to use it (`tools/northstar-null-tables.js:92-94,113`); the level-5 acceptance is restated under
  it (seeds 1 and 3 HELD, re-run for this revision, `probe5b_level5_protocol.out`) and the probe
  doc's restart-protocol seeds 3 and 4 are retired; the fidelity test is rewritten in M1 to share
  `rng` with founding and to assert against the tables' rows; M2's acceptance asserts the page's
  fate and quantities equal the tool's rows for the two control seeds (:337-353, :331-334,
  :417-421).
- **A10** (reserved-key inventory incomplete; `linkSignal` unreserved): fixed. Every key read in
  `:1777-2256` is listed and classed (:443-459); `linkSignal` and `phenology.link` are reserved
  (they change realised pairs at identical receipt); `mutRate`, `signalMut`, `phenology.mut`,
  `phenology.widthMut` and `space` are inputs by the criterion but grey every card; stream
  consumption alone is ruled not to be "the rule" (:459-461). Deck test forbids the two new keys
  (:707, :724-727).
- **A11** (BLOCKER, a stalled run reads HELD): fixed at the engine and on every level. `fateOf`
  gains `stalled` and returns STALLED before HELD (:161-177, :307-313); the page passes
  `recruits === 0` (:332); every level's win is HELD only, STALLED loses (:245-248); STALLED opens
  no card (:181-184); M2's smoke drives the reach-0 pair and asserts STALLED against `one lost`
  (:332).
- **A12** (level 6 has known wins): fixed. Level 6's copy names the known phenology and selfing
  wins, lists them as already known, and asks for a route the page does not list (:259, :333).
- **A13** (page scores fate on the last parents' frame; MINOR): fixed. M2 keeps the final
  offspring and calls `IBM.fateOf(pop, v0, extinct, stalled)` on it as the tool does (:332).
- **A14** (M1 acceptance passes on either branch; deck test never checks the real deck): fixed.
  M1 names the per-gene dot movement at the fixed level-1 genome (`probe5_gene_sensitivity.out`),
  asserts the seven moving genes shift the dot by at least 0.1 AND that `curve` alone reads "no
  effect", and asserts every founder allele finite (:331); the deck test loads the committed deck
  and requires at least the backbone's five rows (:724-733).
- **A15** (phenology disables the bout log; the field draws nothing): fixed. M3b specifies the
  no-log field for levels 4 and 5 with its caption (:63, :334).
- **A16** (chapter 5's self-tube discount is inert): fixed. The chapter names the selfing test
  (`sim/ibm.js:2189-2193`) as the only place a self grain wins and registers a per-mother tube
  weight inside it, asked at the selfing floor (:569-592).
- **A17** (chapter 6 calls heterostyly assortative and wins on HELD): fixed. Disassortative; the
  registered predicate is morph-frequency persistence against a fixed-herkogamy control, never
  `fateOf` (:594-615).
- **A18** (k-medoids always partitions; MINOR): fixed. A shuffled-animal control is registered
  beside the majority pass condition (:545-567).
- **A19** (ant card fires on an input flag; "never"): fixed. It is an annotation on a body plan in
  the animal bank, not a card, and says "reduced" (:683-689).
- **A20** (BLOCKER, `foundPopulation` with an eight-slider base gives `NaN` signal): fixed. The
  recipe carries `[IBM.SIGNAL_GENE]: srng()` in the base, with the mechanism at `:438,442` and the
  verified `NaN` / 0.476-0.538 control (:127-136); M1's acceptance asserts every founder allele
  finite (:331).
- **C1** (row 47 says the test tests the page's loop): fixed, the row says what it asserts and
  that M1 rewrites it (:61).
- **C2** (mating-rule key list "and no others"): fixed, = A10 (:443-461).
- **C3** (level 7 "Placement = none"): fixed, "Placement still lands; parentage ignores it"
  (:668).
- **S1, S2** (scope checks, confirmed): no change.
- **Verifier's brief-readiness line**: both M1 blockers addressed, the founding recipe (:127-136)
  and the either-branch acceptance (:331); M2 and M3a/b carry the stall, the two-null cards and
  the single protocol they were waiting on.

## Round 5 responses

Astra's round-5 audit of `5ebc801` (13 findings; 11 confirmed, 2 partial, 3 added by the verifier; every
round-4 numeric fix held: both card controls, `edges`, `card23 rm8` 1-5, the reach pair). Line numbers
are this revision's.

- **1** (BLOCKER, the STALLED fixture cannot found at reach 0): fixed. Section 3 states the protocol
  (found at `DEFAULT_BEE`, step at `reach` 0) and why no other exists; the page founds only on
  non-null placements and the gap tile reads "unavailable" on a null (:150-156, :184-192); M2's
  stall line names the protocol (:361).
- **2** (STALLED before `BOTH LOST`; PARTIAL, engine-only): fixed. STALLED is tested after the
  extinction line; a `demography` empty generation is `BOTH LOST`, never on the page (:195-200,
  :464-465).
- **3** (object-valued deck row smuggles a reserved leaf): fixed. The check recurses into object
  values; a sixth must-fail row carries a leaf in none of the lists (:797-807).
- **4** (deck unowned, group row unrepresentable, `signal` has no slider): fixed. M3b owns the deck
  file and test (:363, acceptance); a group row is an array of inputs; the `signal` rows are
  badged "not a slider: the founding signal draw" (:815-819, :827).
- **5** (fidelity test tests a copy): fixed. M1 moves the page's loop into `population-run.js`,
  the test executes it and may not call `I.step` itself (:380-389, :360).
- **6** (odd N drops a plant): fixed. Both calls written out, `half` and `N - half`; M1 counts
  founders and labels at N = 5 and 30 (:141-146, :360).
- **7** (smoke asserts no card state): fixed. `data-state` asserted per acceptance line on the
  positive seed, null block, grey run and STALLED run (:403-410, :361).
- **8** (`space` and `linkSignal` ruled oppositely for one mechanism): fixed. One distributional
  criterion; `linkSignal` and `phenology.link` are inputs, grey by signature (:498-513, :524-525,
  :777-779).
- **9** (`phenology.widthLocus` missing from the inventory): fixed (:492-496).
- **10** (chapter 5's multiplier reverses the intent): fixed. `selfW / (1 + received)`, with the
  untouched, share-scaled and registered P(self) tabulated and the increment named (:637-649).
- **11** (chapter 6's one-morph control cannot fail): fixed. Two-morph founding under
  `randomMating`; the question no longer says HELD (:659-660, :673-678).
- **12** (`massulae` alone is inert; packets are groomed): fixed. Input is `dispersalUnit`; the
  copy says lost whole when groomed (:661-670).
- **13** ("sets `widthMut` is grey for every card" disables card 6): fixed, folded into 8's
  signature sentence (:508-512).
- **N1** (stall fixture protocol unstated): fixed with 1.
- **N2** (chapter 5 adds nothing over the denominator effect): fixed with 10; the increment is the
  registered primary.
- **N3** (`edges` prints an impossible -0.001 edge): fixed in `tools/northstar-null-tables.js`
  (`edges` prints "no edge (null reaches 0)" for a lower edge at or below 0; null tables re-run).
- **Verifier's brief-readiness line**: the three M1 blockers (6, 5, 4) and M2's fixture (1, N1)
  are closed in the milestone rows themselves (:360-363), not only in the sections they cite.
