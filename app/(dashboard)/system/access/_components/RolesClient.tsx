"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
 Shield, Users, Plus, Search, ChevronDown,
 Check, Pencil, UserPlus, X, Save, RotateCcw,
 MoreHorizontal, Loader2, Settings, Copy, Trash2,
} from "lucide-react";
import {
 addRoleAction, saveRoleMenusAction, updateRoleAction, duplicateRoleAction, deleteRoleAction, getRoleAssignersAction,
} from "@/actions/roles";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
 Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
 useAppDispatch, useAppSelector,
} from "@/store/hooks";
import {
 initPendingPermissions,
 toggleFlag,
 setGroupPermissions,
 markSaved,
 discardChanges,
 startEditingRole,
 stopEditingRole,
} from "@/store/slices/rolesSlice";
import { NO_PERMISSIONS } from "@/lib/data/nav-constants";
import type { MenuNode } from "@/lib/nav";
import type { PermissionFlags, PermissionMap } from "@/lib/types/roles";
import type { Role, RoleUser, ApiRoleUser } from "./roleTypes";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import {
 DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog, type PendingConfirm } from "../../users/_components/UserActionDialogs";

// ── Role color accent map ──────────────────────────────────────────────
// ── Flag column config ─────────────────────────────────────────────────
// Defines the four permission flags in display order, with labels and colors.
// Keeping this outside the component means the array is created once, not on every render.
const FLAG_COLS: {
 key: keyof PermissionFlags;
 label: string;
 checkedClass: string;
}[] = [
 { key: "canView", label: "View", checkedClass: "data-[state=checked]:bg-primary data-[state=checked]:border-primary" },
 { key: "canCreate", label: "Create", checkedClass: "data-[state=checked]:bg-success data-[state=checked]:border-success" },
 { key: "canEdit", label: "Edit", checkedClass: "data-[state=checked]:bg-warning data-[state=checked]:border-warning" },
 { key: "canDelete", label: "Delete", checkedClass: "data-[state=checked]:bg-danger data-[state=checked]:border-danger" },
];

