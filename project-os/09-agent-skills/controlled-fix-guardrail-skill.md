# Controlled Fix Guardrail Skill

## Purpose
Keep targeted fixes scoped and safe, especially for layout/export/responsiveness defects.

## Mandatory Guardrails
- Preserve what the user said is closest or preferred.
- Fix only the stated issue.
- No redesign unless explicitly requested.
- No unrelated refactors.
- No package changes without approval.
- No env/config changes without approval.
- No global layout changes unless required.
- Apply smallest safe fix first.

## Use Especially When
- user says one version is closest to desired
- previous fixes made result worse
- task is PDF/layout/spacing/clipping/responsiveness

## Stop Conditions
- if root cause touches high-risk architecture
- if fix requires cross-system refactor
- if change scope exceeds approved boundary

## Required Output
1. scoped issue statement
2. preserved elements list
3. minimal fix plan
4. regression checks
5. remaining risks
