"use client";

import { useRouter } from "next/navigation";
import { BodyMeasurementForm } from "@/components/progress/body-measurement-form";

export default function BodyMeasurementLogPage() {
  const router = useRouter();

  return (
    <BodyMeasurementForm
      asPage
      onBack={() => router.back()}
      onSuccess={() => router.push("/progress?tab=body")}
    />
  );
}
