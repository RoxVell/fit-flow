"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardioForm } from "@/components/cardio/cardio-form";
import { useCardioSessions } from "@/lib/hooks/use-queries";
import { formatDuration } from "@/lib/utils/calculations";

export default function CardioPage() {
  const router = useRouter();
  const { data: sessions } = useCardioSessions();

  return (
    <div className="space-y-4 p-4 pb-24">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Cardio</h1>
      </div>

      <CardioForm onSuccess={() => router.push("/dashboard")} />

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          History
        </h2>
        {sessions?.map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded-xl border bg-card p-3">
            <div>
              <p className="font-medium capitalize text-sm">{s.type}</p>
              <p className="text-xs text-muted-foreground">
                {s.distance} km · {formatDuration(s.duration / 60)}
              </p>
            </div>
            {s.avgHeartRate && (
              <span className="text-sm text-muted-foreground">{s.avgHeartRate} bpm</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
