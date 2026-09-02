import { http, HttpResponse } from "msw";
import { API_PREFIX, requireAuth } from "./auth-guard";
import {
  profitLossDashboardFixture,
  auditLogsFixture,
  triggerPaymentFixture,
  stationLoadFixture,
  deviceInterfacesFixture,
  devicesFixture,
  envelope,
  bootstrapTokenFixture,
} from "@/contracts/catalog";

export const analyticsHandlers = [
  http.get(`${API_PREFIX}/analytics/profit-and-loss/dashboard`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(profitLossDashboardFixture(), { status: 200 });
  }),
];

export const auditHandlers = [
  http.get(`${API_PREFIX}/systemsetup/audit-logs`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(auditLogsFixture(), { status: 200 });
  }),
];

export const paymentHandlers = [
  // Public per live spec; probe reached the controller tokenless (404 on fake package).
  http.post(`${API_PREFIX}/payments/trigger`, () =>
    HttpResponse.json(triggerPaymentFixture(), { status: 200 })
  ),
];

export const provisioningHandlers = [
  http.get(`${API_PREFIX}/network/provisioning/station/:stationId/load`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(stationLoadFixture(), { status: 200 });
  }),

  http.post(`${API_PREFIX}/network/provisioning/pppoe`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(
      envelope(null, "Subscriber line provisioned successfully"),
      { status: 200 }
    );
  }),
];

export const networkDeviceHandlers = [
  http.get(`${API_PREFIX}/network-devices`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(devicesFixture(), { status: 200 });
  }),

  http.post(`${API_PREFIX}/network-devices`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(
      envelope({ ...devicesFixture().data?.[0], id: 5, name: "New Site Router", ipAddress: "10.20.0.1" }, "Device added successfully"),
      { status: 200 }
    );
  }),

  http.get(`${API_PREFIX}/network-devices/:id/interfaces`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(deviceInterfacesFixture(), { status: 200 });
  }),
];

export const bootstrapHandlers = [
  // Bearer per runtime probe (tokenless POST → 401) — matches the frontend,
  // which already sends the session JWT.
  http.post(`${API_PREFIX}/provision/bootstrap-tokens`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(bootstrapTokenFixture(), { status: 200 });
  }),
];