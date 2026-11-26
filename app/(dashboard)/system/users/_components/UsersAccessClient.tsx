"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { toast } from "sonner";
import { Download, Loader2, MailPlus, MoreHorizontal, UserPlus, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DataTable } from "@/components/shared/data-table";
import { DataTableColumnHeader } from "@/components/shared/column-header";
import { useCompanyScope } from "@/providers/CompanyScopeProvider";
import { deleteSystemUser, getSystemUser, unlockSysAdminAction, unlockSystemUser } from "@/actions/system";
import {
  activateUser,
  deactivateUser,
  endAllUserSessions,
  getUserDirectory,
  getUserSummary,
  resendInvitation,
  revokeInvitation,
} from "@/actions/usersAccess";
import type { ApiRole, ApiRoleUser } from "@/lib/types/roles";
import type { InvestorOption } from "@/lib/types/investor";
import type { DirectoryQuery, DirectoryRow, OrganisationOptions, Paged, UserSummary } from "@/lib/types/usersAccess";
import { CreateUserSheet } from "./CreateUserSheet";
import { EditUserSheet } from "./editusersheet";
import { InviteUserSheet } from "./InviteUserSheet";
import { SummaryCards } from "./SummaryCards";
import { ConfirmDialog, ResetPasswordDialog, type PendingConfirm } from "./UserActionDialogs";
import {
  ACCOUNT_STATUS_OPTIONS,
  AccountStatusBadge,
  formatDateTime,
  formatRelative,
  INVITATION_STATUS_OPTIONS,
  InvitationBadge,
  LOGIN_STATUS_OPTIONS,
  LoginStatusBadge,
} from "./status";

export type UsersAccessPermissions = {
  createUsers: boolean;
  editUsers: boolean;
  /** May give a user another role (API_SYSTEMUSERSCRUD_ROLE EDIT). */
  changeRoles: boolean;
  deleteUsers: boolean;
  unlock: boolean;
  resetPassword: boolean;
  viewSessions: boolean;
  endSessions: boolean;
  invite: boolean;
  manageInvitations: boolean;
  unlockAdministrators: boolean;
};

type Filters = Required<Pick<DirectoryQuery, "role" | "accountStatus" | "invitationStatus" | "loginStatus" | "company" | "station">> & {
  location: string;
};

const NO_FILTERS: Filters = { role: "", accountStatus: "", invitationStatus: "", loginStatus: "", company: "", station: "", location: "" };

/** Column id → the server's sort key. */
const SORT_KEYS: Record<string, string> = {
  person: "name",
  tenant: "tenant",
  role: "role",
  accountStatus: "accountStatus",
  invitationStatus: "invitationStatus",
  loginStatus: "loginStatus",
  lastLoginAt: "lastLogin",
  lastActiveAt: "lastActivity",
  failedLoginAttempts: "failedAttempts",
};

const selectClass = "h-8 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

