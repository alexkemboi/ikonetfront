import { type Table } from "@tanstack/react-table"
import {
 ChevronLeft,
 ChevronRight,
 ChevronsLeft,
 ChevronsRight,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select"

interface DataTablePaginationProps<TData> {
 table: Table<TData>
 manualPagination?: boolean
 pageCount?: number
 pageIndex?: number
 pageSize?: number
 onPaginationChange?: (pageIndex: number, pageSize: number) => void
}

export function DataTablePagination<TData>({
 table,
 manualPagination,
 pageCount: externalPageCount,
 pageIndex: externalPageIndex,
 pageSize: externalPageSize,
 onPaginationChange,
}: DataTablePaginationProps<TData>) {
 const currentPageIndex = manualPagination ? (externalPageIndex ?? 0) : table.getState().pagination.pageIndex;
 const totalPages = manualPagination ? (externalPageCount ?? 0) : table.getPageCount();
 const currentPageSize = manualPagination ? (externalPageSize ?? 10) : table.getState().pagination.pageSize;

 return (
 <div className="flex items-center justify-between px-2">
 <div className="flex-1 text-sm text-muted-foreground">
 {table.getFilteredSelectedRowModel().rows.length} of{" "}
 {table.getFilteredRowModel().rows.length} row(s) selected.
 </div>
 <div className="flex items-center space-x-6 lg:space-x-8">
 <div className="flex items-center space-x-2">
 <p className="text-sm font-medium">Rows per page</p>
 <Select
 value={`${currentPageSize}`}
 onValueChange={(value) => {
 if (manualPagination && onPaginationChange) {
 onPaginationChange(0, Number(value));
 } else {
 table.setPageSize(Number(value));
 }
 }}
 >
 <SelectTrigger className="h-8 w-[70px]">
 <SelectValue placeholder={currentPageSize} />
 </SelectTrigger>
 <SelectContent side="top">
 {[10, 20, 25, 30, 40, 50].map((pageSize) => (
 <SelectItem key={pageSize} value={`${pageSize}`}>
 {pageSize}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 <div className="flex w-[100px] items-center justify-center text-sm font-medium">
 Page {currentPageIndex + 1} of{" "}
 {totalPages}
 </div>
 <div className="flex items-center space-x-2">
 <Button
 variant="outline"
 size="icon"
 className="hidden size-8 lg:flex"
 onClick={() => {
 if (manualPagination && onPaginationChange) {
 onPaginationChange(0, currentPageSize);
 } else {
 table.setPageIndex(0);
 }
 }}
 disabled={currentPageIndex <= 0}
 >
 <span className="sr-only">Go to first page</span>
 <ChevronsLeft />
 </Button>
 <Button
 variant="outline"
 size="icon"
 className="size-8"
 onClick={() => {
 if (manualPagination && onPaginationChange) {
 onPaginationChange(currentPageIndex - 1, currentPageSize);
 } else {
 table.previousPage();
 }
 }}
 disabled={currentPageIndex <= 0}
 >
 <span className="sr-only">Go to previous page</span>
 <ChevronLeft />
 </Button>
 <Button
 variant="outline"
 size="icon"
 className="size-8"
 onClick={() => {
 if (manualPagination && onPaginationChange) {
 onPaginationChange(currentPageIndex + 1, currentPageSize);
 } else {
 table.nextPage();
 }
 }}
 disabled={currentPageIndex >= totalPages - 1}
 >
 <span className="sr-only">Go to next page</span>
 <ChevronRight />
 </Button>
 <Button
 variant="outline"
 size="icon"
 className="hidden size-8 lg:flex"
 onClick={() => {
 if (manualPagination && onPaginationChange) {
 onPaginationChange(totalPages - 1, currentPageSize);
 } else {
 table.setPageIndex(table.getPageCount() - 1);
 }
 }}
 disabled={currentPageIndex >= totalPages - 1}
 >
 <span className="sr-only">Go to last page</span>
 <ChevronsRight />
 </Button>
 </div>
 </div>
 </div>
 )
}
