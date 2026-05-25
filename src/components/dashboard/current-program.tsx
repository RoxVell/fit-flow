"use client";

import { motion } from "framer-motion";
import { ArrowRight, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WorkoutSession } from "@/lib/db/types";
import Link from "next/link";

interface CurrentProgramProps {
  programName: string;
  session?: WorkoutSession;
}

export function CurrentProgram({ programName, session }: CurrentProgramProps) {
  if (!session) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-2 py-6 text-center">
          <Calendar className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No workout scheduled today</p>
        </CardContent>
      </Card>
    );
  }

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date().getDay();
  const isToday = session.dayOfWeek === today || session.dayOfWeek % 7 === today;

  return (
    <Link href={`/workout/active?session=${session.id}`}>
      <motion.div whileTap={{ scale: 0.98 }}>
        <Card className="relative overflow-hidden border-primary/20">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent" />
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{programName}</p>
                <p className="font-semibold">{session.name}</p>
                <div className="flex items-center gap-2">
                  <Badge variant={isToday ? "default" : "secondary"} className="text-[10px]">
                    {dayLabels[session.dayOfWeek % 7]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {session.exercises.length} exercises
                  </span>
                </div>
              </div>
              <ArrowRight className="mt-1 h-5 w-5 text-primary" />
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {session.exercises.slice(0, 4).map((se) => (
                <Badge key={se.id} variant="outline" className="text-[10px] font-normal">
                  {se.exercise?.name || "..."}
                </Badge>
              ))}
              {session.exercises.length > 4 && (
                <Badge variant="outline" className="text-[10px] font-normal">
                  +{session.exercises.length - 4}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}
