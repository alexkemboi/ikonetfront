"use client";

import { useEffect, useState } from "react";
import { StickyNote } from "lucide-react";
import { createCustomerNote, getCustomerNotes } from "@/actions/customer360";
import { CustomerNote } from "@/lib/types/customer360";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, DataLoadError } from "./EmptyState";

interface CustomerNotesTabProps {
  customerId: number;
}

function formatNoteDate(value: string): string {
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

export function CustomerNotesTab({ customerId }: CustomerNotesTabProps) {
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCustomerNotes(customerId).then((res) => {
      if (cancelled) return;
      if (res?.success && res.data) setNotes(res.data);
      setLoadError(!res?.success);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  const submit = async () => {
    const text = body.trim();
    if (!text) return;
    setSubmitting(true);
    setError(null);
    const res = await createCustomerNote(customerId, text);
    setSubmitting(false);
    if (res?.success && res.data) {
      setNotes((prev) => [res.data as CustomerNote, ...prev]);
      setBody("");
    } else {
      setError(res?.message || "Unable to save note");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-normal">
          <StickyNote className="h-4 w-4 text-primary" />
          CRM notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type a note about this customer…"
            rows={3}
            className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
          <div className="flex items-center justify-between gap-2">
            {error ? (
              <p className="text-xs text-destructive">{error}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Notes are visible to your company only.
              </p>
            )}
            <Button onClick={submit} disabled={submitting || !body.trim()} size="sm">
              {submitting ? "Saving…" : "Add note"}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {!loaded ? (
            <p className="text-sm text-muted-foreground">Loading notes…</p>
          ) : loadError ? (
            <DataLoadError message="Unable to load notes for this customer." />
          ) : notes.length === 0 ? (
            <EmptyState message="No notes yet for this customer." />
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="rounded-lg border border-border bg-muted/30 p-4"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {note.authorUsername}
                  </span>
                  <span className="text-xs font-sans tabular-nums text-muted-foreground">
                    {formatNoteDate(note.createdAt)}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-foreground/90">
                  {note.note}
                </p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}