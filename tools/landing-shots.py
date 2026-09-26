"""Screenshot tiles for the landing page, taken from the built site.

Builds nothing itself: run after tools/build-site.sh, then build again so the
new JPEGs are copied into site/assets/.

  tools/build-site.sh && python tools/landing-shots.py && tools/build-site.sh

Serves site/ on an ephemeral port (as tools/smoke-site.py does), default
Playwright Chromium launch (software rendering), viewport 1400x900, device
scale 1.

  sandbox  the page default a visitor gets on arrival (free sandbox, seed 3):
           click #run, wait for #play to enable, move #scrub to its last
           generation and wait for #sGen to read "<max> / <max>", then clip to
           the hero's two columns (.heroL verdict + heat, .heroR field) -
           not the scrubber, stats or bands below -> assets/sandbox-tile.jpg
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


def union_box(page, selectors, step):
    """Page-coordinate box covering every selector (each must match once)."""
    boxes = []
    for sel in selectors:
        el = page.locator(sel)
        if el.count() != 1:
            fail(step, f"expected one {sel}, found {el.count()}")
        b = el.bounding_box()
        if not b:
            fail(step, f"{sel} has no bounding box")
        boxes.append(b)
    sx, sy = page.evaluate("() => [window.scrollX, window.scrollY]")
    x0 = min(b["x"] for b in boxes)
    y0 = min(b["y"] for b in boxes)
    x1 = max(b["x"] + b["width"] for b in boxes)
    y1 = max(b["y"] + b["height"] for b in boxes)
    return {"x": x0 + sx, "y": y0 + sy, "width": x1 - x0, "height": y1 - y0}


def save_tile(page, selectors, dest, step):
    box = union_box(page, selectors, step)
    if Image is not None:
        png = page.screenshot(type="png", clip=box, full_page=True)
        img = Image.open(io.BytesIO(png)).convert("RGB")
        h = round(img.height * WIDTH / img.width)
        img = img.resize((WIDTH, h), Image.LANCZOS)
        img.save(dest, "JPEG", quality=QUALITY, optimize=True)
        return img.size
    # No Pillow: re-render the page at the scale that makes the box 640 px wide
    # and clip to it.
    page.evaluate(f"document.body.style.zoom = {WIDTH / box['width']}")
    box = union_box(page, selectors, step)
    page.screenshot(path=dest, type="jpeg", quality=QUALITY, clip=box, full_page=True)
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
            # The page default: #level untouched (free sandbox), seed 3.
            if page.input_value("#level") != "free":
                fail(step, f"#level default is {page.input_value('#level')!r}, not 'free'")
            page.fill("#seed", "3")
            page.click("#run")
            page.wait_for_selector("#play:not([disabled])", timeout=RUN_TIMEOUT_MS)
            # Show the last generation, not generation 0.
            mx = page.evaluate(
                """() => { const s = document.getElementById('scrub');
                   s.value = s.max; s.dispatchEvent(new Event('input', {bubbles: true}));
                   return s.max; }"""
            )
            try:
                page.wait_for_function(
                    "(m) => document.getElementById('sGen').textContent.trim() === m + ' / ' + m",
                    arg=str(mx),
                    timeout=10000,
                )
            except Exception:  # noqa: BLE001
                got = page.text_content("#sGen")
                fail(step, f"#sGen never read '{mx} / {mx}' after scrubbing (read {got!r})")
            page.wait_for_timeout(500)
            size = save_tile(page, ["#hero .heroL", "#hero .heroR"], f"{OUT}/sandbox-tile.jpg", step)
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
            size = save_tile(page, ["#c"], f"{OUT}/visit-tile.jpg", step)
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
