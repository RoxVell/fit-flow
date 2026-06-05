"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useExercises } from "@/lib/hooks/use-data";
import { MUSCLE_GROUP_LABELS, EQUIPMENT_LABELS } from "@/lib/utils/constants";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Minus,
  Trash2,
  Dumbbell,
  ChevronRight,
  ArrowLeft,
  Check,
  Calendar,
  List,
  GripVertical,
  Search,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const DAY_OPTIONS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

interface ExerciseEntry {
  exerciseId: string;
  targetSets: number;
  targetReps: string;
}

interface SessionEntry {
  name: string;
  dayOfWeek: number;
  exercises: ExerciseEntry[];
}

interface ProgramFormProps {
  asPage?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSave: (data: {
    name: string;
    description: string;
    daysPerWeek: number;
    isActive: boolean;
    sessions: {
      name: string;
      dayOfWeek: number;
      sortOrder: number;
      exercises: { exerciseId: string; targetSets: number; targetReps: string; sortOrder: number }[];
    }[];
  }) => void;
  onBack?: () => void;
  initialData?: {
    name: string;
    description: string;
    sessions: {
      name: string;
      dayOfWeek: number;
      exercises: { exerciseId: string; targetSets: number; targetReps: string }[];
    }[];
  };
}

export function ProgramForm({ asPage, open, onOpenChange, onSave, onBack, initialData }: ProgramFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [sessions, setSessions] = useState<SessionEntry[]>(
    initialData?.sessions.map((s) => ({
      name: s.name,
      dayOfWeek: s.dayOfWeek,
      exercises: s.exercises.map((e) => ({
        exerciseId: e.exerciseId,
        targetSets: e.targetSets,
        targetReps: e.targetReps,
      })),
    })) ?? []
  );
  const [editingSessionIdx, setEditingSessionIdx] = useState<number | null>(null);

  const isEditMode = !!initialData;

  const canSave = name.trim() && sessions.length > 0 && sessions.every((s) => s.name.trim() && s.exercises.length > 0);

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      name: name.trim(),
      description: description.trim(),
      daysPerWeek: sessions.length,
      isActive: sessions.length > 0 && sessions.some((s) => s.dayOfWeek === new Date().getDay()),
      sessions: sessions.map((s, i) => ({
        name: s.name.trim(),
        dayOfWeek: s.dayOfWeek,
        sortOrder: i,
        exercises: s.exercises.map((e, j) => ({
          exerciseId: e.exerciseId,
          targetSets: e.targetSets,
          targetReps: e.targetReps,
          sortOrder: j,
        })),
      })),
    });
    setName("");
    setDescription("");
    setSessions([]);
  };

  const addSession = () => {
    const usedDays = new Set(sessions.map((s) => s.dayOfWeek));
    const nextDay = DAY_OPTIONS.find((d) => !usedDays.has(d.value));
    const idx = sessions.length;
    setSessions([
      ...sessions,
      {
        name: `Session ${idx + 1}`,
        dayOfWeek: nextDay?.value ?? 0,
        exercises: [],
      },
    ]);
    setEditingSessionIdx(idx);
  };

  const removeSession = (idx: number) => {
    setSessions(sessions.filter((_, i) => i !== idx));
    if (editingSessionIdx === idx) setEditingSessionIdx(null);
    else if (editingSessionIdx !== null && editingSessionIdx > idx) setEditingSessionIdx(editingSessionIdx - 1);
  };

  const saveEditingSession = (idx: number, updated: SessionEntry) => {
    setSessions(sessions.map((s, i) => (i === idx ? updated : s)));
  };

  if (!asPage && !open) return null;

  const container = asPage ? (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-muted-foreground active:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <h1 className="text-base font-semibold">{isEditMode ? "Edit Program" : "New Program"}</h1>
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className={cn(
            "flex items-center gap-1 text-sm font-semibold transition-colors",
            canSave ? "text-primary" : "text-muted-foreground/30"
          )}
        >
          <Check className="h-4 w-4" />
          {isEditMode ? "Update" : "Save"}
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-lg space-y-8 px-4 py-6 pb-24">
          {/* Info section */}
          <section>
            <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Program Info
            </div>
            <div className="overflow-hidden rounded-xl border bg-card">
              <div className="space-y-0 divide-y divide-border">
                <div className="px-4 py-3.5">
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Push/Pull/Legs"
                    className="border-0 bg-muted/50 px-3 py-2 text-sm"
                  />
                </div>
                <div className="px-4 py-3.5">
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Description</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the program"
                    rows={2}
                    className="border-0 bg-muted/50 px-3 py-2 text-sm resize-none"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Sessions section */}
          <section>
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Sessions ({sessions.length})
              </span>
              <button
                type="button"
                onClick={addSession}
                className="flex items-center gap-1 text-xs font-medium text-primary"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Session
              </button>
            </div>

            {sessions.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/20 py-10">
                <Calendar className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground/60">No sessions yet</p>
                <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={addSession}>
                  <Plus className="h-3 w-3" /> Create First Session
                </Button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border bg-card divide-y divide-border">
                {sessions.map((s, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3.5 cursor-pointer active:bg-accent/50 transition-colors",
                      editingSessionIdx === i && "bg-accent/30"
                    )}
                    onClick={() => setEditingSessionIdx(i)}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <List className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{s.name}</p>
                        <Badge variant="secondary" className="text-[10px] font-normal px-1.5 py-0">
                          {DAY_OPTIONS.find((d) => d.value === s.dayOfWeek)?.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {s.exercises.length > 0
                          ? `${s.exercises.length} exercise${s.exercises.length !== 1 ? "s" : ""}`
                          : "No exercises"}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Session editor dialog */}
      <SessionEditorDialog
        session={editingSessionIdx !== null ? sessions[editingSessionIdx] : null}
        open={editingSessionIdx !== null}
        onOpenChange={(open) => { if (!open) setEditingSessionIdx(null); }}
        onSave={(updated) => {
          if (editingSessionIdx !== null) saveEditingSession(editingSessionIdx, updated);
        }}
        onDelete={() => {
          if (editingSessionIdx !== null) removeSession(editingSessionIdx);
        }}
      />
    </div>
  ) : (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3">
        <button
          type="button"
          onClick={() => onOpenChange?.(false)}
          className="flex items-center gap-1 text-sm text-muted-foreground active:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <h1 className="text-base font-semibold">{isEditMode ? "Edit Program" : "New Program"}</h1>
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className={cn(
            "flex items-center gap-1 text-sm font-semibold transition-colors",
            canSave ? "text-primary" : "text-muted-foreground/30"
          )}
        >
          <Check className="h-4 w-4" />
          {isEditMode ? "Update" : "Save"}
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-lg space-y-8 px-4 py-6">
          {/* Info section */}
          <section>
            <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Program Info
            </div>
            <div className="overflow-hidden rounded-xl border bg-card">
              <div className="space-y-0 divide-y divide-border">
                <div className="px-4 py-3.5">
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Push/Pull/Legs"
                    className="border-0 bg-muted/50 px-3 py-2 text-sm"
                  />
                </div>
                <div className="px-4 py-3.5">
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Description</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the program"
                    rows={2}
                    className="border-0 bg-muted/50 px-3 py-2 text-sm resize-none"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Sessions section */}
          <section>
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Sessions ({sessions.length})
              </span>
              <button
                type="button"
                onClick={addSession}
                className="flex items-center gap-1 text-xs font-medium text-primary"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Session
              </button>
            </div>

            {sessions.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/20 py-10">
                <Calendar className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground/60">No sessions yet</p>
                <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={addSession}>
                  <Plus className="h-3 w-3" /> Create First Session
                </Button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border bg-card divide-y divide-border">
                {sessions.map((s, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3.5 cursor-pointer active:bg-accent/50 transition-colors",
                      editingSessionIdx === i && "bg-accent/30"
                    )}
                    onClick={() => setEditingSessionIdx(i)}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <List className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{s.name}</p>
                        <Badge variant="secondary" className="text-[10px] font-normal px-1.5 py-0">
                          {DAY_OPTIONS.find((d) => d.value === s.dayOfWeek)?.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {s.exercises.length > 0
                          ? `${s.exercises.length} exercise${s.exercises.length !== 1 ? "s" : ""}`
                          : "No exercises"}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Session editor dialog */}
      <SessionEditorDialog
        session={editingSessionIdx !== null ? sessions[editingSessionIdx] : null}
        open={editingSessionIdx !== null}
        onOpenChange={(open) => { if (!open) setEditingSessionIdx(null); }}
        onSave={(updated) => {
          if (editingSessionIdx !== null) saveEditingSession(editingSessionIdx, updated);
        }}
        onDelete={() => {
          if (editingSessionIdx !== null) removeSession(editingSessionIdx);
        }}
      />
    </div>
  );

  return container;
}

function SessionEditorDialog({
  session,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: {
  session: SessionEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (session: SessionEntry) => void;
  onDelete: () => void;
}) {
  const [local, setLocal] = useState<SessionEntry | null>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open && !wasOpen.current && session) {
      setLocal({ ...session });
    }
    wasOpen.current = open;
  }, [open, session]);

  const handleClose = () => {
    if (local && session && (local.name !== session.name || local.dayOfWeek !== session.dayOfWeek || JSON.stringify(local.exercises) !== JSON.stringify(session.exercises))) {
      onSave(local);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-h-[85vh] p-0 gap-0">
        {local && (
          <SessionEditorContent
            session={local}
            onUpdate={(data) => setLocal((prev) => prev ? { ...prev, ...data } : prev)}
            onDelete={onDelete}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function SessionEditorContent({
  session,
  onUpdate,
  onDelete,
}: {
  session: SessionEntry;
  onUpdate: (data: Partial<SessionEntry>) => void;
  onDelete: () => void;
}) {
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const exercises = useExercises();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = session.exercises.findIndex((ex) => ex.exerciseId === active.id);
    const newIndex = session.exercises.findIndex((ex) => ex.exerciseId === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      onUpdate({ exercises: arrayMove(session.exercises, oldIndex, newIndex) });
    }
  };

  return (
    <div className="flex flex-col max-h-[85vh] overflow-hidden">
      <DialogHeader className="px-4 pt-4 pb-0 shrink-0">
        <DialogTitle>Edit Session</DialogTitle>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-5">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Name</label>
            <Input
              value={session.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              placeholder="Session name"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Day of Week</label>
            <div className="flex gap-1.5">
              {DAY_OPTIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => onUpdate({ dayOfWeek: d.value })}
                  className={cn(
                    "flex-1 rounded-lg py-2 text-xs font-medium transition-colors",
                    session.dayOfWeek === d.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Exercises */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Exercises ({session.exercises.length})
              </span>
              <button
                type="button"
                onClick={() => setShowExercisePicker(true)}
                className="flex items-center gap-1 text-xs font-medium text-primary"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            </div>

            {session.exercises.length === 0 ? (
              <div className="rounded-lg border border-dashed bg-muted/20 py-6 text-center">
                <Dumbbell className="mx-auto h-6 w-6 text-muted-foreground/40 mb-1" />
                <p className="text-xs text-muted-foreground/60">No exercises added yet</p>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={session.exercises.map((ex) => ex.exerciseId)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {session.exercises.map((ex, i) => (
                      <SortableExerciseRow
                        key={ex.exerciseId}
                        id={ex.exerciseId}
                        index={i}
                        exerciseName={exercises?.find((e) => e.id === ex.exerciseId)?.name || "Unknown"}
                        targetSets={ex.targetSets}
                        targetReps={ex.targetReps}
                        onUpdate={(data) => {
                          const updated = [...session.exercises];
                          updated[i] = { ...updated[i], ...data };
                          onUpdate({ exercises: updated });
                        }}
                        onRemove={() => {
                          onUpdate({ exercises: session.exercises.filter((_, j) => j !== i) });
                        }}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t px-4 py-3 space-y-2">
        <Button
          variant="destructive"
          size="sm"
          className="w-full gap-1.5"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete Session
        </Button>
      </div>

      <ExercisePickerDialog
        open={showExercisePicker}
        onOpenChange={setShowExercisePicker}
        selectedIds={new Set(session.exercises.map((e) => e.exerciseId))}
        onSelect={(exerciseId) => {
          onUpdate({
            exercises: [
              ...session.exercises,
              { exerciseId, targetSets: 3, targetReps: "" },
            ],
          });
          setShowExercisePicker(false);
        }}
      />
    </div>
  );
}

function SortableExerciseRow({
  id,
  index,
  exerciseName,
  targetSets,
  targetReps,
  onUpdate,
  onRemove,
}: {
  id: string;
  index: number;
  exerciseName: string;
  targetSets: number;
  targetReps: string;
  onUpdate: (data: Partial<ExerciseEntry>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-1.5 rounded-xl border bg-card p-3"
    >
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className="flex items-center justify-center rounded p-0.5 shrink-0 mt-1 text-muted-foreground/40 hover:text-foreground active:text-foreground transition-colors cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium truncate">{exerciseName}</p>
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 ml-1 rounded-full p-1 text-muted-foreground/40 hover:text-destructive transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0 rounded-lg bg-muted">
            <span className="text-xs font-medium text-muted-foreground pl-2">Sets</span>
            <button
              type="button"
              onClick={() => onUpdate({ targetSets: Math.max(1, targetSets - 1) })}
              className="flex items-center justify-center h-7 w-7 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="text-sm font-semibold tabular-nums w-6 text-center">{targetSets}</span>
            <button
              type="button"
              onClick={() => onUpdate({ targetSets: targetSets + 1 })}
              className="flex items-center justify-center h-7 w-7 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1">
            <span className="text-xs font-medium text-muted-foreground">Reps</span>
            <Input
              value={targetReps}
              onChange={(e) => onUpdate({ targetReps: e.target.value })}
              className="h-5 w-14 border-0 bg-transparent px-0 py-0 text-sm font-semibold tabular-nums outline-none"
              placeholder="8-12"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ExercisePickerDialog({
  open,
  onOpenChange,
  selectedIds,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: Set<string>;
  onSelect: (exerciseId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const exercises = useExercises({ search: search || undefined });

  const filtered = useMemo(
    () => exercises?.filter((e) => !selectedIds.has(e.id)) || [],
    [exercises, selectedIds]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Add Exercise</DialogTitle>
        </DialogHeader>
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <ScrollArea className="max-h-[50vh]">
          <div className="space-y-0.5">
            {filtered.map((ex) => (
              <button
                key={ex.id}
                type="button"
                className="w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm hover:bg-accent transition-colors"
                onClick={() => onSelect(ex.id)}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Dumbbell className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{ex.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge variant="secondary" className="text-[10px] font-normal px-1.5 py-0">
                      {MUSCLE_GROUP_LABELS[ex.muscleGroup]}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{EQUIPMENT_LABELS[ex.equipment]}</span>
                  </div>
                </div>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-muted-foreground/20">
                  <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">
                {search ? "No matching exercises" : "All exercises already added"}
              </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
