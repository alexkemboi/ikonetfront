import Image from "next/image";

export default function SignoutLoading() {
 return (
 <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-6 relative overflow-hidden">
 {/* Decorative circles */}
 <div aria-hidden className="absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full border border-white/8 pointer-events-none" />
 <div aria-hidden className="absolute -bottom-40 -left-24 w-96 h-96 rounded-full border border-white/8 pointer-events-none" />

 {/* Logo */}
 <div className="flex items-center gap-3 mb-10">
 <Image src="/speedlink-logo.jpg" alt="SpeedLink" width={112} height={72} className="rounded-md bg-white p-1" />
 </div>

 {/* Spinner */}
 <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
 </div>
 );
}
