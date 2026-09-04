/*
 * #60 — what happens to a minority lineage after a generation at k = K.
 *
 * Extracted so it can be tested without running a sweep, for the reason #59
 * recorded the hard way: logic that lives only inside a runner gets a second,
 * drifting copy the moment anything else needs it.
 *
 * ⚠️⚠️ `k` IS A TRACER QUANTITY. It is nMin over the PURE lineage labels
 * (rare-floor.js:157), and label() returns -1 for anything strictly between 0
 * and 1 (:70), so a hybrid is counted in NEITHER lineage. A minority plant whose
 * offspring are all hybrids therefore reads as EXTINCTION while her genes are
 * still in the population. Measured across #58/#59's archives, that route is
 * 0.0-7.9% of exits from k=1, rising with cost.
 *
 * Hence the `inclusive` flag: it changes ONLY the outcome rule, never which
 * generations qualify, so the conditioning set is held fixed and any difference
 * between the two readings is the CONVENTION rather than the sample.
 *
 *   PURE       a lineage is alive while it has pure-labelled plants
 *   INCLUSIVE  a lineage is alive while it has pure plants OR hybrids, and its
 *              count is nMin + nh
 *
 * ⚠️ The two answer DIFFERENT QUESTIONS and are not interchangeable. PURE asks
 * whether the lineage persists as a distinguishable entity — which is what
 * coexistence means, and under which absorption into hybrids is a FAILURE.
 * INCLUSIVE asks whether her genes persist at all, which fusion also satisfies.
 */

/* #56 measured per-capita fitness 0.000 / 0.734 / 1.646 at k = 1 / 2 / 3, so
 * k >= 3 is where the floor stops binding. */
const ESCAPE = 3;

/*
 * Classify the event at rows[i], looking ahead at most W generations.
 *
 *   RECOVER   the minority reaches k >= ESCAPE while still alive
 *   EXIT      the minority reaches 0 without having recovered first
 *   SURVIVE   still alive at i+W, never reached the escape threshold
 *   CENSORED  the run ended before i+W with neither resolved — genuinely
 *             unknown, and EXCLUDED from the statistics rather than guessed
 *
 * ⚠️ Which side is the minority is fixed at row i and NOT re-derived per row. A
 * lineage that recovers past its rival is still the same lineage; re-deriving
 * "minority" each generation would silently swap sides mid-episode and score a
 * recovery as someone else's decline.
 */
function classify(rows, i, W, inclusive) {
  const r0 = rows[i];
  const minorIs0 = r0.n0 < r0.n1;
  const last = Math.min(i + W, rows.length - 1);
  for (let j = i + 1; j <= last; j++) {
    const r = rows[j];
    const pure = minorIs0 ? r.n0 : r.n1;
    const n = inclusive ? pure + r.nh : pure;
    if (n >= ESCAPE) return "RECOVER";
    if (n === 0) return "EXIT";
  }
  return i + W <= rows.length - 1 ? "SURVIVE" : "CENSORED";
}

module.exports = { classify, ESCAPE };
