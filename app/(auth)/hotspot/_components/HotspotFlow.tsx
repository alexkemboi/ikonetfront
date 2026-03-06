"use client";

import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Zap,
  Clock,
  Wifi,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ── Dummy package data (replace with API data later) ──────────────────
const PACKAGES = [
  {
    id: "daily-1gb",
    name: "Daily 1 GB",
    speed: "5 Mbps",
    duration: "24 hours",
    price: 50,
    popular: false,
    tag: "Basic",
  },
  {
    id: "daily-5gb",
    name: "Daily 5 GB",
    speed: "10 Mbps",
    duration: "24 hours",
    price: 100,
    popular: true,
    tag: "Popular",
  },
  {
    id: "weekly-20gb",
    name: "Weekly 20 GB",
    speed: "10 Mbps",
    duration: "7 days",
    price: 350,
    popular: false,
    tag: "Value",
  },
  {
    id: "monthly-unlimited",
    name: "Monthly Unlimited",
    speed: "20 Mbps",
    duration: "30 days",
    price: 1500,
    popular: false,
    tag: "Best",
  },
];

type Package = (typeof PACKAGES)[number];
type PaymentMethod = "mpesa" | "airtel";

type Step =
  | "packages"
  | "payment-method"
  | "phone"
  | "confirming"
  | "success";

const phoneSchema = Yup.object({
  phone: Yup.string()
    .trim()
    .matches(/^(07|01)\d{8}$/, "Enter a valid Kenyan number (07xxxxxxxx or 01xxxxxxxx)")
    .required("Phone number is required"),
});

// ── Step indicator ─────────────────────────────────────────────────────
const STEP_LABELS: Record<Step, string> = {
  packages: "Package",
  "payment-method": "Payment",
  phone: "Phone",
  confirming: "Confirm",
  success: "Done",
};

const STEP_ORDER: Step[] = [
  "packages",
  "payment-method",
  "phone",
  "confirming",
  "success",
];

