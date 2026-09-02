import { describe, it, expect, vi, beforeEach } from "vitest";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { API_PREFIX } from "@/mocks/handlers/auth-guard";
import {
  getPppoePackagesAction,
  createPppoePackageAction,
  getPppoeAccountsByCustomerAction,
  suspendPppoeAccountAction,
  activatePppoeAccountAction,
  getPppoeSubscriptionsByCustomerAction,
  assignPppoePackageAction,
  renewPppoeSubscriptionAction,
  stkPushPppoePaymentAction,
} from "@/actions/pppoe";

const TOKEN = "mock-valid-bearer-token";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PPPoE (live spec 13 interactions, bearer)", () => {
  it("GET /pppoe/packages returns the list envelope with Bearer", async () => {
    server.use(
      http.get(`${API_PREFIX}/pppoe/packages`, ({ request }) => {
        expect(request.headers.get("authorization")).toBe(`Bearer ${TOKEN}`);
        return HttpResponse.json(
          { status: 200, success: true, message: "ok", data: [{ id: "pppoe-pkg-001", name: "PPPoE Unlimited 8M", uploadSpeed: 8, downloadSpeed: 8, durationDays: 30 }], timestamp: "2026-09-02T00:00:00.000Z" },
          { status: 200 }
        );
      })
    );
    const res = await getPppoePackagesAction();
    expect(res.success).toBe(true);
    expect(res.data?.[0].name).toBe("PPPoE Unlimited 8M");
  });

  it("POST /pppoe/packages sends PppoePackageRequest", async () => {
    server.use(
      http.post(`${API_PREFIX}/pppoe/packages`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        expect(body).toMatchObject({ name: "PPPoE Unlimited 8M", uploadSpeed: 8, downloadSpeed: 8, durationDays: 30 });
        return HttpResponse.json(
          { status: 200, success: true, message: "created", data: { id: "pppoe-pkg-003", name: "PPPoE Unlimited 8M" }, timestamp: "2026-09-02T00:00:00.000Z" },
          { status: 200 }
        );
      })
    );
    const res = await createPppoePackageAction({ name: "PPPoE Unlimited 8M", uploadSpeed: 8, downloadSpeed: 8, durationDays: 30 });
    expect(res.success).toBe(true);
  });

  it("GET /pppoe/accounts/customer/{id} returns accounts by customer", async () => {
    const res = await getPppoeAccountsByCustomerAction("c-2085");
    expect(res.success).toBe(true);
    expect(res.data?.[0].username).toBe("A2085-ppp");
  });

  it("POST /pppoe/subscriptions/activate sends AssignPackageRequest", async () => {
    server.use(
      http.post(`${API_PREFIX}/pppoe/subscriptions/activate`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        expect(body).toMatchObject({ customerId: "c-2085", packageId: "pppoe-pkg-001", accountId: "pppoe-acct-001" });
        return HttpResponse.json(
          { status: 200, success: true, message: "assigned", data: null, timestamp: "2026-09-02T00:00:00.000Z" },
          { status: 200 }
        );
      })
    );
    const res = await assignPppoePackageAction({ customerId: "c-2085", packageId: "pppoe-pkg-001", accountId: "pppoe-acct-001" });
    expect(res.success).toBe(true);
  });

  it("PATCH /pppoe/accounts/{id}/suspend toggles account state", async () => {
    const res = await suspendPppoeAccountAction("pppoe-acct-001");
    expect(res.success).toBe(true);
    const activated = await activatePppoeAccountAction("pppoe-acct-001");
    expect(activated.success).toBe(true);
  });

  it("GET /pppoe/subscriptions/customer/{id} returns subscriptions", async () => {
    const res = await getPppoeSubscriptionsByCustomerAction("c-2085");
    expect(res.success).toBe(true);
    expect(res.data?.[0].packageName).toBe("PPPoE Unlimited 8M");
  });

  it("POST /pppoe/subscriptions/renew sends customerId+accountId query params", async () => {
    server.use(
      http.post(`${API_PREFIX}/pppoe/subscriptions/renew`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get("customerId")).toBe("c-2085");
        expect(url.searchParams.get("accountId")).toBe("pppoe-acct-001");
        return HttpResponse.json(
          { status: 200, success: true, message: "renewed", data: null, timestamp: "2026-09-02T00:00:00.000Z" },
          { status: 200 }
        );
      })
    );
    const res = await renewPppoeSubscriptionAction("c-2085", "pppoe-acct-001");
    expect(res.success).toBe(true);
  });

  it("POST /pppoe/payments/stk-push sends PppoePaymentRequest", async () => {
    server.use(
      http.post(`${API_PREFIX}/pppoe/payments/stk-push`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        expect(body).toMatchObject({ customerId: "c-2085", phoneNumber: "0726837210", amount: 2000 });
        return HttpResponse.json(
          { status: 200, success: true, message: "STK pushed", data: null, timestamp: "2026-09-02T00:00:00.000Z" },
          { status: 200 }
        );
      })
    );
    const res = await stkPushPppoePaymentAction({ customerId: "c-2085", phoneNumber: "0726837210", amount: 2000, accountId: "pppoe-acct-001", subscriptionId: "pppoe-sub-001" });
    expect(res.success).toBe(true);
  });

  it("401 on protected PPPoE endpoints yields the error envelope", async () => {
    server.use(
      http.get(`${API_PREFIX}/pppoe/packages`, () =>
        HttpResponse.json(
          { status: 401, success: false, message: "Unauthorized", data: null, timestamp: "2026-09-02T00:00:00.000Z" },
          { status: 401 }
        )
      )
    );
    const res = await getPppoePackagesAction();
    expect(res.success).toBe(false);
    expect(res.status).toBe(401);
  });
});