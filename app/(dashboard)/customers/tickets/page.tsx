import { Suspense } from "react"
import { getTickets } from "@/actions/ticket"
import { getSystemUsers } from "@/actions/system"
import { TicketsClient } from "./_components/TicketsClient"
import { Skeleton } from "@/components/ui/skeleton"

function TicketsPageSkeleton() {
 return (
 <div className="space-y-6 p-8 pt-6">
 <div className="flex items-center justify-between">
 <div className="space-y-2">
 <Skeleton className="h-8 w-48" />
 <Skeleton className="h-4 w-64" />
 </div>
 <Skeleton className="h-9 w-32" />
 </div>
 <Skeleton className="h-10 w-full max-w-lg" />
 <Skeleton className="h-[400px] w-full rounded-xl" />
 </div>
 )
}

// Promise.all fetches both in parallel — neither waits for the other.
// Results are passed as props; no useState or useEffect needed in the page.
async function TicketsPage() {
 const [ticketsRes, staffList] = await Promise.all([
 getTickets(),
 getSystemUsers(),
 ])

 const tickets = ticketsRes.success ? (ticketsRes.data ?? []) : []

 return <TicketsClient initialTickets={tickets} staffList={staffList} />
}

export default function Page() {
 return (
 <Suspense fallback={<TicketsPageSkeleton />}>
 <TicketsPage />
 </Suspense>
 )
}
