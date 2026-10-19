import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginForm from "@/app/(auth)/login/_components/LoginForm";

const signInAction = vi.fn();
const signInCodeAction = vi.fn();
const signIn = vi.fn();

vi.mock("next-auth/react", () => ({ signIn: (...a: unknown[]) => signIn(...a) }));
vi.mock("@/actions/auth", () => ({
  signInAction: (...a: unknown[]) => signInAction(...a),
  signInCodeAction: (...a: unknown[]) => signInCodeAction(...a),
}));

async function fill(username: string, password: string) {
  await userEvent.type(screen.getByLabelText(/^username/i), username);
  await userEvent.type(screen.getByLabelText("Password"), password);
}

const submit = () => userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));

beforeEach(() => {
  vi.clearAllMocks();
  signIn.mockResolvedValue(undefined);
});

describe("LoginForm (one sign-in for every account)", () => {
  it("asks only for a username and password", () => {
    render(<LoginForm />);
    expect(screen.queryByLabelText(/organisation/i)).toBeNull();
    expect(screen.queryByRole("tab")).toBeNull();
    expect(screen.getByLabelText(/^username/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("signs a company account in with just the credentials", async () => {
    signInAction.mockResolvedValue({ success: true, data: { token: "staff-jwt", username: "jane.doe", role: "02" } });
    render(<LoginForm />);

    await fill("jane.doe", "secret-password");
    await submit();

    await waitFor(() => expect(signIn).toHaveBeenCalled());
    expect(signInAction).toHaveBeenCalledWith("jane.doe", "secret-password");
    expect(signIn).toHaveBeenCalledWith(
      "credentials",
      expect.objectContaining({ username: "jane.doe", verifiedToken: "staff-jwt", callbackUrl: "/dashboard" })
    );
  });

  it("signs a platform administrator in through the same form", async () => {
    signInAction.mockResolvedValue({ success: true, data: { token: "sys-jwt", username: "root", role: "SYSADMIN" } });
    render(<LoginForm />);

    await fill("root", "secret-password");
    await submit();

    await waitFor(() => expect(signIn).toHaveBeenCalled());
    expect(signIn).toHaveBeenCalledWith("credentials", expect.objectContaining({ username: "root", verifiedToken: "sys-jwt" }));
  });

  it("uses the stored username the server answers with when an email was typed", async () => {
    signInAction.mockResolvedValue({ success: true, data: { token: "jwt", username: "jane.doe", role: "01" } });
    render(<LoginForm />);

    await fill("jane@acme.com", "secret-password");
    await submit();

    await waitFor(() => expect(signIn).toHaveBeenCalled());
    expect(signIn).toHaveBeenCalledWith("credentials", expect.objectContaining({ username: "jane.doe" }));
  });

  it("shows the server's refusal and does not sign in", async () => {
    signInAction.mockResolvedValue({ success: false, message: "Invalid username or password" });
    render(<LoginForm />);

    await fill("jane.doe", "wrong-password");
    await submit();

    expect(await screen.findByText(/invalid username or password/i)).toBeInTheDocument();
    expect(signIn).not.toHaveBeenCalled();
  });

  it.each([
    ["a company account", "jane@acme.com", "02"],
    ["a platform administrator", "root", "SYSADMIN"],
  ])("asks for the emailed code for %s, then signs in", async (_label, typed, role) => {
    signInAction.mockResolvedValue({ success: true, data: { username: typed, role, codeRequired: true } });
    signInCodeAction.mockResolvedValue({ success: true, data: { token: "after-code", username: typed, role } });
    render(<LoginForm />);

    await fill(typed, "secret-password");
    await submit();

    await userEvent.type(await screen.findByLabelText("Sign-in code"), "123456");
    expect(signIn).not.toHaveBeenCalled();
    await submit();

    await waitFor(() => expect(signIn).toHaveBeenCalled());
    expect(signInCodeAction).toHaveBeenCalledWith(typed, "123456", role);
    expect(signIn).toHaveBeenCalledWith("credentials", expect.objectContaining({ verifiedToken: "after-code" }));
  });
});
