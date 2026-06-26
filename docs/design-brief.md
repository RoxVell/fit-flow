# FitFlow — описание проекта для дизайна

Структурированное описание текущего состояния приложения и готовый промпт для ИИ-агента по прототипированию UI.

---

## Общее

**FitFlow** — мобильное PWA-приложение для силовых тренировок и отслеживания прогресса. Работает как нативное приложение (standalone, portrait), данные хранятся локально (IndexedDB), есть офлайн-режим и синхронизация при подключении к сети.

| Параметр | Значение |
|----------|----------|
| Целевая платформа | Смартфон, max-width ~448px, контент по центру |
| Языки | Английский, русский |
| Темы | Светлая, тёмная |
| Основной акцент | Оранжевый (`#f97316` / oklch orange) |
| Шрифты | Geist Sans (основной), Geist Mono (цифры, приветствие) |
| UI-kit | ShadCN + Tailwind, карточки `rounded-xl`/`rounded-2xl`, backdrop-blur на sticky-элементах |

---

## Навигация

Фиксированная **нижняя панель** (5 вкладок, высота 64px + safe-area):

| Вкладка | Маршрут | Иконка |
|---------|---------|--------|
| Dashboard | `/dashboard` | LayoutDashboard |
| Workout | `/workout` | Dumbbell (+ зелёная точка при активной тренировке) |
| Programs | `/programs/library` | Library |
| Progress | `/progress` | BarChart3 |
| Settings | `/settings` | Settings |

**Глобальные оверлеи (не страницы):**

- Баннер офлайн/синхронизации (сверху)
- Промпт «Установить приложение» (PWA)
- Toast обновления service worker

**Скрытые/вторичные маршруты** (без вкладки в nav):

- `/` → редирект на `/dashboard`
- `/workout/active?session=…` — активная тренировка
- `/workout/cardio` — лог кардио (сейчас не привязан к nav)
- `/programs/create` и `/programs/create?edit=…` — создание/редактирование программы

---

## Страницы

### 1. Dashboard (`/dashboard`)

**Назначение:** домашний экран, мотивация и быстрый старт.

**Блоки сверху вниз:**

1. **Приветствие** — крупный текст (2xl, mono), имя пользователя выделено primary-цветом. 9 вариантов фраз, ротация по дню.
2. **Smart Stats** — сетка 2×2 карточек: шаги (синий), калории (оранжевый), вес в кг + тренд (↑/↓/—), Active Days (красный).
3. **Recent PRs** — последние 5 персональных рекордов (вес, объём, e1RM) с дельтой к предыдущему PR.
4. **Recent Workouts** — таблица последних 5 завершённых тренировок (дата, сессия, время, объём кг). Раскрывающиеся строки с деталями упражнений.
5. **Start Workout** — крупная CTA-кнопка на всю ширину, пульсирующая анимация, ведёт на `/workout`.

**Состояния:** skeleton при загрузке; PR и workouts скрыты, если данных нет.

---

### 2. Workout — план (`/workout`)

**Назначение:** выбор дня программы и старт тренировки.

**Если нет активной программы:** пустое состояние с иконкой гантели и текстом «создайте программу».

**Основной вид:**

- Заголовок «Workout» + имя программы + дней в неделю
- **Селектор дня** — карточка с названием сессии, днём недели, числом упражнений, бейдж «Today» для рекомендованного дня. Тап → диалог выбора дня (radio-list всех сессий)
- **Список упражнений** — название + целевые подходы×повторы (например `4×5-8`)
- **Кнопка Start Workout** — full-width, primary

**Поведение:** если есть незавершённый черновик тренировки — авто-редирект на `/workout/active`.

---

### 3. Workout — активная сессия (`/workout/active`)

**Назначение:** логирование подходов в реальном времени. Bottom nav остаётся, но контент перекрывает его частично.

**Sticky header:**

- Таймер тренировки (MM:SS) + pause/play
- Счётчик подходов (выполнено/всего) + общий объём (кг)
- Кнопка «Finish»

**Список Exercise Cards** (каждое упражнение):

- Название + бейдж группы мышц
- Активное упражнение — оранжевая полоска слева + glow
- Свайп влево → удаление упражнения
- Кнопки: swap (замена), collapse/expand
- Таблица подходов: № | Previous | кг | reps | чекбокс выполнения
- Автозаполнение веса/повторов из прошлой тренировки
- Кнопка «+ Set»

**Внизу:** dashed-кнопка «Add Exercise» → диалог выбора из библиотеки.

**Rest Timer** — плавающая панель над bottom nav: круговой прогресс, обратный отсчёт ~90 сек, кнопка Skip.

