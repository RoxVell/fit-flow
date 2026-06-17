"use client";

import { useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Dumbbell, Search } from "lucide-react";
import { ExercisePickerRow } from "@/components/exercises/exercise-picker-row";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ExerciseDetailSheet } from "@/components/exercises/exercise-detail-sheet";
import { useSortedExerciseLibrary } from "@/lib/hooks/use-sorted-exercise-library";
import { pickLocalized } from "@/lib/exercises/locale";
import {
  BODY_PART_LABELS,
  LATERALITY_LABELS,
  labelFor,
} from "@/lib/exercises/labels";
import { exerciseUi } from "@/lib/exercises/ui";
import { useLocale } from "@/lib/stores/locale-store";
import type { BodyPart } from "@/lib/exercises/types";

const BODY_PARTS: BodyPart[] = [
  "CHEST",
  "BACK",
  "SHOULDERS",
  "BICEPS",
  "TRICEPS",
  "LEGS",
  "GLUTEUS",
  "ABS",
  "FOREARMS",
];

export function ExerciseLibraryList() {
  const locale = useLocale();
  const ui = exerciseUi[locale];
  const [search, setSearch] = useState("");
  const [bodyPart, setBodyPart] = useState<BodyPart | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const filters = useMemo(
    () => ({
      search: search || undefined,
      bodyPart,
    }),
    [search, bodyPart]
  );
  const { exercises, loading, usageCounts } = useSortedExerciseLibrary(filters);

  const parentRef = useRef<HTMLDivElement>(null);
  const items = exercises ?? [];

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    gap: 4,
    overscan: 6,
  });

  const openDetail = (id: string) => {
    setSelectedId(id);
    setDetailOpen(true);
  };

  return (
    <>
      <div className="px-4 pb-2 mb-2 space-y-3 shrink-0">
        <p className="text-xs text-muted-foreground">
          {loading ? ui.loading : ui.exerciseCount(items.length)}
        </p>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={ui.searchPlaceholder}
            className="pl-9 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <div className="flex gap-2 pb-1">
            <Badge
              variant={!bodyPart ? "default" : "outline"}
              className="cursor-pointer shrink-0"
              onClick={() => setBodyPart(null)}
            >
              {ui.all}
            </Badge>
            {BODY_PARTS.map((bp) => (
              <Badge
                key={bp}
                variant={bodyPart === bp ? "default" : "outline"}
                className="cursor-pointer shrink-0"
                onClick={() => setBodyPart(bodyPart === bp ? null : bp)}
              >
                {labelFor(BODY_PART_LABELS, bp, locale)}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div ref={parentRef} className="flex-1 overflow-y-auto px-2 pt-1 min-h-0">
        {loading ? (
          <div className="space-y-1 px-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <Dumbbell className="h-8 w-8" />
            <p className="text-sm">{ui.noResults}</p>
          </div>
        ) : (
          <div
            style={{ height: `${virtualizer.getTotalSize()}px` }}
            className="relative w-full"
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const ex = items[virtualRow.index];
              const name = pickLocalized(ex.name, locale);
              const count = usageCounts?.get(ex.id) ?? 0;
              return (
                <div
                  key={ex.id}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <ExercisePickerRow
                    name={name}
                    thumbnailUri={ex.thumbnailUri}
                    subtitle={[
                      labelFor(BODY_PART_LABELS, ex.bodyPart, locale),
                      labelFor(LATERALITY_LABELS, ex.laterality, locale),
                    ].join(" · ")}
                    usageCount={count}
                    usageLabel={count > 0 ? ui.usageTimes(count) : undefined}
                    onClick={() => openDetail(ex.id)}
                    className="px-2"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ExerciseDetailSheet
        exerciseId={selectedId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
}

