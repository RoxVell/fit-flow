"use client";

import { useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Dumbbell, Search, SlidersHorizontal } from "lucide-react";
import { ExerciseThumbnail } from "@/components/exercises/exercise-thumbnail";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ExerciseDetailSheet } from "@/components/exercises/exercise-detail-sheet";
import { useExerciseLibrary } from "@/lib/hooks/use-exercise-library";
import { pickLocalized } from "@/lib/exercises/locale";
import {
  BODY_PART_LABELS,
  EQUIPMENT_LABELS,
  LATERALITY_LABELS,
  MECHANICS_LABELS,
  labelFor,
} from "@/lib/exercises/labels";
import { exerciseUi } from "@/lib/exercises/ui";
import { useLocale } from "@/lib/stores/locale-store";
import type { BodyPart, LibraryMechanics } from "@/lib/exercises/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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

const MECHANICS_OPTIONS: LibraryMechanics[] = ["COMPOUND", "ISOLATION"];

export function ExerciseLibraryList() {
  const locale = useLocale();
  const ui = exerciseUi[locale];
  const [search, setSearch] = useState("");
  const [bodyPart, setBodyPart] = useState<BodyPart | null>(null);
  const [equipment, setEquipment] = useState<string | null>(null);
  const [mechanics, setMechanics] = useState<LibraryMechanics | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const filters = useMemo(
    () => ({
      search: search || undefined,
      bodyPart,
      equipment,
      mechanics,
    }),
    [search, bodyPart, equipment, mechanics]
  );
  const { exercises, loading } = useExerciseLibrary(filters);

  const parentRef = useRef<HTMLDivElement>(null);
  const items = exercises ?? [];

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 68,
    gap: 8,
    overscan: 6,
  });

  const openDetail = (id: string) => {
    setSelectedId(id);
    setDetailOpen(true);
  };

  return (
    <>
      <div className="px-4 pb-2 mb-2 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {loading ? ui.loading : ui.exerciseCount(items.length)}
          </p>
          <Sheet>
            <SheetTrigger className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {ui.filters}
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl">
              <SheetHeader>
                <SheetTitle>{ui.filters}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    {ui.mechanics}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={!mechanics ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setMechanics(null)}
                    >
                      {ui.all}
                    </Badge>
                    {MECHANICS_OPTIONS.map((m) => (
                      <Badge
                        key={m}
                        variant={mechanics === m ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() =>
                          setMechanics(mechanics === m ? null : m)
                        }
                      >
                        {labelFor(MECHANICS_LABELS, m, locale)}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    {ui.equipment}
                  </p>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                    <Badge
                      variant={!equipment ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setEquipment(null)}
                    >
                      {ui.all}
                    </Badge>
                    {EQUIPMENT_FILTER_OPTIONS.map((eq) => (
                      <Badge
                        key={eq}
                        variant={equipment === eq ? "default" : "outline"}
                        className="cursor-pointer text-[10px]"
                        onClick={() =>
                          setEquipment(equipment === eq ? null : eq)
                        }
                      >
                        {labelFor(EQUIPMENT_LABELS, eq, locale)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

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

      <div ref={parentRef} className="flex-1 overflow-y-auto px-4 pb-24 min-h-0">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
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
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => openDetail(ex.id)}
                  >
                    <Card className="cursor-pointer overflow-hidden transition-transform active:scale-[0.99]">
                      <CardContent className="flex items-center gap-2.5 px-3 py-2">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                          <ExerciseThumbnail
                            src={ex.thumbnailUri}
                            alt={name}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{name}</p>
                          <div className="mt-0.5 flex gap-1">
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {labelFor(BODY_PART_LABELS, ex.bodyPart, locale)}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {labelFor(LATERALITY_LABELS, ex.laterality, locale)}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </button>
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

const EQUIPMENT_FILTER_OPTIONS = [
  "BARBELL",
  "DUMBBELL",
  "CABLE_MACHINE",
  "SELECTORIZED_MACHINE",
  "KETTLEBELL",
  "RESISTANCE_BAND",
  "SMITH_MACHINE",
  "PULL_UP_BAR",
  "BENCH",
] as const;
