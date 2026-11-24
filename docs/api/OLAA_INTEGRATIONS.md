# Olaa integrations

Apps never read or write each other's storage (olaa-platform `DEPENDENCY_MAP.md`). Habits talks to the other apps through three channels only.

## 1. Olaa ID and sync (Firebase, platform ADR-0004)

- Sign-in: Firebase Auth, Google or email/password; same project `olaa-ecosystem` as Olaa Language.
- Storage: Firestore `habits/{uid}` = `{ stateJson, updatedAt, schemaVersion }`. This is exactly the shape the existing rule `match /habits/{uid}` in olaa-platform `infrastructure/firebase/firestore.rules` accepts.
- Conflict rule: after sign-in, an empty device pulls; otherwise the copy with the newer `updatedAt` wins. Language events already received are merged in, never dropped.
- Code: `src/services/cloudSync.ts`, rules in `src/services/syncPolicy.ts` (tested).

## 2. Olaa Language → Habits (consumer)

Contract: olaa-platform `contracts/events/language-events.md` (PROPOSED, envelope v1).

| Event | Habit source | Done when |
|---|---|---|
| `language.daily_goal.completed` | `language.daily_goal` | any event on that `date` |
| `language.lesson.completed` | `language.lessons` | number of events on that `date` ≥ target |

Consumer rules implemented (`src/integrations/languageEvents.ts`): query only `userId == auth.uid`; count by `date`, not `occurredAt`; ignore `version` other than 1 (missing = 1); keep events by document id so a repeat is counted once; values are derived from the event log, so a late event fixes the day and its streak on arrival.

Not yet consumed (no producer yet): `language.speaking.attempted`, `language.flashcard.created` (REQ-02-012/013).

## 3. Olaa Note

Today (no Olaa Note API exists):
- Per-habit notebook link, validated to the Olaa Note origin, opened in a new tab.
- "Copy journal to Olaa Note": plain-text journal to the clipboard, then the notebook opens.
- App switcher in the header.

Proposed next step (needs an Olaa Note producer and a rule change in olaa-platform; not built):

| Event | Payload | Habits use |
|---|---|---|
| `takenote.page.edited` | `notebookId`, `minutes` | habit source `takenote.notebook` done when the linked notebook was edited that day |

Event id `{uid}_takenote.page.edited_{notebookId}_{date}` so one notebook counts once per day. This is the "TakeNote edit-time signal" the Habits PRD lists after MVP.

## URLs

`VITE_OLAA_LANGUAGE_URL` (default `https://olaa-language.web.app/`) and `VITE_OLAA_TAKENOTE_URL` (default `https://olaa-takenote.web.app/`).
