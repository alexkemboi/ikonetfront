import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChangePasswordDialog from "@/components/chrome/ChangePasswordDialog";

const changeOwnPasswordAction = vi.fn();
vi.mock("@/actions/system", () => ({
  changeOwnPasswordAction: (...a: unknown[]) => changeOwnPasswordAction(...a),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

beforeEach(() => {
  vi.clearAllMocks();
  changeOwnPasswordAction.mockResolvedValue({ success: true, message: "Password changed", data: null });
});

describe("ChangePasswordDialog", () => {
  it("sends the current and the new password once both new entries agree", async () => {
    const onOpenChange = vi.fn();
    render(<ChangePasswordDialog open onOpenChange={onOpenChange} />);

    await userEvent.type(screen.getByLabelText("Current password"), "OldPassword123x");
    await userEvent.type(screen.getByLabelText("New password"), "NewPassword123x");
    await userEvent.type(screen.getByLabelText("New password again"), "NewPassword123x");
    await userEvent.click(screen.getByRole("button", { name: /change password/i }));

    await waitFor(() => expect(changeOwnPasswordAction).toHaveBeenCalledWith("OldPassword123x", "NewPassword123x"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("does not send a short or mismatched new password", async () => {
    render(<ChangePasswordDialog open onOpenChange={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("Current password"), "OldPassword123x");
    await userEvent.type(screen.getByLabelText("New password"), "short");
    expect(screen.getByRole("alert")).toHaveTextContent(/12 characters/);
    expect(screen.getByRole("button", { name: /change password/i })).toBeDisabled();
    expect(changeOwnPasswordAction).not.toHaveBeenCalled();
  });
});
