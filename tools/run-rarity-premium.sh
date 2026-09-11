#!/usr/bin/env bash
# #52 — both arms of the rarity-premium ablation, in ONE job on ONE host.
#
# Registered in docs/2026-09-01-rarity-premium-prereg.md.
#
# ⚠️ BOTH ARMS IN ONE JOB, deliberately. Two jobs can land on different hosts
# with different node versions and different builds, and the comparison is
# between arms — so anything that differs between them other than the flag is a
# confound. The build md5 is printed by the job itself because
# `git rev-parse HEAD` does not identify the binary that actually ran.
#
# ⚠️ ABSOLUTE PATH TO NODE. A non-interactive shell does not have nvm's shims on
# PATH, and `node: command not found` at dispatch is a class of failure this
# project has already hit twice (once with `job` itself).
set -uo pipefail

# ⚠️ NO DEFAULT ON PURPOSE. The caller must name the interpreter: a
# non-interactive shell has no nvm shims, and falling back to PATH would let a
# run proceed on an unknown build — which is exactly what the md5 check below
# exists to prevent. Set NODE_BIN to an absolute path.
NODE=${NODE_BIN:?set NODE_BIN to an absolute path to a node binary}
if [ ! -x "$NODE" ]; then
	echo "FATAL: no node at $NODE — set NODE_BIN" >&2
	exit 127
fi

echo "=== BUILD ==="
md5sum sim/ibm.js experiments/phenology.js
"$NODE" --version
echo

echo "=== ARM A — CONTROL (PH_DPV unset) ==="
echo "=== must reproduce docs/2026-08-25-phenology.md: HELD 0.000 0.289 0.368 0.000 0.000"
echo
"$NODE" experiments/phenology.js
rc_a=$?
echo
echo "=== ARM B — ABLATION (PH_DPV=1), visits apportioned by display ==="
echo
PH_DPV=1 "$NODE" experiments/phenology.js
rc_b=$?

echo
echo "=== EXIT: control=$rc_a ablation=$rc_b ==="
# ⚠️ a non-zero from EITHER arm must fail the job. Reporting only the last
# command's status would let a crashed control arm land as a green run whose
# baseline silently never ran.
[ "$rc_a" -eq 0 ] && [ "$rc_b" -eq 0 ]
