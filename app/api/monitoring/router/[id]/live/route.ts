import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";
import { getCurrentUserPermissions, NO_PERMISSIONS } from "@/lib/data/nav";

const BASE_URL = process.env.BASE_API_URL || "http://localhost:8381/api/v1";

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

  const backendUrl = `${BASE_URL.replace(/\/+$/, "")}/network/monitoring/router/${id}/live`;

  const backendResponse = await fetch(backendUrl, {
    headers: {
      Authorization: `Bearer ${session.user.apiToken}`,
      Accept: "text/event-stream",
    },
    cache: "no-store",
  });

  if (!backendResponse.ok) {
    return new Response("Backend error", { status: backendResponse.status });
  }

  return new Response(backendResponse.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}