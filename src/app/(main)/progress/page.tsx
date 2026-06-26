"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BarChart3, Dumbbell, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { GeneralTab } from "@/components/progress/general-tab";
import { ExercisesTab } from "@/components/progress/exercises-tab";
import { BodyTab } from "@/components/progress/body-tab";
import { useT } from "@/lib/i18n/use-t";

type Tab = "general" | "exercises" | "body";

export default function ProgressPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const t = useT();

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "body" || tab === "exercises" || tab === "general") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const tabs = [
    { value: "general" as const, label: t.progress.general, icon: BarChart3 },
    { value: "exercises" as const, label: t.progress.exercises, icon: Dumbbell },
    { value: "body" as const, label: t.progress.body, icon: User },
  ];

  return (
    <div className="px-4 pb-24 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <h1 className="text-2xl font-bold mb-3">{t.progress.title}</h1>
      <div className="flex rounded-lg bg-muted p-0.5 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all",
              activeTab === tab.value
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>
      {activeTab === "general" && <GeneralTab />}
      {activeTab === "exercises" && <ExercisesTab />}
      {activeTab === "body" && <BodyTab />}
    </div>
  );
}
