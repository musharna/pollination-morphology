/*
 * How many slices is a plant actually in flower in, as a function of its bloom
 * time and the season width?
 *
 * WHY THIS EXISTS. `docs/2026-08-25-evolving-width-prereg.md` turns season
 * width into a heritable locus. Before writing that, the presence predicate was
 * enumerated over bloom-space, and it is not the smooth thing the name "season
 * width" suggests: below `width = 1/S` the season is not a season but S
 * disjoint mating bins, and a plant whose bloom falls between coverage regions
 * catches ZERO slices and is reproductively invisible by grid alignment alone.
 * At the published narrow arm (WIDTH 0.12, SLICES 8) that is 4% of bloom-space,
 * and no plant is ever in two slices at once.
 *
 * That is a fact about the discretisation, not about pollination, and an
 * evolving width locus would climb it. The numbers quoted in the
 * pre-registration come from here so they can be re-derived rather than
 * trusted.
 *
 * ⚠️ `ringDist` is IMPORTED, not reimplemented. A local copy would keep
 * printing a reassuring table after the real predicate changed underneath it —
 * the failure mode this project has logged repeatedly as an observable that
 * cannot report what it is trusted for.
 *
 *   node tools/slice-coverage.js [slices]
 */

const { ringDist } = require("../sim/ibm.js");

/* The presence test, matching sim/ibm.js:1198 — `ringDist(blooms[i], t) <= half`
 * with `t = k / S` and `half = width / 2` from :1194. */
function slicesFor(bloom, width, S) {
  const half = width / 2;
  let n = 0;
  for (let k = 0; k < S; k++) if (ringDist(bloom, k / S) <= half) n++;
  return n;
}

function profile(width, S, N = 200000) {
  const hist = {};
  for (let i = 0; i < N; i++) {
    const n = slicesFor(i / N, width, S);
    hist[n] = (hist[n] || 0) + 1;
  }
  return Object.keys(hist)
    .map(Number)
    .sort((a, b) => a - b)
    .map(
      (k) =>
        `${k} slice${k === 1 ? "" : "s"}: ${((100 * hist[k]) / N).toFixed(1)}%`,
    )
    .join("   ");
}

function main() {
  const S = Math.max(2, Number(process.argv[2]) || 8);
  console.log(`S = ${S} slices, centres spaced ${(1 / S).toFixed(4)} apart\n`);
  console.log("fraction of bloom-space landing in each presence class:\n");
  for (const w of [
    0.06, 0.1, 0.12, 0.125, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 1.0,
  ]) {
    const tag =
      w === 0.12 && S === 8
        ? "  <- published narrow arm"
        : w === 1.0
          ? "  <- wide baseline"
          : "";
    console.log(`  width ${String(w).padEnd(6)} ${profile(w, S)}${tag}`);
  }
  console.log("\nthresholds, in terms of S:");
  console.log(
    `  width <  1/S = ${(1 / S).toFixed(4)}   gaps exist: some plants catch ZERO`,
  );
  console.log(
    `                            slices, and no plant is ever in two at once`,
  );
  console.log(
    `  width >= 2/S = ${(2 / S).toFixed(4)}   every plant is in at least two slices`,
  );
}

module.exports = { slicesFor, profile };

if (require.main === module) main();
