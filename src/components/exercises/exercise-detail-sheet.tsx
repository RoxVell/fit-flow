"use client";

import BodyModel from "react-body-highlighter";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExerciseVideo } from "@/components/exercises/exercise-video";
import { useExerciseDetail } from "@/lib/hooks/use-exercise-library";
import { pickLocalized, pickLocalizedList } from "@/lib/exercises/locale";
import {
  BODY_PART_LABELS,
  LATERALITY_LABELS,
  labelFor,
} from "@/lib/exercises/labels";
import {
  formatMuscleName,
  toHighlighterData,
  topMuscles,
} from "@/lib/exercises/muscle-map";
import { exerciseUi } from "@/lib/exercises/ui";
import { useLocale } from "@/lib/stores/locale-store";

interface ExerciseDetailSheetProps {
  exerciseId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExerciseDetailSheet({
  exerciseId,
  open,
  onOpenChange,
}: ExerciseDetailSheetProps) {
  const locale = useLocale();
  const ui = exerciseUi[locale];
  const { detail, manifestItem, loading, error } = useExerciseDetail(
    open ? exerciseId : null
  );

  const name = detail
    ? pickLocalized(detail.name, locale)
    : manifestItem
      ? pickLocalized(manifestItem.name, locale)
      : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="fixed inset-0 top-0 left-0 flex h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 p-0 sm:max-w-none [&_[data-slot=dialog-close]]:top-1/2 [&_[data-slot=dialog-close]]:right-3 [&_[data-slot=dialog-close]]:-translate-y-1/2"
      >
        <DialogHeader className="relative flex shrink-0 flex-row items-center border-b px-4 pb-3 pr-12 pt-[max(1rem,env(safe-area-inset-top))]">
          <DialogTitle className="text-left text-lg leading-snug">{name}</DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}

        {error && (
          <p className="flex flex-1 items-center justify-center px-4 text-center text-sm text-muted-foreground">
            {error.message}
          </p>
        )}

        {detail && !loading && (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 space-y-3 px-4 pt-3">
              <ExerciseVideo
                videoDarkUrl={detail.videoDarkUrl}
                videoLightUrl={detail.videoLightUrl}
                poster={detail.thumbnail1Uri ?? detail.imageUri}
                alt={name}
              />

              <div className="flex flex-wrap gap-1.5">
                <Badge>{labelFor(BODY_PART_LABELS, detail.bodyPart, locale)}</Badge>
                <Badge variant="outline">
                  {labelFor(LATERALITY_LABELS, detail.laterality, locale)}
                </Badge>
              </div>
            </div>

            <Tabs
              defaultValue="overview"
              className="mt-3 flex min-h-0 flex-1 flex-col px-4"
            >
              <TabsList className="grid h-auto w-full grid-cols-5 gap-0.5 p-1">
                <TabsTrigger value="overview" className="px-1 text-[10px] sm:text-[11px]">
                  {ui.overview}
                </TabsTrigger>
                <TabsTrigger value="instructions" className="px-1 text-[10px] sm:text-[11px]">
                  {ui.instructions}
                </TabsTrigger>
                <TabsTrigger value="tips" className="px-1 text-[10px] sm:text-[11px]">
                  {ui.tips}
                </TabsTrigger>
                <TabsTrigger value="mistakes" className="px-1 text-[10px] sm:text-[11px]">
                  {ui.commonMistakes}
                </TabsTrigger>
                <TabsTrigger value="muscles" className="px-1 text-[10px] sm:text-[11px]">
                  {ui.muscles}
                </TabsTrigger>
              </TabsList>

              <div className="min-h-0 flex-1 overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3">
                <TabsContent value="overview" className="mt-0">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {pickLocalized(detail.description, locale)}
                  </p>
                </TabsContent>

                <TabsContent value="instructions" className="mt-0">
                  <ol className="list-decimal space-y-2 pl-4 text-sm text-muted-foreground">
                    {pickLocalizedList(detail.instructions, locale).map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </TabsContent>

                <TabsContent value="tips" className="mt-0">
                  <ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
                    {pickLocalizedList(detail.tips, locale).map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </TabsContent>

                <TabsContent value="mistakes" className="mt-0">
                  <ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
                    {pickLocalizedList(detail.commonMistakes, locale).map(
                      (mistake, i) => (
                        <li key={i}>{mistake}</li>
                      )
                    )}
                  </ul>
                </TabsContent>

                <TabsContent value="muscles" className="mt-0 space-y-4">
                  <div className="flex justify-center gap-2 rounded-xl border bg-muted/30 p-2">
                    {(["anterior", "posterior"] as const).map((side) => (
                      <BodyModel
                        key={side}
                        type={side}
                        data={toHighlighterData(detail.exerciseMuscles).map(
                          (m) => ({
                            name: m.slug,
                            muscles: [m.slug],
                            frequency: m.intensity,
                          })
                        ) as never}
                        bodyColor="var(--color-muted)"
                        highlightedColors={["#fde68a", "#fb923c", "#f97316", "#ea580c"]}
                        svgStyle={{ width: "110px", height: "auto" }}
                      />
                    ))}
                  </div>
                  <div className="space-y-2">
                    {topMuscles(detail.exerciseMuscles).map((muscle) => (
                      <div key={muscle.name} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>{formatMuscleName(muscle.name)}</span>
                          <span className="text-muted-foreground">
                            {muscle.percent}%
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${muscle.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