function StepIndicator({ current }: { current: Step }) {
  const currentIndex = STEP_ORDER.indexOf(current);
  return (
    <div className="flex items-center justify-center gap-3 mb-2">
      {STEP_ORDER.slice(0, -1).map((step, i) => (
        <div key={step} className="flex items-center gap-3">
          <div
            className={cn(
              "w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center transition-colors",
              i < currentIndex
                ? "bg-success text-success-foreground"
                : i === currentIndex
                ? "bg-primary text-primary-foreground"
                : "bg-border text-muted-foreground"
            )}
          >
            {i < currentIndex ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              i + 1
            )}
          </div>
          {i < STEP_ORDER.length - 2 && (
            <div
              className={cn(
                "w-10 h-px transition-colors",
                i < currentIndex ? "bg-success" : "bg-border"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Package card ───────────────────────────────────────────────────────
function PackageCard({
  pkg,
  onSelect,
}: {
  pkg: Package;
  onSelect: (pkg: Package) => void;
}) {
  return (
    <div
      className={cn(
        "relative bg-card border rounded-xl p-6 cursor-pointer transition-all duration-200",
        "hover:border-primary hover:shadow-md hover:-translate-y-0.5",
        pkg.popular ? "border-primary ring-1 ring-primary/20" : "border-border"
      )}
      onClick={() => onSelect(pkg)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect(pkg)}
      aria-label={`Select ${pkg.name} package`}
    >
      {pkg.popular && (
        <Badge className="absolute -top-2.5 left-4 bg-primary text-primary-foreground text-[10px] px-2 py-0.5">
          {pkg.tag}
        </Badge>
      )}
      {!pkg.popular && (
        <Badge
          variant="outline"
          className="absolute -top-2.5 left-4 text-[10px] px-2 py-0.5 bg-card"
        >
          {pkg.tag}
        </Badge>
      )}

      <div className="flex items-start flex-col justify-between mb-3">
        <h3 className="font-semibold text-foreground text-sm">{pkg.name}</h3>
        <span className="text-lg font-bold text-foreground balance-display">
          KES {pkg.price.toLocaleString()}
        </span>
      </div>

      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Zap className="w-3 h-3" />
          {pkg.speed}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {pkg.duration}
        </span>
      </div>

      <Button size="sm" className="w-full mt-4 h-9 text-xs">
        Buy Now
      </Button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────
export default function HotspotFlow() {
  const [step, setStep] = useState<Step>("packages");
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);

  const phoneFormik = useFormik({
    initialValues: { phone: "" },
    validationSchema: phoneSchema,
    onSubmit: async (_values) => {
      // Logic to be implemented by developer
      await new Promise((r) => setTimeout(r, 400));
      setStep("confirming");
    },
  });

  function handleSelectPackage(pkg: Package) {
    setSelectedPackage(pkg);
    setStep("payment-method");
  }

  function handleSelectPayment(method: PaymentMethod) {
    setPaymentMethod(method);
    setStep("phone");
  }

  function handleConfirmPayment() {
    setStep("success");
  }

  function handleBack() {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1]);
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      {/* Step indicator header */}
      <div className="px-8 pt-8 pb-2">
        <StepIndicator current={step} />
      </div>

      <Separator />

      <div className="p-8">
        {/* ── Step 1: Package Selection ── */}
        {step === "packages" && (
          <div className="space-y-6">
            <h2 className="text-base font-semibold text-foreground">
              Choose a Package
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {PACKAGES.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} onSelect={handleSelectPackage} />
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Payment Method ── */}
        {step === "payment-method" && selectedPackage && (
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Go back"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-base font-semibold text-foreground">
                Select Payment Method
              </h2>
            </div>

            {/* Selected package summary */}
            <div className="bg-muted rounded-xl px-5 py-4 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{selectedPackage.name}</span>
              <span className="font-semibold text-foreground balance-display">
                KES {selectedPackage.price.toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-5">
              {/* M-Pesa */}
              <button
                type="button"
                onClick={() => handleSelectPayment("mpesa")}
                className="border border-border rounded-xl px-5 py-8 flex flex-col items-center gap-4 hover:border-primary hover:bg-primary/5 transition-all duration-200 group"
              >
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-success" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">M-Pesa</p>
                  <p className="text-xs text-muted-foreground mt-1">Safaricom</p>
                </div>
              </button>

              {/* Airtel Money */}
              <button
                type="button"
                onClick={() => handleSelectPayment("airtel")}
                className="border border-border rounded-xl px-5 py-8 flex flex-col items-center gap-4 hover:border-primary hover:bg-primary/5 transition-all duration-200 group"
              >
                <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-danger" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">Airtel Money</p>
                  <p className="text-xs text-muted-foreground mt-1">Airtel Kenya</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Phone Number ── */}
        {step === "phone" && selectedPackage && (
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Go back"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-base font-semibold text-foreground">
                Enter Your Phone Number
              </h2>
            </div>

            <div className="bg-muted rounded-xl px-5 py-4 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {selectedPackage.name} via{" "}
                <span className="capitalize">{paymentMethod}</span>
              </span>
              <span className="font-semibold text-foreground balance-display">
                KES {selectedPackage.price.toLocaleString()}
              </span>
            </div>

            <form onSubmit={phoneFormik.handleSubmit} noValidate className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="phone">
                  {paymentMethod === "mpesa" ? "M-Pesa" : "Airtel Money"} Phone
                  Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="07XX XXX XXX"
                  {...phoneFormik.getFieldProps("phone")}
                  aria-invalid={
                    phoneFormik.touched.phone && !!phoneFormik.errors.phone
                  }
                  className={
                    phoneFormik.touched.phone && phoneFormik.errors.phone
                      ? "border-destructive focus-visible:ring-destructive/30"
                      : ""
                  }
                />
                {phoneFormik.touched.phone && phoneFormik.errors.phone && (
                  <p className="text-xs text-destructive">
                    {phoneFormik.errors.phone}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  An STK push will be sent to this number to complete payment.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-10"
                disabled={phoneFormik.isSubmitting}
              >
                {phoneFormik.isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Send Payment Request"
                )}
              </Button>
            </form>
          </div>
        )}

        {/* ── Step 4: Confirming ── */}
        {step === "confirming" && (
          <div className="space-y-8">
            <h2 className="text-base font-semibold text-foreground">
              Confirm Payment
            </h2>

            <div className="flex flex-col items-center gap-5 py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center">
                <Smartphone className="w-8 h-8 text-warning animate-pulse" />
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-foreground">
                  STK Push Sent
                </p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Check your phone for a{" "}
                  <span className="capitalize">{paymentMethod}</span> payment
                  prompt and enter your PIN to complete the purchase.
                </p>
              </div>
            </div>

            <div className="bg-muted rounded-xl px-5 py-4 space-y-3 text-sm">
              <div className="flex justify-between py-0.5">
                <span className="text-muted-foreground">Package</span>
                <span className="font-medium text-foreground">
                  {selectedPackage?.name}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between py-0.5">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold text-foreground balance-display">
                  KES {selectedPackage?.price.toLocaleString()}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between py-0.5">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-medium text-foreground">
                  {phoneFormik.values.phone}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between py-0.5">
                <span className="text-muted-foreground">Method</span>
                <span className="font-medium capitalize text-foreground">
                  {paymentMethod}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Button className="w-full h-10" onClick={handleConfirmPayment}>
                I&apos;ve Completed Payment
              </Button>

              <Button
                variant="outline"
                className="w-full h-10"
                onClick={handleBack}
              >
                Resend STK Push
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 5: Success ── */}
        {step === "success" && (
          <div className="flex flex-col items-center gap-6 py-10 text-center">
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
              <Wifi className="w-10 h-10 text-success" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">
                You&apos;re Connected!
              </h2>
              <p className="text-sm text-muted-foreground">
                Your session is now active. Enjoy the internet.
              </p>
            </div>

            <div className="bg-success/5 border border-success/20 rounded-xl px-6 py-5 w-full space-y-0 text-sm">
              <div className="flex justify-between py-3">
                <span className="text-muted-foreground">Package</span>
                <span className="font-medium text-foreground">
                  {selectedPackage?.name}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between py-3">
                <span className="text-muted-foreground">Speed</span>
                <span className="font-medium text-foreground">
                  {selectedPackage?.speed}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between py-3">
                <span className="text-muted-foreground">Valid for</span>
                <span className="font-medium text-foreground">
                  {selectedPackage?.duration}
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              You will be redirected automatically. If not,{" "}
              <button
                type="button"
                className="underline underline-offset-2 hover:text-foreground transition-colors"
                onClick={() => {
                  setStep("packages");
                  setSelectedPackage(null);
                  setPaymentMethod(null);
                  phoneFormik.resetForm();
                }}
              >
                start over
              </button>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
