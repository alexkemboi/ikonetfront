"use client";

import { useFormik } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TvPackage } from "@/lib/types/tv";
import { mpesaPhoneSchema, normalizeMpesaPhone } from "@/lib/validation/tv-payment";
import { initiateTvPaymentAction } from "@/actions/tv";

interface Props {
  macAddress: string;
  pkg: TvPackage;
  phone: string;
  onPhoneChange: (phone: string) => void;
  onEditDevice: () => void;
  onEditPackage: () => void;
}

export default function TvPurchaseReview({ macAddress, pkg, phone, onPhoneChange, onEditDevice, onEditPackage }: Props) {
  const [message, setMessage] = useState("");
  const formik = useFormik({
    initialValues: { phone },
    validationSchema: Yup.object({ phone: mpesaPhoneSchema }),
    onSubmit: async (values) => {
      setMessage("");
      try {
        const result = await initiateTvPaymentAction({ macAddress, packageId: String(pkg.idxno), phone: normalizeMpesaPhone(values.phone) });
        setMessage(result.message);
      } catch {
        setMessage("We couldn’t check the payment request. Please contact support before trying again.");
      }
    },
  });
  return (
    <form onSubmit={formik.handleSubmit} noValidate className="rounded-lg border border-border bg-card p-6 space-y-6">
      <div><h3 className="text-2xl">Review your TV purchase</h3><p className="mt-2 text-sm text-muted-foreground">This purchase connects your TV. The M-Pesa prompt will go to the phone number below.</p></div>
      <div className="space-y-4 rounded-md bg-muted p-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm text-muted-foreground">TV MAC address</p><p className="tabular-nums break-all">{macAddress}</p></div><Button type="button" size="sm" variant="outline" disabled={formik.isSubmitting} onClick={onEditDevice}>Edit address</Button></div>
        <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm text-muted-foreground">Package</p><p className="font-medium">{pkg.packageName}</p></div><Button type="button" size="sm" variant="outline" disabled={formik.isSubmitting} onClick={onEditPackage}>Change package</Button></div>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt>Duration</dt><dd className="text-right">{pkg.validity}</dd>
          <dt>Download / upload</dt><dd className="text-right">{pkg.speedDownload} / {pkg.speedUpload} Mbps</dd>
          <dt>Devices</dt><dd className="text-right">{pkg.maxDevices}</dd>
          <dt>Data</dt><dd className="text-right">{pkg.dataAllowance}</dd>
          <dt className="border-t border-border pt-3 font-medium">Total</dt><dd className="border-t border-border pt-3 text-right font-medium tabular-nums">KES {pkg.price.toLocaleString("en-KE")}</dd>
        </dl>
      </div>
      <div className="space-y-2">
        <Label htmlFor="tv-payment-phone">M-Pesa phone number</Label>
        <Input id="tv-payment-phone" type="tel" name="phone" autoComplete="tel" inputMode="tel" placeholder="0712 345 678" value={formik.values.phone} disabled={formik.isSubmitting}
          onChange={(event) => { formik.handleChange(event); onPhoneChange(event.target.value); setMessage(""); }} onBlur={formik.handleBlur} required
          aria-invalid={Boolean(formik.touched.phone && formik.errors.phone)} aria-describedby={`tv-phone-help${formik.touched.phone && formik.errors.phone ? " tv-phone-error" : ""}`} />
        <p id="tv-phone-help" className="text-sm text-muted-foreground">Use 07…, 01…, or +254…. Enter your PIN only in the M-Pesa prompt.</p>
        {formik.touched.phone && formik.errors.phone && <p id="tv-phone-error" role="alert" className="text-sm text-destructive">{formik.errors.phone}</p>}
      </div>
      <p className="text-sm text-muted-foreground">TV payments are not available yet. No M-Pesa prompt will be sent.</p>
      {message && <p role="status" className="rounded-md bg-muted p-4 text-sm">{message}</p>}
      <Button type="submit" disabled={formik.isSubmitting} className="w-full">{formik.isSubmitting ? "Checking payment…" : `Pay KES ${pkg.price.toLocaleString("en-KE")}`}</Button>
    </form>
  );
}
