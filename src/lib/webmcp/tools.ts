import { getCompletedWorkoutLogsInRange } from "@/lib/repositories/workouts";
import { buildWorkoutReport } from "@/lib/workout/analysis";
import { createWorkoutExportRange } from "@/lib/workout/export-csv";
import { atEndOfDay, atStartOfDay, formatDateKey } from "@/lib/utils/date";

export type BrowserTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
  execute: (input: unknown) => Promise<unknown>;
};

function parseDate(value: unknown, field: string) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${field} must be a calendar date YYYY-MM-DD.`);
  }
  const date = new Date(`${value}T00:00:00`);
  if (!Number.isFinite(date.getTime()) || formatDateKey(date) !== value) {
    throw new Error(`${field} is not a valid calendar date.`);
  }
  return date;
}

export function parseToolInput(input: unknown, paginated: boolean, now = new Date()) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Arguments must be an object.");
  const args = input as Record<string, unknown>;
  const allowed = paginated ? ["from", "to", "limit", "offset"] : ["from", "to"];
  if (Object.keys(args).some((key) => !allowed.includes(key))) throw new Error("Unknown argument.");
  if ((args.from === undefined) !== (args.to === undefined)) throw new Error("Supply both from and to, or omit both for the last three calendar months.");
  const range = args.from === undefined ? createWorkoutExportRange("3m", now) : {
    from: atStartOfDay(parseDate(args.from, "from")), to: atEndOfDay(parseDate(args.to, "to")),
  };
  if (range.from > range.to) throw new Error("from must be on or before to.");
  // Bound response size and weekly aggregation work; longer histories can be queried in parts.
  if (range.to.getTime() - range.from.getTime() > 366 * 5 * 86400000) throw new Error("Query at most five years at a time.");
  const limit = args.limit ?? 50;
  const offset = args.offset ?? 0;
  if (typeof limit !== "number" || !Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error("limit must be an integer from 1 to 100.");
  if (typeof offset !== "number" || !Number.isSafeInteger(offset) || offset < 0) throw new Error("offset must be a non-negative safe integer.");
  return { range, limit, offset };
}

const dateProperties = {
  from: { type: "string", format: "date", description: "Inclusive start date YYYY-MM-DD in the browser time zone. Supply with to; omit both for the last three calendar months." },
  to: { type: "string", format: "date", description: "Inclusive end date YYYY-MM-DD in the browser time zone. Supply with from. Maximum range five years." },
};

export function createWorkoutTools(): BrowserTool[] {
  return [false, true].map((summary) => ({
    name: summary ? "get_progress_summary" : "get_workouts",
    description: summary
      ? "Read FitFlow training progress for a period: all weekly totals including empty weeks, per-exercise history and estimated 1RM change. Defaults to the last three months. Data comes from this browser only; empty results do not prove there is no history on another device. Read methodology before interpreting results."
      : "Read completed FitFlow workouts with exercises, completed sets, kg, reps, RIR, notes and exclusion flags. Defaults to the last three months. Data comes from this browser only. Follow nextOffset until null to obtain all workouts.",
    inputSchema: { type: "object", additionalProperties: false, properties: {
      ...dateProperties,
      ...(!summary ? {
        limit: { type: "integer", minimum: 1, maximum: 100, default: 50, description: "Maximum workouts per page." },
        offset: { type: "integer", minimum: 0, default: 0, description: "Offset from the preceding nextOffset; workouts are ordered oldest first." },
      } : {}),
    } },
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    execute: async (input: unknown) => {
      try {
        const { range, limit, offset } = parseToolInput(input, !summary);
        const report = buildWorkoutReport(await getCompletedWorkoutLogsInRange(range.from, range.to), range);
        const { workouts, summary: progress, ...metadata } = report;
        const data = summary ? { ...metadata, summary: progress } : {
          ...metadata, total: workouts.length,
          nextOffset: offset + limit < workouts.length ? offset + limit : null,
          workouts: workouts.slice(offset, offset + limit),
        };
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      } catch (error) {
        return { isError: true, content: [{ type: "text", text: error instanceof Error ? error.message : "Could not read local workout history." }] };
      }
    },
  }));
}
