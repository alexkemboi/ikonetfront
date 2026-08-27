import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import ReduxProvider from "@/providers/ReduxProvider";
import { Toaster } from "sonner";
import "./globals.css";
import AuthProvider from "./authProvider";

const inter = Inter({
 variable: "--font-inter",
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
 className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
 >
 <AuthProvider>
 <ReduxProvider>{children}</ReduxProvider>
 <Toaster richColors position="top-right" />
 </AuthProvider>
 </body>
 </html>
 );
}
