/*
 * A claim is what survives its gates.
 *
 * ⚠️⚠️ WHY THIS MODULE EXISTS. Four experiments in this repository computed a
 * discriminating control, PRINTED it, and then never consulted it on the branch
 * that needed it:
 *
 *   experiments/selfing.js            the two pre-registered gates were read only
 *                                     inside the "effect not established" arm, so
 *                                     a future POSITIVE reached the ✅ text having
 *                                     met neither.
 *   experiments/reachability.js       the anchor printed "every verdict below is
 *                                     meaningless" and then printed them.
 *   experiments/two-pollinator-…js    the random-mating null appeared as a
 *                                     footnote INSIDE the ✅ string.
 *   experiments/secondary-contact.js  the positive branch said "check whether the
 *                                     null holds" with the null already in scope.
 *
 * In every case the control observes its referent perfectly well. The defect is
 * that it is NOT ON THE PATH THAT NEEDS IT: it can only caveat a result that has
 * already failed, and can never block one that succeeded. A control wired solely
 * to the negative path is not a control, because the branch it exists to stop is
 * the one branch that does not run it.
 *
 * The fix is structural rather than careful: the positive text is not reachable
 * except by calling `claim()`, and `claim()` cannot return it while any gate is
 * unmet. Remembering to check is what failed four times, so there is nothing
 * here left to remember.
 *
 * ⚠️ MISSING DATA IS A FAILED GATE; A MISSING GATE IS A BUG. `ok: null` — the
 * control did not fit, so it cannot license anything — fails closed. `ok`
 * ABSENT throws, because an absent key means the caller mis-wired the gate, and
 * silently passing a gate nobody supplied is the exact failure this module
 * exists to make impossible.
 */

/**
 * @param {{gates: {name: string, ok: boolean|null, failText: string}[],
 *          positive: string, heading?: string}} spec
 * @returns {{pass: boolean, text: string, failed: string[]}}
 */
function claim({ gates, positive, heading }) {
  if (!Array.isArray(gates))
    throw new Error(
      "claim() needs a gates array — an unguarded claim is a bug",
    );
  if (typeof positive !== "string" || !positive)
    throw new Error("claim() needs the positive text it is guarding");

  for (const g of gates) {
    if (!g || typeof g.name !== "string" || !g.name)
      throw new Error("every gate needs a name");
    if (!("ok" in g))
      throw new Error(
        `gate "${g.name}" has no \`ok\` — a gate nobody evaluated cannot pass`,
      );
    if (g.ok !== true && g.ok !== false && g.ok !== null)
      throw new Error(
        `gate "${g.name}" has ok=${JSON.stringify(g.ok)}; must be true, false or null`,
      );
    if (typeof g.failText !== "string" || !g.failText)
      throw new Error(`gate "${g.name}" needs failText`);
  }

  /* strict !== true, so a null — the control did not fit — fails closed */
  const failed = gates.filter((g) => g.ok !== true);
  if (!failed.length) return { pass: true, text: positive, failed: [] };

  const head =
    heading ??
    `  ⛔ THE CLAIM IS NOT LICENSED — ${failed.length} of ${gates.length} gate(s) unmet.`;
  return {
    pass: false,
    failed: failed.map((g) => g.name),
    text:
      head +
      "\n" +
      failed
        .map(
          (g) =>
            `\n  ⛔ ${g.name}${g.ok === null ? " (did not fit — fails closed)" : ""}:\n` +
            g.failText.replace(/^/gm, "     "),
        )
        .join("\n"),
  };
}

/** One line per gate, met or not, for printing beside the verdict. */
function gateReport(gates) {
  return gates
    .map(
      (g) =>
        "  " +
        /* pad AFTER appending the separator, so a name at or past the column
         * width still gets whitespace instead of butting against the status */
        (g.name + "  ").padEnd(44) +
        (g.ok === true
          ? "met"
          : g.ok === null
            ? "⚠️ DID NOT FIT — fails closed"
            : "⚠️ UNMET"),
    )
    .join("\n");
}

module.exports = { claim, gateReport };
