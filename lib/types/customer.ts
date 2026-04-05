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
  expiryDate: string | null;
  lastActiveDate: string | null;
}

export interface CustomerPageable {
  pageNumber: number;
  pageSize: number;
  sort: {
    unsorted: boolean;
    sorted: boolean;
    empty: boolean;
  };
  offset: number;
  unpaged: boolean;
  paged: boolean;
}

export interface CustomerApiResponse<T> {
  status: number;
  success: boolean;
  message: string;
  data: {
    content: T[];
    pageable: CustomerPageable;
    totalElements: number;
    totalPages: number;
    last: boolean;
    first: boolean;
    numberOfElements: number;
    size: number;
    number: number;
    sort: {
      unsorted: boolean;
      sorted: boolean;
      empty: boolean;
    };
    empty: boolean;
  };
  timestamp: string;
  error?: any;
}

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
