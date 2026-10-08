import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import ReduxProvider from "@/providers/ReduxProvider";
import { Toaster } from "sonner";
import "./globals.css";
import AuthProvider from "./authProvider";

const dmSans = DM_Sans({
 variable: "--font-dm-sans",
 subsets: ["latin"],
 display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
 variable: "--font-jetbrains-mono",
 subsets: ["latin"],
 display: "swap",
});

export const metadata: Metadata = {
 title: "Beesmart Billing",
 description: "Internet Billing & Network Management",
};

export default function RootLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 return (
 <html lang="en">
 <body
 className={`${dmSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}
 >
 <AuthProvider>
 <ReduxProvider>{children}</ReduxProvider>
 <Toaster richColors position="top-right" />
 </AuthProvider>
 </body>
 </html>
 );
}
