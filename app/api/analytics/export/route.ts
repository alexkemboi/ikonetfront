import { auth } from "@/lib/auth";
import { analyticsApiQuery, parseAnalyticsFilters } from "@/lib/analytics/filters";
import { withCompanyContext } from "@/lib/companyContext";
import { buildApiUrl } from "@/lib/constants";
import { getPermissionForRoute } from "@/lib/data/nav";

export const dynamic = "force-dynamic";

/**
 * Downloads the analytics CSV for the page's dates and router
 * (`GET /api/v1/analytics/export.csv`). The service filter and bar size are not part of
 * the export. The file holds revenue and customer figures: the backend checks the
 * caller's role again and builds the whole file before sending any of it, so a failure
 * arrives here as an error and never as half a file.
 */
function errorResponse(status: number, message: string): Response {
  return new Response(JSON.stringify({ status, success: false, message }), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export async function GET(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.apiToken) return errorResponse(401, "Not authenticated");

  const permissions = await getPermissionForRoute("/analytics");
  if (!permissions.canView) return errorResponse(403, "FORBIDDEN");

  const filters = parseAnalyticsFilters(Object.fromEntries(new URL(request.url).searchParams));
  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${session.user.apiToken}`,
      Accept: "text/csv, application/json",
    };
    await withCompanyContext(headers);
    const upstream = await fetch(buildApiUrl(`/analytics/export.csv?${analyticsApiQuery(filters)}`), {
      headers,
      cache: "no-store",
    });
    if (!upstream.ok) {
      const body = await upstream.json().catch(() => null);
      const message = (body && typeof body.message === "string" && body.message) || "The export could not be created";
      return errorResponse(upstream.status, message);
    }
    return new Response(await upstream.arrayBuffer(), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": upstream.headers.get("Content-Disposition") ?? 'attachment; filename="analytics.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return errorResponse(502, "UPSTREAM_UNAVAILABLE");
  }
}
