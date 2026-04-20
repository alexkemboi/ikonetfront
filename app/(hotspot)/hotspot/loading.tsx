export default function HotspotLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Step indicator */}
      <div className="flex items-center gap-2 justify-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-muted" />
            {i < 4 && <div className="w-8 h-px bg-muted" />}
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <div className="h-6 w-40 rounded-lg bg-muted" />
        <div className="h-4 w-64 rounded bg-muted mt-1" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-muted shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="h-3 w-48 rounded bg-muted" />
            </div>
            <div className="w-5 h-5 rounded-full border-2 border-muted" />
          </div>
        ))}
      </div>

      <div className="h-10 rounded-lg bg-primary/20" />
    </div>
  );
}
