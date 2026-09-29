import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { RouterTrafficCard } from "@/components/dashboard/RouterTrafficCard";
import type { RouterTrafficItem } from "@/lib/types/dashboard";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("RouterTrafficCard", () => {
  it("keeps list keys unique when backend router IDs are missing or duplicated", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const items = [
      { routerName: "Router A", activeSessions: 2, dataTransferredGb: 1, trafficSharePercent: 60 },
      { routerName: "Router A", activeSessions: 1, dataTransferredGb: 0.5, trafficSharePercent: 40 },
    ] as RouterTrafficItem[];

    render(<RouterTrafficCard items={items} />);

    expect(consoleError.mock.calls.flat().join(" ")).not.toContain("unique \"key\" prop");
  });
});