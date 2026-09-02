import { http, HttpResponse } from "msw";
import { API_PREFIX, requireAuth } from "./auth-guard";
import {
  netPackagesFixture,
  netPackageByIdFixture,
} from "@/contracts/catalog";

export const packageHandlers = [
  http.get(`${API_PREFIX}/system/packages`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(netPackagesFixture(), { status: 200 });
  }),

  http.post(`${API_PREFIX}/system/packages`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(netPackageByIdFixture(), { status: 200 });
  }),

  http.patch(`${API_PREFIX}/system/packages/:idxno`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(netPackageByIdFixture(), { status: 200 });
  }),

  http.delete(`${API_PREFIX}/system/packages/:idxno`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(
      { status: 200, success: true, message: "Package deleted successfully", data: null, timestamp: "2026-09-02T00:00:00.000Z" },
      { status: 200 }
    );
  }),

  http.patch(`${API_PREFIX}/system/packages/:idxno/deactivate`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(netPackageByIdFixture(), { status: 200 });
  }),
];