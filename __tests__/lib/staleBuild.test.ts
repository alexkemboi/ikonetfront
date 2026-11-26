import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UnrecognizedActionError } from "next/dist/client/components/unrecognized-action-error";
import { reloadIfStaleBuild } from "@/lib/staleBuild";

describe("reloadIfStaleBuild", () => {
  const reload = vi.fn();
  const original = window.location;

  beforeEach(() => {
    window.sessionStorage.clear();
    reload.mockClear();
    Object.defineProperty(window, "location", { configurable: true, value: { ...original, reload } });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", { configurable: true, value: original });
  });

  it("reloads when a page from the previous build calls a server action the new build lacks", () => {
    expect(reloadIfStaleBuild(new UnrecognizedActionError('Server Action "60ab" was not found on the server.'))).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("leaves any other error to the caller", () => {
    expect(reloadIfStaleBuild(new Error("network down"))).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it("does not reload again straight after a reload", () => {
    const stale = new UnrecognizedActionError("not found");
    expect(reloadIfStaleBuild(stale)).toBe(true);
    expect(reloadIfStaleBuild(stale)).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
