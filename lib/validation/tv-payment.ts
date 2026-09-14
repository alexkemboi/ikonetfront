import * as Yup from "yup";
import { tvDeviceSchema } from "./tv-device";

export function normalizeMpesaPhone(value: string): string {
  const phone = value.trim().replace(/[\s()-]/g, "").replace(/^\+/, "");
  return /^0[17]\d{8}$/.test(phone) ? `254${phone.slice(1)}` : phone;
}

export const mpesaPhoneSchema = Yup.string()
  .transform((value: string) => normalizeMpesaPhone(value))
  .required("Enter your M-Pesa phone number.")
  .matches(/^254[17]\d{8}$/, "Enter a valid Kenyan mobile number, for example 0712 345 678.");

export const tvPaymentSchema = tvDeviceSchema.shape({
  packageId: Yup.string().trim().required("Choose a TV package."),
  phone: mpesaPhoneSchema,
});
export type TvPaymentRequest = Yup.InferType<typeof tvPaymentSchema>;
