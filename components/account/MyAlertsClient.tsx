"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { saveMyAlertSettings, type AlertSetting, type MyAlertSettings } from "@/actions/alerts-preferences";

/**
 * The signed-in person's own alert switches. Email is on by default for every alert their
 * role receives; a text message is offered only for the alerts that have one.
 */
export function MyAlertsClient({ initial }: { initial: MyAlertSettings }) {
  const [alerts, setAlerts] = useState<AlertSetting[]>(initial.alerts);
  const [saved, setSaved] = useState<AlertSetting[]>(initial.alerts);
  const [pending, startTransition] = useTransition();

  const changed = alerts.filter((a) => {
    const before = saved.find((s) => s.type === a.type);
    return !before || before.email !== a.email || before.sms !== a.sms;
  });

  const set = (type: string, key: "email" | "sms", value: boolean) =>
    setAlerts((list) => list.map((a) => (a.type === type ? { ...a, [key]: value } : a)));

  const save = () =>
    startTransition(async () => {
      const res = await saveMyAlertSettings(changed.map(({ type, email, sms }) => ({ type, email, sms })));
      if (res.success && res.data) {
        setAlerts(res.data.alerts);
        setSaved(res.data.alerts);
        toast.success("Your alerts were saved.");
      } else {
        toast.error(res.message ?? "Your alerts could not be saved.");
      }
    });

  if (alerts.length === 0) {
    return (
      <p className="max-w-2xl rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Your role receives no alerts.
      </p>
    );
  }

  return (
    <section aria-label="My alerts" className="max-w-3xl space-y-4 rounded-2xl border border-border bg-card p-6">
      <div>
        <h2 className="text-lg font-normal text-foreground">My alerts</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Emails go to {initial.email ? <span className="text-foreground">{initial.email}</span> : "your email address"}
          {initial.phone ? (
            <>
              , texts to <span className="text-foreground">{initial.phone}</span>
            </>
          ) : null}
          . To change these, ask your administrator to update your account.
        </p>
        {!initial.email && (
          <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
            Your account has no email address, so no alert emails can reach you.
          </p>
        )}
      </div>

      <div className="divide-y divide-border">
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 pb-2 text-xs text-muted-foreground">
          <span>Alert</span>
          <span className="w-12 text-center">Email</span>
          <span className="w-12 text-center">Text</span>
        </div>
        {alerts.map((a) => (
          <div key={a.type} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 py-3">
            <div className="min-w-0">
              <p className="text-sm text-foreground">{a.label}</p>
              <p className="text-xs text-muted-foreground">{a.description}</p>
            </div>
            <div className="flex w-12 justify-center">
              <Switch
                checked={a.email}
                disabled={pending}
                aria-label={`Email: ${a.label}`}
                onCheckedChange={(v) => set(a.type, "email", v)}
              />
            </div>
            <div className="flex w-12 justify-center">
              {a.offersSms ? (
                <Switch
                  checked={a.sms}
                  disabled={pending}
                  aria-label={`Text: ${a.label}`}
                  onCheckedChange={(v) => set(a.type, "sms", v)}
                />
              ) : (
                <span className="text-xs text-muted-foreground" title="No text message for this alert">
                  —
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <Button onClick={save} disabled={pending || changed.length === 0}>
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save my alerts
      </Button>
    </section>
  );
}
