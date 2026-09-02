import { http, HttpResponse } from "msw";
import { API_PREFIX, requireAuth } from "./auth-guard";
import {
  statementFixture,
  statementsPageFixture,
  envelope,
} from "@/contracts/catalog";

export const statementHandlers = [
  http.post(`${API_PREFIX}/statements/generate`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(
      envelope(statementFixture(), "Statement generated successfully"),
      { status: 200 }
    );
  }),

  http.get(`${API_PREFIX}/statements/customer/:customerId`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(statementsPageFixture(), { status: 200 });
  }),

  // PDF download — whitelisted raw-fetch exception (binary body, not a JSON envelope).
  http.get(`${API_PREFIX}/statements/:id/download`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.arrayBuffer(new ArrayBuffer(0), {
      status: 200,
      headers: { "Content-Type": "application/pdf" },
    });
  }),
];