export default function RootLoading() {
 return (
 <div className="min-h-screen flex items-center justify-center bg-background">
 <div className="flex flex-col items-center gap-4">
 <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
 <svg width="18" height="18" viewBox="0 0 22 22" fill="none" aria-hidden>
 <circle cx="11" cy="11" r="4" fill="white" />
 <circle cx="11" cy="11" r="8" stroke="white" strokeWidth="1.5" />
 <circle cx="11" cy="11" r="11" stroke="white" strokeWidth="0.75" />
 <line x1="3" y1="11" x2="19" y2="11" stroke="white" strokeWidth="1" />
 <line x1="11" y1="3" x2="11" y2="19" stroke="white" strokeWidth="1" />
 </svg>
 </div>
 <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
 </div>
 </div>
 );
}
