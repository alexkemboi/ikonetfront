"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { activateVoucherAction } from "@/actions/hotspot";

type ValidationState = "idle" | "validating" | "valid" | "invalid";

export default function ActivateTab({ clientMac, clientIp, routerIdentity, companyId }: { clientMac?: string; clientIp?: string; routerIdentity?: string; companyId?: string | null }) {
 const [voucher, setVoucher] = useState("");
 const [validationState, setValidationState] = useState<ValidationState>("idle");
 const [message, setMessage] = useState("");
 const [isSubmitting, setIsSubmitting] = useState(false);

 const validateVoucher = (code: string) => {
 // Simple validation - code should be alphanumeric and 6-16 characters
 const isValid = /^[A-Z0-9]{6,16}$/.test(code.toUpperCase());
 return isValid;
 };

 const handleVoucherChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 const value = e.target.value.toUpperCase();
 setVoucher(value);

 // Real-time validation
 if (value.length === 0) {
 setValidationState("idle");
 setMessage("");
 } else if (value.length < 6) {
 setValidationState("invalid");
 setMessage("Code must be at least 6 characters");
 } else if (validateVoucher(value)) {
 setValidationState("valid");
 setMessage("Valid voucher code");
 } else {
 setValidationState("invalid");
 setMessage("Invalid voucher format");
 }
 };

    const handleSubmit = async () => {
        if (!validateVoucher(voucher)) {
            setValidationState("invalid");
            return;
        }

 setIsSubmitting(true);
 setValidationState("validating");

                try {
                        if (!clientMac?.trim()) {
                            setValidationState("invalid");
                            setMessage("This hotspot page is missing the router-provided device identity. Reopen it from the Wi-Fi login page.");
                            return;
                        }
                        const result = await activateVoucherAction({ voucherCode: voucher, macAddress: clientMac, clientIp: clientIp ?? "", routerIdentity, companyId: companyId ?? undefined });
                        if (result.success) {
                            setValidationState("valid");
                            setMessage(`Voucher activated. ${result.data?.packageName ?? "Internet access"} · ${result.data?.expiresAt ?? "Validity starts on first use"}`);
                            return;
                        }
                        setValidationState("invalid");
                        setMessage(`${result.message}${result.requestId ? ` · Ref: ${result.requestId}` : ""}`);
                } catch {
            setValidationState("invalid");
            setMessage("Failed to activate voucher. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

 return (
 <div className="space-y-4">
 <div className="space-y-2">
 <label htmlFor="voucher" className="text-sm font-medium block">
 Enter Voucher Code
 </label>
 <div className="relative">
 <input
 id="voucher"
 type="text"
 placeholder="E.g., ABC123XYZ789"
 value={voucher}
 onChange={handleVoucherChange}
 disabled={isSubmitting}
 className={`w-full h-9 px-3 py-1 rounded-md border bg-transparent text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 pr-10 ${validationState === "valid"
 ? "border-green-500 focus-visible:ring-green-500"
 : validationState === "invalid"
 ? "border-red-500 focus-visible:ring-red-500"
 : "border-input focus-visible:ring-ring"
 }`}
 />
 {validationState === "valid" && (
 <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
 )}
 {validationState === "invalid" && (
 <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
 )}
 </div>
 </div>

 {/* Validation message */}
 {message && (
 <div
 className={`flex items-center gap-2 text-sm p-3 rounded-lg ${validationState === "valid"
 ? "bg-green-50 text-green-800 border border-green-200"
 : validationState === "validating"
 ? "bg-blue-50 text-blue-800 border border-blue-200"
 : "bg-red-50 text-red-800 border border-red-200"
 }`}
 >
 {validationState === "validating" && (
 <Loader2 className="w-4 h-4 animate-spin" />
 )}
 {message}
 </div>
 )}

            {/* Submit button */}
            <Button
                onClick={handleSubmit}
                disabled={validationState !== "valid" || isSubmitting}
                className="w-full"
                title={!clientMac ? "Missing router-provided device identity" : "Activate this voucher on the connected device"}
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Activating...
                    </>
                ) : (
                    "Activate Voucher"
                )}
            </Button>

 {/* Info text */}
 <p className="text-xs text-muted-foreground text-center">
 Enter the voucher code from your purchased package to activate internet access.
 </p>
 </div>
 );
}


