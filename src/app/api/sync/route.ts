import { handleSync } from "@/server/sync";
import { parseSyncRequest } from "@/server/sync-validation";

const headers = { "Cache-Control": "no-store" };
const MAX_REQUEST_BYTES = 10 * 1024 * 1024;

export function GET() {
  return Response.json({ enabled: Boolean(process.env.DATABASE_URL) }, { headers });
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return Response.json({ error: "Sync is disabled" }, { status: 503, headers });
  if (Number(request.headers.get("content-length")) > MAX_REQUEST_BYTES) {
    return Response.json({ error: "Request too large" }, { status: 413, headers });
  }
  let parsed: ReturnType<typeof parseSyncRequest>;
  try {
    const body = await request.text();
    if (Buffer.byteLength(body) > MAX_REQUEST_BYTES) return Response.json({ error: "Request too large" }, { status: 413, headers });
    parsed = parseSyncRequest(JSON.parse(body));
  } catch {
    return Response.json({ error: "Invalid sync request" }, { status: 400, headers });
  }
  try {
    const result = await handleSync(parsed.changes);
    return Response.json({ ...result, superseded: [...result.superseded, ...parsed.superseded], rejected: [...result.rejected, ...parsed.rejected] }, { headers });
  } catch (error) {
    console.error("[api/sync]", error);
    return Response.json({ error: "Sync failed" }, { status: 500, headers });
  }
}
