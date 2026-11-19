# Olaa Habits

Habit tracking for students, with learning habits first (Habits PRD in
`olaa-platform/architecture/02-olaa-habits/requirements/PRD.md`).

## Status

MVP web app (pre-release). Same stack and layout as `olaa-language`.

Implemented (PRD P0 + sign-in/sync):
- **Habits:** create, edit, archive and restore; icon, colour, schedule (every day, chosen
  weekdays, or N times a week); done/not done, quantity or duration with a target. Starter
  habits during onboarding.
- **Humane tracking (PRD v1.0 §7.3):** skip a day, add a note, pause a habit; a schedule or
  target change applies from today and never rewrites past days; 30-day consistency shown
  next to streaks.
- **Today:** habits due today, one tap to check off, done count, streak per habit.
- **Streaks:** current and best streak. A frozen day keeps a streak without adding to it;
  "N times a week" habits count weeks.
- **Freeze:** plan busy days (today or later), 2 per month, cancel until the day passes.
- **Calendar:** month grid of done / partial / missed / frozen days, filter by habit, correct
  check-ins for today and the 2 days before, plan freezes.
- **Badges:** first check-in, streak 7 / 30 / 100, first freeze, perfect week. Kept once earned.
- **Account:** Olaa ID sign-in (Google, email) and sync to Firestore `habits/{uid}`. Without
  Firebase config the app runs local-only.
- **UI:** Vietnamese, phone / iPad / desktop layouts, keyboard and screen-reader labels,
  light and dark themes.

- **Automatic habits:** "reach the daily goal" or "finish N new lessons" in Olaa Language,
  checked from Firestore `events/` (contract `olaa-platform/contracts/events/language-events.md`).
  Needs the same Olaa account in both apps.

Not yet: speaking and flashcard signals (REQ-02-012/013), reminders (REQ-02-022/023).

## Project layout

```
src/
  app/                 App root, shell, hash router
  components/          Icons, habit badge
  features/
    habit-management/  Habit types, templates, list and form (02.01)
    scheduling/        Schedules (02.02)
    habit-tracking/    Today page (02.03)
    streaks/           Streaks and freezes (02.04)
    calendar/          Month calendar (02.07)
    gamification/      Badges (02.10)
    profile/           Stats, badges, account, settings
    onboarding/        First-run flow
    account/           Sign-in card
  services/            Local storage, Firebase, sync
  stores/              App state (pure actions) and store hook
  utils/               Dates (Monday-first weeks, local day keys)
tests/integration/     App-level tests
```

## Development

Requires Node 20+ and pnpm 9.

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

Firebase web config (public, not a secret) is in `.env.production` / `.env.development`.
Firestore rules live in `olaa-platform/infrastructure/firebase/`.

Deploy to Firebase Hosting site `olaa-habits` (create the site once with
`npx firebase-tools hosting:sites:create olaa-habits`):

```bash
pnpm build && npx firebase-tools deploy --only hosting
```

## Known debt

`src/services/firebase.ts`, `cloudSync.ts`, `syncPolicy.ts`, `src/utils/date.ts` and
`src/styles/global.css` are copied from `olaa-language`. They belong in a Shared Core package
(platform branch 04) once the package publishing decision is made.

## Security

See `SECURITY.md` and `docs/security/SECURITY_BASELINE.md`.
