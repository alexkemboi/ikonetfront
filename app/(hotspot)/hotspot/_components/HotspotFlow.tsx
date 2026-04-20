"use client";

import { useEffect, useState } from "react";
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
  XCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import {
  setHotspotPackages,
  setSelectedPackage,
  setPaymentStatus,
  setPaymentMessage,
  setHasActiveSession,
  setSessionMessage,
  resetHotspotState,
} from "@/store/slices/hotspotSlice";
import { HotspotPackage } from "@/lib/types/hotspot";
import { initiateHotspotPayment } from "@/actions/hotspot";

type PaymentMethod = "mpesa" | "airtel";
type Tab = "plans" | "reconnect";
type Step =
  | "packages"
  | "payment-method"
  | "phone"
  | "confirming"
  | "success";

const phoneSchema = Yup.object({
  phone: Yup.string()
    .trim()
    .matches(
      /^(07|01)\d{8}$/,
      "Enter a valid Kenyan number (07xxxxxxxx or 01xxxxxxxx)"
    )
    .required("Phone number is required"),
});

const STEP_ORDER: Step[] = [
  "packages",
  "payment-method",
  "phone",
  "confirming",
  "success",
];

// ── Helpers ────────────────────────────────────────────────────────────

function getTagline(pkg: HotspotPackage): string {
  const type = pkg.validityType?.toLowerCase();
  const val = pkg.validityValue;

  if (type === "minutes") return "Quick hit — no commitment";
  if (type === "hours") {
    if (val === 1) return "Perfect for a one-hour catch-up";
    if (val <= 3) return "Power through your session";
    if (val <= 6) return "Half-day of solid browsing";
    if (val <= 12) return "Your productive half-day";
  }
  if (type === "days") {
    if (val === 1) return "Full day, always connected";
    if (val >= 7) return "Stay connected all week";
  }
  return "Reliable internet access";
}

function getTier(price: number): string {
  if (price < 20) return "Budget";
  if (price < 100) return "Standard";
  return "Premium";
}

// Each entry: [cardBg, borderColor, pillBg, pillText, taglineColor, badgeBg, badgeText, btnBg, btnHover]
const CARD_PALETTES = [
  // Slate Navy
  {
    cardBg: "#EEF2F8", border: "#2B4C7E40", pillBg: "#2B4C7E14",
    pillText: "#2B4C7E", tagline: "#2B4C7EA0", badgeBg: "#2B4C7E18",
    badgeText: "#2B4C7E", btnBg: "#2B4C7E", btnHover: "#1E3A6A",
  },
  // Sage Forest
  {
    cardBg: "#EEF5F1", border: "#3D6B5C40", pillBg: "#3D6B5C14",
    pillText: "#3D6B5C", tagline: "#3D6B5CA0", badgeBg: "#3D6B5C18",
    badgeText: "#3D6B5C", btnBg: "#3D6B5C", btnHover: "#2F5448",
  },
  // Terracotta
  {
    cardBg: "#F7EFED", border: "#9C4A2E40", pillBg: "#9C4A2E14",
    pillText: "#9C4A2E", tagline: "#9C4A2EA0", badgeBg: "#9C4A2E18",
    badgeText: "#9C4A2E", btnBg: "#9C4A2E", btnHover: "#7E3A23",
  },
  // Mauve Plum
  {
    cardBg: "#F3EEF7", border: "#6A4C7E40", pillBg: "#6A4C7E14",
    pillText: "#6A4C7E", tagline: "#6A4C7EA0", badgeBg: "#6A4C7E18",
    badgeText: "#6A4C7E", btnBg: "#6A4C7E", btnHover: "#563D68",
  },
  // Warm Amber
  {
    cardBg: "#F7F2E8", border: "#8A680E40", pillBg: "#8A680E14",
    pillText: "#8A680E", tagline: "#8A680EA0", badgeBg: "#8A680E18",
    badgeText: "#8A680E", btnBg: "#8A680E", btnHover: "#70530B",
  },
  // Teal Slate
  {
    cardBg: "#EBF4F5", border: "#2A6E7E40", pillBg: "#2A6E7E14",
    pillText: "#2A6E7E", tagline: "#2A6E7EA0", badgeBg: "#2A6E7E18",
    badgeText: "#2A6E7E", btnBg: "#2A6E7E", btnHover: "#1F5762",
  },
] as const;

