/*
 * The landing page's two tiles are real screenshots shipped with the site:
 * referenced from tools/site-index.html, present, JPEG, under 200 KB, with alt
 * text, and copied by the build. Seen failing: no assets/ directory.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const index = fs.readFileSync(path.join(ROOT, "tools/site-index.html"), "utf8");
const build = fs.readFileSync(path.join(ROOT, "tools/build-site.sh"), "utf8");

test("each toy has a shipped screenshot tile with alt text", () => {
  const imgs = [...index.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
  const srcs = imgs.map((t) => /src="([^"]+)"/.exec(t)[1]);
  assert.deepEqual(srcs.sort(), ["assets/sandbox-tile.jpg", "assets/visit-tile.jpg"]);
  for (const t of imgs) assert.match(t, /alt="[^"]{12,}"/, t);
  for (const s of srcs) {
    const buf = fs.readFileSync(path.join(ROOT, s));
    assert.equal(buf.readUInt16BE(0), 0xffd8, `${s} is not a JPEG`);
    assert.ok(buf.length < 200 * 1024, `${s} is ${buf.length} bytes`);
  }
  assert.match(build, /assets/, "build-site.sh does not copy assets/");
});
