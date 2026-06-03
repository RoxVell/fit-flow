"use client";

import { useState } from "react";
import { BarChart3, Dumbbell, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { GeneralTab } from "@/components/progress/general-tab";
import { ExercisesTab } from "@/components/progress/exercises-tab";
import { BodyTab } from "@/components/progress/body-tab";

const tabs = [
  { value: "general", label: "General", icon: BarChart3 },
  { value: "exercises", label: "Exercises", icon: Dumbbell },
  { value: "body", label: "Body", icon: User },
] as const;

type Tab = (typeof tabs)[number]["value"];

export default function ProgressPage() {
  const [activeTab, setActiveTab] = useState<Tab>("general");

  return (
    <div className="px-4 pb-24 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <h1 className="text-2xl font-bold mb-3">Progress</h1>
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
