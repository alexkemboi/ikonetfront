import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginForm from "@/app/(auth)/login/_components/LoginForm";

const signInAction = vi.fn();
const signInCodeAction = vi.fn();
const resendSignInCodeAction = vi.fn();
const signIn = vi.fn();

vi.mock("next-auth/react", () => ({ signIn: (...a: unknown[]) => signIn(...a) }));
vi.mock("@/actions/auth", () => ({
  signInAction: (...a: unknown[]) => signInAction(...a),
  signInCodeAction: (...a: unknown[]) => signInCodeAction(...a),
  resendSignInCodeAction: (...a: unknown[]) => resendSignInCodeAction(...a),
}));

const codeStep = (extra: Record<string, unknown> = {}) => ({
  success: true,
  data: {
    username: "jane.doe",
    role: "02",
    codeRequired: true,
    challenge: "challenge-1",
    maskedEmail: "ja******@acme.com",
    codeExpiresInSeconds: 300,
    resendInSeconds: 60,
    ...extra,
  },
});

/** Types a code into the six boxes (focus moves on by itself). */
async function enterCode(code: string) {
  await userEvent.click(await screen.findByLabelText("Digit 1 of 6"));
  await userEvent.keyboard(code);
}

const verify = () => userEvent.click(screen.getByRole("button", { name: /verify code/i }));

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

    await enterCode("123456");
    expect(signIn).not.toHaveBeenCalled();
    await verify();

    await waitFor(() => expect(signIn).toHaveBeenCalled());
    expect(signInCodeAction).toHaveBeenCalledWith(typed, "123456", role, undefined);
    expect(signIn).toHaveBeenCalledWith("credentials", expect.objectContaining({ verifiedToken: "after-code" }));
  });
});

describe("OTP verification screen", () => {
  async function reachCodeScreen(extra: Record<string, unknown> = {}) {
    signInAction.mockResolvedValue(codeStep(extra));
    render(<LoginForm />);
    await fill("jane.doe", "secret-password");
    await submit();
    await screen.findByLabelText("Digit 1 of 6");
  }

  it("shows six boxes, the masked email and the countdown; no session before the code", async () => {
    await reachCodeScreen();
    for (let i = 1; i <= 6; i++) expect(screen.getByLabelText(`Digit ${i} of 6`)).toBeInTheDocument();
    expect(screen.getByText("ja******@acme.com")).toBeInTheDocument();
    expect(screen.getByText("5:00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /verify code/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /resend code in 60s/i })).toBeDisabled();
    expect(signIn).not.toHaveBeenCalled();
  });

  it("sends the challenge with the code and signs in only after the server accepts it", async () => {
    signInCodeAction.mockResolvedValue({ success: true, data: { token: "after-code", username: "jane.doe", role: "02" } });
    await reachCodeScreen();
    await enterCode("654321");
    await verify();
    await waitFor(() => expect(signIn).toHaveBeenCalled());
    expect(signInCodeAction).toHaveBeenCalledWith("jane.doe", "654321", "02", "challenge-1");
  });

  it("a wrong code shows the server's message, clears the boxes and does not sign in", async () => {
    signInCodeAction.mockResolvedValue({ success: false, message: "The sign-in code is not correct. 4 tries left." });
    await reachCodeScreen();
    await enterCode("000000");
    await verify();
    expect(await screen.findByText(/4 tries left/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Digit 1 of 6")).toHaveValue("");
    expect(signIn).not.toHaveBeenCalled();
  });

  it("too many wrong codes end the step: verify stays disabled", async () => {
    signInCodeAction.mockResolvedValue({ success: false, message: "Too many wrong codes. Sign in again." });
    await reachCodeScreen();
    await enterCode("000000");
    await verify();
    expect(await screen.findByText(/too many wrong codes/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Digit 1 of 6")).toBeDisabled();
    expect(screen.getByRole("button", { name: /verify code/i })).toBeDisabled();
  });

  it("an expired code says so and blocks verification", async () => {
    await reachCodeScreen({ codeExpiresInSeconds: 0, resendInSeconds: 0 });
    expect(await screen.findByText(/this code has expired/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Digit 1 of 6")).toBeDisabled();
    expect(screen.getByRole("button", { name: /^resend code$/i })).toBeEnabled();
  });

  it("resend asks the server with the challenge and restarts the timers", async () => {
    resendSignInCodeAction.mockResolvedValue(codeStep({ username: null, role: null }));
    await reachCodeScreen({ codeExpiresInSeconds: 0, resendInSeconds: 0 });
    await userEvent.click(screen.getByRole("button", { name: /^resend code$/i }));
    expect(resendSignInCodeAction).toHaveBeenCalledWith("challenge-1");
    expect(await screen.findByText(/a new code is on its way/i)).toBeInTheDocument();
    expect(screen.getByText("5:00")).toBeInTheDocument();
    expect(screen.getByLabelText("Digit 1 of 6")).toBeEnabled();
    expect(screen.getByRole("button", { name: /resend code in/i })).toBeDisabled();
  });

  it("pasting the code fills every box", async () => {
    await reachCodeScreen();
    await userEvent.click(screen.getByLabelText("Digit 1 of 6"));
    await userEvent.paste("12 34 56");
    expect(screen.getByLabelText("Digit 6 of 6")).toHaveValue("6");
    expect(screen.getByRole("button", { name: /verify code/i })).toBeEnabled();
  });

  it("back returns to the password step", async () => {
    await reachCodeScreen();
    await userEvent.click(screen.getByRole("button", { name: /back to sign in/i }));
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });
});
