# Pollination mechanism enumeration — design reference

**Status:** LIVING DOC, in progress. Enumeration batches 1–2 complete, batch 3 in progress.
**Date started:** 2026-07-31
**Purpose:** Establish the full space of pollination mechanisms the sim must be general over,
BEFORE fixing the trait/mechanism interface. Driven by the observation that building the
contact model around one system (Stanhopeinae) would bake in assumptions that break elsewhere.

**Project framing:** floral morphology <-> pollinator morphology, mechanical fit, in 3D.
NEW project — explicitly not built on `~/flower`. Architecture decision already taken:
**(c) hybrid** — physical trajectory for the single-visit showpiece, analytic placement map
driving the evolutionary loop, the two fitted to agree.

Every citation below was resolved against OpenAlex in-session. Items marked ⚠️ UNVERIFIED are
asserted from background knowledge and have NOT been confirmed — do not build on them.

---

## 1. Design constraints derived from the literature

These are conclusions, not preferences. Each one falsifies a simpler design.

**1.1 Syndromes must be EMERGENT, not an enum.**
Two heavyweight tests disagree on whether syndromes even predict pollinators:
Ollerton et al. 2009 `10.1093/aob/mcp031` (global test) vs Rosas-Guerrero et al. 2014
`10.1111/ele.12224` (417 species; found support, convergence driven by the _most effective_
pollinator). Hard-coding N syndrome categories assumes the answer to a live question. Encode
continuous traits; let syndromes fall out as clusters; then "do syndromes emerge?" becomes a
validation target instead of an assumption.

**1.2 Fitness must run through BOTH sexual functions.**
Seed-set-only fitness gets floral evolution systematically wrong; male function (pollen
export) is often the dominant selective force. Johnson & Harder 2023 `10.1098/rspb.2023.1148`
characterise the pollen-dispersal economy across **228 species**.

**1.3 Placement sites are FINITE, CONTESTED space.**
Santana et al. 2025 `10.1111/1365-2435.14736` — caged sunbirds (_Cinnyris chalybeus_) +
_Tritoniopsis antholyza_, quantum-dot-labelled pollen. Precise placement onto "small and
discrete areas of pollinators' bodies" produces **male–male competition**: later pollen
smothers or displaces earlier pollen, generating a **last-male advantage**. A placement site
is a limited resource with arrival-order effects, not a label.

**1.4 Packaging sets transfer efficiency.**
Johnson & Harder 2023: removal efficiency varies ~2x by dispersal unit — **<45% for solid
pollinia (orchids, milkweeds), >80% for granular monads or sectile pollinia**. The orchid
systems that motivated this project sit at the INEFFICIENT end.

**1.5 Placement is one step in a pipeline, not the mechanism.**
Minimal spine: advertisement -> visit -> pickup (dispensing economics) -> carriage (grooming,
decay, carryover) -> deposition into contested finite space -> post-pollination filters
(self-incompatibility, pollen-tube competition) -> fitness via both sexual functions.

**1.6 Sensory channels switch OFF, they are not all always active.**
Knudsen et al. 2004 `10.1111/j.1095-8339.2004.00329.x`: hummingbird flowers are widely assumed
scentless and **9 of 17 tested had no detectable odour** by GC-MS.

---

## 2. The enumeration

### 2.1 Reward

nectar · pollen-as-food · **floral oils** · **fragrance/perfume** · resin/wax · **brood site**
· heat/shelter (thermogenic) · **nothing (deception)**.

**Fragrance (euglossine) — the Stanhopeinae case.** Male orchid bees collect volatiles, store
them in specialized **hind-tibial pouches**, and release them during courtship display.
Hetherington-Rauth & Ramírez 2016 `10.1093/aob/mcw072` (_Gongora_, a Stanhopeinae genus);
Zimmermann, Ramírez & Eltz 2009 `10.1890/08-1858.1` (**chemical niche differentiation across
15 sympatric _Euglossa_**); Mitko et al. 2016 `10.1242/jeb.136754` (olfactory tuning).
⚠️ **Consequence: there is NO tube-depth-vs-proboscis-length mechanic in this system.** The bee
is scraping a surface, not drinking. Attraction is blend-matching in high dimensions.

**Oils.** Secreted by **elaiophores**, in two structurally distinct forms — trichome and
epithelial (Possobom & Machado 2017 `10.1590/0102-33062017abb0088`). _Krameria_ evolved
epithelial elaiophores on lateral petals convergently with the Malpighiaceae calyx gland
(Carneiro et al. 2015 `10.1016/j.flora.2015.06.002`). Classic reward taxonomy: Simpson & Neff
1981 `10.2307/2398800`.
**Key number:** Renner & Schaefer 2010 `10.1098/rstb.2009.0229` — oil flowers evolved **>=28
times** and floral oil was **lost 36–40 times**. Loss rate exceeds gain rate.

**Deception is not one class.** Scopece et al. 2007 `10.1111/j.1558-5646.2007.00231.x` (249
cites) compared **sexually deceptive vs food-deceptive** Mediterranean orchids by experimental
cross and found different isolation architecture. Sub-type changes which barrier does the work.

- _Sexual deception:_ Peakall et al. 2010 `10.1111/j.1469-8137.2010.03308.x` (_Chiloglottis_);
  Bohman et al. 2014 `10.1111/nph.12800` (**pyrazines acting as both wasp sex pheromone and
  orchid semiochemical**); Vereecken et al. 2012 `10.1098/rspb.2012.1804` (pre-adaptation).
