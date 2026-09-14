import { describe, expect, it } from "vitest";
import { tvPaymentSchema } from "@/lib/validation/tv-payment";
import { initiateTvPaymentAction } from "@/actions/tv";

const request = { macAddress: "AA:BB:CC:DD:EE:FF", packageId: "12" };
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
  it("never reports a payment sent while the API is unimplemented", async () => {
    expect(await initiateTvPaymentAction({ ...request, phone: "0712345678" })).toEqual({
      success: false, message: expect.stringContaining("No payment request was sent"),
    });
    expect(await initiateTvPaymentAction({ ...request, phone: "bad" })).toEqual({
      success: false, message: expect.stringContaining("Check"),
    });
  });
});
