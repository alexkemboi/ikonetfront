import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PppoeLoginField } from "@/app/(dashboard)/customers/[id]/_components/PppoeLoginField";

const revealPppoePassword = vi.fn();

const requestStepUp = vi.fn();

vi.mock("@/actions/customer", () => ({
  revealPppoePassword: (...a: unknown[]) => revealPppoePassword(...a),
}));
vi.mock("@/providers/StepUpProvider", () => ({
  useStepUp: () => ({ requestStepUp: (...a: unknown[]) => requestStepUp(...a) }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  requestStepUp.mockResolvedValue("step-up-token");
});

describe("PppoeLoginField", () => {
  it("keeps the password masked and unrequested until staff unmask it", () => {
    render(<PppoeLoginField customerId={7} username="anwar-pppoe" />);

    expect(screen.getByText("anwar-pppoe")).toBeInTheDocument();
    expect(screen.getByLabelText("PPPoE password, hidden")).toHaveTextContent("••••");
    expect(revealPppoePassword).not.toHaveBeenCalled();
  });

  it("shows the password on unmask and drops it again on mask", async () => {
    revealPppoePassword.mockResolvedValue({ success: true, data: { username: "anwar-pppoe", password: "s3cret" } });
    render(<PppoeLoginField customerId={7} username="anwar-pppoe" />);

    await userEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(requestStepUp).toHaveBeenCalled();
    expect(revealPppoePassword).toHaveBeenCalledWith(7, "step-up-token");
    expect(await screen.findByText("s3cret")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(screen.queryByText("s3cret")).not.toBeInTheDocument();
    expect(screen.getByLabelText("PPPoE password, hidden")).toBeInTheDocument();
  });

  it("asks for nothing from the backend when the password prompt is cancelled", async () => {
    requestStepUp.mockResolvedValue(null);
    render(<PppoeLoginField customerId={7} username="anwar-pppoe" />);

    await userEvent.click(screen.getByRole("button", { name: "Show password" }));

    expect(revealPppoePassword).not.toHaveBeenCalled();
    expect(screen.getByLabelText("PPPoE password, hidden")).toBeInTheDocument();
  });

  it("stays masked when the backend refuses", async () => {
    revealPppoePassword.mockResolvedValue({ success: false, status: 403, message: "Access denied", data: null });
    render(<PppoeLoginField customerId={7} username="anwar-pppoe" />);

    await userEvent.click(screen.getByRole("button", { name: "Show password" }));

    expect(screen.getByLabelText("PPPoE password, hidden")).toBeInTheDocument();
  });
});
