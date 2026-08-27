"use client"

import {
 ColumnDef,
 flexRender,
 getCoreRowModel,
 useReactTable,
 getPaginationRowModel,
 SortingState,
 getSortedRowModel,
 ColumnFiltersState,
 getFilteredRowModel,
 VisibilityState,
} from "@tanstack/react-table"

import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow,
} from "@/components/ui/table"
import { DataTablePagination } from "./pagination"
import { DataTableViewOptions } from "./column-toggle"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface DataTableProps<TData, TValue> {
 columns: ColumnDef<TData, TValue>[]
 data: TData[]
 searchPlaceholder?: string
 /** Slot for action buttons rendered to the right of the search bar */
 toolbar?: React.ReactNode
 /** Server-side pagination props (when manualPagination = true): */
 manualPagination?: boolean
 pageCount?: number
 pageIndex?: number
 pageSize?: number
 onPaginationChange?: (pageIndex: number, pageSize: number) => void
 loading?: boolean
}

export function DataTable<TData, TValue>({
 columns,
 data,
 searchPlaceholder = "Search…",
 toolbar,
 manualPagination,
 pageCount: externalPageCount,
 pageIndex: externalPageIndex,
 pageSize: externalPageSize,
 onPaginationChange,
 loading,
}: DataTableProps<TData, TValue>) {
 const [sorting, setSorting] = useState<SortingState>([])
 const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
 const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
 const [globalFilter, setGlobalFilter] = useState("")

 const table = useReactTable({
 data,
 columns,
 getCoreRowModel: getCoreRowModel(),
 ...(manualPagination ? {} : { getPaginationRowModel: getPaginationRowModel() }),
 getSortedRowModel: getSortedRowModel(),
 getFilteredRowModel: getFilteredRowModel(),
 onSortingChange: setSorting,
 onColumnFiltersChange: setColumnFilters,
 onColumnVisibilityChange: setColumnVisibility,
 onGlobalFilterChange: setGlobalFilter,
 manualPagination,
 pageCount: manualPagination ? externalPageCount : undefined,
 state: { sorting, columnFilters, columnVisibility, globalFilter, ...(manualPagination ? { pagination: { pageIndex: externalPageIndex ?? 0, pageSize: externalPageSize ?? 10 } } : {}) },
 ...(manualPagination && onPaginationChange ? {
 onPaginationChange: (updater) => {
 const current = { pageIndex: externalPageIndex ?? 0, pageSize: externalPageSize ?? 10 };
 const next = typeof updater === 'function' ? updater(current) : updater;
 onPaginationChange(next.pageIndex, next.pageSize);
 },
 } : {}),
 })

 const rowCount = table.getFilteredRowModel().rows.length

 return (
 <div className="flex flex-col gap-0 rounded-xl border border-border bg-card shadow-sm overflow-hidden relative">
 {/* Toolbar */}
 <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-muted/30">
 <div className="relative flex-1 max-w-xs">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
 <Input
 placeholder={searchPlaceholder}
 value={globalFilter}
 onChange={(e) => setGlobalFilter(e.target.value)}
 className="pl-8 h-8 text-sm bg-background"
 />
 </div>
 <div className="flex items-center gap-2">
 {toolbar}
 <DataTableViewOptions table={table} />
 </div>
 </div>

 {/* Table */}
 <Table>
 <TableHeader>
 {table.getHeaderGroups().map((headerGroup) => (
 <TableRow key={headerGroup.id} className="bg-muted/40 hover:bg-muted/40 border-b border-border">
 {headerGroup.headers.map((header) => (
 <TableHead
 key={header.id}
 className="h-9 px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
 >
 {header.isPlaceholder
 ? null
 : flexRender(header.column.columnDef.header, header.getContext())}
 </TableHead>
 ))}
 </TableRow>
 ))}
 </TableHeader>
 <TableBody>
 {table.getRowModel().rows?.length ? (
 table.getRowModel().rows.map((row, i) => (
 <TableRow
 key={row.id}
 data-state={row.getIsSelected() && "selected"}
 className={cn(
 "transition-colors hover:bg-muted/30 border-b border-border last:border-0",
 i % 2 === 1 && "bg-muted/10"
 )}
 >
 {row.getVisibleCells().map((cell) => (
 <TableCell key={cell.id} className="px-4 py-3 text-sm">
 {flexRender(cell.column.columnDef.cell, cell.getContext())}
 </TableCell>
 ))}
 </TableRow>
 ))
 ) : (
 <TableRow>
 <TableCell
 colSpan={columns.length}
 className="h-32 text-center text-sm text-muted-foreground"
 >
 No results found.
 </TableCell>
 </TableRow>
 )}
 </TableBody>
 </Table>

 {/* Footer */}
 <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
 <span className="text-xs text-muted-foreground">
 {rowCount} {rowCount === 1 ? "record" : "records"}
 </span>
 <DataTablePagination
 table={table}
 manualPagination={manualPagination}
 pageCount={externalPageCount}
 pageIndex={externalPageIndex}
 pageSize={externalPageSize ?? 10}
 onPaginationChange={onPaginationChange}
 />
 </div>

 {/* Loading overlay */}
 {loading && (
 <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
 <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
 </div>
 )}
 </div>
 )
}
