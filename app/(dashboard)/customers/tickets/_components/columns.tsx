"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Flame, Clock, MoreHorizontal, Eye, ArrowRight, Undo2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuLabel,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTableColumnHeader } from "@/components/shared/column-header"
import { cn } from "@/lib/utils"
import { PRIORITY_BADGE, STATUS_BADGE, NEXT_STATUS_MAP, PREV_STATUS_MAP } from "@/lib/types/ticket"
import type { Ticket, TicketStatus, TicketPriority } from "@/lib/types/ticket"
import type { AppDispatch } from "@/store"
import type { PermissionFlags } from "@/lib/types/roles"
import { openDetailSheet } from "@/store/slices/ticketSlice"
import { updateTicketStatus } from "@/actions/ticket"
import { toast } from "sonner"

const PRIORITY_LABELS: Record<TicketPriority, string> = {
 LOW: "Low", MEDIUM: "Medium", HIGH: "High", URGENT: "Urgent",
}

const STATUS_LABELS: Record<TicketStatus, string> = {
 OPEN: "Open", ASSIGNED: "Assigned", IN_PROGRESS: "In Progress",
 RESOLVED: "Resolved", CLOSED: "Closed",
}

const subscribe = () => () => {}

function useIsHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
}

function SlaCountdown({ deadline }: { deadline: string | null }) {
  const hydrated = useIsHydrated()

  if (!deadline) return <span className="text-xs text-muted-foreground">—</span>
  if (!hydrated) return <span className="text-xs text-muted-foreground">—</span>
   return <SlaClock deadline={deadline} />
}

function SlaClock({ deadline }: { deadline: string }) {
  // `now` snapshotted in state so the render body stays pure (react-hooks/purity).
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(t)
  }, [])

  const diff = new Date(deadline).getTime() - now
  const absMinutes = Math.abs(Math.floor(diff / 60_000))
  const hours = Math.floor(absMinutes / 60)
  const mins = absMinutes % 60

 if (diff < 0) {
 return (
 <span className="text-xs font-medium text-destructive whitespace-nowrap">
 {hours > 0 ? `${hours}h ${mins}m` : `${mins}m`} overdue
 </span>
 )
 }

 const isUrgent = diff < 2 * 60 * 60 * 1000
 return (
 <span className={cn("text-xs whitespace-nowrap", isUrgent ? "font-medium text-warning" : "text-muted-foreground")}>
 {hours > 0 ? `${hours}h ${mins}m` : `${mins}m`} left
 </span>
 )
}

