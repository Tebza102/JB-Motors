# Visual Export QA Skill

## Purpose
Prevent false-positive completion claims by requiring visual inspection of real export outputs.

## Mandatory QA Flow
1. Open normal web route.
2. Open print/export route.
3. Inspect print preview.
4. Inspect all PDF pages.
5. Compare with reference direction.
6. Log pass/fail with defects.

## Required Checks
- navbar included in PDF
- text under fixed headers
- clipped buttons
- bad page breaks
- horizontal overflow
- missing backgrounds
- weak contrast
- duplicated content
- quiet inner pages
- graphics only on cover
- graphics causing clipping
- mismatch against reference direction

## Required Output
1. route tested
2. test matrix
3. defects and severity
4. visual evidence notes
5. regression risk notes
