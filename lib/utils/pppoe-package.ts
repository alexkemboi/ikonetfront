/** The PPPoE package form, as typed: every field is text until it is validated. */
export type PppoePackageForm = {
  name: string;
  downloadSpeed: string;
  uploadSpeed: string;
  durationDays: string;
  price: string;
  dataCapGb: string;
  maxDevices: string;
};

const WHOLE = /^[1-9]\d*$/;
const AMOUNT = /^\d+(\.\d{1,2})?$/;

/**
 * The speed limit the router enforces, in MikroTik's order: upload first, then
 * download, in Mbps. Null until both speeds are whole numbers above zero.
 */
export function buildRateLimit(uploadMbps: string, downloadMbps: string): string | null {
  const up = uploadMbps.trim();
  const down = downloadMbps.trim();
  return WHOLE.test(up) && WHOLE.test(down) ? `${up}M/${down}M` : null;
}

export function validatePppoePackageForm(form: PppoePackageForm): Partial<Record<keyof PppoePackageForm, string>> {
  const errors: Partial<Record<keyof PppoePackageForm, string>> = {};
  if (!form.name.trim()) errors.name = "Enter a package name.";
  if (!WHOLE.test(form.downloadSpeed.trim())) errors.downloadSpeed = "Enter a whole number of Mbps.";
  if (!WHOLE.test(form.uploadSpeed.trim())) errors.uploadSpeed = "Enter a whole number of Mbps.";
  if (!WHOLE.test(form.durationDays.trim())) errors.durationDays = "Enter a whole number of days.";
  if (!AMOUNT.test(form.price.trim()) || Number(form.price) <= 0) errors.price = "Enter a price above zero.";
  if (form.dataCapGb.trim() && (!AMOUNT.test(form.dataCapGb.trim()) || Number(form.dataCapGb) <= 0)) {
    errors.dataCapGb = "Enter a cap above zero, or leave it empty.";
  }
  if (!WHOLE.test(form.maxDevices.trim())) errors.maxDevices = "Enter at least 1.";
  return errors;
}
