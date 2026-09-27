import { describe, it, expect, vi, beforeEach } from "vitest";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { API_PREFIX } from "@/mocks/handlers/auth-guard";
import { getLiveSessionsData } from "@/actions/sessions";

const TOKEN = "mock-valid-bearer-token";

beforeEach(() => {
  vi.clearAllMocks();
});

const liveEnvelope = {
  status: 200,
  success: true,
  message: "Live sessions retrieved successfully",
  timestamp: new Date().toISOString(),
  data: {
    kpis: {
      currentlyConnected: 1,
      pppoeCount: 0,
      hotspotCount: 1,
      paidNotConnected: 1,
      downloadBytesTotal: "1500000000",
      uploadBytesTotal: "500000000",
      totalBytesTotal: "2000000000",
    },
    sessions: {
      content: [
        {
          subscriberCode: "ADR7KQ",
          subscriberName: "254725134318",
          protocol: "Hotspot",
          deviceMac: "26:76:05:86:C8:34",
          assignedIp: "10.50.50.248",
          routerName: "ADRINOLD-WESTLANDS",
          downloadBytes: "1500000000",
          uploadBytes: "500000000",
          onlineDurationFormatted: "12m",
          sessionId: 212,
          phone: "254725134318",
          packageName: "1 Hour Basic",
          voucherCode: "ADR7KQ",
          mpesaReceipt: "UIR4T8DKZG",
          amountPaid: "1.00",
          nasIp: "10.8.1.11",
          online: true,
          minutesRemaining: 48,
        },
        {
          subscriberCode: "C4E3E65A",
          protocol: "Hotspot",
          deviceMac: "4A:AA:9E:1A:5D:1D",
          sessionId: 213,
          phone: "254790721501",
          online: false,
          downloadBytes: "0",
          uploadBytes: "0",
        },
      ],
    },
  },
};

describe("getLiveSessionsData (GET /sessions/live)", () => {
  it("maps real sessions with their customer, payment and router identity", async () => {
    server.use(
      http.get(`${API_PREFIX}/sessions/live`, ({ request }) => {
        expect(request.headers.get("authorization")).toBe(`Bearer ${TOKEN}`);
        return HttpResponse.json(liveEnvelope, { status: 200 });
      })
    );

    const { kpis, sessions, error } = await getLiveSessionsData();

    expect(error).toBeUndefined();
    expect(kpis.currentlyConnectedCount).toBe(1);
    expect(kpis.paidNotConnected).toBe(1);
    expect(kpis.downloadTrafficGb).toBe(1.5);

    const online = sessions.find((s) => s.sessionId === 212);
    expect(online?.phone).toBe("254725134318");
    expect(online?.mpesaReceipt).toBe("UIR4T8DKZG");
    expect(online?.routerName).toBe("ADRINOLD-WESTLANDS");
    expect(online?.downloadBytes).toBe(1500000000);
    expect(online?.online).toBe(true);

    const waiting = sessions.find((s) => s.sessionId === 213);
    expect(waiting?.online).toBe(false);
    expect(sessions.some((s) => s.isFallback)).toBe(false);
  });

  it("returns an empty list with an error instead of demo rows when the backend fails", async () => {
    server.use(
      http.get(`${API_PREFIX}/sessions/live`, () =>
        HttpResponse.json(
          { status: 503, success: false, message: "LIVE_SESSIONS_UNAVAILABLE", data: null, timestamp: new Date().toISOString() },
          { status: 503 }
        )
      )
    );

    const { sessions, kpis, error } = await getLiveSessionsData();

    expect(sessions).toEqual([]);
    expect(kpis.currentlyConnectedCount).toBe(0);
    expect(error).toBeTruthy();
  });
});
