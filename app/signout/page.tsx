import SignOutCard from "./_components/SignOutCard";

export const metadata = { title: "Sign out — Beesmart" };

export default function SignOutPage() {
  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-6 relative overflow-hidden">

      {/* Decorative network circles (matches auth layout language) */}
      <div aria-hidden className="absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full border border-white/8 pointer-events-none" />
      <div aria-hidden className="absolute -bottom-40 -left-24 w-96 h-96 rounded-full border border-white/8 pointer-events-none" />
      <div aria-hidden className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[48rem] h-[48rem] rounded-full border border-white/5 pointer-events-none" />

      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
          <svg width="18" height="18" viewBox="0 0 22 22" fill="none" aria-hidden>
            <circle cx="11" cy="11" r="4" fill="white" />
            <circle cx="11" cy="11" r="8" stroke="white" strokeWidth="1.5" />
            <circle cx="11" cy="11" r="11" stroke="white" strokeWidth="0.75" />
            <line x1="3" y1="11" x2="19" y2="11" stroke="white" strokeWidth="1" />
            <line x1="11" y1="3" x2="11" y2="19" stroke="white" strokeWidth="1" />
          </svg>
        </div>
        <span className="text-xl font-semibold text-white tracking-tight">Beesmart</span>
      </div>

      {/* Card */}
      <SignOutCard />
    </div>
  );
}
