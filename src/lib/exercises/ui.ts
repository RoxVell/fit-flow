import type { Locale } from "./types";

export const exerciseUi: Record<
  Locale,
  {
    searchPlaceholder: string;
    all: string;
    noResults: string;
    loading: string;
    overview: string;
    instructions: string;
    tips: string;
    commonMistakes: string;
    muscles: string;
    equipment: string;
    filters: string;
    mechanics: string;
    exercises: string;
    exerciseCount: (n: number) => string;
    recentExercises: string;
    allExercises: string;
    usageTimes: (n: number) => string;
  }
> = {
  en: {
    searchPlaceholder: "Search exercises...",
    all: "All",
    noResults: "No exercises found",
    loading: "Loading exercises...",
    overview: "Overview",
    instructions: "Instructions",
    tips: "Tips",
    commonMistakes: "Mistakes",
    muscles: "Muscles",
    equipment: "Equipment",
    filters: "Filters",
    mechanics: "Mechanics",
    exercises: "Exercises",
    exerciseCount: (n) => `${n} exercises`,
    recentExercises: "Recent exercises",
    allExercises: "All exercises",
    usageTimes: (n) => `${n} times`,
  },
  ru: {
    searchPlaceholder: "Поиск упражнений...",
    all: "Все",
    noResults: "Упражнения не найдены",
    loading: "Загрузка упражнений...",
    overview: "Обзор",
    instructions: "Техника",
    tips: "Советы",
    commonMistakes: "Ошибки",
    muscles: "Мышцы",
    equipment: "Оборудование",
    filters: "Фильтры",
    mechanics: "Механика",
    exercises: "Упражнения",
    exerciseCount: (n) => `${n} упражнений`,
    recentExercises: "Недавние упражнения",
    allExercises: "Все упражнения",
    usageTimes: (n) => `${n} раз`,
  },
};
