"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, LogOut, Menu, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
 DropdownMenu,
 DropdownMenuTrigger,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuLabel,
 DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { SidebarInner, type SidebarUser } from "./Sidebar";
import type { NavGroup } from "@/lib/nav";

// Derives a human-readable title from the current pathname
function useBreadcrumb() {
 const pathname = usePathname();
 const segments = pathname.split("/").filter(Boolean);

 return segments.map((seg, i) => ({
 label: seg
 .split("-")
 .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
 .join(" "),
 href: "/" + segments.slice(0, i + 1).join("/"),
 isLast: i === segments.length - 1,
 }));
}

type TopBarProps = {
 notificationCount?: number;
 user?: { username: string; initials: string; role: string; fname?: string; middleName?: string; email?: string };
 navGroups?: NavGroup[];
 brandName?: string;
 sidebarUser?: SidebarUser;
};

export default function TopBar({
 notificationCount = 0,
 user,
 navGroups = [],
 brandName = "Beesmart",
 sidebarUser,
}: TopBarProps) {
const breadcrumbs = useBreadcrumb();
	const [mobileOpen, setMobileOpen] = useState(false);



 // console.log("TopBar render", { mobileOpen}); // Debug log

 return (
 <>
 {/* Mobile sidebar sheet */}
 <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
 {/* <SheetTrigger>test</SheetTrigger> */}
 <SheetContent
 
 side="left"
 className="w-64 p-0 bg-sidebar border-sidebar-border [&>button]:hidden"
 >
 <SheetTitle className="sr-only">Mobile navigation</SheetTitle>
 <SidebarInner
 navGroups={navGroups}
 brandName={brandName}
 user={sidebarUser}
 />
 </SheetContent>
 </Sheet>

 <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-card px-4 md:px-6">
 {/* Hamburger — mobile only */}
 <Button
 variant="ghost"
 size="icon"
 className="md:hidden h-8 w-8 shrink-0"
 aria-label="Open menu"
 onClick={() => setMobileOpen(!mobileOpen)}
 >
 <Menu className="w-5 h-5" />
 </Button>

 {/* Breadcrumb */}
 <nav className="flex items-center gap-1.5 flex-1 overflow-hidden" aria-label="Breadcrumb">
 {breadcrumbs.map((crumb, i) => (
 <span key={crumb.href} className="flex items-center gap-1.5 min-w-0">
 {i > 0 && (
 <span className="text-muted-foreground/40 text-sm select-none">/</span>
 )}
 <span
 className={
 crumb.isLast
 ? "text-sm font-semibold text-foreground truncate"
 : "text-sm text-muted-foreground hover:text-foreground truncate cursor-pointer"
 }
 >
 {crumb.label}
 </span>
 </span>
 ))}
 </nav>

 {/* Actions */}
 <div className="flex items-center gap-2 shrink-0">
 {/* Notifications */}
 <div className="relative">
 <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Notifications">
 <Bell className="w-4 h-4" />
 </Button>
 {notificationCount > 0 && (
 <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px] bg-warning text-warning-foreground rounded-full pointer-events-none">
 {notificationCount > 9 ? "9+" : notificationCount}
 </Badge>
 )}
 </div>

 {/* User chip */}
 {user && (
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" className="flex items-center gap-2 px-2 py-1 h-8 hover:bg-accent">
 <Avatar className="h-7 w-7">
 <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-semibold">
 {user.initials}
 </AvatarFallback>
 </Avatar>
 <div className="hidden sm:block text-left leading-none">
 <p className="text-xs font-medium text-foreground leading-none">
 {user.fname || user.username}
 </p>
 <p className="text-[10px] text-muted-foreground mt-0.5 leading-none font-mono">
 {user.role}
 </p>
 </div>
 </Button>
 </DropdownMenuTrigger>

 <DropdownMenuContent align="end" className="w-56">
 <DropdownMenuLabel className="font-normal">
 <div className="flex flex-col space-y-1">
 <p className="text-sm font-semibold leading-none">
 {user.fname || user.username}
 </p>
 <p className="text-xs text-muted-foreground font-mono">
 {user.email || user.username}
 </p>
 <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
 <Shield className="h-3 w-3" />
 Role: {user.role}
 </span>
 </div>
 </DropdownMenuLabel>
 <DropdownMenuSeparator />
 <DropdownMenuItem asChild className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
 <Link href="/signout">
 <LogOut className="mr-2 h-4 w-4" />
 Sign Out / Switch Account
 </Link>
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 )}
 </div>
 </header>
 </>
 );
}
