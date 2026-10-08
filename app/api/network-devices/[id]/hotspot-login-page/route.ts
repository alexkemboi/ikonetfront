import { auth } from "@/lib/auth";
import { buildApiUrl } from "@/lib/constants";
import { withCompanyContext } from "@/lib/companyContext";
import { getPermissionForRoute } from "@/lib/data/nav";

export const dynamic = "force-dynamic";

/**
 * Downloads the hotspot login page issued for one router
 * (`GET /api/v1/network-devices/{id}/hotspot-login-page`).
 *
 * The file carries that router's signed id and its company's name, and is valid
 * for that router only. It is uploaded to the router as `hotspot/login.html`;
 * from then on the purchase page knows the router and its company for certain.
 * The backend refuses a router of another company and audits the download.
 */
function errorResponse(status: number, message: string): Response {
  return new Response(JSON.stringify({ status, success: false, message }), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await context.params;
  if (!/^\d+$/.test(id)) return errorResponse(400, "Invalid router id");

  const session = await auth();
  if (!session?.user?.apiToken) return errorResponse(401, "Not authenticated");

  const permissions = await getPermissionForRoute("/network/routers");
  if (!permissions.canView) return errorResponse(403, "FORBIDDEN");

  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${session.user.apiToken}`,
      Accept: "text/html, application/json",
    };
    await withCompanyContext(headers);
    const upstream = await fetch(buildApiUrl(`/network-devices/${id}/hotspot-login-page`), {
      headers,
      cache: "no-store",
    });
    if (!upstream.ok) {
      // the backend's own message (unknown router, another company's router, no signing key)
      const body = await upstream.json().catch(() => null);
      const message = (body && typeof body.message === "string" && body.message) || "The login page could not be issued";
      return errorResponse(upstream.status, message);
    }
    return new Response(await upstream.arrayBuffer(), {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": 'attachment; filename="login.html"',
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return errorResponse(502, "UPSTREAM_UNAVAILABLE");
  }
}
