import { http, HttpResponse } from "msw";
import { API_PREFIX, requireAuth } from "./auth-guard";
import {
  pendingRoutersFixture,
  networkRouterFixture,
  routerActionFixture,
  envelope,
} from "@/contracts/catalog";

export const networkRouterHandlers = [
  http.get(`${API_PREFIX}/network-routers/pending`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(pendingRoutersFixture(), { status: 200 });
  }),

  http.get(`${API_PREFIX}/network-routers/:id`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(
      envelope(networkRouterFixture(), "Router details fetched successfully"),
      { status: 200 }
    );
  }),

  http.patch(`${API_PREFIX}/network-routers/:id`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(
      envelope(networkRouterFixture(), "Router updated successfully"),
      { status: 200 }
    );
  }),

  http.patch(`${API_PREFIX}/network-routers/:id/action`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(routerActionFixture(), { status: 200 });
  }),

  http.post(`${API_PREFIX}/network-routers/:id/finalize`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(
      envelope(networkRouterFixture(), "Router finalized successfully"),
      { status: 200 }
    );
  }),
];