export type TicketStatus = "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

export interface Ticket {
  idxno: number
  ticketNumber: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  customerName: string | null
  assignedAgentName: string | null
  creatorName: string | null
  createdAt: string
  updatedAt: string
  slaDeadline: string | null
  isEscalated: boolean
}

export interface TicketComment {
  idxno: number
  comment: string
  authorName: string | null
  createdAt: string
}

export interface CreateTicketPayload {
  title: string
  description: string
  priority: TicketPriority
  customerId?: number | null
  routerId?: number | null
  creatorUserId?: number | null
  creatorCustomerId?: number | null
}

export interface AddCommentPayload {
  comment: string
  authorUserId?: number | null
  authorCustomerId?: number | null
}

export interface TicketMetrics {
  totalOpen: number
  inProgress: number
  resolved: number
  escalated: number
  breachedSla: number
}

export interface TicketPage {
  content: Ticket[]
  totalElements: number
  totalPages: number
  last: boolean
  first: boolean
  numberOfElements: number
  size: number
  number: number
  empty: boolean
}

export const NEXT_STATUS_MAP: Record<TicketStatus, { label: string; next: TicketStatus } | null> = {
  OPEN:        { label: "Assign",        next: "ASSIGNED"    },
  ASSIGNED:    { label: "Start Work",    next: "IN_PROGRESS" },
  IN_PROGRESS: { label: "Mark Resolved", next: "RESOLVED"    },
  RESOLVED:    { label: "Close Ticket",  next: "CLOSED"      },
  CLOSED:      null,
}

export const PREV_STATUS_MAP: Record<TicketStatus, { label: string; prev: TicketStatus } | null> = {
  OPEN:        null,
  ASSIGNED:    { label: "Move Back to Open",         prev: "OPEN"        },
  IN_PROGRESS: { label: "Move Back to Assigned",     prev: "ASSIGNED"    },
  RESOLVED:    { label: "Move Back to In Progress",  prev: "IN_PROGRESS" },
  CLOSED:      { label: "Move Back to Resolved",     prev: "RESOLVED"    },
}

export const PRIORITY_BADGE: Record<TicketPriority, string> = {
  LOW:      "bg-muted text-muted-foreground",
  MEDIUM:   "bg-blue-500/10 text-blue-600",
  HIGH:     "bg-warning/10 text-warning",
  CRITICAL: "bg-destructive/10 text-destructive",
}

export const STATUS_BADGE: Record<TicketStatus, string> = {
  OPEN:        "bg-blue-500/10 text-blue-600",
  ASSIGNED:    "bg-primary/10 text-primary",
  IN_PROGRESS: "bg-warning/10 text-warning",
  RESOLVED:    "bg-success/10 text-success",
  CLOSED:      "bg-muted text-muted-foreground",
}
