"use client"
import { SessionProvider } from "next-auth/react"
import { SessionGuard } from "./sessionGuard"


export default function AuthProvider({ children }: { children: React.ReactNode }) {
 return (
 <SessionProvider refetchInterval={300}>
 <SessionGuard>
 {children}
 </SessionGuard>
 </SessionProvider>
 )
}