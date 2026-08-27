import type { Metadata } from "next";
import { getPaymentsLedgerData } from "@/actions/payments";
import { PaymentsLedgerView } from "@/components/payments/PaymentsLedgerView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Payments Ledger | IBS Platform",
  description: "Real-time M-Pesa transaction ledger and reconciliation",
};

export default async function PaymentsLedgerAliasPage() {
  const data = await getPaymentsLedgerData();

  return <PaymentsLedgerView kpis={data.kpis} payments={data.payments} />;
}
