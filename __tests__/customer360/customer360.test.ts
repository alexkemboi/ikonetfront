import { describe, it, expect, vi, beforeEach } from "vitest";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { API_PREFIX } from "@/mocks/handlers/auth-guard";
import { envelope, errorEnvelope } from "@/contracts/catalog";
import {
  getLiveSpeed,
  getActivityHeatmap,
  getPeakHours,
  getCustomerNotes,
  createCustomerNote,
  getCustomerPayments,
  getPppoeOverview,
  getSmsHistory,
  getCustomerTickets,
} from "@/actions/customer360";
import {
  isoDayOfWeekToGridIndex,
  activityTierForBytes,
  heatmapCellColor,
} from "@/lib/types/customer360";

const TOKEN = "mock-valid-bearer-token";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("customer360 actions", () => {
  it("getLiveSpeed fetches the gauge envelope with Bearer auth", async () => {
    server.use(
      http.get(`${API_PREFIX}/customers/7/live-speed`, ({ request }) => {
        expect(request.headers.get("authorization")).toBe(`Bearer ${TOKEN}`);
        return HttpResponse.json(
          envelope(
            {
              online: true,
              interfaceName: "<pppoe-johndoe>",
              downloadMbps: 2.5,
              uploadMbps: 1.25,
              downloadBps: 2500000,
              uploadBps: 1250000,
              routerName: "R1",
              sampledAt: "2026-09-01T08:00:00.000Z",
            },
            "Live speed retrieved"
          )
        );
      })
    );

    const result = await getLiveSpeed(7);
    expect(result.success).toBe(true);
    expect(result.data?.downloadMbps).toBe(2.5);
    expect(result.data?.uploadMbps).toBe(1.25);
  });

  it("getActivityHeatmap maps a 404 to a null-data envelope", async () => {
    server.use(
      http.get(`${API_PREFIX}/customers/7/analytics/activity-heatmap`, () =>
        HttpResponse.json(errorEnvelope(404, "Customer not found"), { status: 404 })
      )
    );

    const result = await getActivityHeatmap(7);
    expect(result.success).toBe(false);
    expect(result.status).toBe(404);
    expect(result.data).toBeNull();
  });

  it("getCustomerNotes returns the company-scoped note list", async () => {
    server.use(
      http.get(`${API_PREFIX}/customers/7/notes`, () =>
        HttpResponse.json(
          envelope(
            [
              {
                id: 1,
                customerIdxno: 7,
                authorUsername: "staff",
                note: "called customer about renewal",
                createdAt: "2026-09-01T09:00:00.000Z",
              },
            ],
            "Notes retrieved"
          )
        )
      )
    );

    const result = await getCustomerNotes(7);
    expect(result.data?.length).toBe(1);
    expect(result.data?.[0].note).toContain("renewal");
  });

  it("createCustomerNote POSTs the note body", async () => {
    server.use(
      http.post(`${API_PREFIX}/customers/7/notes`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        expect(body.note).toBe("hello");
        return HttpResponse.json(
          envelope(
            {
              id: 2,
              customerIdxno: 7,
              authorUsername: "staff",
              note: "hello",
              createdAt: "2026-09-01T10:00:00.000Z",
            },
            "Note added"
          ),
          { status: 201 }
        );
      })
    );

    const result = await createCustomerNote(7, "hello");
    expect(result.success).toBe(true);
    expect(result.data?.id).toBe(2);
  });

  it("getPeakHours returns rows with ISO dayOfWeek", async () => {
    server.use(
      http.get(`${API_PREFIX}/customers/7/analytics/peak-hours`, () =>
        HttpResponse.json(
          envelope(
            [
              { dayOfWeek: 2, hourOfDay: 19, totalBytes: 1000, sessionCount: 4, intensity: 4 },
            ],
            "Peak hours retrieved"
          )
        )
      )
    );

    const result = await getPeakHours(7);
    expect(result.data?.[0].dayOfWeek).toBe(2);
    expect(result.data?.[0].intensity).toBe(4);
  });

  it("getCustomerPayments returns the newest-50 list", async () => {
    server.use(
      http.get(`${API_PREFIX}/customers/7/payments`, () =>
        HttpResponse.json(
          envelope(
            [
              {
                id: "p-1",
                mpesaReceipt: "SJL2X9M4P1",
                phoneNumber: "254700000000",
                amount: 1000,
                status: "COMPLETED",
                createdAt: "2026-09-01T11:00:00.000Z",
              },
            ],
            "Payments retrieved"
          )
        )
      )
    );

    const result = await getCustomerPayments(7);
    expect(result.data?.[0].mpesaReceipt).toBe("SJL2X9M4P1");
  });

  it("getPppoeOverview returns accounts + subscriptions", async () => {
    server.use(
      http.get(`${API_PREFIX}/customers/7/pppoe-accounts`, () =>
        HttpResponse.json(
          envelope(
            {
              accounts: [{ id: "a-1", username: "johndoe", routerIp: "10.0.0.1", networkDeviceId: 10, status: "ACTIVE", isActive: true }],
              subscriptions: [{ id: "s-1", packageId: "pkg-1", packageName: "Home Plus", status: "ACTIVE", startDate: "2026-09-01", expiryDate: "2026-10-01", isActive: true }],
            },
            "PPPoE overview retrieved"
          )
        )
      )
    );

    const result = await getPppoeOverview(7);
    expect(result.data?.accounts).toHaveLength(1);
    expect(result.data?.subscriptions[0].packageName).toBe("Home Plus");
  });

  it("getSmsHistory and getCustomerTickets resolve lists", async () => {
    server.use(
      http.get(`${API_PREFIX}/customers/7/sms`, () =>
        HttpResponse.json(
          envelope(
            [{ id: 1, phoneNumber: "254700000000", direction: "OUTBOUND", templateCode: "Final Warning", content: "renew now", status: "SENT", sentAt: "2026-09-01T08:00:00.000Z" }],
            "SMS history retrieved"
          )
        )
      ),
      http.get(`${API_PREFIX}/customers/7/tickets`, () =>
        HttpResponse.json(
          envelope(
            [{ idxno: 1, ticketNumber: "TKT-1", title: "Slow speeds", description: "…", status: "OPEN", priority: "HIGH", customerName: null, assignedAgentName: null, creatorName: null, createdAt: "2026-09-01T00:00:00.000Z", updatedAt: "2026-09-01T00:00:00.000Z", slaDeadline: null, isEscalated: false }],
            "Tickets retrieved"
          )
        )
      )
    );

    const sms = await getSmsHistory(7);
    expect(sms.data?.[0].templateCode).toBe("Final Warning");

    const tickets = await getCustomerTickets(7);
    expect(tickets.data?.[0].ticketNumber).toBe("TKT-1");
  });
});

describe("customer360 conversions", () => {
  it("maps ISO dayOfWeek (1=Mon) into the 0-indexed peak-hour grid", () => {
    expect(isoDayOfWeekToGridIndex(1)).toBe(0); // Mon → leftmost row
    expect(isoDayOfWeekToGridIndex(2)).toBe(1); // Tue
    expect(isoDayOfWeekToGridIndex(7)).toBe(6); // Sun
  });

  it("maps total bytes to the 0..4 activity tier", () => {
    expect(activityTierForBytes(0)).toBe(0);
    expect(activityTierForBytes(1_000_000_000)).toBe(1);
    expect(activityTierForBytes(5_000_000_000)).toBe(2);
    expect(activityTierForBytes(10_000_000_000)).toBe(3);
    expect(activityTierForBytes(10_000_000_001)).toBe(4);
  });

  it("heatmapCellColor uses the brand primary ladder", () => {
    expect(heatmapCellColor(0)).toBe("#27272a");
    expect(heatmapCellColor(4)).toBe("hsl(var(--primary))");
  });
});