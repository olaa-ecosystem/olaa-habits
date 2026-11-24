# Technology Stack

Approved in `docs/decisions/ADR-0001-web-app-stack.md` (2026-11-24), matching Olaa Note and Olaa Language.

| Concern | Choice |
|---|---|
| Language | TypeScript 5.6, strict |
| UI | React 18.3, Vite 5.4 |
| Styling | Plain CSS; tokens and components from Olaa Language's `app.css` (Olaa glass style) |
| Router | Hash router (`src/app/router.ts`) |
| State | Module stores with `useSyncExternalStore` |
| Local persistence | localStorage, versioned JSON |
| Identity, sync, events | Firebase 13.2 (Auth, Firestore), project `olaa-ecosystem` |
| Tests | Vitest 2.1, Testing Library, jsdom |
| Quality | ESLint 9, Prettier 3, `pnpm audit` in CI |
| Package manager | pnpm 9 |
| Hosting | Firebase Hosting, site `olaa-habits` |
