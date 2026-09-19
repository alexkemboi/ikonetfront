import { describe, expect, it, vi, beforeEach } from "vitest";
import { withStepUp } from "@/lib/stepUp";

const { requestStepUp } = vi.hoisted(() => ({ requestStepUp: vi.fn() }));
vi.mock("@/lib/stepUpClient", () => ({ requestStepUp }));

describe("withStepUp", () => {
  beforeEach(() => {
    requestStepUp.mockReset();
  });

  it("passes through when the action succeeds first try", async () => {
    const run = vi.fn().mockResolvedValue({ success: true, status: 200, message: "ok" });
    const res = await withStepUp(run);
    expect(res.success).toBe(true);
    expect(run).toHaveBeenCalledTimes(1);
    expect(run.mock.calls[0]).toEqual([]);
  });

  it("opens step-up, retries with the token, and returns the replayed result", async () => {
    const run = vi
      .fn()
      .mockResolvedValueOnce({ success: false, status: 428, message: "Step-up verification required" })
      .mockResolvedValueOnce({ success: true, status: 200, message: "applied", data: { n: 1 } });
    requestStepUp.mockResolvedValue("step-token");

    const res = await withStepUp(run, "Sensitive operation");

    expect(requestStepUp).toHaveBeenCalledWith("Sensitive operation");
    expect(run).toHaveBeenNthCalledWith(2, "step-token");
    expect(res.success).toBe(true);
  });

  it("returns the 428 result when the operator cancels verification", async () => {
    const run = vi.fn().mockResolvedValue({ success: false, status: 428, message: "Step-up verification required" });
    requestStepUp.mockResolvedValue(null);

    const res = await withStepUp(run);

    expect(res.status).toBe(428);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("does not loop on a second 428", async () => {
    const run = vi.fn().mockResolvedValue({ success: false, status: 428, message: "still required" });
    requestStepUp.mockResolvedValue("token");

    await withStepUp(run);

    expect(run).toHaveBeenCalledTimes(2);
  });
});