"use client"

import { useMemo, useState } from "react"
import { Headphones, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/shared/data-table"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
 openCreateSheet,
 closeCreateSheet,
 closeDetailSheet,
} from "@/store/slices/ticketSlice"
import { usePermissions } from "@/providers/PermissionsProvider"
import { createTicketColumns } from "./columns"
import { TicketDetailSheet } from "./TicketDetailSheet"
import { CreateTicketSheet } from "./CreateTicketSheet"
import type { Ticket, TicketStatus } from "@/lib/types/ticket"
import type { ApiRoleUser } from "@/lib/types/roles"
import { cn } from "@/lib/utils"

interface TicketsClientProps {
 initialTickets: Ticket[]
 staffList: ApiRoleUser[]
}

const TABS: { value: TicketStatus | "ALL"; label: string }[] = [
 { value: "ALL", label: "All" },
 { value: "OPEN", label: "Open" },
 { value: "ASSIGNED", label: "Assigned" },
 { value: "IN_PROGRESS",label: "In Progress" },
 { value: "RESOLVED", label: "Resolved" },
 { value: "CLOSED", label: "Closed" },
]

export function TicketsClient({ initialTickets, staffList }: TicketsClientProps) {
 const dispatch = useAppDispatch()
 const perms = usePermissions("/customers/tickets")
 const selectedTicketId = useAppSelector((s) => s.ticket.selectedTicketId)
 const createSheetOpen = useAppSelector((s) => s.ticket.createSheetOpen)

 const [activeTab, setActiveTab] = useState<TicketStatus | "ALL">("ALL")

 // Derive filtered list — initialTickets is never stored in state
 const filtered = useMemo(
 () =>
 activeTab === "ALL"
 ? initialTickets
 : initialTickets.filter((t) => t.status === activeTab),
 [initialTickets, activeTab]
 )

 // Counts for tab badges
 const counts = useMemo(() => {
 const map: Record<string, number> = { ALL: initialTickets.length }
 for (const t of initialTickets) {
 map[t.status] = (map[t.status] ?? 0) + 1
 }
 return map
 }, [initialTickets])

 const openCount = counts["OPEN"] ?? 0
 const escalatedCount = initialTickets.filter((t) => t.isEscalated).length

 const columns = useMemo(() => createTicketColumns(dispatch, perms), [dispatch, perms])

 const selectedTicket = selectedTicketId !== null
 ? initialTickets.find((t) => t.idxno === selectedTicketId) ?? null
 : null

 return (
 <>
 <div className="space-y-6 p-8 pt-6">
 {/* Page header */}
 <div className="flex items-start justify-between">
 <div className="flex items-center gap-3">
 <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
 <Headphones className="h-5 w-5 text-primary" />
 </div>
 <div>
 <h1 className="text-xl font-normal text-foreground">Support Tickets</h1>
 <p className="text-sm text-muted-foreground">
 {initialTickets.length} total
 {openCount > 0 && <> · <span className="text-blue-600">{openCount} open</span></>}
 {escalatedCount > 0 && (
 <> · <span className="text-destructive">{escalatedCount} escalated</span></>
 )}
 </p>
 </div>
 </div>
 {perms.canCreate && (
 <Button size="sm" onClick={() => dispatch(openCreateSheet())}>
 <Plus className="mr-1.5 h-4 w-4" />
 Create Ticket
 </Button>
 )}
 </div>

 {/* Status tabs */}
 <div className="flex gap-1 border-b border-border">
 {TABS.map((tab) => (
 <button
 key={tab.value}
 onClick={() => setActiveTab(tab.value)}
 className={cn(
 "relative px-3 py-2 text-sm font-medium transition-colors",
 "focus-visible:outline-none",
 activeTab === tab.value
 ? "text-foreground"
 : "text-muted-foreground hover:text-foreground"
 )}
 >
 {tab.label}
 {counts[tab.value] != null && counts[tab.value] > 0 && (
 <span
 className={cn(
 "ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 py-0 text-[10px] font-semibold min-w-4.5 h-4.5",
 activeTab === tab.value
 ? "bg-primary text-primary-foreground"
 : "bg-muted text-muted-foreground"
 )}
 >
 {counts[tab.value]}
 </span>
 )}
 {activeTab === tab.value && (
 <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
 )}
 </button>
 ))}
 </div>

 {/* Data table */}
 <DataTable
 columns={columns}
 data={filtered}
 searchPlaceholder="Search tickets…"
 />
 </div>

 <TicketDetailSheet
 ticket={selectedTicket}
 staffList={staffList}
 onClose={() => dispatch(closeDetailSheet())}
 />

 <CreateTicketSheet
 open={createSheetOpen}
 onClose={() => dispatch(closeCreateSheet())}
 />
 </>
 )
}
