import SignOutCard from "./_components/SignOutCard";
import Image from "next/image";
import { getSiteBrand } from "@/lib/siteBrand.server";

export const metadata = { title: "Sign out" };

export default async function SignOutPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
 const params = await searchParams;
 const brand = await getSiteBrand();
 // signed out without asking: the session ended, or an administrator changed this account's access
 const forceSignOut = params.reason === "session-expired" || params.reason === "permissions-changed";
 return (
 <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-6 relative overflow-hidden">

 {/* Decorative network circles (matches auth layout language) */}
 <div aria-hidden className="absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full border border-white/8 pointer-events-none" />
 <div aria-hidden className="absolute -bottom-40 -left-24 w-96 h-96 rounded-full border border-white/8 pointer-events-none" />
 <div aria-hidden className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[48rem] h-[48rem] rounded-full border border-white/5 pointer-events-none" />

 {/* Logo */}
 <div className="flex items-center gap-3 mb-10">
 <Image src={brand.logo} alt={brand.legalName} width={112} height={72} className="rounded-md bg-white p-1" />
 </div>

 {/* Card */}
 <SignOutCard forceSignOut={forceSignOut} />
 </div>
 );
}
