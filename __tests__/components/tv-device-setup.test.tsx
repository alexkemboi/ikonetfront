import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import TvDeviceSetup from "@/app/(hotspot)/hotspot/_components/TvDeviceSetup";
import { apiFetch } from "@/lib/apiClient";
import { prepareTvDeviceAction, type TvDeviceVerification } from "@/actions/tv";

vi.mock("@/lib/apiClient", () => ({ apiFetch: vi.fn() }));
const mockedApiFetch = vi.mocked(apiFetch);
const verified = (recommendedPackages: TvDeviceVerification["recommendedPackages"]) => ({
  status: 200, success: true, message: "Verified", timestamp: "2026-09-29T07:00:00Z",
  data: { eligible: true, existingCustomer: null, nearestStationId: 1, recommendedPackages, softWarnings: [], portalToken: "signed-portal-token", portalTokenExpiresAt: "2026-09-29T07:30:00Z", companyCode: "CMP-BDK-001", stationId: "1", normalizedPhone: "254712345678", normalizedMac: "AA:BB:CC:DD:EE:FF" },
});
const packageOptions: TvDeviceVerification["recommendedPackages"] = [{ packageId: 12, name: "TV Monthly", validityLabel: "30 days", speedLabel: "10/5 Mbps", price: "800.00", currency: "KES", availableForDevice: true, unavailableReason: null, notes: "Unlimited" }];

beforeEach(() => { vi.clearAllMocks(); });

describe("TV captive-portal flow", () => {
  it("verifies anonymously and uses the recommended package list", async () => {
    const user = userEvent.setup();
    mockedApiFetch.mockResolvedValueOnce(verified([]) as never);
    render(<TvDeviceSetup brand="BeeSmart Wi-Fi" initialDevice={{ macAddress: "", customerPhone: "" }} packages={[]} routerIdentity="RTR-1" />);
    await user.type(screen.getByLabelText("Customer phone number"), "0712345678");
    await user.type(screen.getByLabelText("TV MAC address"), "aa-bb-cc-dd-ee-ff");
    await user.click(screen.getByRole("button", { name: "Review TV details" }));
    expect(await screen.findByText("AA:BB:CC:DD:EE:FF")).toBeInTheDocument();
    expect(mockedApiFetch).toHaveBeenCalledWith("/tv/devices/verify", expect.objectContaining({ auth: "public", body: expect.objectContaining({ routerIdentity: "RTR-1" }) }));
    await user.click(screen.getByRole("button", { name: "Confirm this TV" }));
    expect(await screen.findByRole("status")).toHaveTextContent("No TV packages are available");
  });

  it("uses portal token for payment and polls until provisioned", async () => {
    const user = userEvent.setup();
    mockedApiFetch.mockImplementation(async (path, options) => {
      if (path === "/tv/devices/verify") return verified(packageOptions) as never;
      if (path === "/tv/payments/initiate") {
        expect(options?.auth).toBe("public");
        expect(options?.headers).toMatchObject({ "X-TV-Portal-Token": "signed-portal-token" });
        expect(options?.headers?.["Idempotency-Key"]).toBeTruthy();
        expect(options?.body).toMatchObject({ customerPhone: "254712345678", phone: "254712345678", packageId: 12, submittedAmount: "800.00" });
        return { status: 201, success: true, message: "Accepted", data: { transactionReference: "TV-REF-1", mpesaStkPushTriggered: true, checkoutRequestId: "checkout-1", statusUrl: "/api/v1/tv/payments/TV-REF-1/status", replayed: false, validationOutcome: { valid: true, serverAmount: "800.00", currency: "KES", message: null } } } as never;
      }
      if (path.includes("/tv/payments/TV-REF-1/status")) return { status: 200, success: true, message: "OK", data: { transactionReference: "TV-REF-1", state: "SETTLED", provisioningState: "PROVISIONED", pendingReason: null, settledAt: "2026-09-29T07:01:00Z", failedReason: null, provisionedAt: "2026-09-29T07:01:02Z", provisioningAttempts: 1, provisioningFailureCode: null, supportReference: "TV-REF-1", mpesaReceipt: "QWE123", amount: "800.00", currency: "KES", tvEntitlementExpiresAt: "2026-10-29T07:01:02Z" } } as never;
      throw new Error(`Unexpected API path: ${path}`);
    });
    render(<TvDeviceSetup brand="BeeSmart Wi-Fi" initialDevice={{ macAddress: "AA:BB:CC:DD:EE:FF", customerPhone: "0712345678" }} packages={[]} />);
    await user.click(screen.getByRole("button", { name: "Review TV details" }));
    await user.click(await screen.findByRole("button", { name: "Confirm this TV" }));
    await user.click(screen.getByRole("radio", { name: /TV Monthly/ }));
    await user.click(screen.getByRole("button", { name: "Review purchase" }));
    expect(await screen.findByText("Review your TV purchase")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Payer M-Pesa phone"), "0712 345 678");
    await user.click(screen.getByRole("button", { name: "Pay KES 800.00" }));
    expect(await screen.findByText(/PROVISIONED/)).toBeInTheDocument();
    expect(await screen.findByText(/Receipt: QWE123/)).toBeInTheDocument();
  });

  it("rejects invalid MAC before making any backend call", async () => {
    const result = await prepareTvDeviceAction({ macAddress: "00:00:00:00:00:00", customerPhone: "0712345678" });
    expect(result.success).toBe(false);
    expect(mockedApiFetch).not.toHaveBeenCalled();
  });
});
