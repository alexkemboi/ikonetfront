import { Phone, Wifi } from "lucide-react";

export default function HotspotLoading() {
 return (
 
 <div className="min-h-screen animate-pulse flex flex-col px-5 sm:px-8 py-8">
 {/* Header */}
 <div className="mb-8 text-center space-y-2">
 <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-1">
 <Wifi className="w-7 h-7 text-primary-foreground" />
 </div>
 <div>
 <h1 className="text-2xl font-normal tracking-normal text-foreground">
 IKONEX Hotspot
 </h1>
 <p className="text-xs text-muted-foreground mt-1">
 Premium High-Speed Internet Access
 </p>
 </div>
 <a
 href="tel:0700000000"
 className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
 >
 <Phone className="w-3.5 h-3.5" />
 Customer Care: 0700 000 000
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
 Powered by <span className="font-medium text-foreground">Beesmart</span>
 </p>
 </div>
 );
}
