import { http, HttpResponse } from "msw";
import { API_PREFIX, requireAuth } from "./auth-guard";
import {
  routersFixture,
  validateConnectivityFixture,
  onboardFixture,
  topologyFixture,
  routerHistoryFixture,
  routerLatestFixture,
  routerLiveStreamFixture,
  deviceStatusFixture,
  ipPoolsFixture,
} from "@/contracts/catalog";

export const networkHandlers = [
  http.get(`${API_PREFIX}/network/routers`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(routersFixture(), { status: 200 });
  }),

  http.post(`${API_PREFIX}/network/routers/validate-connectivity`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(validateConnectivityFixture(), { status: 200 });
  }),

  http.post(`${API_PREFIX}/network/routers/onboard`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(onboardFixture(), { status: 201 });
  }),

  http.get(`${API_PREFIX}/network-routers/topology`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(topologyFixture(), { status: 200 });
  }),

  http.get(`${API_PREFIX}/network/monitoring/router/:id/history`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(routerHistoryFixture(), { status: 200 });
  }),

  http.get(`${API_PREFIX}/network/monitoring/router/:id/latest`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(routerLatestFixture(), { status: 200 });
  }),

  http.get(`${API_PREFIX}/network/monitoring/router/:id/live`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.text(routerLiveStreamFixture(), {
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
    });
  }),

  http.get(`${API_PREFIX}/network-devices/:id/status`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(deviceStatusFixture(), { status: 200 });
  }),

  http.get(`${API_PREFIX}/network-devices/:id/interfaces`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(
      { status: 200, success: true, message: "Interfaces fetched", data: deviceStatusFixture().data?.interfaces ?? [] },
      { status: 200 }
    );
  }),

  http.get(`${API_PREFIX}/network/ip-pools`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(ipPoolsFixture(), { status: 200 });
  }),
];