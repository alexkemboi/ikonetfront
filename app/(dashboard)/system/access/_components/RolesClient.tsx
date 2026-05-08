"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  Shield, Users, Plus, Search, ChevronDown,
  Check, Pencil, UserPlus, X, Save, RotateCcw,
  MoreHorizontal, CheckCircle2, Loader2,
} from "lucide-react";
import { addRoleAction, saveRoleMenusAction } from "@/actions/roles";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  togglePermission,
  setGroupPermissions,
  markSaved,
  discardChanges,
  startEditingRole,
  stopEditingRole,
} from "@/store/slices/rolesSlice";
import type { MenuNode } from "@/lib/nav";
import type { Role, RoleUser, ApiRoleUser } from "../page";

// ── Role color accent map ──────────────────────────────────────────────
const ROLE_COLORS: Record<string, string> = {
  admin:      "bg-primary/10 text-primary border-primary/20",
  finance:    "bg-success/10 text-success border-success/20",
  management: "bg-warning/10 text-warning border-warning/20",
  support:    "bg-warning/10 text-warning border-warning/20",
  "cs-agent": "bg-muted text-muted-foreground border-border",
};

// ── Permission tree helpers ────────────────────────────────────────────
function getAllIds(node: MenuNode): string[] {
  return [node.id, ...(node.children?.map((c) => c.id) ?? [])];
}

