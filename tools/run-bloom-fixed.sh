#!/usr/bin/env bash
# #53 — the bloom-fixed 2x2, in ONE job on ONE host.
#
# Registered in docs/2026-09-01-bloom-fixed-prereg.md.
#
# ⚠️ ONE JOB. All four cells plus the two self-donation controls are produced in
# a single process, because C's donor is A's own realised trajectory: split
# across jobs, the donor would come from a different run on a possibly different
# build, and the thing being held still would not be the thing that was measured.
#
# ⚠️ ABSOLUTE PATH TO NODE — a non-interactive shell has no nvm shims, and
# `node: command not found` at dispatch is a failure this project has hit twice.
set -uo pipefail

NODE=${NODE_BIN:-/home/mjarnold/.nvm/versions/node/v18.20.8/bin/node}
if [ ! -x "$NODE" ]; then
	echo "FATAL: no node at $NODE — set NODE_BIN" >&2
	exit 127
fi

echo "=== BUILD ==="
md5sum sim/ibm.js experiments/bloom-fixed.js
"$NODE" --version
echo
echo "=== the 2x2: A=#37, B=#52, C=premium gone + polymorphism restored,"
echo "===          D=premium kept + polymorphism destroyed"
echo "=== A must reproduce HELD 0.289 and B must reproduce 0.026, or nothing below counts"
echo

"$NODE" experiments/bloom-fixed.js
rc=$?
echo
echo "=== EXIT: $rc ==="
exit "$rc"
