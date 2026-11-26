import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPaymentsLedgerData } from "@/actions/payments";
import { listRefunds } from "@/actions/refunds";
import { PaymentsLedgerView } from "@/components/payments/PaymentsLedgerView";
import { getPermissionForRoute } from "@/lib/data/nav";
import { getAccess } from "@/lib/data/access";
import { can } from "@/lib/access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Payments",
    description: "Real-time M-Pesa transaction ledger and reconciliation",
};

/**
 * Finance › Payments: the payments ledger with its summary cards. Billing › Payments
 * (/finance/billing/payments) is the same ledger without them; each follows its own grant.
 */
export default async function FinancePaymentsPage() {
    const paymentPerms = await getPermissionForRoute("/finance/payments");
    if (!paymentPerms.canView) redirect("/dashboard");

    const [data, voucherPerms, refunds, access] = await Promise.all([
        getPaymentsLedgerData(),
        getPermissionForRoute("/finance/vouchers"),
        listRefunds(),
        getAccess(),
    ]);
    // what the API lets this role do: record a manual payment, issue a compensation voucher
    const canRecord = can(access, "API_MANUALPAYMENT", "CREATE");
    const canCompensate = can(access, "API_HOTSPOT", "CREATE");

    return (
        <PaymentsLedgerView
            kpis={data.kpis}
            payments={data.payments}
            source={data.source}
            canRecordPayment={canRecord}
            canIssueVoucher={canCompensate && voucherPerms.canCreate}
            // Refunds: raised by those who may create on Payments, confirmed as paid
            // back by those who may edit; the backend enforces the same.
            canRefund={can(access, "API_REFUND_ROOT", "CREATE") && paymentPerms.canCreate}
            canProcessRefund={can(access, "API_REFUND_PROCESS", "CREATE") && paymentPerms.canEdit}
            refunds={refunds}
            eyebrow="FINANCE — LEDGER"
        />
    );
}
