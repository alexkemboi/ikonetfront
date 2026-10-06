import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Step1Identity } from "@/components/provisioning/Step1Identity";

async function fillForm() {
  await userEvent.type(screen.getByLabelText(/MikroTik identity/), "Adrinold 02");
}

describe("Step1Identity", () => {
  it("blocks submission until the configuration replacement is acknowledged", async () => {
    const onContinue = vi.fn();
    render(<Step1Identity onContinue={onContinue} onCancel={vi.fn()} />);

    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: /Continue/ }));

    expect(onContinue).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("submits the identity, acknowledgement and service choices", async () => {
    const onContinue = vi.fn().mockResolvedValue(null);
    render(<Step1Identity onContinue={onContinue} onCancel={vi.fn()} />);

    await fillForm();
    await userEvent.click(screen.getByRole("checkbox", { name: /PPPoE/ }));
    await userEvent.click(screen.getByRole("checkbox", { name: /Acknowledge/ }));
    await userEvent.click(screen.getByRole("button", { name: /Continue/ }));

    expect(onContinue).toHaveBeenCalledWith({
      identity: "Adrinold 02",
      acknowledgeDestructiveReset: true,
      hotspotEnabled: true,
      pppoeEnabled: false,
    });
  });

  it("shows the backend's error when the request is rejected", async () => {
    const onContinue = vi.fn().mockResolvedValue("A device named Adrinold 02 already exists");
    render(<Step1Identity onContinue={onContinue} onCancel={vi.fn()} />);

    await fillForm();
    await userEvent.click(screen.getByRole("checkbox", { name: /Acknowledge/ }));
    await userEvent.click(screen.getByRole("button", { name: /Continue/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("A device named Adrinold 02 already exists");
  });
});
