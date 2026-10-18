import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { visibleInterval } from "@/lib/hooks/useVisibleInterval";

function setVisibility(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", { value: state, configurable: true });
  document.dispatchEvent(new Event("visibilitychange"));
}

describe("visibleInterval", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setVisibility("visible");
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("runs on each interval while the tab is visible", async () => {
    const run = vi.fn();
    const stop = visibleInterval(run, 30_000);
    await vi.advanceTimersByTimeAsync(90_000);
    expect(run).toHaveBeenCalledTimes(3);
    stop();
  });

  it("does not run while the tab is hidden", async () => {
    const run = vi.fn();
    const stop = visibleInterval(run, 30_000);
    setVisibility("hidden");
    await vi.advanceTimersByTimeAsync(300_000);
    expect(run).not.toHaveBeenCalled();
    stop();
  });

  it("runs at once on return when a run is due, then keeps its cadence", async () => {
    const run = vi.fn();
    const stop = visibleInterval(run, 30_000);
    setVisibility("hidden");
    await vi.advanceTimersByTimeAsync(120_000);
    setVisibility("visible");
    await vi.advanceTimersByTimeAsync(0);
    expect(run).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(run).toHaveBeenCalledTimes(2);
    stop();
  });

  it("does not run early on return when the last run is recent", async () => {
    const run = vi.fn();
    const stop = visibleInterval(run, 30_000);
    await vi.advanceTimersByTimeAsync(5_000);
    setVisibility("hidden");
    setVisibility("visible");
    await vi.advanceTimersByTimeAsync(0);
    expect(run).not.toHaveBeenCalled();
    stop();
  });

  it("never overlaps a run that is still going", async () => {
    let finish: () => void = () => {};
    const run = vi.fn(() => new Promise<void>((resolve) => { finish = resolve; }));
    const stop = visibleInterval(run, 10_000);
    await vi.advanceTimersByTimeAsync(40_000);
    expect(run).toHaveBeenCalledTimes(1);
    finish();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(run).toHaveBeenCalledTimes(2);
    stop();
  });

  it("keeps polling after a run fails", async () => {
    const run = vi.fn().mockRejectedValueOnce(new Error("backend down")).mockResolvedValue(undefined);
    const stop = visibleInterval(run, 10_000);
    await vi.advanceTimersByTimeAsync(20_000);
    expect(run).toHaveBeenCalledTimes(2);
    stop();
  });

  it("stops for good when stopped", async () => {
    const run = vi.fn();
    const stop = visibleInterval(run, 10_000);
    stop();
    setVisibility("hidden");
    setVisibility("visible");
    await vi.advanceTimersByTimeAsync(60_000);
    expect(run).not.toHaveBeenCalled();
  });
});
