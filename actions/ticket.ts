"use server"

import { revalidatePath, revalidateTag, updateTag } from "next/cache"
import type {
  Ticket,
  TicketComment,
  CreateTicketPayload,
  AddCommentPayload,
  TicketStatus,
  TicketMetrics,
  TicketPage,
  TicketPriority,
} from "@/lib/types/ticket"
import type { ApiResponse } from "@/lib/types/auth"
import { apiFetch } from "@/lib/apiClient"

// ─── Read Actions ────────────────────────────────────────────────────────────
// next: { tags: [...] } caches this fetch under the given tag.
// Calling revalidateTag("tickets") later flushes only this cache.

export async function getTickets(): Promise<ApiResponse<Ticket[]>> {
  const res = await apiFetch<Ticket[]>("/tickets", {
    auth: "required",
    tags: ["tickets"],
  })
  return res.success && Array.isArray(res.data)
    ? res
    : { ...res, success: false, data: [] }
}

export async function getTicketById(id: number): Promise<ApiResponse<Ticket>> {
  const res = await apiFetch<Ticket>(`/tickets/${id}`, {
    auth: "required",
    tags: [`ticket-${id}`],
  })
  return res
}

export async function getTicketComments(id: number): Promise<ApiResponse<TicketComment[]>> {
  const res = await apiFetch<TicketComment[]>(`/tickets/${id}/comments`, {
    auth: "required",
    tags: [`ticket-comments-${id}`],
  })
  return res.success && Array.isArray(res.data)
    ? res
    : { ...res, success: false, data: [] }
}

export async function searchTickets(params: {
  status?: TicketStatus
  priority?: TicketPriority
  assignedAgentId?: number
  customerId?: number
  routerId?: number
  startDate?: string
  endDate?: string
  page?: number
  size?: number
  sort?: string
} = {}): Promise<ApiResponse<TicketPage>> {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return
    searchParams.append(key, String(value))
  })

  const qs = searchParams.toString()
  const res = await apiFetch<TicketPage>(`/tickets/search${qs ? `?${qs}` : ""}`, {
    auth: "required",
    tags: ["tickets-search"],
  })
  return res.success && res.data
    ? res
    : {
        ...res,
        success: false,
        data: {
          content: [],
          totalElements: 0,
          totalPages: 0,
          last: true,
          first: true,
          numberOfElements: 0,
          size: 10,
          number: 0,
          empty: true,
        },
      }
}

export async function getTicketMetrics(): Promise<ApiResponse<TicketMetrics>> {
  const res = await apiFetch<TicketMetrics>("/tickets/metrics", {
    auth: "required",
    tags: ["tickets-metrics"],
  })
  return res.success && res.data
    ? res
    : {
        ...res,
        success: false,
        data: {
          totalOpen: 0,
          inProgress: 0,
          resolved: 0,
          escalated: 0,
          breachedSla: 0,
        },
      }
}

// ─── Mutation Actions ─────────────────────────────────────────────────────────
// Every mutation calls revalidatePath/revalidateTag on success so Next.js
// re-fetches the cached server component data — no manual state update needed.

export async function createTicket(payload: CreateTicketPayload): Promise<ApiResponse<Ticket>> {
  const res = await apiFetch<Ticket>("/tickets", {
    method: "POST",
    body: payload,
    auth: "required",
  })
  if (res.success) revalidatePath("/customers/tickets")
  return res
}

// Status goes in the query string — no body.
export async function updateTicketStatus(id: number, status: TicketStatus): Promise<ApiResponse<Ticket>> {
  const res = await apiFetch<Ticket>(`/tickets/${id}/status?status=${status}`, {
    method: "PATCH",
    auth: "required",
  })
  if (res.success) {
    revalidatePath("/customers/tickets")
    revalidateTag(`ticket-${id}`, "max")
  }
  return res
}

// Staff ID goes in the URL path — no body.
export async function assignTicket(id: number, staffId: number): Promise<ApiResponse<Ticket>> {
  const res = await apiFetch<Ticket>(`/tickets/${id}/assign/${staffId}`, {
    method: "PATCH",
    auth: "required",
  })
  if (res.success) {
    revalidatePath("/customers/tickets")
    revalidateTag(`ticket-${id}`, "max")
  }
  return res
}

export async function addTicketComment(
  id: number,
  payload: AddCommentPayload
): Promise<ApiResponse<TicketComment>> {
  const res = await apiFetch<TicketComment>(`/tickets/${id}/comments`, {
    method: "POST",
    body: payload,
    auth: "required",
  })
  if (res.success) updateTag(`ticket-comments-${id}`)
  return res
}