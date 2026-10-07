import type { ApiResponse as BaseApiResponse, PageResponse } from "@/lib/types/api";

export interface Customer {
  userIdxno: number;
  username: string;
  firstname: string;
  lname: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  isActive: boolean;
  canLogin: boolean;
  createdAt: string;
  subscriberIdxno: number | null;
  acno: string | null;
  packageName: string | null;
  custtype: string | null;
  isSubActive: boolean | null;
  startDate: string | null;
  expiryDate: string | null;
  lastActiveDate: string | null;
  /** Id used by the PPPoE package and payment actions; absent when the customer has no PPPoE account. */
  customerId?: string | null;
  /** PPPoE account state (ACTIVE / SUSPENDED / DISABLED); absent with no PPPoE account. */
  pppoeAccountStatus?: string | null;
}

export type CustomerPageable = PageResponse<never>["pageable"];

export type CustomerApiResponse<T = unknown> = BaseApiResponse<PageResponse<T>> & {
  error?: unknown;
};

export interface AddCustomerPayload {
  username: string;
  /** Also the customer's PPPoE password. */
  password: string;
  firstname: string;
  lname: string;
  email?: string;
  phoneNumber: string;
  isActive: boolean;
  canLogin: boolean;
  /** House number. */
  acno: string;
  /** Serving MikroTik router: gives the customer a PPPoE account that packages and payments act on. */
  networkDeviceId: number;
}

export interface UpdateCustomerPayload {
  username?: string;
  firstname?: string;
  lname?: string;
  email?: string;
  phoneNumber?: string;
  isActive?: boolean;
  canLogin?: boolean;
  acno?: string;
  packageName?: string;
  custtype?: string;
  isSubActive?: boolean;
  expiryDate?: string;
}

export interface CustomerFilters {
  isActive?: boolean;
  custtype?: string;
  search?: string; // For general search across fields like username, fullName, email
}
