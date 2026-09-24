#!/usr/bin/env bash
#
# Assemble the GitHub Pages artifact into site/ deterministically from the tree.
#
# site/ is an ALLOWLISTED staging directory, never the repo root: only the files
# named here are published. Everything it contains is either tracked source
# copied verbatim (the two playables, the two scripts they load, the landing
# page) or generated here (.nojekyll). The output is gitignored — this script is
# the committed artifact, not its result.
#
# Usage: tools/build-site.sh          (run from the repository root)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

OUT="site"

# The two playables, and ONLY the sim modules they actually load. Verified by
# reading the <script src=...> of each page:
#   visit.html      -> sim/placement.js
#   sandbox.html    -> sim/browser-bundle.js
#   sandbox.html    -> population-run.js (its own generation loop, M1)
PLAYABLES=(sandbox.html visit.html)
SIM_MODULES=(sim/placement.js sim/browser-bundle.js)
# Page scripts that are not sim modules: shipped beside the page that loads them.
PAGE_SCRIPTS=(population-run.js)
# The speculative deck (northstar spec §14): one JSON data table beside the page,
# checked by tests/deck.test.js. Shipped as data; no page fetches it yet.
PAGE_DATA=(deck.json)

rm -rf "$OUT"
mkdir -p "$OUT/sim"

# Landing page. Tracked source, so the committed thing is the input, not output.
cp tools/site-index.html "$OUT/index.html"

for f in "${PLAYABLES[@]}"; do
	[ -f "$f" ] || {
		echo "build-site: missing playable $f" >&2
		exit 1
	}
	cp "$f" "$OUT/$f"
done

for f in "${PAGE_SCRIPTS[@]}"; do
	[ -f "$f" ] || {
		echo "build-site: missing page script $f" >&2
		exit 1
	}
	cp "$f" "$OUT/$f"
done

for f in "${PAGE_DATA[@]}"; do
	[ -f "$f" ] || {
		echo "build-site: missing page data $f" >&2
		exit 1
	}
	cp "$f" "$OUT/$f"
done

for f in "${SIM_MODULES[@]}"; do
	[ -f "$f" ] || {
		echo "build-site: missing module $f" >&2
		exit 1
	}
	cp "$f" "$OUT/$f"
done

# population.html was renamed sandbox.html at northstar M4; old links land on a
# stub that forwards (query and hash kept) instead of a 404.
cat >"$OUT/population.html" <<'HTML'
<!doctype html>
<meta charset="utf-8">
<title>Moved to sandbox.html</title>
<meta http-equiv="refresh" content="0; url=sandbox.html">
<link rel="canonical" href="sandbox.html">
<script>location.replace("sandbox.html" + location.search + location.hash);</script>
<p>This page moved to <a href="sandbox.html">sandbox.html</a>.</p>
HTML

# Jekyll silently drops paths beginning with an underscore. Pages runs it unless
# this file exists, so its absence is a class of missing-asset bug that shows up
# only in production.
touch "$OUT/.nojekyll"

# Fail loudly if a playable references a module that was not shipped. This is the
# check that would have caught shipping a page whose script 404s in production.
missing=0
for f in "${PLAYABLES[@]}"; do
	while IFS= read -r src; do
		[ -z "$src" ] && continue
		if [ ! -f "$OUT/$src" ]; then
			echo "build-site: $f references '$src' which is not in $OUT/" >&2
			missing=1
		fi
	done < <(grep -oE '<script[^>]+src="[^"]+"' "$f" | sed -E 's/.*src="([^"]+)".*/\1/')
done
[ "$missing" -eq 0 ] || {
	echo "build-site: refusing to publish an incomplete site" >&2
	exit 1
}

echo "build-site: wrote $OUT/"
find "$OUT" -type f | sort | sed 's/^/  /'
