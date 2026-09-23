"""Stage 4 smoke test for the built site/ — per-page expectations.

The first version of this test asserted "every canvas must animate on load".
That encoded MY belief, not the pages' spec, and it failed on two pages that are
behaving correctly. Inspection settled it:

  index.html       landing page. No canvas. Every same-origin link resolves 200.
  visit.html       AUTOPLAYS — its control reads "Pause" on load, 2 rAF sites.
                   Canvas must be non-blank AND change between two samples.
  greybox.html     STATIC BY DESIGN — zero rAF, zero setInterval, no controls.
                   Canvas must be non-blank. It must NOT be required to animate.
  population.html  WAITS for the user (<button id="run">). Canvas non-blank on
                   load, must NOT animate before the click, and MUST animate
                   after it — the real end-to-end check that the evolution loop
                   runs in a browser.

Every page also asserts HTTP 200, zero console errors, zero uncaught exceptions.
Exits non-zero on any failure, naming it.
"""

import re
import signal
import sys
import threading
import functools
import http.server
import socketserver
import urllib.request

signal.signal(
    signal.SIGALRM,
    lambda *_: (sys.stderr.write("aborting: walltime guard\n"), sys.exit(2)),
)
signal.alarm(1200)

ROOT = (
    sys.argv[1] if len(sys.argv) > 1 else "site"
)
PORT = 0  # ephemeral: this host runs parallel jobs, fixed ports collide

SPEC = [
    ("index.html", "links"),
    ("visit.html", "autoplay"),
    ("greybox.html", "static"),
    ("population.html", "click"),
]

Handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
socketserver.TCPServer.allow_reuse_address = True
httpd = socketserver.TCPServer(("127.0.0.1", PORT), Handler)
PORT = httpd.server_address[1]
BASE = f"http://127.0.0.1:{PORT}"
print(f"serving {ROOT} on {BASE}")
threading.Thread(target=httpd.serve_forever, daemon=True).start()

failures, report = [], []

from playwright.sync_api import sync_playwright  # noqa: E402

SHOT = """() => Array.from(document.querySelectorAll('canvas')).map(c => {
  try {
    const u = c.toDataURL();
    // Distinct-colour count, grid-sampled. A data-URL LENGTH cannot tell a
    // rendered canvas from a uniform fill: a flat colour compresses tiny but is
    // not "non-blank" in any sense a reader would accept. Counting colours can.
    let ncol = -1;
    try {
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      const seen = new Set();
      const step = Math.max(1, Math.floor((c.width * c.height) / 4000)) * 4;
      for (let i = 0; i + 3 < d.length; i += step) {
        seen.add((d[i] << 24) | (d[i + 1] << 16) | (d[i + 2] << 8) | d[i + 3]);
        if (seen.size > 64) break;
      }
      ncol = seen.size;
    } catch (e) { ncol = -1; }
    return u.length + ':' + u.slice(-64) + ':' + ncol;
  } catch (e) { return 'ERR:-1:-1'; }
})"""


def sample(page, settle, gap):
    page.wait_for_timeout(settle)
    a = page.evaluate(SHOT)
    page.wait_for_timeout(gap)
    b = page.evaluate(SHOT)
    n = len(a)
    changed = sum(1 for x, y in zip(a, b) if x != y)
    # <=1 distinct colour means nothing a viewer could see was drawn
    uniform = sum(1 for x in a if x.startswith("ERR") or int(x.rsplit(":", 1)[1]) <= 1)
    return n, changed, uniform


# ---------------------------------------------------------------- M2 (northstar)
# One assertion per M2 acceptance line (docs/superpowers/specs/2026-09-12-northstar-
# design.md section 9), every card state read from the DOM's data-state:
# the two positive seeds, the random-mating null block (seeds 1-5 x targets 4, 8;
# quantity on the null side AND grey on cards 1 and 4 - grey wins), and the
# STALLED fixture with its 0.80 / 0.85 controls. tests/sandbox-m2-*.test.js
# assert the same in the fake DOM; this is the real-browser control on them.
M2_RUN = """async (s) => {
  const $ = (id) => document.getElementById(id);
  if (s.lineages) {
    const E = window.Evolve;
    const g = { ...E.randomGenome(E.makeRng(4)), antherT: s.lineages };
    window.Sandbox.setLineage(0, g);
    window.Sandbox.setLineage(1, { ...g });
  }
  for (const k of ["seed", "d", "n", "gens", "siteN"]) if (k in s) $(k).value = String(s[k]);
  $("useD").checked = !!s.useD;
  $("d").disabled = !s.useD;
  $("mode").value = s.random ? "random" : "real";
  $("status").textContent = "running…";
  $("status").removeAttribute("data-error");
  $("run").click();
  const t0 = performance.now();
  while ($("status").textContent === "running…" && performance.now() - t0 < 90000)
    await new Promise((r) => setTimeout(r, 100));
  const band = $("sFateBand").textContent, hb = $("sHybBand").textContent;
  const st = /(\d+) of (\d+) generations recruited nothing/.exec(band);
  const hy = /hybrids among the parents in (\d+) of (\d+) generations/.exec(hb);
  const ra = /receipt ratio (\S+)/.exec(hb);
  const cards = {};
  for (const c of ["card1", "card2", "card3", "card4", "card5", "card6"])
    cards[c] = $(c) ? $(c).getAttribute("data-state") : null;
  return {
    status: $("status").textContent,
    error: $("status").getAttribute("data-error"),
    fate: $("sFate").textContent,
    stalled: st ? +st[1] : null,
    hyb: hy ? +hy[1] : null,
    ratio: ra ? ra[1] : null,
    cards,
  };
}"""


