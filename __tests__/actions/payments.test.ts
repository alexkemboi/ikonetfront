import { describe, it, expect, vi, beforeEach } from "vitest";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { API_PREFIX } from "@/mocks/handlers/auth-guard";
import { getPaymentsLedgerData } from "@/actions/payments";
import { auth } from "@/lib/auth";
import type { AccountPosting } from "@/lib/types/finance";

const TOKEN = "mock-valid-bearer-token";

function localIso(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

function postingFixture(overrides: Partial<AccountPosting> & { id: number }): AccountPosting {
  return {
    accountCode: "1110",
    sourceType: "MPESA",
    amount: 500,
    currency: "KES",
    occurredAt: "2026-08-31T18:42:00",
    memo: "MPESA KES 500 HOTSPOT",
    companyId: 1,
    serviceType: "HOTSPOT",
    customerId: 12,
    createdAt: "2026-08-31T18:42:00",
    ...overrides,
  };
}

function withPage(content: AccountPosting[]) {
  return {
    success: true,
    data: {
      content,
      totalElements: content.length,
      totalPages: 1,
      size: 50,
      number: 0,
      first: true,
      last: true,
      empty: content.length === 0,
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getPaymentsLedgerData — Account 1110 binding", () => {
  it("requests accountCode=1110 (page 0, size 50) from /finance/transactions", async () => {
    server.use(
      http.get(`${API_PREFIX}/finance/transactions`, ({ request }) => {
        expect(request.headers.get("authorization")).toBe(`Bearer ${TOKEN}`);
        const params = new URL(request.url).searchParams;
        expect(params.get("accountCode")).toBe("1110");
        expect(params.get("page")).toBe("0");
        expect(params.get("size")).toBe("50");
        return HttpResponse.json(withPage([postingFixture({ id: 2, amount: -45000 })]));
      })
    );
    const { kpis, payments } = await getPaymentsLedgerData();
    expect(payments).toHaveLength(1);
    expect(kpis.totalRecordedCount).toBe(1);
  });

  it("maps postings into PaymentLedgerItem rows", async () => {
    server.use(
      http.get(`${API_PREFIX}/finance/transactions`, () =>
        HttpResponse.json(
          withPage([
            postingFixture({
              id: 7,
              amount: -45000,
              sourceId: 1234567890,
              memo: "Reconnect fee",
              customerId: 7,
              serviceType: "HOTSPOT",
              occurredAt: "2026-08-30T10:15:00",
            }),
          ])
        )
      )
    );
    const { payments } = await getPaymentsLedgerData();
    const p = payments[0];
    expect(p.id).toBe("7");
    expect(p.subscriberCode).toBe("CUS-7");
    expect(p.subscriberPhone).toBe("Reconnect fee");
    expect(p.receiptNumber).toBe("1234567890");
    expect(p.paymentMethod).toBe("M-Pesa");
    expect(p.serviceType).toBe("HOTSPOT");
    expect(p.isReconciled).toBe(true);
    expect(p.payoutType).toBe("Direct");
    expect(p.amount).toBe(45000);
    expect(p.currency).toBe("KES");
    expect(p.latencyText).toBe("<1s");
    expect(p.statementId).toBeUndefined();
    expect(p).not.toHaveProperty("isFallback");
    expect(p.dateFormatted).toContain("Aug");
  });

  it("falls back to GUEST-USER / MPESA-CONFIRMED when customer and source are unknown", async () => {
    server.use(
      http.get(`${API_PREFIX}/finance/transactions`, () =>
        HttpResponse.json(
          withPage([
            postingFixture({
              id: 9,
              amount: 100,
              customerId: undefined,
              sourceId: undefined,
              memo: undefined,
            }),
          ])
        )
      )
    );
    const { payments } = await getPaymentsLedgerData();
    expect(payments[0].subscriberCode).toBe("GUEST-USER");
    expect(payments[0].receiptNumber).toBe("MPESA-CONFIRMED");
    expect(payments[0].subscriberPhone).toBe("—");
  });
});

describe("getPaymentsLedgerData — KPIs from real postings", () => {
  it("computes today / this-week / this-month windows from occurredAt", async () => {
    const now = new Date();
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
    const priorMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);

    const postings = [
      postingFixture({ id: 1, amount: 500, occurredAt: localIso(now) }),
      postingFixture({ id: 2, amount: 300, occurredAt: localIso(monday) }),
      postingFixture({ id: 3, amount: 200, occurredAt: localIso(priorMonth) }),
    ];

    server.use(
      http.get(`${API_PREFIX}/finance/transactions`, () => HttpResponse.json(withPage(postings)))
    );
    const { kpis } = await getPaymentsLedgerData();

    const expectedMonthTotal = postings
      .filter((p) => {
        const d = new Date(p.occurredAt);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      })
      .reduce((sum, p) => sum + Math.abs(p.amount), 0);

    expect(kpis.todayAmount).toBe(500);
    expect(kpis.thisWeekAmount).toBe(800);
    expect(kpis.mobileMoneyMonthAmount).toBe(expectedMonthTotal);
    expect(kpis.voucherMonthAmount).toBe(0);
    expect(kpis.totalRecordedCount).toBe(3);
  });
});

describe("getPaymentsLedgerData — zero-dummy mandate", () => {
  it("returns [] + zero KPIs when Account 1110 has no postings", async () => {
    server.use(
      http.get(`${API_PREFIX}/finance/transactions`, () => HttpResponse.json(withPage([])))
    );
    const { kpis, payments } = await getPaymentsLedgerData();
    expect(payments).toEqual([]);
    expect(kpis).toEqual({
      todayAmount: 0,
      thisWeekAmount: 0,
      mobileMoneyMonthAmount: 0,
      voucherMonthAmount: 0,
      totalRecordedCount: 0,
    });
  });

  it("returns [] + zero KPIs when the backend errors", async () => {
    server.use(
      http.get(`${API_PREFIX}/finance/transactions`, () =>
        new HttpResponse(null, { status: 500 })
      )
    );
    const { kpis, payments } = await getPaymentsLedgerData();
    expect(payments).toEqual([]);
    expect(kpis.totalRecordedCount).toBe(0);
  });

  it("returns [] + zero KPIs without a token", async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as never);
    const { kpis, payments } = await getPaymentsLedgerData();
    expect(payments).toEqual([]);
    expect(kpis.totalRecordedCount).toBe(0);
  });

  it("never leaks demo fixtures into rows", async () => {
    const { payments } = await getPaymentsLedgerData();
    expect(JSON.stringify(payments)).not.toContain("pay-1");
    expect(JSON.stringify(payments)).not.toContain("A3762");
    expect(JSON.stringify(payments)).not.toContain("UGK3W0IY06");
  });
});