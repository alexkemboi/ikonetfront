export default function ResetPasswordLoading() {
 return (
 <div className="space-y-8 animate-pulse">
 <div className="space-y-1.5">
 <div className="w-8 h-1 rounded-full bg-warning mb-4" />
 <div className="h-7 w-48 rounded-lg bg-muted" />
 <div className="h-4 w-64 rounded bg-muted mt-2" />
 </div>

 <div className="space-y-5">
 <div className="space-y-2">
 <div className="h-4 w-28 rounded bg-muted" />
 <div className="h-10 rounded-lg bg-muted" />
 {/* Password strength bar */}
 <div className="flex gap-1 mt-1">
 {Array.from({ length: 4 }).map((_, i) => (
 <div key={i} className="h-1 flex-1 rounded-full bg-muted" />
 ))}
 </div>
 </div>
 <div className="space-y-2">
 <div className="h-4 w-36 rounded bg-muted" />
 <div className="h-10 rounded-lg bg-muted" />
 </div>
 <div className="h-10 rounded-lg bg-primary/20" />
 </div>
 </div>
 );
}
