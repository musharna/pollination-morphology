/*
 * #61 — the conditioning-set builder, extracted so it can be tested without
 * running a sweep. #60 extracted its outcome classifier for the same reason and
 * #43 is the incident that made single-sourcing non-negotiable here.
 *
 * TWO TRAPS LIVE IN THIS FUNCTION, and both have already been hit in this arc:
 *
 *  1. ⚠️ THE MINORITY IS FIXED AT THE START OF THE EPISODE. Re-deriving "which
 *     side is smaller" from a LATER row scores a lineage that has overtaken its
 *     rival as though it had gone extinct — #60's test 7.
 *
 *  2. ⚠️ THE NEXT ROW MUST BE READ EVEN WHEN IT IS NOT `informative`. A row
 *     stops being informative precisely when one pure count hits zero, which is
 *     the EXIT this analysis exists to count. Requiring `informative` on the
 *     successor conditions on SURVIVAL, and the no-selfing arm — which always
 *     exits — disappears from the table entirely. That bug produced a NaN in
 *     the first draft of the dwell analysis and is the reason this is a module.
 */

/* Every generation at minority count K, with the successor attached.
 * The conditioning set is defined ONCE on the PURE labels and held fixed — a
 * k = 1 generation is DEFINED by those labels, so re-conditioning on anything
 * downstream of the hypothesis under test would be circular. */
function episodes(runs, K) {
  const out = [];
  for (const run of runs) {
    const rows = run.rows;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.informative || r.k !== K) continue;
      /* trap 1: decided HERE, at the episode's own generation, and carried */
      const minorIs0 = r.n0 < r.n1;
      /* trap 2: no `informative` filter on the successor */
      const nx = rows[i + 1] || null;
      out.push({
        seed: run.seed,
        g: r.g,
        r,
        minorIs0,
        next: nx,
        nextPure: nx ? (minorIs0 ? nx.n0 : nx.n1) : null,
        nextHyb: nx ? nx.nh : null,
      });
    }
  }
  return out;
}

/* An episode STARTS where the previous generation was not already at K, so a
 * run that sits at K for three generations is one episode of dwell 3, not
 * three episodes. Used to turn a generation COUNT into a dwell time. */
function episodeStarts(runs, K) {
  let n = 0;
  for (const run of runs) {
    const rows = run.rows;
    for (let i = 0; i < rows.length; i++) {
      if (!rows[i].informative || rows[i].k !== K) continue;
      const p = rows[i - 1];
      if (!(p && p.informative && p.k === K)) n++;
    }
  }
  return n;
}

module.exports = { episodes, episodeStarts };