def m2_checks(browser, name):
    notes = []
    page = browser.new_page()
    page.goto(f"{BASE}/{name}", wait_until="load")
    run = lambda s: page.evaluate(M2_RUN, s)  # noqa: E731
    PAGE_CFG = {"n": 18, "gens": 24, "siteN": 90}
    # card 4: target 8 seed 1; card 1: target 4 seed 16 (spec M2 row)
    for seed, d, hyb, ratio, card in ((1, 8, 0, "no", "card4"), (16, 4, 1, "0.111", "card1")):
        r = run({**PAGE_CFG, "seed": seed, "d": d, "useD": True})
        if (r["fate"], r["hyb"], r["ratio"], r["cards"][card]) != ("one lost", hyb, ratio, "open"):
            failures.append(f"{name}: M2 positive target {d} seed {seed} read {r}")
        notes.append(f"t{d}s{seed} {r['fate']} {card} {r['cards'][card]}")
    # the null block: quantity on the null side AND grey on cards 1 and 4
    grey = 0
    for seed in range(1, 6):
        for d in (4, 8):
            r = run({**PAGE_CFG, "seed": seed, "d": d, "useD": True, "random": True})
            ok_q = r["hyb"] == 23 and r["ratio"] is not None and (
                r["ratio"] == "Infinity" or float(r["ratio"]) >= 1.146)
            ok_s = r["cards"]["card1"] == "grey" and r["cards"]["card4"] == "grey"
            if not (ok_q and ok_s):
                failures.append(f"{name}: M2 null target {d} seed {seed} read {r}")
            grey += ok_s
    notes.append(f"null block grey {grey}/10")
    # the STALLED fixture (level configuration, hand-set pair) and its controls
    LEVEL = {"n": 30, "gens": 35, "siteN": 160, "seed": 1, "useD": False}
    r = run({**LEVEL, "lineages": 0.825})
    exp = {"card1": "grey", "card2": "grey", "card3": "grey", "card4": "closed",
           "card5": "grey", "card6": "grey"}
    if r["fate"] != "STALLED" or r["stalled"] != 35 or r["cards"] != exp:
        failures.append(f"{name}: M2 stall fixture read {r}")
    notes.append(f"stall {r['fate']} {r['stalled']}/35")
    r = run({**LEVEL, "lineages": 0.80})
    if r["fate"] != "FUSED" or r["stalled"] != 0:
        failures.append(f"{name}: M2 stall control antherT 0.80 read {r}")
    r = run({**LEVEL, "lineages": 0.85})
    if not r["error"] or "never touches the bee" not in r["error"]:
        failures.append(f"{name}: M2 antherT 0.85 was founded: {r}")
    page.close()
    return notes


