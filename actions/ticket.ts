"use server"

import { withCompanyContext } from "@/lib/companyContext";
import { revalidatePath, revalidateTag, updateTag } from "next/cache"
import { auth } from "@/lib/auth"
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

import { buildApiUrl } from "@/lib/constants"

async function getAuthHeaders(): Promise<Record<string, string>> {
  const session = await auth()
  if (!session?.user?.apiToken) {
    console.error("[Ticket Action] Missing apiToken in session!")
    return {}
  }
  return withCompanyContext({ Authorization: `Bearer ${session.user.apiToken}` })
}

// ─── Read Actions ────────────────────────────────────────────────────────────
// next: { tags: [...] } caches this fetch under the given tag.
// Calling revalidateTag("tickets") later flushes only this cache.

export async function getTickets(): Promise<ApiResponse<Ticket[]>> {
  try {
    const headers = await getAuthHeaders()
    const res = await fetch(buildApiUrl("/tickets"), {
      headers,
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
    const headers = await getAuthHeaders()
    const res = await fetch(buildApiUrl(`/tickets/${id}`), {
      headers,
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
    const headers = await getAuthHeaders()
    const res = await fetch(buildApiUrl(`/tickets/${id}/comments`), {
      headers,
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
  try {
    const headers = await getAuthHeaders()
    const searchParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return
      searchParams.append(key, String(value))
    })

    const url = `${buildApiUrl("/tickets/search")}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`
    const res = await fetch(url, {
      headers,
      next: { tags: ["tickets-search"] },
    })
    const data: ApiResponse<TicketPage> = await res.json()
    return data
  } catch (error) {
    return {
      status: 500,
      success: false,
      message: error instanceof Error ? error.message : String(error),
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
      timestamp: new Date().toISOString(),
    }
  }
}

export async function getTicketMetrics(): Promise<ApiResponse<TicketMetrics>> {
  try {
    const headers = await getAuthHeaders()
    const res = await fetch(buildApiUrl("/tickets/metrics"), {
      headers,
      next: { tags: ["tickets-metrics"] },
    })
    const data: ApiResponse<TicketMetrics> = await res.json()
    return data
  } catch (error) {
    return {
      status: 500,
      success: false,
      message: error instanceof Error ? error.message : String(error),
      data: {
        totalOpen: 0,
        inProgress: 0,
        resolved: 0,
        escalated: 0,
        breachedSla: 0,
      },
      timestamp: new Date().toISOString(),
    }
  }
}

// ─── Mutation Actions ─────────────────────────────────────────────────────────
// Every mutation calls revalidatePath/revalidateTag on success so Next.js
// re-fetches the cached server component data — no manual state update needed.

export async function createTicket(payload: CreateTicketPayload): Promise<ApiResponse<Ticket>> {
  try {
    const headers = await getAuthHeaders()
    const res = await fetch(buildApiUrl("/tickets"), {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
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
    const headers = await getAuthHeaders()
    const res = await fetch(buildApiUrl(`/tickets/${id}/status?status=${status}`), {
      method: "PATCH",
      headers,
    })
    const data: ApiResponse<Ticket> = await res.json()
    if (data.success) {
      revalidatePath("/customers/tickets")
      revalidateTag(`ticket-${id}`, "max")
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
    const headers = await getAuthHeaders()
    const res = await fetch(buildApiUrl(`/tickets/${id}/assign/${staffId}`), {
      method: "PATCH",
      headers,
    })
    const data: ApiResponse<Ticket> = await res.json()
    if (data.success) {
      revalidatePath("/customers/tickets")
      revalidateTag(`ticket-${id}`, "max")
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
    const headers = await getAuthHeaders()
    const res = await fetch(buildApiUrl(`/tickets/${id}/comments`), {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const data: ApiResponse<TicketComment> = await res.json()
    if (data.success) updateTag(`ticket-comments-${id}`)
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
