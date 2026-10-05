"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { activateVoucherAction } from "@/actions/hotspot";
import { getPortalRouter } from "@/lib/hotspot/portalRouter";
import { sanitizeErrorMessage } from "@/lib/brand";

type ValidationState = "idle" | "validating" | "valid" | "invalid" | "activated";

interface ActivateTabProps {
  /** MikroTik redirect `$(mac)`; the backend recovers it from `clientIp` when a CNA strips it. */
  clientMac?: string;
  clientIp?: string;
  routerIdentity?: string;
}

export default function ActivateTab({ clientMac, clientIp, routerIdentity }: ActivateTabProps) {
 const [voucher, setVoucher] = useState("");
 const [validationState, setValidationState] = useState<ValidationState>("idle");
 const [message, setMessage] = useState("");
 const [isSubmitting, setIsSubmitting] = useState(false);

 const validateVoucher = (code: string) => {
 // Voucher codes are 4-12 characters (configurable length + optional prefix)
 const isValid = /^[A-Z0-9]{4,16}$/.test(code.toUpperCase());
 return isValid;
 };

 const handleVoucherChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 const value = e.target.value.toUpperCase();
 setVoucher(value);

 // Real-time validation
 if (value.length === 0) {
 setValidationState("idle");
 setMessage("");
 } else if (value.length < 4) {
 setValidationState("invalid");
 setMessage("Code must be at least 4 characters");
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
        setMessage("Activating your voucher…");

        try {
            const result = await activateVoucherAction({ voucherCode: voucher, macAddress: clientMac, clientIp, routerIdentity, portalRouter: getPortalRouter() });
            if (!result.success || !result.data) {
                setValidationState("invalid");
                setMessage(sanitizeErrorMessage(result.message || "Failed to activate voucher. Please try again."));
                return;
            }
            const expiry = result.data.expiresAt ? new Date(result.data.expiresAt) : null;
            setValidationState("activated");
            setMessage(expiry && !Number.isNaN(expiry.getTime())
                ? `You're connected. Valid until ${expiry.toLocaleString()}.`
                : "You're connected.");
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
 className={`w-full h-9 px-3 py-1 rounded-md border bg-transparent text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 pr-10 ${validationState === "valid" || validationState === "activated"
 ? "border-green-500 focus-visible:ring-green-500"
 : validationState === "invalid"
 ? "border-red-500 focus-visible:ring-red-500"
 : "border-input focus-visible:ring-ring"
 }`}
 />
 {(validationState === "valid" || validationState === "activated") && (
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
 className={`flex items-center gap-2 text-sm p-3 rounded-lg ${validationState === "valid" || validationState === "activated"
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


