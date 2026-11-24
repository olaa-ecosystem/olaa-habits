# Olaa Habits

Habit tracker for students in the Olaa ecosystem. It checks off learning habits from real activity in Olaa Language and links habits to Olaa Note notebooks.

## Interface

The same visual system as Olaa Language and Olaa Note (olaa-platform `prototypes/takenote-ipad-home`; olaa-language `src/styles/app.css`): frosted glass cards on a slowly drifting pastel field with light film grain, rounded 18–28px corners, Inter / San Francisco, the Olaa icon set, light / dark / device theme, Vietnamese and English. Habits' identity colour is the Note prototype's Kodak orange (Language is Fuji green, Note is graphite).

| Shared with Language and Note | In Habits |
|---|---|
| Glass top bar: wordmark, date, streak pill, theme button, app switcher Language → Note → Habits | Streak pill counts full days in a row |
| Floating glass navigation (bottom on phones, side rail from 1000px) | Today · Calendar · Habits · Stats · Me |
| Today layout: hero ring + stats, checklist, calendar, app cards | Hero ring for the day, week strip, checklist by time of day, mood of the day, freeze card, tip |
| Note prototype checklist (`.hab`, orange check) and calendar (dot, habit bar, mood) | One-tap check, − / + for counts, Language habits tick themselves |
| Colour blocks, chips, tags, dialogs, toasts | Stats blocks, badges, Undo toast |

## What it does

| Area       | Features                                                                                                                       | Module |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------ | ------ |
| Habits     | Create, edit, archive/restore, delete; 16 icons, 8 colours; templates for learning, health and mind; reorder                   | 02.01  |
| Scheduling | Every day, chosen weekdays, or N times a week; start date; morning/afternoon/evening groups; week starts Monday or Sunday      | 02.02  |
| Tracking   | One-tap check-off; count habits (8 glasses, 10 pages) with − / + ; undo; edit today and the 2 days before; a note per day      | 02.03  |
| Streaks    | Current and best streak (in weeks for N-a-week habits); streak freezes for busy days (default 2 a month); habit strength score | 02.04  |
| Calendar   | Month view per habit or all habits; done / partly / frozen / missed shown by colour and icon; tap a future day to freeze it    | 02.07  |
| Reminders  | Daily time per habit; skipped when already done; suggested time after 7 days of data                                           | 02.08  |
| Statistics | 7- and 30-day completion, completions per week, 20-week heatmap, per-habit table                                               | 02.09  |
| Badges     | First check, 7/30/100-day streaks, first freeze, perfect week, first Language auto check-off; kept forever                     | 02.10  |
| Insights   | Best and weakest weekday; habits that keep slipping, with a concrete suggestion                                                | 02.11  |
| Settings   | Language, light/dark/device theme, week start, freezes per month, notifications, JSON export/import                            | 02.12  |

### Olaa integrations

- **Olaa ID and sync**: sign in with the same Firebase account as Olaa Language. Habits are stored on the device first and mirrored to Firestore `habits/{uid}`; the newest copy wins.
- **Olaa Language → Habits**: habits of type "Language daily goal" or "N new Language lessons" are checked off by the events Olaa Language already writes to Firestore `events/`. They cannot be ticked by hand and show a "Study now" button instead. Late and repeated events are counted once, on the right day.
- **Olaa Note**: a habit can link to an Olaa Note notebook and open it in one tap; a habit's journal notes can be copied into an Olaa Note page. The header has a Language / Habits / Note switcher.

Details and planned next steps: [`docs/api/OLAA_INTEGRATIONS.md`](docs/api/OLAA_INTEGRATIONS.md).

## Development

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm test         # unit + integration tests (Vitest)
pnpm typecheck && pnpm lint && pnpm build
```

Without Firebase variables the app runs on-device only. `.env.development` and `.env.production` hold the public web config of project `olaa-ecosystem` (the same one Olaa Language uses; not a secret).

## Stack

Same as Olaa Language and Olaa Note: React 18 + Vite 5 + TypeScript (strict), plain CSS with design tokens, hash router, Vitest + Testing Library, ESLint + Prettier, GitHub Actions, Firebase Hosting (site `olaa-habits`). See [ADR-0001](docs/decisions/ADR-0001-web-app-stack.md).

## Documents

Scope `docs/product/SCOPE.md` · requirements `docs/product/REQUIREMENTS.md` · modules `docs/architecture/MODULES.md` · agent rules `docs/engineering/AI_AGENT_RULES.md` · security `SECURITY.md`.
