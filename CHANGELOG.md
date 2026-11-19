# Changelog

All notable changes will be recorded here. Until the first release, this repository is in pre-development foundation stage.

## Unreleased
- Repository foundation initialized.
- MVP web app (React + Vite + TypeScript, same stack as olaa-language, platform ADR-0003):
  - Habits with icon, colour and schedule (every day, chosen weekdays, N times a week); archive and restore.
  - Today page with one-tap check-ins and per-habit streaks.
  - Streak freezes (2 per month, today or later).
  - Month calendar with done / partial / missed / frozen days and 2-day correction window.
  - Badges kept once earned.
  - Olaa ID sign-in and sync to Firestore `habits/{uid}` (platform ADR-0004).
  - Firebase Hosting config for site `olaa-habits`; GitHub Actions CI.
- Automatic habits from Olaa Language (REQ-02-010/011/014/015): "reach the daily goal" or "finish N new lessons";
  check-ins are recomputed from Firestore `events/`, no manual check button, "Học ngay" opens Language.
- Ecosystem PRD v1.0, Habits core (§7):
  - Habit kinds: done/not done, quantity (target + unit) and duration (minutes); optional description.
  - Check-ins: done, partial (below target), skipped, note; previous versions kept per entry.
  - Plan history: changing the schedule or target applies from today; past days keep the old plan.
  - Consistency: 30-day completion rate (done ÷ scheduled opportunities), separate from streaks.
  - Pause and resume (vacation, illness, rest); paused days neither count nor break streaks.
  - Calendar shows skipped days; day panel edits amounts and skips.
  - Saved data version 2 with automatic migration from version 1 (device and account).
