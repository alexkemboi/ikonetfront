import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginForm from "@/app/(auth)/login/_components/LoginForm";

const determineAccountTypeAction = vi.fn();
const sysAdminLoginAction = vi.fn();
const staffLoginAction = vi.fn();
const staffSignInCodeAction = vi.fn();
const sysAdminSignInCodeAction = vi.fn();
const resolveOrganisationAction = vi.fn();

const signIn = vi.fn();
vi.mock("next-auth/react", () => ({ signIn: (...a: unknown[]) => signIn(...a) }));
vi.mock("@/actions/auth", () => ({
  determineAccountTypeAction: (...a: unknown[]) => determineAccountTypeAction(...a),
  sysAdminLoginAction: (...a: unknown[]) => sysAdminLoginAction(...a),
  staffLoginAction: (...a: unknown[]) => staffLoginAction(...a),
  staffSignInCodeAction: (...a: unknown[]) => staffSignInCodeAction(...a),
  sysAdminSignInCodeAction: (...a: unknown[]) => sysAdminSignInCodeAction(...a),
}));
vi.mock("@/actions/branding", () => ({
  resolveOrganisationAction: (...a: unknown[]) => resolveOrganisationAction(...a),
}));

const bedak = { code: "CMP-BDK-001", name: "Bedak", logoUrl: null };

async function fill(username: string, password: string) {
  await userEvent.type(screen.getByLabelText(/^username/i), username);
  await userEvent.type(screen.getByLabelText("Password"), password);
}

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  determineAccountTypeAction.mockResolvedValue({ success: true, data: { accountType: "CUSTOMER" } });
  signIn.mockResolvedValue(undefined);
  staffLoginAction.mockResolvedValue({ success: true, data: { token: "staff-jwt", username: "jane.doe", role: "02" } });
});

describe("LoginForm", () => {
  it("signs a company account in under the organisation it named", async () => {
    resolveOrganisationAction.mockResolvedValue(bedak);
    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText("Organisation"), "bedak");
    await fill("jane.doe", "secret-password");
    await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));

    await waitFor(() => expect(signIn).toHaveBeenCalled());
    expect(staffLoginAction).toHaveBeenCalledWith("jane.doe", "secret-password", "CMP-BDK-001");
    expect(signIn).toHaveBeenCalledWith(
      "credentials",
      expect.objectContaining({ username: "jane.doe", verifiedToken: "staff-jwt", organisation: "CMP-BDK-001" })
    );
    expect(window.localStorage.getItem("ibs_login_organisation")).toBe("bedak");
  });

  it("sends no credentials when the organisation is unknown", async () => {
    resolveOrganisationAction.mockResolvedValue(null);
    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText("Organisation"), "nobody");
    await fill("jane.doe", "secret-password");
    await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));

    expect(await screen.findByText(/could not find that organisation/i)).toBeInTheDocument();
    expect(determineAccountTypeAction).not.toHaveBeenCalled();
    expect(signIn).not.toHaveBeenCalled();
  });

  it("platform tab needs no organisation and refuses a company account", async () => {
    render(<LoginForm />);

    await userEvent.click(screen.getByRole("tab", { name: /platform admin/i }));
    expect(screen.getByLabelText("Organisation")).toBeDisabled();
    await fill("jane.doe", "secret-password");
    await userEvent.click(screen.getByRole("button", { name: /sign in as administrator/i }));

    expect(await screen.findByText(/belongs to a company/i)).toBeInTheDocument();
    expect(signIn).not.toHaveBeenCalled();
  });

  it("platform tab signs a system administrator in", async () => {
    determineAccountTypeAction.mockResolvedValue({ success: true, data: { accountType: "SYSADMIN" } });
    sysAdminLoginAction.mockResolvedValue({ success: true, data: { token: "jwt" } });
    render(<LoginForm />);

    await userEvent.click(screen.getByRole("tab", { name: /platform admin/i }));
    await fill("root", "secret-password");
    await userEvent.click(screen.getByRole("button", { name: /sign in as administrator/i }));

    await waitFor(() => expect(signIn).toHaveBeenCalled());
    expect(signIn).toHaveBeenCalledWith("credentials", expect.objectContaining({ sysadminToken: "jwt" }));
    expect(resolveOrganisationAction).not.toHaveBeenCalled();
  });

  it("asks for the emailed code when the server wants one, then signs in", async () => {
    resolveOrganisationAction.mockResolvedValue(bedak);
    staffLoginAction.mockResolvedValue({ success: true, data: { username: "jane.doe", role: "02", codeRequired: true } });
    staffSignInCodeAction.mockResolvedValue({ success: true, data: { token: "after-code", username: "jane.doe", role: "02" } });
    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText("Organisation"), "bedak");
    await fill("jane.doe", "secret-password");
    await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));

    await userEvent.type(await screen.findByLabelText("Sign-in code"), "123456");
    expect(signIn).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));

    await waitFor(() => expect(signIn).toHaveBeenCalled());
    expect(staffSignInCodeAction).toHaveBeenCalledWith("jane.doe", "123456");
    expect(signIn).toHaveBeenCalledWith("credentials", expect.objectContaining({ verifiedToken: "after-code" }));
  });

  it("lets an investor with no company in without an organisation", async () => {
    determineAccountTypeAction.mockResolvedValue({ success: true, data: { accountType: "INVESTOR" } });
    render(<LoginForm />);

    await fill("partner", "secret-password");
    await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));

    await waitFor(() => expect(signIn).toHaveBeenCalled());
    expect(staffLoginAction).toHaveBeenCalledWith("partner", "secret-password", undefined);
  });

  it("still asks staff for their organisation", async () => {
    render(<LoginForm />);

    await fill("jane.doe", "secret-password");
    await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));

    expect(await screen.findByText(/enter your organisation/i)).toBeInTheDocument();
    expect(staffLoginAction).not.toHaveBeenCalled();
  });
});
