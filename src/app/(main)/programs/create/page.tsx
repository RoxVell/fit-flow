"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProgramForm } from "@/components/programs/program-form";
import { useProgram } from "@/lib/hooks/use-data";
import { createProgram, updateProgram } from "@/lib/repositories/programs";
import { useT } from "@/lib/i18n/use-t";

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

export default function CreateProgramPage() {
  return (
    <Suspense fallback={null}>
      <CreateProgramInner />
    </Suspense>
  );
}