// ── Permission tree node ───────────────────────────────────────────────
function PermissionNode({
 node,
 roleId,
 permissions,
}: {
 node: MenuNode;
 roleId: string;
 permissions: PermissionMap;
}) {
 const dispatch = useAppDispatch();
 const [expanded, setExpanded] = useState(true);
 const hasChildren = !!(node.children?.length);

 // Every entry in this group (by catalogue id): the parent itself, unless it is only a heading,
 // plus every child. The master checkbox controls all of them together.
 const allRoutes = [...(node.synthetic ? [] : [node.key]), ...(node.children?.map((c) => c.key) ?? [])];

 // allGranted = every route in the group has all four flags true
 const allGranted = allRoutes.every((r) => {
 const f = permissions[r];
 return f?.canView && f?.canCreate && f?.canEdit && f?.canDelete;
 });

 // anyGranted = at least one route can be viewed — drives the indeterminate state
 const anyGranted = allRoutes.some((r) => permissions[r]?.canView);
 const isIndeterminate = !allGranted && anyGranted;

 // Badge: how many children have canView (used for "2/4 visible" counter)
 const viewableChildCount = node.children?.filter((c) => {
 const f = permissions[c.key];
 return f?.canView || f?.canCreate || f?.canEdit || f?.canDelete;
 }).length ?? 0;

 function handleParentToggle(checked: boolean) {
 // Sets ALL four flags on ALL routes in the group to the same value
 dispatch(setGroupPermissions({ roleId, routes: allRoutes, checked }));
 }

 function handleFlagToggle(route: string, flag: keyof PermissionFlags, checked: boolean, independent: boolean) {
 // Screens: turning View off clears the rest. API permissions and rights: each action stands alone.
 dispatch(toggleFlag({ roleId, route, flag, checked, independent }));
 }

 return (
 <div className="border border-border rounded-xl overflow-hidden">

 {/* ── Parent / group header row ─────────────────────────────────── */}
 <div className={cn("flex items-center gap-3 px-4 py-3 bg-card", allGranted && "bg-primary/5")}>
 <Checkbox
 id={`perm-${node.key}`}
 checked={isIndeterminate ? "indeterminate" : allGranted}
 onCheckedChange={(v) => handleParentToggle(v === true)}
 className="data-[state=checked]:bg-primary data-[state=checked]:border-primary
 data-[state=indeterminate]:bg-primary/40 data-[state=indeterminate]:border-primary"
 title={hasChildren ? "Select / deselect all in this group" : node.label}
 />
 <label
 htmlFor={`perm-${node.key}`}
 className="flex-1 text-sm font-semibold text-foreground cursor-pointer select-none"
 >
 {node.label}
 </label>

 {hasChildren && (
 <div className="flex items-center gap-2">
 <span className="text-xs text-muted-foreground">
 {viewableChildCount}/{node.children!.length}
 </span>
 <button
 type="button"
 onClick={() => setExpanded((v) => !v)}
 className="text-muted-foreground hover:text-foreground transition-colors"
 >
 <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", !expanded && "-rotate-90")} />
 </button>
 </div>
 )}
 </div>

 {/* ── Children: column header + one row per child ───────────────── */}
 {hasChildren && expanded && (
 <div className="border-t border-border bg-muted/30">

 {/* Column header — aligns with the checkboxes below */}
 <div className="flex items-center gap-3 px-4 py-1.5 border-b border-border/60">
 <div className="w-4 shrink-0" />
 <span className="flex-1" />
 <div className="flex items-center">
 {FLAG_COLS.map(({ key, label }) => (
 <span
 key={key}
 className="w-13 text-center text-[10px] uppercase font-semibold tracking-wide text-muted-foreground"
 >
 {label}
 </span>
 ))}
 </div>
 </div>

 {/* One row per child menu item */}
 {node.children!.map((child) => {
 const flags = permissions[child.key] ?? NO_PERMISSIONS;
 const independent = (child.kind ?? "MENU") !== "MENU";
 return (
 <div
 key={child.idxno}
 className={cn(
 "flex items-center gap-3 px-4 py-2.5 border-b border-border/40 last:border-0 transition-colors",
 flags.canView && "bg-primary/3"
 )}
 >
 <div className="w-4 shrink-0" />
 <span className="flex-1 text-sm text-foreground">
 {child.label}
 {independent && child.permissionKey && (
 <span className="block font-mono text-[10px] text-muted-foreground">{child.permissionKey}</span>
 )}
 </span>

 {/* The four flag checkboxes */}
 <div className="flex items-center">
 {FLAG_COLS.map(({ key, label, checkedClass }) => {
 // canCreate / canEdit / canDelete are disabled when canView is off —
 // you can't do anything with a page you can't see.
 const isDisabled = !independent && key !== "canView" && !flags.canView;
 return (
 <div key={key} className="w-13 flex justify-center">
 <Checkbox
 checked={flags[key]}
 disabled={isDisabled}
 onCheckedChange={(v) => handleFlagToggle(child.key, key, v === true, independent)}
 className={cn(checkedClass, isDisabled && "opacity-30 cursor-not-allowed")}
 title={label}
 />
 </div>
 );
 })}
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 );
}

// ── Create role sheet ──────────────────────────────────────────────────
function CreateRoleSheet({
 open,
 onClose,
}: {
 open: boolean;
 onClose: () => void;
}) {
 const [roleCode, setRoleCode] = useState("");
 const [name, setName] = useState("");
 const [desc, setDesc] = useState("");
 const [principalType, setPrincipalType] = useState("STAFF");
 const [scopeLevel, setScopeLevel] = useState("STATION");
 const [landingRoute, setLandingRoute] = useState("");
 const [isLoading, setIsLoading] = useState(false);

 function handleClose() {
 setRoleCode(""); setName(""); setDesc(""); setPrincipalType("STAFF"); setScopeLevel("STATION"); setLandingRoute("");
 onClose();
 }

 async function handleCreate() {
 if (!roleCode.trim() || !name.trim()) return;
 setIsLoading(true);
 try {
 const result = await addRoleAction({
 roleCode: roleCode.trim(),
 name: name.trim(),
 description: desc.trim(),
 principalType,
 scopeLevel: principalType === "INVESTOR" ? undefined : scopeLevel,
 landingRoute: landingRoute.trim() || undefined,
 });
 if (result.success) {
 toast.success("Role created", { description: result.message });
 handleClose();
 } else {
 toast.error("Failed to create role", { description: result.message });
 }
 } catch {
 toast.error("Network error", { description: "Could not reach the server." });
 } finally {
 setIsLoading(false);
 }
 }

 return (
 <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
 <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
 <SheetHeader className="px-6 py-5 border-b border-border">
 <SheetTitle>Create New Role</SheetTitle>
 <SheetDescription>
 Define the role; give it permissions on the Permissions tab afterwards. The code cannot change later.
 </SheetDescription>
 </SheetHeader>
 <div className="flex-1 px-6 py-6 space-y-5">
 <div className="space-y-2">
 <Label htmlFor="role-code">Role Code</Label>
 <Input
 id="role-code"
 placeholder="e.g. NETWORK_ADMIN"
 value={roleCode}
 onChange={(e) => setRoleCode(e.target.value)}
 />
 <p className="text-xs text-muted-foreground">2-30 capital letters, digits or _. Permanent.</p>
 </div>
 <div className="space-y-2">
 <Label htmlFor="role-name">Role Name</Label>
 <Input
 id="role-name"
 placeholder="e.g. Network Engineer"
 value={name}
 onChange={(e) => setName(e.target.value)}
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="role-desc">Description</Label>
 <textarea
 id="role-desc"
 rows={3}
 placeholder="What does this role do?"
 value={desc}
 onChange={(e) => setDesc(e.target.value)}
 className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 placeholder:text-muted-foreground transition-[color,box-shadow]"
 />
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div className="space-y-2">
 <Label htmlFor="role-type-new">Type</Label>
 <select id="role-type-new" value={principalType} onChange={(e) => setPrincipalType(e.target.value)}
 className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
 <option value="STAFF">Staff</option>
 <option value="INVESTOR">Investor login</option>
 <option value="CUSTOMER">Customer login</option>
 </select>
 </div>
 <div className="space-y-2">
 <Label htmlFor="role-scope-new">Sees</Label>
 <select id="role-scope-new" value={scopeLevel} disabled={principalType === "INVESTOR"} onChange={(e) => setScopeLevel(e.target.value)}
 className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm disabled:opacity-50">
 <option value="STATION">Their station</option>
 <option value="COMPANY">Their company</option>
 <option value="PLATFORM">Every company</option>
 </select>
 </div>
 </div>
 <div className="space-y-2">
 <Label htmlFor="role-landing-new">Landing page</Label>
 <Input id="role-landing-new" placeholder="/customers (blank: first menu entry)" value={landingRoute}
 onChange={(e) => setLandingRoute(e.target.value)} />
 </div>
 </div>
 <div className="px-6 py-4 border-t border-border flex gap-3">
 <Button
 className="flex-1"
 disabled={!roleCode.trim() || !name.trim() || isLoading}
 onClick={handleCreate}
 >
 {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Role"}
 </Button>
 <Button variant="outline" onClick={handleClose} disabled={isLoading}>
 Cancel
 </Button>
 </div>
 </SheetContent>
 </Sheet>
 );
}

// ── Assign user sheet ──────────────────────────────────────────────────
function AssignUserSheet({
 open,
 onClose,
 roleName,
 availableUsers,
}: {
 open: boolean;
 onClose: () => void;
 roleName: string;
 availableUsers: ApiRoleUser[];
}) {
 const [query, setQuery] = useState("");

 const filtered = availableUsers.filter(
 (u) =>
 !query ||
 u.fullName.toLowerCase().includes(query.toLowerCase()) ||
 u.email.toLowerCase().includes(query.toLowerCase()) ||
 u.username.toLowerCase().includes(query.toLowerCase())
 );


 

 return (
 <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
 <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
 <SheetHeader className="px-6 py-5 border-b border-border">
 <SheetTitle>Assign User</SheetTitle>
 <SheetDescription>
 Add a staff member to the <strong>{roleName}</strong> role.
 </SheetDescription>
 </SheetHeader>
 <div className="px-6 py-4 border-b border-border">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <Input
 placeholder="Search by name, email or username…"
 value={query}
 onChange={(e) => setQuery(e.target.value)}
 className="pl-9"
 />
 </div>
 </div>
 <ScrollArea className="flex-1">
 <div className="px-6 py-3 space-y-1">
 {filtered.length === 0 && (
 <p className="text-sm text-muted-foreground text-center py-8">
 {availableUsers.length === 0 ? "All system users are already in this role." : "No users match your search."}
 </p>
 )}
 {filtered.map((u) => {
 const initials =
 (u.fname?.[0] ?? "U").toUpperCase() +
 (u.middleName?.[0] ?? "").toUpperCase();
 return (
 <div
 key={u.idxno}
 className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
 >
 <Avatar className="h-8 w-8 shrink-0">
 <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
 {initials}
 </AvatarFallback>
 </Avatar>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-medium text-foreground truncate">{u.fullName}</p>
 <p className="text-xs text-muted-foreground truncate">{u.email}</p>
 </div>
 <Button size="sm" variant="outline" className="shrink-0 h-7" disabled
 title="Assigning users to a role is not available yet."
 >
 Assign
 </Button>
 </div>
 );
 })}
 </div>
 </ScrollArea>
 </SheetContent>
 </Sheet>
 );
}

// ── Users tab ──────────────────────────────────────────────────────────
function UsersTab({
 users,
 roleName,
 allSystemUsers,
}: {
 users: RoleUser[];
 roleName: string;
 allSystemUsers: ApiRoleUser[];
}) {
 const [assignOpen, setAssignOpen] = useState(false);

 // Only show users not already assigned to this role
 const assignedIds = new Set(users.map((u) => u.id));
 const availableUsers = allSystemUsers.filter((u) => !assignedIds.has(u.userId));

 return (
 <>
 <div className="flex items-center justify-between mb-4">
 <p className="text-sm text-muted-foreground">
 {users.length} {users.length === 1 ? "member" : "members"} in this role
 </p>
 <Button size="sm" className="h-8 gap-1.5" onClick={() => setAssignOpen(true)}>
 <UserPlus className="w-3.5 h-3.5" />
 Assign User
 </Button>
 </div>

 <div className="rounded-xl border border-border overflow-hidden">
 {/* Header */}
 <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 px-4 py-2.5 bg-muted/50 border-b border-border">
 <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</span>
 <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</span>
 <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</span>
 <span className="w-8" />
 </div>

 {users.length === 0 && (
 <div className="px-4 py-10 text-center text-sm text-muted-foreground">
 No users assigned to this role yet.
 </div>
 )}

 {users.map((user, i) => (
 <div
 key={user.id}
 className={cn(
 "grid grid-cols-[1fr_1fr_auto_auto] gap-4 items-center px-4 py-3",
 i < users.length - 1 && "border-b border-border"
 )}
 >
 <div className="flex items-center gap-2.5 min-w-0">
 <Avatar className="h-7 w-7 shrink-0">
 <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
 {user.initials}
 </AvatarFallback>
 </Avatar>
 <span className="text-sm font-medium text-foreground truncate">{user.name}</span>
 </div>
 <span className="text-sm text-muted-foreground truncate">{user.email}</span>
 <Badge
 variant="outline"
 className={cn(
 "text-[10px] px-2 py-0.5 font-medium",
 user.status === "active"
 ? "bg-success/10 text-success border-success/20"
 : "bg-muted text-muted-foreground border-border"
 )}
 >
 {user.status === "active" ? "Active" : "Inactive"}
 </Badge>
 <button
 type="button"
 aria-label={`Remove ${user.name}`}
 disabled
 title="Removing users from a role is not available yet."
 className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground/40 cursor-not-allowed"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 </div>
 ))}
 </div>

 <AssignUserSheet
 open={assignOpen}
 onClose={() => setAssignOpen(false)}
 roleName={roleName}
 availableUsers={availableUsers}
 />
 </>
 );
}

// ── Display tree ───────────────────────────────────────────────────────
/**
 * Screens (MENU entries) keep the catalogue tree. API permissions and named rights have no route
 * and no parent: they are grouped under one heading per module so the matrix stays readable.
 */
function buildDisplayTree(menuTree: MenuNode[]): MenuNode[] {
 const screens = menuTree.filter((n) => (n.kind ?? "MENU") === "MENU");
 const groups = new Map<string, MenuNode[]>();
 for (const node of menuTree) {
 const kind = node.kind ?? "MENU";
 if (kind === "MENU") continue;
 const heading = (kind === "RIGHT" ? "Rights · " : "API · ") + (node.module || "General");
 const list = groups.get(heading) ?? [];
 list.push({ ...node, children: undefined });
 groups.set(heading, list);
 }
 const synthetic: MenuNode[] = [...groups.entries()]
 .sort(([a], [b]) => (a.startsWith("Rights") === b.startsWith("Rights") ? a.localeCompare(b) : a.startsWith("Rights") ? 1 : -1))
 .map(([heading, children], i) => ({
 idxno: -1 - i,
 menuItemId: 0,
 key: `group:${heading}`,
 kind: "GROUP",
 synthetic: true,
 route: "",
 label: heading,
 icon: "",
 children: children.sort((a, b) => a.label.localeCompare(b.label)),
 }));
 return [...screens, ...synthetic];
}

// ── Role settings tab ──────────────────────────────────────────────────
function RoleSettingsTab({ role, roles }: { role: Role; roles: Role[] }) {
 const [description, setDescription] = useState(role.description ?? "");
 const [principalType, setPrincipalType] = useState(role.principalType);
 const [scopeLevel, setScopeLevel] = useState(role.scopeLevel ?? "");
 const [landingRoute, setLandingRoute] = useState(role.landingRoute ?? "");
 const [isActive, setIsActive] = useState(role.isActive);
 const [assigners, setAssigners] = useState<string[] | null>(null);
 const [saving, setSaving] = useState(false);
 const [copyCode, setCopyCode] = useState("");
 const [copyName, setCopyName] = useState("");
 const [confirmDelete, setConfirmDelete] = useState(false);

 // The form starts from the role (the tab is remounted per role, see key= below);
 // only who-may-assign is loaded from the API.
 useEffect(() => {
 let live = true;
 getRoleAssignersAction(role.idxno).then((codes) => { if (live) setAssigners(codes); });
 return () => { live = false; };
 }, [role.idxno]);

 const others = roles.filter((r) => r.id !== role.id && !r.isSuperAdmin && r.principalType === "STAFF");

 async function save() {
 setSaving(true);
 const res = await updateRoleAction(role.idxno, role.id, {
 description,
 principalType: role.isSystem ? undefined : principalType,
 scopeLevel: role.isSuperAdmin ? undefined : scopeLevel || undefined,
 landingRoute,
 isActive: role.isSuperAdmin ? undefined : isActive,
 assignableBy: role.isSuperAdmin || assigners === null ? undefined : assigners,
 });
 setSaving(false);
 if (res.success) toast.success("Role saved", { description: "Applies to the role's users on their next request." });
 else toast.error("Role not saved", { description: res.message });
 }

 async function duplicate() {
 if (!copyCode.trim() || !copyName.trim()) return;
 const res = await duplicateRoleAction(role.idxno, copyCode.trim(), copyName.trim());
 if (res.success) {
 toast.success("Role copied", { description: `${copyName} has every permission of ${role.name}.` });
 setCopyCode(""); setCopyName("");
 } else toast.error("Role not copied", { description: res.message });
 }

 async function remove() {
 if (!confirmDelete) { setConfirmDelete(true); return; }
 const res = await deleteRoleAction(role.idxno);
 if (res.success) toast.success("Role deleted");
 else toast.error("Role not deleted", { description: res.message });
 setConfirmDelete(false);
 }

 const select = "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm disabled:opacity-50";
 return (
 <div className="space-y-6 max-w-xl">
 <div className="grid gap-4 sm:grid-cols-2">
 <div className="space-y-1.5 sm:col-span-2">
 <Label>Code</Label>
 <p className="font-mono text-sm">{role.id}{role.isSystem && <Badge variant="outline" className="ml-2 text-[10px]">built-in</Badge>}</p>
 </div>
 <div className="space-y-1.5 sm:col-span-2">
 <Label htmlFor="role-description">Description</Label>
 <Input id="role-description" value={description} onChange={(e) => setDescription(e.target.value)} />
 </div>
 <div className="space-y-1.5">
 <Label htmlFor="role-type">Type</Label>
 <select id="role-type" className={select} value={principalType} disabled={role.isSystem}
 onChange={(e) => setPrincipalType(e.target.value)}>
 <option value="STAFF">Staff</option>
 <option value="INVESTOR">Investor login</option>
 <option value="CUSTOMER">Customer login</option>
 </select>
 </div>
 <div className="space-y-1.5">
 <Label htmlFor="role-scope">Sees</Label>
 <select id="role-scope" className={select} value={scopeLevel} disabled={role.isSuperAdmin}
 onChange={(e) => setScopeLevel(e.target.value)}>
 <option value="">(investor records only)</option>
 <option value="STATION">Their station (else their company)</option>
 <option value="COMPANY">Their whole company</option>
 <option value="PLATFORM">Every company</option>
 </select>
 </div>
 <div className="space-y-1.5 sm:col-span-2">
 <Label htmlFor="role-landing">Landing page</Label>
 <Input id="role-landing" placeholder="/customers (blank: first menu entry)" value={landingRoute}
 onChange={(e) => setLandingRoute(e.target.value)} />
 </div>
 <label className="flex items-center gap-2 text-sm sm:col-span-2">
 <Checkbox checked={isActive} disabled={role.isSuperAdmin} onCheckedChange={(v) => setIsActive(v === true)} />
 Active (an inactive role grants nothing and cannot be assigned)
 </label>
 </div>

 {!role.isSuperAdmin && (
 <div className="space-y-2">
 <Label>Who may assign this role</Label>
 <p className="text-xs text-muted-foreground">The super admin always may. Roles that work across companies are assigned by the super admin only.</p>
 {assigners === null ? <Loader2 className="w-4 h-4 animate-spin" /> : (
 <div className="flex flex-wrap gap-3">
 {others.map((r) => (
 <label key={r.id} className="flex items-center gap-1.5 text-sm">
 <Checkbox checked={assigners.includes(r.id)}
 onCheckedChange={(v) => setAssigners((cur) => (v === true ? [...(cur ?? []), r.id] : (cur ?? []).filter((c) => c !== r.id)))} />
 {r.name}
 </label>
 ))}
 </div>
 )}
 </div>
 )}

 <Button onClick={save} disabled={saving} className="gap-2">
 {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save settings
 </Button>

 {!role.isSuperAdmin && (
 <div className="space-y-2 border-t border-border pt-5">
 <Label>Duplicate</Label>
 <div className="flex flex-wrap gap-2">
 <Input className="w-40" placeholder="NEW_CODE" value={copyCode} onChange={(e) => setCopyCode(e.target.value)} />
 <Input className="w-56" placeholder="Name of the copy" value={copyName} onChange={(e) => setCopyName(e.target.value)} />
 <Button variant="outline" className="gap-2" disabled={!copyCode.trim() || !copyName.trim()} onClick={duplicate}>
 <Copy className="w-4 h-4" /> Copy role
 </Button>
 </div>
 </div>
 )}

 {!role.isSystem && (
 <div className="space-y-2 border-t border-border pt-5">
 <Label>Delete</Label>
 <p className="text-xs text-muted-foreground">Only a role nobody holds can be deleted; move its users first, or deactivate it.</p>
 <Button variant="outline" className="gap-2 text-destructive" onClick={remove}>
 <Trash2 className="w-4 h-4" /> {confirmDelete ? "Click again to delete " + role.name : "Delete role"}
 </Button>
 </div>
 )}
 </div>
 );
}

// ── Permissions tab ────────────────────────────────────────────────────
function PermissionsTab({
  role,
  menuTree,
  canMutate,
}: {
  role: Role;
  menuTree: MenuNode[];
  canMutate: boolean;
}) {
 const dispatch = useAppDispatch();
 const pending = useAppSelector((s) => s.roles.pendingPermissions[role.id]);
 const isDirty = useAppSelector((s) => s.roles.dirtyRoles[role.id]);
 const permissions = pending ?? role.permissions;
 const [isSaving, setIsSaving] = useState(false);


 

 // Seed Redux when role changes
 useEffect(() => {
 dispatch(initPendingPermissions({ roleId: role.id, permissions: role.permissions }));
 }, [role.id, role.permissions, dispatch]);

 // Screens keep their tree; API permissions and rights (no route) are grouped by module.
 const displayTree = buildDisplayTree(menuTree);

 // Every real catalogue entry (headings excluded), for counting and the save payload
 function flattenTree() {
 const nodes: Array<{ route: string; menuItemId: number }> = [];
 for (const node of displayTree) {
 if (!node.synthetic) nodes.push({ route: node.key, menuItemId: node.menuItemId });
 for (const child of node.children ?? []) {
 nodes.push({ route: child.key, menuItemId: child.menuItemId });
 }
 }
 return nodes;
 }
 const entries = flattenTree();
 const totalGranted = entries.filter(({ route }) => {
 const f = permissions[route];
 return f?.canView || f?.canCreate || f?.canEdit || f?.canDelete;
 }).length;
 const totalPossible = entries.length;

async function handleSave() {
  // R-17: menu/permission assignments are SYSADMIN-only. Never submit on
  // behalf of a read-only caller.
  if (!canMutate) {
  toast.error("Only the super admin can save permission changes.");
  return;
  }
  setIsSaving(true);
 try {
 // Send the actual per-flag values the admin set — no longer mirrors one boolean
 const assignments = flattenTree().map(({ route, menuItemId }) => {
 const flags = permissions[route] ?? NO_PERMISSIONS;
 return {
 menuItemId,
 canView: flags.canView,
 canCreate: flags.canCreate,
 canEdit: flags.canEdit,
 canDelete: flags.canDelete,
 };
 });

 const { success, failed, message } = await saveRoleMenusAction(role.id, assignments);

 if (failed === 0) {
 toast.success("Permissions saved", {
 description: `${success} item${success !== 1 ? "s" : ""} updated. People with this role see the change when they next load a page.`,
 });
 dispatch(markSaved(role.id));
 } else {
 // the save is all or nothing: nothing was changed
 toast.error("Permissions not saved", {
 description: message || "Nothing was changed. Try again.",
 });
 }
 } catch {
 toast.error("Network error", { description: "Could not reach the server." });
 } finally {
 setIsSaving(false);
 }
 }

 if (role.isSuperAdmin) {
 return (
 <div className="rounded-xl border border-border bg-muted/30 p-5 text-sm text-muted-foreground">
 <p className="font-medium text-foreground">This is the super admin role.</p>
 <p className="mt-1">
 It holds every permission by its role flag, in every company, and cannot be narrowed,
 deactivated or deleted. Create a role scoped to the platform for administrators who should
 only have the permissions you grant.
 </p>
 </div>
 );
 }

 return (
 <div className="space-y-4">
 {/* Summary + actions */}
 <div className="flex items-center justify-between">
 <p className="text-sm text-muted-foreground">
 <span className="font-semibold text-foreground billing-table">{totalGranted}</span>
 {" "}of{" "}
 <span className="font-semibold text-foreground billing-table">{totalPossible}</span>
 {" "}permissions granted
 </p>
{isDirty && canMutate && (
  <div className="flex items-center gap-2">
  <Badge className="bg-warning/15 text-warning border-warning/30 text-xs">
  Unsaved changes
  </Badge>
  <Button
  size="sm"
  variant="outline"
  className="h-7 text-xs gap-1"
  disabled={isSaving}
  onClick={() => dispatch(discardChanges(role.id))}
  >
  <RotateCcw className="w-3 h-3" />
  Discard
  </Button>
  <Button
  size="sm"
  className="h-7 text-xs gap-1"
  disabled={isSaving}
  onClick={handleSave}
  >
  {isSaving
  ? <Loader2 className="w-3 h-3 animate-spin" />
  : <Save className="w-3 h-3" />
  }
  {isSaving ? "Saving…" : "Save"}
  </Button>
  </div>
  )}
 </div>

 {/* Permission tree */}
 <ScrollArea className="max-h-[calc(100vh-400px)] border border-border rounded-xl overflow-y-auto p-4 ">
 <div className="space-y-3 pr-1">
 {displayTree.map((node) => (
 <PermissionNode
 key={node.key}
 node={node}
 roleId={role.id}
 permissions={permissions}
 />
 ))}
 </div>
 </ScrollArea>
 </div>
 );
}

// ── Role card (left panel) ─────────────────────────────────────────────
const TYPE_LABELS: Record<string, string> = { STAFF: "Staff", INVESTOR: "Network Partner", CUSTOMER: "Customer" };
const REACH_LABELS: Record<string, string> = { PLATFORM: "All companies", COMPANY: "Whole company", STATION: "Station" };

type DetailTab = "permissions" | "users" | "settings";

export default function RolesClient({
  roles,
  menuTree,
  allSystemUsers,
  canMutate = true,
}: {
  roles: Role[];
  menuTree: MenuNode[];
  allSystemUsers: ApiRoleUser[];
  canMutate?: boolean;
}) {
  const dispatch = useAppDispatch();
  const editingId = useAppSelector((s) => s.roles.editingRoleId);
  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<{ id: string; tab: DetailTab } | null>(null);
  const [confirm, setConfirm] = useState<PendingConfirm | null>(null);
  const [duplicateOf, setDuplicateOf] = useState<Role | null>(null);
  const [copyCode, setCopyCode] = useState("");
  const [copyName, setCopyName] = useState("");
  const [copying, setCopying] = useState(false);
  const [editName, setEditName] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  // read-only viewers never see the super admin role
  const visibleRoles = canMutate ? roles : roles.filter((r) => !r.isSuperAdmin);
  const filteredRoles = visibleRoles.filter((r) => {
    const q = searchQuery.trim().toLowerCase();
    return !q || r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
  });
  const selectedRole = detail ? visibleRoles.find((r) => r.id === detail.id) : undefined;

  function open(role: Role, tab: DetailTab) {
    dispatch(stopEditingRole());
    setDetail({ id: role.id, tab });
  }

  function handleStartEdit(role: Role) {
    if (!canMutate) return;
    setEditName(role.name);
    dispatch(startEditingRole(role.id));
    setTimeout(() => editInputRef.current?.focus(), 50);
  }

  async function handleSaveEdit() {
    if (!canMutate || !selectedRole || !editName.trim()) return;
    const res = await updateRoleAction(selectedRole.idxno, selectedRole.id, { name: editName.trim() });
    if (res.success) toast.success("Role renamed");
    else toast.error("Role not renamed", { description: res.message });
    dispatch(stopEditingRole());
  }

  async function handleDuplicate() {
    if (!duplicateOf || !copyCode.trim() || !copyName.trim()) return;
    setCopying(true);
    try {
      const res = await duplicateRoleAction(duplicateOf.idxno, copyCode.trim().toUpperCase(), copyName.trim());
      if (!res.success) {
        toast.error("Role not copied", { description: res.message });
        return;
      }
      toast.success("Role copied", { description: `${copyName.trim()} has the same type, reach and permissions.` });
      setDuplicateOf(null);
    } finally {
      setCopying(false);
    }
  }

  const run = async (work: () => Promise<{ success: boolean; message?: string }>, done: string): Promise<string | void> => {
    const res = await work();
    if (!res.success) {
      toast.error(res.message || "The action failed.");
      return res.message || "failed";
    }
    toast.success(done);
  };

  const columns: ColumnDef<Role>[] = [
    {
      id: "role",
      header: "Role",
      cell: ({ row }) => {
        const r = row.original;
        return (
          <button type="button" onClick={() => open(r, "permissions")}
            className="block max-w-72 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-md">
            <span className="flex items-center gap-1.5">
              <span className="truncate text-sm font-medium text-foreground hover:underline">{r.name}</span>
              {r.isSuperAdmin && <Badge variant="outline" className="text-[10px]">super admin</Badge>}
              {r.isSystem && !r.isSuperAdmin && <Badge variant="outline" className="text-[10px]">built in</Badge>}
            </span>
            <span className="block truncate text-[11px] text-muted-foreground">
              <span className="font-mono">{r.id}</span>{r.description ? ` · ${r.description}` : ""}
            </span>
          </button>
        );
      },
    },
    {
      id: "type",
      header: "Type",
      cell: ({ row }) => <span className="whitespace-nowrap text-sm">{TYPE_LABELS[row.original.principalType] ?? row.original.principalType}</span>,
    },
    {
      id: "reach",
      header: "Reach",
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-sm">
          {row.original.isSuperAdmin ? "All companies" : REACH_LABELS[row.original.scopeLevel ?? ""] ?? "Own scope"}
        </span>
      ),
    },
    {
      id: "members",
      header: "Members",
      cell: ({ row }) => (
        <button type="button" onClick={() => open(row.original, "users")}
          className="inline-flex items-center gap-1.5 rounded-md text-sm tabular-nums hover:underline">
          <Users className="size-3.5 text-muted-foreground" aria-hidden /> {row.original.userCount}
        </button>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => row.original.isActive
        ? <Badge variant="outline" className="text-[11px] font-medium bg-success/10 text-success border-success/25">Active</Badge>
        : <Badge variant="outline" className="text-[11px] font-medium bg-muted text-muted-foreground border-border">Inactive</Badge>,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      enableHiding: false,
      cell: ({ row }) => {
        const r = row.original;
        const deletable = canMutate && !r.isSystem && !r.isSuperAdmin && r.userCount === 0;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="size-8 p-0" aria-label={`Actions for ${r.name}`}>
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => open(r, "permissions")}>
                {canMutate && !r.isSuperAdmin ? "Edit permissions" : "View permissions"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => open(r, "users")}>View members</DropdownMenuItem>
              {canMutate && (
                <>
                  <DropdownMenuItem onClick={() => open(r, "settings")}>Edit details</DropdownMenuItem>
                  {!r.isSuperAdmin && (
                    <DropdownMenuItem onClick={() => {
                      setCopyCode(`${r.id}_COPY`.slice(0, 30));
                      setCopyName(`${r.name} (copy)`.slice(0, 50));
                      setDuplicateOf(r);
                    }}>Duplicate</DropdownMenuItem>
                  )}
                  {!r.isSuperAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className={r.isActive ? "text-destructive" : undefined} onClick={() => setConfirm(r.isActive ? {
                        title: `Deactivate ${r.name}?`,
                        description: <>An inactive role grants nothing and cannot be newly assigned. Its {r.userCount} member{r.userCount === 1 ? "" : "s"} lose its permissions until it is activated again.</>,
                        confirmLabel: "Deactivate",
                        destructive: true,
                        run: () => run(() => updateRoleAction(r.idxno, r.id, { isActive: false }), `${r.name} deactivated`),
                      } : {
                        title: `Activate ${r.name}?`,
                        description: <>Its members get its permissions again, and it can be assigned.</>,
                        confirmLabel: "Activate",
                        run: () => run(() => updateRoleAction(r.idxno, r.id, { isActive: true }), `${r.name} activated`),
                      })}>
                        {r.isActive ? "Deactivate" : "Activate"}
                      </DropdownMenuItem>
                    </>
                  )}
                  {deletable && (
                    <DropdownMenuItem className="text-destructive" onClick={() => setConfirm({
                      title: `Delete ${r.name}?`,
                      description: <>The role and its permissions are removed for good. Only a custom role with no members can be deleted.</>,
                      confirmLabel: "Delete role",
                      destructive: true,
                      run: () => run(() => deleteRoleAction(r.idxno), `${r.name} deleted`),
                    })}>
                      Delete
                    </DropdownMenuItem>
                  )}
                  {!deletable && !r.isSystem && !r.isSuperAdmin && (
                    <DropdownMenuItem disabled>Delete (move its members first)</DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-normal text-foreground">Roles &amp; Permissions</h2>
          <p className="text-sm text-muted-foreground">
            {visibleRoles.length} roles. Open a role to set what it may view, create, edit and delete.
          </p>
        </div>
        {canMutate && (
          <Button className="h-9 gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            New role
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filteredRoles}
        getRowId={(r) => r.id}
        searchPlaceholder="Search roles by name, code or description…"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        manualFiltering
        columnsHiddenUntilLg={["type"]}
        emptyState={
          <div className="flex flex-col items-center gap-2 py-6">
            <Shield className="size-6 text-muted-foreground/60" aria-hidden />
            <p>{searchQuery ? "No roles match your search." : "No roles yet."}</p>
          </div>
        }
      />

      <Sheet open={Boolean(selectedRole)} onOpenChange={(v) => { if (!v) { setDetail(null); dispatch(stopEditingRole()); } }}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-3xl">
          {selectedRole && (
            <>
              <SheetHeader className="border-b border-border px-6 py-5">
                {editingId === selectedRole.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      ref={editInputRef}
                      value={editName}
                      aria-label="Role name"
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit();
                        if (e.key === "Escape") dispatch(stopEditingRole());
                      }}
                      className="w-56 border-b-2 border-primary bg-transparent text-lg font-bold text-foreground outline-none"
                    />
                    <button type="button" onClick={() => handleSaveEdit()} aria-label="Save name" className="text-success hover:text-success/80">
                      <Check className="size-4" />
                    </button>
                    <button type="button" onClick={() => dispatch(stopEditingRole())} aria-label="Cancel" className="text-muted-foreground hover:text-foreground">
                      <X className="size-4" />
                    </button>
                  </div>
                ) : (
                  <SheetTitle className="flex items-center gap-2">
                    {selectedRole.name}
                    {!selectedRole.isActive && <Badge variant="outline" className="text-[10px]">inactive</Badge>}
                    {selectedRole.isSuperAdmin && <Badge variant="outline" className="text-[10px]">super admin</Badge>}
                    {canMutate && (
                      <button type="button" onClick={() => handleStartEdit(selectedRole)} aria-label="Rename role"
                        className="text-muted-foreground hover:text-foreground">
                        <Pencil className="size-3.5" />
                      </button>
                    )}
                  </SheetTitle>
                )}
                <SheetDescription>
                  <span className="font-mono">{selectedRole.id}</span>
                  {" · "}{TYPE_LABELS[selectedRole.principalType] ?? selectedRole.principalType}
                  {" · "}{selectedRole.isSuperAdmin ? "All companies" : REACH_LABELS[selectedRole.scopeLevel ?? ""] ?? "Own scope"}
                  {selectedRole.description ? ` · ${selectedRole.description}` : ""}
                </SheetDescription>
              </SheetHeader>
              <Tabs value={detail?.tab ?? "permissions"} onValueChange={(v) => setDetail({ id: selectedRole.id, tab: v as DetailTab })}
                className="flex flex-1 flex-col overflow-hidden">
                <div className="border-b border-border px-6">
                  <TabsList className="h-auto gap-6 rounded-none bg-transparent p-0">
                    <TabsTrigger value="permissions"
                      className="rounded-none bg-transparent px-0 pb-3 pt-3 text-sm font-medium text-muted-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none">
                      <Shield className="mr-1.5 size-3.5" /> Permissions
                    </TabsTrigger>
                    <TabsTrigger value="users"
                      className="rounded-none bg-transparent px-0 pb-3 pt-3 text-sm font-medium text-muted-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none">
                      <Users className="mr-1.5 size-3.5" /> Members
                      <Badge variant="outline" className="ml-1.5 h-4 border-border bg-muted px-1.5 text-[10px]">{selectedRole.users.length}</Badge>
                    </TabsTrigger>
                    {canMutate && (
                      <TabsTrigger value="settings"
                        className="rounded-none bg-transparent px-0 pb-3 pt-3 text-sm font-medium text-muted-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none">
                        <Settings className="mr-1.5 size-3.5" /> Details
                      </TabsTrigger>
                    )}
                  </TabsList>
                </div>
                <TabsContent value="permissions" className="mt-0 flex-1 overflow-hidden px-6 py-5">
                  <PermissionsTab role={selectedRole} menuTree={menuTree} canMutate={canMutate} />
                </TabsContent>
                <TabsContent value="users" className="mt-0 flex-1 overflow-auto px-6 py-5">
                  <UsersTab users={selectedRole.users} roleName={selectedRole.name} allSystemUsers={allSystemUsers} />
                </TabsContent>
                {canMutate && (
                  <TabsContent value="settings" className="mt-0 flex-1 overflow-auto px-6 py-5">
                    <RoleSettingsTab key={selectedRole.id} role={selectedRole} roles={roles} />
                  </TabsContent>
                )}
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={Boolean(duplicateOf)} onOpenChange={(v) => !v && !copying && setDuplicateOf(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate {duplicateOf?.name}</DialogTitle>
            <DialogDescription>The copy gets the same type, reach and permissions, and no members.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="copy-code">Role code</Label>
              <Input id="copy-code" value={copyCode} onChange={(e) => setCopyCode(e.target.value.toUpperCase())}
                placeholder="e.g. FIELD_SUPPORT" aria-describedby="copy-code-help" />
              <p id="copy-code-help" className="text-xs text-muted-foreground">2–30 capital letters, digits or _. It cannot change later.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="copy-name">Role name</Label>
              <Input id="copy-name" value={copyName} onChange={(e) => setCopyName(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateOf(null)} disabled={copying}>Cancel</Button>
            <Button onClick={handleDuplicate} disabled={copying || !/^[A-Z0-9_]{2,30}$/.test(copyCode.trim()) || !copyName.trim()}>
              {copying ? <Loader2 className="size-4 animate-spin" /> : "Duplicate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog pending={confirm} onClose={() => setConfirm(null)} />
      {canMutate && <CreateRoleSheet open={createOpen} onClose={() => setCreateOpen(false)} />}
    </>
  );
}
