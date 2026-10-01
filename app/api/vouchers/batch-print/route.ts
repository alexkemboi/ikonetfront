import { auth } from "@/lib/auth";
import { buildApiUrl } from "@/lib/constants";
import { withCompanyContext } from "@/lib/companyContext";
import { getPermissionForRoute } from "@/lib/data/nav";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function errorResponse(status: number, message: string, requestId: string): Response {
  return new Response(JSON.stringify({
    status,
    success: false,
    message,
    data: { requestId },
    timestamp: new Date().toISOString(),
  }), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Request-Id": requestId },
  });
}

export async function GET(request: NextRequest): Promise<Response> {
  const requestId = crypto.randomUUID();
  const voucherBatchId = request.nextUrl.searchParams.get("voucherBatchId");
  if (!voucherBatchId?.trim()) return errorResponse(400, "voucherBatchId is required", requestId);

  const session = await auth();
  if (!session?.user?.apiToken) return errorResponse(401, "Not authenticated", requestId);

  const permissions = await getPermissionForRoute("/finance/vouchers");
  if (!permissions.canView) return errorResponse(403, "FORBIDDEN", requestId);

  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${session.user.apiToken}`,
      Accept: "application/pdf, application/octet-stream, application/json",
      "X-Request-Id": requestId,
    };
    await withCompanyContext(headers);
    const upstream = await fetch(buildApiUrl(`/hotspot/vouchers/export/print?voucherBatchId=${encodeURIComponent(voucherBatchId)}`), {
      headers,
      cache: "no-store",
    });
    const responseHeaders = new Headers({
      "Cache-Control": "no-store",
      "X-Request-Id": upstream.headers.get("X-Request-Id") ?? requestId,
    });
    const contentType = upstream.headers.get("Content-Type");
    const contentDisposition = upstream.headers.get("Content-Disposition");
    if (contentType) responseHeaders.set("Content-Type", contentType);
    if (contentDisposition) responseHeaders.set("Content-Disposition", contentDisposition);

    return new Response(await upstream.arrayBuffer(), {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    return errorResponse(502, "UPSTREAM_UNAVAILABLE", requestId);
  }
}