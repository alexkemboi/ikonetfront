"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { initiateHotspotPayment } from "@/actions/hotspot";
import { HotspotPackage } from "@/lib/types/hotspot";
import { getCustomerFacingBrand, sanitizeErrorMessage } from "@/lib/brand";

interface CheckoutModalProps {
  package: HotspotPackage;
  companyCode?: string | null;
  onCompanyResolved?: (companyCode?: string | null) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export default function CheckoutModal({
  package: pkg,
  companyCode,
  onCompanyResolved,
  onClose,
  onConfirm,
}: CheckoutModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const defaultMacAddress = "00:00:00:00:00:00";
  const brand = getCustomerFacingBrand(companyCode);

  const handleConfirm = async () => {
    if (!phoneNumber.trim()) {
      alert("Please enter a phone number");
      return;
    }
    setIsProcessing(true);
    try {
      const result = await initiateHotspotPayment({
        packageId: pkg.idxno,
        phone: phoneNumber.trim(),
        paymentMode: "MPESA",
        macAddress: defaultMacAddress,
        clientMac: defaultMacAddress,
        clientIp: "",
      });

      if (!result.success) {
        throw new Error(result.message || "Failed to initiate payment");
      }

      // Re-hydrate the brand from the server-resolved company (CNA-safe).
      if (result.data?.companyId) {
        onCompanyResolved?.(result.data.companyId);
      }

      toast.success("Payment prompt sent", {
        description: "Check your phone and enter your M-Pesa PIN to complete payment.",
      });
      onConfirm();
    } catch (error) {
      const rawMessage =
        error instanceof Error ? error.message : "Please try again.";
      toast.error("Payment could not be started", {
        description: sanitizeErrorMessage(rawMessage),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-xl max-w-md w-full shadow-lg border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Confirm Purchase</h3>
            <p className="text-xs text-muted-foreground">{brand}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-secondary rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Package summary */}
          <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-foreground">Package:</span>
              <span className="text-sm font-semibold text-primary">{pkg.packageName}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-foreground">Data:</span>
              <span className="text-sm font-semibold text-primary">{pkg.speedDownload} Mbps</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-foreground">Data:</span>
              <span className="text-sm font-semibold text-primary">{pkg.speedUpload} Mbps</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-foreground">Validity:</span>
              <span className="text-sm font-semibold text-primary">
                {pkg.validityValue} {pkg.validityType}
              </span>
            </div>
            <div className="pt-2 border-t border-border flex justify-between items-center">
              <span className="text-sm font-medium text-foreground">Total Price:</span>
              <span className="text-xl font-bold text-primary">KES {pkg.price.toLocaleString()}</span>
            </div>
          </div>

          {/* Phone number input */}
          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium text-foreground block">
              M-Pesa Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              placeholder="+254 700 000 000"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isProcessing}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            />
          </div>

          {/* Info text */}
          <p className="text-xs text-muted-foreground">
            You will receive an M-Pesa prompt to complete the payment. Ensure you have sufficient balance.
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t border-border">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing || !phoneNumber.trim()}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Make to Payment"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}