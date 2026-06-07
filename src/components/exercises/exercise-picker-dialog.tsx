"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { ExercisePickerRow } from "@/components/exercises/exercise-picker-row";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { pickLocalized } from "@/lib/exercises/locale";
import { BODY_PART_LABELS, labelFor } from "@/lib/exercises/labels";
import { exerciseUi } from "@/lib/exercises/ui";
import { useSortedExerciseLibrary } from "@/lib/hooks/use-sorted-exercise-library";
import { useLocale } from "@/lib/stores/locale-store";

interface ExercisePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  excludeIds?: Set<string>;
  onlyUsed?: boolean;
  onSelect: (exerciseId: string) => void;
  emptyMessage?: string;
  emptyMessageAllExcluded?: string;
  showAddAction?: boolean;
}

export function ExercisePickerDialog({
  open,
  onOpenChange,
  title,
  excludeIds,
  onlyUsed = false,
  onSelect,
  emptyMessage,
  emptyMessageAllExcluded,
  showAddAction = false,
}: ExercisePickerDialogProps) {
  if (!open) return null;

  return (
    <ExercisePickerDialogContent
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      excludeIds={excludeIds}
      onlyUsed={onlyUsed}
      onSelect={onSelect}
      emptyMessage={emptyMessage}
      emptyMessageAllExcluded={emptyMessageAllExcluded}
      showAddAction={showAddAction}
    />
  );
}

function ExercisePickerDialogContent({
  open,
  onOpenChange,
  title,
  excludeIds,
  onlyUsed = false,
  onSelect,
  emptyMessage,
  emptyMessageAllExcluded,
  showAddAction = false,
}: ExercisePickerDialogProps) {
  const locale = useLocale();
  const ui = exerciseUi[locale];
  const [search, setSearch] = useState("");

  const filters = useMemo(
    () => ({ search: search.trim() || undefined }),
    [search]
  );
  const { exercises, loading, usageCounts } = useSortedExerciseLibrary(filters);

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  const items = useMemo(() => {
    let result = exercises?.filter((e) => !excludeIds?.has(e.id)) ?? [];
    if (onlyUsed) {
      result = result.filter((e) => (usageCounts?.get(e.id) ?? 0) > 0);
    }
    return result;
  }, [exercises, excludeIds, onlyUsed, usageCounts]);

  const recentItems = useMemo(
    () => (onlyUsed ? [] : items.filter((e) => (usageCounts?.get(e.id) ?? 0) > 0)),
    [items, usageCounts, onlyUsed]
  );
  const otherItems = useMemo(
    () => (onlyUsed ? items : items.filter((e) => (usageCounts?.get(e.id) ?? 0) === 0)),
    [items, usageCounts, onlyUsed]
  );

  const handleSelect = (exerciseId: string) => {
    onSelect(exerciseId);
    onOpenChange(false);
  };

  const renderItem = (ex: (typeof items)[number]) => {
    const name = pickLocalized(ex.name, locale);
    const count = usageCounts?.get(ex.id) ?? 0;
    return (
      <ExercisePickerRow
        key={ex.id}
        name={name}
        thumbnailUri={ex.thumbnailUri}
        subtitle={labelFor(BODY_PART_LABELS, ex.bodyPart, locale)}
        usageCount={count}
        usageLabel={count > 0 ? ui.usageTimes(count) : undefined}
        onClick={() => handleSelect(ex.id)}
        action={
          showAddAction ? (
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-muted-foreground/20">
              <Plus className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          ) : undefined
        }
      />
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="shrink-0 px-4 pt-4 pb-2">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="shrink-0 px-4 pb-3">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={ui.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-2 pb-4">
          {loading ? (
            <div className="space-y-1 px-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-muted-foreground">
              {search.trim()
                ? (emptyMessage ?? ui.noResults)
                : (emptyMessageAllExcluded ?? emptyMessage ?? ui.noResults)}
            </p>
          ) : (
            <div className="space-y-0.5">
              {!onlyUsed && recentItems.length > 0 && !search.trim() ? (
                <>
                  <p className="px-2 pt-1 pb-1 text-xs font-medium text-muted-foreground">
                    {ui.recentExercises}
                  </p>
                  {recentItems.map(renderItem)}
                  {otherItems.length > 0 ? (
                    <p className="px-2 pt-3 pb-1 text-xs font-medium text-muted-foreground">
                      {ui.allExercises}
                    </p>
                  ) : null}
                </>
              ) : null}
              {(search.trim() || onlyUsed ? items : otherItems).map(renderItem)}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
