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
  Flame,
  Coffee,
  Sun,
  Compass,
  Crown,
  type LucideIcon,
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

// ── Card themes — split hero/body design ──────────────────────────────

type CardTheme = {
  badge:         string;
  tagline:       string;
  bestFor:       string;
  Icon:          LucideIcon;
  // Hero gradient section (top ~45%)
  heroGradient:  string;
  heroText:      string;
  heroSubtext:   string;
  heroBadgeBg:   string;
  heroBadgeText: string;
  heroIconBg:    string;
  heroIconColor: string;
  heroOrb1:      string;
  heroOrb2:      string;
  // Body section (bottom ~55%)
  bodyBg:        string;
  bodyBorder:    string;
  cardShadow:    string;
  pillBg:        string;
  pillText:      string;
  pillBorder:    string;
  bestForColor:  string;
  priceColor:    string;
  mutedColor:    string;
  btnBg:         string;
  btnText:       string;
};

function getCardTheme(pkg: HotspotPackage): CardTheme {
  const type = pkg.validityType?.toLowerCase() ?? "";
  const val  = pkg.validityValue;

  // FLASH (minutes) — electric lime: urgent, instant energy
  if (type === "minutes") return {
    badge: "FLASH", tagline: "Need it now — zero overthinking", bestFor: "Quick search · email check · map lookup",
    Icon: Zap,
    heroGradient: "linear-gradient(135deg, #3D6B00 0%, #7DC200 100%)",
    heroText: "#FFFFFF", heroSubtext: "rgba(255,255,255,0.82)",
    heroBadgeBg: "rgba(0,0,0,0.28)", heroBadgeText: "#D8FF70",
    heroIconBg: "rgba(255,255,255,0.22)", heroIconColor: "#FFFFFF",
    heroOrb1: "rgba(255,255,255,0.12)", heroOrb2: "rgba(0,0,0,0.18)",
    bodyBg: "#FFFFFF", bodyBorder: "#AEDF50",
    cardShadow: "0 4px 28px rgba(61,107,0,0.25)",
    pillBg: "#F0FFD0", pillText: "#2D5200", pillBorder: "#AEDF50",
    bestForColor: "#2D5200", priceColor: "#1A3000", mutedColor: "#4A7200",
    btnBg: "linear-gradient(135deg, #3D6B00, #6AAA00)", btnText: "#FFFFFF",
  };

  // QUICK (1–3 h) — combustion red-orange: heat, momentum, now
  if (type === "hours" && val <= 3) return {
    badge: "QUICK", tagline: "Power through your moment", bestFor: "Café work · one meeting · catching up",
    Icon: Flame,
    heroGradient: "linear-gradient(135deg, #B82000 0%, #FF4E00 100%)",
    heroText: "#FFFFFF", heroSubtext: "rgba(255,255,255,0.82)",
    heroBadgeBg: "rgba(0,0,0,0.28)", heroBadgeText: "#FFB090",
    heroIconBg: "rgba(255,255,255,0.22)", heroIconColor: "#FFFFFF",
    heroOrb1: "rgba(255,255,255,0.1)", heroOrb2: "rgba(0,0,0,0.18)",
    bodyBg: "#FFFFFF", bodyBorder: "#FF9060",
    cardShadow: "0 4px 28px rgba(184,32,0,0.25)",
    pillBg: "#FFF0E8", pillText: "#8A1800", pillBorder: "#FFAA70",
    bestForColor: "#8A1800", priceColor: "#4A0E00", mutedColor: "#A84020",
    btnBg: "linear-gradient(135deg, #B82000, #EE3C00)", btnText: "#FFFFFF",
  };

  // SESSION (4–12 h) — deep ocean blue: calm, focused, sustained
  if (type === "hours" && val <= 12) return {
    badge: "SESSION", tagline: "Built for deep, uninterrupted work", bestFor: "Study session · long commute · half-day work",
    Icon: Coffee,
    heroGradient: "linear-gradient(135deg, #082AA8 0%, #1868E0 100%)",
    heroText: "#FFFFFF", heroSubtext: "rgba(255,255,255,0.82)",
    heroBadgeBg: "rgba(0,0,0,0.28)", heroBadgeText: "#90C8FF",
    heroIconBg: "rgba(255,255,255,0.22)", heroIconColor: "#FFFFFF",
    heroOrb1: "rgba(255,255,255,0.1)", heroOrb2: "rgba(0,0,0,0.18)",
    bodyBg: "#FFFFFF", bodyBorder: "#80B4FF",
    cardShadow: "0 4px 28px rgba(8,42,168,0.25)",
    pillBg: "#EBF3FF", pillText: "#082AA8", pillBorder: "#90C0FF",
    bestForColor: "#082AA8", priceColor: "#040E50", mutedColor: "#2A52A8",
    btnBg: "linear-gradient(135deg, #082AA8, #1460CC)", btnText: "#FFFFFF",
  };

  // DAILY (1 day) — amber-gold sunrise: warm, full, abundant
  if (type === "days" && val === 1) return {
    badge: "DAILY", tagline: "From sunrise to midnight — all yours", bestFor: "Full workday · travel day · event coverage",
    Icon: Sun,
    heroGradient: "linear-gradient(135deg, #A85800 0%, #F09800 100%)",
    heroText: "#FFFFFF", heroSubtext: "rgba(255,255,255,0.85)",
    heroBadgeBg: "rgba(0,0,0,0.25)", heroBadgeText: "#FFE0A0",
    heroIconBg: "rgba(255,255,255,0.22)", heroIconColor: "#FFFFFF",
    heroOrb1: "rgba(255,255,255,0.1)", heroOrb2: "rgba(0,0,0,0.18)",
    bodyBg: "#FFFFFF", bodyBorder: "#FFD060",
    cardShadow: "0 4px 28px rgba(168,88,0,0.25)",
    pillBg: "#FFF8E8", pillText: "#7A4800", pillBorder: "#FFD060",
    bestForColor: "#7A4800", priceColor: "#3C2000", mutedColor: "#966200",
    btnBg: "linear-gradient(135deg, #A85800, #E08800)", btnText: "#FFFFFF",
  };

  // EXPLORER (2–6 days) — forest green: movement, nature, adventure
  if (type === "days" && val < 7) return {
    badge: "EXPLORER", tagline: "Keep moving. Stay connected.", bestFor: "Weekend trip · short stay · multi-day project",
    Icon: Compass,
    heroGradient: "linear-gradient(135deg, #004220 0%, #008844 100%)",
    heroText: "#FFFFFF", heroSubtext: "rgba(255,255,255,0.82)",
    heroBadgeBg: "rgba(0,0,0,0.28)", heroBadgeText: "#80FFBA",
    heroIconBg: "rgba(255,255,255,0.22)", heroIconColor: "#FFFFFF",
    heroOrb1: "rgba(255,255,255,0.1)", heroOrb2: "rgba(0,0,0,0.18)",
    bodyBg: "#FFFFFF", bodyBorder: "#60CC90",
    cardShadow: "0 4px 28px rgba(0,66,32,0.25)",
    pillBg: "#E8FFF2", pillText: "#004220", pillBorder: "#80DDAA",
    bestForColor: "#004220", priceColor: "#001A0C", mutedColor: "#1A6A48",
    btnBg: "linear-gradient(135deg, #004220, #007A3C)", btnText: "#FFFFFF",
  };

  // PREMIUM (7+ days) — midnight navy × gold: luxury, commitment, elite
  return {
    badge: "PREMIUM", tagline: "Your permanent connection — always on", bestFor: "Weekly commuter · remote worker · digital nomad",
    Icon: Crown,
    heroGradient: "linear-gradient(135deg, #050C1C 0%, #0E1E3A 100%)",
    heroText: "#F0DCA0", heroSubtext: "rgba(195,158,72,0.9)",
    heroBadgeBg: "rgba(212,168,75,0.22)", heroBadgeText: "#D4A84B",
    heroIconBg: "rgba(212,168,75,0.18)", heroIconColor: "#D4A84B",
    heroOrb1: "rgba(212,168,75,0.1)", heroOrb2: "rgba(212,168,75,0.06)",
    bodyBg: "#FFFFFF", bodyBorder: "rgba(212,168,75,0.45)",
    cardShadow: "0 6px 36px rgba(0,0,0,0.28), 0 2px 10px rgba(212,168,75,0.15)",
    pillBg: "#FBF6ED", pillText: "#6A4410", pillBorder: "#E8C870",
    bestForColor: "#6A4410", priceColor: "#150E00", mutedColor: "#6A5020",
    btnBg: "linear-gradient(135deg, #B87C20, #7A5010)", btnText: "#FFFFFF",
  };
}

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

