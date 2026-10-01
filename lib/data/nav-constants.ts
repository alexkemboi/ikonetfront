import type { PermissionFlags } from "@/lib/types/roles";

export const NO_PERMISSIONS: PermissionFlags = {
  canView: false,
  canCreate: false,
  canEdit: false,
  canDelete: false,
};