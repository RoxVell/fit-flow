import { Host, Picker, Text as SwiftText } from "@expo/ui/swift-ui";
import { labelsHidden, pickerStyle, tag } from "@expo/ui/swift-ui/modifiers";

import { useScheme } from "@/hooks/use-theme";
import { CHART_PERIODS, type ChartPeriod } from "@/lib/charts/periods";
import { useT } from "@/lib/i18n/locale-context";

type Props = {
  period: ChartPeriod;
  onChange: (period: ChartPeriod) => void;
};

// Segmented chart-period control (CONTEXT.md, "chart period").
export function PeriodPicker({ period, onChange }: Props) {
  const t = useT();
  const scheme = useScheme();
  return (
    <Host matchContents colorScheme={scheme}>
      <Picker
        label={t.progress.generalProgress}
        selection={period}
        onSelectionChange={onChange}
        modifiers={[pickerStyle("segmented"), labelsHidden()]}>
        {CHART_PERIODS.map((p) => (
          <SwiftText key={p} modifiers={[tag(p)]}>
            {t.dashboard.periods[p]}
          </SwiftText>
        ))}
      </Picker>
    </Host>
  );
}
