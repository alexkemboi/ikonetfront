import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/companyContext", () => ({
  withCompanyContext: vi.fn(async (headers: Record<string, string>) => headers),
}));

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ "content-type": "application/json" }),
    json: async () => body,
  };
}

function lastRequest() {
  const [url, init] = (global.fetch as Mock).mock.calls.at(-1) as [string, RequestInit];
  return { url, init, body: init.body ? JSON.parse(String(init.body)) : undefined };
}

describe("system user actions", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it("getSystemUsersPage reads the canonical staff API and normalizes the page", async () => {
    (global.fetch as Mock).mockResolvedValue(
      jsonResponse(200, {
        success: true,
        data: {
          content: [{ idxno: 7, username: "inv_bedak_004", role: "04", investorId: null, companyId: "CMP-BDK-001" }],
          totalElements: 1,
          totalPages: 1,
          number: 0,
          size: 20,
        },
      })
    );

    const { getSystemUsersPage } = await import("@/actions/system");
    const res = await getSystemUsersPage({ q: " ali ", role: "04" });

    const { url } = lastRequest();
    expect(url).toBe("http://localhost:8381/api/system-users?page=0&size=20&q=ali&role=04");
    expect(res.success).toBe(true);
    expect(res.data?.totalElements).toBe(1);
    expect(res.data?.content[0]).toMatchObject({ idxno: 7, companyId: "CMP-BDK-001", investorId: null });
  });

  it("getSystemUsersPage rejects a response that is not a page", async () => {
    (global.fetch as Mock).mockResolvedValue(jsonResponse(200, { success: true, data: [{ idxno: 1 }] }));

    const { getSystemUsersPage } = await import("@/actions/system");
    const res = await getSystemUsersPage();

    expect(res.success).toBe(false);
    expect(res.status).toBe(502);
  });

  it("addSystemUser sends the investor record for a Network Partner in one POST", async () => {
    (global.fetch as Mock).mockResolvedValue(
      jsonResponse(201, { success: true, message: "System user created", data: { idxno: 9, username: "partner01", role: "04" } })
    );

    const { addSystemUser } = await import("@/actions/system");
    const res = await addSystemUser({
      username: "partner01",
      password: "a-long-password",
      role: "04",
      fname: "Ali",
      companyId: "CMP-BDK-001",
      investorId: "3f2b8c1e-0000-4000-8000-000000000001",
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const { url, init, body } = lastRequest();
    expect(url).toBe("http://localhost:8381/api/system-users");
    expect(init.method).toBe("POST");
    expect(body).toMatchObject({ role: "04", investorId: "3f2b8c1e-0000-4000-8000-000000000001" });
    expect(res.success).toBe(true);
    expect(res.data?.idxno).toBe(9);
  });

  it("addSystemUser returns the backend's refusal and its code", async () => {
    (global.fetch as Mock).mockResolvedValue(
      jsonResponse(409, { success: false, message: "Username already exists", data: { code: "USERNAME_ALREADY_EXISTS" } })
    );

    const { addSystemUser } = await import("@/actions/system");
    const res = await addSystemUser({
      username: "taken",
      password: "a-long-password",
      role: "02",
      fname: "Jane",
      companyId: "CMP-BDK-001",
    });

    expect(res.success).toBe(false);
    expect(res.message).toBe("Username already exists");
    expect(res.code).toBe("USERNAME_ALREADY_EXISTS");
    expect(res.data).toBeNull();
  });

  it("linkSystemUserInvestor puts the investor id on the account", async () => {
    (global.fetch as Mock).mockResolvedValue(
      jsonResponse(200, { success: true, data: { idxno: 7, role: "04", investorId: "3f2b8c1e-0000-4000-8000-000000000001" } })
    );

    const { linkSystemUserInvestor } = await import("@/actions/system");
    const res = await linkSystemUserInvestor(7, "3f2b8c1e-0000-4000-8000-000000000001");

    const { url, init, body } = lastRequest();
    expect(url).toBe("http://localhost:8381/api/system-users/7/investor");
    expect(init.method).toBe("PUT");
    expect(body).toEqual({ investorId: "3f2b8c1e-0000-4000-8000-000000000001" });
    expect(res.data?.investorId).toBe("3f2b8c1e-0000-4000-8000-000000000001");
  });
});
