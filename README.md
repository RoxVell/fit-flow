# FitFlow

Mobile-first fitness tracking PWA. Dashboard, workout logger (timer, rest timer, swipe-to-delete, prefill), cardio log, programs (PPL / Upper-Lower / AI-generated), and progress charts (e1RM, volume, body weight, PRs).

Built with Next.js 16, Tailwind CSS v4, ShadCN, TanStack Query, Zustand, Recharts, Framer Motion.

- **Offline-first** — service worker precaches all pages, JS/CSS chunks, and fonts. Data persists to IndexedDB (workout logs, cardio, measurements). Active workout survives page refresh via Zustand + IndexedDB.
- **No backend** — all data is mocked. Seed data + user-created records merged on reads.
- **PWA** — installable on iOS and Android. Full offline support via HTTPS.
