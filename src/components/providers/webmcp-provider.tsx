"use client";

import { useEffect } from "react";
import { registerWorkoutTools, type ModelContext } from "@/lib/webmcp/register";
import { createWorkoutTools } from "@/lib/webmcp/tools";

export function WebMCPProvider() {
  useEffect(() => {
    const documentContext = (document as Document & { modelContext?: ModelContext }).modelContext;
    const context = documentContext
      ?? (navigator as Navigator & { modelContext?: ModelContext }).modelContext;
    if (!context?.registerTool) return;
    return registerWorkoutTools(context, createWorkoutTools(), !documentContext);
  }, []);
  return null;
}
