import { handleSync } from "@/server/sync";
import type { SyncRequest } from "@/lib/sync/types";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SyncRequest;
    const result = await handleSync(body.lastPullAt ?? null, body.changes ?? []);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/sync]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 }
    );
  }
}
