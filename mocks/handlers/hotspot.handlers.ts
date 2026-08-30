import { http, HttpResponse } from "msw";
import { API_PREFIX } from "./auth-guard";
import {
  activePackagesFixture,
  initiatePaymentFixture,
  reconnectFixture,
} from "@/contracts/catalog";

export const hotspotHandlers = [
  // Public captive portal surface (SecurityConfig `permitAll`).
  http.get(`${API_PREFIX}/hotspot/packages`, () =>
    HttpResponse.json(activePackagesFixture(), { status: 200 })
  ),

  // Contract: 201 Created.
  http.post(`${API_PREFIX}/hotspot/initiate`, () =>
    HttpResponse.json(initiatePaymentFixture(), { status: 201 })
  ),

  http.post(`${API_PREFIX}/hotspot/reconnect`, () =>
    HttpResponse.json(reconnectFixture(), { status: 200 })
  ),
];