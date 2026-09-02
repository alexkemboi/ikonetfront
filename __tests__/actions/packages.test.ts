import { describe, it, expect, vi, beforeEach } from "vitest";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { API_PREFIX } from "@/mocks/handlers/auth-guard";
import {
  getPackagesAction,
  createPackageAction,
  updatePackageAction,
  deletePackageAction,
  deactivatePackageAction,
  type InternetPackage,
  type PackagePayload,
} from "@/actions/packages";

const TOKEN = "mock-valid-bearer-token";

const PAYLOAD: PackagePayload = {
  packageName: "Home Hotspot 10Mbps",
  price: 1500,
  packageCategory: "HOTSPOT",
  validityType: "MONTHLY",
  validityValue: 30,
  bandwidthType: "SHARED",
  activeStatus: true,
  speedDownload: 10,
  speedUpload: 5,
  enableBurst: false,
  rateLimit: "10M/5M",
  burstLimit: "",
  burstThreshold: "",
  burstTime: "",
  createdBy: "admin",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("net packages CRUD (live spec: /system/packages, bearer)", () => {
  it("GET /system/packages returns the list envelope", async () => {
    const res = await getPackagesAction();
    expect(res.success).toBe(true);
    expect(res.data).toHaveLength(2);
    expect(res.data?.[0].packageName).toBe("Home Hotspot 10Mbps");
  });

  it("POST /system/packages sends the payload Bearer and revalidates", async () => {
    server.use(
      http.post(`${API_PREFIX}/system/packages`, async ({ request }) => {
        expect(request.headers.get("authorization")).toBe(`Bearer ${TOKEN}`);
        const body = (await request.json()) as Record<string, unknown>;
        expect(body.packageName).toBe("Home Hotspot 10Mbps");
        return HttpResponse.json(
          { status: 200, success: true, message: "Package created", data: { idxno: 1, packageName: "Home Hotspot 10Mbps", price: 1500, packageCategory: "HOTSPOT", activeStatus: true }, timestamp: "2026-09-02T00:00:00.000Z" },
          { status: 200 }
        );
      })
    );
    const res = await createPackageAction(PAYLOAD);
    expect(res.success).toBe(true);
  });

  it("PATCH /system/packages/{idxno} updates in place", async () => {
    const res = await updatePackageAction(1, { ...PAYLOAD, price: 1600 });
    expect(res.success).toBe(true);
  });

  it("DELETE /system/packages/{idxno} resolves null-data success", async () => {
    const res = await deletePackageAction(1);
    expect(res.success).toBe(true);
  });

  it("PATCH /system/packages/{idxno}/deactivate hits the deactivate path", async () => {
    server.use(
      http.patch(`${API_PREFIX}/system/packages/:idxno/deactivate`, async ({ request, params }) => {
        expect(params.idxno).toBe("1");
        expect(request.headers.get("authorization")).toBe(`Bearer ${TOKEN}`);
        return HttpResponse.json(
          { status: 200, success: true, message: "Package deactivated", data: { idxno: 1, activeStatus: false } as InternetPackage, timestamp: "2026-09-02T00:00:00.000Z" },
          { status: 200 }
        );
      })
    );
    const res = await deactivatePackageAction(1);
    expect(res.success).toBe(true);
    expect(res.data?.activeStatus).toBe(false);
  });

  it("401 on a protected package read yields the error envelope", async () => {
    server.use(
      http.get(`${API_PREFIX}/system/packages`, () =>
        HttpResponse.json(
          { status: 401, success: false, message: "Unauthorized", data: null, timestamp: "2026-09-02T00:00:00.000Z" },
          { status: 401 }
        )
      )
    );
    const res = await getPackagesAction();
    expect(res.success).toBe(false);
    expect(res.status).toBe(401);
  });
});