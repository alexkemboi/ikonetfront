"use client"

import { useEffect, useState } from "react"
import { useFormik } from "formik"
import * as Yup from "yup"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Flame, Clock, Send, UserCheck, AlertCircle, Loader2, Undo2, UserPlus } from "lucide-react"
import {
 Sheet,
 SheetContent,
 SheetHeader,
 SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
 NEXT_STATUS_MAP,
 PREV_STATUS_MAP,
 PRIORITY_BADGE,
 STATUS_BADGE,
} from "@/lib/types/ticket"
import type { Ticket, TicketComment, TicketStatus, TicketPriority } from "@/lib/types/ticket"
import type { ApiRoleUser } from "@/lib/types/roles"
import { usePermissions } from "@/providers/PermissionsProvider"
import {
 getTicketComments,
 updateTicketStatus,
 assignTicket,
 addTicketComment,
} from "@/actions/ticket"

interface TicketDetailSheetProps {
 ticket: Ticket | null
 staffList: ApiRoleUser[]
 onClose: () => void
}

const PRIORITY_LABELS: Record<TicketPriority, string> = {
 LOW: "Low", MEDIUM: "Medium", HIGH: "High", URGENT: "Urgent",
}

const STATUS_LABELS: Record<TicketStatus, string> = {
 OPEN: "Open", ASSIGNED: "Assigned", IN_PROGRESS: "In Progress",
 RESOLVED: "Resolved", CLOSED: "Closed",
}

function SlaDisplay({ deadline }: { deadline: string | null }) {
 if (!deadline) return <span className="text-sm text-muted-foreground">Not set</span>

 const diff = new Date(deadline).getTime() - Date.now()
 const isOverdue = diff < 0
 const formatted = new Date(deadline).toLocaleString("en-KE", {
 day: "2-digit", month: "short", year: "numeric",
 hour: "2-digit", minute: "2-digit", hour12: false,
 })

 return (
 <div className="flex items-center gap-2">
 <span className="text-sm text-foreground">{formatted}</span>
 {isOverdue && (
 <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-destructive/10 text-destructive border-destructive/20">
 <AlertCircle className="mr-1 h-2.5 w-2.5" />
 OVERDUE
 </Badge>
 )}
 </div>
 )
}