**Диалоги:**

- Подтверждение завершения (не все подходы / 0 подходов)
- Подтверждение отмены тренировки (abandon)

**Triumph Screen** (после finish) — полноэкранный оверлей: анимированный трофей, итоги (длительность, объём), список новых PR, кнопка закрытия.

---

### 4. Programs (`/programs/library`)

**Два таба** (segmented control):

#### Tab «Programs»

- Список карточек программ: название, бейдж «Active», описание, «N days · M sessions», Edit / Delete
- Раскрытый список сессий: день недели, название, бейджи упражнений
- Кнопка «Create New» → `/programs/create`

#### Tab «Exercises»

- **Библиотека упражнений:** поиск, фильтры по body part, виртуализированный список
- Тап → полноэкранный **Exercise Detail**: название, мышечная карта (anterior/posterior), вкладки Description / Video / Instructions, метаданные

---

### 5. Create/Edit Program (`/programs/create`)

**Полноэкранная форма:**

- Header: Back | «New Program» / «Edit Program» | Save
- **Program Info:** название, описание
- **Sessions:** список сессий → редактор с drag-and-drop упражнений, sets/reps, Exercise Picker
- Пустое состояние: dashed border + «Create first session»

**Сиды:** предзагружены шаблоны PPL (6 дней) и Upper/Lower (4 дня).

---

### 6. Progress (`/progress`)

**Три таба:**

#### General

- Overall Progress Chart (индекс силы %, период 1m–all)
- Body Part Progress (мультилинейный chart + summary cards)
- Recent PRs, Muscle Heatmap (anterior/posterior)

#### Exercises

- Exercise picker, e1RM / Volume chart, period selector, History Accordion

#### Body

- Body Weight chart, измерения (chest, waist, arms, thighs, calves, body fat)

---

### 7. Settings (`/settings`)

- Theme: Light / Dark / System
- Language: EN / RU

---

### 8. Cardio (`/workout/cardio`) — вторичный экран

- Форма: тип, дистанция, время, пульс, pace
- История кардио-сессий

*Сейчас нет прямой ссылки из nav.*

---

## Ключевые паттерны UX

| Паттерн | Где |
|---------|-----|
| Swipe-to-delete | Упражнения в активной тренировке |
| Drag-and-drop | Порядок упражнений в программе |
| Bottom sheet / Dialog | Выбор упражнений, дня, подтверждения |
| Segmented control | Табы Programs/Exercises, Progress |
| Skeleton loading | Dashboard, workout plan |
| Safe area insets | top/bottom padding на всех экранах |
| Offline-first | Баннер, outbox sync |

---

## Данные и домен

- **Программа** → сессии (дни недели) → упражнения (sets × reps)
- **Тренировка** → лог подходов (weight, reps, completed)
- **Метрики:** e1RM (Epley), volume, PR (weight/volume)
- **Progress index:** 100% = уровень в первую неделю упражнения
- **Каталог упражнений:** JSON-библиотека с i18n, видео, мышечными картами

---

## AI-функции (в коде, частично не в UI)

- `generateProgram(query)` — генерация PPL / Upper-Lower (логика есть, UI в форме программы пока нет)
- `AiAdvisor` — совет по упражнению (компонент есть, не подключён)
- `AiBriefingCard` — сводка за 2 недели (компонент есть, не на dashboard)

При дизайне можно заложить место под AI-блок на dashboard и AI-генерацию программы.

---

## Промпт для ИИ-агента

Скопируй блок ниже целиком:

