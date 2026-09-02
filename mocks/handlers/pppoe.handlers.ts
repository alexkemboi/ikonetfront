import { http, HttpResponse } from "msw";
import { API_PREFIX, requireAuth } from "./auth-guard";
import {
  pppoePackagesFixture,
  pppoeAccountsFixture,
  pppoeSubscriptionsFixture,
  pppoePackageFixture,
  pppoeAccountFixture,
  radiusAuthFixture,
  envelope,
} from "@/contracts/catalog";

export const pppoeHandlers = [
  http.get(`${API_PREFIX}/pppoe/packages`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(pppoePackagesFixture(), { status: 200 });
  }),

  http.post(`${API_PREFIX}/pppoe/packages`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(
      envelope(pppoePackageFixture(), "PPPoE package created successfully"),
      { status: 200 }
    );
  }),

  http.get(`${API_PREFIX}/pppoe/packages/:id`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(
      envelope(pppoePackageFixture(), "PPPoE package fetched successfully"),
      { status: 200 }
    );
  }),

  http.post(`${API_PREFIX}/pppoe/accounts`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(
      envelope(pppoeAccountFixture(), "PPPoE account created successfully"),
      { status: 200 }
    );
  }),

  http.get(`${API_PREFIX}/pppoe/accounts/customer/:customerId`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(pppoeAccountsFixture(), { status: 200 });
  }),

  http.get(`${API_PREFIX}/pppoe/accounts/:id`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(
      envelope(pppoeAccountFixture(), "PPPoE account fetched successfully"),
      { status: 200 }
    );
  }),

  http.patch(`${API_PREFIX}/pppoe/accounts/:id/suspend`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(
      envelope(null, "PPPoE account suspended"),
      { status: 200 }
    );
  }),

  http.patch(`${API_PREFIX}/pppoe/accounts/:id/activate`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(
      envelope(null, "PPPoE account activated"),
      { status: 200 }
    );
  }),

  http.get(`${API_PREFIX}/pppoe/subscriptions/customer/:customerId`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(pppoeSubscriptionsFixture(), { status: 200 });
  }),

  http.post(`${API_PREFIX}/pppoe/subscriptions/activate`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(
      envelope(null, "Package assigned successfully"),
      { status: 200 }
    );
  }),

  http.post(`${API_PREFIX}/pppoe/subscriptions/renew`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(
      envelope(null, "Subscription renewed successfully"),
      { status: 200 }
    );
  }),

  http.post(`${API_PREFIX}/pppoe/payments/stk-push`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(
      envelope(null, "STK push initiated successfully"),
      { status: 200 }
    );
  }),

  // Public per live spec (RADIUS NAS traffic; probe: custom 403 on untrusted IP source).
  http.post(`${API_PREFIX}/pppoe/radius/auth`, () =>
    HttpResponse.json(radiusAuthFixture(), { status: 200 })
  ),
];