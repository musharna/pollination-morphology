/*
 * example-heat.js is the page's own output for level 2 seed 3, not a drawing:
 * re-driving the page must reproduce it exactly. Seen failing: the file did not
 * exist; then seen failing again by editing one count in the committed file.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { build } = require("../tools/make-example-heat.js");

test("the committed example is what the page produces for level 2 seed 3", () => {
  const src = fs.readFileSync(path.join(__dirname, "..", "example-heat.js"), "utf8");
  const box = { window: {} };
  vm.runInNewContext(src, box);
  /* the vm context has its own Object/Array prototypes, which deepEqual
   * (strict) compares; JSON round-trip brings the data into this realm */
  const committed = JSON.parse(JSON.stringify(box.window.ExampleHeat ?? null));
  assert.ok(committed && committed.model, "example-heat.js defines no window.ExampleHeat");
  assert.deepEqual(committed, build());
});
