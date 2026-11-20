import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HotspotHelpline from "@/app/(hotspot)/hotspot/_components/HotspotHelpline";

async function openPanel() {
  await userEvent.click(screen.getByRole("button", { name: /need help\? helpline/i }));
}

describe("HotspotHelpline", () => {
  it("shows the helpline from the database", async () => {
    render(
      <HotspotHelpline
        helpline={{ label: "Acme Support", display: "0711 222 333", tel: "+254711222333", hours: "08:00 – 20:00" }}
      />
    );
    await openPanel();
    expect(screen.getByText("Acme Support")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "0711 222 333" })).toHaveAttribute("href", "tel:+254711222333");
    expect(screen.getByText(/08:00 – 20:00/)).toBeInTheDocument();
  });

  it("falls back to the built-in number when the API gave nothing", async () => {
    render(<HotspotHelpline helpline={null} />);
    await openPanel();
    expect(screen.getByRole("link", { name: "0726 837 210" })).toHaveAttribute("href", "tel:+254726837210");
    expect(screen.queryByText("0706 354 194")).toBeNull();
  });
});
