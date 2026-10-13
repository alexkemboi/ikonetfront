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
 title: "Beesmart Billing",
 description: "Internet Billing & Network Management",
};

export default function RootLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 return (
 <html lang="en" suppressHydrationWarning>
 <head>
    <script
     dangerouslySetInnerHTML={{
        __html: `(() => {
    try {
     const savedTheme = window.localStorage.getItem("beesmart-theme");
     const theme = savedTheme === "dark" || savedTheme === "light"
      ? savedTheme
      : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
     document.documentElement.classList.toggle("dark", theme === "dark");
     document.documentElement.style.colorScheme = theme;
    } catch {}
    })();`,
    }}
  />
 </head>
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
