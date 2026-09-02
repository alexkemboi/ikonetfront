import { describe, it, expect, vi, beforeEach } from "vitest";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { API_PREFIX } from "@/mocks/handlers/auth-guard";
import {
  getTickets,
  getTicketById,
  getTicketComments,
  searchTickets,
  getTicketMetrics,
  createTicket,
  updateTicketStatus,
  assignTicket,
  addTicketComment,
} from "@/actions/ticket";

const TOKEN = "mock-valid-bearer-token";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("tickets (live spec 9 interactions, bearer)", () => {
  it("GET /tickets returns the ApiResponseListTicketResponse envelope with Bearer", async () => {
    server.use(
      http.get(`${API_PREFIX}/tickets`, ({ request }) => {
        expect(request.headers.get("authorization")).toBe(`Bearer ${TOKEN}`);
        return HttpResponse.json(
          {
            status: 200,
            success: true,
            message: "Tickets fetched successfully",
            data: [
              { idxno: 41, ticketNumber: "TCK-2026-0041", title: "No internet at home", description: "Down", status: "OPEN", priority: "MEDIUM", createdAt: "2026-08-26T09:00:00+03:00" },
            ],
            timestamp: "2026-09-02T00:00:00.000Z",
          },
          { status: 200 }
        );
      })
    );
    const res = await getTickets();
    expect(res.success).toBe(true);
    expect(res.data).toHaveLength(1);
    expect(res.data?.[0].ticketNumber).toBe("TCK-2026-0041");
  });

  it("POST /tickets sends the required {title, description, priority} body", async () => {
    server.use(
      http.post(`${API_PREFIX}/tickets`, async ({ request }) => {
        expect(request.headers.get("authorization")).toBe(`Bearer ${TOKEN}`);
        const body = (await request.json()) as Record<string, unknown>;
        expect(body).toMatchObject({ title: "No internet", description: "Down since morning", priority: "HIGH" });
        return HttpResponse.json(
          { status: 200, success: true, message: "Ticket created", data: { idxno: 41, ticketNumber: "TCK-2026-0041" }, timestamp: "2026-09-02T00:00:00.000Z" },
          { status: 200 }
        );
      })
    );
    const res = await createTicket({ title: "No internet", description: "Down since morning", priority: "HIGH" });
    expect(res.success).toBe(true);
  });

  it("PATCH /tickets/{id}/status sends status as a query param", async () => {
    server.use(
      http.patch(`${API_PREFIX}/tickets/:id/status`, ({ request }) => {
        expect(new URL(request.url).searchParams.get("status")).toBe("RESOLVED");
        return HttpResponse.json(
          { status: 200, success: true, message: "Status updated", data: { idxno: 41, status: "RESOLVED" }, timestamp: "2026-09-02T00:00:00.000Z" },
          { status: 200 }
        );
      })
    );
    const res = await updateTicketStatus(41, "RESOLVED");
    expect(res.success).toBe(true);
  });

  it("PATCH /tickets/{id}/assign/{agentId} targets the agent path", async () => {
    server.use(
      http.patch(`${API_PREFIX}/tickets/:id/assign/:agentId`, ({ params }) => {
        expect(params.agentId).toBe("7");
        return HttpResponse.json(
          { status: 200, success: true, message: "Assigned", data: { idxno: 41 }, timestamp: "2026-09-02T00:00:00.000Z" },
          { status: 200 }
        );
      })
    );
    const res = await assignTicket(41, 7);
    expect(res.success).toBe(true);
  });

  it("GET /tickets/search passes pageable params and unwraps data.content", async () => {
    server.use(
      http.get(`${API_PREFIX}/tickets/search`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get("page")).toBe("0");
        expect(url.searchParams.get("size")).toBe("10");
                return HttpResponse.json(
          {
            status: 200,
            success: true,
            message: "ok",
            data: { content: [{ idxno: 41, title: "No internet" }], totalElements: 1, totalPages: 1, size: 10, number: 0, first: true, last: true, empty: false },
            timestamp: "2026-09-02T00:00:00.000Z",
          },
          { status: 200 }
        );
      })
    );
    const res = await searchTickets({ page: 0, size: 10 });
    expect(res.success).toBe(true);
    expect(res.data?.content).toHaveLength(1);
  });

  it("GET /tickets/metrics returns the metrics object", async () => {
    const res = await getTicketMetrics();
    expect(res.success).toBe(true);
    expect(res.data).toMatchObject({ totalOpen: 3, inProgress: 5, resolved: 42 });
  });

  it("GET /tickets/{id}/comments + POST comment round-trip", async () => {
    const list = await getTicketComments(41);
    expect(list.success).toBe(true);
    expect(list.data?.[0].comment).toBe("Please escalate.");

    server.use(
      http.post(`${API_PREFIX}/tickets/:id/comments`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        expect(body.comment).toBe("Ticket closed.");
        return HttpResponse.json(
          { status: 200, success: true, message: "Added", data: { idxno: 1003, authorName: "Joseph Mwangi", comment: "Ticket closed.", createdAt: "2026-08-26T11:00:00+03:00" }, timestamp: "2026-09-02T00:00:00.000Z" },
          { status: 200 }
        );
      })
    );
    const added = await addTicketComment(41, { comment: "Ticket closed." });
    expect(added.success).toBe(true);
    expect(added.data?.comment).toBe("Ticket closed.");
  });

  it("GET /tickets/{id} resolves the single-ticket envelope", async () => {
    const res = await getTicketById(41);
    expect(res.success).toBe(true);
    expect(res.data?.ticketNumber).toBe("TCK-2026-0041");
  });

  it("401 yields the error envelope (refresh-signout path)", async () => {
    server.use(
      http.get(`${API_PREFIX}/tickets`, () =>
        HttpResponse.json(
          { status: 401, success: false, message: "Unauthorized", data: null, timestamp: "2026-09-02T00:00:00.000Z" },
          { status: 401 }
        )
      )
    );
    const res = await getTickets();
    expect(res.success).toBe(false);
    expect(res.status).toBe(401);
  });
});