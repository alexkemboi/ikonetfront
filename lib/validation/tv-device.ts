import * as Yup from "yup";

export interface TvDeviceDetails {
  macAddress: string;
  customerPhone?: string;
  routerIdentity?: string;
}

export function normalizeTvMacAddress(value: string): string {
  const compact = value.trim().replace(/[:\s-]/g, "").toUpperCase();
  // Leave invalid input visible so the customer can correct it.
  return /^[0-9A-F]{12}$/.test(compact)
    ? compact.match(/.{2}/g)!.join(":")
    : value.trim().toUpperCase();
}

export const tvDeviceSchema = Yup.object({
  customerPhone: Yup.string().required("Enter your phone number."),
  routerIdentity: Yup.string().optional(),
  macAddress: Yup.string()
    .transform((value: string) => normalizeTvMacAddress(value))
    .required("Enter your TV’s MAC address.")
    .matches(/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/, "Enter 12 letters (A–F) and numbers, for example AA:BB:CC:DD:EE:FF.")
    .test("device-address", "Enter a device MAC address, not a multicast or empty address.", (value) => {
      if (!value || !/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(value)) return true;
      return value !== "00:00:00:00:00:00" && (parseInt(value.slice(0, 2), 16) & 1) === 0;
    }),
});
