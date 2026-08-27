import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
 return (
 <div className="p-6 space-y-6 animate-pulse">
 <div className="flex items-center justify-between">
 <Skeleton className="h-8 w-64" />
 <Skeleton className="h-10 w-32" />
 </div>
 <div className="grid gap-6 md:grid-cols-2">
 <div className="space-y-4">
 <Skeleton className="h-10 w-full rounded-lg" />
 <Skeleton className="h-10 w-full rounded-lg" />
 <Skeleton className="h-32 w-full rounded-lg" />
 </div>
 <div className="space-y-4">
 <Skeleton className="h-10 w-full rounded-lg" />
 <Skeleton className="h-10 w-full rounded-lg" />
 <Skeleton className="h-32 w-full rounded-lg" />
 </div>
 </div>
 <Skeleton className="h-10 w-32 rounded-lg" />
 </div>
 );
}