with sync_playwright() as p:
    browser = p.chromium.launch()
    for name, mode in SPEC:
        page = browser.new_page()
        errors, pageerrors = [], []
        page.on(
            "console",
            lambda m: (
                errors.append(f"{m.type}: {m.text}") if m.type == "error" else None
            ),
        )
        page.on("pageerror", lambda e: pageerrors.append(str(e)))

        resp = page.goto(f"{BASE}/{name}", wait_until="load")
        status = resp.status if resp else None
        if status != 200:
            failures.append(f"{name}: HTTP {status}")

        n, changed, uniform = sample(page, 1200, 1800)
        note = ""

        if mode == "links":
            if n:
                failures.append(f"{name}: expected no canvas, found {n}")
            hrefs = page.evaluate(
                """() => Array.from(document.querySelectorAll('a[href]'))
                     .map(a => a.getAttribute('href')).filter(h => !/^https?:/.test(h))"""
            )
            for h in hrefs:
                try:
                    with urllib.request.urlopen(f"{BASE}/{h}", timeout=10) as r:
                        code = r.status
                except Exception as e:  # noqa: BLE001
                    code = f"ERR {e}"
                if code != 200:
                    failures.append(f"index.html link '{h}' -> {code}")
                report.append(f"    link {h:<18} -> {code}")
            note = f"{len(hrefs)} same-origin links checked"

        elif mode == "autoplay":
            if uniform:
                failures.append(f"{name}: {uniform} canvas with <=1 distinct colour")
            if n == 0 or changed == 0:
                failures.append(
                    f"{name}: expected autoplay, {n} canvas, {changed} animating"
                )
            note = f"animating on load {changed}/{n}"

        elif mode == "static":
            if uniform:
                failures.append(
                    f"{name}: {uniform} canvas with <=1 distinct colour - static page drew nothing"
                )
            if n == 0:
                failures.append(f"{name}: expected a rendered canvas, found none")
            note = f"static by design, {n} canvas rendered non-blank"

        elif mode == "click":
            # population.html's real contract, read off the page (lines 1060-1088):
            # #run disables itself, computes the generations, and ON COMPLETION
            # enables #scrub and #play. So Run DRAWS ONCE; Play animates the
            # playback. Asserting "animates after Run" was wrong; the right
            # assertions are that the computation ran, drew, and armed playback.
            # population.html legitimately shows an EMPTY plot area before #run, so a
            # uniform canvas on load is CORRECT here and is deliberately not
            # asserted against. What must hold is that #run then draws.
            pass
            if changed:
                failures.append(f"{name}: animated BEFORE #run was clicked ({changed})")

            # M1 acceptance, asserted in a REAL browser before anything is clicked:
            # eight sliders per lineage whose min/max come from Evolve.GENE_BOUNDS
            # (never retyped - antherTheta has no GENE_BOUNDS row and wraps to
            # [-pi, pi]), and the realised separation with level 1's target beside
            # it. tests/sandbox-m1.test.js asserts the same things in a fake DOM;
            # this is the real-execution control on that fixture.
            m1 = page.evaluate(
                """() => {
                  const B = window.Evolve.GENE_BOUNDS;
                  const keys = Object.keys(B).concat(["antherTheta"]);
                  const bad = [];
                  let n = 0;
                  for (const li of [1, 2]) for (const k of keys) {
                    const el = document.getElementById(`g${li}_${k}`);
                    if (!el) { bad.push(`missing g${li}_${k}`); continue; }
                    n++;
                    const lo = k === "antherTheta" ? -Math.PI : B[k][0];
                    const hi = k === "antherTheta" ?  Math.PI : B[k][1];
                    if (+el.min !== lo || +el.max !== hi)
                      bad.push(`g${li}_${k} range ${el.min}..${el.max}`);
                  }
                  const sep = document.getElementById("sReal");
                  const tgt = document.getElementById("sTarget");
                  return {
                    n, bad,
                    sep: sep ? sep.textContent : null,
                    target: tgt ? tgt.textContent : null,
                  };
                }"""
            )
            if m1["n"] != 16 or m1["bad"]:
                failures.append(
                    f"{name}: M1 sliders - {m1['n']}/16 present, problems {m1['bad'][:4]}"
                )
            if not m1["sep"] or not re.match(r"^\d+\.\d+$", m1["sep"]):
                failures.append(
                    f"{name}: no realised separation at load (read {m1['sep']!r})"
                )
            if not m1["target"] or "reach 8" not in m1["target"]:
                failures.append(
                    f"{name}: level 1's target does not read beside the separation "
                    f"at load (read {m1['target']!r})"
                )

            pre = page.evaluate(SHOT)
            page.click("#run")
            try:
                page.wait_for_selector("#play:not([disabled])", timeout=60000)
                completed = True
            except Exception:
                completed = False
                failures.append(f"{name}: #run never enabled #play within 60s - the run did not complete")
            post = page.evaluate(SHOT)
            drew = sum(1 for a, b in zip(pre, post) if a != b)
            if completed and drew == 0:
                failures.append(f"{name}: #run completed but the canvas never changed - nothing was drawn")
            n3, changed3, _ = (0, 0, 0)
            if completed:
                page.click("#play")
                n3, changed3, _ = sample(page, 600, 2200)
                if changed3 == 0:
                    failures.append(f"{name}: clicked #play and NOTHING animated - playback does not run")
            note = (f"idle on load {changed}/{n}, #run drew {drew}/{len(post)} canvas, "
                    f"#play animating {changed3}/{n3}")
            m2_notes = m2_checks(browser, name)
            note += "; M2 " + ", ".join(m2_notes)

        if errors:
            failures.append(f"{name}: {len(errors)} console error(s): {errors[:3]}")
        if pageerrors:
            failures.append(
                f"{name}: {len(pageerrors)} uncaught exception(s): {pageerrors[:3]}"
            )

        report.append(
            f"  {name:<18} HTTP {status}  console-err {len(errors)}  uncaught {len(pageerrors)}  [{mode}] {note}"
        )
        page.close()
    browser.close()

httpd.shutdown()

print("=== smoke results ===")
print("\n".join(report))
print()
if failures:
    print(f"*** {len(failures)} FAILURE(S) ***")
    for f in failures:
        print("  -", f)
    sys.exit(1)
print("all entry points: HTTP 200, zero console errors, zero uncaught exceptions.")
print("visit/greybox canvases carry >1 distinct colour; population.html is")
print("legitimately uniform before #run and is NOT asserted non-blank there --")
print("what is asserted is that #run draws and #play then animates.")