- ⭐ **Vereecken, Cozzolino & Schiestl 2010 `10.1186/1471-2148-10-103` — hybrid floral scent
  NOVELTY drives pollinator shift.** _Ophrys arachnitiformis_ x _O. lupercalis_ hybrids emit a
  novel blend attracting a _different_ pollinator than either parent. This is the project's
  original "hybrids attract different pollinators" mechanic, already documented. Hybridisation
  is GENERATIVE of new interactions, not just a leak.
- _Brood-site deception:_ carrion/dung mimicry — Jürgens et al. 2006
  `10.1111/j.1469-8137.2006.01845.x` (fetid stapeliads). Not yet explored in depth.

### 2.2 Advertisement channel

visual (colour, pattern, UV guides, structural colour) · olfactory (blend chemistry) ·
**acoustic** · **electric** · thermal · humidity · tactile.

**Acoustic — TWO opposing mechanisms, both confirmed.**

- _Retroreflection:_ Simon et al. 2021 `10.1371/journal.pcbi.1009706` — concave echoic floral
  parts act as **acoustic retroreflectors**; acoustic traits compared across syndromes and
  classified from echoes by CNN (so a usable dataset exists).
- _Contrast by absorption:_ Simon et al. 2023 `10.1242/jeb.245263` — the cactus _Espostoa
  frutescens_ has an **ultrasound-ABSORBING** hairy cephalium; conspicuousness by suppressing
  background rather than boosting target.
- _Counter-adaptation, same physics:_ moth thoracic scales as sound-absorbing stealth
  `10.1098/rsif.2019.0692`; wingtip decoy echoes `10.1016/j.cub.2021.08.038`.

**Electric — real, and a transfer mechanism as well as a channel.**
Clarke, Morley & Robert 2017 `10.1007/s00359-017-1176-6` (aerial electroreception);
England & Robert 2024 `10.1098/rsif.2024.0156` — **Lepidoptera accumulate flight charge
generating >5 kV/m within millimetres of a flower**, sufficient for non-contact pollen
transfer; hoverfly field detection `10.1038/s41598-021-98371-4`; and bumblebee charge
**stimulates floral volatile emission** `10.1007/s00114-021-01740-2`.

### 2.3 Vector

bees · wasps · flies · beetles · butterflies · moths (settling vs hovering) · birds
(hummingbird, sunbird, honeyeater, flowerpiercer, passerine) · **bats** (Fleming et al. 2009
`10.1093/aob/mcp197`: 28 orders, 67 families, ~528 species) · non-flying mammals incl. rodents ·
lizards · ants · **wind** (Friedman & Barrett 2009 `10.1093/aob/mcp035`: >=10% of angiosperms) ·
water.

### 2.4 Contact mechanism — the core interface

| Mechanism                 | Note                                                              |
| ------------------------- | ----------------------------------------------------------------- |
| Passive dusting           | Incidental anther contact                                         |
| **Precision placement**   | Nototribic (dorsal) vs sternotribic (ventral)                     |
| **Pollinaria attachment** | Discrete packet glued to one site; low removal efficiency (1.4)   |
| Buzz / sonication         | Poricidal anthers; vibration as a matching problem                |
| Explosive / trigger       | _Catasetum_ fires its pollinarium; _Medicago_ tripping            |
| Lever                     | _Salvia_ staminal lever — five stamen types, Claßen-Bockhoff 2017 |
| Keel / piston             | Fabaceae                                                          |
| Trap / kettle             | Temporary imprisonment then timed release                         |
| Secondary presentation    | Pollen pre-deposited on style (Asteraceae, Campanulaceae)         |
| **Enantiostyly**          | Mirror-image left/right style deflection — placement laterality   |
| **Heterostyly**           | Reciprocal herkogamy (pin/thrum)                                  |
| Abiotic capture           | Aerodynamic interception; water transport                         |

### 2.5 Within-flower geometry (was missing from batch 1)

**Herkogamy** (anther–stigma spatial separation; heterostyly is its reciprocal special case) ·
**dichogamy** (protandry/protogyny) · **anther–stigma interference** (the conflict herkogamy
resolves) · **heteranthery** — division of labour between feeding and pollinating anthers, the
"pollen dilemma" (Oliveira et al. 2020 `10.3390/plants9121685`; Cassia fistula trimorphic
androecium `10.1093/aobpla/plab054`).

### 2.6 Mating system (was entirely absent from batch 1)

autogamy · cleistogamy · delayed selfing as reproductive assurance · **geitonogamy** (same-plant
different-flower transfer — the hidden cost of large displays) · mixed mating · apomixis ·
sexual systems (dioecy, monoecy, gynodioecy, andromonoecy) · **self-incompatibility**
(gametophytic, sporophytic, late-acting) · pollen:ovule ratio.
Without SI and geitonogamy the sim will self-pollinate everything and never diverge.

### 2.7 Isolation axes

pollinator identity (ethological) · **placement site (mechanical)** · timing (phenological,
incl. diurnal/nocturnal) · geography · post-pollination barriers.

- Armbruster's **pollination accuracy** is the quantitative framework: Armbruster, Shi & Huang
  2013 `10.1093/aob/mct187` names the three partitioning routes — pollinator species, _when_,
  and **sites of pollen placement**; generalised in Armbruster 2014 `10.1093/aobpla/plu003`.
- Cortis et al. 2008 `10.1093/aob/mcn219` — _Ophrys_ species sharing one pollinator but
  differing in **pollen placement on the insect's body**, isolated by a pre-mating MECHANICAL
  barrier. This is the project's core hypothesis, confirmed.
- Zhang et al. 2022 `10.3389/fpls.2022.908852` quantified **six** barriers in _Habenaria_;
  several act AFTER pollen arrives, so stopping at deposition overstates gene flow.
