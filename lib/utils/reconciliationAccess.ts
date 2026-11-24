import { can, type NavAccess } from "@/lib/access";

/** The M-Pesa reconciliation itself: roles that may run it (the API's reconciliation trigger). */
export function canAccessReconciliation(access: NavAccess | null | undefined): boolean {
  return can(access, "API_PAYMENT_RECONCILIATION_GET_RECONCILIATION", "CREATE");
}

/**
 * The paybill payments register on the reconciliation page: admins, management and staff
 * (customer care and finance look up a customer's payment there). What each may change is
 * still decided by the role's MENU-FINANCE-RECONCILIATION permissions on the backend.
 */
export function canAccessPaybillRegister(access: NavAccess | null | undefined): boolean {
  return canAccessReconciliation(access) || can(access, "API_PAYBILLTRANSACTION", "VIEW");
}
