import { http, HttpResponse } from "msw";
import { API_PREFIX, requireAuth } from "./auth-guard";
import {
  regionsFixture,
  locationsFixture,
  stationsFixture,
  regionFixture,
  locationFixture,
  stationFixture,
  envelope,
} from "@/contracts/catalog";

// Bronze-level ground truth: these routes carry NO `security` block in the
// live spec, but the runtime probe (tokenless GET) returns 401 — SecurityConfig
// requires auth on them. `requireAuth` mirrors ENFORCEMENT (runtime wins).
export const geoHandlers = [
  http.get(`${API_PREFIX}/network/regions`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(regionsFixture(), { status: 200 });
  }),

  http.post(`${API_PREFIX}/network/regions`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(
      envelope(regionFixture({ idxno: 7, regionCode: "EAST", name: "Eastern" }), "Region created successfully"),
      { status: 200 }
    );
  }),

  http.delete(`${API_PREFIX}/network/regions/:id`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(
      envelope(null, "Region deleted successfully"),
      { status: 200 }
    );
  }),

  http.get(`${API_PREFIX}/network/locations/region/:regionId`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(locationsFixture(), { status: 200 });
  }),

  http.post(`${API_PREFIX}/network/locations`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(
      envelope(locationFixture({ idxno: 13, name: "Msambweni" }), "Location created successfully"),
      { status: 200 }
    );
  }),

  http.delete(`${API_PREFIX}/network/locations/:id`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(
      envelope(null, "Location deleted successfully"),
      { status: 200 }
    );
  }),

  http.get(`${API_PREFIX}/network/stations/location/:locationId`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(stationsFixture(), { status: 200 });
  }),

  http.post(`${API_PREFIX}/network/stations`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(
      envelope(stationFixture({ idxno: 23, name: "Beachcomber" }), "Station created successfully"),
      { status: 200 }
    );
  }),

  http.delete(`${API_PREFIX}/network/stations/:id`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(
      envelope(null, "Station deleted successfully"),
      { status: 200 }
    );
  }),
];