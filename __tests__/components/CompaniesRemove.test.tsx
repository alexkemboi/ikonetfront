import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CompaniesClient from "@/app/(dashboard)/system/companies/_components/CompaniesClient";
import * as actions from "@/actions/companies";

vi.mock("@/actions/companies", () => ({
  createCompanyAction: vi.fn(),
  removeCompanyAction: vi.fn(),
  createPaymentAccountAction: vi.fn(),
  getCompanyPaymentAccounts: vi.fn(),
  registerPaymentAccountStatementAction: vi.fn(),
  updateCompanyBranding: vi.fn(),
  testCompanyPaymentAccount: vi.fn(),
  updatePaymentAccountAction: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));

const companies = [
  { id: "1", code: "CMP-TST-002", name: "Test Two", alias: "TST" },
  { id: "2", code: "CMP-BDK-001", name: "Bedak", alias: "BDK" },
];

beforeEach(() => vi.clearAllMocks());

describe("Remove company", () => {
  it("needs the code typed, then removes the company from the list", async () => {
    const user = userEvent.setup();
    vi.mocked(actions.removeCompanyAction).mockResolvedValue({
      success: true, message: "Company retired: it has records", timestamp: "",
      data: { code: "CMP-TST-002", name: "Test Two", deleted: false, routersRetired: 1, routersKept: [] },
    } as unknown as Awaited<ReturnType<typeof actions.removeCompanyAction>>);
    render(<CompaniesClient companies={companies} readiness={[]} canMutate />);

    await user.click(screen.getAllByRole("button", { name: /Remove company/ })[0]);
    const dialog = await screen.findByRole("dialog");
    const confirm = within(dialog).getByRole("button", { name: /Remove company/ });
    expect(confirm).toBeDisabled();

    await user.type(within(dialog).getByLabelText(/to confirm/), "cmp-tst-002");
    expect(confirm).toBeEnabled();
    await user.click(confirm);

    expect(actions.removeCompanyAction).toHaveBeenCalledWith("CMP-TST-002", "cmp-tst-002");
    expect(await screen.findByText("Bedak")).toBeInTheDocument();
    expect(screen.queryByText("Test Two")).not.toBeInTheDocument();
  });

  it("is not offered to someone who cannot change companies", () => {
    render(<CompaniesClient companies={companies} readiness={[]} canMutate={false} />);
    expect(screen.queryByRole("button", { name: /Remove company/ })).not.toBeInTheDocument();
  });
});
