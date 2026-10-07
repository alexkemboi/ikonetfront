"use client";

import { useEffect, useState } from "react";
import { MessageSquareText } from "lucide-react";
import { getSmsHistory } from "@/actions/customer360";
import { SmsHistoryItem } from "@/lib/types/customer360";
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

interface SmsTabProps {
  customerId: number;
}

function formatSentAt(value: string): string {
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

const STATUS_LABELS: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  QUEUED: { label: "Waiting to send", variant: "secondary" },
  SENDING: { label: "Sending", variant: "secondary" },
  SENT: { label: "Sent", variant: "default" },
  FAILED: { label: "Not sent", variant: "destructive" },
  EXPIRED: { label: "Not sent (too late)", variant: "destructive" },
};

export function SmsTab({ customerId }: SmsTabProps) {
  const [messages, setMessages] = useState<SmsHistoryItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSmsHistory(customerId).then((res) => {
      if (cancelled) return;
      if (res?.success && res.data) setMessages(res.data);
      setError(!res?.success);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-normal">
          <MessageSquareText className="h-4 w-4 text-primary" />
          SMS history
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!loaded ? (
          <p className="text-sm text-muted-foreground">Loading SMS history…</p>
        ) : error ? (
          <DataLoadError message="Unable to load SMS history for this customer." />
        ) : messages.length === 0 ? (
          <EmptyState message="No SMS for this customer yet." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Content</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((message) => (
                <TableRow key={message.id}>
                  <TableCell className="font-sans tabular-nums">
                    {formatSentAt(message.sentAt)}
                  </TableCell>
                  <TableCell className="font-sans tabular-nums">
                    {message.phoneNumber || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {message.templateCode || "GENERIC"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={STATUS_LABELS[message.status]?.variant ?? "outline"}
                    >
                      {STATUS_LABELS[message.status]?.label ?? message.status}
                    </Badge>
                    {message.failureReason &&
                      (message.status === "FAILED" ||
                        message.status === "EXPIRED") && (
                        <p className="mt-1 max-w-[220px] whitespace-normal text-xs text-muted-foreground">
                          {message.failureReason}
                        </p>
                      )}
                  </TableCell>
                  <TableCell className="max-w-[280px] truncate text-muted-foreground">
                    {message.content || "—"}
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