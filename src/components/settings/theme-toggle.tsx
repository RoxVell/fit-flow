"use client";

import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { useT } from "@/lib/i18n/use-t";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const t = useT();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const themes = [
    { value: "system", label: t.settings.themeSystem, icon: Monitor },
    { value: "dark", label: t.settings.themeDark, icon: Moon },
    { value: "light", label: t.settings.themeLight, icon: Sun },
  ];

  return (
    <SegmentedTabs
      variant="card"
      ariaLabel={t.settings.theme}
      items={themes.map((item) => ({
        value: item.value,
        label: <item.icon className="h-4 w-4" aria-hidden />,
        ariaLabel: item.label,
      }))}
      value={mounted ? theme : undefined}
      onChange={setTheme}
      equalWidth={false}
      truncate={false}
      buttonClassName="h-9 px-3.5"
    />
  );
}
