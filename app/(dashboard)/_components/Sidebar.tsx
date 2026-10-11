"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
 LayoutDashboard, Receipt, Users, Network, Headphones,
 BarChart3, Settings, Shield, UserCog, Server, ChevronRight,
 LogOut, Home, FileText, CreditCard, PieChart, Wifi, X,
 // Material icon aliases (API returns Material Design icon names)
 ShieldCheck, BadgeCheck, User, BarChart, Users2,
 CheckCircle2, Package, Bell, MessageSquare, Mail,
 Router, DollarSign, Database, TrendingUp, Landmark,
 Clock, Lock, History, Smartphone, ShoppingCart,
 RotateCcw, Gauge, Megaphone, Search, MapPin, ScrollText,
 Activity, Globe,
 type LucideIcon,
 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { NavGroup, NavItem } from "@/lib/nav";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const SidebarContext = createContext<{
  isCollapsed: boolean;
}>({
  isCollapsed: false,
});

// ── Icon registry ─────────────────────────────────────────────────────
// Supports both Lucide kebab-case names (used by static nav configs)
// and Material Design icon names (returned by the API menus endpoint).
const ICON_MAP: Record<string, LucideIcon> = {
 // ── Lucide names (static configs) ──────────────────────────────────
 "layout-dashboard": LayoutDashboard,
 "receipt": Receipt,
 "users": Users,
 "network": Network,
 "headphones": Headphones,
 "bar-chart-3": BarChart3,
 "settings": Settings,
 "shield": Shield,
 "user-cog": UserCog,
 "server": Server,
 "home": Home,
 "file-text": FileText,
 "credit-card": CreditCard,
 "pie-chart": PieChart,
 "wifi": Wifi,
 "shield-check": ShieldCheck,
 "map-pin": MapPin,
 "mail": Mail,
 "scroll-text": ScrollText,
 "database": Database,
 "activity": Activity,
 "globe": Globe,
 "rotate-cw": RotateCcw,

 // ── Material Design names (API menus endpoint) ──────────────────────
 "dashboard": LayoutDashboard,
 "admin_panel_settings": ShieldCheck,
 "badge": BadgeCheck,
 "person": User,
 "leaderboard": BarChart,
 "people": Users,
 "group": Users2,
 "check_circle": CheckCircle2,
 "lan": Network,
 "person_search": Search,
 "support_agent": Headphones,
 "attach_money": DollarSign,
 "inventory": Package,
 "package": Package,
 "receipt_long": Receipt,
 "confirmation_number": FileText,
 "description": FileText,
 "notifications": Bell,
 "sms": MessageSquare,
 "email": Mail,
 "campaign": Megaphone,
 "router": Router,
 "dns": Server,
 "device_hub": Network,
 "shopping_cart": ShoppingCart,
 "payments": CreditCard,
 "payment": CreditCard,
 "autorenew": RotateCcw,
 "phone_android": Smartphone,
 "speed": Gauge,
 "lock": Lock,
 "history": History,
 "bar_chart": BarChart3,
 "data_usage": Database,
 "trending_up": TrendingUp,
 "account_balance": Landmark,
 "schedule": Clock,
};

function NavIcon({ name, className }: { name: string; className?: string }) {
 const Icon = ICON_MAP[name] ?? Settings;
 return <Icon className={cn("h-[18px] w-[18px] shrink-0", className)} />;
}

// ── Animation variants ─────────────────────────────────────────────────
// Bezier array is cast to a tuple so Framer Motion's Variants type is satisfied.
const EASE = [0.4, 0, 0.2, 1] as [number, number, number, number];

const submenuVariants = {
 open: {
 height: "auto",
 opacity: 1,
 transition: { duration: 0.22, ease: EASE },
 },
 closed: {
 height: 0,
 opacity: 0,
 transition: { duration: 0.18, ease: EASE },
 },
} as const;

// ── Single nav item (leaf) ─────────────────────────────────────────────
function NavLeaf({
  item,
  isChild = false,
}: {
  item: Omit<NavItem, "children">;
  isChild?: boolean;
}) {
  const { isCollapsed } = useContext(SidebarContext);
  const pathname = usePathname();
  const isActive = item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(item.href + "/");

  if (isCollapsed) {
    if (isChild) return null;
    return (
      <Link
        href={item.href}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "group flex items-center justify-center rounded-xl p-2.5 transition-colors duration-150 border-l-2 border-transparent",
          isActive
            ? "bg-sidebar-accent text-sidebar-foreground"
            : "text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
        )}
        title={item.label}
      >
        <NavIcon name={item.icon} className="w-5 h-5 shrink-0" />
        <span className="sr-only">{item.label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
        aria-current={isActive ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-xl border-l-2 border-transparent px-3 py-2.5 text-sm font-medium transition-colors duration-150",
        isChild && "ml-4 py-2 text-[13px]",
        isActive
          ? "bg-sidebar-accent text-sidebar-foreground font-semibold"
          : "text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground border-l-2 border-transparent pl-2.5"
      )}
    >
      {!isChild && <NavIcon name={item.icon} />}
      {isChild && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0 transition-colors",
            isActive
              ? "bg-sidebar-foreground/80"
              : "bg-sidebar-foreground/30 group-hover:bg-sidebar-foreground/60"
          )}
        />
      )}
      <span className="flex-1 leading-none">{item.label}</span>
      {item.badge !== undefined && (
        <Badge className="h-5 min-w-7 rounded-full border border-sidebar-border bg-sidebar-accent px-1.5 text-[10px] font-medium text-sidebar-foreground/75">
          {item.badge}
        </Badge>
      )}
    </Link>
  );
}

