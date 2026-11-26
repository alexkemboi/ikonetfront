"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, KeyRound, Loader2, LogOut, Pencil, Power, ShieldAlert, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getSystemUser, unlockSystemUser } from "@/actions/system";
import {
  activateUser,
  deactivateUser,
  endAllUserSessions,
  endUserSession,
  getUserSessions,
  getUserSignIns,
  setUserSessionLimit,
} from "@/actions/usersAccess";
import type { ApiRole, ApiRoleUser } from "@/lib/types/roles";
import type { InvestorOption } from "@/lib/types/investor";
import type { AuditEntry, OrganisationOptions, Paged, SecurityProfile, SignInEvent, UserSession } from "@/lib/types/usersAccess";
import { cn } from "@/lib/utils";
import { EditUserSheet } from "../../_components/editusersheet";
import { SignInEventsTable } from "../../_components/SignInEventsTable";
import { ConfirmDialog, ResetPasswordDialog, type PendingConfirm } from "../../_components/UserActionDialogs";
import {
  AccountStatusBadge,
  describeDevice,
  formatDateTime,
  formatRelative,
  LoginStatusBadge,
} from "../../_components/status";

type Can = { edit: boolean; changeRole: boolean; unlock: boolean; resetPassword: boolean; viewSessions: boolean; endSessions: boolean };

const SECTIONS = [
  ["personal", "Personal"],
  ["organisation", "Organisation"],
  ["role", "Role & permissions"],
  ["account", "Account"],
  ["invitation", "Invitation"],
  ["security", "Password & security"],
  ["sessions", "Sessions"],
  ["sign-ins", "Sign-in history"],
  ["audit", "Audit activity"],
] as const;

const END_REASONS: Record<string, string> = {
  SIGNED_OUT: "Signed out",
  IDLE: "Idle timeout",
  EXPIRED: "Maximum lifetime",
  FORCED: "Ended by an administrator",
  PASSWORD_CHANGED: "Password changed",
  DEACTIVATED: "Account deactivated",
};

