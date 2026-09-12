# Northstar A: the sandbox with a goal (2026-09-12)

Design spec. Master @ `fff1636`. Every claim about current code carries a `file:line`; every
number carries its result document. Nothing here changes a measurement.

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

| piece                | where                                                                                                                          | what it does                                                                                                                                                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| shape genome         | `sim/evolve.js:28-38`                                                                                                          | seven bounded loci `GENE_BOUNDS` plus the wrapping `antherTheta` (`ANGLE_GENE`)                                                                                                                                                                          |
| genome to flower     | `sim/evolve.js:134-141`                                                                                                        | `toFlower`: stigma tracks anther, `stigmaT = antherT + HERKOGAMY` with `HERKOGAMY = 0.05` (`:52`)                                                                                                                                                        |
| placement            | `sim/placement.js:7-9`                                                                                                         | "PLACEMENT IS NEVER A GENE. Nothing here takes a placement site as an input"; the two contact mechanisms at `:21-37`                                                                                                                                     |
| the bee              | `sim/placement.js:150-159`                                                                                                     | `DEFAULT_BEE`: `bodyLen`, four named regions, `reach`. Not a genome anywhere                                                                                                                                                                             |
| IBM genome           | `sim/ibm.js:53,73`                                                                                                             | `GENE_KEYS = Object.keys(E.GENE_BOUNDS)`; additive diploid expression at `:283-287`; `shapeOf` at `:301` drops the signal locus                                                                                                                          |
| two founded lineages | `sim/ibm.js:561-595`                                                                                                           | `foundTwoLineages(n, rng, srng, targetD, opts)` mutates a base genome until a placement `targetD` away is found; ancestry labels 0 and 1 (`:584-592`)                                                                                                    |
| a generation         | `sim/ibm.js:1124`                                                                                                              | `step(pop, opts, rng, gen, srng, ...)`; returns `cluster` (`:2281`), `ancVar` (`:2286`), `received` (`:2279`)                                                                                                                                            |
| fate                 | `sim/ibm.js:539-546`                                                                                                           | `HELD` if final ancestry variance > 0.4 x founding; `one lost` if mean ancestry < 0.15 or > 0.85; else `FUSED`                                                                                                                                           |
| ancestry variance    | `sim/ibm.js:470-474`                                                                                                           | plain variance of the tracer                                                                                                                                                                                                                             |
| hybrid definition    | `experiments/hybrids-or-balance.js:64-65,87`                                                                                   | ancestry strictly between 0.15 and 0.85 (not in `sim/`, page-side arithmetic on the `anc` array)                                                                                                                                                         |
| gap occupancy        | `sim/ibm.js:1107`                                                                                                              | `gapOccupancy(places, pA, pB)` against founding placements                                                                                                                                                                                               |
| the page's run loop  | `population.html:717-776`                                                                                                      | `buildRun`: reads seed, d, N, generations, mating mode (`:718-722`); calls `I.foundTwoLineages` (`:727`); drives `I.step` itself to keep every generation's genomes (`:754-760`); stores `flowers`, `sites`, `sep`, `ancVar` per generation (`:762-772`) |
| loop fidelity test   | `tests/browser-bundle.test.js:157`                                                                                             | "the page's own generation loop reproduces run() exactly"                                                                                                                                                                                                |
| bundle               | `sim/browser-bundle.js`, built by `tools/build-browser-bundle.js:29-45`                                                        | globals `Placement`, `Packing`, `Carryover`, `Evolve`, `Deception`, `IBM`; page aliases at `population.html:269-271`                                                                                                                                     |
| 3D renderer          | `population.html:437` (ancestry tint), `:645` (pollen at the model's own `(s, phi)`), `:686` (scene dressing labelled as such) | canvas `#field`, drag to orbit                                                                                                                                                                                                                           |
| body map             | `population.html:248-261`, `drawMap` around `:1019`                                                                            | placements plotted on the animal, along the body vs around it                                                                                                                                                                                            |
| fate tile            | `population.html:236-243`, `fateOf` copy at `:1025-1032`, `show` at `:1034-1049`                                               | tiles: generation, cluster separation, ancestry variance, fate                                                                                                                                                                                           |
| site build           | `tools/build-site.sh:19-25`                                                                                                    | allowlist `visit.html population.html greybox.html` plus `sim/placement.js sim/browser-bundle.js`; script-src check `:56-69`                                                                                                                             |
| smoke                | `tools/smoke-site.py:40-45` SPEC; `:162-190` clicks `#run`, waits for `#play` to enable, asserts the canvas changed            | run by `.github/workflows/pages.yml:31-34` after `build-site.sh`                                                                                                                                                                                         |

Not reused: `visit.html` exposes two controls on flower B only (`theta` at `:147`, `pol` at
`:152`, applied at `:907-912`), loads `sim/placement.js` alone (`:174`), and animates a scripted
nine-phase visit (`:690-698`). `greybox.html` has the same two sliders (`:149,154`) and no run.

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

   No stigma control: `toFlower` derives it (`sim/evolve.js:134-141`) and the page says so under
   the panel. No placement control of any kind (`docs/ROADMAP.md:1776`).

2. **The bee**, drawn once between the panels, with its regions named from
   `DEFAULT_BEE.regions` (`sim/placement.js:152-157`). `reach` and `bodyLen` are shown as two
   read-only values in M1 (see open question 2). Both lineages' anther and stigma sites are drawn
   on the body live as the sliders move, via `Placement.placementDistribution(toFlower(g), bee,
{part})` (the call `sim/evolve.js:155-165` already makes) and `IBM.placementOf` on `sitesOf`
   (`sim/ibm.js:563-564`). The label under the bee reads "computed from the shapes above, not
   settable". A flower whose distribution has no hits (`sim/evolve.js:165`, "never touches the
   animal") draws no dot and the panel reads "this flower never touches the bee".

3. **Realised separation**, the body distance between the two anther sites
   (`sim/ibm.js:825` `dist`), printed with the band from section 6. This is the number the
   visitor is shaping before any run.

4. **Run controls**, unchanged from `population.html:184-217`: seed, N, generations, mating mode
   (placement-mediated vs random null). The `d` input goes away: the sandbox founds the two
   lineages from the two hand-set genomes, so `foundTwoLineages`'s search (`sim/ibm.js:568-579`)
   is replaced by `foundPopulation(half, ..., {base: g1, anc: 0})` and
   `foundPopulation(n - half, ..., {base: g2, anc: 1})` with the same `spread: 0.02`
   (`:584-592`). Placement stays derived; only the founding genomes change source.

5. **The field and the body map**, as today (`population.html:220`, `:248`), plus the scrubber and
   the four tiles, plus two new tiles computed from data the page already holds:
   **hybrid fraction** = share of `G.anc` strictly between 0.15 and 0.85
   (`experiments/hybrids-or-balance.js:64-65,87`; `anc` per generation at `population.html:742`)
   and **gap occupancy** = `IBM.gapOccupancy(places, p1, p2)` (`sim/ibm.js:1107`) with `p1, p2` the
   founding placements held fixed (`docs/ROADMAP.md:245-247`: re-deriving the gap from the current
   cloud "would report an empty gap forever").

**The goal, in the engine's terms.** "Coexist" means the fate tile reads **HELD** at the last
generation: `ancestryVar(finalPop) > 0.4 * ancVar0` (`sim/ibm.js:543`), the same predicate every
headline in roadmap B uses (`:525-532`). For an even split of labels 0 and 1 the founding variance
is 0.25, so the HELD line on the page sits at 0.10 (arithmetic on `:470-474` and `:584-592`; the
page draws the line from the run's own `GENS[0].ancVar`, not from this constant). The other two
fates are named as they are named in the engine: `one lost` and `FUSED` (`:544-545`).

## 4. Why you failed

What you would see: after a run ends in `FUSED` or `one lost`, one or two cards open under the
fate tile. Each names a quantity the run measured, its value, the band it crossed, and the
finding. A card opens only when its quantity crosses its band; no card is attached to a level.

| card                                   | trigger, measured in the run                                                                                                                | where computed                                               | what the card says, with source                                                                                                                                                                                                                                                                                                                           |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| hybrids pay from geometry              | hybrid fraction (section 3.5) above 0 in any generation and fate not HELD                                                                   | page arithmetic on `anc` (`population.html:742`)             | hybrids land between their parents (`sim/ibm.js:38-41`) and pay 19.1% from geometry alone, interval [0.706, 0.912] (`docs/FINDINGS.md:196-198`; `docs/2026-08-02-hybrid-placement.md:75`)                                                                                                                                                                 |
| the shared pollinator is the bridge    | gap occupancy above the no-bias band (0.024, section 6) while cluster separation (`sim/ibm.js:2281`, page `:757`) shrinks                   | `IBM.gapOccupancy`                                           | intermediates sit at d/2 where the barrier is leaky, m = 0.083 (`docs/2026-08-04-rare-biased-visits.md:103-104`); in 11 of 12 fused replicates the gap filled before ancestry variance halved (`docs/ROADMAP.md:248-249`)                                                                                                                                 |
| preferring the rare defeats itself     | the run's `allocExponent` < 1 (`sim/ibm.js:686`) and gap occupancy above the a = 1 band                                                     | `allocWeights` at `sim/ibm.js:1413`                          | an intermediate draws 136x the visits of an ordinary plant at d = 8 (`docs/2026-08-04-rare-biased-visits.md:99,103`); mean gap 0.107 at a = 0.25 against 0.024 at a = 1 (`docs/2026-08-05-gap-occupancy.md:120-122`)                                                                                                                                      |
| secondary contact fuses, or excludes   | fate FUSED with realised separation below 4, or `one lost` at 8                                                                             | `fateOf`, `sep`                                              | below d = 4 every seed fuses, at d = 8 one lineage is lost in every seed while the random null fuses (`docs/2026-08-04-secondary-contact.md:33-38,47-50`); per-capita receipt at 10% frequency is 0.214 of the majority's (`docs/2026-08-04-density-dependence.md:93-94`), exponent 0.70 on own-frequency odds (`docs/2026-08-04-limiting-factors.md:53`) |
| a floor spread thin is worse than none | run has `selfing.cover` set (`sim/ibm.js:1963`) and the count of plants with zero `received` (`:2279`) exceeds the flat-floor count         | `received` array                                             | at q = 0.85 HELD is 0.055 against 0.266 with no floor at all (`docs/2026-09-06-selfing-cover.md:14,44-46`); the harm 0.349 exceeds the floor's whole benefit 0.138 (`:60`)                                                                                                                                                                                |
| flowering width evolves wide           | run has `phenology.widthLocus` (`sim/ibm.js:1185`) and mean expressed width (`:1312-1313`) at the last generation exceeds the founding mean | page arithmetic on `h1[WIDTH_GENE], h2[WIDTH_GENE]` (`:127`) | width drifts wider, +0.291 / +0.084 / +0.233 at S = 8 / 16 / 32, the middle one spanning zero (`docs/FINDINGS.md:115-117`); flowering longer was not free, conserving display removed four fifths of the gradient and the direction survived (`:143-148`)                                                                                                 |

The width card and the selfing card cannot fire outside a level that sets those options, because
`DEFAULTS` leaves both `null` (`sim/ibm.js:670,722`). That is the trigger doing its job, not a
scripted branch: the card reads the option and the measured quantity, never the level id.

## 5. Levels

What you would see: a "level" select above the gene panels. Choosing one loads a starting
configuration into the sliders and run controls and shows a one-line brief. Every slider stays
live in every level; the win is the fate tile, nothing else.

| #   | start                                                                                          | brief                                                                                                           | lesson                                                                                                                                                                                                                                                                                   | finding                      |
| --- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| 1   | lineage 1 = lineage 2 = a random genome; bee default                                           | Move one lineage's pollen to a different part of the bee. Win: realised separation at or above 8 before any run | placement is two-dimensional (along and around the body); a shape change moves the dot, not a placement number. 2-D out-packs a 1-D gene 2.1x at the 309-species pool, 40 against 19 at tau = 0.2, rising to ~3.1x (`docs/FINDINGS.md:192-195`; `docs/2026-08-02-pool-scaling.md:54,62`) | foundation, pre-registration |
| 2   | the pair from level 1; N = 18, 24 generations, placement-mediated                              | Now make them stay two kinds. Win: HELD                                                                         | nothing holds: fuse below 4, one lost at 8, and the random null fuses at 8 where the model excludes (`docs/2026-08-04-secondary-contact.md:33-38`)                                                                                                                                       | secondary contact            |
| 3   | level 2 pair at separation 8; `allocExponent` = 0.25                                           | The bee now prefers the rarer flower. Win: HELD                                                                 | the rarest placement is the intermediate; the subsidy builds the bridge (`docs/2026-08-04-rare-biased-visits.md:103-109`); a = 0.25 gives 4 HELD of 12 with mean gap 0.107 (`docs/2026-08-05-gap-occupancy.md:120`)                                                                      | rare-bias self-defeat        |
| 4   | level 2 pair; `selfing.cover` at q = 0.69 then 0.85 with total budget held                     | A floor under the rare lineage, spread over some plants. Win: HELD                                              | thinner cover harms: primary -0.221 [-0.339, -0.101] against the flat floor (`docs/FINDINGS.md:34`); at q = 0.85 below no floor at all (`docs/2026-09-06-selfing-cover.md:14`)                                                                                                           | selfing budget               |
| 5   | level 2 pair; `phenology` with `slices` = 8 and a narrow fixed `width` (`sim/ibm.js:204,1188`) | Give them different seasons. Win: HELD. Then flip `widthLocus` on and run again                                 | HELD 0.417 at S = 8 under the registered visit rule (`docs/ROADMAP.md:54`), the one positive (`docs/FINDINGS.md:65-70`), conditional on the allocation rule (`:94-102`); with width heritable it evolves wide (`:139-141`)                                                               | phenology, evolving width    |
| 6   | level 2 pair; every option exposed                                                             | Find a way for the rare lineage to gain from being rare. Unsolved                                               | six route families spent, five attacking visitation or attraction (`docs/ROADMAP.md:317-330`); the northstar is open (`docs/FINDINGS.md:202-207`)                                                                                                                                        | the open northstar           |

Level 5 is the only level where HELD is reachable in the shipped model, and only at the rate the
finding reports (5 of 12 seeds, `docs/ROADMAP.md:398`). The brief says so: "about two seeds in
five hold". Level 6 offers no seed known to win; the page says that a win there is a result the
project has not obtained and asks the visitor to note the seed and settings.

## 6. Legibility: reference bands

What you would see: every numeric tile carries a thin band and one word beside the value.

| readout                                                                   | band                                                                                                                                                                                                                                                           | source                                                   |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| realised separation                                                       | "fuses" below 4, "excludes" at 8                                                                                                                                                                                                                               | `docs/2026-08-04-secondary-contact.md:33-38,47-50`       |
| ancestry variance                                                         | founding value from the run; HELD line at 0.4 x founding (`sim/ibm.js:543`); "fused or lost" at 0.000, which every secondary-contact arm reached (`docs/2026-08-04-secondary-contact.md:28`)                                                                   | engine predicate                                         |
| fate                                                                      | HELD / one lost / FUSED with the base rates the visitor is up against: 0 of 38 in every spatial cell (`docs/FINDINGS.md:166`), 0.266 with no floor (`docs/2026-09-06-selfing-cover.md:46`), 0.417 with a narrow imposed season at S = 8 (`docs/ROADMAP.md:54`) |                                                          |
| hybrid fraction                                                           | any value above 0 is labelled "hybrids present, paying 19.1%" (`docs/FINDINGS.md:196-198`)                                                                                                                                                                     | threshold from `experiments/hybrids-or-balance.js:64-65` |
| gap occupancy                                                             | 0.024 "no bias", 0.107 and 0.143 "rare-biased" (`docs/2026-08-05-gap-occupancy.md:120-122`)                                                                                                                                                                    |                                                          |
| cross receipt at 10% frequency (shown on the secondary-contact card only) | 0.214 (`docs/2026-08-04-density-dependence.md:94`)                                                                                                                                                                                                             |                                                          |

Every band is a constant in one table at the top of the page's script, each with its source line
as a comment, so a future correction to a document has one place to land.

## 7. Consolidation

What you would see on the live site: the landing page's first link is the sandbox; the page list
has two entries, sandbox and visit.

- `greybox.html` is deleted. It duplicates `visit.html`'s two sliders (`greybox.html:149,154`
  against `visit.html:147,152`) and has no run; its "two flowers, one bee" framing (`:126`) is the
  sandbox's default screen. Removed from `tools/build-site.sh:24`, from `tools/smoke-site.py:43`,
  from `tools/site-index.html:194`, and from `README.md:54`.
- `population.html` becomes the sandbox in place (same filename through M3, so the smoke contract
  `#run` then `#play` at `tools/smoke-site.py:170-186` keeps running unchanged and
  `tests/browser-bundle.test.js:128,157` and `tests/bout-log.test.js:216-235` keep reading it).
  Whether it is renamed at M4 is open question 1.
- `visit.html` stays as the scripted reveal; the landing page moves it to second position.
- `tools/site-index.html:185-201` "Play with it" is rewritten to lead with the sandbox and its
  goal; `README.md:9` "three browser toys" becomes two.

## 8. Non-goals

- No new sim mechanics: the arc is a UI on `sim/` as shipped at `fff1636`; a change under `sim/`
  would need a pre-registration, and this is not an experiment.
- No new experiments or numbers: every band and every card quotes a result document; a level
  whose lesson needs a number not yet in `docs/` is out of scope.
- No renderer rewrite: the `#field` canvas stays; the only drawing added is the two live sites on
  the bee and the bands on the tiles (`docs/ROADMAP.md:1645-1650` says polish is not a priority).
- No save or share backend: the level plus seed plus gene values fit in the URL hash, which is
  enough to reproduce a run and costs no server.
- No web worker: a 24-generation, 24,000-visit run completes inside the smoke test's 60 s
  (`tools/smoke-site.py:171`); levels keep the default generation count.
- No bee genome: `DEFAULT_BEE` is a parameter object (`sim/placement.js:150-159`), and making it
  evolve is a mechanism, not a UI.

## 9. Milestones

|     | scope                                                                                                                                                                                                                              | size | acceptance a stranger can check on the live page                                                                                                                                                               |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1  | all eight genes for both lineages as sliders with bounds read from `Evolve.GENE_BOUNDS`; live anther and stigma sites of both on the bee; realised separation with band; `d` input removed; founding from the two hand-set genomes | M    | drag lineage 2's anther angle from 0 to pi and watch its dot move from the bee's back to its belly with no run; every slider at either bound moves at least one dot, or the panel says "no effect at this bee" |
| M2  | RUN on the hand-set pair; hybrid fraction and gap occupancy tiles; bands on every tile; the six cards, each opening on its measured trigger                                                                                        | M    | run the default pair at separation 8, placement-mediated: the fate reads `one lost`, the secondary-contact card names 0.214, and the same run under the random null reads `FUSED` with the hybrid card open    |
| M3  | the level select and briefs; levels 3 to 5 wire `allocExponent`, `selfing.cover`, `phenology` from the page; level 6 exposes every option                                                                                          | L    | pick level 5 and run seeds 1 to 5: at least one ends HELD; pick level 1 and reach separation 8 by sliders alone                                                                                                |
| M4  | consolidation: greybox removed, landing page leads with the sandbox, README and build allowlist updated, smoke SPEC updated                                                                                                        | S    | the live index's first link opens the sandbox; `greybox.html` returns 404; `python3 tools/smoke-site.py` passes on the built site                                                                              |

Each milestone extends `tools/smoke-site.py` with one assertion for its acceptance line and one
negative control (a run in which the trigger is absent and the card must not open).

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
   check is an acceptance line, and a locus that fails it is labelled on the page rather than
   hidden.
2. **The cards become narration.** A card keyed to a level id is a caption, not a diagnosis.
   Guard: every card's trigger is a measured quantity with a band (section 4), and the smoke test
   drives one run where the quantity stays inside its band and asserts the card stays closed,
   beside the run that opens it.
3. **The levels become a slideshow of findings.** If each level can only reproduce its finding,
   the visitor never fails differently and never learns the model. Guard: every slider and
   every option stays live in every level, the win is the engine's `fateOf` and nothing else,
   and level 6 ships with no known winning configuration and says so.

## 12. Open questions

1. Keep the filename `population.html` for the sandbox, or rename to `sandbox.html` at M4 and
   update the two tests and the smoke SPEC that read it by name? Recommendation: rename at M4,
   since the landing copy changes then anyway.
2. Should the bee's `reach` and `bodyLen` (`sim/placement.js:151,158`) be sliders in M1, labelled
   "bee, fixed for the run", or read-only? Recommendation: sliders, because the ruling says
   "designs a flower and a bee", and neither value is a gene.
3. Level 5 needs `phenology` options in the page (`slices`, `width`, `widthLocus`,
   `conserveDisplay`, `displayProportionalVisits` at `sim/ibm.js:204,1188,1185,1552,1570`).
   Expose the visit-allocation rule as a visible switch with its own band (0.289 registered vs
   0.026 proportional, `docs/FINDINGS.md:97-98`), or fix it at the registered rule and state it
   in the brief? Recommendation: expose it, since that condition is the finding's own caveat.
