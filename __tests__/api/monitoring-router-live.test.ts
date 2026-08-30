import { describe, it, expect, vi, beforeEach } from "vitest";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { NextRequest } from "next/server";
import { API_PREFIX } from "@/mocks/handlers/auth-guard";
import {
  routerLiveStreamFixture,
  routerHealthSnapshotFixture,
} from "@/contracts/catalog";
import { GET } from "@/app/api/monitoring/router/[id]/live/route";

vi.mock("@/lib/data/nav", () => ({
  NO_PERMISSIONS: { canView: false, canCreate: false, canEdit: false, canDelete: false },
  getCurrentUserPermissions: vi.fn().mockResolvedValue({
    "/network/routers": { canView: true, canCreate: true, canEdit: true, canDelete: true },
  }),
}));

const TOKEN = "mock-valid-bearer-token";

function requestFor(id: string): NextRequest {
  return new NextRequest(`http://localhost/api/monitoring/router/${id}/live`);
}

async function callRoute(id: string) {
  return GET(requestFor(id), { params: Promise.resolve({ id }) });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/monitoring/router/[id]/live (SSE relay)", () => {
  it("relays the backend event-stream with the session Bearer token", async () => {
    server.use(
      http.get(`${API_PREFIX}/network/monitoring/router/1/live`, ({ request }) => {
        expect(request.headers.get("authorization")).toBe(`Bearer ${TOKEN}`);
        expect(request.headers.get("accept")).toBe("text/event-stream");
        return HttpResponse.text(routerLiveStreamFixture(), {
          status: 200,
          headers: { "Content-Type": "text/event-stream" },
        });
      })
    );

    const res = await callRoute("1");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    expect(res.headers.get("x-accel-buffering")).toBe("no");

    const body = await res.text();
    expect(body).toContain("event: telemetry");
    expect(body).toContain(": ping");
    expect(body).toContain(JSON.stringify(routerHealthSnapshotFixture()).slice(0, 40));
  });

  it("degrades to a readable JSON envelope when the backend replies non-2xx", async () => {
    server.use(
      http.get(`${API_PREFIX}/network/monitoring/router/1/live`, () =>
        new HttpResponse(null, { status: 404 })
      )
    );

    const res = await callRoute("1");
    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toContain("application/json");

    const envelope = (await res.json()) as { status: number; success: boolean; message: string };
    expect(envelope.status).toBe(404);
    expect(envelope.success).toBe(false);
    expect(envelope.message).toMatch(/relay failed/);
    expect(envelope.message).toContain("/latest");
  });

  it("returns 401 without an authenticated session", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth).mockResolvedValueOnce(null as never);

    const res = await callRoute("1");
    expect(res.status).toBe(401);
  });

  it("returns 400 for a non-numeric router id", async () => {
    const res = await callRoute("not-a-number");
    expect(res.status).toBe(400);
  });
});