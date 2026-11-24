import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AccountStatus, InvitationStatus, LoginStatus } from "@/lib/types/usersAccess";

const tone = {
  success: "bg-success/10 text-success border-success/25",
  warning: "bg-warning/10 text-warning border-warning/30",
  danger: "bg-destructive/10 text-destructive border-destructive/30",
  info: "bg-primary/5 text-primary border-primary/20",
  muted: "bg-muted text-muted-foreground border-border",
} as const;

function StatusBadge({ label, className, dot }: { label: string; className: string; dot?: boolean }) {
  return (
    <Badge variant="outline" className={cn("text-[11px] font-medium", className)}>
      {dot && <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      {label}
    </Badge>
  );
}

const ACCOUNT: Record<AccountStatus, [string, string]> = {
  ACTIVE: ["Active", tone.success],
  INACTIVE: ["Inactive", tone.muted],
  LOCKED: ["Locked", tone.danger],
  INVITED: ["Invited", tone.info],
};

const INVITATION: Record<InvitationStatus, [string, string]> = {
  PENDING: ["Pending", tone.warning],
  EXPIRED: ["Expired", tone.danger],
  ACCEPTED: ["Accepted", tone.success],
  REVOKED: ["Revoked", tone.muted],
  NONE: ["Not invited", tone.muted],
};

const LOGIN: Record<LoginStatus, [string, string]> = {
  ONLINE: ["Online", tone.success],
  IDLE: ["Idle", tone.warning],
  OFFLINE: ["Offline", tone.muted],
  NEVER: ["Never signed in", tone.muted],
  DISABLED: ["Login disabled", tone.danger],
};

export function AccountStatusBadge({ status }: { status: AccountStatus }) {
  const [label, className] = ACCOUNT[status] ?? [status, tone.muted];
  return <StatusBadge label={label} className={className} />;
}

export function InvitationBadge({ status }: { status: InvitationStatus }) {
  const [label, className] = INVITATION[status] ?? [status, tone.muted];
  return <StatusBadge label={label} className={className} />;
}

export function LoginStatusBadge({ status }: { status: LoginStatus }) {
  const [label, className] = LOGIN[status] ?? [status, tone.muted];
  return <StatusBadge label={label} className={className} dot={status === "ONLINE" || status === "IDLE"} />;
}

export const ACCOUNT_STATUS_OPTIONS = Object.entries(ACCOUNT).map(([value, [label]]) => ({ value, label }));
export const INVITATION_STATUS_OPTIONS = Object.entries(INVITATION).map(([value, [label]]) => ({ value, label }));
export const LOGIN_STATUS_OPTIONS = Object.entries(LOGIN).map(([value, [label]]) => ({ value, label }));

/** "24 Nov 2026, 14:05" in the viewer's time zone, or an em dash. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-KE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** "5 min ago", "3 h ago", "2 d ago"; falls back to the date for older values. */
export function formatRelative(value: string | null | undefined, now: number = Date.now()): string {
  if (!value) return "—";
  const at = new Date(value).getTime();
  if (Number.isNaN(at)) return "—";
  const seconds = Math.round((now - at) / 1000);
  if (seconds < 0) return formatDateTime(value);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)} h ago`;
  if (seconds < 7 * 86_400) return `${Math.floor(seconds / 86_400)} d ago`;
  return formatDateTime(value);
}

/** A short device description from a browser's user agent. */
export function describeDevice(agent: string | null | undefined): string {
  if (!agent) return "Unknown device";
  const browser = /Edg\//.test(agent) ? "Edge" : /OPR\//.test(agent) ? "Opera" : /Chrome\//.test(agent) ? "Chrome"
    : /Firefox\//.test(agent) ? "Firefox" : /Safari\//.test(agent) ? "Safari" : /node|undici/i.test(agent) ? "Server" : "Browser";
  const os = /Windows/.test(agent) ? "Windows" : /Android/.test(agent) ? "Android" : /iPhone|iPad/.test(agent) ? "iOS"
    : /Mac OS X/.test(agent) ? "macOS" : /Linux/.test(agent) ? "Linux" : "";
  return os ? `${browser} on ${os}` : browser;
}

const EVENT_LABELS: Record<string, [string, string]> = {
  SIGN_IN: ["Signed in", tone.success],
  SIGN_IN_FAILED: ["Sign-in failed", tone.danger],
  SESSION_REFUSED: ["Session refused", tone.warning],
  LOCKED: ["Locked", tone.danger],
  UNLOCKED: ["Unlocked", tone.info],
  SIGNED_OUT: ["Signed out", tone.muted],
  SESSION_ENDED: ["Session ended", tone.muted],
  FORCED_LOGOUT: ["Forced logout", tone.warning],
  PASSWORD_CHANGED: ["Password changed", tone.info],
  PASSWORD_RESET: ["Password reset", tone.warning],
};

export const EVENT_TYPE_OPTIONS = Object.entries(EVENT_LABELS).map(([value, [label]]) => ({ value, label }));

export function EventBadge({ type }: { type: string }) {
  const [label, className] = EVENT_LABELS[type] ?? [type, tone.muted];
  return <StatusBadge label={label} className={className} />;
}
