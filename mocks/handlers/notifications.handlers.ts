import { http, HttpResponse } from "msw";
import { API_PREFIX, requireAuth } from "./auth-guard";
import {
  notificationProvidersFixture,
  notificationProviderFixture,
  envelope,
} from "@/contracts/catalog";

export const notificationProviderHandlers = [
  http.get(`${API_PREFIX}/notification-providers`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(notificationProvidersFixture(), { status: 200 });
  }),

  http.post(`${API_PREFIX}/notification-providers`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(
      envelope(notificationProviderFixture(), "Notification provider created"),
      { status: 200 }
    );
  }),

  http.put(`${API_PREFIX}/notification-providers/:id`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(
      envelope(notificationProviderFixture({ isActive: false }), "Notification provider updated"),
      { status: 200 }
    );
  }),

  http.delete(`${API_PREFIX}/notification-providers/:id`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(
      envelope("Provider deleted", "Notification provider deleted"),
      { status: 200 }
    );
  }),
];