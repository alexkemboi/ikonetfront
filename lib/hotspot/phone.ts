/**
 * A Kenyan mobile number as M-Pesa takes it (254XXXXXXXXX), or null when the text is not
 * one. Spaces, dashes, dots and brackets are ignored. Accepts 0712345678, 712345678,
 * 254712345678, +254712345678 and +254 0712 345 678. The backend applies the same rule
 * (PhoneUtil.toKenyanMobile); this copy only spares the customer a round trip.
 */
export function toKenyanMobile(typed: string | null | undefined): string | null {
  if (!typed) return null;
  const match = /^(?:(?:\+?254)0?|0)?([17]\d{8})$/.exec(typed.trim().replace(/[\s\-.()]/g, ""));
  return match ? `254${match[1]}` : null;
}

/** What to tell a customer whose entry is not a mobile number. */
export const INVALID_PHONE_MESSAGE =
  "That is not a mobile number. Enter the M-Pesa number like 0712345678.";