// ── Expandable nav item (parent with children) ─────────────────────────
function NavParent({ item }: { item: NavItem }) {
  const { isCollapsed } = useContext(SidebarContext);
  const pathname = usePathname();

  const isAnyChildActive = item.children?.some(
    (c) => pathname === c.href || pathname.startsWith(c.href + "/")
  ) ?? false;

  // Start open if a child is already active (SSR-safe: default to false,
  // the useEffect below syncs immediately on mount)
  const [open, setOpen] = useState(isAnyChildActive);

  // Auto-open when navigating to a child route
  useEffect(() => {
    if (isAnyChildActive && !isCollapsed) {
      // Deferred so the update lands after the render cycle (avoids a
      // cascading-render chain flagged by react-hooks/set-state-in-effect).
      const t = setTimeout(() => setOpen(true), 0);
      return () => clearTimeout(t);
    }
  }, [isAnyChildActive, isCollapsed]);

  if (isCollapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "w-full flex items-center justify-center rounded-xl p-2.5 text-sm font-medium transition-colors duration-150 border-l-2 border-transparent",
              isAnyChildActive
                ? "text-sidebar-foreground bg-sidebar-accent"
                : "text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
            )}
            title={item.label}
          >
            <NavIcon name={item.icon} className="w-5 h-5 shrink-0" />
            <span className="sr-only">{item.label}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="w-48 bg-sidebar border-sidebar-border text-sidebar-foreground">
          <DropdownMenuLabel className="font-semibold text-sidebar-foreground/50 text-xs px-3 py-1.5 uppercase tracking-wider">
            {item.label}
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-sidebar-border" />
          {item.children?.map((child) => {
            const isChildActive = pathname === child.href || pathname.startsWith(child.href + "/");
            return (
              <DropdownMenuItem key={`${child.href}-${child.label}`} asChild className="focus:bg-sidebar-accent focus:text-sidebar-foreground">
                <Link
                  href={child.href}
                  aria-current={isChildActive ? "page" : undefined}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                    isChildActive
                      ? "bg-sidebar-accent text-sidebar-foreground font-semibold"
                      : "text-sidebar-foreground/65 hover:bg-sidebar-accent/70"
                  )}
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full shrink-0",
                      isChildActive ? "bg-sidebar-foreground/80" : "bg-sidebar-foreground/30"
                    )}
                  />
                  <span>{child.label}</span>
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div>
      {/* Parent button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150 border-l-2 border-transparent pl-2.5",
          isAnyChildActive || open
          ? "text-sidebar-foreground bg-sidebar-accent"
          : "text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
        )}
      >
        <NavIcon name={item.icon} />
        <span className="flex-1 text-left leading-none">{item.label}</span>

        {/* Animated caret — rotates 90° when open */}
        <motion.div
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="shrink-0"
        >
          <ChevronRight className="h-4 w-4 text-sidebar-foreground/50" />
        </motion.div>
      </button>

      {/* Animated submenu — slides open/closed */}
      <AnimatePresence initial={false}>
        {open && item.children && (
          <motion.div
            key="submenu"
            variants={submenuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="overflow-hidden"
          >
            <div className="mt-0.5 space-y-0.5">
              {item.children.map((child) => (
                <NavLeaf key={`${child.href}-${child.label}`} item={child} isChild />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Nav group ──────────────────────────────────────────────────────────
function NavGroupSection({ group }: { group: NavGroup }) {
  const { isCollapsed } = useContext(SidebarContext);

  return (
    <div className="space-y-0.5">
      {group.label && !isCollapsed && (
        <p className="px-3 pt-6 pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/45 select-none">
          {group.label}
        </p>
      )}
      {group.items.map((item) =>
        item.children && (item.canView ?? true) ? (
          <NavParent key={`${item.href}-${item.label}`} item={item} />
        ) : (item.canView ?? true) ? (
          <NavLeaf key={`${item.href}-${item.label}`} item={item} />
        ) : null
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
 username?: string;
};

export type SidebarProps = {
  /** Nav groups to render — swap this to change the entire sidebar menu */
  navGroups: NavGroup[];
  brandName?: string;
  user?: SidebarUser;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobile?: boolean;
  onCloseMobile?: () => void;
};

// ── Sidebar inner content (shared between desktop aside + mobile Sheet) ──
export function SidebarInner({
  navGroups,
  brandName = "Ikonex Systems",
  user,
  isCollapsed = false,
  onToggleCollapse,
  isMobile = false,
  onCloseMobile,
}: SidebarProps) {
  const router = useRouter();

  return (
    <SidebarContext.Provider value={{ isCollapsed }}>
      <div className="sidebar-panel flex h-full w-full flex-col overflow-hidden rounded-[20px] bg-sidebar text-sidebar-foreground">
        <ScrollArea className="h-full w-full">
          <div className="flex min-h-full flex-col">
        {/* ── Brand ── */}
        <div className={cn(
          "flex h-[3.25rem] items-center border-b border-sidebar-border/80 shrink-0 transition-all duration-300",
          isCollapsed ? "justify-center gap-1 px-0" : "justify-between px-5"
        )}>
          <div className={cn("flex min-w-0 items-center gap-2", isCollapsed && "justify-center")}>
            <Image
              src="/logo.png"
              alt={isCollapsed ? brandName : ""}
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 rounded-md bg-white p-0.5 object-contain"
            />
            {!isCollapsed && (
              <span className="block truncate text-sm font-semibold tracking-tight text-sidebar-foreground">
                {brandName}
              </span>
            )}
          </div>

          {isMobile ? (
            <button
              type="button"
              onClick={onCloseMobile}
              className="rounded-lg p-2 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
          ) : onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className={cn(
                "text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors p-1.5 rounded-lg hover:bg-sidebar-accent",
              )}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M9 5l7 7-7 7" />
                  <path d="M5 5v14" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M15 19l-7-7 7-7" />
                  <path d="M19 5v14" />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* ── Nav items ── */}
        <div className={cn(
          "sidebar-navigation flex-1 min-h-0 py-3 transition-all duration-300",
          isCollapsed ? "px-1.5" : "px-5"
        )}>
          <nav className="space-y-2">
            {navGroups.length > 0 ? (
              navGroups.map((group, i) => (
                <NavGroupSection key={group.label ?? i} group={group} />
              ))
            ) : (
              <p className="text-sm text-sidebar-foreground/50">
                No navigation items available.
              </p>
            )}
          </nav>
        </div>

        {/* ── User profile ── */}
        {user && (
          <div className={cn(
            "sticky bottom-0 mt-auto shrink-0 border-t border-sidebar-border/80 bg-sidebar transition-all duration-300",
            isCollapsed ? "px-0 py-3" : "px-5 py-3"
          )}>
            {isCollapsed ? (
              <div className="flex justify-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className="focus:outline-none">
                      <Avatar className="h-8 w-8 hover:ring-2 hover:ring-sidebar-foreground/30 transition-all cursor-pointer">
                        <AvatarFallback className="bg-white/20 text-sidebar-foreground text-xs font-semibold">
                          {user.initials}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="end" className="w-56 bg-sidebar border-sidebar-border text-sidebar-foreground">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-semibold leading-none text-sidebar-foreground">
                          {user.username || user.name}
                        </p>
                        <p className="text-xs text-sidebar-foreground/50">
                          {user.email || user.username}
                        </p>
                        <p className="text-[10px] text-sidebar-foreground/45 mt-0.5 leading-none font-sans tabular-nums uppercase">
                          Role: {user.role}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-sidebar-border" />
                    <DropdownMenuItem asChild className="focus:bg-destructive/10 focus:text-destructive cursor-pointer">
                      <button
                        type="button"
                        onClick={() => router.push("/signout")}
                        className="w-full flex items-center text-left"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </button>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-sidebar-border/80 bg-sidebar-accent/50 px-2.5 py-2.5">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className="bg-white/20 text-sidebar-foreground text-xs font-semibold">
                    {user.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium text-sidebar-foreground leading-none truncate">
                    {user.username || user.name}
                  </p>
                  <p className="text-[11px] text-sidebar-foreground/50 mt-0.5 leading-none truncate">
                    {user.role}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Sign out"
                  onClick={() => router.push("/signout")}
                  className="rounded-lg p-2 text-sidebar-foreground/45 transition-colors hover:bg-destructive/10 hover:text-destructive shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
          </div>
        </ScrollArea>
      </div>
    </SidebarContext.Provider>
  );
}

export default function Sidebar(props: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setIsMounted(true);
      const stored = localStorage.getItem("sidebar-collapsed");
      if (stored === "true") {
        setIsCollapsed(true);
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  return (
    <aside className={cn(
      "my-3 ml-3 mr-3 hidden h-[calc(100vh-1.5rem)] shrink-0 flex-col rounded-[20px] border border-sidebar-border shadow-xl shadow-black/15 transition-all duration-300 ease-in-out md:flex",
      isMounted && isCollapsed ? "w-[70px]" : "w-[240px]"
    )}>
      <SidebarInner
        {...props}
        isCollapsed={isMounted ? isCollapsed : false}
        onToggleCollapse={() => {
          const newVal = !isCollapsed;
          setIsCollapsed(newVal);
          localStorage.setItem("sidebar-collapsed", String(newVal));
        }}
      />
    </aside>
  );
}