```
Design a mobile-first fitness PWA called "FitFlow" — an intelligent workout companion for strength training and progress tracking.

## Platform & constraints
- Target: smartphone, portrait only, max content width 448px centered
- PWA standalone app with bottom tab navigation (5 tabs)
- Support light and dark themes
- Languages: English and Russian (design with EN labels; leave room for longer RU strings)
- Safe area insets top and bottom (notch, home indicator)
- Primary brand color: warm orange (#f97316). Use Geist Sans + Geist Mono for numbers
- Style: modern, clean, athletic but not aggressive. Rounded cards (12–16px radius), subtle shadows, backdrop blur on sticky headers. Inspired by Apple Fitness / Strong / Hevy apps

## Bottom navigation (always visible except full-screen overlays)
1. Dashboard — home icon
2. Workout — dumbbell icon (show green dot badge when workout in progress)
3. Programs — library icon
4. Progress — chart icon
5. Settings — gear icon

---

## Screen 1: Dashboard
Purpose: daily hub, motivation, quick start

Layout top to bottom:
- Personalized greeting (large bold text, user name highlighted in orange)
- 2×2 stat cards grid: Steps, Calories, Weight (kg + trend arrow), Active Days — each with colored icon badge
- "Recent PRs" card: trophy icon, list of up to 5 personal records (exercise name, PR type, value, delta %)
- "Recent Workouts" card: table with Date | Session | Duration | Volume (kg), expandable rows showing exercise breakdown
- Large pulsing CTA button "Start Workout" at bottom (orange, full width, dumbbell + play icons)

Empty states: hide PR/workout sections when no data. Show skeleton placeholders while loading.

---

## Screen 2: Workout Plan
Purpose: preview today's session and start workout

- Header: "Workout" + active program name + "6 days/week"
- Day selector card: session name, weekday, exercise count, "Today" badge on recommended day, chevron → opens day picker modal (radio list of all program days)
- Exercise list in bordered card: exercise name left, "4×5-8" target right
- Full-width "Start Workout" primary button

Empty state (no program): centered dumbbell icon + text prompting to create a program in Programs tab.

---

## Screen 3: Active Workout (no bottom nav emphasis — sticky header instead)
Purpose: log sets in real time during gym session

Sticky top bar:
- Workout timer MM:SS with pause/play
- Sets counter (completed/total) + total volume in kg
- "Finish" button

Scrollable exercise cards:
- Each card: exercise name, muscle group badge, swap button, collapse toggle
- Active exercise: orange left accent bar with glow
- Swipe left to delete exercise
- Set rows: set # | previous result (ghosted) | weight input | reps input | completion checkbox
- "+ Add Set" button per exercise
- Dashed "Add Exercise" button at bottom

Floating rest timer panel (above bottom nav): circular countdown ~90s, skip button — appears after completing a set.

Modals: finish confirmation (progress bar, finish anyway / discard / cancel), abandon workout confirmation.

Triumph overlay after finish: blurred backdrop, animated trophy, workout stats (duration, volume), list of new PRs, dismiss button.

---

## Screen 4: Programs
Segmented control: "Programs" | "Exercises"

### Programs tab
- "Your Programs" header + "Create New" button
- Program cards: name, "Active" badge, description, "6 days · 6 sessions" badge, Edit + Delete actions
- Inside card: list of sessions (weekday abbreviation, session name, exercise count) with exercise name chips

### Exercises tab
- Search bar
- Horizontal scroll body-part filter chips (Chest, Back, Shoulders, Biceps, Triceps, Legs, Glutes, Abs, Forearms)
- Virtualized exercise list rows with thumbnail
- Tap → full-screen exercise detail: title, muscle heatmap (front/back body SVG), tabs for Description / Video / Instructions, equipment and muscle metadata badges

---

## Screen 5: Create Program (full screen)
- Header: Back | "New Program" | Save
- Program info section: name input, description textarea
- Sessions section: list of session rows (icon, name, weekday badge, exercise count) — tap to edit
- Session editor: name, weekday picker, drag-reorderable exercise list (grip handle), per exercise: sets stepper, reps text field, delete. Add exercise via searchable picker modal.
- Empty state: dashed area + "Create first session"

---

## Screen 6: Progress
Segmented control: "General" | "Exercises" | "Body"

### General tab
- Overall strength progress area chart (index %, green/red based on trend), period selector pills (1M 2M 3M 6M All), change indicator
- Body part multi-line chart with color-coded legend + summary cards showing % change per body part
- Muscle load heatmap: front and back body silhouettes with orange gradient intensity
- Recent PRs section (same as dashboard)

### Exercises tab
- Exercise picker button (shows selected exercise thumbnail + name)
- Toggle: e1RM chart | Volume chart
- Period selector + line/bar chart
- Expandable workout history accordion below chart

### Body tab
- Body weight line chart
- Additional measurement charts: chest, waist, arms, thighs, calves
- Empty state for no measurements

---

## Screen 7: Settings
- Section "User Interface"
- Theme row: palette icon + Light/Dark/System toggle
- Language row: globe icon + EN/RU toggle

---

## Secondary screen: Cardio Log (not in main nav — accessed from workout flow)
- Back button + "Cardio" title
- Form card: activity type select, distance km, duration min/sec, heart rate, calculated pace
- History list: type, distance, duration, bpm

---

## Global UI elements
- Offline banner: slides from top — amber when offline, green when back online with sync count
- PWA install prompt bottom sheet
- App update toast

## Design deliverables requested
Design all 7 main screens + active workout triumph overlay + exercise detail + day picker modal + exercise picker modal. Provide light and dark mode variants. Use realistic fitness data (PPL program, bench press 80kg, etc.). Show the green "active workout" dot on Workout tab in at least one frame.
```
