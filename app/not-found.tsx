"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Construction, ArrowLeft, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
 const router = useRouter();

 return (
 <div className="min-h-screen bg-background flex items-center justify-center p-6">
 <div className="w-full max-w-lg text-center space-y-8">

 {/* Animated icon group */}
 <motion.div
 initial={{ opacity: 0, scale: 0.8 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ duration: 0.5, ease: "easeOut" }}
 className="relative inline-flex items-center justify-center"
 >
 {/* Outer pulse ring */}
 <motion.div
 animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.1, 0.3] }}
 transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
 className="absolute h-40 w-40 rounded-full bg-primary/10"
 />
 {/* Inner ring */}
 <motion.div
 animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.2, 0.4] }}
 transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
 className="absolute h-28 w-28 rounded-full bg-primary/15"
 />
 {/* Icon container */}
 <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg">
 <Construction className="h-10 w-10 text-primary-foreground" />
 </div>
 </motion.div>

 {/* 404 number */}
 <motion.div
 initial={{ opacity: 0, y: 16 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.45, delay: 0.15, ease: "easeOut" }}
 >
 <p className="text-8xl font-black tracking-tighter text-primary/10 select-none leading-none">
 404
 </p>
 </motion.div>

 {/* Text content */}
 <motion.div
 initial={{ opacity: 0, y: 16 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.45, delay: 0.25, ease: "easeOut" }}
 className="space-y-3 -mt-4"
 >
 <h1 className="text-2xl font-normal text-foreground">
 Page Under Development
 </h1>
 <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
 This section of SpeedLink is still being built.
 Our team is working on it — check back soon.
 </p>
 </motion.div>

 {/* Status badge */}
 <motion.div
 initial={{ opacity: 0, y: 12 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.4, delay: 0.35, ease: "easeOut" }}
 className="flex items-center justify-center"
 >
 <div className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 shadow-sm">
 <motion.span
 animate={{ opacity: [1, 0.3, 1] }}
 transition={{ duration: 1.5, repeat: Infinity }}
 className="h-2 w-2 rounded-full bg-[#FF9800]"
 />
 <span className="text-xs font-medium text-muted-foreground">
 Coming soon · In active development
 </span>
 </div>
 </motion.div>

 {/* Actions */}
 <motion.div
 initial={{ opacity: 0, y: 12 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.4, delay: 0.45, ease: "easeOut" }}
 className="flex flex-col sm:flex-row items-center justify-center gap-3"
 >
 <Button
 onClick={() => router.back()}
 variant="outline"
 className="w-full sm:w-auto"
 >
 <ArrowLeft className="h-4 w-4 mr-2" />
 Go Back
 </Button>
 <Button
 onClick={() => router.push("/dashboard")}
 className="w-full sm:w-auto"
 >
 <Wifi className="h-4 w-4 mr-2" />
 Back to Dashboard
 </Button>
 </motion.div>

 {/* Footer brand */}
 <motion.p
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 transition={{ duration: 0.4, delay: 0.55 }}
 className="text-xs text-muted-foreground"
 >
 SpeedLink · Internet Management Platform
 </motion.p>
 </div>
 </div>
 );
}
