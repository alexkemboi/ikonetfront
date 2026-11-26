"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/apiClient";
import { buildUnversionedApiUrl } from "@/lib/constants";
import { clientOriginHeaders } from "@/lib/clientOrigin";
import type { ApiResponse } from "@/lib/types/auth";
import type {
  AuditEntry,
  DirectoryQuery,
  DirectoryRow,
  InvitationPreview,
  InvitePayload,
  OrganisationOptions,
  Paged,
  ProfileUser,
  SecurityPolicy,
  SecurityPolicyInput,
  SecurityProfile,
  SignInEvent,
  UserSession,
  UserSummary,
} from "@/lib/types/usersAccess";

/** The canonical staff user API (`SystemUsersCrudController`). */
const USERS = buildUnversionedApiUrl("/system-users");
const POLICY = buildUnversionedApiUrl("/security-policy");

function refresh(id?: number) {
  revalidatePath("/system/users");
  if (id) revalidatePath(`/system/users/${id}`);
}

function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

// ── Directory and dashboard ────────────────────────────────────────────

export async function getUserDirectory(q: DirectoryQuery = {}): Promise<ApiResponse<Paged<DirectoryRow> | null>> {
  return apiFetch<Paged<DirectoryRow>>(`${USERS}/directory${query({
    q: q.q?.trim(),
    role: q.role,
    accountStatus: q.accountStatus,
    invitationStatus: q.invitationStatus,
    loginStatus: q.loginStatus,
    company: q.company,
    station: q.station,
    location: q.location,
    sort: q.sort,
    direction: q.direction,
    page: Math.max(0, q.page ?? 0),
    size: Math.min(100, Math.max(1, q.size ?? 20)),
    view: q.view,
  })}`, { auth: "required", cache: "no-store" });
}

export async function getUserSummary(): Promise<ApiResponse<UserSummary | null>> {
  return apiFetch<UserSummary>(`${USERS}/summary`, { auth: "required", cache: "no-store" });
}

export async function getSignInActivity(params: { q?: string; type?: string; page?: number; size?: number } = {}): Promise<ApiResponse<Paged<SignInEvent> | null>> {
  return apiFetch<Paged<SignInEvent>>(`${USERS}/sign-ins${query({
    q: params.q?.trim(),
    type: params.type,
    page: params.page ?? 0,
    size: params.size ?? 25,
  })}`, { auth: "required", cache: "no-store" });
}

export async function getOrganisationOptions(companyId?: string | null): Promise<ApiResponse<OrganisationOptions | null>> {
  return apiFetch<OrganisationOptions>(`${USERS}/organisation-options${query({ companyId: companyId ?? undefined })}`, {
    auth: "required",
    cache: "no-store",
  });
}

// ── One person ─────────────────────────────────────────────────────────

export async function getUserSecurityProfile(id: number): Promise<ApiResponse<SecurityProfile | null>> {
  return apiFetch<SecurityProfile>(`${USERS}/${id}/security`, { auth: "required", cache: "no-store" });
}

export async function getUserSessions(id: number): Promise<ApiResponse<UserSession[] | null>> {
  return apiFetch<UserSession[]>(`${USERS}/${id}/sessions`, { auth: "required", cache: "no-store" });
}

export async function getUserSignIns(id: number, page = 0, size = 20): Promise<ApiResponse<Paged<SignInEvent> | null>> {
  return apiFetch<Paged<SignInEvent>>(`${USERS}/${id}/sign-ins${query({ page, size })}`, { auth: "required", cache: "no-store" });
}

export async function getUserAudit(id: number, limit = 50): Promise<ApiResponse<AuditEntry[] | null>> {
  return apiFetch<AuditEntry[]>(`${USERS}/${id}/audit${query({ limit })}`, { auth: "required", cache: "no-store" });
}

