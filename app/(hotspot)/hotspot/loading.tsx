import Image from "next/image";
import { Phone } from "lucide-react";

export default function HotspotLoading() {
 return (
 
 <div className="min-h-screen animate-pulse flex flex-col px-5 sm:px-8 py-8">
 {/* Header */}
 <div className="mb-8 text-center space-y-2">
 <div className="inline-flex items-center justify-center w-48 h-24 rounded-xl bg-white p-2 shadow-sm mb-1">
 <Image src="/speedlink-logo.jpg" alt="SpeedLink" width={192} height={128} className="h-full w-full object-contain" />
 </div>
 <div>
 <h1 className="text-2xl font-normal tracking-normal text-foreground">
 SPEEDLINK HOTSPOT
 </h1>
 <p className="text-xs text-muted-foreground mt-1">
 Premium High-Speed Internet Access
 </p>
 </div>
 <a
 href="tel:0706354194"
 className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
 >
 <Phone className="w-3.5 h-3.5" />
 Customer Care: 0706 354 194
 </a>
 </div>

 {/* Main flow */}
 <div className="flex-1 w-full">
 <div className="space-y-6">
 <div className="h-6 w-44 rounded bg-muted mx-auto" />
 <div className="h-4 w-64 rounded bg-muted mx-auto" />
 <div className="h-9 w-28 rounded-lg bg-muted mx-auto" />
 </div>
 </div>

 <p className="mt-6 text-center text-xs text-muted-foreground">
 Powered by <span className="font-medium text-foreground">SpeedLink</span>
 </p>
 </div>
 );
}
