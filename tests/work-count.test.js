/*
 * The work-count gate (tools/work-count.js): the seeded runs the Pages smoke
 * times at 60 s must make exactly the committed number of calls into sim/ and
 * population-run.js. See the tool's header for why a count and not a time.
 *
 * Runs alone: node --test tests/work-count.test.js (~10 s; two children in
 * parallel under NODE_V8_COVERAGE).
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const WC = require("../tools/work-count.js");

const BASELINE = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "tools", "work-count-baseline.json"), "utf8"),
);

test("each smoke workload makes exactly its baseline number of calls", async () => {
  // The baseline pins two different runs: if a workload fell back to a default,
  // both would carry the same final population.
  const names = Object.keys(WC.WORKLOADS);
  assert.deepStrictEqual(Object.keys(BASELINE).sort(), names.slice().sort());
  const finals = names.map((n) => BASELINE[n].outcome.final);
  assert.strictEqual(new Set(finals).size, names.length, "two workloads share a final population");

  // Positive control: the counter sees the simulation -- one step() per
  // generation of the page configuration, and one call to the page's loop.
  for (const n of names) {
    assert.strictEqual(BASELINE[n].perFn["sim/ibm.js:step"], 24, `${n}: step() count`);
    assert.strictEqual(BASELINE[n].perFn["population-run.js:runGenerations"], 1, `${n}: loop count`);
  }

  const { failures, lines } = await WC.compare();
  assert.deepStrictEqual(failures, [], lines.concat(failures).join("\n"));
});
