"""Screenshot tiles for the landing page, taken from the built site.

Builds nothing itself: run after tools/build-site.sh, then build again so the
new JPEGs are copied into site/assets/.

  tools/build-site.sh && python tools/landing-shots.py && tools/build-site.sh

Serves site/ on an ephemeral port (as tools/smoke-site.py does), default
Playwright Chromium launch (software rendering), viewport 1400x900, device
scale 1.

  sandbox  level 2, seed 3, click #run, wait for #play to enable, screenshot
           the #hero section -> assets/sandbox-tile.jpg
  visit    load, wait 2.5 s, screenshot the main canvas #c
           -> assets/visit-tile.jpg

Each tile is resized to 640 px wide with Pillow (Playwright's clip at scale if
Pillow is missing) and written as JPEG quality 82 with no metadata. Exits
non-zero naming the step on any failure.

Usage: python tools/landing-shots.py [site-dir]   (run from the repository root)
"""

import functools
import http.server
import io
import os
import signal
import socketserver
import sys
import threading

signal.signal(
    signal.SIGALRM,
    lambda *_: (sys.stderr.write("aborting: walltime guard\n"), sys.exit(2)),
)
# A sandbox run can take 2+ minutes on a loaded host; the #play wait below is
# 240 s, so the guard sits well above it.
signal.alarm(420)

ROOT = sys.argv[1] if len(sys.argv) > 1 else "site"
OUT = "assets"
WIDTH = 640
QUALITY = 82
RUN_TIMEOUT_MS = 240000

try:
    from PIL import Image
except ImportError:  # the clip-at-scale path below covers it
    Image = None


def fail(step, err):
    sys.stderr.write(f"landing-shots: {step} failed: {err}\n")
    sys.exit(1)


def save_tile(page, selector, dest, step):
    el = page.locator(selector)
    if el.count() != 1:
        fail(step, f"expected one {selector}, found {el.count()}")
    if Image is not None:
        png = el.screenshot(type="png")
        img = Image.open(io.BytesIO(png)).convert("RGB")
        h = round(img.height * WIDTH / img.width)
        img = img.resize((WIDTH, h), Image.LANCZOS)
        img.save(dest, "JPEG", quality=QUALITY, optimize=True)
        return img.size
    # No Pillow: re-render the page at the scale that makes the element 640 px
    # wide and clip to it.
    box = el.bounding_box()
    if not box:
        fail(step, f"{selector} has no bounding box")
    scale = WIDTH / box["width"]
    page.evaluate(f"document.body.style.zoom = {scale}")
    box = el.bounding_box()
    page.screenshot(path=dest, type="jpeg", quality=QUALITY, clip=box)
    return (round(box["width"]), round(box["height"]))


def main():
    if not os.path.isfile(os.path.join(ROOT, "sandbox.html")):
        fail("setup", f"{ROOT}/sandbox.html not found - run tools/build-site.sh first")
    os.makedirs(OUT, exist_ok=True)

    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass

    Handler = functools.partial(Quiet, directory=ROOT)
    httpd = socketserver.TCPServer(("127.0.0.1", 0), Handler)
    base = f"http://127.0.0.1:{httpd.server_address[1]}"
    threading.Thread(target=httpd.serve_forever, daemon=True).start()

    from playwright.sync_api import sync_playwright

    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(
            viewport={"width": 1400, "height": 900}, device_scale_factor=1
        )

        step = "sandbox"
        try:
            page = ctx.new_page()
            page.on("pageerror", lambda e: errors.append(f"sandbox: {e}"))
            resp = page.goto(f"{base}/sandbox.html", wait_until="load")
            if not resp or resp.status != 200:
                fail(step, f"HTTP {resp.status if resp else None}")
            page.select_option("#level", "2")
            page.fill("#seed", "3")
            page.click("#run")
            page.wait_for_selector("#play:not([disabled])", timeout=RUN_TIMEOUT_MS)
            page.wait_for_timeout(500)
            size = save_tile(page, "#hero", f"{OUT}/sandbox-tile.jpg", step)
            print(f"landing-shots: {OUT}/sandbox-tile.jpg {size[0]}x{size[1]}")
            page.close()
        except SystemExit:
            raise
        except Exception as e:  # noqa: BLE001
            fail(step, e)

        step = "visit"
        try:
            page = ctx.new_page()
            page.on("pageerror", lambda e: errors.append(f"visit: {e}"))
            resp = page.goto(f"{base}/visit.html", wait_until="load")
            if not resp or resp.status != 200:
                fail(step, f"HTTP {resp.status if resp else None}")
            page.wait_for_timeout(2500)
            size = save_tile(page, "#c", f"{OUT}/visit-tile.jpg", step)
            print(f"landing-shots: {OUT}/visit-tile.jpg {size[0]}x{size[1]}")
            page.close()
        except SystemExit:
            raise
        except Exception as e:  # noqa: BLE001
            fail(step, e)

        browser.close()
    httpd.shutdown()
    if errors:
        fail("page errors", "; ".join(errors[:3]))


if __name__ == "__main__":
    main()
