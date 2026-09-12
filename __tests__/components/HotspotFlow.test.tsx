import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import HotspotFlow from "@/app/(hotspot)/hotspot/_components/HotspotFlow";

describe("HotspotFlow", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/hotspot");
  });

  it("defaults to Buy Packages when no tab is explicitly requested", () => {
    render(<HotspotFlow packages={[]} />);

    const buyButton = screen.getByRole("button", { name: /^buy packages$/i });
    expect(buyButton).toHaveClass("text-primary");
    expect(screen.queryByRole("textbox", { name: /enter voucher code/i })).not.toBeInTheDocument();
  });

  it("respects an explicit activate tab from the URL", () => {
    window.history.pushState({}, "", "/hotspot?tab=activate");

    render(<HotspotFlow packages={[]} />);

    const activateButtons = screen.getAllByRole("button", { name: /^activate voucher$/i });
    expect(activateButtons[0]).toHaveClass("text-primary");
    expect(screen.getByRole("textbox", { name: /enter voucher code/i })).toBeInTheDocument();
  });
});
