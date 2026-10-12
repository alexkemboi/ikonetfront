import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import ReduxProvider from "@/providers/ReduxProvider";
import { AppThemeProvider } from "@/providers/AppThemeProvider";
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
 title: "SpeedLink",
 description: "ISP billing and network management by SpeedLink.",
 icons: { icon: "/speedlink-logo.jpg" },
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
 <AppThemeProvider>
  <AuthProvider>
   <ReduxProvider>{children}</ReduxProvider>
  </AuthProvider>
 </AppThemeProvider>
 </body>
 </html>
 );
}
