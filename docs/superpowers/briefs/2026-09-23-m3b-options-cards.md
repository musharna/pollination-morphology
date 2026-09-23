# Executor brief: pollen M3b, options from the page, cards 2/3/5/6, paired arms, deck.

Repo `/home/mjarnold/pollination-morphology`, master `6b9c08f`. Authority: spec §9 M3b row (large; read
it in full), §4 cards 2, 3, 5, 6 + trigger/signature/precedence rules, §5 levels 3–5 option objects,
§14 deck. Read fresh; spec wins.

- Everything in the M3b row: option controls, levels 3–6 now apply their option objects (M3a left them
  unapplied), cards 2/3/5/6 with `data-state` by grey-wins, the in-page paired arms (q = 0 for card 5,
  `shuffleWidth` for card 6), three rng streams, deck file + `tests/deck.test.js` with its six must-fail
  rows, the phenology no-log field caption.
- ⚠️ Founding protocol: the M3b acceptance numbers come from the null tables, run with
  `foundTwoLineages` ("found at target d", ON at 8). Assert them under THAT protocol. Card 1 lost its
  edge under hand-set founding (docs/2026-09-13-northstar-null-tables.md, last section); for each
  acceptance line ALSO record what the hand-set founding reads (report only, no assertion, no edge
  change) so we know which cards survive removal of the `d` switch.
- Acceptance: every line of the M3b row (level 5 seeds 1–5; level 4 q = 0.85/1/0.69; level 3 seeds 6, 1,
  6-randomMating; level 5 width seeds 3, 13, 23; deck test). A number that does not match is a finding,
  never a tolerance change.
- Branch `m3b-options-cards`; no push/merge; no attribution; `sim/` untouched; tests seen failing first;
  full `node --test tests/` green (background); smoke green; a11y kept; runtime of the slowest level in
  Chromium vs 60 s. Final report: SHAs, counts, every acceptance line pass/fail, the hand-set table,
  mismatches.
