import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginForm from "@/app/(auth)/login/_components/LoginForm";

const determineAccountTypeAction = vi.fn();
const sysAdminLoginAction = vi.fn();
const resolveOrganisationAction = vi.fn();

const signIn = vi.fn();
vi.mock("next-auth/react", () => ({ signIn: (...a: unknown[]) => signIn(...a) }));
vi.mock("@/actions/auth", () => ({
  determineAccountTypeAction: (...a: unknown[]) => determineAccountTypeAction(...a),
  sysAdminLoginAction: (...a: unknown[]) => sysAdminLoginAction(...a),
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
});

describe("LoginForm", () => {
  it("signs a company account in under the organisation it named", async () => {
    resolveOrganisationAction.mockResolvedValue(bedak);
    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText("Organisation"), "bedak");
    await fill("jane.doe", "secret-password");
    await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));

    await waitFor(() => expect(signIn).toHaveBeenCalled());
    expect(signIn).toHaveBeenCalledWith(
      "credentials",
      expect.objectContaining({ username: "jane.doe", organisation: "CMP-BDK-001" })
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
});
