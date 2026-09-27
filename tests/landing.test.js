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
});

/* final review m1: the old check (`build` mentions "assets") passed on any
 * mention. The build now RUNS, on a copy of its inputs in a temp dir (its
 * output dir is fixed, site/ under the script's repo, which the real site/
 * must not lose mid-smoke), and each tile must land in site/assets/ byte for
 * byte. BUILD_SH names another script (a mutant, in the task report). */
test("the build copies both tiles into site/assets/", () => {
  const os = require("os");
  const { execFileSync } = require("child_process");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "landing-build-"));
  try {
    for (const d of ["sim", "tools", "assets"]) fs.cpSync(path.join(ROOT, d), path.join(tmp, d), { recursive: true });
    for (const f of fs.readdirSync(ROOT))
      if (/\.(html|js|json)$/.test(f)) fs.copyFileSync(path.join(ROOT, f), path.join(tmp, f));
    if (process.env.BUILD_SH) fs.copyFileSync(process.env.BUILD_SH, path.join(tmp, "tools/build-site.sh"));
    execFileSync("bash", [path.join(tmp, "tools/build-site.sh")], { cwd: tmp, stdio: "pipe" });
    assert.ok(fs.existsSync(path.join(tmp, "site/index.html")), "control: the build wrote site/");
    for (const t of ["sandbox-tile.jpg", "visit-tile.jpg"]) {
      const out = path.join(tmp, "site/assets", t);
      assert.ok(fs.existsSync(out), `site/assets/${t} was not built`);
      assert.ok(fs.readFileSync(out).equals(fs.readFileSync(path.join(ROOT, "assets", t))), `site/assets/${t} differs from assets/${t}`);
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
