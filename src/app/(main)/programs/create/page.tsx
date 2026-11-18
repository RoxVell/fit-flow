"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ProgramForm } from "@/components/programs/program-form";
import { useProgram } from "@/lib/hooks/use-data";
import { createProgram, updateProgram } from "@/lib/repositories/programs";
import { useT } from "@/lib/i18n/use-t";
import { Skeleton } from "@/components/ui/skeleton";

function CreateProgramInner() {
  const editId = useSearchParams().get("edit");
  return <ProgramEditor key={editId ?? "create"} editId={editId} />;
}

function ProgramEditor({ editId }: { editId: string | null }) {
  const router = useRouter();
  const t = useT();
  const existingProgram = useProgram(editId || "");
  if (editId && existingProgram === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-muted-foreground">{t.programs.loadingProgram}</p>
      </div>
    );
  }

  if (editId && existingProgram === null) {
    return (
      <div className="space-y-3 p-4 text-sm">
        <p>{t.programs.programUnavailable}</p>
        <Link className="text-primary" href="/programs/library">{t.programs.yourPrograms}</Link>
      </div>
    );
  }

  return (
    <ProgramForm
      initialData={existingProgram ?? undefined}
      onBack={() => router.push("/programs/library")}
      onSave={async (data) => {
        if (editId) {
          const updated = await updateProgram(editId, data);
          if (!updated) throw new Error("Program no longer available");
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
