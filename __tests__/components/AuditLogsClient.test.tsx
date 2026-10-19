import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuditLogsClient from "@/app/(dashboard)/system/audit/_components/AuditLogsClient";
import { getAuditLogPage, type AuditLogPage } from "@/actions/audit";

vi.mock("@/actions/audit", () => ({ getAuditLogPage: vi.fn() }));

const page: AuditLogPage = {
  content: [{ idxno: 1, username: "mogada", module: "Network", subModule: "Uplink Checked",
    actionDescription: "Uplink check of ADRINOLD-WESTLANDS: UP", action: "POST",
    accessTime: "2026-10-18T09:00:00", accessTo: "/api/v1/network/uplink/router/90/check" }],
  totalElements: 2962, page: 0, size: 50, modules: ["Network", "Payments"], actions: ["GET", "POST"],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getAuditLogPage).mockResolvedValue({ data: { ...page, totalElements: 19 }, error: null });
});

describe("AuditLogsClient", () => {
  it("shows the first page from the server without asking again", () => {
    render(<AuditLogsClient initial={page} platform />);
    expect(screen.getByText("2,962 total events")).toBeTruthy();
    expect(screen.getByText("mogada")).toBeTruthy();
    expect(getAuditLogPage).not.toHaveBeenCalled();
  });

  it("filters on the server and starts again from the first page", async () => {
    render(<AuditLogsClient initial={page} platform />);
    await userEvent.click(screen.getByRole("button", { name: "POST" }));
    await waitFor(() => expect(getAuditLogPage).toHaveBeenCalledWith(
      expect.objectContaining({ platform: true, page: 0, action: "POST" })));
    await waitFor(() => expect(screen.getByText("19 matching events")).toBeTruthy());
  });

  it("searches on the server", async () => {
    render(<AuditLogsClient initial={page} platform={false} />);
    await userEvent.type(screen.getByPlaceholderText("Search user, module, description, endpoint…"), "uplink");
    await waitFor(() => expect(getAuditLogPage).toHaveBeenLastCalledWith(
      expect.objectContaining({ platform: false, search: "uplink", page: 0 })));
  });
});
