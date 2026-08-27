import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
 return (
 <div className="min-h-screen flex">
 {/* ── Brand Panel (desktop only) ── */}
 <aside className="hidden lg:flex lg:w-[42%] flex-col justify-between bg-primary text-primary-foreground p-12 relative overflow-hidden">
 {/* Decorative network circles */}
 <div
 aria-hidden
 className="absolute -top-24 -right-24 w-96 h-96 rounded-full border border-white/10"
 />
 <div
 aria-hidden
 className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full border border-white/10"
 />
 <div
 aria-hidden
 className="absolute top-1/3 right-8 w-48 h-48 rounded-full border border-white/5"
 />

 {/* Logo */}
 <div className="relative z-10">
 <div className="flex items-center gap-3">
 {/* Icon placeholder — replace with actual SVG logo */}
 <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center">
 <svg
 width="22"
 height="22"
 viewBox="0 0 22 22"
 fill="none"
 xmlns="http://www.w3.org/2000/svg"
 aria-hidden
 >
 <circle cx="11" cy="11" r="4" fill="white" />
 <circle cx="11" cy="11" r="8" stroke="white" strokeWidth="1.5" />
 <circle cx="11" cy="11" r="11" stroke="white/40" strokeWidth="0.75" />
 <line x1="3" y1="11" x2="19" y2="11" stroke="white" strokeWidth="1" />
 <line x1="11" y1="3" x2="11" y2="19" stroke="white" strokeWidth="1" />
 </svg>
 </div>
 <span className="text-xl font-semibold tracking-tight">Beesmart</span>
 </div>
 </div>

 {/* Mid copy */}
 <div className="relative z-10 space-y-6">
 <h1 className="text-4xl font-bold leading-tight tracking-tight">
 Manage your<br />network with<br />confidence.
 </h1>
 <p className="text-white/60 text-base leading-relaxed max-w-xs">
 Unified billing, PPPoE management, and hotspot provisioning — all in one place.
 </p>

 {/* Trust indicators */}
 <div className="flex flex-col gap-3 pt-4">
 {[
 "Real-time subscriber management",
 "M-Pesa & Airtel Money integrated",
 "Mikrotik-native PPPoE support",
 ].map((item) => (
 <div key={item} className="flex items-center gap-2.5 text-sm text-white/75">
 <div className="w-1.5 h-1.5 rounded-full bg-white/50 shrink-0" />
 {item}
 </div>
 ))}
 </div>
 </div>

 {/* Footer */}
 <p className="relative z-10 text-xs text-white/30">
 © {new Date().getFullYear()} Beesmart. All rights reserved.
 </p>
 </aside>

 {/* ── Form Panel ── */}
 <main className="flex-1 flex flex-col items-center justify-center bg-background p-6 lg:p-16">
 {/* Mobile logo */}
 <div className="lg:hidden mb-8 flex items-center gap-2">
 <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
 <svg
 width="16"
 height="16"
 viewBox="0 0 22 22"
 fill="none"
 xmlns="http://www.w3.org/2000/svg"
 aria-hidden
 >
 <circle cx="11" cy="11" r="4" fill="white" />
 <circle cx="11" cy="11" r="8" stroke="white" strokeWidth="1.5" />
 <line x1="3" y1="11" x2="19" y2="11" stroke="white" strokeWidth="1" />
 <line x1="11" y1="3" x2="11" y2="19" stroke="white" strokeWidth="1" />
 </svg>
 </div>
 <span className="text-lg font-semibold text-foreground">Beesmart</span>
 </div>

 <div className="w-full max-w-105">{children}</div>
 </main>
 </div>
 );
}
