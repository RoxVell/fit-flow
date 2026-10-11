import type { Messages } from "@/lib/i18n/messages";

export function getPrTypeLabels(t: Messages): Record<string, string> {
  return {
    weight: t.dashboard.prMaxWeight,
    volume: t.dashboard.prVolume,
    estimated_1rm: t.dashboard.prE1rm,
  };
}
