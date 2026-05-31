"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProgramForm } from "@/components/programs/program-form";
import { useCreateProgram, useUpdateProgram, useProgram } from "@/lib/hooks/use-queries";

function CreateProgramInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const { data: existingProgram, isLoading } = useProgram(editId || "");
  const createProgram = useCreateProgram();
  const updateProgram = useUpdateProgram();

  if (editId && isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading program...</p>
      </div>
    );
  }

  return (
    <ProgramForm
      asPage
      key={editId || "create"}
      initialData={existingProgram ? {
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
      } : undefined}
      onBack={() => router.push("/programs/library")}
      onSave={(data) => {
        if (editId) {
          updateProgram.mutate({ id: editId, data }, {
            onSuccess: () => router.push("/programs/library"),
          });
        } else {
          createProgram.mutate(data, {
            onSuccess: () => router.push("/programs/library"),
          });
        }
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
