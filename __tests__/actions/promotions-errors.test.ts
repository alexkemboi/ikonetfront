import { describe, expect, it, vi } from "vitest";
import { getPromotions } from "@/actions/promotions";
import { apiFetch } from "@/lib/apiClient";

vi.mock("@/lib/apiClient", () => ({ apiFetch: vi.fn() }));

describe("promotions actions", () => {
  it("say plainly that the server does not have promotions yet when it answers 404", async () => {
    vi.mocked(apiFetch).mockResolvedValue({ status: 404, success: false, message: "NOT_FOUND", data: null, timestamp: "" });
    const res = await getPromotions();
    expect(res.data).toBeNull();
    expect(res.error).toMatch(/^Promotional SMS is not switched on on the server yet/);
  });
});
