"use client";

import { Suspense } from "react";
import { BarChart3, Dumbbell, User } from "lucide-react";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { GeneralTab } from "@/components/progress/general-tab";
import { ExercisesTab } from "@/components/progress/exercises-tab";
import { BodyTab } from "@/components/progress/body-tab";
import { useSearchParamTab } from "@/lib/hooks/use-search-param-tab";
import { useT } from "@/lib/i18n/use-t";
import { Skeleton } from "@/components/ui/skeleton";

type Tab = "general" | "exercises" | "body";

function ProgressPageInner() {
  const [activeTab, setActiveTab] = useSearchParamTab<Tab>(
    ["general", "exercises", "body"],
    "general"
  );
  const t = useT();

  const tabs = [
    { value: "general" as const, label: t.progress.general, icon: BarChart3 },
    { value: "exercises" as const, label: t.progress.exercises, icon: Dumbbell },
    { value: "body" as const, label: t.progress.body, icon: User },
  ];

  return (
    <div className="px-4 pb-24 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <h1 className="text-2xl font-bold mb-3">{t.progress.title}</h1>
      <SegmentedTabs
        selectionMode="tabs"
        items={tabs}
        value={activeTab}
        onChange={setActiveTab}
        ariaLabel={t.progress.title}
        truncate={false}
        className="mb-4"
      />
      {activeTab === "general" && <GeneralTab />}
      {activeTab === "exercises" && <ExercisesTab />}
      {activeTab === "body" && <BodyTab />}
    </div>
  );
}

function ProgressSkeleton() {
  return (
    <div className="space-y-4 px-4 pb-24 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <Skeleton className="h-8 w-32 rounded-lg" />
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

// useSearchParams needs a Suspense boundary for static prerendering; the
// fallback is what ends up in the precached HTML.
export default function ProgressPage() {
  return (
    <Suspense fallback={<ProgressSkeleton />}>
      <ProgressPageInner />
    </Suspense>
  );
}
