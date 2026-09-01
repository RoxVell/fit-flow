<div align="center">

# FitFlow

**A mobile-first workout tracker that works with no account, no signal, and no backend.**

Log your sets in the gym, watch your lifts climb, and keep every rep on your own device.

[![CI](https://github.com/RoxVell/fit-flow/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/RoxVell/fit-flow/actions/workflows/ci.yml)

<img src="docs/screenshots/dashboard.png" width="210" alt="Dashboard" />
<img src="docs/screenshots/active-workout.png" width="210" alt="Active workout" />
<img src="docs/screenshots/progress-exercises.png" width="210" alt="Exercise progress" />
<img src="docs/screenshots/exercise-library.png" width="210" alt="Exercise library" />

</div>

---

## Why FitFlow

Most trackers want an account before they let you log a single set, then stall the moment
the gym basement eats your signal. FitFlow is built the other way round.

- **Works offline, always.** Your phone is the source of truth. Every screen reads and
  writes local storage first, so the app behaves identically at full bars or none.
- **No sign-up, no cloud required.** Open it and start lifting. There is no account, no
  email, and nothing leaves your device unless you deliberately configure sync.
- **Installs like an app.** Add it to your home screen and it launches full-screen from
  the icon — no browser chrome, no app store.
- **Built for one hand in a gym.** Big tap targets, a thumb-reachable bottom bar, and a
  set logger that pre-fills last session's numbers so most sets are one tap.

---

## Features

### Logging a workout

- **Guided sessions.** Pick the day from your active program and start; every exercise and
  its target sets are laid out for you.
- **Previous-session column.** Each set row shows what you did last time, and empty sets
  pre-fill with those numbers — usually you just confirm.
- **Rest timer.** Completing a set starts a countdown automatically, using the rest length
  configured on that program. Skip it with one tap.
- **Change your mind mid-session.** Add or remove sets, add an exercise that isn't in the
  plan, swap one for another, or attach a note to an exercise.
- **Mark a lift as "don't count".** Deload or technique work can be excluded from your
  stats without deleting it.
- **Elapsed clock you can pause**, plus a running set and volume counter in the header.
- **Finish screen** with session duration, total volume, and any personal records you set.

### Programs

- **Two ready-made splits** to start from: Push / Pull / Legs and Upper / Lower.
- **Build your own.** Create a program, add training days, drag exercises into order, and
  set target sets and rep ranges per exercise.
- **One active program** drives the Workout tab; switch or edit at any time.
- **Per-program rest duration**, adjustable from 30 seconds to 5 minutes.

### Exercise library

- **824 exercises** with illustrations, target muscles, equipment, and technique notes.
- **Search and filter by body part**, and see how many times you have actually done each
  movement.
- Fully bundled with the app, so browsing works offline too.

### Progress

- **General progress** — a single index of how your strength compares to when you started,
  plus a muscle-load heatmap showing what you have been hitting.
- **Per-exercise charts** — estimated 1RM and volume over time, with the underlying session
  history expandable underneath.
- **Body-part breakdown** so you can spot the group you have been quietly neglecting.
- **Selectable period** on every chart: 1, 2, 3, 6 months, or everything.

### Body and cardio

- **Body measurements** — weight plus chest, waist, arms, thighs, and calves, each optional
  and backdatable, charted over time.
- **Cardio log** — runs, rides, rowing, and elliptical with distance, duration, pace, and
  average heart rate. Reachable at `/workout/cardio`.

### Everything else

- **English and Russian**, including all exercise names.
- **Light, dark, and system themes.**
- **Export your history to CSV** from the Workout → History tab, over a preset or custom
  date range.
- **Optional cross-device sync** if you supply your own database — off by default.

<div align="center">
<img src="docs/screenshots/programs.png" width="230" alt="Programs" />
<img src="docs/screenshots/dashboard-light.png" width="230" alt="Light theme" />
</div>

---

## Getting started

FitFlow is not hosted anywhere yet, so you run it yourself. You need
[Node.js 22+](https://nodejs.org) and npm.

```bash
git clone https://github.com/RoxVell/fit-flow.git
cd fit-flow
npm install
npm run dev
```

Open <http://localhost:3000>. That is the whole setup — no database, no API keys, no
configuration file.

### Using it on your phone

While the dev server is running, open `http://<your-computer-ip>:3000` on a phone on the
same Wi-Fi, then:

- **Android / Chrome / Edge** — accept the install prompt, or use the ⋮ menu → *Install app*.
- **iPhone / Safari** — Share → *Add to Home Screen*.

Once installed it opens full-screen and keeps working after you leave the network.

---

## Your data

Everything you log lives in your browser's IndexedDB storage (database `fitflow_v2`) on the
device you logged it on. Nothing is uploaded anywhere by default.

A few practical consequences:

- **Clearing site data for the app erases your history.** There is no server copy to restore
  from — export to CSV first if it matters to you.
- **Devices don't see each other** unless you set up sync below.
- **Exercise illustrations load from a remote image host**, so the pictures need a
  connection the first time even though the rest of the catalog is bundled.

### Optional: sync across devices

If you want your phone and laptop to share a history, point the app at your own
[Neon](https://neon.tech) Postgres database:

```bash
# .env.local
DATABASE_URL="postgresql://user:password@host/db"
```

```bash
npm run db:push   # create the tables
npm run dev
```

The app then pushes local changes and pulls remote ones in the background — on launch, when
you come back online, and whenever you refocus the tab. Conflicts resolve last-write-wins.
Leave `DATABASE_URL` unset and none of this runs.

---

## Good to know

- FitFlow is a **personal, single-user app**. There are no accounts or profiles, and the
  dashboard greeting currently uses a hard-coded name.
- **Workout history is editable, body measurements are not** — to correct a measurement,
  delete the entry and log a new one.
- `npm run build` requires `DATABASE_URL` to be *present*, though it does not need to point
  at a live database. A placeholder is enough:
  `DATABASE_URL="postgresql://user:pass@localhost:5432/db" npm run build`

---

## Tech stack

| Area | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19 |
| Storage | IndexedDB via Dexie — the single source of truth for the UI |
| Offline | Serwist service worker; static assets and the exercise catalog are cached |
| Optional server | Neon Postgres via Drizzle ORM, behind one `/api/sync` route |
| UI | Tailwind CSS v4, Base UI, Framer Motion, Lucide icons |
| Charts | Recharts, plus `react-body-highlighter` for the muscle heatmap |
| Session state | Zustand for the in-progress workout |
| Testing | Vitest (unit) and Playwright (end-to-end) |

---

## Development

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server on port 3000 |
| `npm run build` | Production build (needs `DATABASE_URL` set, see above) |
| `npm run lint` | ESLint |
| `npm run test:unit` | Vitest unit tests |
| `npm run test:e2e` | Playwright suite (starts its own server on port 3100) |
| `npm run test:e2e:ui` | Playwright inspector |
| `npm run build:exercises` | Rebuild the static exercise catalog in `public/exercises/` |
| `npm run db:push` | Push the Drizzle schema to Postgres |

Before the first e2e run, install the browser once with `npx playwright install chromium`.
Stop `npm run dev` first — Next.js refuses to start a second dev server for the same project.

### Docs

- [Offline architecture](./docs/offline-architecture.md) — storage, sync protocol, conflict resolution
- [Exercise library & i18n](./docs/exercise-library-and-i18n.md) — catalog format and translations
- [Progress charts](./docs/progress-charts.md) — e1RM, the progress index, body-part maths
- [E2E testing](./docs/e2e-testing.md) — Playwright suite, fixtures, debugging, CI
- [Design brief](./docs/design-brief.md) — visual language and interaction rules
