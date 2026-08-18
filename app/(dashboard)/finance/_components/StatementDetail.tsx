"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Download,
  ArrowLeft,
  AlertCircle,
  FileText,
  DollarSign,
  CreditCard,
  Scale,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { getStatementById, downloadStatementPdf } from "@/actions/finance";
import type { Statement, StatementLineItem } from "@/lib/types/finance";

export default function StatementDetail({
  paramsPromise,
}: {
  paramsPromise: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [id, setId] = useState<string | null>(null);
  const [statement, setStatement] = useState<Statement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    paramsPromise.then((p) => setId(p.id));
  }, [paramsPromise]);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const numericId = parseInt(id);
      if (isNaN(numericId)) { setError("Invalid statement ID"); setLoading(false); return; }

      const rawCustomerId = searchParams.get("customerId");
      const customerId = rawCustomerId ? parseInt(rawCustomerId, 10) : undefined;
      const res = await getStatementById(
        numericId,
        customerId && !isNaN(customerId) ? customerId : undefined
      );
      if (res.success && res.data) {
        setStatement(res.data);
      } else {
        setError(res.message || "Statement not found");
      }
    } catch {
      setError("Failed to load statement details");
    } finally {
      setLoading(false);
    }
  }, [id, searchParams]);

  useEffect(() => {
    if (id) fetchData();
  }, [id, fetchData]);

  const handleDownload = async () => {
    if (!id) return;
    setDownloading(true);
    try {
      const buffer = await downloadStatementPdf(parseInt(id));
      if (buffer) {
        const blob = new Blob([buffer], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `statement-${id}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("PDF downloaded");
      } else {
        toast.error("Failed to download PDF");
      }
    } catch {
      toast.error("Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 pt-6 space-y-6 animate-pulse">
        <div className="h-6 w-40 bg-muted rounded" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-24 rounded-xl bg-muted" />
          <div className="h-24 rounded-xl bg-muted" />
          <div className="h-24 rounded-xl bg-muted" />
        </div>
        <div className="h-64 rounded-xl bg-muted" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 pt-6">
        <Button variant="ghost" size="sm" className="mb-4 gap-1" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div className="flex flex-col items-center gap-3 py-12">
          <AlertCircle className="w-8 h-8 text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchData}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!statement) return null;

  const lineItems: StatementLineItem[] = statement.lineItems || [];
  const totalCharges = lineItems.reduce((sum, li) => sum + (li.charge || 0), 0);
  const totalPayments = lineItems.reduce((sum, li) => sum + (li.payment || 0), 0);

  return (
    <div className="space-y-6 p-8 pt-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-start justify-between gap-4"
      >
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="sm" className="mt-1 h-8 w-8 p-0" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs mb-1" variant="outline">Statement #{statement.id}</Badge>
            <h1 className="text-2xl font-bold tracking-tight">
              Statement for Customer #{statement.customerId}
            </h1>
            <p className="text-sm text-muted-foreground">
              {new Date(statement.startDate).toLocaleDateString()} — {new Date(statement.endDate).toLocaleDateString()}
            </p>
          </div>
        </div>
        <Button size="sm" className="h-8 gap-1" onClick={handleDownload} disabled={downloading}>
          <Download className="w-3.5 h-3.5" />
          {downloading ? "Downloading..." : "Download PDF"}
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><DollarSign className="w-5 h-5 text-primary" /></div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Charges</p>
                <p className="text-2xl font-bold tabular-nums">KES {statement.totalCharges.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center"><CreditCard className="w-5 h-5 text-success" /></div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Payments</p>
                <p className="text-2xl font-bold tabular-nums">KES {statement.totalPayments.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center"><Scale className="w-5 h-5 text-destructive" /></div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Balance Due</p>
                <p className={cn("text-2xl font-bold tabular-nums", statement.balanceDue > 0 ? "text-destructive" : "text-success")}>
                  KES {statement.balanceDue.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Line Items
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {lineItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Date</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Description</th>
                    <th className="text-right px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Charge (KES)</th>
                    <th className="text-right px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Payment (KES)</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, i) => (
                    <tr key={i} className={cn("transition-colors hover:bg-muted/30", i < lineItems.length - 1 && "border-b border-border")}>
                      <td className="px-5 py-3 text-xs">{new Date(item.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-xs">{item.description}</td>
                      <td className="px-4 py-3 text-right text-xs font-medium tabular-nums text-destructive">
                        {item.charge ? `KES ${item.charge.toLocaleString()}` : "—"}
                      </td>
                      <td className="px-5 py-3 text-right text-xs font-medium tabular-nums text-success">
                        {item.payment ? `KES ${item.payment.toLocaleString()}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/20 font-medium">
                    <td className="px-5 py-3 text-xs font-semibold">Totals</td>
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3 text-right text-xs font-bold tabular-nums text-destructive">
                      KES {totalCharges.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right text-xs font-bold tabular-nums text-success">
                      KES {totalPayments.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No line items available for this statement
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}