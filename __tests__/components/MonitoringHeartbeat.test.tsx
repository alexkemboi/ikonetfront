import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { LiveDataRefresh, SessionHeartbeat } from "@/providers/MonitoringHeartbeat";

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
}

function mockRouter(refresh: () => void) {
  vi.mocked(useRouter).mockReturnValue({
    back: vi.fn(),
    forward: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    refresh,
    prefetch: vi.fn(),
  });
}

describe("SessionHeartbeat", () => {
  const update = vi.fn().mockResolvedValue(null);

  beforeEach(() => {
    vi.useFakeTimers();
    update.mockClear();
    vi.mocked(useSession).mockReturnValue({
      data: { expires: "2099-01-01T00:00:00.000Z", user: { role: "admin", fname: "Test", username: "op" } },
      status: "authenticated",
      update,
    });
    setVisibility("visible");
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("does not call update while the document is hidden", async () => {
    setVisibility("hidden");
    render(<SessionHeartbeat intervalMs={1000} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(update).not.toHaveBeenCalled();
  });

  it("calls update on each visible tick", async () => {
    render(<SessionHeartbeat intervalMs={1000} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(update).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(update).toHaveBeenCalledTimes(2);
  });

  it("ticks immediately when the document becomes visible", async () => {
    setVisibility("hidden");
    render(<SessionHeartbeat intervalMs={60_000} />);

    setVisibility("visible");
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
      await Promise.resolve();
    });

    expect(update).toHaveBeenCalledTimes(1);
  });

  it("does not overlap ticks while an update is in flight", async () => {
    let resolveUpdate: (value: unknown) => void = () => {};
    update.mockImplementationOnce(
      () => new Promise((resolve) => { resolveUpdate = resolve; })
    );
    render(<SessionHeartbeat intervalMs={1000} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(update).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveUpdate(null);
      await Promise.resolve();
    });
  });

  it("clears its timer on unmount", async () => {
    const { unmount } = render(<SessionHeartbeat intervalMs={1000} />);
    unmount();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(update).not.toHaveBeenCalled();
  });
});

describe("LiveDataRefresh", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("refreshes the router only while visible and stops after unmount", async () => {
    vi.useFakeTimers();
    setVisibility("visible");
    const refresh = vi.fn();
    mockRouter(refresh);

    const { unmount } = render(<LiveDataRefresh intervalMs={1000} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(refresh).toHaveBeenCalledTimes(1);

    unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("does not refresh while hidden", async () => {
    vi.useFakeTimers();
    setVisibility("hidden");
    const refresh = vi.fn();
    mockRouter(refresh);

    render(<LiveDataRefresh intervalMs={1000} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(refresh).not.toHaveBeenCalled();
  });
});
