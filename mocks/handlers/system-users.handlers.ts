import { http, HttpResponse } from "msw";
import { API_PREFIX, requireAuth } from "./auth-guard";
import {
  staffUsersFixture,
  systemUserFixture,
} from "@/contracts/catalog";

export const systemUserHandlers = [
  http.get(`${API_PREFIX}/system/users/staff`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(staffUsersFixture(), { status: 200 });
  }),

  http.post(`${API_PREFIX}/system-setup/user/register`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(systemUserFixture(), { status: 200 });
  }),

  http.put(`${API_PREFIX}/system/users/:idxno`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(systemUserFixture(), { status: 200 });
  }),

  http.put(`${API_PREFIX}/system/users/:idxno/role`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(systemUserFixture(), { status: 200 });
  }),
];