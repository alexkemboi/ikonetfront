import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";
import { getCurrentUserPermissions, NO_PERMISSIONS } from "@/lib/data/nav";
import { BASE_URL } from "@/lib/constants";
import { withCompanyContext } from "@/lib/companyContext";

export const dynamic = "force-dynamic";

/**
 * Live router telemetry SSE relay.
 *
 * Proxies `GET /api/v1/network/monitoring/router/{id}/live` from the backend
 * (Bearer token), streaming `text/event-stream` frames to NOC monitors. Auth is
 * enforced server-side with the session cookie (EventSource cannot attach
 * headers). If the upstream is unreachable or returns a non-2xx the route
 * degrades to a readable JSON envelope so consumers fall back to `/latest` +
 * `/history` polling instead of a silent 404 relay.
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

 try {
 const controller = new AbortController();
 const abortOnClientDisconnect = () => controller.abort();
 request.signal.addEventListener("abort", abortOnClientDisconnect);
 const connectTimeout = setTimeout(() => controller.abort(), 20_000);

 let upstream: Response;
 try {
 upstream = await fetch(`${BASE_URL}network/monitoring/router/${id}/live`, {
 headers: await withCompanyContext({
 Authorization: `Bearer ${session.user.apiToken}`,
 Accept: "text/event-stream",
 "Cache-Control": "no-cache",
 }),
 cache: "no-store",
 signal: controller.signal,
 });
 } finally {
 clearTimeout(connectTimeout);
 }

 if (!upstream.ok || !upstream.body) {
 const relayStatus = upstream.status >= 500 ? 502 : upstream.status;
 return new Response(
 JSON.stringify({
 status: relayStatus,
 success: false,
 message:
 `Live SSE telemetry relay failed (backend HTTP ${upstream.status}). The monitor page falls back to polling /network/monitoring/router/${id}/latest + /history.`,
 }),
 {
 status: relayStatus,
 headers: { "Content-Type": "application/json" },
 }
 );
 }

 return new Response(upstream.body, {
 status: 200,
 headers: {
 "Content-Type": "text/event-stream",
 "Cache-Control": "no-cache, no-transform",
 Connection: "keep-alive",
 "X-Accel-Buffering": "no",
 },
 });
 } catch {
 return new Response(
 JSON.stringify({
 status: 503,
 success: false,
message:
  `Live SSE telemetry is temporarily unavailable. The monitor page falls back to polling /network/monitoring/router/${id}/latest + /history.`,
 }),
 {
 status: 503,
 headers: { "Content-Type": "application/json" },
 }
 );
 }
}