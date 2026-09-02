import { http, HttpResponse } from "msw";
import { API_PREFIX } from "./auth-guard";
import {
  activePackagesFixture,
  initiatePaymentFixture,
  reconnectFixture,
  hotspotSessionsPageFixture,
  voucherBatchFixture,
} from "@/contracts/catalog";

export const hotspotHandlers = [
  // Public captive portal surface (SecurityConfig `permitAll`).
  http.get(`${API_PREFIX}/hotspot/packages`, () =>
    HttpResponse.json(activePackagesFixture(), { status: 200 })
  ),

  // Contract: 200 (live spec `ApiResponseHotspotSessionResponse`).
  http.post(`${API_PREFIX}/hotspot/initiate`, () =>
    HttpResponse.json(initiatePaymentFixture(), { status: 200 })
  ),

  http.post(`${API_PREFIX}/hotspot/reconnect`, () =>
    HttpResponse.json(reconnectFixture(), { status: 200 })
  ),

  // Hotspot admin surface — public per spec (no `security` block) and probe
  // (reached the controller tokenless → 404 on unknown session/package).
  http.post(`${API_PREFIX}/hotspot/sessions/:sessionId/disconnect`, () =>
    HttpResponse.json(
      { status: 200, success: true, message: "Session disconnected successfully", data: null, timestamp: "2026-09-02T00:00:00.000Z" },
      { status: 200 }
    )
  ),

  http.get(`${API_PREFIX}/hotspot/sessions/active`, () =>
    HttpResponse.json(hotspotSessionsPageFixture(10, 2), { status: 200 })
  ),

  http.get(`${API_PREFIX}/hotspot/sessions/history`, () =>
    HttpResponse.json(hotspotSessionsPageFixture(10, 2), { status: 200 })
  ),

  // Public per spec; probe reached the controller tokenless (404 on fake package).
  http.post(`${API_PREFIX}/hotspot/vouchers/create`, () =>
    HttpResponse.json(voucherBatchFixture(), { status: 200 })
  ),
];