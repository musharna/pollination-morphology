# Blind 10-second test: sandbox visual-first rebuild (2026-09-26)

Plan Task 7 Step 3. Each page was loaded at a 1400×900 viewport (default headless Chromium, DPR 1), with level 2 chosen, seed 3 and Run pressed. One first-screen screenshot of each went to a separate fresh agent, which was given only the image and this prompt: "In one sentence each: what is being tested, and what is the current result?" Neither agent saw the other page or any context.

- Old page: the live `https://musharna.github.io/pollination-morphology/sandbox.html`, master f080dd5.
- New page: the `visual` branch at fa1aa1d, built locally.

## Answers, verbatim

**Old page (live):**
1. The screen tests whether two flower lineages, started a chosen distance apart on the pollinator's body, stay two separate kinds over generations. This is "level 2, secondary contact" in the pollination field sim, and the only winning outcome is "HELD".
2. This run lost: one lineage died out ("win: lost: one lost; only HELD wins"). The settings were seed 3, 30 flowers, 35 generations, 160 contact sites per flower, target d 8 (realised 8.136) and placement mating, which fits the on-screen note that placement alone gives HELD in 0 of 5 runs at every target d.

**New page (visual branch):**
1. The screenshot shows a test of whether the two founding pollen lineages "stay two kinds" (reach the HELD outcome) in the pollination sim's "level 2, secondary contact" scenario, run with seed 3, N 30, 35 generations, siteN 160 and target d 8.
2. The run lost with the fate "one lost": lineage 2 recruited nothing (the final labels were 30 lineage 1, 0 lineage 2, 0 mixed), and ancestry variance fell from 0.25 at founding to 0.000, well below the 0.1 HELD line.

## Verdict

**PASS on the plan's criterion:** the new page's reader names the test (whether two lineages stay separate across generations) and the fate correctly, and the old page's reader does not do better.

**No measured gain:** the old page's reader also got both right. At level 2 the old page was already legible in ten seconds, through its level brief and win line. This test shows no legibility gain from the rebuild. The new reader drew its result from the heat and variance strip ("ancestry variance fell … below the 0.1 HELD line"), whereas the old reader drew it from the text. That is a change in what carries the answer. It is not evidence of a better reading.

**Mis-attribution in the new reading:** the new reader wrote "lineage 2 recruited nothing". The page's "0 of 35 generations recruited nothing" refers to stalled generations, while "0 lineage 2" is the final label count. The reader merged the two lines into one wrong statement.
