import { http, HttpResponse } from "msw";
import { API_PREFIX, requireAuth } from "./auth-guard";
import {
  rolesFixture,
  menusFixture,
  roleMenusFixture,
  roleUsersFixture,
  roleFixture,
  envelope,
} from "@/contracts/catalog";

export const systemSetupHandlers = [
  http.get(`${API_PREFIX}/system-setup/all-roles`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(rolesFixture(), { status: 200 });
  }),

  http.get(`${API_PREFIX}/system-setup/all-menus`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(menusFixture(), { status: 200 });
  }),

  http.get(`${API_PREFIX}/system-setup/:roleCode/menus`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(roleMenusFixture(), { status: 200 });
  }),

  http.post(`${API_PREFIX}/system-setup/:roleCode/menus`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(
      envelope("Permissions updated", "Permissions updated successfully"),
      { status: 200 }
    );
  }),

  http.post(`${API_PREFIX}/system-setup/add-role`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(
      envelope(roleFixture({ idxno: 3, roleCode: "SUPPORT", name: "Support Agent" }), "Role created successfully"),
      { status: 200 }
    );
  }),

  // Live spec: path param is the role's numeric `idxno` (int64).
  http.put(`${API_PREFIX}/system-setup/update-role/:id`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(
      envelope(roleFixture({ roleCode: "TECH", name: "Field Technician v2" }), "Role updated successfully"),
      { status: 200 }
    );
  }),

  http.get(`${API_PREFIX}/system-setup/:roleCode/users`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(roleUsersFixture(), { status: 200 });
  }),
];