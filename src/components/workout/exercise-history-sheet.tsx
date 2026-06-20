"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { HistoryAccordion } from "@/components/progress/history-accordion";
import { useExerciseDetailedHistory } from "@/lib/hooks/use-data";

interface ExerciseHistorySheetProps {
  exerciseId: string | null;
  exerciseName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExerciseHistorySheet({
  exerciseId,
  exerciseName,
  open,
  onOpenChange,
}: ExerciseHistorySheetProps) {
  const history = useExerciseDetailedHistory(open && exerciseId ? exerciseId : "");
  const sessions = history ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="h-[70dvh] max-h-[70dvh] gap-0 rounded-t-2xl p-0 data-[side=bottom]:!h-[70dvh]"
      >
        <SheetHeader className="shrink-0 border-b px-4 py-3.5">
          <SheetTitle className="truncate pr-2">{exerciseName}</SheetTitle>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <HistoryAccordion sessions={sessions} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
