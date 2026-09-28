import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { API_PREFIX } from "@/mocks/handlers/auth-guard";
import { getPaymentsLedgerData, getInvoicesLedgerData, recordManualPayment, getVoucherBatches, getReconciliationDay } from "@/actions/payments";
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

describe("getPaymentsLedgerData — payments received (payer identity)", () => {
  it("uses /finance/payments/received when available: phone, receipt and connection outcome", async () => {
    let glCalled = false;
    server.use(
      http.get(`${API_PREFIX}/finance/payments/received`, ({ request }) => {
        expect(request.headers.get("authorization")).toBe(`Bearer ${TOKEN}`);
        return HttpResponse.json({
          success: true,
          data: {
            kpis: { today: "3.00", thisWeek: "61.00", thisMonth: "84.00", total: "84.00", paymentCount: 45, notConnectedCount: 4, compensatedCount: 1 },
            payments: {
              content: [
                {
                  postingId: "p-1", paymentId: "tp-1", occurredAt: "2026-09-24T17:48:14Z", amount: "1.00", currency: "KES",
                  service: "HOTSPOT", phone: "254790721501", customerName: null, mpesaReceipt: "UIOAC7SD8C",
                  packageName: "HOTSPOT INUA", routerName: "ADRINOLD-WESTLANDS", voucherCode: "AF726A22", sessionId: 175,
                  connection: "NOT_CONNECTED", compensationVoucher: null,
                },
              ],
            },
          },
        });
      }),
      http.get(`${API_PREFIX}/finance/transactions`, () => {
        glCalled = true;
        return HttpResponse.json(withPage([]));
      })
    );

    const { kpis, payments, source } = await getPaymentsLedgerData();

    expect(source).toBe("RECEIVED");
    expect(glCalled).toBe(false);
    expect(kpis.todayAmount).toBe(3);
    expect(kpis.totalRecordedCount).toBe(45);
    expect(kpis.notConnectedCount).toBe(4);
    const row = payments[0];
    expect(row.subscriberCode).toBe("0790 721 501");
    expect(row.receiptNumber).toBe("UIOAC7SD8C");
    expect(row.connection).toBe("NOT_CONNECTED");
    expect(row.routerName).toBe("ADRINOLD-WESTLANDS");
    expect(row.subscriberCode).not.toBe("GUEST-USER");
  });
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
  afterEach(() => {
    vi.useRealTimers();
  });

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

describe("getInvoicesLedgerData — envelope contract", () => {
  it("returns page rows and summary KPIs from /finance/invoices", async () => {
    server.use(
      http.get(`${API_PREFIX}/finance/invoices`, () =>
        HttpResponse.json({
          success: true,
          data: {
            content: [
              {
                id: 1,
                invoiceNumber: "INV-CMP-A-2026-100001",
                companyId: "CMP-A",
                customerId: "2f6b2f8a-1c44-4f8e-bd3a-5e9a6b7c01",
                customerIdxno: 42,
                customerName: "Njeri Wafula",
                customerPhone: "0712345678",
                packageName: "Home 30",
                amount: 2500,
                taxAmount: 0,
                status: "UNPAID",
                dueDate: "2026-09-26",
                createdAt: "2026-09-19T06:00:00",
              },
            ],
            totalElements: 1,
            totalPages: 1,
          },
        })
      )
    );
    server.use(
      http.get(`${API_PREFIX}/finance/invoices/summary`, () =>
        HttpResponse.json({
          success: true,
          data: {
            allInvoicesCount: 1,
            pendingAmount: 2500,
            pendingCount: 1,
            overdueCount: 0,
            collectedAmount: 0,
            paidCount: 0,
          },
        })
      )
    );
    const { kpis, invoices } = await getInvoicesLedgerData();
    expect(kpis.allInvoicesCount).toBe(1);
    expect(kpis.pendingAmount).toBe(2500);
    expect(invoices).toHaveLength(1);
    expect(invoices[0].invoiceNumber).toBe("INV-CMP-A-2026-100001");
    expect(invoices[0].status).toBe("UNPAID");
    expect(invoices[0].outstanding).toBe(2500);
  });
});

describe("recordManualPayment — envelope contract", () => {
  it("posts to /payments/manual and returns the receipt number", async () => {
    server.use(
      http.post(`${API_PREFIX}/payments/manual`, ({ request }) => {
        expect(request.headers.get("authorization")).toBe(`Bearer ${TOKEN}`);
        return HttpResponse.json(
          {
            success: true,
            status: 201,
            message: "Manual payment recorded successfully",
            data: {
              paymentId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
              referenceNumber: "MAN-20260919-8F3A2C70",
              amount: 1500,
              channel: "CASH",
              expiresAt: null,
              recordedAt: "2026-09-19T06:00:00",
            },
            timestamp: "2026-09-19T06:00:00",
          },
          { status: 201 }
        );
      })
    );
    const res = await recordManualPayment({
      customerIdxno: 42,
      amount: 1500,
      channel: "CASH",
    });
    expect(res.success).toBe(true);
    expect(res.data?.referenceNumber).toBe("MAN-20260919-8F3A2C70");
    expect(res.data?.channel).toBe("CASH");
  });
});

describe("getVoucherBatches — envelope contract", () => {
  it("returns empty-safe KPIs when the batch list is empty", async () => {
    server.use(
      http.get(`${API_PREFIX}/finance/voucher-batches`, () =>
        HttpResponse.json({
          success: true,
          data: { content: [], totalElements: 0 },
        })
      )
    );
    const { kpis, batches } = await getVoucherBatches();
    expect(batches).toEqual([]);
    expect(kpis.activeCount).toBe(0);
    expect(kpis.totalValue).toBe(0);
  });
});



describe("getReconciliationDay — outcomes for one day", () => {
  it("returns the day's story, attention items and Safaricom status", async () => {
    server.use(
      http.get(`${API_PREFIX}/finance/reconciliation/day`, ({ request }) => {
        expect(new URL(request.url).searchParams.get("date")).toBe("2026-09-25");
        return HttpResponse.json({
          success: true,
          data: {
            date: "2026-09-25",
            companyId: null,
            story: { received: "7.00", payments: 7, customers: 2, connected: 5, connecting: 0, notConnected: 2, compensated: 0, needsAttention: 2, currency: "KES" },
            attention: [
              { kind: "PAID_NOT_CONNECTED", action: "ISSUE_VOUCHER", reason: "Paid, but the router never reported this customer's device online.",
                phone: "254112420773", mpesaReceipt: "UIP388QTLG", amount: "1.00", routerName: "RTR-BDK-A" },
            ],
            safaricomCheck: { status: "UNAVAILABLE", explanation: "Safaricom returned no transactions…", safaricomTransactions: 0, ibsPayments: 7, differences: 0 },
          },
        });
      })
    );

    const { data, message } = await getReconciliationDay("2026-09-25");

    expect(message).toBeUndefined();
    expect(data?.story.connected).toBe(5);
    expect(data?.attention[0].action).toBe("ISSUE_VOUCHER");
    expect(data?.safaricomCheck.status).toBe("UNAVAILABLE");
  });
});
