export default function Loading() {
 return (
 <div className="min-h-screen p-4 text-foreground sm:p-6 lg:p-8">
 <div className="mx-auto max-w-7xl space-y-6 animate-pulse">
 <div className="rounded-2xl border border-border bg-card p-6">
 <div className="h-4 w-1/2 rounded bg-[#262626]" />
 <div className="mt-4 h-10 w-2/3 rounded bg-[#262626]" />
 <div className="mt-3 h-4 w-3/4 rounded bg-[#262626]" />
 </div>
 <div className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4">
 <div className="h-4 w-1/3 rounded bg-[#262626]" />
 <div className="h-4 w-1/4 rounded bg-[#262626]" />
 </div>
 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
 <div className="h-32 rounded-2xl border border-border bg-card" />
 <div className="h-32 rounded-2xl border border-border bg-card" />
 <div className="h-32 rounded-2xl border border-border bg-card" />
 <div className="h-32 rounded-2xl border border-border bg-card" />
 </div>
 <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
 <div className="h-80 rounded-2xl border border-border bg-card" />
 <div className="h-80 rounded-2xl border border-border bg-card" />
 </div>
 <div className="h-64 rounded-2xl border border-border bg-card" />
 <div className="h-72 rounded-2xl border border-border bg-card" />
 </div>
 </div>
 );
}