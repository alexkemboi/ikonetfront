"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Info, Loader2, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { saveSecurityPolicy } from "@/actions/usersAccess";
import { POLICY_RANGES, type SecurityPolicy, type SecurityPolicyInput } from "@/lib/types/usersAccess";
import { cn } from "@/lib/utils";
import { formatDateTime } from "../../_components/status";

type NumberKey = keyof typeof POLICY_RANGES;
type SwitchKey = "allowAdminForceLogout" | "adminUnlockRequired" | "requireChangeAfterReset" | "logSignInActivity";
type Draft = Record<NumberKey, string> & Record<SwitchKey, boolean>;

const NUMBER_KEYS = Object.keys(POLICY_RANGES) as NumberKey[];

function toDraft(p: SecurityPolicy): Draft {
  return {
    sessionsPerUser: String(p.sessionsPerUser),
    idleTimeoutMinutes: String(p.idleTimeoutMinutes),
    maxSessionHours: String(p.maxSessionHours),
    maxFailedAttempts: String(p.maxFailedAttempts),
    lockoutMinutes: String(p.lockoutMinutes),
    passwordExpiryDays: String(p.passwordExpiryDays),
    passwordHistoryCount: String(p.passwordHistoryCount),
    onlineThresholdMinutes: String(p.onlineThresholdMinutes),
    allowAdminForceLogout: p.allowAdminForceLogout,
    adminUnlockRequired: p.adminUnlockRequired,
    requireChangeAfterReset: p.requireChangeAfterReset,
    logSignInActivity: p.logSignInActivity,
  };
}

function errorFor(key: NumberKey, value: string): string | undefined {
  const [min, max] = POLICY_RANGES[key];
  if (value.trim() === "") return "Required";
  if (!/^\d+$/.test(value.trim())) return "Whole numbers only";
  const n = Number(value);
  if (n < min || n > max) return `Between ${min} and ${max}`;
  return undefined;
}

