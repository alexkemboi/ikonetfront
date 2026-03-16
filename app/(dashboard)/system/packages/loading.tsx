export default function InternetPackagesLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-muted" />
          <div className="space-y-2">
            <div className="h-7 w-44 rounded-lg bg-muted" />
            <div className="h-4 w-28 rounded bg-muted" />
          </div>
        </div>
        <div className="h-9 w-32 rounded-lg bg-muted" />
      </div>

      {/* Category filter pills */}
      <div className="flex items-center gap-2">
        {[80, 64, 60, 72, 76].map((w, i) => (
          <div key={i} className="h-8 rounded-full bg-muted" style={{ width: w }} />
        ))}
      </div>

      {/* Package cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card overflow-hidden">
            {/* Top accent */}
            <div className="h-1 bg-muted" />

            <div className="p-5 space-y-4">
              {/* Name + price */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-5 w-16 rounded-full bg-muted" />
                </div>
                <div className="h-7 w-16 rounded bg-muted shrink-0" />
              </div>

              {/* Validity row */}
              <div className="h-4 w-2/3 rounded bg-muted" />

              {/* Speed block */}
              <div className="rounded-lg bg-muted/50 px-3 py-2 flex items-center gap-4">
                <div className="h-4 w-20 rounded bg-muted" />
                <div className="w-px h-4 bg-border" />
                <div className="h-4 w-20 rounded bg-muted" />
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2">
                <div className="h-5 w-16 rounded-full bg-muted" />
                <div className="h-5 w-18 rounded-full bg-muted" />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center border-t border-border">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex-1 flex justify-center py-2.5">
                  <div className="h-4 w-14 rounded bg-muted" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