// ── Step indicator ─────────────────────────────────────────────────────

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
  colorIndex,
}: {
  pkg: HotspotPackage;
  onSelect: (pkg: HotspotPackage) => void;
  colorIndex: number;
}) {
  const tagline = getTagline(pkg);
  const tier = getTier(pkg.price);
  const palette = CARD_PALETTES[colorIndex % CARD_PALETTES.length];
  const speedLabel =
    pkg.speedDownload >= 1000 ? "Unlimited" : `${pkg.speedDownload} Mbps`;

  return (
    <div
      style={{ backgroundColor: palette.cardBg, borderColor: palette.border }}
      className="border rounded-xl p-5 cursor-pointer h-full flex flex-col transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
      onClick={() => onSelect(pkg)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect(pkg)}
      aria-label={`Select ${pkg.packageName} package`}
    >
      {/* Name + tier badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-foreground text-sm leading-snug">
          {pkg.packageName}
        </h3>
        <span
          style={{ backgroundColor: palette.badgeBg, color: palette.badgeText }}
          className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full"
        >
          {tier}
        </span>
      </div>

      {/* Tagline */}
      <p
        style={{ color: palette.tagline }}
        className="text-xs italic leading-snug mb-3"
      >
        {tagline}
      </p>

      <Separator className="mb-3" />

      {/* Speed + validity pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          style={{ backgroundColor: palette.pillBg, color: palette.pillText }}
          className="inline-flex items-center gap-1 text-xs font-medium rounded-full px-2.5 py-1"
        >
          <Zap className="w-3 h-3" />
          {speedLabel}
        </span>
        <span
          style={{ backgroundColor: palette.pillBg, color: palette.pillText }}
          className="inline-flex items-center gap-1 text-xs font-medium rounded-full px-2.5 py-1"
        >
          <Clock className="w-3 h-3" />
          {pkg.validityValue} {pkg.validityType}
        </span>
      </div>

      {/* Price + CTA pushed to bottom */}
      <div className="mt-auto pt-4 flex flex-col gap-2">
        <span className="text-2xl font-bold text-foreground tabular-nums">
          KES {pkg.price.toLocaleString()}
        </span>
        <button
          type="button"
          style={{ backgroundColor: palette.btnBg }}
          className="w-full h-9 text-xs text-white font-semibold rounded-lg transition-opacity hover:opacity-85 active:opacity-70"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
}

// ── Tab bar ────────────────────────────────────────────────────────────

function TabBar({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
}) {
  const tabs: { id: Tab; label: string }[] = [
    { id: "plans", label: "Plans" },
    { id: "reconnect", label: "Reconnect" },
  ];

  return (
    <div className="flex border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex-1 py-3 text-sm font-medium transition-colors relative",
            active === tab.id
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label}
          {active === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
          )}
        </button>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────

interface HotspotFlowProps {
  initialPackages: HotspotPackage[];
  initialHasActiveSession: boolean;
  initialSessionMessage: string | null;
  macAddress: string;
  ipAddress: string;
}

export default function HotspotFlow({
  initialPackages,
  initialHasActiveSession,
  initialSessionMessage,
  macAddress,
  ipAddress,
}: HotspotFlowProps) {
  const dispatch = useDispatch();
  const {
    packages,
    selectedPackage,
    paymentStatus,
    paymentMessage,
    hasActiveSession,
    sessionMessage,
  } = useSelector((state: RootState) => state.hotspot);

  const [activeTab, setActiveTab] = useState<Tab>("plans");
  const [step, setStep] = useState<Step>("packages");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);

  useEffect(() => {
    dispatch(setHotspotPackages(initialPackages));
    dispatch(setHasActiveSession(initialHasActiveSession));
    dispatch(setSessionMessage(initialSessionMessage));
  }, [dispatch, initialPackages, initialHasActiveSession, initialSessionMessage]);

  const phoneFormik = useFormik({
    initialValues: { phone: "" },
    validationSchema: phoneSchema,
    onSubmit: async (values) => {
      if (!selectedPackage || !paymentMethod) return;

      dispatch(setPaymentStatus("loading"));
      dispatch(setPaymentMessage(null));
      setStep("confirming");

      try {
        const response = await initiateHotspotPayment({
          packageId: selectedPackage.idxno,
          phone: values.phone,
          paymentMode: paymentMethod,
          macAddress,
          clientMac: macAddress,
          clientIp: ipAddress,
        });

        if (response.success) {
          dispatch(setPaymentStatus("succeeded"));
          dispatch(setPaymentMessage(response.message));
        } else {
          dispatch(setPaymentStatus("failed"));
          dispatch(setPaymentMessage(response.message));
          setStep("phone");
        }
      } catch (error: unknown) {
        dispatch(setPaymentStatus("failed"));
        dispatch(
          setPaymentMessage(
            (error instanceof Error ? error.message : String(error)) ||
              "Payment initiation failed."
          )
        );
        setStep("phone");
      }
    },
  });

  function handleSelectPackage(pkg: HotspotPackage) {
    dispatch(setSelectedPackage(pkg));
    setStep("payment-method");
  }

  function handleSelectPayment(method: PaymentMethod) {
    setPaymentMethod(method);
    setStep("phone");
  }

  function handleConfirmPayment() {
    dispatch(setPaymentStatus("succeeded"));
    dispatch(setPaymentMessage("Payment confirmed. You are now connected!"));
    setStep("success");
  }

  function handleBack() {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) {
      const prev = STEP_ORDER[idx - 1];
      setStep(prev);
      if (prev === "packages") dispatch(setSelectedPackage(null));
    }
  }

  function handleStartOver() {
    dispatch(resetHotspotState());
    setPaymentMethod(null);
    phoneFormik.resetForm();
    setStep("packages");
    setActiveTab("plans");
  }

  const isMidFlow = step !== "packages";

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm h-full flex flex-col">
      {/* Tab bar — hidden while user is mid-payment-flow */}
      {!isMidFlow && (
        <TabBar active={activeTab} onChange={setActiveTab} />
      )}

      {/* Step indicator — shown only during payment flow */}
      {isMidFlow && (
        <div className="px-6 pt-6 pb-2">
          <StepIndicator current={step} />
        </div>
      )}

      {isMidFlow && <Separator />}

      <div className="p-6 sm:p-8 flex-1">
        {/* ── Reconnect tab ── */}
        {activeTab === "reconnect" && !isMidFlow && (
          <div className="flex flex-col items-center gap-6 py-8 text-center">
            <div
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center",
                hasActiveSession ? "bg-success/10" : "bg-muted"
              )}
            >
              <Wifi
                className={cn(
                  "w-10 h-10",
                  hasActiveSession ? "text-success" : "text-muted-foreground"
                )}
              />
            </div>

            {hasActiveSession ? (
              <>
                <div className="space-y-2">
                  <h2 className="text-lg font-bold text-foreground">
                    You&apos;re Already Connected!
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    {sessionMessage || "You have an active internet session."}
                  </p>
                </div>
                <Button onClick={handleStartOver}>Purchase New Package</Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <h2 className="text-lg font-bold text-foreground">
                    No Active Session
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    {sessionMessage ||
                      "We could not find an active session for your device."}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Check Again
                </Button>
              </>
            )}
          </div>
        )}

        {/* ── Plans tab: package grid ── */}
        {activeTab === "plans" && step === "packages" && (
          <div className="space-y-5">
            <h2 className="text-sm font-semibold text-foreground">
              Choose Your Package
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 items-stretch">
              {packages.length > 0 ? (
                packages.map((pkg, i) => (
                  <PackageCard
                    key={pkg.idxno}
                    pkg={pkg}
                    onSelect={handleSelectPackage}
                    colorIndex={i}
                  />
                ))
              ) : (
                <p className="text-muted-foreground col-span-full text-center py-8 text-sm">
                  No packages available at the moment.
                </p>
              )}
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

            <div className="bg-muted rounded-xl px-5 py-4 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {selectedPackage.packageName}
              </span>
              <span className="font-semibold text-foreground tabular-nums">
                KES {selectedPackage.price.toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleSelectPayment("mpesa")}
                className="border border-border rounded-xl px-5 py-8 flex flex-col items-center gap-4 hover:border-primary hover:bg-primary/5 transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-success" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">
                    M-Pesa
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Safaricom
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPayment("airtel")}
                className="border border-border rounded-xl px-5 py-8 flex flex-col items-center gap-4 hover:border-primary hover:bg-primary/5 transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-danger" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">
                    Airtel Money
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Airtel Kenya
                  </p>
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
                {selectedPackage.packageName} via{" "}
                <span className="capitalize">{paymentMethod}</span>
              </span>
              <span className="font-semibold text-foreground tabular-nums">
                KES {selectedPackage.price.toLocaleString()}
              </span>
            </div>

            <form
              onSubmit={phoneFormik.handleSubmit}
              noValidate
              className="space-y-6"
            >
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

              {paymentStatus === "failed" && paymentMessage && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>{paymentMessage}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-10"
                disabled={
                  phoneFormik.isSubmitting || paymentStatus === "loading"
                }
              >
                {phoneFormik.isSubmitting || paymentStatus === "loading" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Send Payment Request"
                )}
              </Button>
            </form>
          </div>
        )}

        {/* ── Step 4: Confirming ── */}
        {step === "confirming" && selectedPackage && (
          <div className="space-y-8">
            <h2 className="text-base font-semibold text-foreground">
              Confirm Payment
            </h2>

            <div className="flex flex-col items-center gap-5 py-6 text-center">
              <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center">
                <Smartphone className="w-8 h-8 text-warning animate-pulse" />
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-foreground">STK Push Sent</p>
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
                  {selectedPackage.packageName}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between py-0.5">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold text-foreground tabular-nums">
                  KES {selectedPackage.price.toLocaleString()}
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
                onClick={() => phoneFormik.submitForm()}
                disabled={
                  phoneFormik.isSubmitting || paymentStatus === "loading"
                }
              >
                {phoneFormik.isSubmitting || paymentStatus === "loading" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Resend STK Push"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 5: Success ── */}
        {step === "success" && selectedPackage && (
          <div className="flex flex-col items-center gap-6 py-8 text-center">
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

            <div className="bg-success/5 border border-success/20 rounded-xl px-6 py-5 w-full text-sm">
              <div className="flex justify-between py-3">
                <span className="text-muted-foreground">Package</span>
                <span className="font-medium text-foreground">
                  {selectedPackage.packageName}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between py-3">
                <span className="text-muted-foreground">Speed</span>
                <span className="font-medium text-foreground">
                  {selectedPackage.speedDownload} Mbps /{" "}
                  {selectedPackage.speedUpload} Mbps
                </span>
              </div>
              <Separator />
              <div className="flex justify-between py-3">
                <span className="text-muted-foreground">Valid for</span>
                <span className="font-medium text-foreground">
                  {selectedPackage.validityValue} {selectedPackage.validityType}
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              You will be redirected automatically. If not,{" "}
              <button
                type="button"
                className="underline underline-offset-2 hover:text-foreground transition-colors"
                onClick={handleStartOver}
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