- Pérez-Barrales & Armbruster 2023 `10.1002/ajb2.16181` — _Linum_, incomplete partitioning.

### 2.8 Antagonists and cheats

nectar robbing (primary/secondary) · pollen theft · florivory · **interspecific pollen transfer
and stigma clogging**. Robbers bypass the placement mechanism entirely.

### 2.9 Community and temporal layer

phenological overlap · competition vs facilitation (magnet species) · pollen limitation ·
display size and inflorescence architecture · floral longevity · anthesis and stigma-receptivity
schedules.

- Competition, not pollinator shift, explained flower-colour divergence in Andean Solanaceae
  (Muchhala et al. 2014 `10.1111/evo.12441`) — build competition as a LIVE ALTERNATIVE, do not
  assume the shift narrative.
- Stebbins' most-effective-pollinator principle still being tested (Medel et al. 2018).
- Orchids are **primarily pollination-limited** (Tremblay et al. 2004
  `10.1111/j.1095-8312.2004.00400.x`, 755 cites) — a hard constraint on orchid fitness models.

### 2.10 Post-pollination

pollen tube competition · late-acting self-incompatibility · seed abortion · hybrid inviability.

---

## 3. Candidate test beds

| System                              | Why                                                                                                                                                 | Source                                                                            |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Merianieae** (Melastomataceae)    | ONE tribe spanning six syndromes — bee/buzz, hummingbird, flowerpiercer, passerine, bat, rodent; buzz framed as an "adaptive plateau" departed from | Dellinger et al. 2018 `10.1111/nph.15468`                                         |
| **Cymbidieae** (incl. Stanhopeinae) | 140 species / 65 genera multivariate floral-shape matrix; finds the OPPOSITE of expected stabilizing selection                                      | Liu, Bogarín, Pérez-Escobar, Pupulin & Karremans 2025 `10.1101/2025.07.25.666443` |
| **Bat guild, Caatinga**             | Pollen-placement strategies + mechanical fit at community level, 11 spp / 10 genera / 6 families — vertebrate validation case                       | Pontes, Machado & Domingos-Melo 2024 `10.1186/s40693-024-00133-9`                 |
| _Ophrys_                            | Shared pollinator, divergent placement, natural hybrids                                                                                             | Cortis 2008; Vereecken 2010                                                       |
| _Penstemon_                         | Mechanical aspects of insect->hummingbird transitions                                                                                               | Castellanos 2004                                                                  |

## 4. Calibration data sources

- **Lankester pollinaria collection** — 496 pollinaria, 312 species, 94 genera, Neotropical
  Cymbidieae emphasis, digitised with images, via EPIDENDRA (Pupulin & Karremans 2008).
- **Johnson & Harder 2023** pollen-fate economy, 228 species.
- **Simon et al. 2021** acoustic trait dataset (echo recordings + CNN classification).
- _Gongora_ scent chemistry; euglossine tibial fragrance profiles.
- Liu et al. 2025 Cymbidieae 140-species shape matrix.

## 5. Enumeration batch 3 — all verified 2026-07-31

### 5.1 ⚠️ LETHAL pollination — breaks a core modelling assumption

**The pollinator does not always survive the visit.** Suetsugu 2022 `10.1002/ppp3.10261`:
"**Female individuals of the genus _Arisaema_ are the only plants known to imprison their
pollinators permanently.**" Male inflorescences have an escape route; female ones do not, so
fungus gnats entering a female spathe die there. Vogel & Martens 2000
`10.1111/j.1095-8339.2000.tb01537.x` surveyed these **lethal kettle traps** and their fungus-gnat
pollinators. Suetsugu et al. (_A. urashima_) frame it as "the interplay of **lethal traps and
mutualistic nurseries**", and possible **sexual deception** is implicated in the luring.

**Design consequence:** visitor mortality must be a model term. Any formulation assuming a
visitor survives to carry pollen onward — i.e. every carryover / trapline / constancy mechanic —
is invalid for this class. Also note per-sex asymmetry: the trap's lethality depends on floral SEX.

### 5.2 Roles are contextual, not fixed types

- **A pollinator becomes a robber.** Ye et al. 2017 `10.1111/plb.12581` — pollinators of _Iris
  bulleyana_ **shift to nectar robbing when florivory occurs**. "Pollinator" and "antagonist" are
  states of the same individual, not species labels.
- **Nectar guides deter robbing.** Leonard et al. 2013 `10.1371/journal.pone.0055914` — a visual
  advertisement trait with an _anti-antagonist_ function. Signals are multi-purpose.
- **Nectar is manipulation, not just reward.** Nepi et al. 2018 `10.3389/fpls.2018.01063`
  ("From Food Reward to Partner Manipulation"); Stevenson 2019 `10.1007/s11101-019-09642-y`
  (FWCI 57) on the **paradox of insect-toxic secondary metabolites in nectar and pollen**;
  Slavković & Bendahmane 2023 `10.1002/cbdv.202201139` — secondary metabolites **bind insect
  neuronal receptors and manipulate pollinator behaviour**.
- **Visitor identity restructures the nectar microbiome.** Morris et al. 2020
  `10.1093/femsec/fiaa003`; Zemenick et al. 2018 `10.1002/ecs2.2459` — legitimate visitors vs
  robbers leave measurably different microbial communities, which then alter the nectar.
- General frame: Bronstein, Alarcón & Geber 2006 `10.1111/j.1469-8137.2006.01864.x` (536 cites)
  on mutualism evolution and cheating.

### 5.3 Buzz pollination — quantitative, and morphology→mechanics is measured

- Vallejo-Marín 2021 `10.1093/jxb/erab428` categorises bee vibrations by mode of production
  (thermogenic, flight, communication, defence, floral). Not all buzzes are pollination buzzes.
