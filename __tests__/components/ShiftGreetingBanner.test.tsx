import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { ShiftGreetingBanner } from "@/components/dashboard/ShiftGreetingBanner";

describe("ShiftGreetingBanner", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses the viewer's local time for the greeting", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 30, 14, 0));

    render(
      <ShiftGreetingBanner
        tenantName="Beesmart"
        onlineCount={12}
        shiftName="AFTERNOON"
        expiriesCount={3}
        smsCreditLow={false}
        lastHourTrafficGb={1.2}
      />
    );

    expect(screen.getByRole("heading", { name: /good afternoon, beesmart\./i })).toBeInTheDocument();
  });

  it("updates the greeting when the local time crosses a period boundary", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 30, 11, 59, 30));

    render(
      <ShiftGreetingBanner
        tenantName="Beesmart"
        onlineCount={12}
        shiftName="MORNING"
        expiriesCount={3}
        smsCreditLow={false}
        lastHourTrafficGb={1.2}
      />
    );

    expect(screen.getByRole("heading", { name: /good morning, beesmart\./i })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(60_000));
    expect(screen.getByRole("heading", { name: /good afternoon, beesmart\./i })).toBeInTheDocument();
  });
});