"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TicketCheck } from "lucide-react";
import { getCustomerTickets } from "@/actions/customer360";
import { TicketSummaryItem } from "@/lib/types/customer360";
import {
  PRIORITY_BADGE,
  STATUS_BADGE,
} from "@/lib/types/ticket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState, DataLoadError } from "./EmptyState";

interface TicketsTabProps {
  customerId: number;
}

function formatCreatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function TicketsTab({ customerId }: TicketsTabProps) {
  const [tickets, setTickets] = useState<TicketSummaryItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCustomerTickets(customerId).then((res) => {
      if (cancelled) return;
      if (res?.success && res.data) setTickets(res.data);
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
          <TicketCheck className="h-4 w-4 text-primary" />
          Tickets
        </CardTitle>
        <Link
          href="/customers/tickets"
          className="text-xs font-medium text-primary hover:underline"
        >
          Open ticketing →
        </Link>
      </CardHeader>
      <CardContent>
        {!loaded ? (
          <p className="text-sm text-muted-foreground">Loading tickets…</p>
        ) : error ? (
          <DataLoadError message="Unable to load tickets for this customer." />
        ) : tickets.length === 0 ? (
          <EmptyState message="No tickets linked to this customer." />
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <Link
                key={ticket.idxno}
                href="/customers/tickets"
                className="block rounded-lg border border-border bg-muted/30 p-4 transition hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-sans tabular-nums text-xs text-muted-foreground">
                        {ticket.ticketNumber}
                      </span>
                      <Badge className={STATUS_BADGE[ticket.status]}>
                        {ticket.status}
                      </Badge>
                      <Badge className={PRIORITY_BADGE[ticket.priority]}>
                        {ticket.priority}
                      </Badge>
                    </div>
                    <p className="mt-2 truncate font-medium text-foreground">
                      {ticket.title}
                    </p>
                    <p className="mt-1 max-w-[420px] truncate text-sm text-muted-foreground">
                      {ticket.description}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-sans tabular-nums text-muted-foreground">
                    {formatCreatedAt(ticket.createdAt)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}