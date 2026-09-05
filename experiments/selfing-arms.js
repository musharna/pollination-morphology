/*
 * THE ONE PLACE AN ARM NAME BECOMES A SELFING CONFIG. Returns null for arms that
 * do not self.
 *
 * ⚠️⚠️ THIS FILE EXISTS BECAUSE C10 CRIED WOLF TWICE, BOTH TIMES ON CORRECT
 * CELLS. The fact "this arm selfs" used to be derived in two places: in
 * rare-floor.js's replicate(), from the arm string, and again in the C10
 * control, by pattern-matching the same string against a list of name shapes.
 * Two derivations of one truth drift the moment a new arm name is coined —
 * which is exactly what happened, twice. #58 added the R-rate arms and C10
 * failed all four while they selfed at the rates asked; #59 added the R*c* cost
 * arms and the widened predicate `/^R\d+$/` failed all four again.
 *
 * Widening the pattern a third time would be a TRIPWIRE REMOVAL: the duplicate
 * derivation survives and the next naming dimension re-trips it — a hypothetical
 * "R200c25n" defeats the old pattern AND the obvious widening. So the
 * duplication itself is removed. This is the #43 lesson the repo has already
 * learned twice for statistics, applied to a CONTROL: the control now asks this
 * function instead of re-reading the name, and it lives in its own module so a
 * test can reach it without running a sweep.
 *
 * Naming: "R<n>" means rate = n/100, so R25 is 0.25 and R200 is 2.0; an optional
 * "c<n>" means cost = n/100, so R200c95 is rate 2.0 with 95% inbreeding
 * depression; then EITHER one shape letter — "d" is #62's DOSE-DEPENDENT floor,
 * "r" is #63's RESIDUALISED floor clipped at zero, "s" is the same residual
 * SHIFTED instead of clipped — OR "q<n>", #64's COVERAGE floor, meaning the flat
 * floor withheld at random from n/100 of plants, so R200q69 is rate 2.0 handed
 * to a random 31%; a trailing "n" is `ancNull`. Order is fixed:
 * R<rate>[c<cost>][d|r|s|q<cover>][n].
 *
 * ⚠️ SHAPE AND COVERAGE ARE MUTUALLY EXCLUSIVE BY CONSTRUCTION — the regex
 * alternates between them, so a name can carry at most one. "R200dr" names two
 * floors and must return null rather than silently picking one, and so must
 * "R200dq50" and "R200q50r". That is the property the near-miss tests hold.
 *
 * ⚠️ "d" WAS THE THIRD NAMING DIMENSION THIS COMMENT PREDICTED, "r"/"s" were the
 * fourth, and "q" is the fifth. The prediction has now held in the useful
 * direction three times: because the simulation and the C10 control ask THIS
 * function instead of re-reading the name, each addition required changing one
 * regex and nothing else — where the two dimensions before this file existed
 * each silently broke a control. tests/rare-floor.test.js asserts the suffixes
 * at this seam, and near-misses ("R200dd", "R200nd", "R200dc25", "R200dr",
 * "R200rs", "R200sc25", "R200dq50", "R200q50r", "R200q", "R200qq50") must still
 * return null.
 *
 * ⚠️ "q" IS THE FIRST SUFFIX THAT CARRIES A NUMBER RATHER THAN BEING ONE, which
 * is why it is an alternation branch and not another optional letter: written as
 * `([drs]?)(?:q(\d+))?` the two groups would be independently optional and
 * "R200dq50" would parse as a dose floor that also has a coverage, i.e. two
 * floors, silently.
 *
 * `rate` is a maternal weight FLOOR of rate x mean(received), applied to every
 * plant on identical terms (sim/ibm.js:670-701), so a plant nobody visited
 * reproduces almost entirely by selfing and a well-visited one barely does.
 *
 * `cost` is inbreeding depression: a selfed offspring fails to establish with
 * this probability (sim/ibm.js:683).
 *
 * ⚠️ #58 ran `cost: 0` throughout — the most generous possible case, where a
 * selfed offspring always establishes — so every rescue it measured is an UPPER
 * bound. #59 is the axis that takes that back.
 *
 * ⚠️⚠️ COST IS NOT A FECUNDITY PENALTY. With demography off the recruitment loop
 * runs `while (next.length < target)` and a dead selfed seed only makes the loop
 * DRAW ANOTHER MOTHER (sim/ibm.js:1941 returns false; the caller does
 * `failed++; continue`). The slot is not lost — it is handed to whoever is drawn
 * next, which is whoever the visit-weighted distribution favours. So cost is a
 * COMPETITIVE penalty on selfers, not a demographic one, and it bites hardest on
 * exactly the mate-limited plants selfing was rescuing. rare-floor.js records
 * recruits/unmated per row so this is measured rather than assumed.
 *
 * ⚠️ `ancNull` is the MECHANICAL-NULL control for the tracer: a selfed offspring
 * normally inherits the mother's `anc` UNAVERAGED, which inflates ancestry
 * variance and therefore HELD by construction. #58 measured it and found it is
 * NOT a clean null — it re-labels ~94% of plant-generations as hybrids.
 */
function selfingFor(arm) {
  if (arm === "S") return { rate: 0.5, cost: 0 };
  if (arm === "Sn") return { rate: 0.5, cost: 0, ancNull: true };
  const rm = /^R(\d+)(?:c(\d+))?(?:([drs])|q(\d+))?(n?)$/.exec(arm);
  if (!rm) return null;
  /* a coverage above 100% is not a stronger treatment, it is a typo */
  if (rm[4] !== undefined && Number(rm[4]) > 100) return null;
  return {
    rate: Number(rm[1]) / 100,
    cost: rm[2] === undefined ? 0 : Number(rm[2]) / 100,
    ...(rm[3] === "d" ? { dose: true } : {}),
    ...(rm[3] === "r" ? { resid: "clip" } : {}),
    ...(rm[3] === "s" ? { resid: "shift" } : {}),
    ...(rm[4] === undefined ? {} : { cover: Number(rm[4]) / 100 }),
    ...(rm[5] === "n" ? { ancNull: true } : {}),
  };
}

module.exports = { selfingFor };
