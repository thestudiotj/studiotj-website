# Session 12c-pricing Cleanup Report

Generated: 2026-05-11. Source: `scripts/_unmatched.txt` from `--update --dry-run`.
This file drives data-cleanup decisions before re-running `--update` for real.
No MDX files were modified this session.

## Category Summary

| Category | Count | Decision needed |
|---|---|---|
| Canvas-framed at fictional sizes (landscape) | 108 | Delete or remap to real portrait sizes |
| Framed prints at fictional sizes (A1, A2) | 108 | Delete -- Prodigi framed stops at A3 |
| Framed prints real sizes, colors not in CSV (A3/A4 black+white) | 108 | Fetch missing CSV rows OR delete if Prodigi does not offer |
| Cards at fictional size (5.5x5.5" square) | 120 | Delete -- Prodigi Mohawk does not offer square |
| Cards at fictional tier (single, real sizes 6x4" and 7x5") | 48 | Delete -- Prodigi does not sell single cards |
| Other (root cause unknown) | 1 | Investigate individually |
| **Total** | **493** | |

---

## 1. Canvas-framed at fictional sizes (108 files)

**Root cause:** Session 12a generated canvas-framed MDX at landscape orientations
(16x12", 20x16", 30x20", 36x24") that Prodigi does not stock.
Real Prodigi canvas-framed sizes are portrait: 12x16, 16x20, 20x24, 24x32, 30x40.

**Decision options:**
- Delete all 108 files (simplest -- framed canvas portrait variants already match)
- Remap sizes to the corresponding portrait (e.g. 16x12 -> 12x16) and regenerate

- photo-atmospheric-leiden-017-canf-16x12.mdx
- photo-atmospheric-leiden-017-canf-20x16.mdx
- photo-atmospheric-leiden-017-canf-30x20.mdx
- photo-atmospheric-leiden-017-canf-36x24.mdx
- photo-atmospheric-leiden-068-canf-16x12.mdx
- photo-atmospheric-leiden-068-canf-20x16.mdx
- photo-atmospheric-leiden-068-canf-30x20.mdx
- photo-atmospheric-leiden-068-canf-36x24.mdx
- photo-atmospheric-leiden-074-canf-16x12.mdx
- photo-atmospheric-leiden-074-canf-20x16.mdx
- photo-atmospheric-leiden-074-canf-30x20.mdx
- photo-atmospheric-leiden-074-canf-36x24.mdx
- photo-atmospheric-leiden-091-canf-16x12.mdx
- photo-atmospheric-leiden-091-canf-20x16.mdx
- photo-atmospheric-leiden-091-canf-30x20.mdx
- photo-atmospheric-leiden-091-canf-36x24.mdx
- photo-atmospheric-leiden-122-canf-16x12.mdx
- photo-atmospheric-leiden-122-canf-20x16.mdx
- photo-atmospheric-leiden-122-canf-30x20.mdx
- photo-atmospheric-leiden-122-canf-36x24.mdx
- photo-atmospheric-leiden-151-canf-16x12.mdx
- photo-atmospheric-leiden-151-canf-20x16.mdx
- photo-atmospheric-leiden-151-canf-30x20.mdx
- photo-atmospheric-leiden-151-canf-36x24.mdx
- photo-atmospheric-leiden-167-canf-16x12.mdx
- photo-atmospheric-leiden-167-canf-20x16.mdx
- photo-atmospheric-leiden-167-canf-30x20.mdx
- photo-atmospheric-leiden-167-canf-36x24.mdx
- photo-halcyon-katwijk-221-canf-16x12.mdx
- photo-halcyon-katwijk-221-canf-20x16.mdx
- photo-halcyon-katwijk-221-canf-30x20.mdx
- photo-halcyon-katwijk-221-canf-36x24.mdx
- photo-halcyon-katwijk-275-canf-16x12.mdx
- photo-halcyon-katwijk-275-canf-20x16.mdx
- photo-halcyon-katwijk-275-canf-30x20.mdx
- photo-halcyon-katwijk-275-canf-36x24.mdx
- photo-halcyon-katwijk-281-canf-16x12.mdx
- photo-halcyon-katwijk-281-canf-20x16.mdx
- photo-halcyon-katwijk-281-canf-30x20.mdx
- photo-halcyon-katwijk-281-canf-36x24.mdx
- photo-halcyon-katwijk-293-canf-16x12.mdx
- photo-halcyon-katwijk-293-canf-20x16.mdx
- photo-halcyon-katwijk-293-canf-30x20.mdx
- photo-halcyon-katwijk-293-canf-36x24.mdx
- photo-halcyon-katwijk-315-canf-16x12.mdx
- photo-halcyon-katwijk-315-canf-20x16.mdx
- photo-halcyon-katwijk-315-canf-30x20.mdx
- photo-halcyon-katwijk-315-canf-36x24.mdx
- photo-halcyon-katwijk-338-canf-16x12.mdx
- photo-halcyon-katwijk-338-canf-20x16.mdx
- photo-halcyon-katwijk-338-canf-30x20.mdx
- photo-halcyon-katwijk-338-canf-36x24.mdx
- photo-halcyon-katwijk-405-canf-16x12.mdx
- photo-halcyon-katwijk-405-canf-20x16.mdx
- photo-halcyon-katwijk-405-canf-30x20.mdx
- photo-halcyon-katwijk-405-canf-36x24.mdx
- photo-halcyon-katwijk-444-canf-16x12.mdx
- photo-halcyon-katwijk-444-canf-20x16.mdx
- photo-halcyon-katwijk-444-canf-30x20.mdx
- photo-halcyon-katwijk-444-canf-36x24.mdx
- photo-halcyon-roelof-068-canf-16x12.mdx
- photo-halcyon-roelof-068-canf-20x16.mdx
- photo-halcyon-roelof-068-canf-30x20.mdx
- photo-halcyon-roelof-068-canf-36x24.mdx
- photo-halcyon-roelof-159-canf-16x12.mdx
- photo-halcyon-roelof-159-canf-20x16.mdx
- photo-halcyon-roelof-159-canf-30x20.mdx
- photo-halcyon-roelof-159-canf-36x24.mdx
- photo-halcyon-roelof-182-canf-16x12.mdx
- photo-halcyon-roelof-182-canf-20x16.mdx
- photo-halcyon-roelof-182-canf-30x20.mdx
- photo-halcyon-roelof-182-canf-36x24.mdx
- photo-mono-asp-240-canf-16x12.mdx
- photo-mono-asp-240-canf-20x16.mdx
- photo-mono-asp-240-canf-30x20.mdx
- photo-mono-asp-240-canf-36x24.mdx
- photo-mono-asp-272-canf-16x12.mdx
- photo-mono-asp-272-canf-20x16.mdx
- photo-mono-asp-272-canf-30x20.mdx
- photo-mono-asp-272-canf-36x24.mdx
- photo-mono-asp-273-canf-16x12.mdx
- photo-mono-asp-273-canf-20x16.mdx
- photo-mono-asp-273-canf-30x20.mdx
- photo-mono-asp-273-canf-36x24.mdx
- photo-mono-asp-312-canf-16x12.mdx
- photo-mono-asp-312-canf-20x16.mdx
- photo-mono-asp-312-canf-30x20.mdx
- photo-mono-asp-312-canf-36x24.mdx
- photo-signature-thehague-148-canf-16x12.mdx
- photo-signature-thehague-148-canf-20x16.mdx
- photo-signature-thehague-148-canf-30x20.mdx
- photo-signature-thehague-148-canf-36x24.mdx
- photo-signature-thehague-153-canf-16x12.mdx
- photo-signature-thehague-153-canf-20x16.mdx
- photo-signature-thehague-153-canf-30x20.mdx
- photo-signature-thehague-153-canf-36x24.mdx
- photo-signature-thehague-187-canf-16x12.mdx
- photo-signature-thehague-187-canf-20x16.mdx
- photo-signature-thehague-187-canf-30x20.mdx
- photo-signature-thehague-187-canf-36x24.mdx
- photo-signature-thehague-194-canf-16x12.mdx
- photo-signature-thehague-194-canf-20x16.mdx
- photo-signature-thehague-194-canf-30x20.mdx
- photo-signature-thehague-194-canf-36x24.mdx
- photo-signature-thehague-218-canf-16x12.mdx
- photo-signature-thehague-218-canf-20x16.mdx
- photo-signature-thehague-218-canf-30x20.mdx
- photo-signature-thehague-218-canf-36x24.mdx

## 2. Framed prints at fictional sizes A1, A2 (108 files)

**Root cause:** Prodigi framed art prints start at A3. A1 and A2 sizes were not
captured at the Prodigi dashboard because they are not offered.

**Decision:** Delete all 108 files.

- photo-atmospheric-leiden-017-fap-a1-black.mdx
- photo-atmospheric-leiden-017-fap-a1-white.mdx
- photo-atmospheric-leiden-017-fap-a2-black.mdx
- photo-atmospheric-leiden-017-fap-a2-white.mdx
- photo-atmospheric-leiden-068-fap-a1-black.mdx
- photo-atmospheric-leiden-068-fap-a1-white.mdx
- photo-atmospheric-leiden-068-fap-a2-black.mdx
- photo-atmospheric-leiden-068-fap-a2-white.mdx
- photo-atmospheric-leiden-074-fap-a1-black.mdx
- photo-atmospheric-leiden-074-fap-a1-white.mdx
- photo-atmospheric-leiden-074-fap-a2-black.mdx
- photo-atmospheric-leiden-074-fap-a2-white.mdx
- photo-atmospheric-leiden-091-fap-a1-black.mdx
- photo-atmospheric-leiden-091-fap-a1-white.mdx
- photo-atmospheric-leiden-091-fap-a2-black.mdx
- photo-atmospheric-leiden-091-fap-a2-white.mdx
- photo-atmospheric-leiden-122-fap-a1-black.mdx
- photo-atmospheric-leiden-122-fap-a1-white.mdx
- photo-atmospheric-leiden-122-fap-a2-black.mdx
- photo-atmospheric-leiden-122-fap-a2-white.mdx
- photo-atmospheric-leiden-151-fap-a1-black.mdx
- photo-atmospheric-leiden-151-fap-a1-white.mdx
- photo-atmospheric-leiden-151-fap-a2-black.mdx
- photo-atmospheric-leiden-151-fap-a2-white.mdx
- photo-atmospheric-leiden-167-fap-a1-black.mdx
- photo-atmospheric-leiden-167-fap-a1-white.mdx
- photo-atmospheric-leiden-167-fap-a2-black.mdx
- photo-atmospheric-leiden-167-fap-a2-white.mdx
- photo-halcyon-katwijk-221-fap-a1-black.mdx
- photo-halcyon-katwijk-221-fap-a1-white.mdx
- photo-halcyon-katwijk-221-fap-a2-black.mdx
- photo-halcyon-katwijk-221-fap-a2-white.mdx
- photo-halcyon-katwijk-275-fap-a1-black.mdx
- photo-halcyon-katwijk-275-fap-a1-white.mdx
- photo-halcyon-katwijk-275-fap-a2-black.mdx
- photo-halcyon-katwijk-275-fap-a2-white.mdx
- photo-halcyon-katwijk-281-fap-a1-black.mdx
- photo-halcyon-katwijk-281-fap-a1-white.mdx
- photo-halcyon-katwijk-281-fap-a2-black.mdx
- photo-halcyon-katwijk-281-fap-a2-white.mdx
- photo-halcyon-katwijk-293-fap-a1-black.mdx
- photo-halcyon-katwijk-293-fap-a1-white.mdx
- photo-halcyon-katwijk-293-fap-a2-black.mdx
- photo-halcyon-katwijk-293-fap-a2-white.mdx
- photo-halcyon-katwijk-315-fap-a1-black.mdx
- photo-halcyon-katwijk-315-fap-a1-white.mdx
- photo-halcyon-katwijk-315-fap-a2-black.mdx
- photo-halcyon-katwijk-315-fap-a2-white.mdx
- photo-halcyon-katwijk-338-fap-a1-black.mdx
- photo-halcyon-katwijk-338-fap-a1-white.mdx
- photo-halcyon-katwijk-338-fap-a2-black.mdx
- photo-halcyon-katwijk-338-fap-a2-white.mdx
- photo-halcyon-katwijk-405-fap-a1-black.mdx
- photo-halcyon-katwijk-405-fap-a1-white.mdx
- photo-halcyon-katwijk-405-fap-a2-black.mdx
- photo-halcyon-katwijk-405-fap-a2-white.mdx
- photo-halcyon-katwijk-444-fap-a1-black.mdx
- photo-halcyon-katwijk-444-fap-a1-white.mdx
- photo-halcyon-katwijk-444-fap-a2-black.mdx
- photo-halcyon-katwijk-444-fap-a2-white.mdx
- photo-halcyon-roelof-068-fap-a1-black.mdx
- photo-halcyon-roelof-068-fap-a1-white.mdx
- photo-halcyon-roelof-068-fap-a2-black.mdx
- photo-halcyon-roelof-068-fap-a2-white.mdx
- photo-halcyon-roelof-159-fap-a1-black.mdx
- photo-halcyon-roelof-159-fap-a1-white.mdx
- photo-halcyon-roelof-159-fap-a2-black.mdx
- photo-halcyon-roelof-159-fap-a2-white.mdx
- photo-halcyon-roelof-182-fap-a1-black.mdx
- photo-halcyon-roelof-182-fap-a1-white.mdx
- photo-halcyon-roelof-182-fap-a2-black.mdx
- photo-halcyon-roelof-182-fap-a2-white.mdx
- photo-mono-asp-240-fap-a1-black.mdx
- photo-mono-asp-240-fap-a1-white.mdx
- photo-mono-asp-240-fap-a2-black.mdx
- photo-mono-asp-240-fap-a2-white.mdx
- photo-mono-asp-272-fap-a1-black.mdx
- photo-mono-asp-272-fap-a1-white.mdx
- photo-mono-asp-272-fap-a2-black.mdx
- photo-mono-asp-272-fap-a2-white.mdx
- photo-mono-asp-273-fap-a1-black.mdx
- photo-mono-asp-273-fap-a1-white.mdx
- photo-mono-asp-273-fap-a2-black.mdx
- photo-mono-asp-273-fap-a2-white.mdx
- photo-mono-asp-312-fap-a1-black.mdx
- photo-mono-asp-312-fap-a1-white.mdx
- photo-mono-asp-312-fap-a2-black.mdx
- photo-mono-asp-312-fap-a2-white.mdx
- photo-signature-thehague-148-fap-a1-black.mdx
- photo-signature-thehague-148-fap-a1-white.mdx
- photo-signature-thehague-148-fap-a2-black.mdx
- photo-signature-thehague-148-fap-a2-white.mdx
- photo-signature-thehague-153-fap-a1-black.mdx
- photo-signature-thehague-153-fap-a1-white.mdx
- photo-signature-thehague-153-fap-a2-black.mdx
- photo-signature-thehague-153-fap-a2-white.mdx
- photo-signature-thehague-187-fap-a1-black.mdx
- photo-signature-thehague-187-fap-a1-white.mdx
- photo-signature-thehague-187-fap-a2-black.mdx
- photo-signature-thehague-187-fap-a2-white.mdx
- photo-signature-thehague-194-fap-a1-black.mdx
- photo-signature-thehague-194-fap-a1-white.mdx
- photo-signature-thehague-194-fap-a2-black.mdx
- photo-signature-thehague-194-fap-a2-white.mdx
- photo-signature-thehague-218-fap-a1-black.mdx
- photo-signature-thehague-218-fap-a1-white.mdx
- photo-signature-thehague-218-fap-a2-black.mdx
- photo-signature-thehague-218-fap-a2-white.mdx

## 3. Framed prints real sizes (A3/A4), missing CSV color data (108 files)

**Root cause:** A3 and A4 framed are real Prodigi sizes. However, the pricing CSV
only captured natural-oak frame color (those matched). Black and white frame colors
are not present in the CSV download, so the CSV-lookup-or-fail script logic returns
unmatched for these 108 files.

**Decision options:**
- Re-download the framed prints CSV from the Prodigi dashboard ensuring black and
  white frame columns are included, then re-run the dry-run.
- If Prodigi genuinely does not offer black/white frames, delete these 108 files.

- photo-atmospheric-leiden-017-fap-a3-black.mdx
- photo-atmospheric-leiden-017-fap-a3-white.mdx
- photo-atmospheric-leiden-017-fap-a4-black.mdx
- photo-atmospheric-leiden-017-fap-a4-white.mdx
- photo-atmospheric-leiden-068-fap-a3-black.mdx
- photo-atmospheric-leiden-068-fap-a3-white.mdx
- photo-atmospheric-leiden-068-fap-a4-black.mdx
- photo-atmospheric-leiden-068-fap-a4-white.mdx
- photo-atmospheric-leiden-074-fap-a3-black.mdx
- photo-atmospheric-leiden-074-fap-a3-white.mdx
- photo-atmospheric-leiden-074-fap-a4-black.mdx
- photo-atmospheric-leiden-074-fap-a4-white.mdx
- photo-atmospheric-leiden-091-fap-a3-black.mdx
- photo-atmospheric-leiden-091-fap-a3-white.mdx
- photo-atmospheric-leiden-091-fap-a4-black.mdx
- photo-atmospheric-leiden-091-fap-a4-white.mdx
- photo-atmospheric-leiden-122-fap-a3-black.mdx
- photo-atmospheric-leiden-122-fap-a3-white.mdx
- photo-atmospheric-leiden-122-fap-a4-black.mdx
- photo-atmospheric-leiden-122-fap-a4-white.mdx
- photo-atmospheric-leiden-151-fap-a3-black.mdx
- photo-atmospheric-leiden-151-fap-a3-white.mdx
- photo-atmospheric-leiden-151-fap-a4-black.mdx
- photo-atmospheric-leiden-151-fap-a4-white.mdx
- photo-atmospheric-leiden-167-fap-a3-black.mdx
- photo-atmospheric-leiden-167-fap-a3-white.mdx
- photo-atmospheric-leiden-167-fap-a4-black.mdx
- photo-atmospheric-leiden-167-fap-a4-white.mdx
- photo-halcyon-katwijk-221-fap-a3-black.mdx
- photo-halcyon-katwijk-221-fap-a3-white.mdx
- photo-halcyon-katwijk-221-fap-a4-black.mdx
- photo-halcyon-katwijk-221-fap-a4-white.mdx
- photo-halcyon-katwijk-275-fap-a3-black.mdx
- photo-halcyon-katwijk-275-fap-a3-white.mdx
- photo-halcyon-katwijk-275-fap-a4-black.mdx
- photo-halcyon-katwijk-275-fap-a4-white.mdx
- photo-halcyon-katwijk-281-fap-a3-black.mdx
- photo-halcyon-katwijk-281-fap-a3-white.mdx
- photo-halcyon-katwijk-281-fap-a4-black.mdx
- photo-halcyon-katwijk-281-fap-a4-white.mdx
- photo-halcyon-katwijk-293-fap-a3-black.mdx
- photo-halcyon-katwijk-293-fap-a3-white.mdx
- photo-halcyon-katwijk-293-fap-a4-black.mdx
- photo-halcyon-katwijk-293-fap-a4-white.mdx
- photo-halcyon-katwijk-315-fap-a3-black.mdx
- photo-halcyon-katwijk-315-fap-a3-white.mdx
- photo-halcyon-katwijk-315-fap-a4-black.mdx
- photo-halcyon-katwijk-315-fap-a4-white.mdx
- photo-halcyon-katwijk-338-fap-a3-black.mdx
- photo-halcyon-katwijk-338-fap-a3-white.mdx
- photo-halcyon-katwijk-338-fap-a4-black.mdx
- photo-halcyon-katwijk-338-fap-a4-white.mdx
- photo-halcyon-katwijk-405-fap-a3-black.mdx
- photo-halcyon-katwijk-405-fap-a3-white.mdx
- photo-halcyon-katwijk-405-fap-a4-black.mdx
- photo-halcyon-katwijk-405-fap-a4-white.mdx
- photo-halcyon-katwijk-444-fap-a3-black.mdx
- photo-halcyon-katwijk-444-fap-a3-white.mdx
- photo-halcyon-katwijk-444-fap-a4-black.mdx
- photo-halcyon-katwijk-444-fap-a4-white.mdx
- photo-halcyon-roelof-068-fap-a3-black.mdx
- photo-halcyon-roelof-068-fap-a3-white.mdx
- photo-halcyon-roelof-068-fap-a4-black.mdx
- photo-halcyon-roelof-068-fap-a4-white.mdx
- photo-halcyon-roelof-159-fap-a3-black.mdx
- photo-halcyon-roelof-159-fap-a3-white.mdx
- photo-halcyon-roelof-159-fap-a4-black.mdx
- photo-halcyon-roelof-159-fap-a4-white.mdx
- photo-halcyon-roelof-182-fap-a3-black.mdx
- photo-halcyon-roelof-182-fap-a3-white.mdx
- photo-halcyon-roelof-182-fap-a4-black.mdx
- photo-halcyon-roelof-182-fap-a4-white.mdx
- photo-mono-asp-240-fap-a3-black.mdx
- photo-mono-asp-240-fap-a3-white.mdx
- photo-mono-asp-240-fap-a4-black.mdx
- photo-mono-asp-240-fap-a4-white.mdx
- photo-mono-asp-272-fap-a3-black.mdx
- photo-mono-asp-272-fap-a3-white.mdx
- photo-mono-asp-272-fap-a4-black.mdx
- photo-mono-asp-272-fap-a4-white.mdx
- photo-mono-asp-273-fap-a3-black.mdx
- photo-mono-asp-273-fap-a3-white.mdx
- photo-mono-asp-273-fap-a4-black.mdx
- photo-mono-asp-273-fap-a4-white.mdx
- photo-mono-asp-312-fap-a3-black.mdx
- photo-mono-asp-312-fap-a3-white.mdx
- photo-mono-asp-312-fap-a4-black.mdx
- photo-mono-asp-312-fap-a4-white.mdx
- photo-signature-thehague-148-fap-a3-black.mdx
- photo-signature-thehague-148-fap-a3-white.mdx
- photo-signature-thehague-148-fap-a4-black.mdx
- photo-signature-thehague-148-fap-a4-white.mdx
- photo-signature-thehague-153-fap-a3-black.mdx
- photo-signature-thehague-153-fap-a3-white.mdx
- photo-signature-thehague-153-fap-a4-black.mdx
- photo-signature-thehague-153-fap-a4-white.mdx
- photo-signature-thehague-187-fap-a3-black.mdx
- photo-signature-thehague-187-fap-a3-white.mdx
- photo-signature-thehague-187-fap-a4-black.mdx
- photo-signature-thehague-187-fap-a4-white.mdx
- photo-signature-thehague-194-fap-a3-black.mdx
- photo-signature-thehague-194-fap-a3-white.mdx
- photo-signature-thehague-194-fap-a4-black.mdx
- photo-signature-thehague-194-fap-a4-white.mdx
- photo-signature-thehague-218-fap-a3-black.mdx
- photo-signature-thehague-218-fap-a3-white.mdx
- photo-signature-thehague-218-fap-a4-black.mdx
- photo-signature-thehague-218-fap-a4-white.mdx

## 4. Cards at fictional size 5.5x5.5" square (120 files)

**Root cause:** Prodigi does not offer 5.5x5.5" square Mohawk greeting cards.
Session 12a generated these in all five pack tiers (single/10/20/50/100).

**Decision:** Delete all 120 files.

- photo-atmospheric-leiden-017-gre-5x5-pack10.mdx
- photo-atmospheric-leiden-017-gre-5x5-pack100.mdx
- photo-atmospheric-leiden-017-gre-5x5-pack20.mdx
- photo-atmospheric-leiden-017-gre-5x5-pack50.mdx
- photo-atmospheric-leiden-017-gre-5x5-single.mdx
- photo-atmospheric-leiden-068-gre-5x5-pack10.mdx
- photo-atmospheric-leiden-068-gre-5x5-pack100.mdx
- photo-atmospheric-leiden-068-gre-5x5-pack20.mdx
- photo-atmospheric-leiden-068-gre-5x5-pack50.mdx
- photo-atmospheric-leiden-068-gre-5x5-single.mdx
- photo-atmospheric-leiden-074-gre-5x5-pack10.mdx
- photo-atmospheric-leiden-074-gre-5x5-pack100.mdx
- photo-atmospheric-leiden-074-gre-5x5-pack20.mdx
- photo-atmospheric-leiden-074-gre-5x5-pack50.mdx
- photo-atmospheric-leiden-074-gre-5x5-single.mdx
- photo-atmospheric-leiden-091-gre-5x5-pack10.mdx
- photo-atmospheric-leiden-091-gre-5x5-pack100.mdx
- photo-atmospheric-leiden-091-gre-5x5-pack20.mdx
- photo-atmospheric-leiden-091-gre-5x5-pack50.mdx
- photo-atmospheric-leiden-091-gre-5x5-single.mdx
- photo-atmospheric-leiden-122-gre-5x5-pack10.mdx
- photo-atmospheric-leiden-122-gre-5x5-pack100.mdx
- photo-atmospheric-leiden-122-gre-5x5-pack20.mdx
- photo-atmospheric-leiden-122-gre-5x5-pack50.mdx
- photo-atmospheric-leiden-122-gre-5x5-single.mdx
- photo-atmospheric-leiden-151-gre-5x5-pack10.mdx
- photo-atmospheric-leiden-151-gre-5x5-pack100.mdx
- photo-atmospheric-leiden-151-gre-5x5-pack20.mdx
- photo-atmospheric-leiden-151-gre-5x5-pack50.mdx
- photo-atmospheric-leiden-151-gre-5x5-single.mdx
- photo-atmospheric-leiden-167-gre-5x5-pack10.mdx
- photo-atmospheric-leiden-167-gre-5x5-pack100.mdx
- photo-atmospheric-leiden-167-gre-5x5-pack20.mdx
- photo-atmospheric-leiden-167-gre-5x5-pack50.mdx
- photo-atmospheric-leiden-167-gre-5x5-single.mdx
- photo-halcyon-katwijk-221-gre-5x5-pack10.mdx
- photo-halcyon-katwijk-221-gre-5x5-pack100.mdx
- photo-halcyon-katwijk-221-gre-5x5-pack20.mdx
- photo-halcyon-katwijk-221-gre-5x5-pack50.mdx
- photo-halcyon-katwijk-221-gre-5x5-single.mdx
- photo-halcyon-katwijk-275-gre-5x5-pack10.mdx
- photo-halcyon-katwijk-275-gre-5x5-pack100.mdx
- photo-halcyon-katwijk-275-gre-5x5-pack20.mdx
- photo-halcyon-katwijk-275-gre-5x5-pack50.mdx
- photo-halcyon-katwijk-275-gre-5x5-single.mdx
- photo-halcyon-katwijk-281-gre-5x5-pack10.mdx
- photo-halcyon-katwijk-281-gre-5x5-pack100.mdx
- photo-halcyon-katwijk-281-gre-5x5-pack20.mdx
- photo-halcyon-katwijk-281-gre-5x5-pack50.mdx
- photo-halcyon-katwijk-281-gre-5x5-single.mdx
- photo-halcyon-katwijk-293-gre-5x5-pack10.mdx
- photo-halcyon-katwijk-293-gre-5x5-pack100.mdx
- photo-halcyon-katwijk-293-gre-5x5-pack20.mdx
- photo-halcyon-katwijk-293-gre-5x5-pack50.mdx
- photo-halcyon-katwijk-293-gre-5x5-single.mdx
- photo-halcyon-katwijk-315-gre-5x5-pack10.mdx
- photo-halcyon-katwijk-315-gre-5x5-pack100.mdx
- photo-halcyon-katwijk-315-gre-5x5-pack20.mdx
- photo-halcyon-katwijk-315-gre-5x5-pack50.mdx
- photo-halcyon-katwijk-315-gre-5x5-single.mdx
- photo-halcyon-katwijk-338-gre-5x5-pack10.mdx
- photo-halcyon-katwijk-338-gre-5x5-pack100.mdx
- photo-halcyon-katwijk-338-gre-5x5-pack20.mdx
- photo-halcyon-katwijk-338-gre-5x5-pack50.mdx
- photo-halcyon-katwijk-338-gre-5x5-single.mdx
- photo-halcyon-katwijk-405-gre-5x5-pack10.mdx
- photo-halcyon-katwijk-405-gre-5x5-pack100.mdx
- photo-halcyon-katwijk-405-gre-5x5-pack20.mdx
- photo-halcyon-katwijk-405-gre-5x5-pack50.mdx
- photo-halcyon-katwijk-405-gre-5x5-single.mdx
- photo-halcyon-katwijk-444-gre-5x5-pack10.mdx
- photo-halcyon-katwijk-444-gre-5x5-pack100.mdx
- photo-halcyon-katwijk-444-gre-5x5-pack20.mdx
- photo-halcyon-katwijk-444-gre-5x5-pack50.mdx
- photo-halcyon-katwijk-444-gre-5x5-single.mdx
- photo-halcyon-roelof-068-gre-5x5-pack10.mdx
- photo-halcyon-roelof-068-gre-5x5-pack100.mdx
- photo-halcyon-roelof-068-gre-5x5-pack20.mdx
- photo-halcyon-roelof-068-gre-5x5-pack50.mdx
- photo-halcyon-roelof-068-gre-5x5-single.mdx
- photo-halcyon-roelof-159-gre-5x5-pack10.mdx
- photo-halcyon-roelof-159-gre-5x5-pack100.mdx
- photo-halcyon-roelof-159-gre-5x5-pack20.mdx
- photo-halcyon-roelof-159-gre-5x5-pack50.mdx
- photo-halcyon-roelof-159-gre-5x5-single.mdx
- photo-halcyon-roelof-182-gre-5x5-pack10.mdx
- photo-halcyon-roelof-182-gre-5x5-pack100.mdx
- photo-halcyon-roelof-182-gre-5x5-pack20.mdx
- photo-halcyon-roelof-182-gre-5x5-pack50.mdx
- photo-halcyon-roelof-182-gre-5x5-single.mdx
- photo-mono-asp-240-gre-5x5-pack10.mdx
- photo-mono-asp-240-gre-5x5-pack100.mdx
- photo-mono-asp-240-gre-5x5-pack20.mdx
- photo-mono-asp-240-gre-5x5-pack50.mdx
- photo-mono-asp-240-gre-5x5-single.mdx
- photo-mono-asp-272-gre-5x5-pack10.mdx
- photo-mono-asp-272-gre-5x5-pack100.mdx
- photo-mono-asp-272-gre-5x5-pack20.mdx
- photo-mono-asp-272-gre-5x5-pack50.mdx
- photo-mono-asp-272-gre-5x5-single.mdx
- photo-mono-asp-273-gre-5x5-pack10.mdx
- photo-mono-asp-273-gre-5x5-pack100.mdx
- photo-mono-asp-273-gre-5x5-pack20.mdx
- photo-mono-asp-273-gre-5x5-pack50.mdx
- photo-mono-asp-273-gre-5x5-single.mdx
- photo-mono-asp-312-gre-5x5-pack10.mdx
- photo-mono-asp-312-gre-5x5-pack100.mdx
- photo-mono-asp-312-gre-5x5-pack20.mdx
- photo-mono-asp-312-gre-5x5-pack50.mdx
- photo-mono-asp-312-gre-5x5-single.mdx
- photo-signature-thehague-148-gre-5x5-pack10.mdx
- photo-signature-thehague-148-gre-5x5-pack100.mdx
- photo-signature-thehague-148-gre-5x5-pack20.mdx
- photo-signature-thehague-148-gre-5x5-pack50.mdx
- photo-signature-thehague-148-gre-5x5-single.mdx
- photo-signature-thehague-153-gre-5x5-pack10.mdx
- photo-signature-thehague-153-gre-5x5-pack100.mdx
- photo-signature-thehague-153-gre-5x5-pack20.mdx
- photo-signature-thehague-153-gre-5x5-pack50.mdx
- photo-signature-thehague-153-gre-5x5-single.mdx

## 5. Cards at fictional tier (single) for real sizes (48 files)

**Root cause:** Prodigi Mohawk greeting cards are sold only in packs (10/20/50/100).
Session 12a also generated a single-card tier for 6x4" and 7x5" which has no
matching Prodigi SKU. The pack variants (pack10/20/50/100) for these sizes matched.

**Decision:** Delete all 48 files.

- photo-atmospheric-leiden-017-gre-6x4-single.mdx
- photo-atmospheric-leiden-017-gre-7x5-single.mdx
- photo-atmospheric-leiden-068-gre-6x4-single.mdx
- photo-atmospheric-leiden-068-gre-7x5-single.mdx
- photo-atmospheric-leiden-074-gre-6x4-single.mdx
- photo-atmospheric-leiden-074-gre-7x5-single.mdx
- photo-atmospheric-leiden-091-gre-6x4-single.mdx
- photo-atmospheric-leiden-091-gre-7x5-single.mdx
- photo-atmospheric-leiden-122-gre-6x4-single.mdx
- photo-atmospheric-leiden-122-gre-7x5-single.mdx
- photo-atmospheric-leiden-151-gre-6x4-single.mdx
- photo-atmospheric-leiden-151-gre-7x5-single.mdx
- photo-atmospheric-leiden-167-gre-6x4-single.mdx
- photo-atmospheric-leiden-167-gre-7x5-single.mdx
- photo-halcyon-katwijk-221-gre-6x4-single.mdx
- photo-halcyon-katwijk-221-gre-7x5-single.mdx
- photo-halcyon-katwijk-275-gre-6x4-single.mdx
- photo-halcyon-katwijk-275-gre-7x5-single.mdx
- photo-halcyon-katwijk-281-gre-6x4-single.mdx
- photo-halcyon-katwijk-281-gre-7x5-single.mdx
- photo-halcyon-katwijk-293-gre-6x4-single.mdx
- photo-halcyon-katwijk-293-gre-7x5-single.mdx
- photo-halcyon-katwijk-315-gre-6x4-single.mdx
- photo-halcyon-katwijk-315-gre-7x5-single.mdx
- photo-halcyon-katwijk-338-gre-6x4-single.mdx
- photo-halcyon-katwijk-338-gre-7x5-single.mdx
- photo-halcyon-katwijk-405-gre-6x4-single.mdx
- photo-halcyon-katwijk-405-gre-7x5-single.mdx
- photo-halcyon-katwijk-444-gre-6x4-single.mdx
- photo-halcyon-katwijk-444-gre-7x5-single.mdx
- photo-halcyon-roelof-068-gre-6x4-single.mdx
- photo-halcyon-roelof-068-gre-7x5-single.mdx
- photo-halcyon-roelof-159-gre-6x4-single.mdx
- photo-halcyon-roelof-159-gre-7x5-single.mdx
- photo-halcyon-roelof-182-gre-6x4-single.mdx
- photo-halcyon-roelof-182-gre-7x5-single.mdx
- photo-mono-asp-240-gre-6x4-single.mdx
- photo-mono-asp-240-gre-7x5-single.mdx
- photo-mono-asp-272-gre-6x4-single.mdx
- photo-mono-asp-272-gre-7x5-single.mdx
- photo-mono-asp-273-gre-6x4-single.mdx
- photo-mono-asp-273-gre-7x5-single.mdx
- photo-mono-asp-312-gre-6x4-single.mdx
- photo-mono-asp-312-gre-7x5-single.mdx
- photo-signature-thehague-148-gre-6x4-single.mdx
- photo-signature-thehague-148-gre-7x5-single.mdx
- photo-signature-thehague-153-gre-6x4-single.mdx
- photo-signature-thehague-153-gre-7x5-single.mdx

## 6. Other -- root cause unknown (1 file)

**Root cause:** Frontmatter has no  field, so  returns
an empty string and the derived SKU is  (malformed -- no size token).
This is a data error in the MDX file, not a fictional product.

**Decision:** Inspect the file and add the correct  field.

- photo-halcyon-001-hpr-a3.mdx
  - reason: no SKU match (family=HPR, size=None, derived='ART-PAP-HPR-')
