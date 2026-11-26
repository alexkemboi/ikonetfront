import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import ReduxProvider from "@/providers/ReduxProvider";
import { AppThemeProvider } from "@/providers/AppThemeProvider";
import "./globals.css";
import AuthProvider from "./authProvider";
import { getAuthBrand } from "@/lib/authBrand";

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

// the brand follows the domain (beesmartbedak.com is BeeSmart, sandbox is SpeedLink)
export async function generateMetadata(): Promise<Metadata> {
 const brand = await getAuthBrand();
 return {
  title: brand.title,
  description: `ISP billing and network management by ${brand.legalName}.`,
  icons: { icon: brand.logo },
 };
}

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
    {/* A chunk that fails to load (deploy restart, or a page from the previous
        build) crashes the app; reload once so the browser fetches the current
        build. Inline because the bundled code is what failed to load. */}
    <script
     dangerouslySetInnerHTML={{
        __html: `(() => {
    const KEY = "beesmart-chunk-reload";
    const isChunkError = (e) => !!e && (e.name === "ChunkLoadError" || /Loading (CSS )?chunk|Failed to load chunk/i.test(String(e.message || e)));
    const reloadOnce = (e) => {
     if (!isChunkError(e)) return;
     try {
      const last = Number(window.sessionStorage.getItem(KEY) || 0);
      if (Date.now() - last < 30000) return;
      window.sessionStorage.setItem(KEY, String(Date.now()));
     } catch { return; }
     setTimeout(() => window.location.reload(), 1500);
    };
    window.addEventListener("error", (event) => reloadOnce(event.error));
    window.addEventListener("unhandledrejection", (event) => reloadOnce(event.reason));
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
