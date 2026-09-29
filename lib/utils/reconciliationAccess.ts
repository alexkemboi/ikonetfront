import { normalizeRole, ROLE_NAME } from "@/lib/types/roles";

export function canAccessReconciliation(role: string | null | undefined): boolean {
  const normalized = normalizeRole(role);
  return normalized === ROLE_NAME.ADMIN || normalized === ROLE_NAME.MANAGEMENT;
}