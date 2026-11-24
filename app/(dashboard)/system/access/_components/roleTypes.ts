import type { MenuNode } from "@/lib/nav";
import type { ApiRoleUser, PermissionMap } from "@/lib/types/roles";

// ── UI types ────────────────────────────────────────────────────────────

export type RoleUser = {
 id: string;
 name: string;
 email: string;
 status: "active" | "inactive";
 initials: string;
 joinedAt: string;
};

export type Role = {
 /** Role code (stable identifier) */
 id: string;
 /** Database id, for role changes */
 idxno: number;
 /** STAFF, INVESTOR or CUSTOMER */
 principalType: string;
 /** PLATFORM, COMPANY or STATION */
 scopeLevel: string | null;
 isSystem: boolean;
 isSuperAdmin: boolean;
 isActive: boolean;
 landingRoute: string | null;
 name: string;
 description: string;
 userCount: number;
 permissions: PermissionMap;
 users: RoleUser[];
 createdAt: string;
};

export type { MenuNode, ApiRoleUser, PermissionMap };