/** Ends one session of the user at once; refused when the organisation does not allow administrators to. */
export async function endUserSession(id: number, sessionId: string): Promise<ApiResponse<null>> {
  const res = await apiFetch<null>(`${USERS}/${id}/sessions/${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
    auth: "required",
    cache: "no-store",
  });
  if (res.success) refresh(id);
  return res;
}

export async function endAllUserSessions(id: number): Promise<ApiResponse<{ ended: number } | null>> {
  const res = await apiFetch<{ ended: number }>(`${USERS}/${id}/sessions`, {
    method: "DELETE",
    auth: "required",
    cache: "no-store",
  });
  if (res.success) refresh(id);
  return res;
}

export async function activateUser(id: number): Promise<ApiResponse<ProfileUser | null>> {
  const res = await apiFetch<ProfileUser>(`${USERS}/${id}/activate`, { method: "POST", auth: "required", cache: "no-store" });
  if (res.success) refresh(id);
  return res;
}

/** Turns sign-in off and signs the user out everywhere. */
export async function deactivateUser(id: number): Promise<ApiResponse<ProfileUser | null>> {
  const res = await apiFetch<ProfileUser>(`${USERS}/${id}/deactivate`, { method: "POST", auth: "required", cache: "no-store" });
  if (res.success) refresh(id);
  return res;
}

/** The user's own session limit (1–20); null returns them to the organisation default. */
export async function setUserSessionLimit(id: number, sessionLimit: number | null): Promise<ApiResponse<ProfileUser | null>> {
  const res = await apiFetch<ProfileUser>(`${USERS}/${id}/session-limit`, {
    method: "PUT",
    body: { sessionLimit },
    auth: "required",
    cache: "no-store",
  });
  if (res.success) refresh(id);
  return res;
}

// ── Invitations ────────────────────────────────────────────────────────

export async function inviteUser(payload: InvitePayload): Promise<ApiResponse<{ id: string } | null>> {
  const res = await apiFetch<{ id: string }>(`${USERS}/invitations`, {
    method: "POST",
    // the invitation's company (its form's Company field) is the request's company context
    ...(payload.companyId ? { headers: { "X-Company-Context": payload.companyId } } : {}),
    body: payload,
    auth: "required",
    cache: "no-store",
  });
  if (res.success) refresh();
  return res;
}

export async function resendInvitation(invitationId: string): Promise<ApiResponse<null>> {
  const res = await apiFetch<null>(`${USERS}/invitations/${encodeURIComponent(invitationId)}/resend`, {
    method: "POST",
    auth: "required",
    cache: "no-store",
  });
  if (res.success) refresh();
  return res;
}

export async function revokeInvitation(invitationId: string): Promise<ApiResponse<null>> {
  const res = await apiFetch<null>(`${USERS}/invitations/${encodeURIComponent(invitationId)}/revoke`, {
    method: "POST",
    auth: "required",
    cache: "no-store",
  });
  if (res.success) refresh();
  return res;
}

/** Signed out: what an invitation link offers. */
export async function previewInvitation(token: string): Promise<ApiResponse<InvitationPreview | null>> {
  return apiFetch<InvitationPreview>("/auth/invitations/preview", {
    method: "POST",
    body: { token },
    auth: "public",
    headers: await clientOriginHeaders(),
    cache: "no-store",
  });
}

/** Signed out: accept an invitation with the username and password the person chose. */
export async function acceptInvitation(token: string, username: string, password: string): Promise<ApiResponse<{ username: string } | null>> {
  return apiFetch<{ username: string }>("/auth/invitations/accept", {
    method: "POST",
    body: { token, username, password },
    auth: "public",
    headers: await clientOriginHeaders(),
    cache: "no-store",
  });
}

// ── Security settings ──────────────────────────────────────────────────

export async function getSecurityPolicy(): Promise<ApiResponse<SecurityPolicy | null>> {
  return apiFetch<SecurityPolicy>(POLICY, { auth: "required", cache: "no-store" });
}

export async function saveSecurityPolicy(input: SecurityPolicyInput): Promise<ApiResponse<SecurityPolicy | null>> {
  const res = await apiFetch<SecurityPolicy>(POLICY, { method: "PUT", body: input, auth: "required", cache: "no-store" });
  if (res.success) revalidatePath("/system/users/security");
  return res;
}

// ── A temporary or expired password, at sign-in ────────────────────────

/**
 * Changes the password of an account that signed in with a temporary or expired one. Runs before
 * the dashboard session exists, so the token from the sign-in step is sent explicitly; the API
 * lets that token do nothing else until the password is changed.
 */
export async function changeRequiredPassword(token: string, currentPassword: string, newPassword: string): Promise<ApiResponse<null>> {
  return apiFetch<null>("/auth/change-password", {
    method: "POST",
    body: { currentPassword, newPassword },
    authorization: `Bearer ${token}`,
    headers: await clientOriginHeaders(),
    cache: "no-store",
  });
}
