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
signal.alarm(400)

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
  try { const u = c.toDataURL(); return u.length + ':' + u.slice(-64); }
  catch (e) { return 'ERR:' + e.message; }
})"""


def sample(page, settle, gap):
    page.wait_for_timeout(settle)
    a = page.evaluate(SHOT)
    page.wait_for_timeout(gap)
    b = page.evaluate(SHOT)
    n = len(a)
    changed = sum(1 for x, y in zip(a, b) if x != y)
    blank = sum(1 for x in a if x.startswith("ERR") or int(x.split(":")[0]) < 400)
    return n, changed, blank


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

        n, changed, blank = sample(page, 1200, 1800)
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
            if blank:
                failures.append(f"{name}: {blank} blank canvas")
            if n == 0 or changed == 0:
                failures.append(
                    f"{name}: expected autoplay, {n} canvas, {changed} animating"
                )
            note = f"animating on load {changed}/{n}"

        elif mode == "static":
            if blank:
                failures.append(
                    f"{name}: {blank} blank canvas - static page drew nothing"
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
            if blank:
                failures.append(f"{name}: {blank} blank canvas on load")
            if changed:
                failures.append(f"{name}: animated BEFORE #run was clicked ({changed})")
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
print("all entry points: HTTP 200, zero console errors, zero uncaught exceptions,")
print("every canvas non-blank, each page behaving as its own design specifies,")
print("population.html's evolution loop confirmed running in-browser after #run.")
