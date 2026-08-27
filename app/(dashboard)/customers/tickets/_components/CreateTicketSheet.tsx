"use client"

import { useEffect, useRef, useState } from "react"
import { useFormik } from "formik"
import * as Yup from "yup"
import { toast } from "sonner"
import { Loader2, Search, X, ChevronDown } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { createTicket } from "@/actions/ticket"
import { getCustomers } from "@/actions/customer"
import type { TicketPriority } from "@/lib/types/ticket"
import type { Customer } from "@/lib/types/customer"

interface CreateTicketSheetProps {
  open: boolean
  onClose: () => void
}

// ─── Searchable customer picker ───────────────────────────────────────────────
interface CustomerSearchSelectProps {
  customers: Customer[]
  loading: boolean
  value: number | null         // formik field value (userIdxno)
  onChange: (id: number | null, name: string) => void
  error?: string
}

function CustomerSearchSelect({ customers, loading, value, onChange, error }: CustomerSearchSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = customers.find((c) => c.userIdxno === value) ?? null

  const filtered = search.trim()
    ? customers.filter(
        (c) =>
          c.fullName.toLowerCase().includes(search.toLowerCase()) ||
          c.username.toLowerCase().includes(search.toLowerCase()) ||
          (c.acno ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : customers

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function handleSelect(c: Customer) {
    onChange(c.userIdxno, c.fullName)
    setSearch("")
    setOpen(false)
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange(null, "")
    setSearch("")
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center justify-between rounded-md border bg-background px-3 py-2 text-sm text-left",
          "focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors",
          error ? "border-destructive" : "border-border",
          "hover:bg-muted/30"
        )}
      >
        <span className={selected ? "text-foreground" : "text-muted-foreground"}>
          {loading
            ? "Loading customers…"
            : selected
            ? `${selected.fullName} — ${selected.username}`
            : "Search and select a customer…"}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {selected && (
            <X
              className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground"
              onClick={handleClear}
            />
          )}
          <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg">
          {/* Search input */}
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, username or account…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          {/* Options */}
          <ScrollArea className="max-h-48">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-xs text-muted-foreground text-center">
                {search ? "No customers match your search." : "No customers available."}
              </p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.userIdxno}
                  type="button"
                  onClick={() => handleSelect(c)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors",
                    value === c.userIdxno && "bg-primary/5 text-primary"
                  )}
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                    {(c.firstname?.[0] ?? "?").toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{c.fullName}</p>
                    <p className="text-[11px] text-muted-foreground font-mono truncate">
                      {c.username}{c.acno ? ` · ${c.acno}` : ""}
                    </p>
                  </div>
                </button>
              ))
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  )
}
// ─────────────────────────────────────────────────────────────────────────────

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  )
}

const validationSchema = Yup.object({
  title:       Yup.string().trim().required("Title is required"),
  description: Yup.string().trim().required("Description is required"),
  priority:    Yup.string().oneOf(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).required("Priority is required"),
  customerId:  Yup.number().nullable().optional(),
})

export function CreateTicketSheet({ open, onClose }: CreateTicketSheetProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customersLoading, setCustomersLoading] = useState(false)
  const [selectedCustomerName, setSelectedCustomerName] = useState("")

  // Fetch customers once when sheet opens
  useEffect(() => {
    if (!open) return
    setCustomersLoading(true)
    getCustomers(0, 100).then((res) => {
      setCustomers(res?.data?.content ?? [])
    }).finally(() => setCustomersLoading(false))
  }, [open])

  const formik = useFormik({
    initialValues: {
      title:       "",
      description: "",
      priority:    "" as TicketPriority | "",
      customerId:  null as number | null,
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      const result = await createTicket({
        title:       values.title.trim(),
        description: values.description.trim(),
        priority:    values.priority as TicketPriority,
        customerId:  values.customerId,
      })
      if (result.success) {
        toast.success("Ticket created", { description: values.title })
        resetForm()
        setSelectedCustomerName("")
        onClose()
      } else {
        toast.error("Failed to create ticket", { description: result.message })
      }
    },
  })

  function handleClose() {
    formik.resetForm()
    setSelectedCustomerName("")
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent side="right" className="sm:max-w-md w-full p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b border-border shrink-0">
          <SheetTitle className="text-base font-semibold">Create Support Ticket</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Fill in the details below. Required fields are marked.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <form onSubmit={formik.handleSubmit} id="create-ticket-form">
            <div className="px-6 py-5 space-y-5">
              <p className="text-xs font-bold text-foreground uppercase tracking-widest">
                Ticket Details
              </p>

              <Field label="Title *" error={formik.touched.title ? formik.errors.title : undefined}>
                <Input
                  {...formik.getFieldProps("title")}
                  placeholder="e.g. Unable to connect to PPPoE"
                  className={cn(formik.touched.title && formik.errors.title && "border-destructive focus-visible:ring-destructive/30")}
                />
              </Field>

              <Field label="Description *" error={formik.touched.description ? formik.errors.description : undefined}>
                <textarea
                  {...formik.getFieldProps("description")}
                  rows={4}
                  placeholder="Describe the issue in detail…"
                  className={cn(
                    "w-full rounded-md border bg-transparent px-3 py-2 text-sm text-foreground resize-none shadow-xs",
                    "placeholder:text-muted-foreground outline-none transition-[color,box-shadow]",
                    "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    formik.touched.description && formik.errors.description
                      ? "border-destructive ring-destructive/20"
                      : "border-input"
                  )}
                />
              </Field>

              <Field label="Priority *" error={formik.touched.priority ? formik.errors.priority : undefined}>
                <select
                  {...formik.getFieldProps("priority")}
                  className={cn(
                    "w-full rounded-md border bg-transparent px-3 py-2 text-sm text-foreground shadow-xs",
                    "outline-none transition-[color,box-shadow]",
                    "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    formik.touched.priority && formik.errors.priority
                      ? "border-destructive ring-destructive/20"
                      : "border-input"
                  )}
                >
                  <option value="">Select priority…</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </Field>

              <Separator />

              <p className="text-xs font-bold text-foreground uppercase tracking-widest">
                Link to Customer <span className="text-muted-foreground font-normal normal-case">(optional)</span>
              </p>

              <Field label="Customer" error={formik.touched.customerId ? formik.errors.customerId : undefined}>
                <CustomerSearchSelect
                  customers={customers}
                  loading={customersLoading}
                  value={formik.values.customerId}
                  onChange={(id, name) => {
                    formik.setFieldValue("customerId", id)
                    setSelectedCustomerName(name)
                  }}
                  error={formik.touched.customerId ? formik.errors.customerId : undefined}
                />
                {selectedCustomerName && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Selected: <span className="text-foreground font-medium">{selectedCustomerName}</span>
                  </p>
                )}
              </Field>
            </div>
          </form>
        </ScrollArea>

        <div className="border-t border-border px-6 py-4 flex justify-end gap-2 shrink-0">
          <Button variant="outline" size="sm" type="button" onClick={handleClose} disabled={formik.isSubmitting}>
            Cancel
          </Button>
          <Button size="sm" type="submit" form="create-ticket-form" disabled={formik.isSubmitting}>
            {formik.isSubmitting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Create Ticket
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
