import type { Locale } from "./types";

type LabelMap = Record<string, { en: string; ru: string }>;

export const BODY_PART_LABELS: LabelMap = {
  ABS: { en: "Abs", ru: "Пресс" },
  BACK: { en: "Back", ru: "Спина" },
  BICEPS: { en: "Biceps", ru: "Бицепс" },
  CHEST: { en: "Chest", ru: "Грудь" },
  FOREARMS: { en: "Forearms", ru: "Предплечья" },
  GLUTEUS: { en: "Glutes", ru: "Ягодицы" },
  LEGS: { en: "Legs", ru: "Ноги" },
  SHOULDERS: { en: "Shoulders", ru: "Плечи" },
  TRICEPS: { en: "Triceps", ru: "Трицепс" },
};

export const EQUIPMENT_LABELS: LabelMap = {
  ASSISTED_MACHINE: { en: "Assisted machine", ru: "Тренажёр с поддержкой" },
  BARBELL: { en: "Barbell", ru: "Штанга" },
  BENCH: { en: "Bench", ru: "Скамья" },
  CABLE_MACHINE: { en: "Cable", ru: "Блок" },
  DIP_BARS: { en: "Dip bars", ru: "Брусья" },
  DUMBBELL: { en: "Dumbbell", ru: "Гантели" },
  EZ_BAR: { en: "EZ bar", ru: "EZ-гриф" },
  GYMNASTIC_RINGS: { en: "Rings", ru: "Кольца" },
  KETTLEBELL: { en: "Kettlebell", ru: "Гиря" },
  LANDMINE: { en: "Landmine", ru: "Лэндмайн" },
  MEDICINE_BALL: { en: "Medicine ball", ru: "Медбол" },
  PARALLETTES: { en: "Parallettes", ru: "Параллеты" },
  PLATE_LOADED_MACHINE: { en: "Plate machine", ru: "Тренажёр с дисками" },
  PLYO_BOX: { en: "Plyo box", ru: "Плио-бокс" },
  PULL_UP_BAR: { en: "Pull-up bar", ru: "Турник" },
  RACK: { en: "Rack", ru: "Стойка" },
  RESISTANCE_BAND: { en: "Band", ru: "Резинка" },
  SELECTORIZED_MACHINE: { en: "Machine", ru: "Тренажёр" },
  SLED: { en: "Sled", ru: "Сани" },
  SMITH_MACHINE: { en: "Smith machine", ru: "Смит" },
  SUSPENSION_TRAINER: { en: "Suspension", ru: "Петли TRX" },
  TRAP_BAR: { en: "Trap bar", ru: "Трэп-гриф" },
  TREADMILL: { en: "Treadmill", ru: "Беговая дорожка" },
  WEIGHT_PLATE: { en: "Plate", ru: "Диск" },
};

export const LATERALITY_LABELS: LabelMap = {
  BILATERAL: { en: "Bilateral", ru: "Двустороннее" },
  UNILATERAL: { en: "Unilateral", ru: "Одностороннее" },
  ALTERNATING: { en: "Alternating", ru: "Поочерёдное" },
};

export function labelFor(
  map: LabelMap,
  key: string,
  locale: Locale
): string {
  return map[key]?.[locale] ?? map[key]?.en ?? key.replace(/_/g, " ").toLowerCase();
}
