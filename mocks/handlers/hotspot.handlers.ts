import { http, HttpResponse } from "msw";
import { API_PREFIX } from "./auth-guard";
import {
  activePackagesFixture,
  activeTvPackagesFixture,
  initiatePaymentFixture,
  reconnectFixture,
} from "@/contracts/catalog";

export const hotspotHandlers = [
  // Public captive portal surface (SecurityConfig `permitAll`).
  http.get(`${API_PREFIX}/hotspot/packages`, ({ request }) => {
    const category = new URL(request.url).searchParams.get("category");
    return HttpResponse.json(
      category === "TV" ? activeTvPackagesFixture() : activePackagesFixture(),
      { status: 200 }
    );
  }),

  // Contract: 201 Created.
  http.post(`${API_PREFIX}/hotspot/initiate`, () =>
    HttpResponse.json(initiatePaymentFixture(), { status: 201 })
  ),

  http.post(`${API_PREFIX}/hotspot/reconnect`, () =>
    HttpResponse.json(reconnectFixture(), { status: 200 })
  ),
];