function CommentItem({ comment }: { comment: TicketComment }) {
 const d = new Date(comment.createdAt)
 return (
 <div className="space-y-1">
 <div className="flex items-center gap-2">
 <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
 {(comment.authorName ?? "?").charAt(0).toUpperCase()}
 </div>
 <span className="text-xs font-medium text-foreground">{comment.authorName ?? "Unknown"}</span>
 <span className="text-[11px] text-muted-foreground flex items-center gap-1">
 <Clock className="h-2.5 w-2.5" />
 {d.toLocaleDateString("en-KE", { day: "2-digit", month: "short" })}{" "}
 {d.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", hour12: false })}
 </span>
 </div>
 <p className="ml-8 text-xs text-muted-foreground leading-relaxed">{comment.comment}</p>
 </div>
 )
}

export function TicketDetailSheet({ ticket, staffList, onClose }: TicketDetailSheetProps) {
 const { data: session } = useSession()
 const perms = usePermissions("/customers/tickets")

 const [comments, setComments] = useState<TicketComment[]>([])
 const [commentsLoading, setCommentsLoading] = useState(false)
 const [statusLoading, setStatusLoading] = useState(false)
 const [reverseLoading, setReverseLoading] = useState(false)
 const [assignLoading, setAssignLoading] = useState(false)

 useEffect(() => {
 if (!ticket) {
 setComments([])
 return
 }
 setCommentsLoading(true)
 getTicketComments(ticket.idxno)
 .then((res) => { if (res.success) setComments(Array.isArray(res.data) ? res.data : []) })
 .finally(() => setCommentsLoading(false))
 }, [ticket?.idxno])

 // Move forward — blocked if no assignee and target status requires one
 async function handleStatusForward() {
 if (!ticket) return
 const next = NEXT_STATUS_MAP[ticket.status]
 if (!next) return

 // A ticket must have someone assigned before it can leave OPEN
 if (!ticket.assignedAgentName && next.next !== "OPEN") {
 toast.error("Assign a staff member before moving this ticket forward", {
 description: "Use the Assigned Agent section below to assign someone first.",
 })
 return
 }

 setStatusLoading(true)
 const result = await updateTicketStatus(ticket.idxno, next.next)
 setStatusLoading(false)
 if (result.success) {
 toast.success(`Moved to ${STATUS_LABELS[next.next]}`)
 } else {
 toast.error(result.message || "Failed to update status")
 }
 }

 // Move backward — no assignment check needed
 async function handleStatusReverse() {
 if (!ticket) return
 const prev = PREV_STATUS_MAP[ticket.status]
 if (!prev) return
 setReverseLoading(true)
 const result = await updateTicketStatus(ticket.idxno, prev.prev)
 setReverseLoading(false)
 if (result.success) {
 toast.success(`Reverted to ${STATUS_LABELS[prev.prev]}`)
 } else {
 toast.error(result.message || "Failed to revert status")
 }
 }

 async function handleAssign(e: React.ChangeEvent<HTMLSelectElement>) {
 if (!ticket) return
 const staffId = Number(e.target.value)
 if (!staffId) return
 setAssignLoading(true)
 const result = await assignTicket(ticket.idxno, staffId)
 setAssignLoading(false)
 if (result.success) {
 toast.success("Ticket assigned successfully")
 } else {
 toast.error(result.message || "Failed to assign ticket")
 }
 }

 // Self-assign: find the current user in the staffList by username
 async function handleSelfAssign() {
 if (!ticket || !session?.user) return
 const me = staffList.find((s) => s.username === session.user!.username)
 if (!me) {
 toast.error("Your account is not in the staff list")
 return
 }
 setAssignLoading(true)
 const result = await assignTicket(ticket.idxno, me.idxno)
 setAssignLoading(false)
 if (result.success) {
 toast.success("Assigned to you")
 } else {
 toast.error(result.message || "Failed to assign ticket")
 }
 }

 const commentFormik = useFormik({
 initialValues: { comment: "" },
 validationSchema: Yup.object({
 comment: Yup.string().trim().min(1, "Comment cannot be empty").required("Required"),
 }),
 onSubmit: async (values, { resetForm }) => {
 if (!ticket) return
 const authorUserId = session?.user?.id ? Number(session.user.id) : undefined
 const result = await addTicketComment(ticket.idxno, {
 comment: values.comment.trim(),
 authorUserId,
 })
 if (result.success) {
 if (result.data) setComments((prev) => [...prev, result.data!])
 resetForm()
 toast.success("Comment added")
 } else {
 toast.error(result.message || "Failed to add comment")
 }
 },
 })

 useEffect(() => {
 if (!ticket) return
 commentFormik.resetForm()
 }, [ticket?.idxno])

 const nextStatus = ticket ? NEXT_STATUS_MAP[ticket.status] : null
 const prevStatus = ticket ? PREV_STATUS_MAP[ticket.status] : null
 const needsAssignee = ticket && !ticket.assignedAgentName && nextStatus

 return (
 <Sheet open={ticket !== null} onOpenChange={(open) => !open && onClose()}>
 <SheetContent side="right" className="sm:max-w-xl w-[92vw] p-0 flex flex-col overflow-hidden">
 {ticket && (
 <>
 {/* Fixed header */}
 <SheetHeader className="px-6 py-4 border-b border-border shrink-0">
 <div className="flex items-start gap-3">
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-1 flex-wrap">
 <span className="font-mono text-[11px] font-medium text-primary bg-primary/5 px-1.5 py-0.5 rounded">
 {ticket.ticketNumber}
 </span>
 <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 font-semibold uppercase tracking-wide", PRIORITY_BADGE[ticket.priority])}>
 {PRIORITY_LABELS[ticket.priority]}
 </Badge>
 <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 font-medium", STATUS_BADGE[ticket.status])}>
 {STATUS_LABELS[ticket.status]}
 </Badge>
 {ticket.isEscalated && (
 <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-destructive/10 text-destructive border-destructive/20">
 <Flame className="mr-1 h-2.5 w-2.5" />
 Escalated
 </Badge>
 )}
 </div>
 <SheetTitle className="text-sm font-semibold text-foreground leading-snug">
 {ticket.title}
 </SheetTitle>
 {ticket.customerName && (
 <p className="text-xs text-muted-foreground mt-0.5">Customer: {ticket.customerName}</p>
 )}
 </div>
 </div>
 </SheetHeader>

 {/* Scrollable body */}
 <ScrollArea className="flex-1 min-h-0">
 <div className="px-6 py-4 space-y-5">

 {/* Assignee warning — only meaningful when user can act */}
 {perms.canEdit && needsAssignee && (
 <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/5 px-3 py-2.5">
 <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
 <p className="text-xs text-warning">
 Assign a staff member before moving this ticket forward.
 </p>
 </div>
 )}

 {/* Status workflow */}
 {perms.canEdit && (nextStatus || prevStatus) && (
 <div className="space-y-2">
 <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
 Status Actions
 </p>
 <div className="flex items-center gap-2 flex-wrap">
 {nextStatus && (
 <Button
 size="sm"
 onClick={handleStatusForward}
 disabled={statusLoading}
 >
 {statusLoading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
 {nextStatus.label}
 </Button>
 )}
 {prevStatus && (
 <Button
 size="sm"
 variant="outline"
 onClick={handleStatusReverse}
 disabled={reverseLoading}
 >
 {reverseLoading
 ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
 : <Undo2 className="mr-1.5 h-3.5 w-3.5" />
 }
 {prevStatus.label}
 </Button>
 )}
 </div>
 </div>
 )}

 <Separator />

 {/* Assign staff — edit permission required */}
 {perms.canEdit && (
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-1.5">
 <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
 <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
 Assigned Agent
 </p>
 {assignLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
 </div>
 <button
 type="button"
 onClick={handleSelfAssign}
 disabled={assignLoading}
 className="flex items-center gap-1 text-[11px] text-primary hover:underline disabled:opacity-50"
 >
 <UserPlus className="h-3 w-3" />
 Assign to me
 </button>
 </div>

 {ticket.assignedAgentName && (
 <p className="text-xs text-foreground font-medium">
 Currently: <span className="text-primary">{ticket.assignedAgentName}</span>
 </p>
 )}

 <select
 onChange={handleAssign}
 defaultValue=""
 className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none shadow-xs transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
 >
 <option value="" disabled>Reassign to another agent…</option>
 {staffList.map((s) => (
 <option key={s.idxno} value={s.idxno}>
 {s.fullName || s.fname} — {s.role}
 </option>
 ))}
 </select>
 </div>
 )}

 <Separator />

 {/* Comments */}
 <div className="space-y-4">
 <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
 Comments ({comments.length})
 </p>

 <form onSubmit={commentFormik.handleSubmit} className="space-y-2 pt-2">
 <textarea
 {...commentFormik.getFieldProps("comment")}
 rows={3}
 placeholder="Add a comment…"
 className={cn(
 "w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground resize-none",
 "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30",
 commentFormik.touched.comment && commentFormik.errors.comment
 ? "border-destructive"
 : "border-border"
 )}
 />
 {commentFormik.touched.comment && commentFormik.errors.comment && (
 <p className="text-xs text-destructive">{commentFormik.errors.comment}</p>
 )}
 <div className="flex justify-end">
 <Button type="submit" size="sm" disabled={commentFormik.isSubmitting}>
 {commentFormik.isSubmitting
 ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
 : <Send className="mr-1.5 h-3.5 w-3.5" />
 }
 Post Comment
 </Button>
 </div>
 </form>

 {commentsLoading ? (
 <div className="flex items-center gap-2 text-xs text-muted-foreground">
 <Loader2 className="h-3.5 w-3.5 animate-spin" />
 Loading comments…
 </div>
 ) : comments.length === 0 ? (
 <p className="text-xs text-muted-foreground italic">No comments yet.</p>
 ) : (
 <div className="space-y-4">
 {comments.map((c, i) => (
 <CommentItem key={c.idxno ?? i} comment={c} />
 ))}
 </div>
 )}
 </div>

 <Separator />

 {/* SLA */}
 <div className="space-y-1.5">
 <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">SLA Deadline</p>
 <SlaDisplay deadline={ticket.slaDeadline} />
 </div>

 <Separator />

 {/* Description */}
 <div className="space-y-1.5">
 <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description</p>
 <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
 </div>

 <Separator />

 {/* Meta */}
 <div className="grid grid-cols-2 gap-3 text-xs">
 <div>
 <p className="text-muted-foreground uppercase tracking-wide font-semibold mb-0.5">Created by</p>
 <p className="text-foreground">{ticket.creatorName ?? "—"}</p>
 </div>
 <div>
 <p className="text-muted-foreground uppercase tracking-wide font-semibold mb-0.5">Created at</p>
 <p className="text-foreground">
 {new Date(ticket.createdAt).toLocaleString("en-KE", {
 day: "2-digit", month: "short", year: "numeric",
 hour: "2-digit", minute: "2-digit", hour12: false,
 })}
 </p>
 </div>
 </div>

 <Separator />

 </div>
 </ScrollArea>
 </>
 )}
 </SheetContent>
 </Sheet>
 )
}
