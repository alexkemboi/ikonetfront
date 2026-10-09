import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/apiClient";
import { revalidatePath } from "next/cache";
import { createPppoePackageAction, updatePppoePackageAction } from "@/actions/pppoe";

vi.mock("@/lib/apiClient", () => ({ apiFetch: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const input = {
  name: "Home 10",
  uploadSpeed: 5,
  downloadSpeed: 10,
  durationDays: 30,
  price: 2500,
  mikrotikRateLimit: "5M/10M",
};

describe("PPPoE package actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a package in the PPPoE catalogue, with its price", async () => {
    vi.mocked(apiFetch).mockResolvedValue({ status: 200, success: true, message: "OK", data: {} } as never);

    await createPppoePackageAction(input);

    const [path, options] = vi.mocked(apiFetch).mock.calls[0];
    expect(path).toBe("/pppoe/packages");
    expect(options).toMatchObject({ method: "POST", body: { price: 2500 } });
    expect(revalidatePath).toHaveBeenCalledWith("/portal/pppoe/packages");
  });

  it("withdraws a package with a partial update", async () => {
    vi.mocked(apiFetch).mockResolvedValue({ status: 200, success: true, message: "OK", data: {} } as never);

    await updatePppoePackageAction("pkg-1", { isActive: false });

    const [path, options] = vi.mocked(apiFetch).mock.calls[0];
    expect(path).toBe("/pppoe/packages/pkg-1");
    expect(options).toMatchObject({ method: "PATCH", body: { isActive: false } });
  });

  it("does not refresh the list when the backend refuses", async () => {
    vi.mocked(apiFetch).mockResolvedValue({ status: 409, success: false, message: "exists", data: null } as never);

    await createPppoePackageAction(input);

    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
