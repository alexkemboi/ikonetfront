import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateZtpScript, getZtpProvisioningStatus } from "@/actions/provisioning";
import { apiFetch } from "@/lib/apiClient";
import { getPermissionForRoute } from "@/lib/data/nav";

vi.mock("@/lib/apiClient", () => ({ apiFetch: vi.fn() }));
vi.mock("@/actions/mikrotik", () => ({ getMikrotikDevices: vi.fn() }));
vi.mock("@/actions/network", () => ({
  getRouters: vi.fn(),
  getRouterMonitoringLatest: vi.fn(),
}));
vi.mock("@/lib/data/nav", () => ({ getPermissionForRoute: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const mockedFetch = vi.mocked(apiFetch);
const mockedPerms = vi.mocked(getPermissionForRoute);

const input = {
  identity: "Adrinold 02",
  acknowledgeDestructiveReset: true,
  hotspotEnabled: true,
  pppoeEnabled: false,
};

const FETCH_COMMAND =
  '/tool fetch mode=https url="https://api.example.com/api/v1/provision/bootstrap?token=abc" dst-path=ibs-init.rsc check-certificate=no;:delay 2s;/import ibs-init.rsc;';

beforeEach(() => {
  vi.clearAllMocks();
  mockedPerms.mockResolvedValue({ canCreate: true } as never);
  mockedFetch.mockResolvedValue({
    status: 200,
    success: true,
    message: "OK",
    data: {
      routerId: 42,
      routerIdxno: 7,
      identity: "Adrinold 02",
      allocatedVpnIp: "10.9.0.7",
      fetchCommand: FETCH_COMMAND,
      expiresAt: "2026-10-06T13:00:00",
      status: "PENDING",
    },
  } as never);
});

describe("generateZtpScript", () => {
  it("sends only the identity, acknowledgement and service choices", async () => {
    await generateZtpScript(input);

    expect(mockedFetch).toHaveBeenCalledTimes(1);
    const [path, options] = mockedFetch.mock.calls[0];
    expect(path).toBe("/provision/bootstrap-tokens");
    expect(options?.method).toBe("POST");
    expect(options?.body).toEqual(input);
  });

  it("returns the backend's fetch command verbatim with both router ids", async () => {
    const result = await generateZtpScript(input);

    expect(result).toEqual({
      success: true,
      data: {
        deviceId: "42",
        routerIdxno: 7,
        identity: "Adrinold 02",
        fetchCommand: FETCH_COMMAND,
        allocatedVpnIp: "10.9.0.7",
        // zoneless backend business time is pinned to EAT
        expiresAt: "2026-10-06T13:00:00+03:00",
      },
    });
  });

  it("surfaces the backend's rejection message instead of throwing", async () => {
    mockedFetch.mockResolvedValue({
      status: 409,
      success: false,
      message: "A device named Adrinold 02 already exists",
      data: null,
    } as never);

    expect(await generateZtpScript(input)).toEqual({
      success: false,
      message: "A device named Adrinold 02 already exists",
    });
  });

  it("fails when the response carries no fetch command", async () => {
    mockedFetch.mockResolvedValue({
      status: 200,
      success: true,
      message: "OK",
      data: { routerId: 42 },
    } as never);

    const result = await generateZtpScript(input);
    expect(result.success).toBe(false);
  });

  it.each([
    ["an identity with punctuation", { identity: "rtr_01!" }],
    ["an identity over 64 characters", { identity: "a".repeat(65) }],
    ["a missing acknowledgement", { acknowledgeDestructiveReset: false }],
  ])("rejects %s without calling the backend", async (_label, override) => {
    const result = await generateZtpScript({ ...input, ...override });
    expect(result.success).toBe(false);
    expect(mockedFetch).not.toHaveBeenCalled();
  });

  it("refuses users without create permission on routers", async () => {
    mockedPerms.mockResolvedValue({ canCreate: false } as never);

    const result = await generateZtpScript(input);
    expect(result.success).toBe(false);
    expect(mockedFetch).not.toHaveBeenCalled();
  });
});

describe("getZtpProvisioningStatus", () => {
  it("reads the provisioning status endpoint by device id", async () => {
    mockedFetch.mockResolvedValue({
      status: 200,
      success: true,
      message: "OK",
      data: { routerId: 42, status: "COMPLETED", online: true },
    } as never);

    expect(await getZtpProvisioningStatus("42")).toEqual({ status: "COMPLETED", online: true });
    expect(mockedFetch.mock.calls[0][0]).toBe("/provision/devices/42/status");
  });

  it("reports an unknown status when the poll fails", async () => {
    mockedFetch.mockResolvedValue({ status: 500, success: false, message: "boom", data: null } as never);
    expect(await getZtpProvisioningStatus("42")).toEqual({ status: null, online: false });
  });

  it("never polls for a placeholder id", async () => {
    expect(await getZtpProvisioningStatus("0")).toEqual({ status: null, online: false });
    expect(mockedFetch).not.toHaveBeenCalled();
  });
});
