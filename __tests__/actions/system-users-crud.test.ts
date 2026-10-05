import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { apiFetchMock, revalidatePathMock } = vi.hoisted(() => ({
  apiFetchMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/lib/apiClient", () => ({ apiFetch: apiFetchMock }));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));

import {
  addSystemUser,
  deleteSystemUser,
  getSystemUsersPage,
  linkSystemUserInvestor,
  updateSystemUser,
  updateSystemUserRole,
} from "@/actions/system";

const success = (data: unknown = {}) => ({
  status: 200,
  success: true,
  message: "ok",
  data,
  timestamp: "2026-10-05T00:00:00Z",
});

describe("system user CRUD actions", () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
    revalidatePathMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("creates a user with the API company identity and optional contact values", async () => {
    apiFetchMock.mockResolvedValue(success({ idxno: 23, username: "staff.user", companyId: "CMP-BST-001" }));
    const result = await addSystemUser({
      username: "staff.user",
      password: "long-enough-password",
      fname: "Staff",
      role: "03",
      companyId: "CMP-BST-001",
    });

    expect(result.success).toBe(true);
    expect(apiFetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/system-users"),
      expect.objectContaining({
        method: "POST",
        body: expect.objectContaining({ companyId: "CMP-BST-001", username: "staff.user" }),
      })
    );
  });

  it("uses the dedicated endpoints and route ID for update, role, investor link, and delete", async () => {
    apiFetchMock.mockResolvedValue(success({ idxno: 23, username: "staff.user" }));
    await updateSystemUser(23, { isactive: false, canLogin: true });
    await updateSystemUserRole(23, "02");
    await linkSystemUserInvestor(23, "investor-uuid");
    apiFetchMock.mockResolvedValue({ ...success(null), status: 204, data: null });
    const deleted = await deleteSystemUser(23);

    expect(apiFetchMock.mock.calls.map(([url, options]) => [String(url), options?.method])).toEqual([
      [expect.stringContaining("/system-users/23"), "PUT"],
      [expect.stringContaining("/system-users/23/role"), "PUT"],
      [expect.stringContaining("/system-users/23/investor"), "PUT"],
      [expect.stringContaining("/system-users/23"), "DELETE"],
    ]);
    expect(apiFetchMock.mock.calls[2][1].body).toEqual({ investorId: "investor-uuid" });
    expect(deleted.success).toBe(true);
  });

  it("queries the server-side page with filters and normalizes the returned records", async () => {
    apiFetchMock.mockResolvedValue(success({
      content: [{ idxno: 7, username: "jane", role: "02", isactive: true }],
      totalElements: 31,
      totalPages: 2,
      number: 1,
      size: 20,
    }));
    const result = await getSystemUsersPage({
      q: " jane ",
      role: "02",
      active: true,
      page: 1,
      size: 20,
    });

    expect(result.data).toMatchObject({
      totalElements: 31,
      totalPages: 2,
      number: 1,
      content: [{ idxno: 7, username: "jane", role: "02", isactive: true }],
    });
    expect(String(apiFetchMock.mock.calls[0][0])).toContain("q=jane");
    expect(String(apiFetchMock.mock.calls[0][0])).toContain("active=true");
  });
});
