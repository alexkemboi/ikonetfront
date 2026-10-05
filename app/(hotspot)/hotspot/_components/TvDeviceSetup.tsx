"use client";

import { useRef, useState } from "react";
import { useFormik } from "formik";
import { Tv, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { prepareTvDeviceAction } from "@/actions/tv";
import { getPortalRouter } from "@/lib/hotspot/portalRouter";
import { normalizeTvMacAddress, tvDeviceSchema, type TvDeviceDetails } from "@/lib/validation/tv-device";

import TvPurchaseReview from "./TvPurchaseReview";
import TvPackageSelection from "./TvPackageSelection";
import type { TvPackage } from "@/lib/types/tv";
import type { TvPortalSession } from "@/lib/types/tv";

interface Props {
  brand: string;
  initialDevice: TvDeviceDetails;
  packages: TvPackage[];
  packagesError?: string;
  routerIdentity?: string;
}

export default function TvDeviceSetup({ brand, initialDevice, packages: initialPackages, packagesError: initialPackagesError, routerIdentity }: Props) {
  const [device, setDevice] = useState<TvDeviceDetails | null>(null);
  const [portal, setPortal] = useState<TvPortalSession | null>(null);
  const [packages, setPackages] = useState<TvPackage[]>(initialPackages);
  const [packagesError, setPackagesError] = useState(initialPackagesError ?? "");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [reviewPurchase, setReviewPurchase] = useState(false);
  const [paymentPhone, setPaymentPhone] = useState("");
  const selectedPackage = !packagesError ? packages.find((pkg) => String(pkg.idxno) === selectedPackageId) : undefined;
  const isPaymentStep = confirmed && reviewPurchase && Boolean(selectedPackage);
  const [error, setError] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const formik = useFormik({
    initialValues: initialDevice,
    validationSchema: tvDeviceSchema,
    onSubmit: async (values) => {
      setError("");
      try {
        const result = await prepareTvDeviceAction({ ...values, routerIdentity }, getPortalRouter());
        if (!result.success) { setError(result.error); return; }
        setDevice(result.device);
        setPortal(result.portal);
        setPackages(result.recommendedPackages);
        setWarnings(result.warnings);
        setPackagesError("");
        setSelectedPackageId("");
        setConfirmed(false);
        requestAnimationFrame(() => headingRef.current?.focus());
      } catch {
        setError("We couldn’t save this step. Your address is still here. Please try again.");
      }
    },
  });

  function editDevice() {
    setReviewPurchase(false);
    setDevice(null);
    setPortal(null);
    setPackages(initialPackages);
    setPackagesError(initialPackagesError ?? "");
    setConfirmed(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <section aria-label="Set up a TV or streaming device" className="space-y-6">
      <ol aria-label="TV setup progress" className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
        <li aria-current={!confirmed ? "step" : undefined} className={!confirmed ? "font-medium text-primary" : ""}>1. TV/Device details</li>
        <li aria-current={confirmed && !isPaymentStep ? "step" : undefined} className={confirmed && !isPaymentStep ? "font-medium text-primary" : ""}>2. Package</li>
        <li aria-current={isPaymentStep ? "step" : undefined} className={isPaymentStep ? "font-medium text-primary" : ""}>3. Payment</li>
      </ol>

      {device && portal && isPaymentStep && selectedPackage ? (
        <TvPurchaseReview portal={portal} onPortalRefreshed={setPortal} customerPhone={device.customerPhone ?? ""} macAddress={device.macAddress} pkg={selectedPackage} phone={paymentPhone} onPhoneChange={setPaymentPhone} onEditDevice={editDevice} onEditPackage={() => setReviewPurchase(false)} />
      ) : device && confirmed ? (
        <><TvPackageSelection macAddress={device.macAddress} packages={packages} error={packagesError} selectedPackageId={selectedPackageId} onSelect={(id) => { setSelectedPackageId(id); setReviewPurchase(true); }} onEditDevice={editDevice} />{warnings.length > 0 && <p className="text-sm text-amber-800">{warnings.join(" · ")}</p>}</>
      ) : device ? (
        <div className="rounded-lg border border-border bg-card p-6 space-y-5">
          <h3 ref={headingRef} tabIndex={-1} className="text-2xl outline-none">Is this the correct TV?</h3>
          <p className="text-muted-foreground">Compare this address with the MAC address in your TV’s network settings.</p>
          <dl className="space-y-1">
            <dt className="text-sm text-muted-foreground">TV MAC address</dt>
            <dd className="text-xl font-medium tabular-nums break-all">{device.macAddress}</dd>
          </dl>
          <p className="text-sm text-muted-foreground">This identifies the TV you want to connect. Internet access has not been activated.</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" variant="outline" onClick={editDevice}><ArrowLeft className="size-4" />Edit address</Button>
            {!confirmed && <Button type="button" onClick={() => setConfirmed(true)}>Confirm this TV</Button>}
          </div>
        </div>
      ) : (
        <form onSubmit={formik.handleSubmit} noValidate className="rounded-lg border border-border bg-card p-6 space-y-6">
          <div className="space-y-2">
            <Tv className="size-6 text-primary" aria-hidden="true" />
            <h3 className="text-2xl">Which TV/Device are you connecting?</h3>
                <p className="text-muted-foreground">You&apos;ll pay on your phone. The internet package will activate on your TV.</p>
          </div>
          <div className="rounded-md bg-muted p-4 space-y-2 text-sm">
            <p className="font-medium">Before you begin</p>
            <p>Connect your TV to {brand}, then keep this portal open on your phone to set it up.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tv-customer-phone">Customer phone number</Label>
            <Input
              id="tv-customer-phone"
              name="customerPhone"
              type="tel"
              value={formik.values.customerPhone}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="0712 345 678"
              autoComplete="tel"
              required
            />
            {formik.touched.customerPhone && formik.errors.customerPhone && <p role="alert" className="text-sm text-destructive">{formik.errors.customerPhone}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="tv-mac-address">TV MAC address</Label>
            <Input
              ref={inputRef}
              id="tv-mac-address"
              name="macAddress"
              value={formik.values.macAddress}
              onChange={formik.handleChange}
              onBlur={(event) => {
                void formik.setFieldValue("macAddress", normalizeTvMacAddress(event.target.value));
                formik.handleBlur(event);
              }}
              placeholder="AA:BB:CC:DD:EE:FF"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              required
              aria-invalid={Boolean(formik.touched.macAddress && formik.errors.macAddress)}
              aria-describedby={`tv-mac-help${formik.touched.macAddress && formik.errors.macAddress ? " tv-mac-error" : ""}`}
            />
            <p id="tv-mac-help" className="text-sm text-muted-foreground">Use the Wi-Fi MAC address for wireless access, or the Ethernet MAC address if connected by cable.</p>
            {formik.touched.macAddress && formik.errors.macAddress && <p id="tv-mac-error" role="alert" className="text-sm text-destructive">{formik.errors.macAddress}</p>}
          </div>
          <details className="rounded-md border border-border p-4 text-sm">
            <summary className="cursor-pointer font-medium text-primary focus-visible:outline-ring">Where do I find this?</summary>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-muted-foreground">
              <li>On your TV, open Settings, then Network or About. Names vary by device.</li>
              <li>Open Status or Network information and find the MAC address.</li>
              <li>Copy all 12 letters and numbers. You can paste it with or without spaces, colons, or hyphens.</li>
            </ol>
          </details>
          {/* TODO: Nearby-device server action/API integration. Do not show mock devices. */}
              <p className="text-sm text-muted-foreground">Nearby-device selection is not available yet. Enter the address from your TV&apos;s settings.</p>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={formik.isSubmitting} className="w-full">{formik.isSubmitting ? "Checking address…" : "Review TV details"}</Button>
        </form>
      )}
    </section>
  );
}
