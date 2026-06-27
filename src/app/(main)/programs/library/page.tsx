"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePrograms } from "@/lib/hooks/use-data";
import { useExerciseLookup } from "@/lib/hooks/use-exercise-lookup";
import { deleteProgram, setActiveProgram } from "@/lib/repositories/programs";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useT } from "@/lib/i18n/use-t";
import { useFormat } from "@/lib/i18n/use-format";
import { ExerciseLibraryList } from "@/components/exercises/exercise-library-list";
import { Plus, Pencil, Library, LayoutList, Trash2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ProgramsPage() {
  const t = useT();
  const [view, setView] = useState<"programs" | "exercises">("programs");

  const views = [
    { value: "programs" as const, label: t.programs.title, icon: Library },
    { value: "exercises" as const, label: t.programs.exercisesTab, icon: LayoutList },
  ];

  return (
    <div className="flex flex-col h-full pt-[env(safe-area-inset-top)]">
      <div className="px-4 pt-4 pb-3 shrink-0">
        <h1 className="text-2xl font-bold mb-3">{t.programs.title}</h1>
        <div className="flex rounded-lg bg-muted p-0.5">
          {views.map((v) => (
            <button
              key={v.value}
              type="button"
              onClick={() => setView(v.value)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all",
                view === v.value
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground"
              )}
            >
              <v.icon className="h-4 w-4" />
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {view === "programs" ? <ProgramsView /> : <ExercisesView />}
    </div>
  );
}

function ProgramsView() {
  const t = useT();
  const { dayLabels } = useFormat();
  const programs = usePrograms();
  const { getName } = useExerciseLookup();
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  const handleSetActive = async (id: string) => {
    if (activatingId) return;
    setActivatingId(id);
    try {
      await setActiveProgram(id);
    } catch {
      setActivatingId(null);
    }
  };

  useEffect(() => {
    if (!activatingId || !programs) return;
    const activated = programs.some((p) => p.id === activatingId && p.isActive);
    if (activated) setActivatingId(null);
  }, [programs, activatingId]);

  const confirmDelete = async () => {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      await deleteProgram(pendingDelete.id);
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {t.programs.yourPrograms}
        </h2>
        <Link href="/programs/create">
          <Button variant="outline" size="sm" className="gap-1 h-7 text-xs">
            <Plus className="h-3.5 w-3.5" />
            {t.programs.createNew}
          </Button>
        </Link>
      </div>

      {programs?.map((prog) => (
        <Card key={prog.id} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="px-4 pt-2 pb-3">
              <div className="flex items-start justify-between gap-2">
                <label className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                  <input
                    type="radio"
                    name="active-program"
                    checked={prog.isActive || activatingId === prog.id}
                    disabled={activatingId != null && activatingId !== prog.id}
                    aria-label={`${t.programs.setActive}: ${prog.name}`}
                    onClick={() => {
                      if (!prog.isActive && activatingId == null) {
                        void handleSetActive(prog.id);
                      }
                    }}
                    onChange={() => {}}
                    className="h-4 w-4 accent-primary"
                  />
                </label>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-bold">{prog.name}</p>
                    {(prog.isActive || activatingId === prog.id) && (
                      <Badge className="text-[10px] h-5 px-2">{t.programs.active}</Badge>
                    )}
                  </div>
                  {prog.description && (
                    <p className="text-sm text-muted-foreground mt-0.5">{prog.description}</p>
                  )}
                  <Badge variant="secondary" className="text-[10px] mt-1.5">
                    {t.programs.daysSessions(prog.daysPerWeek, prog.sessions.length)}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Link href={`/programs/create?edit=${prog.id}`}>
                    <Button variant="ghost" size="sm" className="gap-1 h-7 text-xs">
                      <Pencil className="h-3 w-3" />
                      {t.programs.edit}
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    aria-label={t.programs.deleteProgram}
                    onClick={() => setPendingDelete({ id: prog.id, name: prog.name })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="border-t divide-y divide-border">
              {prog.sessions.map((s) => {
                const dayLabel = dayLabels[s.dayOfWeek % 7];
                return (
                  <div key={s.id} className="px-4 py-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground w-8">{dayLabel}</span>
                      <span className="text-sm font-medium">{s.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {t.programs.exerciseShort(s.exercises.length)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 pl-10">
                      {s.exercises.map((se) => (
                        <Badge key={se.id} variant="outline" className="text-xs font-normal">
                          {se.exercise?.name ||
                            getName(se.exerciseId, t.programs.unknownExercise)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      <ConfirmDialog
        open={!!pendingDelete}
        title={t.programs.deleteProgram}
        description={t.programs.deleteProgramConfirm(pendingDelete?.name ?? "")}
        confirmLabel={t.programs.delete}
        cancelLabel={t.programs.cancel}
        pendingLabel={t.programs.deleting}
        destructive
        pending={deleting}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}

function ExercisesView() {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <ExerciseLibraryList />
    </div>
  );
}
