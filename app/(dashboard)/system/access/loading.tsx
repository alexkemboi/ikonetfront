export default function RolesLoading() {
  return (
    <div className="p-6 h-full animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <div className="h-6 w-52 rounded-lg bg-muted" />
          <div className="h-4 w-72 rounded bg-muted" />
        </div>
        <div className="h-9 w-28 rounded-lg bg-muted" />
      </div>

      {/* Two-pane */}
      <div className="flex gap-5 h-[calc(100vh-180px)]">
        {/* Left: role list */}
        <div className="w-72 shrink-0 flex flex-col gap-3">
          <div className="h-9 rounded-lg bg-muted" />
          <div className="flex-1 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/20" />
                    <div className="h-4 w-28 rounded bg-muted" />
                  </div>
                  <div className="h-5 w-14 rounded-full bg-muted" />
                </div>
                <div className="h-3 w-full rounded bg-muted pl-4" />
                <div className="h-3 w-3/4 rounded bg-muted pl-4" />
              </div>
            ))}
          </div>
        </div>

        {/* Right: detail card */}
        <div className="flex-1 bg-card rounded-2xl border border-border overflow-hidden flex flex-col">
          {/* Detail header */}
          <div className="px-6 py-5 border-b border-border">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="h-6 w-44 rounded-lg bg-muted" />
                <div className="h-4 w-64 rounded bg-muted" />
              </div>
              <div className="h-8 w-24 rounded-lg bg-muted" />
            </div>
          </div>

          {/* Tab bar */}
          <div className="px-6 border-b border-border flex gap-6 pt-3 pb-0">
            <div className="h-4 w-20 rounded bg-muted mb-3" />
            <div className="h-4 w-24 rounded bg-muted mb-3" />
          </div>

          {/* Permission tree skeleton */}
          <div className="px-6 py-5 space-y-3 flex-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 bg-card">
                  <div className="w-4 h-4 rounded bg-muted" />
                  <div className="h-4 flex-1 rounded bg-muted" style={{ maxWidth: `${55 + (i % 3) * 15}%` }} />
                  <div className="h-4 w-8 rounded bg-muted" />
                </div>
                {i % 2 === 0 && (
                  <div className="border-t border-border divide-y divide-border bg-muted/30">
                    {Array.from({ length: 2 }).map((_, j) => (
                      <div key={j} className="flex items-center gap-3 px-4 py-2.5">
                        <div className="w-4" />
                        <div className="w-4 h-4 rounded bg-muted" />
                        <div className="h-3.5 rounded bg-muted" style={{ width: `${40 + (j % 3) * 20}%` }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