- ⭐ Nevard et al. 2021 `10.1038/s41598-021-93029-7` — **transmission of bee-like vibrations
  through flowers with contrasting stamen architectures**, focal vs non-focal anthers, four
  species. This is literally a measured morphology → mechanics transfer function.
- Vallejo-Marín et al. 2022 `10.1111/evo.14485` — **anther cones** (anthers bound by trichomes or
  bioadhesives into a joined cone) **increase pollen release**; evolved independently across
  families via different genetic mechanisms.
- Kemp & Vallejo-Marín 2021 `10.1002/ajb2.1680` — **pollen dispensing schedules**; poricidal
  anthers stagger release. _Solanum_ sect. Androceras gives three REPLICATE large/small-flower
  shifts — a built-in comparative control.
- Jankauski et al. 2022 `10.1038/s41598-022-16859-z` — directional forces and thorax kinematics
  measured in carpenter bees. ~10% of flowering plant species have poricidal anthers.
- Review: Vallejo-Marín & Russell 2023 `10.1093/aob/mcad189`.

### 5.4 Wind pollination shares the resonance mechanic

Timerman et al. 2014 `10.1098/rsif.2014.0866` — in _Plantago lanceolata_, **atmospheric
turbulence excites resonant vibrations in stamens**, releasing episodic bursts of pollen.
So buzz and wind pollination are the same physics (stamen natural frequency + forcing), differing
only in the forcing source. Strong argument for one shared vibration module, not two.

### 5.5 Hydrophily — rare, convergent, and geometrically different

Les 1988 `10.2307/2399370`: **true hydrophily occurs in only 18 angiosperm genera — 17 monocot,
12 marine; 13 of them dioecious.** Strongly associated with dioecy. Verduin et al. 1996
`10.3354/meps133307` documented in-situ submarine pollination in _Amphibolis antarctica_ with
**filiform (thread-like) pollen** adhering to stigmas — pollen is not a sphere here, so both the
search geometry (2D surface vs 3D water column) and the adhesion model differ. Du & Wang 2014
`10.1371/journal.pone.0115653` correlate life form, pollination mode and sexual system across
aquatic angiosperms.

### 5.6 Nursery pollination — a mutualism↔antagonism CONTINUUM, held by sanctions

- **"Private channel" hypothesis:** Svensson et al. 2010 `10.1111/j.1469-8137.2010.03227.x` —
  extreme specificity in _Breynia_–_Epicephala_ maintained by compounds only the partner detects.
  Generalises to euglossine and sexually-deceptive attraction.
- **Sanctions are what stabilise it:** Ibanez et al. 2009 `10.1186/1471-2148-9-261` — plant
  **chemical defence against developing larvae** as a partner-control mechanism, alongside
  **selective abortion of over-exploited fruits**. "Mutualisms are essentially reciprocal
  exploitation."
- **The mutualism label is contested:** Suchan et al. 2015 `10.1002/ece3.1544` shows
  _Trollius_–_Chiastocheta_ is **asymmetrical**, with costs/benefits varying by environment;
  Zhou et al. 2018 `10.1093/aob/mcy091` note _Silene stellata_–_Hadena ectypa_ is "largely
  considered **parasitic** due to severe seed predation."
- Others: fig–wasp stability, monoecious vs dioecious figs (Al-Beidh 2010); _Chamaerops
  humilis_–_Derelomus_ weevil `10.1093/aob/mcx177`; _Epicephala_ phenological tracking
  `10.1186/s12862-021-01889-4`.

### 5.7 Also surfaced

- **Intraspecific scent variation** — Delle-Vedove et al. 2017 `10.1093/aob/mcx055` (110 cites),
  review of 81 studies on within-species scent variation and its heritability. **Required for an
  evolutionary sim: without standing trait variance nothing can evolve.**
- **Floral bracts** — Song et al. 2024 `10.1111/brv.13060`, multifunctional non-floral organs
  subtending flowers, many independent origins. Advertisement is not confined to the flower.

---

## 6. Enumeration batch 4 — closing the open items

### 6.1 Ant pollination — rare for a MECHANISTIC reason

⭐ Beattie et al. 1984 `10.1002/j.1537-2197.1984.tb12527.x` (190 cites), _"Ant inhibition of pollen
function: a possible reason why ant pollination is rare"_: pollen exposed to ants even briefly shows
**reduced viability, reduced germination, shorter pollen tubes**, and produces lower seed set. The
proposed cause is that ants' nest-building and brood-rearing require **large antibiotic secretions**,
which also sterilise pollen. So ant pollination is rare because ants are chemically hostile to the
gamete — a hard constraint, not a preference.

- **Ants as interference:** Cembrowski et al. 2013 `10.1086/674101` — ants _and ant scent alone_
  reduce bumblebee pollen transfer. Junker et al. 2006 `10.1007/s11284-006-0306-3` — plants actively
  **repel ants during anthesis**.
- ⭐ **But ants can be recruited as a FILTER:** Gonzálvez et al. 2012 `10.1111/1365-2745.12006` —
  _Melastoma malabathricum_ emits ant attractants recruiting weaver ants (_Oecophylla smaragdina_)
  that **deter less-effective pollinators** while its effective carpenter-bee pollinators are
  unaffected, raising reproductive success. A plant enforcing pollinator specificity via a third party.
- Herrera et al. 1984 `10.1007/bf02232711` — ant nectar thievery. Domingos-Melo et al. 2017
  `10.1007/s11829-017-9499-3` — is ant pollination in _Ditassa_ stable?
