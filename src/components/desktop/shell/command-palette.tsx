"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, ListChecks, Play } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDt } from "@/lib/i18n/use-dt";
import { useLocale } from "@/lib/i18n/locale-context";
import { useAllWorkoutLogs } from "@/lib/desktop/use-desktop-data";
import { useExerciseManifest } from "@/lib/hooks/use-exercise-library";
import { pickLocalized } from "@/lib/exercises/locale";
import { formatDay } from "@/lib/desktop/format";
import { NAV_ITEMS } from "./nav";

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const dt = useDt();
  const locale = useLocale();
  const { manifest } = useExerciseManifest();
  const logs = useAllWorkoutLogs();

  const exercises = useMemo(() => {
    if (!manifest) return [];
    return manifest.slice(0, 400).map((item) => ({
      id: item.id,
      name: pickLocalized(item.name, locale),
      bodyPart: item.bodyPart,
    }));
  }, [manifest, locale]);

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    /* Composed from Dialog directly: the shared CommandDialog renders its
       title outside the popup, which Base UI rejects at runtime. */
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-1/4 translate-y-0 overflow-hidden rounded-xl! p-0 sm:max-w-xl"
      >
        <DialogTitle className="sr-only">{dt.search.placeholder}</DialogTitle>
        <DialogDescription className="sr-only">
          {dt.search.placeholder}
        </DialogDescription>
        <Command>
          <CommandInput placeholder={dt.search.placeholder} />
      <CommandList className="max-h-[26rem]">
        <CommandEmpty>{dt.search.noResults}</CommandEmpty>

        <CommandGroup heading={dt.search.pages}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.href}
                value={dt.nav[item.key] + " " + item.href}
                onSelect={() => go(item.href)}
              >
                <Icon className="size-4 text-muted-foreground" />
                <span>{dt.nav[item.key]}</span>
              </CommandItem>
            );
          })}
          <CommandItem
            value={dt.window.startWorkout}
            onSelect={() => go("/workout")}
          >
            <Play className="size-4 text-primary" />
            <span>{dt.window.startWorkout}</span>
          </CommandItem>
        </CommandGroup>

        {logs && logs.length > 0 && (
          <CommandGroup heading={dt.search.sessions}>
            {logs.slice(0, 6).map((log) => (
              <CommandItem
                key={log.id}
                value={
                  (log.sessionName ?? log.programName ?? "workout") + " " + log.id
                }
                onSelect={() => go("/desktop/sessions?id=" + log.id)}
              >
                <ListChecks className="size-4 text-muted-foreground" />
                <span className="truncate">
                  {log.sessionName ?? log.programName ?? dt.nav.sessions}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {formatDay(log.startedAt, locale)}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {exercises.length > 0 && (
          <CommandGroup heading={dt.search.exercises}>
            {exercises.map((exercise) => (
              <CommandItem
                key={exercise.id}
                value={exercise.name}
                onSelect={() => go("/desktop/exercises?id=" + exercise.id)}
              >
                <Dumbbell className="size-4 text-muted-foreground" />
                <span className="truncate">{exercise.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {dt.bodyParts[exercise.bodyPart]}
                </span>
              </CommandItem>
            ))}
            </CommandGroup>
          )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