export default function UsersAccessClient({
  initialPage,
  initialSummary,
  roles,
  investors,
  organisation,
  isPlatformAdmin,
  platformReach = false,
  requireChangeAfterReset,
  can,
}: {
  initialPage: Paged<DirectoryRow>;
  initialSummary: UserSummary | null;
  roles: ApiRole[];
  investors: InvestorOption[];
  organisation: OrganisationOptions | null;
  isPlatformAdmin: boolean;
  /** The role reaches every company: the create and invite forms ask for the tenant / company. */
  platformReach?: boolean;
  requireChangeAfterReset: boolean;
  can: UsersAccessPermissions;
}) {
  const router = useRouter();
  const { requireCompany, companyCode: selectedCompany, companies, homeCompanyCode } = useCompanyScope();
  // forms start from the selected company, else the account's own
  const companyCode = selectedCompany ?? homeCompanyCode;
  const [page, setPage] = useState(initialPage);
  const [summary, setSummary] = useState(initialSummary);
  const [pageIndex, setPageIndex] = useState(initialPage.number);
  const [pageSize, setPageSize] = useState(initialPage.size || 20);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  // most recent sign-in first, as the API orders it by default
  const [sorting, setSorting] = useState<SortingState>([{ id: "lastLoginAt", desc: true }]);
  const [isPending, startTransition] = useTransition();
  const [loadError, setLoadError] = useState<string | null>(null);
  const requestSequence = useRef(0);

  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editing, setEditing] = useState<ApiRoleUser | null>(null);
  const [resetTarget, setResetTarget] = useState<{ id: number; name: string } | null>(null);
  const [confirm, setConfirm] = useState<PendingConfirm | null>(null);
  const [exporting, setExporting] = useState(false);
  const [sysAdminUnlockOpen, setSysAdminUnlockOpen] = useState(false);
  const [sysAdminUsername, setSysAdminUsername] = useState("");

  const currentQuery = useCallback((): DirectoryQuery => ({
    q: search,
    role: filters.role || undefined,
    accountStatus: filters.accountStatus || undefined,
    invitationStatus: filters.invitationStatus || undefined,
    loginStatus: filters.loginStatus || undefined,
    company: filters.company || undefined,
    station: filters.station || undefined,
    location: filters.location ? Number(filters.location) : undefined,
    sort: sorting[0] ? SORT_KEYS[sorting[0].id] : undefined,
    direction: sorting[0] ? (sorting[0].desc ? "desc" : "asc") : undefined,
  }), [search, filters, sorting]);

  const reload = useCallback(() => {
    const requestId = ++requestSequence.current;
    startTransition(async () => {
      const [list, figures] = await Promise.all([
        getUserDirectory({ ...currentQuery(), page: pageIndex, size: pageSize }),
        getUserSummary(),
      ]);
      if (requestId !== requestSequence.current) return;
      if (!list.success || !list.data) {
        setLoadError(list.message || "The users could not be loaded.");
        return;
      }
      setLoadError(null);
      setPage(list.data);
      if (figures.success && figures.data) setSummary(figures.data);
    });
  }, [currentQuery, pageIndex, pageSize]);

  // search waits for typing to pause; everything else reloads at once (the 250 ms covers both)
  useEffect(() => {
    const timer = setTimeout(reload, 250);
    return () => clearTimeout(timer);
  }, [reload]);

  const setFilter = (key: keyof Filters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value, ...(key === "location" ? { station: "" } : {}) }));
    setPageIndex(0);
  };
  const activeFilterCount = Object.values(filters).filter(Boolean).length + (search ? 1 : 0);

  const nameOf = (row: DirectoryRow) => row.fullName || row.username || row.email || "this person";

  // ── actions ──────────────────────────────────────────────────────────

  const runAction = useCallback(
    async (work: () => Promise<{ success: boolean; message?: string }>, success: string): Promise<string | void> => {
      const result = await work();
      if (!result.success) {
        toast.error(result.message || "The action failed.");
        return result.message || "failed";
      }
      toast.success(success);
      reload();
      router.refresh();
    },
    [reload, router]
  );

  const openEdit = async (row: DirectoryRow) => {
    if (!row.userId) return;
    const res = await getSystemUser(row.userId);
    if (!res.success || !res.data) {
      toast.error("Could not open the user", { description: res.message });
      return;
    }
    setEditing(res.data);
  };

  const actionsFor = (row: DirectoryRow) => {
    const items: React.ReactNode[] = [];
    if (row.kind === "INVITATION") {
      const open = row.invitationStatus === "PENDING" || row.invitationStatus === "EXPIRED";
      if (can.manageInvitations && open && row.invitationId) {
        const id = row.invitationId;
        items.push(
          <DropdownMenuItem key="resend" onClick={() => runAction(() => resendInvitation(id), `Invitation resent to ${row.email}`)}>
            Resend invitation
          </DropdownMenuItem>,
          <DropdownMenuItem key="revoke" className="text-destructive" onClick={() => setConfirm({
            title: "Revoke invitation?",
            description: <>The link sent to <b>{row.email}</b> stops working. You can invite them again later.</>,
            confirmLabel: "Revoke invitation",
            destructive: true,
            run: () => runAction(() => revokeInvitation(id), "Invitation revoked"),
          })}>
            Revoke invitation
          </DropdownMenuItem>
        );
      }
      return items;
    }
    const id = row.userId!;
    const name = nameOf(row);
    items.push(
      <DropdownMenuItem key="view" asChild><Link href={`/system/users/${id}`}>View details</Link></DropdownMenuItem>
    );
    if (can.editUsers) {
      items.push(<DropdownMenuItem key="edit" onClick={() => openEdit(row)}>Edit user or role</DropdownMenuItem>);
    }
    items.push(
      <DropdownMenuItem key="signins" asChild><Link href={`/system/users/${id}#sign-ins`}>Sign-in activity</Link></DropdownMenuItem>
    );
    if (can.viewSessions) {
      items.push(
        <DropdownMenuItem key="sessions" asChild><Link href={`/system/users/${id}#sessions`}>Active sessions</Link></DropdownMenuItem>
      );
    }
    const security: React.ReactNode[] = [];
    if (can.unlock && row.accountStatus === "LOCKED") {
      security.push(
        <DropdownMenuItem key="unlock" onClick={() => setConfirm({
          title: "Unlock account?",
          description: <>{name} can sign in again with their current password. The failed attempts are cleared.</>,
          confirmLabel: "Unlock",
          run: () => runAction(() => unlockSystemUser(id), `${name} can sign in again`),
        })}>
          Unlock account
        </DropdownMenuItem>
      );
    }
    if (can.resetPassword) {
      security.push(<DropdownMenuItem key="reset" onClick={() => setResetTarget({ id, name })}>Reset password</DropdownMenuItem>);
    }
    if (can.endSessions && row.openSessions > 0) {
      security.push(
        <DropdownMenuItem key="logout" onClick={() => setConfirm({
          title: "Sign out of every device?",
          description: <>All {row.openSessions} open session{row.openSessions === 1 ? "" : "s"} of {name} end now. They can sign in again.</>,
          confirmLabel: "Force logout",
          destructive: true,
          run: () => runAction(() => endAllUserSessions(id), `${name} was signed out everywhere`),
        })}>
          Force logout of all sessions
        </DropdownMenuItem>
      );
    }
    if (can.editUsers) {
      security.push(row.accountStatus === "INACTIVE" ? (
        <DropdownMenuItem key="activate" onClick={() => setConfirm({
          title: "Activate account?",
          description: <>{name} will be able to sign in.</>,
          confirmLabel: "Activate",
          run: () => runAction(() => activateUser(id), `${name} is active`),
        })}>
          Activate account
        </DropdownMenuItem>
      ) : (
        <DropdownMenuItem key="deactivate" className="text-destructive" onClick={() => setConfirm({
          title: "Deactivate account?",
          description: <>{name} is signed out of every device and cannot sign in until the account is activated again.</>,
          confirmLabel: "Deactivate",
          destructive: true,
          run: () => runAction(() => deactivateUser(id), `${name} was deactivated`),
        })}>
          Deactivate account
        </DropdownMenuItem>
      ));
    }
    if (security.length) items.push(<DropdownMenuSeparator key="sep1" />, ...security);
    if (can.deleteUsers) {
      items.push(
        <DropdownMenuSeparator key="sep2" />,
        <DropdownMenuItem key="delete" className="text-destructive" onClick={() => setConfirm({
          title: "Delete user?",
          description: <>{name} is deactivated and removed from user lists. Their history and related records remain.</>,
          confirmLabel: "Delete user",
          destructive: true,
          run: () => runAction(async () => {
            const res = await deleteSystemUser(id);
            if (res.success && page.content.length === 1 && pageIndex > 0) setPageIndex((p) => p - 1);
            return res;
          }, "User deleted"),
        })}>
          Delete user
        </DropdownMenuItem>
      );
    }
    return items;
  };

  // ── columns ──────────────────────────────────────────────────────────

  // rebuilt each render: the row actions close over the current filters, page and permissions
  const columns: ColumnDef<DirectoryRow>[] = [
    {
      id: "person",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Person" />,
      enableHiding: false,
      cell: ({ row }) => {
        const r = row.original;
        const name = r.fullName || r.email || "—";
        const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
        const body = (
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {initials || "?"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{name}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {[r.username, r.email].filter(Boolean).join(" · ") || "—"}
              </p>
            </div>
          </div>
        );
        return r.userId ? (
          <Link href={`/system/users/${r.userId}`} className="block max-w-64 rounded-md hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
            {body}
          </Link>
        ) : <div className="max-w-64">{body}</div>;
      },
    },
    {
      id: "tenant",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tenant" />,
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="min-w-0 max-w-48">
            <p className="truncate text-sm">{r.companyName || r.companyCode || <span className="text-muted-foreground">No company</span>}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {[r.stationName, r.locationName].filter(Boolean).join(" · ") || "—"}
            </p>
          </div>
        );
      },
    },
    {
      id: "role",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-sm">
          {row.original.roleName || row.original.roleCode || "—"}
          {row.original.privileged && <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide text-primary">Admin</span>}
        </span>
      ),
    },
    { id: "accountStatus", header: ({ column }) => <DataTableColumnHeader column={column} title="Account Status" />, cell: ({ row }) => <AccountStatusBadge status={row.original.accountStatus} /> },
    { id: "invitationStatus", header: ({ column }) => <DataTableColumnHeader column={column} title="Invitation" />, cell: ({ row }) => <InvitationBadge status={row.original.invitationStatus} /> },
    { id: "loginStatus", header: ({ column }) => <DataTableColumnHeader column={column} title="Login Status" />, cell: ({ row }) => <LoginStatusBadge status={row.original.loginStatus} /> },
    {
      id: "lastLoginAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Last Login" />,
      cell: ({ row }) => <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground" title={formatDateTime(row.original.lastLoginAt)}>{formatRelative(row.original.lastLoginAt)}</span>,
    },
    {
      id: "lastActiveAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Last Activity" />,
      cell: ({ row }) => <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground" title={formatDateTime(row.original.lastActiveAt)}>{formatRelative(row.original.lastActiveAt)}</span>,
    },
    {
      id: "failedLoginAttempts",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Failed Attempts" />,
      cell: ({ row }) => {
        const n = row.original.kind === "USER" ? row.original.failedLoginAttempts : null;
        return <span className={n ? "text-sm font-medium tabular-nums text-destructive" : "text-sm tabular-nums text-muted-foreground"}>{n ?? "—"}</span>;
      },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => {
        const items = actionsFor(row.original);
        if (!items.length) return null;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="size-8 p-0" aria-label={`Actions for ${nameOf(row.original)}`}>
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              {items}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // ── export ───────────────────────────────────────────────────────────

  const exportCsv = async () => {
    setExporting(true);
    try {
      const rows: DirectoryRow[] = [];
      for (let p = 0; p < 50; p += 1) {
        const res = await getUserDirectory({ ...currentQuery(), page: p, size: 100 });
        if (!res.success || !res.data) {
          toast.error("Export failed", { description: res.message });
          return;
        }
        rows.push(...res.data.content);
        if (p + 1 >= res.data.totalPages) break;
      }
      const header = ["Name", "Username", "Email", "Phone", "Tenant", "Station", "Location", "Role", "Account status",
        "Invitation", "Login status", "Last login", "Last activity", "Failed attempts"];
      const cell = (v: unknown) => {
        const text = v === null || v === undefined ? "" : String(v);
        // a leading = + - @ would run as a formula in a spreadsheet
        const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
        return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
      };
      const lines = [header, ...rows.map((r) => [r.fullName, r.username, r.email, r.phoneNumber, r.companyName ?? r.companyCode,
        r.stationName, r.locationName, r.roleName ?? r.roleCode, r.accountStatus, r.invitationStatus, r.loginStatus,
        r.lastLoginAt, r.lastActiveAt, r.kind === "USER" ? r.failedLoginAttempts : ""])].map((line) => line.map(cell).join(","));
      const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${rows.length} ${rows.length === 1 ? "row" : "rows"}`);
    } finally {
      setExporting(false);
    }
  };

  const handleSysAdminUnlock = async () => {
    const result = await unlockSysAdminAction(sysAdminUsername);
    if (!result.success) {
      toast.error("Could not unlock the administrator", { description: result.message });
      return;
    }
    toast.success(`${sysAdminUsername.trim()} can sign in again`);
    setSysAdminUnlockOpen(false);
    setSysAdminUsername("");
  };

  const showTenantFilter = isPlatformAdmin && !selectedCompany && companies.length > 0;
  const stations = organisation?.stations.filter((s) => !filters.location || String(s.locationId) === filters.location) ?? [];

  return (
    <div className="space-y-5">
      <SummaryCards summary={summary} loading={!summary && isPending} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {page.totalElements.toLocaleString()} {page.totalElements === 1 ? "person" : "people"}
          {activeFilterCount > 0 ? " match the filters" : " in this scope"}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {can.unlockAdministrators && (
            <Button variant="ghost" size="sm" onClick={() => setSysAdminUnlockOpen(true)}>Unlock an administrator</Button>
          )}
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={exporting || page.totalElements === 0} className="gap-2">
            {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            Export
          </Button>
          {can.invite && (
            <Button variant="outline" size="sm" className="gap-2"
              onClick={() => (platformReach ? setInviteOpen(true) : requireCompany(() => setInviteOpen(true)))}>
              <MailPlus className="size-4" /> Invite user
            </Button>
          )}
          {can.createUsers && (
            <Button size="sm" className="gap-2"
              // a role that reaches every company chooses the tenant / company in the form itself
              onClick={() => (platformReach ? setCreateOpen(true) : requireCompany(() => setCreateOpen(true)))}>
              <UserPlus className="size-4" /> Create user
            </Button>
          )}
        </div>
      </div>

      {loadError && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <span>{loadError}</span>
          <Button variant="outline" size="sm" onClick={reload}>Try again</Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={page.content}
        getRowId={(r) => (r.userId ? `u-${r.userId}` : `i-${r.invitationId}`)}
        searchPlaceholder="Search name, email, company, station or location…"
        searchValue={search}
        onSearchChange={(value) => { setSearch(value); setPageIndex(0); }}
        manualPagination
        pageCount={Math.max(1, page.totalPages)}
        pageIndex={pageIndex}
        pageSize={pageSize}
        totalRows={page.totalElements}
        onPaginationChange={(next, size) => {
          if (size !== pageSize) setPageSize(size);
          setPageIndex(next);
        }}
        manualSorting
        sorting={sorting}
        onSortingChange={(next) => { setSorting(next); setPageIndex(0); }}
        columnsHiddenUntilLg={["invitationStatus", "lastLoginAt", "failedLoginAttempts"]}
        loading={isPending}
        emptyState={
          <div className="flex flex-col items-center gap-2 py-6">
            <Users className="size-6 text-muted-foreground/60" aria-hidden />
            <p>{activeFilterCount > 0 ? "No one matches these filters." : "No users yet."}</p>
            {activeFilterCount > 0 ? (
              <Button variant="link" size="sm" onClick={() => { setFilters(NO_FILTERS); setSearch(""); setPageIndex(0); }}>Clear filters</Button>
            ) : can.invite ? (
              <Button variant="link" size="sm"
                onClick={() => (platformReach ? setInviteOpen(true) : requireCompany(() => setInviteOpen(true)))}>Invite the first user</Button>
            ) : null}
          </div>
        }
        filters={
          <>
            <select aria-label="Filter by role" value={filters.role} onChange={(e) => setFilter("role", e.target.value)} className={selectClass}>
              <option value="">All roles</option>
              {roles.filter((r) => r.principalType !== "CUSTOMER").map((r) => <option key={r.roleCode} value={r.roleCode}>{r.name}</option>)}
            </select>
            <select aria-label="Filter by account status" value={filters.accountStatus} onChange={(e) => setFilter("accountStatus", e.target.value)} className={selectClass}>
              <option value="">Any account status</option>
              {ACCOUNT_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select aria-label="Filter by invitation" value={filters.invitationStatus} onChange={(e) => setFilter("invitationStatus", e.target.value)} className={selectClass}>
              <option value="">Any invitation</option>
              {INVITATION_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select aria-label="Filter by login status" value={filters.loginStatus} onChange={(e) => setFilter("loginStatus", e.target.value)} className={selectClass}>
              <option value="">Any login status</option>
              {LOGIN_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {showTenantFilter && (
              <select aria-label="Filter by tenant" value={filters.company} onChange={(e) => setFilter("company", e.target.value)} className={selectClass}>
                <option value="">All tenants</option>
                {companies.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            )}
            {organisation && organisation.locations.length > 0 && (
              <select aria-label="Filter by location" value={filters.location} onChange={(e) => setFilter("location", e.target.value)} className={selectClass}>
                <option value="">All locations</option>
                {organisation.locations.map((l) => <option key={l.id} value={String(l.id)}>{l.name}</option>)}
              </select>
            )}
            {organisation && organisation.stations.length > 0 && (
              <select aria-label="Filter by station" value={filters.station} onChange={(e) => setFilter("station", e.target.value)} className={selectClass}>
                <option value="">All stations</option>
                {stations.map((s) => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
              </select>
            )}
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs"
                onClick={() => { setFilters(NO_FILTERS); setSearch(""); setPageIndex(0); }}>
                <X className="size-3.5" /> Clear
              </Button>
            )}
          </>
        }
      />

      <CreateUserSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={reload}
        roles={roles}
        companyId={companyCode}
        investors={investors}
        isPlatformAdmin={isPlatformAdmin}
        organisation={organisation}
        companies={companies}
        canChooseCompany={platformReach}
      />
      <InviteUserSheet
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={reload}
        roles={roles}
        companyId={companyCode}
        organisation={organisation}
        companies={companies}
        canChooseCompany={platformReach}
      />
      <EditUserSheet
        key={editing?.idxno ?? "none"}
        open={Boolean(editing)}
        user={editing}
        onClose={() => setEditing(null)}
        onLinked={reload}
        canLinkInvestor={isPlatformAdmin}
        canChangeRole={can.changeRoles}
        canChangeCompany={isPlatformAdmin}
        investors={investors}
        roles={roles}
        organisation={editing?.companyId && editing.companyId === (companyCode ?? editing.companyId) ? organisation : null}
      />
      <ResetPasswordDialog target={resetTarget} requireChange={requireChangeAfterReset} onClose={() => setResetTarget(null)} onDone={reload} />
      <ConfirmDialog pending={confirm} onClose={() => setConfirm(null)} />

      <Dialog open={sysAdminUnlockOpen} onOpenChange={setSysAdminUnlockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlock a system administrator</DialogTitle>
            <DialogDescription>For a platform administrator locked out after repeated wrong passwords.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="sysadmin-username">Username</Label>
            <Input id="sysadmin-username" value={sysAdminUsername} onChange={(e) => setSysAdminUsername(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSysAdminUnlockOpen(false)}>Cancel</Button>
            <Button onClick={handleSysAdminUnlock} disabled={!sysAdminUsername.trim()}>Unlock</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
