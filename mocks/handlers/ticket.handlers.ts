import { http, HttpResponse } from "msw";
import { API_PREFIX, requireAuth } from "./auth-guard";
import {
  ticketsFixture,
  ticketByIdFixture,
  ticketCommentsFixture,
  ticketCommentFixture,
  ticketMetricsFixture,
  ticketsSearchPageFixture,
} from "@/contracts/catalog";

export const ticketHandlers = [
  http.get(`${API_PREFIX}/tickets`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(ticketsFixture(), { status: 200 });
  }),

  http.post(`${API_PREFIX}/tickets`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(ticketByIdFixture(), { status: 200 });
  }),

  // Static sub-paths MUST be registered before `:id` so MSW resolves them
  // literally (`/tickets/search`, `/tickets/metrics` are not ticket ids).
  http.get(`${API_PREFIX}/tickets/search`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(ticketsSearchPageFixture(), { status: 200 });
  }),

  http.get(`${API_PREFIX}/tickets/metrics`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(ticketMetricsFixture(), { status: 200 });
  }),

  http.get(`${API_PREFIX}/tickets/:id`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(ticketByIdFixture(), { status: 200 });
  }),

  http.get(`${API_PREFIX}/tickets/:id/comments`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(ticketCommentsFixture(), { status: 200 });
  }),

  http.post(`${API_PREFIX}/tickets/:id/comments`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(ticketCommentFixture(), { status: 200 });
  }),

  http.patch(`${API_PREFIX}/tickets/:id/status`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(ticketByIdFixture(), { status: 200 });
  }),

  http.patch(`${API_PREFIX}/tickets/:id/assign/:agentId`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(ticketByIdFixture(), { status: 200 });
  }),
];