// ── Package card — split hero / body design ────────────────────────────

function PackageCard({
  pkg,
  onSelect,
}: {
  pkg: HotspotPackage;
  onSelect: (pkg: HotspotPackage) => void;
}) {
  const theme = getCardTheme(pkg);
  const { Icon } = theme;
  const speedLabel =
    pkg.speedDownload >= 1000 ? "Unlimited" : `${pkg.speedDownload} Mbps`;

  return (
    <div
      style={{
        border: `1px solid ${theme.bodyBorder}`,
        boxShadow: theme.cardShadow,
      }}
      className="rounded-2xl overflow-hidden cursor-pointer h-full flex flex-col transition-all duration-200 hover:shadow-2xl hover:-translate-y-1.5"
      onClick={() => onSelect(pkg)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect(pkg)}
      aria-label={`Select ${pkg.packageName} package`}
    >
      {/* ── HERO ── bold gradient, full colour identity */}
      <div
        style={{ background: theme.heroGradient }}
        className="relative px-5 pt-5 pb-6 overflow-hidden"
      >
        {/* Decorative orbs — depth without noise */}
        <div
          style={{ background: theme.heroOrb1 }}
          className="absolute -top-5 -right-5 w-32 h-32 rounded-full pointer-events-none"
        />
        <div
          style={{ background: theme.heroOrb2 }}
          className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full pointer-events-none"
        />

        {/* Badge row */}
        <div className="relative z-10 flex items-center justify-between mb-4">
          <span
            style={{ background: theme.heroBadgeBg, color: theme.heroBadgeText }}
            className="text-[10px] font-bold px-2.5 py-1 rounded-full tracking-widest uppercase"
          >
            {theme.badge}
          </span>
          {pkg.speedDownload >= 1000 && (
            <span
              style={{ background: theme.heroBadgeBg, color: theme.heroBadgeText }}
              className="text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wider"
            >
              ∞ Unlimited
            </span>
          )}
        </div>

        {/* Icon bubble */}
        <div
          style={{ background: theme.heroIconBg }}
          className="relative z-10 w-11 h-11 rounded-xl flex items-center justify-center mb-3"
        >
          <Icon className="w-5 h-5" style={{ color: theme.heroIconColor }} />
        </div>

        {/* Package name + tagline */}
        <h3
          style={{ color: theme.heroText }}
          className="relative z-10 font-bold text-base leading-tight mb-1"
        >
          {pkg.packageName}
        </h3>
        <p
          style={{ color: theme.heroSubtext }}
          className="relative z-10 text-[11px] leading-relaxed"
        >
          {theme.tagline}
        </p>
      </div>

      {/* ── BODY ── clean white, specs and CTA */}
      <div
        style={{ background: theme.bodyBg }}
        className="px-5 pt-4 pb-5 flex flex-col gap-3 flex-1"
      >
        {/* Spec pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            style={{
              background: theme.pillBg,
              color: theme.pillText,
              border: `1px solid ${theme.pillBorder}`,
            }}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-lg px-2.5 py-1"
          >
            <Zap className="w-3 h-3" />
            {speedLabel}
          </span>
          <span
            style={{
              background: theme.pillBg,
              color: theme.pillText,
              border: `1px solid ${theme.pillBorder}`,
            }}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-lg px-2.5 py-1"
          >
            <Clock className="w-3 h-3" />
            {pkg.validityValue} {pkg.validityType}
          </span>
        </div>

        {/* Best for */}
        <p style={{ color: theme.mutedColor }} className="text-[11px] leading-relaxed">
          <span style={{ color: theme.bestForColor }} className="font-semibold">
            Best for:
          </span>{" "}
          {theme.bestFor}
        </p>

        {/* Price + CTA pushed to bottom */}
        <div className="mt-auto space-y-3 pt-2">
          <div>
            <span
              style={{ color: theme.priceColor }}
              className="text-[30px] font-extrabold tabular-nums leading-none tracking-tight"
            >
              KES {pkg.price.toLocaleString()}
            </span>
            <p style={{ color: theme.mutedColor }} className="text-[11px] mt-0.5">
              for {pkg.validityValue} {pkg.validityType}
            </p>
          </div>

          <button
            type="button"
            style={{ background: theme.btnBg, color: theme.btnText }}
            className="w-full h-10 rounded-xl text-xs font-bold tracking-wide transition-opacity hover:opacity-90 active:opacity-75"
          >
            Connect Now →
          </button>
        </div>
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
          paymentMode: paymentMethod.toLocaleUpperCase(),
          macAddress: '',
          clientMac: '',
          clientIp: '',
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
