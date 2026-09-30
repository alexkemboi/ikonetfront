import { describe, expect, it } from "vitest";
import { tvPaymentSchema } from "@/lib/validation/tv-payment";
import { initiateTvPaymentAction } from "@/actions/tv";

const request = {
  macAddress: "AA:BB:CC:DD:EE:FF",
  packageId: "12",
  submittedAmount: "500.00",
  customerPhone: "254712345678",
};
describe("TV payment validation", () => {
  it.each(["0712 345 678", "+254712345678", "254712345678"])("normalizes %s", async (phone) => {
    expect((await tvPaymentSchema.validate({ ...request, phone })).phone).toBe("254712345678");
  });
  it("supports 01 numbers and rejects invalid input", async () => {
    expect((await tvPaymentSchema.validate({ ...request, phone: "0112345678" })).phone).toBe("254112345678");
    for (const phone of ["", "07123", "254212345678", "07123456789"]) {
      expect(await tvPaymentSchema.isValid({ ...request, phone })).toBe(false);
    }
  });
  it("does not initiate a payment without a verified portal session", async () => {
    expect(await initiateTvPaymentAction({ ...request, phone: "0712345678" })).toMatchObject({
      success: false, message: expect.stringContaining("setup session expired"),
    });
    expect(await initiateTvPaymentAction({ ...request, phone: "bad" })).toEqual({
      success: false, message: expect.stringContaining("Check"),
    });
  });
});
