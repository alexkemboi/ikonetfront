"use client";

import { useFormik } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import type { TvPackage } from "@/lib/types/tv";
import { ArrowDown, ArrowUp, Dot } from "lucide-react";

interface Props {
  macAddress: string;
  packages: TvPackage[];
  error?: string;
  selectedPackageId: string;
  onSelect: (id: string) => void;
  onEditDevice: () => void;
}

export default function TvPackageSelection({ macAddress, packages, error, selectedPackageId, onSelect, onEditDevice }: Props) {
  const formik = useFormik({
    initialValues: { packageId: selectedPackageId },
    enableReinitialize: true,
    validationSchema: Yup.object({
      packageId: Yup.string().required("Choose a TV package.").oneOf(packages.map((pkg) => String(pkg.idxno)), "Choose an available TV package."),
    }),
    onSubmit: (values) => onSelect(values.packageId),
  });

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-card p-4 flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-sm text-muted-foreground">Internet for your TV</p><p className="font-medium tabular-nums break-all">{macAddress}</p></div>
        <Button type="button" variant="outline" size="sm" onClick={onEditDevice}>Edit address</Button>
      </div>
      <h3 className="text-2xl">Choose a TV package</h3>
      <p className="text-sm text-muted-foreground">Choose internet access for this TV. Streaming app and channel subscriptions are purchased separately.</p>
      {error ? (
        <p role="alert" className="rounded-lg border border-border bg-card p-6">We couldn&apos;t load TV packages. Please reload the page to try again.</p>
      ) : packages.length === 0 ? (
        <p role="status" className="rounded-lg border border-border bg-card p-6">No TV packages are available right now. Please check again later or contact support.</p>
      ) : (
        <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">
          <fieldset className="space-y-3" aria-describedby={formik.touched.packageId && formik.errors.packageId ? "tv-package-error" : undefined}>
            <legend className="sr-only">Available TV packages</legend>
            {packages.map((pkg) => (
              <label key={pkg.idxno} className={`block rounded-lg border p-4 ${pkg.availableForDevice === false ? "cursor-not-allowed opacity-55" : "cursor-pointer"} ${formik.values.packageId === String(pkg.idxno) ? "border-warning bg-warning/10" : "border-border bg-card"}`}>
                <span className="flex items-start gap-3">
                  <input type="radio" name="packageId" value={String(pkg.idxno)} checked={formik.values.packageId === String(pkg.idxno)} onChange={formik.handleChange} onBlur={formik.handleBlur} disabled={pkg.availableForDevice === false} className="mt-1 size-4 accent-warning ring-gray-200" />
                  <span className="flex-1 min-w-0">
                    <span className="flex flex-wrap justify-between gap-2"><span className="font-medium">{pkg.packageName}</span><span className="font-medium tabular-nums">KES {pkg.price}</span></span>
                    <span className="block mt-2 text-sm text-muted-foreground">{pkg.validity} <ArrowDown className="inline-block ml-1 text-green-600 w-4 h-4" /> {pkg.speedDownload} Mbps download</span>
                    <span className="block mt-2 text-sm text-muted-foreground">{pkg.validity} <ArrowUp className="inline-block ml-1 text-blue-700 w-4 h-4" /> {pkg.speedUpload} Mbps upload</span>
                    <span className="block mt-1 text-sm text-muted-foreground">{pkg.dataAllowance} <Dot className="inline-block ml-1 text-muted-foreground w-4 h-4" /> {pkg.maxDevices} {pkg.maxDevices === 1 ? "device" : "devices"}</span>
                    {pkg.availableForDevice === false && <span className="mt-1 block text-xs text-destructive">{pkg.unavailableReason ?? "Not available for this device"}</span>}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
          {formik.touched.packageId && formik.errors.packageId && <p id="tv-package-error" role="alert" className="text-sm text-destructive">{formik.errors.packageId}</p>}
          <Button type="submit" className="w-full">Review purchase</Button>
        </form>
      )}
    </div>
  );
}
