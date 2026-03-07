export default function AlertsLoading() {
  return (
    <div className="p-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-2">
          <div className="h-6 w-40 rounded-lg bg-muted" />
          <div className="h-4 w-80 rounded bg-muted" />
        </div>
        <div className="h-9 w-32 rounded-lg bg-muted" />
      </div>

      {/* Channel cards */}
      <div className="mb-6 space-y-3">
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border-2 border-border bg-card p-5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-muted" />
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-3 w-full rounded bg-muted" />
              <div className="h-3 w-3/4 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>

      <div className="h-px bg-border mb-8" />

      {/* Providers table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 w-44 rounded bg-muted" />
          <div className="h-4 w-20 rounded bg-muted" />
        </div>
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="h-10 bg-muted/40 border-b border-border" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-[auto_1fr_1fr_auto_auto_auto] gap-4 items-center px-5 py-4 border-b border-border last:border-0"
            >
              <div className="w-8 h-8 rounded-lg bg-muted" />
              <div className="space-y-1.5">
                <div className="h-4 w-28 rounded bg-muted" />
                <div className="h-3 w-16 rounded bg-muted" />
              </div>
              <div className="h-4 w-36 rounded bg-muted" />
              <div className="h-8 w-24 rounded bg-muted" />
              <div className="h-5 w-14 rounded-full bg-muted" />
              <div className="flex gap-1">
                <div className="w-7 h-7 rounded-md bg-muted" />
                <div className="w-7 h-7 rounded-md bg-muted" />
                <div className="w-7 h-7 rounded-md bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
