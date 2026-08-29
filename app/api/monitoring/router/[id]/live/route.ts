import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";
import { getCurrentUserPermissions, NO_PERMISSIONS } from "@/lib/data/nav";

/**
 * Live router telemetry SSE proxy.
 *
 * The backend has no `GET /api/v1/network/monitoring/router/{id}/live` yet
 * (BE-AAA-045) — the NOC monitor page polls `/latest` + `/history` on a
 * refetch interval instead of opening this EventSource. Keep this route as the
 * future streaming target with a graceful 501 so any stale EventSource shows a
 * readable state instead of a backend 404 relay.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.apiToken) {
    return new Response("Unauthorized", { status: 401 });
  }

  const permissions = await getCurrentUserPermissions();
  const pagePerms = permissions["/network/routers"] ?? NO_PERMISSIONS;
  if (!pagePerms.canView) {
    return new Response("Forbidden", { status: 403 });
  }

  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    return new Response("Invalid router ID", { status: 400 });
  }

  return new Response(
    JSON.stringify({
      status: 501,
      success: false,
      message:
        "Live SSE telemetry is not available yet (pending backend BE-AAA-045). The monitor page polls /network/monitoring/router/{id}/latest + /history meanwhile.",
    }),
    {
      status: 501,
      headers: { "Content-Type": "application/json" },
    }
  );
}