import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginForm from "@/app/(auth)/login/_components/LoginForm";

const signIn = vi.fn();
vi.mock("next-auth/react", () => ({ signIn: (...args: unknown[]) => signIn(...args) }));

beforeEach(() => {
  vi.clearAllMocks();
  signIn.mockResolvedValue(undefined);
});

describe("LoginForm", () => {
  it("shows one username and password form without account or organisation choices", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.queryByLabelText(/organisation/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
  });

  it("submits credentials through the shared backend login provider", async () => {
    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText("Username"), "jane.doe");
    await userEvent.type(screen.getByLabelText("Password"), "secret-password");
    await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));

    await waitFor(() => expect(signIn).toHaveBeenCalledWith(
      "credentials",
      expect.objectContaining({
        username: "jane.doe",
        password: "secret-password",
        redirect: true,
        callbackUrl: "/dashboard",
      })
    ));
  });
});
