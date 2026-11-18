# Product Scope — Olaa Habits

## Purpose
Independent habit tracking and personal growth platform

## In scope
Habits, routines, goals, streaks, milestones, calendar, reminders, analytics and optional integrations with learning activity.

## Out of scope
Lesson content authoring, notebook editor, handwriting canvas and PDF workspace.

## Integrations
- Olaa Identity (`olaa-platform`, branch 00.03): shared authentication (contract pending).
- Olaa Platform (`olaa-platform`): shared platform services (contracts pending).
- Other Olaa products: optional integrations only through approved contracts.

## Boundary rule
This repository owns its product domain. Other products must not directly modify its data or import its internal implementation.

## Scope change process
Changes to scope must be reviewed and documented before implementation.
