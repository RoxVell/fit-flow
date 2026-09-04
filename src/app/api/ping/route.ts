// Reachability probe for public/offline.js. Lives under /api/ so the service
// worker never answers it from a cache; 204 is unlikely to be spoofed by a
// captive portal.
export const dynamic = "force-dynamic";

export function GET() {
  return new Response(null, {
    status: 204,
    headers: { "cache-control": "no-store" },
  });
}
