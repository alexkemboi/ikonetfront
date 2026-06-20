"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import type {
  Ticket,
  TicketComment,
  CreateTicketPayload,
  AddCommentPayload,
  TicketStatus,
} from "@/lib/types/ticket"
import type { ApiResponse } from "@/lib/types/auth"

const BASE_URL = "https://beesmartbedak.com/api/v1"

// ─── Read Actions ────────────────────────────────────────────────────────────
// next: { tags: [...] } caches this fetch under the given tag.
// Calling revalidateTag("tickets") later flushes only this cache.

export async function getTickets(): Promise<ApiResponse<Ticket[]>> {
  try {
    const res = await fetch(`${BASE_URL}/tickets`, {
      next: { tags: ["tickets"] },
    })
    const data: ApiResponse<Ticket[]> = await res.json()
    return data
  } catch (error) {
    return {
      status: 500,
      success: false,
      message: error instanceof Error ? error.message : String(error),
      data: [],
      timestamp: new Date().toISOString(),
    }
  }
}

export async function getTicketById(id: number): Promise<ApiResponse<Ticket>> {
  try {
    const res = await fetch(`${BASE_URL}/tickets/${id}`, {
      next: { tags: [`ticket-${id}`] },
    })
    return await res.json()
  } catch (error) {
    return {
      status: 500,
      success: false,
      message: error instanceof Error ? error.message : String(error),
      data: null as unknown as Ticket,
      timestamp: new Date().toISOString(),
    }
  }
}

export async function getTicketComments(id: number): Promise<ApiResponse<TicketComment[]>> {
  try {
    const res = await fetch(`${BASE_URL}/tickets/${id}/comments`, {
      next: { tags: [`ticket-comments-${id}`] },
    })
    return await res.json()
  } catch (error) {
    return {
      status: 500,
      success: false,
      message: error instanceof Error ? error.message : String(error),
      data: [],
      timestamp: new Date().toISOString(),
    }
  }
}

// ─── Mutation Actions ─────────────────────────────────────────────────────────
// Every mutation calls revalidatePath/revalidateTag on success so Next.js
// re-fetches the cached server component data — no manual state update needed.

export async function createTicket(payload: CreateTicketPayload): Promise<ApiResponse<Ticket>> {
  try {
    const res = await fetch(`${BASE_URL}/tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const data: ApiResponse<Ticket> = await res.json()
    if (data.success) revalidatePath("/customers/tickets")
    return data
  } catch (error) {
    return {
      status: 500,
      success: false,
      message: error instanceof Error ? error.message : String(error),
      data: null as unknown as Ticket,
      timestamp: new Date().toISOString(),
    }
  }
}

// Status goes in the query string — no body, no Content-Type header.
export async function updateTicketStatus(id: number, status: TicketStatus): Promise<ApiResponse<Ticket>> {
  try {
    const res = await fetch(`${BASE_URL}/tickets/${id}/status?status=${status}`, {
      method: "PATCH",
    })
    const data: ApiResponse<Ticket> = await res.json()
    if (data.success) {
      revalidatePath("/customers/tickets")
      revalidateTag(`ticket-${id}`, "page")
    }
    return data
  } catch (error) {
    return {
      status: 500,
      success: false,
      message: error instanceof Error ? error.message : String(error),
      data: null as unknown as Ticket,
      timestamp: new Date().toISOString(),
    }
  }
}

// Staff ID goes in the URL path — no body, no Content-Type header.
export async function assignTicket(id: number, staffId: number): Promise<ApiResponse<Ticket>> {
  try {
    const res = await fetch(`${BASE_URL}/tickets/${id}/assign/${staffId}`, {
      method: "PATCH",
    })
    const data: ApiResponse<Ticket> = await res.json()
    if (data.success) {
      revalidatePath("/customers/tickets")
      revalidateTag(`ticket-${id}`, "page")
    }
    return data
  } catch (error) {
    return {
      status: 500,
      success: false,
      message: error instanceof Error ? error.message : String(error),
      data: null as unknown as Ticket,
      timestamp: new Date().toISOString(),
    }
  }
}

export async function addTicketComment(
  id: number,
  payload: AddCommentPayload
): Promise<ApiResponse<TicketComment>> {
  try {
    const res = await fetch(`${BASE_URL}/tickets/${id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const data: ApiResponse<TicketComment> = await res.json()
    if (data.success) revalidateTag(`ticket-comments-${id}`, "page")
    return data
  } catch (error) {
    return {
      status: 500,
      success: false,
      message: error instanceof Error ? error.message : String(error),
      data: null as unknown as TicketComment,
      timestamp: new Date().toISOString(),
    }
  }
}
