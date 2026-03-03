"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Receipt, Users, Network, Headphones,
  BarChart3, Settings, Shield, UserCog, Server, ChevronRight,
  LogOut, Home, FileText, CreditCard, PieChart, Wifi,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { NavGroup, NavItem } from "@/lib/nav";

// ── Icon registry ─────────────────────────────────────────────────────
// Add icons here as new nav items are introduced.
const ICON_MAP: Record<string, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  "receipt":          Receipt,
  "users":            Users,
  "network":          Network,
  "headphones":       Headphones,
  "bar-chart-3":      BarChart3,
  "settings":         Settings,
  "shield":           Shield,
  "user-cog":         UserCog,
  "server":           Server,
  "home":             Home,
  "file-text":        FileText,
  "credit-card":      CreditCard,
  "pie-chart":        PieChart,
  "wifi":             Wifi,
};

function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? Settings;
  return <Icon className={cn("w-4 h-4 shrink-0", className)} />;
}

// ── Single nav item (leaf) ─────────────────────────────────────────────
function NavLeaf({
  item,
  isChild = false,
}: {
  item: Omit<NavItem, "children">;
  isChild?: boolean;
}) {
  const pathname = usePathname();
  const isActive = item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(item.href + "/");

  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
        isChild && "ml-4 py-2 text-[13px]",
        isActive
          ? "bg-sidebar-accent text-sidebar-primary-foreground border-l-2 border-warning pl-[10px]"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground border-l-2 border-transparent pl-[10px]"
      )}
    >
      {!isChild && <NavIcon name={item.icon} />}
      {isChild && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            isActive ? "bg-warning" : "bg-sidebar-foreground/30 group-hover:bg-sidebar-foreground/60"
          )}
        />
      )}
      <span className="flex-1 leading-none">{item.label}</span>
      {item.badge !== undefined && (
        <Badge className="h-4 min-w-4 px-1 text-[10px] bg-warning text-warning-foreground rounded-full">
          {item.badge}
        </Badge>
      )}
    </Link>
  );
}

// ── Expandable nav item (parent with children) ─────────────────────────
function NavParent({
  item,
  defaultOpen = false,
}: {
  item: NavItem;
  defaultOpen?: boolean;
}) {
  const pathname = usePathname();
  const isAnyChildActive = item.children?.some(
    (c) => pathname === c.href || pathname.startsWith(c.href + "/")
  );
  const [open, setOpen] = useState(defaultOpen || !!isAnyChildActive);

  // Auto-open when a child is active
  useEffect(() => {
    if (isAnyChildActive) setOpen(true);
  }, [isAnyChildActive]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 border-l-2 border-transparent pl-[10px]",
          isAnyChildActive
            ? "text-sidebar-foreground bg-sidebar-accent/30"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        )}
      >
        <NavIcon name={item.icon} />
        <span className="flex-1 text-left leading-none">{item.label}</span>
        <ChevronRight
          className={cn(
            "w-3.5 h-3.5 shrink-0 transition-transform duration-200",
            open && "rotate-90"
          )}
        />
      </button>

      {open && item.children && (
        <div className="mt-0.5 space-y-0.5">
          {item.children.map((child) => (
            <NavLeaf key={child.href} item={child} isChild />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Nav group ──────────────────────────────────────────────────────────
function NavGroupSection({ group }: { group: NavGroup }) {
  return (
    <div className="space-y-0.5">
      {group.label && (
        <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/35 select-none">
          {group.label}
        </p>
      )}
      {group.items.map((item) =>
        item.children ? (
          <NavParent key={item.href} item={item} />
        ) : (
          <NavLeaf key={item.href} item={item} />
        )
      )}
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────
export type SidebarUser = {
  name: string;
  email: string;
  role: string;
  initials: string;
};

export type SidebarProps = {
  /** Nav groups to render — swap this to change the entire sidebar menu */
  navGroups: NavGroup[];
  brandName?: string;
  user?: SidebarUser;
};

export default function Sidebar({
  navGroups,
  brandName = "Beesmart",
  user,
}: SidebarProps) {
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-sidebar border-r border-sidebar-border">
      {/* ── Brand ── */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-sidebar-border shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
          <svg width="16" height="16" viewBox="0 0 22 22" fill="none" aria-hidden>
            <circle cx="11" cy="11" r="4" fill="white" />
            <circle cx="11" cy="11" r="8" stroke="white" strokeWidth="1.5" />
            <line x1="3" y1="11" x2="19" y2="11" stroke="white" strokeWidth="1" />
            <line x1="11" y1="3" x2="11" y2="19" stroke="white" strokeWidth="1" />
          </svg>
        </div>
        <span className="text-base font-semibold text-sidebar-foreground tracking-tight">
          {brandName}
        </span>
      </div>

      {/* ── Nav items ── */}
      <ScrollArea className="flex-1 px-3 py-3">
        <nav className="space-y-1">
          {navGroups.map((group, i) => (
            <NavGroupSection key={group.label ?? i} group={group} />
          ))}
        </nav>
      </ScrollArea>

      {/* ── User profile ── */}
      {user && (
        <div className="shrink-0 border-t border-sidebar-border px-3 py-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-white/20 text-sidebar-foreground text-xs font-semibold">
                {user.initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-sidebar-foreground leading-none truncate">
                {user.name}
              </p>
              <p className="text-[11px] text-sidebar-foreground/50 mt-0.5 leading-none truncate">
                {user.role}
              </p>
            </div>
            <button
              type="button"
              aria-label="Sign out"
              className="text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
