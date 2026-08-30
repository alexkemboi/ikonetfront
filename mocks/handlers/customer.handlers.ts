import { http, HttpResponse } from "msw";
import { API_PREFIX, requireAuth } from "./auth-guard";
import {
  customersPageFixture,
  customerByIdFixture,
} from "@/contracts/catalog";

export const customerHandlers = [
  // Bearer required — `authenticated` in SecurityConfig.
  http.get(`${API_PREFIX}/customers`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(customersPageFixture(), { status: 200 });
  }),

  http.get(`${API_PREFIX}/customers/:idxno`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(customerByIdFixture(), { status: 200 });
  }),

  // POST returns the page envelope (`CustomerApiResponse`).
  http.post(`${API_PREFIX}/customers`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(customersPageFixture(), { status: 200 });
  }),

  http.patch(`${API_PREFIX}/customers/:idxno/toggle-active`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(
      { status: 200, success: true, message: "Active status toggled", data: null },
      { status: 200 }
    );
  }),
];