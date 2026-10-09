import type { WhatsNextItem } from "@/lib/types/dashboard";
import type { CompanyFeeStatus } from "@/lib/types/platformFee";
import { feeHeadline } from "@/components/finance/SystemFeesPanel";
import { kes } from "@/components/finance/systemFeeFormat";

/** The "What's next?" entry for system fees; nothing when the company owes nothing. */
export function systemFeeNextItem(status: CompanyFeeStatus | null): WhatsNextItem | null {
  if (!status || status.standing === "GOOD" || status.totalOutstanding <= 0) return null;
  return {
    id: "system-fees",
    type: "SYSTEM_FEE",
    title: `System fees: ${kes(status.totalOutstanding)} outstanding`,
    description: feeHeadline(status),
    isUrgent: status.standing !== "DUE",
    actionUrl: "/finance/expenses",
  };
}