export default function UserProfileClient({
  profile,
  sessions: initialSessions,
  signIns,
  audit,
  roles,
  investors,
  organisation,
  isPlatformAdmin,
  can,
}: {
  profile: SecurityProfile;
  /** null when the viewer may not see sessions or they could not be loaded. */
  sessions: UserSession[] | null;
  signIns: Paged<SignInEvent> | null;
  audit: AuditEntry[] | null;
  roles: ApiRole[];
  investors: InvestorOption[];
  organisation: OrganisationOptions | null;
  isPlatformAdmin: boolean;
  can: Can;
}) {
  const router = useRouter();
  const { user, policy } = profile;
  const name = user.fullName || user.username;
  const [sessions, setSessions] = useState(initialSessions);
  const [confirm, setConfirm] = useState<PendingConfirm | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [editing, setEditing] = useState<ApiRoleUser | null>(null);
  const [limit, setLimit] = useState(user.sessionLimit === null ? "" : String(user.sessionLimit));
  const [savingLimit, setSavingLimit] = useState(false);

  const openSessions = sessions?.filter((s) => !s.endedAt) ?? [];
  const mayForceLogout = can.endSessions && policy.allowAdminForceLogout;
  const inactive = profile.accountStatus === "INACTIVE";

  const refresh = useCallback(async () => {
    router.refresh();
    if (can.viewSessions) {
      const res = await getUserSessions(user.idxno);
      if (res.success && res.data) setSessions(res.data);
    }
  }, [router, can.viewSessions, user.idxno]);

  const run = async (work: () => Promise<{ success: boolean; message?: string }>, done: string): Promise<string | void> => {
    const res = await work();
    if (!res.success) {
      toast.error(res.message || "The action failed.");
      return res.message || "failed";
    }
    toast.success(done);
    await refresh();
  };

  const openEdit = async () => {
    const res = await getSystemUser(user.idxno);
    if (!res.success || !res.data) {
      toast.error("Could not open the user", { description: res.message });
      return;
    }
    setEditing(res.data);
  };

  const saveLimit = async () => {
    setSavingLimit(true);
    try {
      const value = limit === "" ? null : Number(limit);
      const res = await setUserSessionLimit(user.idxno, value);
      if (!res.success) {
        toast.error("The session limit was not saved", { description: res.message });
        return;
      }
      toast.success(value === null ? "Session limit returned to the organisation default" : `Session limit set to ${value}`);
      router.refresh();
    } finally {
      setSavingLimit(false);
    }
  };

  const loadSignIns = useCallback(
    (p: { page: number; size: number }) => getUserSignIns(user.idxno, p.page, p.size),
    [user.idxno]
  );

  const grantsByModule = profile.grants.reduce<Record<string, typeof profile.grants>>((acc, g) => {
    const key = g.module || "Other";
    (acc[key] ??= []).push(g);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <Link href="/system/users" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All users
      </Link>

      {/* ── Header ── */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary">
            {name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("")}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">{name}</h2>
            <p className="truncate text-sm text-muted-foreground">{[user.username, user.roleName ?? user.role].filter(Boolean).join(" · ")}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <AccountStatusBadge status={profile.accountStatus} />
              <LoginStatusBadge status={profile.loginStatus} />
              {user.mustChangePassword && (
                <span className="rounded-chip border border-warning/30 bg-warning/10 px-2 py-0.5 text-[11px] font-medium text-warning">Must change password</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {can.edit && (
            <Button variant="outline" size="sm" className="gap-2" onClick={openEdit}><Pencil className="size-4" /> Edit</Button>
          )}
          {can.unlock && profile.accountStatus === "LOCKED" && (
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setConfirm({
              title: "Unlock account?",
              description: <>{name} can sign in again with their current password.</>,
              confirmLabel: "Unlock",
              run: () => run(() => unlockSystemUser(user.idxno), `${name} can sign in again`),
            })}><Unlock className="size-4" /> Unlock</Button>
          )}
          {can.resetPassword && (
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setResetOpen(true)}><KeyRound className="size-4" /> Reset password</Button>
          )}
          {can.edit && (
            <Button variant={inactive ? "outline" : "destructive-outline"} size="sm" className="gap-2" onClick={() => setConfirm(inactive ? {
              title: "Activate account?",
              description: <>{name} will be able to sign in.</>,
              confirmLabel: "Activate",
              run: () => run(() => activateUser(user.idxno), `${name} is active`),
            } : {
              title: "Deactivate account?",
              description: <>{name} is signed out of every device and cannot sign in until activated again.</>,
              confirmLabel: "Deactivate",
              destructive: true,
              run: () => run(() => deactivateUser(user.idxno), `${name} was deactivated`),
            })}><Power className="size-4" /> {inactive ? "Activate" : "Deactivate"}</Button>
          )}
        </div>
      </div>

      <nav aria-label="Sections" className="-mx-1 overflow-x-auto">
        <ul className="flex min-w-max gap-1 px-1">
          {SECTIONS.filter(([id]) => id !== "sessions" || can.viewSessions).map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`} className="inline-flex h-8 items-center rounded-full border border-border px-3 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card id="personal" title="Personal information">
          <Fields rows={[
            ["First name", user.fname],
            ["Middle name", user.middleName],
            ["Other name", user.otherName],
            ["Username", user.username],
            ["Email address", user.email],
            ["Phone number", user.phoneNumber],
            ["Created", formatDateTime(user.createdAt)],
          ]} />
        </Card>

        <Card id="organisation" title="Organisation and tenant assignment">
          <Fields rows={[
            ["Tenant", profile.companyName ? `${profile.companyName} (${user.companyId})` : user.companyId || "No company"],
            ["Company", profile.companyName || user.companyId],
            ["Location", profile.locationName],
            ["Station", profile.stationName],
          ]} />
        </Card>

        <Card id="role" title="Role and permissions" className="lg:col-span-2">
          <Fields rows={[
            ["Role", user.roleName ?? user.role],
            ["Description", user.roleDescription],
            ["Reach", profile.roleScope === "PLATFORM" ? "All companies" : profile.roleScope === "STATION" ? "Their station (or company without one)" : "Their whole company"],
            ["Account type", user.principalType === "INVESTOR" ? "Network Partner" : "Staff"],
          ]} />
          {profile.grants.length > 0 ? (
            <details className="mt-4 rounded-lg border border-border">
              <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
                {profile.grants.length} screens and rights granted by this role
              </summary>
              <div className="grid gap-4 border-t border-border p-3 sm:grid-cols-2">
                {Object.entries(grantsByModule).map(([module, grants]) => (
                  <div key={module}>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{module}</p>
                    <ul className="space-y-1">
                      {grants.map((g) => (
                        <li key={`${module}-${g.label}`} className="flex items-center justify-between gap-2 text-sm">
                          <span className="truncate">{g.label}</span>
                          <span className="shrink-0 text-[11px] text-muted-foreground">
                            {g.kind === "RIGHT" ? "Right" : [g.view && "View", g.create && "Create", g.edit && "Edit", g.delete && "Delete"].filter(Boolean).join(" · ")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </details>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">This role grants no screens or rights.</p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Change the role with <b>Edit</b>; change what a role allows on the <Link href="/system/users/roles" className="underline">Roles &amp; Permissions</Link> tab.
          </p>
        </Card>

        <Card id="account" title="Account status">
          <Fields rows={[
            ["Status", <AccountStatusBadge key="s" status={profile.accountStatus} />],
            ["Login", user.isactive && user.canLogin ? "Enabled" : "Disabled"],
            ["Failed attempts", `${user.failedLoginAttempts ?? 0} of ${policy.maxFailedAttempts} allowed`],
            ...(user.accountLocked ? [
              ["Locked since", formatDateTime(user.lockedAt)] as [string, React.ReactNode],
              ["Lock ends", profile.lockNeedsAdmin ? "When an administrator unlocks it" : formatDateTime(profile.lockedUntil)] as [string, React.ReactNode],
            ] : []),
            ["Last login", formatDateTime(user.lastLoginAt)],
            ["Last activity", profile.lastActiveAt ? `${formatRelative(profile.lastActiveAt)} (${formatDateTime(profile.lastActiveAt)})` : "—"],
          ]} />
        </Card>

        <Card id="invitation" title="Invitation">
          {profile.invitation ? (
            <Fields rows={[
              ["Invited by", profile.invitation.invitedBy],
              ["Invited", formatDateTime(profile.invitation.invitedAt)],
              ["Accepted", formatDateTime(profile.invitation.acceptedAt)],
              ["Emails sent", String(profile.invitation.sendCount)],
            ]} />
          ) : (
            <p className="text-sm text-muted-foreground">This account was created by an administrator, not through an invitation.</p>
          )}
        </Card>

        <Card id="security" title="Password and security" className="lg:col-span-2">
          <div className="grid gap-5 lg:grid-cols-2">
            <Fields rows={[
              ["Password changed", formatDateTime(profile.passwordChangedAt)],
              ["Password expires", policy.passwordExpiryDays > 0 ? formatDateTime(profile.passwordExpiresAt) : "Never (no expiry set)"],
              ["Temporary password", user.mustChangePassword ? "Yes: must choose a new one at sign-in" : "No"],
              ["Password history", policy.passwordHistoryCount > 0 ? `Last ${policy.passwordHistoryCount} cannot be reused` : "Reuse allowed"],
            ]} />
            <div className="space-y-2">
              <Label htmlFor="session-limit" className="text-sm font-medium">Sessions this person may have at once</Label>
              <div className="flex flex-wrap items-center gap-2">
                <select id="session-limit" value={limit} disabled={!can.edit || savingLimit} onChange={(e) => setLimit(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">Organisation default ({policy.sessionsPerUser})</option>
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => <option key={n} value={String(n)}>{n}</option>)}
                </select>
                {can.edit && (
                  <Button size="sm" variant="outline" onClick={saveLimit}
                    disabled={savingLimit || limit === (user.sessionLimit === null ? "" : String(user.sessionLimit))}>
                    {savingLimit ? <Loader2 className="size-4 animate-spin" /> : "Save"}
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                In force: {profile.effectiveSessionLimit} ({profile.sessionLimitSource === "USER" ? "set for this person, overriding the organisation" : "the organisation default"}).
                A sign-in beyond it is refused until a session ends.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {can.viewSessions && (
        <Card id="sessions" title="Active sessions"
          action={mayForceLogout && openSessions.length > 0 ? (
            <Button variant="destructive-outline" size="sm" className="gap-2" onClick={() => setConfirm({
              title: "Sign out of every device?",
              description: <>All {openSessions.length} open session{openSessions.length === 1 ? "" : "s"} of {name} end now.</>,
              confirmLabel: "Force logout",
              destructive: true,
              run: () => run(() => endAllUserSessions(user.idxno), `${name} was signed out everywhere`),
            })}><LogOut className="size-4" /> End all sessions</Button>
          ) : undefined}>
          {!policy.allowAdminForceLogout && (
            <p className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldAlert className="size-3.5" /> Your security settings do not allow administrators to end sessions.
            </p>
          )}
          {sessions === null ? (
            <p className="text-sm text-destructive">Sessions could not be loaded.</p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sessions recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-3 font-semibold">Device</th>
                    <th className="py-2 pr-3 font-semibold">Started</th>
                    <th className="py-2 pr-3 font-semibold">Last activity</th>
                    <th className="py-2 pr-3 font-semibold">Status</th>
                    <th className="py-2 font-semibold"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.id} className={cn("border-b border-border last:border-0", s.endedAt && "text-muted-foreground")}>
                      <td className="py-2.5 pr-3">
                        <p className="font-medium">{describeDevice(s.userAgent)}{s.current && <span className="ml-1.5 text-[11px] text-primary">(this session)</span>}</p>
                        <p className="text-xs tabular-nums text-muted-foreground">{s.ipAddress || "—"}</p>
                      </td>
                      <td className="py-2.5 pr-3 text-xs tabular-nums">{formatDateTime(s.createdAt)}</td>
                      <td className="py-2.5 pr-3 text-xs tabular-nums">{formatRelative(s.lastActiveAt)}</td>
                      <td className="py-2.5 pr-3 text-xs">
                        {s.endedAt
                          ? <>{END_REASONS[s.endReason ?? ""] ?? "Ended"} · {formatRelative(s.endedAt)}{s.endedBy ? ` by ${s.endedBy}` : ""}</>
                          : <span className="font-medium text-success">Open · ends by {formatDateTime(s.expiresAt)}</span>}
                      </td>
                      <td className="py-2.5 text-right">
                        {!s.endedAt && mayForceLogout && (
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setConfirm({
                            title: "End this session?",
                            description: <>{name} is signed out on {describeDevice(s.userAgent)} ({s.ipAddress || "unknown address"}) at their next request.</>,
                            confirmLabel: "End session",
                            destructive: true,
                            run: () => run(() => endUserSession(user.idxno, s.id), "Session ended"),
                          })}>End session</Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <Card id="sign-ins" title="Sign-in history">
        <SignInEventsTable initial={signIns} load={loadSignIns} />
      </Card>

      <Card id="audit" title="Audit activity">
        {audit === null ? (
          <p className="text-sm text-destructive">Audit activity could not be loaded.</p>
        ) : audit.length === 0 ? (
          <p className="text-sm text-muted-foreground">No audit entries for this person yet.</p>
        ) : (
          <ol className="divide-y divide-border">
            {audit.map((entry) => (
              <li key={entry.id} className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <p className="text-sm">{entry.description || entry.subModule || entry.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {[entry.module, entry.subModule].filter(Boolean).join(" · ")}
                    {entry.username && entry.username !== user.username ? ` · by ${entry.username}` : ""}
                  </p>
                </div>
                <time className="shrink-0 text-xs tabular-nums text-muted-foreground">{formatDateTime(entry.accessTime)}</time>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <EditUserSheet
        key={editing?.idxno ?? "none"}
        open={Boolean(editing)}
        user={editing}
        onClose={() => setEditing(null)}
        onLinked={refresh}
        canLinkInvestor={isPlatformAdmin}
        canChangeRole={can.changeRole}
        canChangeCompany={isPlatformAdmin}
        investors={investors}
        roles={roles}
        organisation={organisation}
      />
      <ResetPasswordDialog
        target={resetOpen ? { id: user.idxno, name } : null}
        requireChange={policy.requireChangeAfterReset}
        onClose={() => setResetOpen(false)}
        onDone={refresh}
      />
      <ConfirmDialog pending={confirm} onClose={() => setConfirm(null)} />
    </div>
  );
}

function Card({ id, title, action, className, children }: {
  id: string; title: string; action?: React.ReactNode; className?: string; children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn("scroll-mt-24 rounded-xl border border-border bg-card shadow-xs", className)}>
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
        <h3 id={`${id}-title`} className="text-sm font-semibold">{title}</h3>
        {action}
      </header>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function Fields({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-[minmax(0,10rem)_1fr]">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-xs text-muted-foreground sm:pt-0.5">{label}</dt>
          <dd className="min-w-0 break-words text-sm">{value === null || value === undefined || value === "" ? "—" : value}</dd>
        </div>
      ))}
    </dl>
  );
}