// ── Permission tree node ───────────────────────────────────────────────
function PermissionNode({
  node,
  roleId,
  permissions,
}: {
  node: MenuNode;
  roleId: string;
  permissions: string[];
}) {
  const dispatch = useAppDispatch();
  const [expanded, setExpanded] = useState(true);

  const childIds     = node.children?.map((c) => c.id) ?? [];
  const checkedCount = childIds.filter((id) => permissions.includes(id)).length;
  const parentChecked   = permissions.includes(node.id);
  const allChecked      = node.children ? checkedCount === childIds.length && parentChecked : parentChecked;
  const isIndeterminate = node.children ? (checkedCount > 0 || parentChecked) && !allChecked : false;

  function handleParentToggle(checked: boolean) {
    const ids = getAllIds(node);
    dispatch(setGroupPermissions({ roleId, permissionIds: ids, checked }));
  }

  function handleChildToggle(id: string, checked: boolean) {
    dispatch(togglePermission({ roleId, permissionId: id, checked }));
    // If unchecking a child, also uncheck the parent group header
    if (!checked) {
      dispatch(togglePermission({ roleId, permissionId: node.id, checked: false }));
    }
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Parent row */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 bg-card",
          allChecked && "bg-primary/5"
        )}
      >
        <Checkbox
          id={`perm-${node.id}`}
          checked={isIndeterminate ? "indeterminate" : allChecked}
          onCheckedChange={(v) => handleParentToggle(v === true)}
          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=indeterminate]:bg-primary/40 data-[state=indeterminate]:border-primary"
        />
        <label
          htmlFor={`perm-${node.id}`}
          className="flex-1 text-sm font-semibold text-foreground cursor-pointer select-none"
        >
          {node.label}
        </label>
        {node.children && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {checkedCount}/{childIds.length}
            </span>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown
                className={cn("w-4 h-4 transition-transform duration-200", !expanded && "-rotate-90")}
              />
            </button>
          </div>
        )}
      </div>

      {/* Children */}
      {expanded && node.children && (
        <div className="border-t border-border divide-y divide-border bg-muted/30">
          {node.children.map((child) => {
            const isChecked = permissions.includes(child.id);
            return (
              <div
                key={child.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 transition-colors",
                  isChecked && "bg-primary/5"
                )}
              >
                <div className="w-4" /> {/* indent */}
                <Checkbox
                  id={`perm-${child.id}`}
                  checked={isChecked}
                  onCheckedChange={(v) => handleChildToggle(child.id, v === true)}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <label
                  htmlFor={`perm-${child.id}`}
                  className="flex-1 text-sm text-foreground cursor-pointer select-none"
                >
                  {child.label}
                </label>
                {isChecked && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                )}
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
  const [name, setName]         = useState("");
  const [desc, setDesc]         = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function handleClose() {
    setRoleCode(""); setName(""); setDesc("");
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
            Define the role code, name, and description. You can assign permissions after creation.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 px-6 py-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="role-code">Role Code</Label>
            <Input
              id="role-code"
              placeholder="e.g. ENG, FIN, ADM"
              value={roleCode}
              onChange={(e) => setRoleCode(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Short unique identifier for this role.</p>
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
  open:           boolean;
  onClose:        () => void;
  roleName:       string;
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
                  <Button size="sm" variant="outline" className="shrink-0 h-7 text-xs">
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
  roleId,
  allSystemUsers,
}: {
  users:          RoleUser[];
  roleName:       string;
  roleId:         string;
  allSystemUsers: ApiRoleUser[];
}) {
  const [assignOpen, setAssignOpen] = useState(false);

  // Only show users not already assigned to this role
  const assignedIds    = new Set(users.map((u) => u.id));
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
              className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors"
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

// ── Permissions tab ────────────────────────────────────────────────────
function PermissionsTab({
  role,
  menuTree,
}: {
  role: Role;
  menuTree: MenuNode[];
}) {
  const dispatch    = useAppDispatch();
  const pending     = useAppSelector((s) => s.roles.pendingPermissions[role.id]);
  const isDirty     = useAppSelector((s) => s.roles.dirtyRoles[role.id]);
  const permissions = pending ?? role.permissions;
  const [isSaving, setIsSaving] = useState(false);

  // Seed Redux when role changes
  useEffect(() => {
    dispatch(initPendingPermissions({ roleId: role.id, permissions: role.permissions }));
  }, [role.id, role.permissions, dispatch]);

  const totalGranted  = permissions.length;
  const totalPossible = menuTree.flatMap((m) => getAllIds(m)).length;

  // Flatten tree into a list of { id (route), menuItemId } pairs
  function flattenTree() {
    const nodes: Array<{ id: string; menuItemId: number }> = [];
    for (const node of menuTree) {
      nodes.push({ id: node.id, menuItemId: node.menuItemId });
      for (const child of node.children ?? []) {
        nodes.push({ id: child.id, menuItemId: child.menuItemId });
      }
    }
    return nodes;
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      // Build complete assignment list — every menu item in the tree.
      // Checked items get all flags true; unchecked get all flags false.
      const assignments = flattenTree().map(({ id, menuItemId }) => {
        const granted = permissions.includes(id);
        return {
          menuItemId,
          canView:   granted,
          canCreate: granted,
          canEdit:   granted,
          canDelete: granted,
        };
      });

      const { success, failed } = await saveRoleMenusAction(role.id, assignments);

      if (failed === 0) {
        toast.success("Permissions saved", {
          description: `${success} item${success !== 1 ? "s" : ""} updated.`,
        });
        dispatch(markSaved(role.id));
      } else {
        toast.error("Partial save", {
          description: `${success} succeeded, ${failed} failed. Retry to fix failures.`,
        });
      }
    } catch {
      toast.error("Network error", { description: "Could not reach the server." });
    } finally {
      setIsSaving(false);
    }
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
        {isDirty && (
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
      <ScrollArea className="h-[calc(100vh-380px)]">
        <div className="space-y-3 pr-1">
          {menuTree.map((node) => (
            <PermissionNode
              key={node.id}
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
function RoleCard({
  role,
  isSelected,
  onSelect,
}: {
  role: Role;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full text-left rounded-xl border p-4 transition-all duration-150 group",
        isSelected
          ? "border-warning bg-warning/5 shadow-sm"
          : "border-border hover:border-warning/40 hover:bg-muted/50"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {isSelected ? (
            <div className="w-2 h-2 rounded-full bg-warning shrink-0 mt-0.5" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-border shrink-0 mt-0.5 group-hover:bg-warning/40" />
          )}
          <span
            className={cn(
              "text-sm font-semibold transition-colors",
              isSelected ? "text-foreground" : "text-foreground/80 group-hover:text-foreground"
            )}
          >
            {role.name}
          </span>
        </div>
        <Badge
          variant="outline"
          className={cn("text-[10px] px-2 py-0.5 shrink-0", ROLE_COLORS[role.id])}
        >
          {role.userCount} {role.userCount === 1 ? "user" : "users"}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 pl-4">
        {role.description}
      </p>
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────
export default function RolesClient({
  roles,
  menuTree,
  allSystemUsers,
}: {
  roles:          Role[];
  menuTree:       MenuNode[];
  allSystemUsers: ApiRoleUser[];
}) {
  const dispatch     = useAppDispatch();
  const editingId    = useAppSelector((s) => s.roles.editingRoleId);

  const [selectedId, setSelectedId]   = useState<string>(roles[0]?.id ?? "");
  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen]   = useState(false);
  const [editName, setEditName]       = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  const filteredRoles = roles.filter(
    (r) =>
      !searchQuery ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedRole = roles.find((r) => r.id === selectedId);

  function handleStartEdit(role: Role) {
    setEditName(role.name);
    dispatch(startEditingRole(role.id));
    setTimeout(() => editInputRef.current?.focus(), 50);
  }

  function handleSaveEdit(roleId: string) {

    // Wire up API call here — editName is the new role name
    dispatch(stopEditingRole());
  }

  return (
    <>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Roles & Permissions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage staff roles and control access to each module.
          </p>
        </div>
        <Button className="gap-2 h-9" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" />
          New Role
        </Button>
      </div>

      {/* Two-pane layout */}
      <div className="flex flex-col md:flex-row gap-5 h-[calc(100vh-180px)]">

        {/* ── Left: Role list ── */}
        <div className="w-72 shrink-0 flex flex-col gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search roles…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          {/* Role cards */}
          <ScrollArea className="flex-1">
            <div className="space-y-2 pr-1">
              {filteredRoles.map((role) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  isSelected={selectedId === role.id}
                  onSelect={() => setSelectedId(role.id)}
                />
              ))}
              {filteredRoles.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">
                  No roles match your search.
                </p>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* ── Right: Role detail ── */}
        {selectedRole ? (
          <div className="flex-1 bg-card rounded-2xl border border-border overflow-hidden flex flex-col">
            {/* Role detail header */}
            <div className="px-6 py-5 border-b border-border">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Role name — inline editable via Redux */}
                  {editingId === selectedRole.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        ref={editInputRef}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit(selectedRole.id);
                          if (e.key === "Escape") dispatch(stopEditingRole());
                        }}
                        className="text-lg font-bold bg-transparent border-b-2 border-primary outline-none text-foreground w-48"
                      />
                      <button
                        type="button"
                        onClick={()=>handleSaveEdit(selectedRole.id)}
                        className="text-success hover:text-success/80 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => dispatch(stopEditingRole())}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group/title">
                      <h2 className="text-lg font-bold text-foreground">{selectedRole.name}</h2>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(selectedRole)}
                        className="opacity-0 group-hover/title:opacity-100 text-muted-foreground hover:text-foreground transition-all"
                        aria-label="Edit role name"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {selectedRole.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-sm">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="font-semibold text-foreground billing-table">
                      {selectedRole.userCount}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {selectedRole.userCount === 1 ? "member" : "members"}
                    </span>
                  </div>
                  <button
                    type="button"
                    aria-label="More options"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="permissions" className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 border-b border-border">
                <TabsList className="h-auto bg-transparent p-0 gap-6 rounded-none">
                  <TabsTrigger
                    value="users"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-warning data-[state=active]:text-foreground data-[state=active]:shadow-none rounded-none pb-3 pt-3 px-0 text-sm font-medium text-muted-foreground bg-transparent"
                  >
                    <Users className="w-3.5 h-3.5 mr-1.5" />
                    Members
                    <Badge
                      variant="outline"
                      className="ml-1.5 h-4 px-1.5 text-[10px] bg-muted border-border"
                    >
                      {selectedRole.users.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="permissions"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-warning data-[state=active]:text-foreground data-[state=active]:shadow-none rounded-none pb-3 pt-3 px-0 text-sm font-medium text-muted-foreground bg-transparent"
                  >
                    <Shield className="w-3.5 h-3.5 mr-1.5" />
                    Permissions
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="users" className="flex-1 overflow-auto px-6 py-5 mt-0">
                <UsersTab
                  users={selectedRole.users}
                  roleName={selectedRole.name}
                  roleId={selectedRole.id}
                  allSystemUsers={allSystemUsers}
                />
              </TabsContent>

              <TabsContent value="permissions" className="flex-1 overflow-hidden px-6 py-5 mt-0">
                <PermissionsTab role={selectedRole} menuTree={menuTree} />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex-1 bg-card rounded-2xl border border-border flex items-center justify-center">
            <div className="text-center space-y-2">
              <Shield className="w-10 h-10 text-muted-foreground/30 mx-auto" />
              <p className="text-sm text-muted-foreground">Select a role to view details</p>
            </div>
          </div>
        )}
      </div>

      <CreateRoleSheet open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
