import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
 return (
 <div className="p-6 space-y-6 animate-pulse">
 <div className="flex items-center gap-4">
 <Skeleton className="h-16 w-16 rounded-full" />
 <div className="space-y-2">
 <Skeleton className="h-6 w-48" />
 <Skeleton className="h-4 w-32" />
 </div>
 </div>
 <div className="grid gap-4 md:grid-cols-3">
 <Skeleton className="h-28 w-full rounded-xl" />
 <Skeleton className="h-28 w-full rounded-xl" />
 <Skeleton className="h-28 w-full rounded-xl" />
 </div>
 <Skeleton className="h-64 w-full rounded-xl" />
 </div>
 );
}