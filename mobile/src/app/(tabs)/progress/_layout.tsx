import { TabStack } from "@/components/tab-stack";
import { useT } from "@/lib/i18n/locale-context";

export default function Layout() {
  const t = useT();
  return <TabStack title={t.nav.progress} />;
}