export default function SecuritySettingsClient({
  policy,
  organisationLabel,
  canEdit,
}: {
  policy: SecurityPolicy;
  /** The organisation these settings belong to, as the page names it. */
  organisationLabel: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(policy);
  const [draft, setDraft] = useState<Draft>(() => toDraft(policy));
  const [saving, setSaving] = useState(false);

  const errors = useMemo(() => {
    const out: Partial<Record<NumberKey, string>> = {};
    for (const key of NUMBER_KEYS) {
      // the lockout duration is not used while an administrator must unlock
      if (key === "lockoutMinutes" && draft.adminUnlockRequired) continue;
      const error = errorFor(key, draft[key]);
      if (error) out[key] = error;
    }
    return out;
  }, [draft]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(toDraft(saved));
  const valid = Object.keys(errors).length === 0;

  const setNumber = (key: NumberKey, value: string) => setDraft((d) => ({ ...d, [key]: value.replace(/[^\d]/g, "").slice(0, 4) }));
  const setSwitch = (key: SwitchKey, value: boolean) => setDraft((d) => ({ ...d, [key]: value }));

  const save = async () => {
    if (!valid || !dirty) return;
    setSaving(true);
    try {
      const input: SecurityPolicyInput = {
        sessionsPerUser: Number(draft.sessionsPerUser),
        idleTimeoutMinutes: Number(draft.idleTimeoutMinutes),
        maxSessionHours: Number(draft.maxSessionHours),
        allowAdminForceLogout: draft.allowAdminForceLogout,
        maxFailedAttempts: Number(draft.maxFailedAttempts),
        // kept as it was while unused, so turning admin unlock off again restores it
        lockoutMinutes: errorFor("lockoutMinutes", draft.lockoutMinutes) ? saved.lockoutMinutes : Number(draft.lockoutMinutes),
        adminUnlockRequired: draft.adminUnlockRequired,
        requireChangeAfterReset: draft.requireChangeAfterReset,
        passwordExpiryDays: Number(draft.passwordExpiryDays),
        passwordHistoryCount: Number(draft.passwordHistoryCount),
        logSignInActivity: draft.logSignInActivity,
        onlineThresholdMinutes: Number(draft.onlineThresholdMinutes),
      };
      const res = await saveSecurityPolicy(input);
      if (!res.success || !res.data) {
        toast.error("Security settings were not saved", { description: res.message });
        return;
      }
      setSaved(res.data);
      setDraft(toDraft(res.data));
      toast.success("Security settings saved", { description: "They apply to new sign-ins and to every request from now on." });
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const numberField = (key: NumberKey, label: string, unit: string, hint: string, disabled = false) => (
    <NumberField
      id={`policy-${key}`} label={label} unit={unit} hint={hint} value={draft[key]} error={disabled ? undefined : errors[key]}
      range={POLICY_RANGES[key]} disabled={!canEdit || disabled} onChange={(v) => setNumber(key, v)}
    />
  );
  const switchField = (key: SwitchKey, label: string, hint: string, description: string) => (
    <SwitchField
      id={`policy-${key}`} label={label} hint={hint} description={description} checked={draft[key]}
      disabled={!canEdit} onChange={(v) => setSwitch(key, v)}
    />
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
        <div className="min-w-0 text-sm">
          <p>
            These settings apply to <b>{organisationLabel}</b>
            {saved.inherited ? ", which currently follows the platform default." : "."}
          </p>
          <p className="text-xs text-muted-foreground">
            {saved.updatedAt ? `Last changed ${formatDateTime(saved.updatedAt)}${saved.updatedBy ? ` by ${saved.updatedBy}` : ""}. ` : ""}
            Every value is checked again by the server when saved.
          </p>
        </div>
        {!canEdit && <span className="text-xs font-medium text-muted-foreground">Read only</span>}
      </div>

      <Section title="Session security" description="How many devices a person may use at once, and when sessions end.">
        {numberField("sessionsPerUser", "Sessions per person", "sessions",
          "How many devices or browsers a person may be signed in on at the same time. A limit set on a person in User Management overrides this.")}
        <InfoRow label="Concurrent login policy"
          hint="When a person already has as many sessions as allowed, a new sign-in is refused until a session ends: they sign out, the session goes idle or reaches its maximum lifetime, or an administrator ends it.">
          New sign-ins beyond the limit are refused until an existing session ends.
        </InfoRow>
        {numberField("idleTimeoutMinutes", "Session idle timeout", "minutes",
          "A session with no activity for this long is signed out. The next request is refused and the person signs in again.")}
        {numberField("maxSessionHours", "Maximum session lifetime", "hours",
          "Every session ends this long after it began, however active it is.")}
        {switchField("allowAdminForceLogout", "Allow administrators to force logout",
          "When on, authorised administrators can end one session, or every session, of a person from User Management. The person is signed out on their next request.",
          "Administrators may end someone's sessions.")}
      </Section>

      <Section title="Account lockout" description="What happens after repeated wrong passwords.">
        {numberField("maxFailedAttempts", "Maximum failed sign-in attempts", "attempts",
          "This many wrong passwords in a row lock the account. A successful sign-in resets the count.")}
        {switchField("adminUnlockRequired", "Administrator unlock required",
          "On: a locked account stays locked until an authorised administrator unlocks it; the lockout duration is not used. Off: the lock ends by itself after the lockout duration, and an administrator can still unlock it earlier. The setting in force at the next sign-in attempt decides.",
          "A locked account stays locked until an administrator unlocks it.")}
        {numberField("lockoutMinutes", "Lockout duration", "minutes",
          "How long a lock lasts when an administrator unlock is not required. Not used while “Administrator unlock required” is on.",
          draft.adminUnlockRequired)}
      </Section>

      <Section title="Password rules" description="Temporary passwords, expiry and reuse.">
        {switchField("requireChangeAfterReset", "Require password change after reset",
          "A password set by an administrator (new account or reset) is temporary: after signing in with it, the person can only choose a new password before using the application.",
          "Temporary passwords must be replaced at the next sign-in.")}
        {numberField("passwordExpiryDays", "Password expiry", "days",
          "After this many days a person must choose a new password at their next sign-in. 0 means passwords never expire.")}
        {numberField("passwordHistoryCount", "Password history", "passwords",
          "A new password may not be any of this many previous passwords, the current one included. 0 allows reuse.")}
      </Section>

      <Section title="Sign-in activity" description="What is recorded about signing in.">
        {switchField("logSignInActivity", "Log sign-in activity",
          "When on, successful sign-ins are recorded. Failed sign-ins, lockouts and administrator actions are always recorded, whatever this setting.",
          "Successful sign-ins are recorded.")}
      </Section>

      <Section title="Online status" description="How the user list shows who is active.">
        {numberField("onlineThresholdMinutes", "Online threshold", "minutes",
          "A signed-in person shows as Online when their last activity is within this time, and as Idle when it is older.")}
      </Section>

      {canEdit && (
        <div className="sticky bottom-0 z-20 -mx-4 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex flex-wrap items-center justify-end gap-3">
            <p className="mr-auto text-xs text-muted-foreground" aria-live="polite">
              {!valid ? "Fix the highlighted values to save." : dirty ? "You have unsaved changes." : "All changes saved."}
            </p>
            <Button variant="ghost" onClick={() => setDraft(toDraft(saved))} disabled={!dirty || saving} className="gap-2">
              <RotateCcw className="size-4" /> Discard
            </Button>
            <Button onClick={save} disabled={!dirty || !valid || saving} className="gap-2">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save settings
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card shadow-xs">
      <header className="border-b border-border px-4 py-3 sm:px-5">
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </header>
      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}

function Hint({ text, label }: { text: string; label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" aria-label={`About ${label}`} className="text-muted-foreground/70 hover:text-foreground">
          <Info className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  );
}

function Row({ label, labelFor, hint, children, sub }: {
  label: string; labelFor?: string; hint: string; children: React.ReactNode; sub?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          {labelFor ? <Label htmlFor={labelFor} className="text-sm font-medium">{label}</Label> : <span className="text-sm font-medium">{label}</span>}
          <Hint text={hint} label={label} />
        </div>
        {sub}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function NumberField({ id, label, unit, hint, value, error, range, disabled, onChange }: {
  id: string; label: string; unit: string; hint: string; value: string; error?: string;
  range: readonly [number, number]; disabled: boolean; onChange: (value: string) => void;
}) {
  return (
    <Row label={label} labelFor={id} hint={hint}
      sub={<p className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground")} id={`${id}-help`}>
        {error ?? `Allowed: ${range[0]}–${range[1]} ${unit}`}
      </p>}>
      <div className="flex items-center gap-2">
        <Input id={id} inputMode="numeric" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)} aria-describedby={`${id}-help`}
          className={cn("h-9 w-24 text-right tabular-nums", error && "border-destructive")} />
        <span className="w-20 text-xs text-muted-foreground">{unit}</span>
      </div>
    </Row>
  );
}

function SwitchField({ id, label, hint, description, checked, disabled, onChange }: {
  id: string; label: string; hint: string; description: string; checked: boolean; disabled: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <Row label={label} labelFor={id} hint={hint} sub={<p className="text-xs text-muted-foreground">{description}</p>}>
      <Switch id={id} checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </Row>
  );
}

function InfoRow({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <Row label={label} hint={hint} sub={<p className="text-xs text-muted-foreground">{children}</p>}>
      <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">Refuse new sign-in</span>
    </Row>
  );
}
