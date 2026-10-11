"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Database, Languages, Monitor, Moon, Smartphone, Sun } from "lucide-react";
import { PageHeader } from "@/components/desktop/page-header";
import { MetricRow, Panel, PanelBody, PanelHeader } from "@/components/desktop/ui";
import {
  useBodyMeasurements,
  useCompletedWorkoutLogsCount,
  usePersonalRecords,
} from "@/lib/hooks/use-data";
import { useLocale, useSetLocale } from "@/lib/i18n/locale-context";
import { useIsHydrated } from "@/lib/desktop/client-state";
import { useDt } from "@/lib/i18n/use-dt";
import { cn } from "@/lib/utils";

const THEMES = [
  { value: "system", icon: Monitor },
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
] as const;

const LOCALES = [
  { value: "en", label: "English" },
  { value: "ru", label: "Русский" },
] as const;

export default function DesktopSettingsPage() {
  const dt = useDt();
  const locale = useLocale();
  const setLocale = useSetLocale();
  const { theme, setTheme } = useTheme();
  const mounted = useIsHydrated();

  const sessions = useCompletedWorkoutLogsCount();
  const measurements = useBodyMeasurements();
  const records = usePersonalRecords();

  return (
    <div className="desk-enter">
      <PageHeader title={dt.nav.settings} description={dt.subtitles.settings} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel accent>
          <PanelHeader icon={Monitor} title={dt.settings.appearance} />
          <PanelBody className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-muted-foreground">{dt.settings.theme}</span>
              <div className="inline-flex items-center gap-0.5 rounded-lg border border-[var(--desk-line)] bg-background/60 p-0.5">
                {THEMES.map((option) => {
                  const Icon = option.icon;
                  const active = mounted && theme === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTheme(option.value)}
                      aria-label={option.value}
                      className={cn(
                        "grid size-7 place-items-center rounded-md transition-colors",
                        active
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="size-3.5" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-muted-foreground">
                {dt.settings.language}
              </span>
              <div className="inline-flex items-center gap-0.5 rounded-lg border border-[var(--desk-line)] bg-background/60 p-0.5">
                {LOCALES.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setLocale(option.value)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                      locale === option.value
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Languages className="mr-1 inline size-3" />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader icon={Database} title={dt.settings.data} />
          <PanelBody className="py-1">
            <MetricRow label={dt.settings.storedSessions} value={sessions ?? "—"} />
            <MetricRow
              label={dt.settings.storedMeasurements}
              value={measurements?.length ?? "—"}
            />
            <MetricRow
              label={dt.settings.storedRecords}
              value={records?.length ?? "—"}
            />
            <p className="pt-3 text-[0.6875rem] leading-relaxed text-muted-foreground">
              {dt.settings.localFirst}
            </p>
          </PanelBody>
        </Panel>

        <Panel className="xl:col-span-2">
          <PanelHeader icon={Smartphone} title={dt.settings.shell} />
          <PanelBody className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">{dt.settings.shellHint}</p>
            <Link
              href="/dashboard"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--desk-line)] px-3 text-xs font-semibold transition-colors hover:bg-muted/60"
            >
              <Smartphone className="size-3.5" />
              {dt.window.mobileView}
            </Link>
          </PanelBody>
        </Panel>
      </div>
    </div>
  );
}
