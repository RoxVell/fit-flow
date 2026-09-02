"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProgramForm } from "@/components/programs/program-form";
import { useProgram } from "@/lib/hooks/use-data";
import { createProgram, updateProgram } from "@/lib/repositories/programs";
import { useT } from "@/lib/i18n/use-t";
import { Skeleton } from "@/components/ui/skeleton";

function CreateProgramInner() {
  const router = useRouter();
  const t = useT();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const existingProgram = useProgram(editId || "");
  if (editId && existingProgram === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-muted-foreground">{t.programs.loadingProgram}</p>
      </div>
    );
  }

  return (
    <ProgramForm
      asPage
      key={editId || "create"}
      initialData={
        existingProgram
          ? {
              name: existingProgram.name,
              description: existingProgram.description,
              restDurationSeconds: existingProgram.restDurationSeconds,
              sessions: existingProgram.sessions.map((s) => ({
                name: s.name,
                dayOfWeek: s.dayOfWeek,
                exercises: s.exercises.map((e) => ({
                  exerciseId: e.exerciseId,
                  targetSets: e.targetSets,
                  targetReps: e.targetReps,
                })),
              })),
            }
          : undefined
      }
      onBack={() => router.push("/programs/library")}
      onSave={async (data) => {
        if (editId) {
          await updateProgram(editId, data);
        } else {
          await createProgram(data);
        }
        router.push("/programs/library");
      }}
    />
  );
}

// The fallback is what ends up in the precached HTML.
function CreateProgramSkeleton() {
  return (
    <div className="space-y-4 px-4 pb-24 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
      <Skeleton className="h-8 w-40 rounded-lg" />
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}

export default function CreateProgramPage() {
  return (
    <Suspense fallback={<CreateProgramSkeleton />}>
      <CreateProgramInner />
    </Suspense>
  );
}