export function createTicketColumns(dispatch: AppDispatch, perms: PermissionFlags): ColumnDef<Ticket>[] {
 return [
 {
 accessorKey: "ticketNumber",
 header: ({ column }) => <DataTableColumnHeader column={column} title="Ticket #" />,
 cell: ({ row }) => (
 <span className="font-mono text-[11px] font-medium text-primary bg-primary/5 px-1.5 py-0.5 rounded whitespace-nowrap">
 {row.getValue("ticketNumber")}
 </span>
 ),
 },
 {
 accessorKey: "title",
 header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
 cell: ({ row }) => (
 <button
 onClick={() => dispatch(openDetailSheet(row.original.idxno))}
 className="text-left group min-w-0"
 >
 <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
 {row.getValue("title")}
 </p>
 {row.original.customerName && (
 <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
 {row.original.customerName}
 </p>
 )}
 </button>
 ),
 },
 {
 accessorKey: "priority",
 header: ({ column }) => <DataTableColumnHeader column={column} title="Priority" />,
 cell: ({ row }) => {
 const rawPriority = String(row.getValue("priority") ?? "").trim().toUpperCase()
 const p: TicketPriority = rawPriority === "CRITICAL" ? "URGENT" : rawPriority as TicketPriority
 return (
 <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 font-semibold uppercase tracking-wide", PRIORITY_BADGE[p])}>
 {PRIORITY_LABELS[p] ?? (rawPriority || "Unknown")}
 </Badge>
 )
 },
 },
 {
 accessorKey: "status",
 header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
 cell: ({ row }) => {
 const s: TicketStatus = row.getValue("status")
 return (
 <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 font-medium", STATUS_BADGE[s])}>
 {STATUS_LABELS[s]}
 </Badge>
 )
 },
 },
 {
 accessorKey: "assignedAgentName",
 header: ({ column }) => <DataTableColumnHeader column={column} title="Assigned To" />,
 cell: ({ row }) => {
 const name: string | null = row.getValue("assignedAgentName")
 return name
 ? <span className="text-xs text-foreground">{name}</span>
 : <span className="text-xs text-muted-foreground italic">Unassigned</span>
 },
 },
 {
 accessorKey: "slaDeadline",
 header: ({ column }) => <DataTableColumnHeader column={column} title="SLA" />,
 cell: ({ row }) => <SlaCountdown deadline={row.getValue("slaDeadline")} />,
 },
 {
 accessorKey: "isEscalated",
 header: () => <span className="sr-only">Escalated</span>,
 cell: ({ row }) =>
 row.getValue("isEscalated") ? (
 <Flame className="w-4 h-4 text-destructive" aria-label="Escalated" />
 ) : null,
 },
 {
 accessorKey: "createdAt",
 header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
 cell: ({ row }) => {
 const d = new Date(row.getValue("createdAt"))
 return (
 <div className="flex flex-col">
 <span className="text-xs text-foreground whitespace-nowrap">
 {d.toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" })}
 </span>
 <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 font-mono">
 <Clock className="w-2.5 h-2.5 shrink-0" />
 {d.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", hour12: false })}
 </span>
 </div>
 )
 },
 sortingFn: "datetime",
 },
 {
 id: "actions",
 enableHiding: false,
 cell: ({ row }) => {
 const ticket = row.original
 const nextStatus = NEXT_STATUS_MAP[ticket.status]
 const prevStatus = PREV_STATUS_MAP[ticket.status]

 async function handleForward() {
 if (!nextStatus) return
 const result = await updateTicketStatus(ticket.idxno, nextStatus.next)
 if (result.success) {
 toast.success(`Moved to ${STATUS_LABELS[nextStatus.next]}`)
 } else {
 toast.error(result.message || "Failed to update status")
 }
 }

 async function handleReverse() {
 if (!prevStatus) return
 const result = await updateTicketStatus(ticket.idxno, prevStatus.prev)
 if (result.success) {
 toast.success(`Reverted to ${STATUS_LABELS[prevStatus.prev]}`)
 } else {
 toast.error(result.message || "Failed to revert status")
 }
 }

 return (
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" className="h-8 w-8 p-0">
 <span className="sr-only">Open menu</span>
 <MoreHorizontal className="h-4 w-4" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="w-52">
 <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
 Actions
 </DropdownMenuLabel>
 <DropdownMenuItem
 className="gap-2 cursor-pointer"
 onClick={() => dispatch(openDetailSheet(ticket.idxno))}
 >
 <Eye className="w-3.5 h-3.5" />
 View Details
 </DropdownMenuItem>
 {perms.canEdit && (nextStatus || prevStatus) && <DropdownMenuSeparator />}
 {perms.canEdit && nextStatus && (
 <DropdownMenuItem className="gap-2 cursor-pointer" onClick={handleForward}>
 <ArrowRight className="w-3.5 h-3.5" />
 {nextStatus.label}
 </DropdownMenuItem>
 )}
 {perms.canEdit && prevStatus && (
 <DropdownMenuItem className="gap-2 cursor-pointer text-muted-foreground focus:text-foreground" onClick={handleReverse}>
 <Undo2 className="w-3.5 h-3.5" />
 {prevStatus.label}
 </DropdownMenuItem>
 )}
 </DropdownMenuContent>
 </DropdownMenu>
 )
 },
 },
 ]
}