- Scale check: Rader et al. 2015 `10.1073/pnas.1517092112` (FWCI 117) — **non-bee insects are
  important contributors to global crop pollination.** Do not build a bee-only model.

### 6.2 Brood-site deception — and two mimicry classes not previously listed

**Magnitude:** floral deception has evolved in **at least 7500 angiosperm species, two-thirds of
them orchids** (Jin et al. 2014 `10.1186/1471-2229-14-63`).

- **Aphid mimicry (NEW class).** _Epipactis veratrifolia_ — aphidophagous hoverflies **lay eggs on
  false brood sites** on the flowers. Jin et al. trace the origin "**from indirect defense to
  pollination**": a signal that began as an anti-herbivore recruit became a pollinator lure.
- **Fungal mimicry (NEW class).** _Dracula_ (Pleurothallidinae) mimics Agaricales **both chemically**
  (mushroom volatiles) **and morphologically** (labellum resembling gills).
- **Carrion / dung mimicry.** _Amorphophallus_, ~230 spp., carrion/faeces scents attracting
  copro-necrophagous beetles and flies — Claudel 2021 `10.1007/s11829-021-09865-x`, which warns
  that many "pollinator" records are assumptions rather than observations.
- **Oviposition deceit.** Borba 2001 `10.1006/anbo.2001.1434` — fly-pollinated _Pleurothallis_;
  females **laid eggs in the nectarless species only**, never in the rewarding ones.
- ⚠️ Ospina-M et al. 2024 `10.1007/s00606-024-01924-z` caution that "deception" in pleurothallids
  is an ASSUMPTION extrapolated from 17 of 44 genera; inconspicuous honest rewards may exist.
- **Weight the flies properly:** Raguso 2020 `10.1007/s13355-020-00668-9` (119 cites), _"Don't
  forget the flies"_ — Diptera is 125,000+ described species in 110 families.

### 6.3 Grooming / "safe sites" — NOT FOUND after 4 attempts; a better-supported alternative exists

The safe-site hypothesis did not surface in OpenAlex under any phrasing tried. **Do not build on it.**
However, the underlying question — _why does precision placement evolve?_ — has a well-cited answer
that is not grooming:

⭐ **Interspecific pollen transfer (IPT).** Moreira-Hernández & Muchhala 2019
`10.1146/annurev-ecolsys-110218-024804` (Annual Review, 147 cites): for co-flowering species sharing
pollinators, IPT **reduces female fitness via heterospecific pollen on stigmas AND male fitness via
pollen misplacement on visits to heterospecific flowers**, and this reproductive interference
"frequently selects for **reproductive character displacement** in floral traits." That is a direct,
quantitative selective driver for divergent placement — and it is _competition_-based, consistent
with Muchhala 2014 rather than with the pollinator-shift narrative.

⚠️ **Counter-intuitive theory result to respect:** Bochynek & Burd 2024 `10.1111/nph.19929` —
"Pollen loss is sometimes thought to favour greater pollen investment to compensate for the
inefficiency of transport. **Sex allocation theory, to the contrary, has consistently concluded that
postdispersal loss should have NO selective effect on investment in either sex function.**" So do not
model pollen loss as selecting for more pollen; that intuition is explicitly rejected.

Calibration bonus: Page et al. 2021 `10.1002/ajb2.1764` — meta-analysis of **single-visit pollination
effectiveness, 168 studies, 1564 measures, 240 plant species**.

### 6.4 _Stanhopea_ chute / _Coryanthes_ bucket — STILL UNVERIFIED after 3 attempts

