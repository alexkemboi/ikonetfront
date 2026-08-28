import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
 return (
 <div className="p-6 space-y-6 animate-pulse">
 <div className="flex items-center justify-between">
 <Skeleton className="h-8 w-64" />
 <Skeleton className="h-10 w-32" />
 </div>
 <div className="grid gap-4 md:grid-cols-4">
 <Skeleton className="h-28 w-full rounded-xl" />
 <Skeleton className="h-28 w-full rounded-xl" />
 <Skeleton className="h-28 w-full rounded-xl" />
 <Skeleton className="h-28 w-full rounded-xl" />
 </div>
 <Skeleton className="h-96 w-full rounded-xl" />
 </div>
 );
}