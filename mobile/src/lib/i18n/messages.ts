// Strings are grouped per domain in ./domains (subsets of the web app's
// src/lib/i18n/messages.ts). Register a new domain in both locales below.
import { cardio } from "./domains/cardio";
import { common } from "./domains/common";
import { dashboard } from "./domains/dashboard";
import { pwa } from "./domains/pwa";
import { exercises } from "./domains/exercises";
import { nav } from "./domains/nav";
import { programs } from "./domains/programs";
import { progress } from "./domains/progress";
import { settings } from "./domains/settings";
import { workout } from "./domains/workout";

export const messages = {
  en: {
    nav: nav.en,
    settings: settings.en,
    programs: programs.en,
    progress: progress.en,
    dashboard: dashboard.en,
    exercises: exercises.en,
    workout: workout.en,
    cardio: cardio.en,
    pwa: pwa.en,
    common: common.en,
  },
  ru: {
    nav: nav.ru,
    settings: settings.ru,
    programs: programs.ru,
    progress: progress.ru,
    dashboard: dashboard.ru,
    exercises: exercises.ru,
    workout: workout.ru,
    cardio: cardio.ru,
    pwa: pwa.ru,
    common: common.ru,
  },
} as const;

export type Locale = keyof typeof messages;
export type Messages = (typeof messages)[Locale];

export const locales = Object.keys(messages) as Locale[];
export const defaultLocale: Locale = "en";
