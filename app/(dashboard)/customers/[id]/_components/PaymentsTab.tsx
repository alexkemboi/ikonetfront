"use client";

import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import { getCustomerPayments } from "@/actions/customer360";
import { PaymentHistoryItem } from "@/lib/types/customer360";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, DataLoadError } from "./EmptyState";

interface PaymentsTabProps {
  customerId: number;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusVariant(status: string | null): "default" | "outline" | "destructive" {
  switch ((status ?? "").toUpperCase()) {
    case "COMPLETED":
      return "default";
    case "PENDING":
      return "outline";
    default:
      return "destructive";
  }
}

export function PaymentsTab({ customerId }: PaymentsTabProps) {
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCustomerPayments(customerId).then((res) => {
      if (cancelled) return;
      if (res?.success && res.data) setPayments(res.data);
      setError(!res?.success);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-normal">
          <CreditCard className="h-4 w-4 text-primary" />
          Payments
        </CardTitle>
        <span className="text-xs font-sans tabular-nums text-muted-foreground">
          newest 50
        </span>
      </CardHeader>
      <CardContent>
        {!loaded ? (
          <p className="text-sm text-muted-foreground">Loading payments…</p>
        ) : error ? (
          <DataLoadError message="Unable to load payments for this customer." />
        ) : payments.length === 0 ? (
          <EmptyState message="No payments recorded for this customer." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Receipt</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-sans tabular-nums">
                    {formatDate(payment.createdAt)}
                  </TableCell>
                  <TableCell className="font-sans tabular-nums">
                    {payment.mpesaReceipt || "—"}
                  </TableCell>
                  <TableCell className="font-sans tabular-nums">
                    {payment.phoneNumber || "—"}
                  </TableCell>
                  <TableCell className="text-right font-sans tabular-nums">
                    KES {payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(payment.status)}>
                      {payment.status ?? "—"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}