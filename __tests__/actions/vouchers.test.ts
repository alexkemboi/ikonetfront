
import { describe, it, expect, vi, beforeEach } from "vitest";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { API_PREFIX } from "@/mocks/handlers/auth-guard";
import { getVouchersData, generateVouchers } from "@/actions/vouchers";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("vouchers gating (historical fake-data removal)", () => {
  it("GET list returns the gated empty state without touching the network", async () => {
    const data = await getVouchersData();
    expect(data.available).toBe(false);
    expect(data.message).toMatch(/pending backend route/);
    expect(data.vouchers).toHaveLength(0);
    expect(data.kpis).toEqual({
      totalGenerated: 0,
      usedCount: 0,
      unusedCount: 0,
      batchesCount:   0,
      redemptionRatePercent: 0,
    });
  });

  it("POST /hotspot/vouchers/create sends ManualVoucherRequest public", async () => {
    server.use(
      http.post(`${API_PREFIX}/hotspot/vouchers/create`, async ({ request }) => {
        expect(request.headers.get("authorization")).toBeNull();
        const body = (await request.json()) as Record<string, unknown>;
        expect(body).toMatchObject({ packageId: 1, count: 5 });
        return HttpResponse.json(
          {
            status: 200,
            success: true,
            message: "Vouchers created",
            data: [{ sessionId: "VS-1", voucherCode: "ADR4F2K7X9" }],
            timestamp: "2026-09-02T00:00:00.000Z",
          },
          { status: 200 }
        );
      })
    );
    const res = await generateVouchers({ packageId: 1, quantity:   5, codeLength:   6 });
    expect(res.success).toBe(true);
    expect(res.count).toBe(5);
  });

  it("rejects quantity out of range without touching the network", async () => {
    const res = await generateVouchers({ packageId: 1, quantity:   0 });
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/Quantity/);
  });
});
