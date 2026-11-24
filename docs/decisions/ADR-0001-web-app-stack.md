# ADR-0001: Use Olaa Note's web stack and interface

- Status: Accepted (2026-11-24)
- Context: `TECH_STACK.md` listed a proposed stack. Olaa Note (`olaa-takenote`, branch `feat/poppins-bilingual`) and Olaa Language already ship it, with the Firebase setup of platform ADR-0004. The owner asked for an interface modelled on Olaa Note.
- Decision: React 18.3 + Vite 5.4 + TypeScript strict; plain CSS with Olaa Note's design tokens and components; hash router; `useSyncExternalStore` stores; localStorage on device (state is small JSON, same shape as the Firestore document); Firebase 13.2 for Olaa ID, sync and Language events, loaded on demand; Vitest + Testing Library; Firebase Hosting site `olaa-habits`.
- Consequences: one look and one codebase style across the three apps. When the shared design system (platform module 04.01, yellow palette in UIUX PRD answer 3c) is published, the tokens in `src/styles/global.css` are the single place to change. `@grpc/grpc-js` is overridden to ≥1.13.6 to clear a Node-only advisory in Firebase's dependency tree.

## Update 2026-11-24: interface

The first interface copied Olaa Note's older cream/blue design (branch `feat/poppins-bilingual`). Olaa Language has since moved to the shared glass design from the Olaa Note iPad prototype, so Habits was rebuilt on it: `src/styles/app.css` starts from Language's stylesheet (same tokens, frame, components), with Habits' Kodak orange as the accent. The old interface was removed entirely. Saved data is unchanged and loads as before; two optional fields were added (`habit.why`, `state.moods`).
