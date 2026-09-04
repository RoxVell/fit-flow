import { Placeholder } from "@/components/placeholder";
import { Screen } from "@/components/screen";
import { useT } from "@/lib/i18n/locale-context";

export default function ProgressScreen() {
  const t = useT();
  return (
    <Screen>
      <Placeholder symbol="chart.line.uptrend.xyaxis" title={t.nav.progress} />
    </Screen>
  );
}
