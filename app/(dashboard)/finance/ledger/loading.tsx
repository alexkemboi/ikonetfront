import { Skeleton } from "@/components/ui/skeleton";

export default function LedgerLoading() {
  return (
    <div className="min-h-screen p-4 text-foreground sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6 animate-pulse">
        {/* Header */}
        <div>
          <Skeleton className="h-3 w-48" />
          <Skeleton className="mt-2 h-8 w-64" />
          <Skeleton className="mt-2 h-3 w-72" />
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 shadow-lg">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-8 w-28" />
              <Skeleton className="mt-2 h-3 w-20" />
            </div>
          ))}
        </div>

        {/* Two-pane skeleton */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
              <Skeleton className="h-3 w-36" />
              <Skeleton className="mt-2 h-7 w-28" />
              <div className="mt-4 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-2 h-7 w-36" />
              <Skeleton className="mt-5 h-9 w-full rounded-lg" />
              <div className="mt-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}