"use client";

import { useState } from "react";
import { ChevronLeft, Loader2, CheckCircle2, Crown, LucideIcon, Coffee, Sun, Compass, Flame, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HotspotPackage } from "@/lib/types/hotspot";
import { useFormik } from "formik";
import * as Yup from "yup"
import { initiateHotspotPayment } from "@/actions/hotspot";
import { toast } from "sonner";

type Step = "packages" | "phone" | "confirming" | "success";

interface BuyTabProps {
    packages: HotspotPackage[];
    onBack: () => void;
}

// ── Card themes — split hero/body design ──────────────────────────────

type CardTheme = {
    badge: string;
    tagline: string;
    bestFor: string;
    Icon: LucideIcon;
    // Hero gradient section (top ~45%)
    heroGradient: string;
    heroText: string;
    heroSubtext: string;
    heroBadgeBg: string;
    heroBadgeText: string;
    heroIconBg: string;
    heroIconColor: string;
    heroOrb1: string;
    heroOrb2: string;
    // Body section (bottom ~55%)
    bodyBg: string;
    bodyBorder: string;
    cardShadow: string;
    pillBg: string;
    pillText: string;
    pillBorder: string;
    bestForColor: string;
    priceColor: string;
    mutedColor: string;
    btnBg: string;
    btnText: string;
};

function getCardTheme(pkg: HotspotPackage): CardTheme {
    const type = pkg.validityType?.toLowerCase() ?? "";
    const val = pkg.validityValue;

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


function PackageCard({
    pkg,
    onSelect,
}: {
    pkg: HotspotPackage;
    onSelect: (pkg: HotspotPackage) => void;
}) {

    console.log(pkg, "hete")
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

export default function BuyTab({ packages, onBack }: BuyTabProps) {
    const [step, setStep] = useState<Step>("packages");
    const [selectedPackage, setSelectedPackage] = useState<any>(null);
    const [phone, setPhone] = useState("");
    const [phoneError, setPhoneError] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const validatePhone = (phoneNumber: string) => {
        // Kenyan phone number validation: 07xxxxxxxx or 01xxxxxxxx
        const isValid = /^(07|01)\d{8}$/.test(phoneNumber.trim());
        return isValid;
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setPhone(value);

        if (value) {
            if (!validatePhone(value)) {
                setPhoneError("Enter a valid Kenyan number (07xxxxxxxx or 01xxxxxxxx)");
            } else {
                setPhoneError("");
            }
        } else {
            setPhoneError("");
        }
    };

    const handleSelectPackage = (pkg: any) => {
        setSelectedPackage(pkg);
        setStep("phone");
    };

    const phoneFormik = useFormik({
        initialValues: { phone: "" },
        validationSchema: Yup.object({
          phone: Yup.string()
            .trim()
            .matches(
              /^(07|01)\d{8}$/,
              "Enter a valid Kenyan number (07xxxxxxxx or 01xxxxxxxx)"
            )
            .required("Phone number is required"),
        }),
        onSubmit: async (values) => {
      
            setStep("confirming");
            setIsProcessing(true);
    
          try {
            const response = await initiateHotspotPayment({
              packageId: selectedPackage.idxno,
              phone: values.phone,
              paymentMode: "MPESA",
              macAddress: '',
              clientMac: '',
              clientIp: '',
            });
    
            if (response.success) {
                setStep("success");
                setSuccessMessage(
                    `STK push sent to ${phone}. Complete the payment on your phone.`
                );
            } else {
              setStep("phone");
            }
          } catch (error) {
              toast.error("stk failed")
          } finally {
              setIsProcessing(false);
          }
        },
      });

    const handleBackStep = () => {
        if (step === "phone") {
            setStep("packages");
            setSelectedPackage(null);
        } else if (step === "confirming" || step === "success") {
            // Don't allow going back during processing
            if (!isProcessing) {
                setStep("phone");
            }
        }
    };

    if (step === "success") {
        return (
            <div className="w-full max-w-md mx-auto space-y-4">
                <div className="flex justify-center mb-4">
                    <div className="rounded-full bg-green-100 p-3">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                </div>
                <h2 className="text-xl font-bold text-center">Payment Initiated</h2>
                <p className="text-center text-sm text-muted-foreground">
                    {successMessage}
                </p>
                <p className="text-center text-xs text-muted-foreground">
                    Redirecting in a few seconds...
                </p>
            </div>
        );
    }

    if (step === "confirming") {
        return (
            <div className="w-full max-w-md mx-auto space-y-4">
                <div className="flex justify-center mb-4">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-center">Sending Payment Request</h2>
                <p className="text-center text-sm text-muted-foreground">
                    Please wait while we send the STK push to {phone}...
                </p>
            </div>
        );
    }

    if (step === "phone") {
        return (
            <div className="w-full max-w-md mx-auto space-y-4">
                <button
                    onClick={handleBackStep}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                </button>

                <div className="bg-accent/50 p-4 rounded-lg">
                    <p className="text-sm font-medium">Selected Package:</p>
                    <p className="text-lg font-bold text-primary">
                        {selectedPackage?.name} - KES {selectedPackage?.price}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {selectedPackage?.validity} {selectedPackage?.validityType} •{" "}
                        {selectedPackage?.data}
                    </p>
                </div>

                <form onSubmit={phoneFormik.handleSubmit}>
                <div className="space-y-2 flex flex-col gap-0.5">
                    <label htmlFor="phone" className="text-sm font-medium block">
                        M-Pesa Phone Number
                    </label>
                    {phoneFormik.touched.phone && phoneFormik.errors.phone ? (

                            <p className="text-red-600">
                            {phoneFormik.errors.phone}
                            </p>

                    ) :("")
                    
                    }
                   
                    <input
                        id="phone"
                        type="tel"
                        name="phone"
                        onBlur={phoneFormik.handleBlur}
                        placeholder="07xxxxxxxx or 01xxxxxxxx"
                        defaultValue={phoneFormik.values.phone}
                        onChange={phoneFormik.handleChange}
                        disabled={isProcessing}
                        className={`w-full h-9 px-3 py-1 rounded-md border bg-transparent text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 ${phoneError ? "border-red-500 focus-visible:ring-red-500" : "border-input focus-visible:ring-ring"
                            }`}
                    />
                    {phoneError && (
                        <p className="text-xs text-red-500">{phoneError}</p>
                    )}
                </div>

                <Button
                    type="submit"
                    disabled={phoneFormik.isSubmitting || isProcessing}
                    className="w-full my-2"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        "Send Payment Request"
                    )}
                </Button>

                </form>

                <p className="text-xs text-muted-foreground text-center">
                    You&apos;ll receive an M-Pesa prompt on your phone to complete the payment.
                </p>
            </div>
        );
    }

    // Packages selection step
    return (
        <div className="w-full max-w-2xl mx-auto space-y-4">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
                <ChevronLeft className="w-4 h-4" />
                Back to Tabs
            </button>

            <p className="text-sm text-muted-foreground">
                Choose a package and pay with M-Pesa
            </p>

            <div className="grid md:grid-cols-2 gap-3">
                {packages.map((pkg) => (
                    <PackageCard
                        key={pkg.idxno}
                        pkg={pkg}
                        onSelect={() => handleSelectPackage(pkg)}
                    />
                ))}
            </div>
        </div>
    );
}
