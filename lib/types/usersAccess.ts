/** Users & Access Control: shapes of the /system-users directory, profile and security policy APIs. */

export type AccountStatus = "ACTIVE" | "INACTIVE" | "LOCKED" | "INVITED";
export type InvitationStatus = "PENDING" | "EXPIRED" | "ACCEPTED" | "REVOKED" | "NONE";
export type LoginStatus = "ONLINE" | "IDLE" | "OFFLINE" | "NEVER" | "DISABLED";

/** One person in the list: a registered account (USER) or an invitation not yet accepted (INVITATION). */
export type DirectoryRow = {
  kind: "USER" | "INVITATION";
  userId: number | null;
  invitationId: string | null;
  username: string | null;
  fullName: string | null;
  email: string | null;
  phoneNumber: string | null;
  roleCode: string | null;
  roleName: string | null;
  companyCode: string | null;
  companyName: string | null;
  stationId: string | null;
  stationName: string | null;
  locationId: number | null;
  locationName: string | null;
  accountStatus: AccountStatus;
  invitationStatus: InvitationStatus;
  loginStatus: LoginStatus;
  lastLoginAt: string | null;
  lastActiveAt: string | null;
  failedLoginAttempts: number;
  openSessions: number;
  privileged: boolean;
  createdAt: string | null;
  invitationExpiresAt: string | null;
};

export type Paged<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export type DirectoryQuery = {
  q?: string;
  role?: string;
  accountStatus?: string;
  invitationStatus?: string;
  loginStatus?: string;
  company?: string;
  station?: string;
  location?: number;
  sort?: string;
  direction?: "asc" | "desc";
  page?: number;
  size?: number;
  /** STAFF (default), CUSTOMERS or DELETED accounts; the last two for platform administrators. */
  view?: "STAFF" | "CUSTOMERS" | "DELETED";
};

export type UserSummary = {
  totalUsers: number;
  registeredAccounts: number;
  activeUsers: number;
  administrators: number;
  openInvitations: number;
  lockedUsers: number;
  onlineNow: number;
};

export type SecurityPolicy = {
  companyCode: string | null;
  sessionsPerUser: number;
  idleTimeoutMinutes: number;
  maxSessionHours: number;
  allowAdminForceLogout: boolean;
  maxFailedAttempts: number;
  lockoutMinutes: number;
  adminUnlockRequired: boolean;
  requireChangeAfterReset: boolean;
  passwordExpiryDays: number;
  passwordHistoryCount: number;
  logSignInActivity: boolean;
  onlineThresholdMinutes: number;
  /** True when the organisation has no policy of its own and follows the platform default. */
  inherited: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
};

export type SecurityPolicyInput = Omit<SecurityPolicy, "companyCode" | "inherited" | "updatedAt" | "updatedBy">;

/** The ranges the backend enforces; the form validates against the same numbers. */
export const POLICY_RANGES = {
  sessionsPerUser: [1, 20],
  idleTimeoutMinutes: [5, 480],
  maxSessionHours: [1, 720],
  maxFailedAttempts: [3, 20],
  lockoutMinutes: [1, 1440],
  passwordExpiryDays: [0, 365],
  passwordHistoryCount: [0, 24],
  onlineThresholdMinutes: [1, 60],
} as const satisfies Record<string, readonly [number, number]>;

export type UserSession = {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string | null;
  lastActiveAt: string | null;
  expiresAt: string | null;
  endedAt: string | null;
  endReason: string | null;
  endedBy: string | null;
  current: boolean;
};

export type SignInEvent = {
  id: number;
  userId: number | null;
  username: string;
  companyCode: string | null;
  eventType: string;
  ipAddress: string | null;
  userAgent: string | null;
  detail: string | null;
  actor: string | null;
  occurredAt: string;
};

export type AuditEntry = {
  id: number;
  username: string;
  module: string | null;
  subModule: string | null;
  action: string | null;
  description: string | null;
  accessTo: string | null;
  accessTime: string | null;
};

export type RoleGrant = {
  label: string;
  module: string | null;
  kind: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
};

export type ProfileUser = {
  idxno: number;
  username: string;
  userId: string;
  role: string;
  roleName: string | null;
  roleDescription: string | null;
  principalType: string | null;
  fname: string;
  middleName: string | null;
  otherName: string | null;
  fullName: string | null;
  email: string | null;
  phoneNumber: string | null;
  isactive: boolean;
  canLogin: boolean;
  accountLocked: boolean;
  createdAt: string | null;
  stationId: string | null;
  companyId: string | null;
  investorId: string | null;
  locationId: number | null;
  sessionLimit: number | null;
  mustChangePassword: boolean;
  failedLoginAttempts: number | null;
  lockedAt: string | null;
  lastLoginAt: string | null;
};

export type SecurityProfile = {
  user: ProfileUser;
  companyName: string | null;
  stationName: string | null;
  locationName: string | null;
  roleScope: string | null;
  grants: RoleGrant[];
  accountStatus: AccountStatus;
  loginStatus: LoginStatus;
  lastActiveAt: string | null;
  lockedUntil: string | null;
  lockNeedsAdmin: boolean;
  passwordChangedAt: string | null;
  passwordExpiresAt: string | null;
  effectiveSessionLimit: number;
  sessionLimitSource: "USER" | "ORGANISATION";
  openSessions: number;
  invitation: { invitedBy: string; invitedAt: string; acceptedAt: string | null; sendCount: number } | null;
  policy: SecurityPolicy;
};

export type OrganisationOption = { id: number; name: string; locationId: number | null };
export type OrganisationOptions = { locations: OrganisationOption[]; stations: OrganisationOption[] };

export type InvitePayload = {
  email: string;
  fname: string;
  otherName?: string;
  phoneNumber?: string;
  role: string;
  stationId?: string;
  locationId?: number;
  companyId?: string;
  /** Tenant id of companyId; the API checks both name the same organisation. */
  tenantId?: string;
};

export type InvitationPreview = {
  email: string;
  fname: string;
  otherName: string | null;
  companyName: string | null;
  roleName: string | null;
  expiresAt: string;
};
