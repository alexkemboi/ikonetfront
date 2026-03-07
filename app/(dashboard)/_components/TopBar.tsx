"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
  user?: { username: string; initials: string; role: string };
};

export default function TopBar({ notificationCount = 0, user }: TopBarProps) {
  const breadcrumbs = useBreadcrumb();

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-card px-6">
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

        <Separator orientation="vertical" className="h-5" />

        {/* User chip */}
        {user && (
          <div className="flex items-center gap-2">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-medium text-foreground leading-none">{user.username}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">{user.role}</p>
            </div>
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-semibold">
                {user.initials}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>
    </header>
  );
}
