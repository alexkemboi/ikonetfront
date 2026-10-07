import { describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/apiClient";
import { getActiveHotspotPackagesAction } from "@/actions/packages";

vi.mock("@/lib/apiClient", () => ({ apiFetch: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

describe("getActiveHotspotPackagesAction", () => {
  it("asks the mint endpoint's own package list, not a category filter", async () => {
    vi.mocked(apiFetch).mockResolvedValue({ status: 200, success: true, message: "OK", data: [] } as never);

    await getActiveHotspotPackagesAction();

    expect(vi.mocked(apiFetch).mock.calls[0][0]).toBe("/finance/voucher-batches/packages");
  });
});
