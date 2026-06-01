import {
  idbDelete,
  idbGet,
  idbGetAll,
} from "@/lib/db/idb";
import * as db from "@/lib/db/queries";
import { ensureSeeded } from "@/lib/db/seed-loader";
import type {
  BodyMeasurement,
  CardioSession,
  DashboardStats,
  Exercise,
  ExerciseFilters,
  PersonalRecord,
  WorkoutLog,
  WorkoutProgram,
} from "@/lib/db/types";
import type { HttpMethod } from "./types";

export interface Transport {
  request<T = unknown>(method: HttpMethod, url: string, body?: unknown): Promise<{
    status: number;
    data: T;
  }>;
}

function parseUrl(url: string): { pathname: string; params: URLSearchParams } {
  const [pathname, query = ""] = url.split("?");
  return { pathname, params: new URLSearchParams(query) };
}

function jsonOk<T>(data: T, status = 200) {
  return { status, data: data as T };
}

function jsonNotFound<T>() {
  return { status: 404, data: null as T };
}

export const localTransport: Transport = {
  async request<T>(method: HttpMethod, url: string, body?: unknown) {
    const { pathname, params } = parseUrl(url);

    if (pathname === "/api/exercises" && method === "GET") {
      await ensureSeeded();
      return jsonOk<T>((await db.getExercises()) as T);
    }
    if (pathname === "/api/programs" && method === "GET") {
      await ensureSeeded();
      return jsonOk<T>((await db.getPrograms()) as T);
    }
    if (pathname === "/api/programs" && method === "POST") {
      return jsonOk<T>(
        (await db.createProgram(body as Parameters<typeof db.createProgram>[0])) as T,
        201
      );
    }
    if (pathname === "/api/programs/active" && method === "GET") {
      await ensureSeeded();
      return jsonOk<T>(((await db.getActiveProgram()) ?? null) as T);
    }
    if (pathname === "/api/workout-logs" && method === "GET") {
      await ensureSeeded();
      const limitParam = params.get("limit");
      const limit = limitParam ? Number(limitParam) : undefined;
      return jsonOk<T>((await db.getWorkoutLogs(limit)) as T);
    }
    if (pathname === "/api/workout-logs" && method === "POST") {
      return jsonOk<T>(
        (await db.createWorkoutLog(body as Omit<WorkoutLog, "id">)) as T,
        201
      );
    }
    if (pathname === "/api/body-measurements" && method === "GET") {
      await ensureSeeded();
      return jsonOk<T>((await db.getBodyMeasurements()) as T);
    }
    if (pathname === "/api/body-measurements" && method === "POST") {
      return jsonOk<T>(
        (await db.logBodyMeasurement(body as Omit<BodyMeasurement, "id">)) as T,
        201
      );
    }
    if (pathname === "/api/cardio-sessions" && method === "GET") {
      await ensureSeeded();
      return jsonOk<T>((await db.getCardioSessions()) as T);
    }
    if (pathname === "/api/cardio-sessions" && method === "POST") {
      return jsonOk<T>(
        (await db.createCardioSession(body as Omit<CardioSession, "id">)) as T,
        201
      );
    }
    if (pathname === "/api/personal-records" && method === "GET") {
      await ensureSeeded();
      return jsonOk<T>((await db.getPersonalRecords()) as T);
    }
    if (pathname === "/api/personal-records" && method === "POST") {
      return jsonOk<T>(
        (await db.createPersonalRecord(body as Omit<PersonalRecord, "id">)) as T,
        201
      );
    }
    if (pathname === "/api/dashboard-stats" && method === "GET") {
      return jsonOk<T>((await db.getDashboardStats()) as T);
    }

    const programItemMatch = pathname.match(/^\/api\/programs\/([^/]+)$/);
    if (programItemMatch) {
      const programId = programItemMatch[1];
      if (method === "GET") {
        const item = await db.getProgramById(programId);
        return item ? jsonOk<T>(item as T) : jsonNotFound<T>();
      }
      if (method === "PUT") {
        const updated = await db.updateProgram(
          programId,
          body as Parameters<typeof db.updateProgram>[1]
        );
        return updated ? jsonOk<T>(updated as T) : jsonNotFound<T>();
      }
    }

    const workoutLogItemMatch = pathname.match(/^\/api\/workout-logs\/([^/]+)$/);
    if (workoutLogItemMatch) {
      const logId = workoutLogItemMatch[1];
      if (method === "GET") {
        const item = await db.getWorkoutLogById(logId);
        return item ? jsonOk<T>(item as T) : jsonNotFound<T>();
      }
      if (method === "PUT") {
        const updated = await db.updateWorkoutLog(
          logId,
          body as Partial<WorkoutLog>
        );
        return updated ? jsonOk<T>(updated as T) : jsonNotFound<T>();
      }
      if (method === "DELETE") {
        await db.deleteWorkoutLog(logId);
        return jsonOk<T>(null as T, 204);
      }
    }

    const cardioItemMatch = pathname.match(/^\/api\/cardio-sessions\/([^/]+)$/);
    if (cardioItemMatch && method === "DELETE") {
      await db.deleteCardioSession(cardioItemMatch[1]);
      return jsonOk<T>(null as T, 204);
    }

    const bodyItemMatch = pathname.match(/^\/api\/body-measurements\/([^/]+)$/);
    if (bodyItemMatch && method === "DELETE") {
      await db.deleteBodyMeasurement(bodyItemMatch[1]);
      return jsonOk<T>(null as T, 204);
    }

    const exerciseHistoryMatch = pathname.match(
      /^\/api\/exercise-history\/([^/]+)$/
    );
    if (exerciseHistoryMatch && method === "GET") {
      return jsonOk<T>(
        (await db.getExerciseHistory(exerciseHistoryMatch[1])) as T
      );
    }

    const exerciseDetailedMatch = pathname.match(
      /^\/api\/exercise-detailed-history\/([^/]+)$/
    );
    if (exerciseDetailedMatch && method === "GET") {
      return jsonOk<T>(
        (await db.getExerciseDetailedHistory(exerciseDetailedMatch[1])) as T
      );
    }

    const exerciseItemMatch = pathname.match(/^\/api\/exercises\/([^/]+)$/);
    if (exerciseItemMatch && method === "GET") {
      const item = await db.getExerciseById(exerciseItemMatch[1]);
      return item ? jsonOk<T>(item as T) : jsonNotFound<T>();
    }

    return {
      status: 404,
      data: { error: `Not implemented: ${method} ${url}` } as T,
    };
  },
};

export type { ExerciseFilters };
