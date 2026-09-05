import { http, HttpResponse } from "msw";
import { API_PREFIX, ADMIN_ROLES, requireAuth } from "./auth-guard";
import { customerDeviceFixture, ipMappingsPageFixture } from "@/contracts/catalog";

export const sessionHandlers = [
  // Bearer (ADMIN/CUSTOMER/SYSADMIN/01) — static device binding creation.
  http.post(`${API_PREFIX}/customer-devices`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(customerDeviceFixture(), { status: 201 });
  }),

  // Bearer (SYSADMIN/ADMIN/01) — Page envelope, NOT a bare array.
  http.get(`${API_PREFIX}/network/ip-mappings`, (info) => {
    const forbidden = requireAuth(info.request, ADMIN_ROLES);
    if (forbidden) return forbidden;
    return HttpResponse.json(ipMappingsPageFixture(), { status: 200 });
  }),
];