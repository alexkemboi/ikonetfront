import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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
  it("requests accountCode=1110 (page 0, size 50) from /finance/transactions and reports source GL", async () => {
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
    const { kpis, payments, source } = await getPaymentsLedgerData();
    expect(source).toBe("GL");
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
  afterEach(() => vi.useRealTimers());

  it.each([
    { date: "2026-09-14T12:00:00", today: 800, month: 800 }, // Monday: both payments are today.
    { date: "2026-09-16T12:00:00", today: 500, month: 800 }, // Wednesday.
    { date: "2026-09-01T12:00:00", today: 500, month: 500 }, // Monday falls in August.
  ])("computes calendar windows on $date", async ({ date, today, month }) => {
    // Freeze Date only; MSW/network timers must continue running normally.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(date));
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

    expect(kpis.todayAmount).toBe(today);
    expect(kpis.thisWeekAmount).toBe(800);
    expect(kpis.mobileMoneyMonthAmount).toBe(month);
    expect(kpis.voucherMonthAmount).toBe(0);
    expect(kpis.totalRecordedCount).toBe(3);
  });
});

describe("getPaymentsLedgerData — zero-dummy mandate", () => {
  it("falls back to confirmed gateway payments when Account 1110 has no postings", async () => {
    const today = localIso(new Date());
    server.use(
      http.get(`${API_PREFIX}/finance/transactions`, () => HttpResponse.json(withPage([])))
    );
    server.use(
      http.get(`${API_PREFIX}/payments`, () =>
        HttpResponse.json({
          success: true,
          data: [
            {
              id: "3f1b9c2e-6a4d-4b5a-9c3e-2f8d1a4b6c77",
              packageId: 12,
              packageName: "Daily Hotspot",
              customerNumber: "0712345678",
              paymentmode: "mpesa",
              issuccessfull: true,
              datecreated: today,
              voucherCode: null,
              checkoutRequestId: "ws_CO_0919090909091919191",
              status: "COMPLETED",
              amount: 750,
              mpesaReceipt: "UIC1234567X",
              updatedAt: "2026-09-13T09:31:00",
            },
            {
              id: "5c2d4e8f-7b8c-4d6e-8a1f-9e3b2c5d7e88",
              packageId: 5,
              packageName: "Weekend Bundle",
              customerNumber: "254712345678",
              paymentmode: "mpesa",
              issuccessfull: true,
              datecreated: today,
              checkoutRequestId: "ws_CO_0918090909091818181",
              status: "COMPLETED",
              amount: 300,
              mpesaReceipt: "UIC7654321Z",
              updatedAt: "2026-09-12T14:06:00",
            },
          ],
        })
      )
    );
    const { kpis, payments, source } = await getPaymentsLedgerData();
    expect(source).toBe("GATEWAY");
    expect(payments).toHaveLength(2);
    expect(payments[0].subscriberCode).toBe("0712345678");
    expect(payments[0].subscriberPhone).toBe("0712345678");
    expect(payments[0].receiptNumber).toBe("UIC1234567X");
    expect(payments[0].amount).toBe(750);
    expect(payments[0].paymentMethod).toBe("M-Pesa");
    expect(payments[1].subscriberCode).toBe("254712345678");
    expect(kpis.totalRecordedCount).toBe(2);
    expect(kpis.todayAmount).toBe(1050);
  });

  it("returns [] + zero KPIs when Account 1110 has no postings and the gateway has none either", async () => {
    server.use(
      http.get(`${API_PREFIX}/finance/transactions`, () => HttpResponse.json(withPage([])))
    );
    server.use(
      http.get(`${API_PREFIX}/payments`, () =>
        HttpResponse.json({ success: true, data: [] })
      )
    );
    const { kpis, payments, source } = await getPaymentsLedgerData();
    expect(source).toBe("GATEWAY");
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
    // `/payments` is deliberately NOT stubbed here → MSW 404 → the gateway
    // fallback catch path returns zeros (guards against fabricating a ledger).
    const { kpis, payments, source } = await getPaymentsLedgerData();
    expect(source).toBe("GATEWAY");
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