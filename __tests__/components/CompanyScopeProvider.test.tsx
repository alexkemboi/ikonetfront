import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { store } from "@/store";
import { CompanyScopeProvider, useCompanyScope } from "@/providers/CompanyScopeProvider";
import { CompanyRequired, CompanyScopeBanner } from "@/components/tenant/CompanyRequired";
import { COMPANY_CONTEXT_COOKIE, readContextCookie } from "@/lib/companyContextClient";

const refresh = vi.fn();

const router = { refresh, push: vi.fn() };

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

const companies = [
  { id: "1", code: "CMP-ADR-001", name: "Adrinold", alias: "adr" },
  { id: "2", code: "CMP-BDK-001", name: "Bedak", alias: "bdk" },
];

function CreateButton({ onCreate }: { onCreate: () => void }) {
  const { requireCompany } = useCompanyScope();
  return <button onClick={() => requireCompany(onCreate)}>Add</button>;
}

function renderScope(
  props: { isPlatformAdmin: boolean; companyCode: string | null },
  onCreate = vi.fn()
) {
  render(
    <Provider store={store}>
      <CompanyScopeProvider {...props} companies={props.isPlatformAdmin ? companies : []}>
        <CompanyScopeBanner />
        <CreateButton onCreate={onCreate} />
        <CompanyRequired>
          <p>the form</p>
        </CompanyRequired>
      </CompanyScopeProvider>
    </Provider>
  );
  return onCreate;
}

beforeEach(() => {
  vi.clearAllMocks();
  document.cookie = `${COMPANY_CONTEXT_COOKIE}=; path=/; max-age=0`;
});

describe("CompanyScopeProvider", () => {
  it("SYSADMIN viewing all companies must choose a company before creating", async () => {
    const onCreate = renderScope({ isPlatformAdmin: true, companyCode: null });

    expect(screen.getByRole("status")).toHaveTextContent(/viewing all companies/i);
    expect(screen.queryByText("the form")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(onCreate).not.toHaveBeenCalled();

    const dialog = await screen.findByRole("dialog");
    await userEvent.click(
      Array.from(dialog.querySelectorAll("button")).find((b) => b.textContent?.includes("Bedak"))!
    );

    expect(readContextCookie()).toBe("CMP-BDK-001");
    expect(refresh).toHaveBeenCalled();
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it("SYSADMIN with a company selected creates directly", async () => {
    const onCreate = renderScope({ isPlatformAdmin: true, companyCode: "CMP-ADR-001" });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText("the form")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it("clears a selection that is no longer an active company", () => {
    document.cookie = `${COMPANY_CONTEXT_COOKIE}=CMP-GONE-001; path=/`;
    renderScope({ isPlatformAdmin: true, companyCode: "CMP-GONE-001" });

    expect(readContextCookie()).toBeNull();
    expect(refresh).toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent(/viewing all companies/i);
  });

  it("company staff are never asked and cannot carry a selection", async () => {
    document.cookie = `${COMPANY_CONTEXT_COOKIE}=CMP-BDK-001; path=/`;
    const onCreate = renderScope({ isPlatformAdmin: false, companyCode: "CMP-ADR-001" });

    expect(readContextCookie()).toBeNull();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText("the form")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });
});
