import { describe, it, expect, vi, beforeEach } from "vitest";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { API_PREFIX } from "@/mocks/handlers/auth-guard";
import {
  getRolesAction,
  getAllMenusAction,
  getRoleMenusAction,
  getRoleUsersAction,
  addRoleAction,
  saveRoleMenusAction,
  renameRoleAction,
  assignUserToRoleAction,
  removeUserFromRoleAction,
} from "@/actions/roles";
import { addSystemUser, getSystemUsers } from "@/actions/system";

const TOKEN = "mock-valid-bearer-token";

beforeEach(() => {
 vi.clearAllMocks();
});

describe("system-setup roles/menus (live spec 7 interactions, bearer)", () => {
 it("GET /system-setup/all-roles returns normalized roles", async () => {
   const res = await getRolesAction();
   expect(res.success).toBe(true);
   expect(res.data?.[0] as Record<string, unknown>).toMatchObject({ roleCode: "SYSADMIN", name: "System Administrator" });
 });

 it("GET /system-setup/all-menus returns the menu catalog", async () => {
   const res = await getAllMenusAction();
   expect(res.success).toBe(true);
   expect(res.data?.[0].route).toBe("/dashboard");
 });

 it("GET/POST /system-setup/{roleCode}/menus round-trip", async () => {
   server.use(
     http.get(`${API_PREFIX}/system-setup/:roleCode/menus`, () =>
       HttpResponse.json(
         { status: 200, success: true, message: "OK", data: [{ label: "Dashboard", route: "/dashboard", icon: "LayoutDashboard", sortOrder: 1, canView: true, canCreate: true, canEdit: true, canDelete: true }] },
         { status: 200 }
       )
     )
   );
   const menus = await getRoleMenusAction("TECH");
   expect(menus.success).toBe(true);
   expect(menus.data?.[0].canView).toBe(true);

   server.use(
     http.post(`${API_PREFIX}/system-setup/:roleCode/menus`, async ({ request, params }) => {
       expect(params.roleCode).toBe("TECH");
       const body = (await request.json()) as Record<string, unknown>;
       expect(body.permissions).toHaveLength(1);
       return HttpResponse.json(
         { status: 200, success: true, message: "Permissions updated", data: "Permissions updated", timestamp: "2026-09-02T00:00:00.000Z" },
         { status: 200 }
       );
     })
   );
   const saved = await saveRoleMenusAction("TECH", [{ menuItemId: 1, canView: true, canCreate: true, canEdit: true, canDelete: true }]);
   expect(saved.success).toBe(1);
 });

 it("POST /system-setup/add-role creates a role envelope", async () => {
   const res = await addRoleAction({ roleCode: "SUPPORT", name: "Support Agent", description: "Billing support" });
   expect(res.success).toBe(true);
   expect(res.data?.roleCode).toBe("SUPPORT");
 });

 it("PUT /system-setup/update-role/{id} uses the numeric idxno path param", async () => {
   server.use(
     http.put(`${API_PREFIX}/system-setup/update-role/:id`, async ({ request, params }) => {
       expect(params.id).toBe("2");
       const body = (await request.json()) as Record<string, unknown>;
       expect(body).toMatchObject({ roleCode: "TECH", name: "Field Technician", description: "Field support role" });
       return HttpResponse.json(
         { status: 200, success: true, message: "Role updated", data: { idxno: 2, roleCode: "TECH", name: "Field Technician v2", description: "Field support role" }, timestamp: "2026-09-02T00:00:00.000Z" },
         { status: 200 }
       );
     })
   );
   const res = await renameRoleAction(2, "TECH", "Field Technician", "Field support role");
   expect(res.success).toBe(true);
   expect(res.data?.name).toBe("Field Technician v2");
 });

 it("GET /system-setup/{roleCode}/users returns role members", async () => {
   const res = await getRoleUsersAction("TECH");
   expect(res.success).toBe(true);
   expect(res.data?.[0].username).toBe("jmwangi");
 });

 it("membership mutations are gated 503 (routes absent from live spec)", async () => {
   const assigned = await assignUserToRoleAction("TECH", "7");
   expect(assigned.success).toBe(false);
   expect(assigned.status).toBe(503);
   const removed = await removeUserFromRoleAction("TECH", "7");
   expect(removed.success).toBe(false);
   expect(removed.status).toBe(503);
 });
});

describe("system users (live spec primaries)", () => {
 it("GET /system/users/staff is the only live listing route", async () => {
   const users = await getSystemUsers();
   expect(users).toHaveLength(2);
   expect(users[0].username).toBe("jmwangi");
 });

 it("POST /system-setup/user/register sends RegisterRequest and revalidates", async () => {
   server.use(
     http.post(`${API_PREFIX}/system-setup/user/register`, async ({ request }) => {
       expect(request.headers.get("authorization")).toBe(`Bearer ${TOKEN}`);
       const body = (await request.json()) as Record<string, unknown>;
       expect(body).toMatchObject({ username: "mwaniki", password: "StrongPass1!", role: "TECH", fname: "Peter" });
       return HttpResponse.json(
         { status: 200, success: true, message: "User created", data: { idxno: 9, username: "mwaniki", userId: "9", role: "TECH", fname: "Peter" }, timestamp: "2026-09-02T00::00:00.000Z" },
         { status: 200 }
       );
     })
   );
   const res = await addSystemUser({ username: "mwaniki", password: "StrongPass1!", role: "TECH", fname: "Peter", middleName: "", otherName: "", email: "", phoneNumber: "" });
   expect(res.success).toBe(true);
 });
});