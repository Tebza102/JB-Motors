# PDF Document Export Skill

## Purpose
Prevent PDF and print-export layout failures while preserving approved brand design.

## Core Rules
- Website routes and export routes are separate layout contexts.
- Use dedicated print/export routes where possible.
- Hide website chrome during export: navbars, login buttons, floating CTAs, headers, sidebars, cookie banners, interactive controls.
- Do not fix export issues by flattening or removing design quality.
- Visual PDF QA is mandatory before completion.

## Print-Safe CSS Requirements
- `@page` size A4
- safe margins
- `print-color-adjust: exact`
- overflow visible
- no fixed/sticky positioning inside PDF document root
- no clipping parent containers
- controlled page-break and `break-inside` rules

## Failure Modes To Check
- navbar included in PDF
- text sliding under fixed headers
- clipped buttons
- cut-off page edges
- bad page breaks
- missing backgrounds

## Required Output
1. export route strategy
2. print-safe rule list
3. UI-chrome hide list
4. PDF QA result
5. remaining risks
