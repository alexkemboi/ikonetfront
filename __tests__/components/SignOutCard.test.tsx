import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignOutCard from "@/app/signout/_components/SignOutCard";

const mockLogoutAction = vi.fn();

vi.mock("@/actions/auth", () => ({
  logoutAction: (...args: unknown[]) => mockLogoutAction(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

it("renders heading and prompt text", async () => {
  const { useSession } = await import("next-auth/react");
  vi.mocked(useSession).mockReturnValue({
    data: { user: { apiToken: "mock-valid-bearer-token" } },
    status: "authenticated",
    update: vi.fn(),
  });

  render(<SignOutCard />);

  expect(
    screen.getByRole("heading", { name: /sign out/i })
  ).toBeInTheDocument();
  expect(
    screen.getByText(/are you sure you want to sign out/i)
  ).toBeInTheDocument();
});

it("calls logoutAction and signOut on Yes, sign out click", async () => {
  const { useSession, signOut } = await import("next-auth/react");
  vi.mocked(useSession).mockReturnValue({
    data: { user: { apiToken: "mock-valid-bearer-token" } },
    status: "authenticated",
    update: vi.fn(),
  });
  vi.mocked(signOut).mockResolvedValue({ url: "/login" });

  const user = userEvent.setup();
  render(<SignOutCard />);

  const signOutButton = screen.getByRole("button", { name: /yes, sign out/i });
  await user.click(signOutButton);

  await waitFor(() => {
    expect(mockLogoutAction).toHaveBeenCalledWith("mock-valid-bearer-token");
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: "/login" });
  });
});