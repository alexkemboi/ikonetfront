import { Mail, MessageSquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { InvestorMessageSent } from "@/lib/types/investorMessages";

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-KE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

/**
 * Messages the platform sent one investor, newest first. The administrators also see who sent
 * each, how many emails and texts were queued and under which company's SMS account.
 */
export default function MessageHistory({
  messages,
  audience,
}: {
  messages: InvestorMessageSent[];
  audience: "investor" | "admin";
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{audience === "investor" ? "Messages from the platform" : "Messages sent"}</CardTitle>
        <CardDescription>
          {audience === "investor"
            ? "Everything the platform administrators have sent you, newest first."
            : "Everything sent to this investor from this page or to all investors of a company, newest first."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No message yet.</p>
        ) : (
          <ul className="space-y-3">
            {messages.map((m) => (
              <li key={m.id} className="rounded-xl border border-border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{m.subject ?? "Text message"}</p>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    {m.email && <Mail className="size-3.5" aria-label="email" />}
                    {m.sms && <MessageSquare className="size-3.5" aria-label="text message" />}
                    {when(m.sentAt)}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-line text-muted-foreground">{m.body}</p>
                {audience === "admin" && (
                  <p className="mt-2 text-xs text-muted-foreground tabular-nums">
                    By {m.sentBy} · {m.email ? `${m.emails} email${m.emails === 1 ? "" : "s"}` : "no email"} ·{" "}
                    {m.sms ? `${m.texts} text${m.texts === 1 ? "" : "s"}${m.smsCompany ? ` under ${m.smsCompany}` : ""}` : "no text"}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
