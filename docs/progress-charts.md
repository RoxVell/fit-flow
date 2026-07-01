# Progress Charts

The **Progress** screen (`/progress`) has three tabs: **General**, **Exercises**, and **Body**. Chart math lives in `src/lib/charts/`; UI in `src/components/dashboard/` and `src/components/progress/`.

## Shared building blocks

| Module | Role |
|--------|------|
| `lib/charts/periods.ts` | Period presets: `1m` (30d), `2m`, `3m`, `6m`, `all` |
| `lib/charts/domain.ts` | Focus Y-axis domain, period change (`absolute` vs relative `percent`) |
| `lib/charts/weekly-progress.ts` | Weekly e1RM aggregation, baselines, body-part series |
| `lib/charts/body-part-colors.ts` | Fixed colors per `BodyPart` for multi-line charts |
| `components/charts/chart-period-selector.tsx` | Period toggle UI |
| `components/charts/period-change-indicator.tsx` | Trend + change label |

Default period: **3m**.

## Data pipeline (General + body-part charts)

1. Read up to **200** finished `workoutLogs` (`useWorkoutLogs(200)`).
2. Group logs by **calendar week** (Monday start via `getMonday`).
3. Per week, per exercise: best **e1RM** among completed sets with `weight > 0` and `reps > 0`.
4. **Baseline** per exercise = best e1RM from the **first week that exercise appears** (`buildPerExerciseBaseline`), not the global first week.
5. Progress index for an exercise in a week: `(current e1RM / baseline e1RM) × 100`. **100% = first recorded level** for that exercise.
6. Filter weeks by selected period (`filterWeeksByPeriod`).

Sets with `weight === 0` (typical bodyweight logging) are **excluded** from strength progress. Exercises logged only with zero weight never enter the index.

## General tab

Components: `GeneralTab` → `ProgressChart`, `BodyPartProgressChart`, `RecentPRs`, `MuscleHeatmap`.

### General progress (`ProgressChart`)

- One area series: **average progress index** across all exercises that have a baseline and data that week.
- Period change shown as **percentage points** (last − first on the index), e.g. `+5.2%` means the index moved from 100 to 105.2.
- Y-axis uses **focus domain** (`computeFocusDomain`): trims the bottom so small gains are visible (not anchored at 0).

### Progress by body part (`BodyPartProgressChart`)

- Multi-line chart: one line per `BodyPart` (`ABS`, `BACK`, `BICEPS`, …) from the exercise manifest.
- A body part appears only if at least one exercise in that group has logged strength data.
- **Weekly line value**: average index of exercises in the group that appear in the period, indexed to **100% at each exercise’s first week in the period** (same logic as General progress), with **carry-forward** until a new session updates it.
- **Category summary** (header row on each expandable card):
  - **Change** = first vs last point on the chart line for that body part (same as General progress headline). Matches what you read off the graph (e.g. 100% → 102.7% = **+2.7%**).
  - Expanded **per-exercise** rows still show each exercise’s own relative change; averaging those can differ from the line when new exercises join mid-period or some moves were logged only once.
- Tap a category to expand **per-exercise** rows (same current + relative change). Expanding highlights that line on the chart.
- Legend under the chart maps colors to body-part labels (`BODY_PART_LABELS`, localized).

### Why category change matches the chart

Chart lines and category **change** badges both use **period-indexed** weekly averages; the badge is **first vs last point on the line** (not an average of per-exercise badges). Use period **All** to see all-time progress from each exercise’s first log.

## Exercises tab (`ExercisesTab`)

- **Exercise picker** (`ExercisePickerDialog` with `onlyUsed`): only exercises the user has logged at least once; sorted by usage.
- Chart modes: **e1RM** (line) or **volume** (bar), per session in the period.
- Period filter: same `1m` … `all` presets.
- Period change: **absolute** (kg) **·** **relative** (`+10 Kg · +5.6%`) via `PeriodChangeIndicator`.
- Y-axis: focus domain on the active metric (not from zero).
- **History accordion** below the chart is **not** period-filtered (full exercise history).

## Body tab (`BodyTab`)

Body weight and circumference measurements from `bodyMeasurements` — independent of e1RM progress math.

## Period change semantics

`computePeriodChange(values)` returns:

| Field | Meaning | Used for |
|-------|---------|----------|
| `absolute` | `last − first` (same unit as the series) | General progress header (index points); exercise tab kg leg |
| `percent` | `(last / first − 1) × 100` | Body-part and exercise rows inside index charts; exercise tab `%` leg |

When the series is already an index in percent (e1RM progress), prefer **`percent`** for “how much stronger” labels. Use **`absolute`** only when the values are raw kg or index points on the general chart.

## File map

```
src/
  lib/charts/
    periods.ts
    domain.ts
    weekly-progress.ts
    body-part-colors.ts
  components/
    dashboard/
      progress-chart.tsx
      body-part-progress-chart.tsx
    progress/
      general-tab.tsx
      exercises-tab.tsx
      body-tab.tsx
    charts/
      chart-period-selector.tsx
      period-change-indicator.tsx
    exercises/
      exercise-picker-dialog.tsx   # onlyUsed filter for Exercises tab
```

## i18n

Progress copy in `lib/i18n/messages.ts` under `progress.*` (`period1m`, `bodyPartProgress`, `chartVolume`, etc.). Body-part names come from `lib/exercises/labels.ts` (`BODY_PART_LABELS`).