OpenAlex does not surface the mechanism. The descriptive literature for these is mostly older and in
venues with thin indexing (Lankesteriana, Selbyana, Die Orchidee, Dressler's monographs). **Treat the
escape-trajectory mechanism as unconfirmed.** If the physical-trajectory half of the (c) architecture
is to lean on it, verify from a primary source first — this is a claim I have repeated twice and
never confirmed.

---

## 7. Enumeration batch 5 — THE RECEIVER SIDE (the symmetric half I had omitted)

Batches 1–4 enumerated the flower exhaustively and treated the pollinator as a body with
dimensions. For a project whose thesis is _morphology ↔ morphology_ that is a structural
omission. This batch covers the animal, the genetics, and the measurement pipeline.

### 7.1 Colour must be modelled in the RECEIVER'S colour space — and AVOIDANCE is a driver

⭐ Lunau et al. 2011 `10.1242/jeb.052688` (245 cites): _"Avoidance of achromatic colours by bees
provides a **private niche** for hummingbirds."_ **Hummingbirds have no innate preference for red.**
Both red AND white hummingbird flowers differ from bee flowers in **UV reflection**. So the
folk rule "red = bird-pollinated" has the causality backwards: the signal is tuned to be
UNATTRACTIVE TO BEES, opening a private channel.

- Camargo et al. 2018 `10.1111/nph.15594` — community-level test of the **bee avoidance
  hypothesis**: floral signals "may also evolve to **avoid** less efficient pollinators and
  antagonistic flower visitors."
- ⚠️ Kevan, Chittka & Dyer 2001 `10.1242/jeb.204.14.2571` — UV is **not** privileged; "in most
  cases no more important than blue, green or red." Do not over-weight UV.
- **Natural experiments available:** Shrestha et al. 2013 `10.1111/1365-2745.12185` — flower
  colour across a Himalayan altitudinal gradient (107 spp.), Hymenoptera declining and
  Diptera/Lepidoptera rising with elevation. Shrestha et al. 2016 `10.1111/plb.12456` —
  **Macquarie Island, "a world without birds and bees"**, an exclusively dipteran fauna with
  cream-green flowers. A ready-made control condition.
- **TOOL:** `pavo 2` (Maia et al. 2019 `10.1111/2041-210x.13174`, 548 cites, FWCI 77) — R package
  for spectral + spatial colour analysis including visual models. Use this rather than rolling our own.
- McCarthy et al. 2015 `10.1093/aob/mcv048` analysed _Nicotiana_ colour under **both bee and
  hummingbird perception models**, including polyploid/hybrid effects.

**Design consequence:** RGB is meaningless here. Colour is a position in a taxon-specific
photoreceptor space, and selection acts to _repel_ the wrong receivers as much as to attract the
right ones.

### 7.2 Pollinator body morphology — hair, grip, and slip

- ⭐ Li et al. 2026 `10.3390/insects17020153` — measured **hair length, hair density, and pollen
  load across four body regions (head, thorax, abdomen, legs)** for four wild pollinators, and
  linked them to **pollen deposition and carrying efficiency**. This is the animal-side
  morphometric dataset the project needs.
- ⭐ Pattrick 2017 (Cambridge thesis) `10.17863/cam.22834`, _"Grip, slip, petals, and
  pollinators"_ — bee attachment devices are of two kinds, **claws/spines and adhesive pads**, and
  claw performance depends on **body size, claw geometry, and surface roughness**. So **petal
  surface texture ↔ bee attachment** is a genuine mechanical interface, not decoration.
- Radchenko et al. 2025 `10.1002/ece3.72544` — _Lysimachia_–_Macropis_: "a model describing the
  process of collecting flower oil by bees **based on the laws of mechanics**." A worked mechanical
  model of reward collection.
- Supporting material science: fibrillar/hair interfaces `10.3762/bjnano.15.55`; insect
  hydrophobicity `10.3390/insects14010042`.

**Design consequence:** the animal needs per-body-region hair density/length and an attachment
model. This is the missing half of the placement map — pollen sticks (or doesn't) as a function of
BOTH surfaces.

### 7.3 Genetic architecture — simple, and that is why syndromes repeat

- ⭐ Wessinger, Hileman & Rausher 2014 `10.1098/rstb.2013.0349` — **major QTL** underlying
  pollination-syndrome divergence in _Penstemon_, and the headline number: in western North
  America the **hummingbird syndrome has evolved more than 100 times**, generally out of
  insect-pollinated lineages.
- ⭐ Kostyun et al. 2019 `10.1111/nph.15844` — _"A **simple genetic architecture and low
  constraint** allow rapid floral evolution"_ (_Jaltomata_); **pleiotropy** proposed as a main
  driver of repeated convergent syndrome transitions.
- Amrad et al. 2016 `10.1016/j.cub.2016.10.023` — **gain and loss of floral scent via changes in
  STRUCTURAL genes** during pollinator-mediated speciation (_Petunia_).
- Yuan 2018 `10.1111/nph.15560` — _Mimulus_ as evo-devo model; corolla tube formation and the
  molecular basis of pollinator-shift traits.
- Widmer, Lexer & Cozzolino 2008 `10.1038/hdy.2008.69` — reproductive isolation in plants.

**Design consequence:** model floral traits as **few-locus / major-effect with pleiotropy**, not
infinitesimal polygenic. And >100 independent origins makes **repeatability an explicit validation
target**: run the sim many times and syndromes should recur.

### 7.4 3D geometric morphometrics — the measurement pipeline already exists

- ⭐ van der Niet, Zollikofer, Ponce de León, Johnson & Linder 2010
  `10.1016/j.tplants.2010.05.005` — **"Three-dimensional geometric morphometrics for studying
  floral shape variation"**: micro-CT scanning combined with GM. This is precisely the project's
  core data type, with an established method.
- Wang et al. 2015 `10.3389/fpls.2015.00724` — μCT + GM on an actinomorphic × zygomorphic hybrid line.
- ⚠️ **Symmetry needs care:** Savriama & Klingenberg 2011 `10.1186/1471-2148-11-280` give GM
  methods for **any** symmetry type, not just bilateral — flowers are frequently rotationally
  symmetric. Step-by-step floral protocol: Savriama 2018 `10.3389/fpls.2018.01433`.
- Berger et al. 2017 `10.1186/s12870-017-1152-x` — GM detects shape change after _CYCLOIDEA_
  knockdown, linking genotype to quantified shape.
- ⚠️ Bateman & Rudall 2006 `10.1093/aob/mcl191` — **flowers vary systematically WITHIN a single
  inflorescence** (labellum and spur dimensions regress on position along the raceme in European
  orchids). "The flower" is not one phenotype; position is a covariate.

---

## 8. Enumeration batch 6 — the animal as an agent, plus time, development and architecture

### 8.1 ⭐ THE GROOMING QUESTION IS RESOLVED — and it was never about grooming

Closed as a null in batch 4 after four failed searches. The nutrition literature answers it:

**Pollen is larval protein; nectar is adult fuel; and bees forage for them on DIFFERENT PLANT
SPECIES.** Filipiak 2018 `10.3390/insects9030085` / 2019 `10.1111/1365-2664.13383`: "adult food,
mainly composed of energy-rich nectar, **differs from larval food, mainly composed of pollen**,
and adult bees **forage on different plant species for nectar and pollen**." Wright, Nicolson &
Shafir 2017 `10.1146/annurev-ento-020117-043423` (364 cites): bees regulate intake around
**specific macronutrient proportions**, individually and at colony level.

So pollen removal by bees is **harvesting, not incidental cargo** — which is exactly the plant's
"pollen dilemma" (heteranthery, §2.5) seen from the animal's side.

⚠️ **Design consequence — a single "visit" model is WRONG.** There are at least two foraging
modes (nectar-seeking and pollen-collecting) with different target sets, different body-contact
patterns, and different consequences for the plant. Also: Dharampal et al. 2019
`10.1098/rspb.2018.2894` — **pollen-borne microbes shape bee fitness**; microbe-deficient pollen
reduces larval performance, so the provision is partly a microbial resource.

### 8.2 Foraging currency is an explicit modelling CHOICE, and the optimum is mechanical

- ⭐ Charlton & Houston 2010 `10.1371/journal.pone.0012186`, _"What currency do bumble bees
  maximize?"_ — **net rate of energetic intake vs efficiency (gain/expenditure)**. Honey bees are
  better predicted by efficiency; for bumble bees both fit equally well. **We must pick one and
  say so.**
- ⭐ Pattrick et al. 2020 `10.1098/rsif.2019.0632` — **the mechanics of nectar offloading**. More
  concentrated nectar is more rewarding but **more viscous and slower to drink**, so there is a
  mechanically-determined optimum concentration; and for social bees, offloading at the nest is a
  second constraint. A physical optimum, not a preference.
- Stabentheiner & Kovac 2016 `10.1038/srep28339` — honeybees maintain **persistent endothermy
  through the foraging cycle**, which is extremely costly; intake maximisation and energetic
  optimisation are in direct conflict.
- Rands & Whitney 2008 `10.1371/journal.pone.0002007` — **heat as a floral reward** for
  ectothermic central-place foragers, with a model.
- Bateson 2002 `10.1079/pns2002181` — **risk-sensitive** foraging: risk-averse or risk-prone
  depending on energetic state.

### 8.3 Cognition — constancy is reward-dependent, and fast learning has a COST

- Grüter et al. 2011 `10.1242/jeb.050583` — flower constancy **depends on ecologically realistic
  rewards**; earlier "constancy is independent of reward" findings were artefacts of using large
  reward volumes. Constancy is a state, not a fixed trait.
- ⭐ Evans, Smith & Raine 2017 `10.1038/s41598-017-00389-0` — **fast learning in free-foraging
  bumble bees is NEGATIVELY correlated with lifetime resource collection.** A real cognitive
  trade-off, and a gift for a sim: better learners are not simply better.
- ⚠️ Amaya-Márquez 2009 — "there is **no general theory** that can explain all kinds of flower
  constancy." Do not implement one mechanism as if settled.
- Riffell & Alarcón 2013 `10.1371/journal.pone.0072809` — **multimodal** signal weighting
  (olfactory vs visual) in _Manduca sexta_ foraging decisions.
- Framing: Mehlhorn et al. 2015 `10.1037/dec0000033` — the **exploration–exploitation trade-off**,
  whose canonical example is literally "keep feeding from this patch of flowers or fly to another."

### 8.4 Spatial genetics — correlated paternity, and the kernel depends on the VECTOR

- Dick, Etchelecu & Austerlitz 2003 `10.1046/j.1365-294x.2003.01760.x` (340 cites) — in fragmented
  Amazonian forest, **African honeybees moved pollen up to 3.2 km** between pasture trees.
  Fragmentation _increased_ dispersal distance by changing which pollinator dominated. **The
  dispersal kernel is a property of the vector, not the plant.**
- ⭐ Hardy et al. 2004 `10.1534/genetics.104.027714` — **correlated paternity** within and among
  sibships. A single pollinator's visit sequence makes siring non-independent; seeds in a fruit
  are not independent draws.
- Methods/scale: Nathan et al. 2003 `10.1034/j.1600-0706.2003.12146.x` (497 cites) on estimating
  long-distance dispersal; Robledo-Arnuncio & Gil 2004 `10.1038/sj.hdy.6800542` total-exclusion
  paternity; Gerber et al. 2014 `10.1371/journal.pone.0085130` oak gene flow.

### 8.5 Diurnal dynamics — the petal has its own clock

- ⭐ Terry et al. 2019 `10.3390/genes10110860` — petunia circadian clock profiled in leaves AND
  petals across 13 clock genes: **leaves show preferential DAY expression, petals tend to NIGHT
  expression.** The advertising organ is on a different phase from the rest of the plant.
- Powers et al. 2020 `10.3389/fpls.2020.01116` — fine-scale scent timing in Hawaiian _Schiedea_;
  synchrony with pollinator activity **varies among compounds depending on their function**. The
  blend's composition changes through the night, not just its intensity.
- Orellana-Vera et al. 2025 `10.1186/s12862-025-02388-6` — ivory palm _Phytelephas aequatorialis_:
  diel patterns of anthesis, scent and visits compared between **male (rewarding) and female
  (deceptive)** inflorescences of a thermogenic dioecious species.

### 8.6 Abiotic modulation — warming changes the BLEND, and pollination switches the signal off

- ⭐ Farré-Armengol et al. 2014 `10.1111/gcb.12628` — **"Changes in floral bouquets from
  compound-specific responses to increasing temperatures."** Emissions rise to an optimum then
  fall, and **different compounds respond differently**, so warming distorts the _composition_ of
  the signal, not merely its strength. For a blend-matching attraction model this is a direct
  perturbation channel.
- ⭐ Rodriguez-Saona et al. 2011 `10.1093/aob/mcr077` — blueberry floral volatiles vary with
  **pollination status**, cultivar, time of day and flower part: **bee visitation falls after
  pollination via reduced volatile emission.** The flower switches its advertisement off once
  served — a feedback loop absent from every model discussed so far.
- ⭐ Dahake et al. 2022 `10.1038/s41467-022-35353-8` (_Nature Communications_) — **floral humidity
  is a SIGNAL, not merely a cue**, in _Datura wrightii_/_Manduca sexta_; humidity gradients ~10×
  greater than previously reported elsewhere. Confirms the humidity channel flagged in §2.2.

### 8.7 Floral development — ONE gene family couples symmetry, orientation AND nectar guides

⭐ Yang et al. 2023 `10.1093/plcell/koad115` (_The Plant Cell_): **"CYCLOIDEA-like genes control
floral symmetry, floral orientation, and nectar guide patterning."** Actinomorphic flowers orient
vertically and carry symmetric guides; zygomorphic flowers face horizontally with asymmetric
guides. **These three traits are pleiotropically coupled, not independent dials.**

⚠️ **Design consequence:** the trait space is CONSTRAINED. A sim that lets symmetry, orientation
and nectar-guide pattern vary independently will explore regions development cannot reach — the
morphospace-vacancy problem, inside our own model.

- CYC/TCP background: Howarth et al. 2011 `10.1093/aob/mcr049`; Berger et al. 2016
  `10.1186/s13227-016-0045-7`; Gao et al. 2008 `10.1007/s00427-008-0227-y`.
- ⚠️ Zhou et al. 2008 `10.1111/j.1469-8137.2008.02384.x` — in _Bournea_, symmetry **changes during
  development**, starting zygomorphic and ending actinomorphic at anthesis. Symmetry is a
  trajectory, not a static label.
- Berger et al. 2017 `10.1186/s12870-017-1152-x` closes the loop: GM quantifies the shape change
  from a _CYCLOIDEA_ knockdown — genotype → measured 3D shape.

### 8.8 Inflorescence architecture — the bridge to procedural generation

⭐ Harder & **Prusinkiewicz** 2012 `10.1093/aob/mcs252`, _"The interplay between inflorescence
development and function as the crucible of architectural diversity"_: an inflorescence's
reproductive contribution "depends primarily on the **three-dimensional arrangement of the floral
canopy and its dynamics during its flowering period**", resting on a branching scaffold "produced
by **developmental algorithms that are genetically specified**." Prusinkiewicz is the
algorithmic-botany/L-system author — **this is the direct bridge from this project to procedural
generation and to the agrigen/FSPM thread.**

- ⭐ Jersáková & Johnson 2007 `10.1111/j.1365-2435.2007.01256.x` — **protandry promotes male
  success** in a moth-pollinated orchid because pollinators forage **upward**, from older
  female-phase flowers to younger male-phase ones, on vertical inflorescences. **Movement
  DIRECTION on the inflorescence is the mechanism that limits geitonogamy.**
- Wang et al. 2014 `10.1371/journal.pone.0095381` — altering **floral orientation within an
  inflorescence** changes pollinator behaviour and pollination efficiency (_Corydalis sheareri_);
  horizontal presentation improves recognition and precision.
- Galloway et al. 2002 `10.1086/324556` — display size × dichogamy → geitonogamy in _Campanula_.
- Huang et al. 2006 `10.1111/j.1469-8137.2006.01766.x` — pollinator response to female vs male
  display size in monoecious _Sagittaria_.
- Howard & Barrows 2014 `10.1186/1471-2148-14-144` — self-pollination rate vs display size in
  milkweed, **partitioned by visitor taxon**.

---

## 9. Open / unverified — FINAL STATUS

**Still genuinely open after four batches:** (a) grooming / safe sites — searched out, superseded by
IPT as the selective explanation; (b) _Stanhopea_/_Coryanthes_ escape trajectory — needs a primary
source outside OpenAlex.
**Everything else listed as open in batches 1–3 is now closed.** The historical table below is kept
as a record of what was open when, not as current status.

> **Resolved in batch 3** (rows below are stale for these): trap/kettle flowers, thermogenesis
> (partly — via _Arisaema_/aroid literature), buzz biomechanics, nectar chemistry + microbes,
> nectar robbing, hydrophily, wind vibration. **Still genuinely open:** grooming/safe-sites,
> ant pollination, _Stanhopea_/_Coryanthes_ escape trajectory, brood-site deception in depth.

| Item                                                                                     | State                                                                                                                                                                                    |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Grooming / "safe sites"**                                                              | ⚠️ UNVERIFIED after 2 failed queries. Load-bearing: it is the candidate _explanation_ for why precision placement exists. Likely framed as pollen _fates_ — check Johnson & Harder 2023. |
| Nursery pollination (fig–wasp, yucca–moth, _Glochidion_–_Epicephala_, _Silene_–_Hadena_) | ⚠️ Asserted, not yet verified. Distinct economics: pollinator's offspring eat the seeds.                                                                                                 |
| Trap/kettle flowers (_Aristolochia_, _Arum_, _Ceropegia_)                                | Not yet enumerated                                                                                                                                                                       |
| Thermogenesis                                                                            | Not yet enumerated                                                                                                                                                                       |
| Buzz biomechanics (frequency/amplitude matching)                                         | Not yet enumerated                                                                                                                                                                       |
| Nectar chemistry + nectar microbes                                                       | Not yet enumerated                                                                                                                                                                       |
| Nectar robbing                                                                           | Not yet enumerated                                                                                                                                                                       |
| Wind aerodynamics in detail                                                              | Not yet enumerated                                                                                                                                                                       |
| Hydrophily (surface vs submerged)                                                        | Not yet enumerated                                                                                                                                                                       |
| Ant pollination                                                                          | Not yet enumerated                                                                                                                                                                       |
| _Stanhopea_ chute / _Coryanthes_ bucket escape-trajectory mechanism                      | ⚠️ UNVERIFIED. If real, contact site is set by a constrained escape path, strengthening the physical-trajectory half of the (c) architecture.                                            |
