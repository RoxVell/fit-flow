import type { MuscleGroup, Equipment } from "../db/types";

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Forearms",
  quads: "Quads",
  hamstrings: "Hamstrings",
  glutes: "Glutes",
  calves: "Calves",
  abs: "Abs",
  traps: "Traps",
  hip_flexors: "Hip Flexors",
  full_body: "Full Body",
};

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  barbell: "Barbell",
  dumbbell: "Dumbbell",
  kettlebell: "Kettlebell",
  cable: "Cable",
  machine: "Machine",
  smith_machine: "Smith Machine",
  ez_bar: "EZ Bar",
  bodyweight: "Bodyweight",
  band: "Band",
  plate: "Plate",
  step: "Step",
  bench: "Bench",
  foam_roller: "Foam Roller",
};

export const MUSCLE_GROUP_COLORS: Record<MuscleGroup, string> = {
  chest: "#f97316",
  back: "#ea580c",
  shoulders: "#fdba74",
  biceps: "#f97316",
  triceps: "#d97706",
  forearms: "#92400e",
  quads: "#c2410c",
  hamstrings: "#9a3412",
  glutes: "#b45309",
  calves: "#d97706",
  abs: "#fb923c",
  traps: "#e65100",
  hip_flexors: "#fed7aa",
  full_body: "#ffedd5",
};
