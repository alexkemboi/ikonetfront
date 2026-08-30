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
}

export type CustomerPageable = PageResponse<never>["pageable"];

export type CustomerApiResponse<T = unknown> = BaseApiResponse<PageResponse<T>> & {
  error?: unknown;
};

export interface AddCustomerPayload {
  username: string;
  password?: string; // Password is required for new PPPoE customers
  firstname: string;
  lname: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  canLogin: boolean;
  acno?: string;
  packageName?: string;
  custtype?: string;
  isSubActive?: boolean;
  duration?: number;
  unit?: string;
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
