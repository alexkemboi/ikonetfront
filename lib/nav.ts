/**
 * Navigation types.
 *
 * Sidebar is a pure renderer — it accepts NavGroup[] as props. The groups come
 * from the database through GET /navigation/me (see lib/data/nav.ts); no menu
 * layout is defined in the frontend.
 *
 * Icons are referenced by name (string) so the data remains serializable
 * across the server→client boundary. The Sidebar maps names to Lucide
 * components via its internal icon registry.
 */

export type NavItem = {
  href: string;
  /** Permission flags — set by the API for dynamic nav, absent on static configs (treat as full access) */
  canView?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canCreate?: boolean;
  label: string;
  /** Key from the Sidebar's internal icon registry */
  icon: string;
  /** Optional badge count (e.g. unread tickets) */
  badge?: number;
  /** Use exact pathname match for active detection (default: startsWith) */
  exact?: boolean;
  /** Nested children rendered as an expandable sub-list */
  children?: Omit<NavItem, "children">[];
};

export type NavGroup = {
  /** Optional uppercase label rendered above the group */
  label?: string;
  items: NavItem[];
};

// ── API: GET /navigation/me ──────────────────────────────────────────

/** One sidebar entry as the API serves it (already filtered to what the caller may view). */
export type ApiNavItem = {
  key: string;
  label: string;
  route: string;
  icon?: string | null;
  displayOrder?: number;
  exact?: boolean;
  /** Null when the permission catalogue has no entry for it (rendered as visible, like before). */
  canView?: boolean | null;
  canCreate?: boolean | null;
  canEdit?: boolean | null;
  canDelete?: boolean | null;
  children?: ApiNavItem[] | null;
};

export type ApiNavGroup = {
  key: string;
  label?: string | null;
  displayOrder?: number;
  items: ApiNavItem[];
};

/** Brand of a company (or the platform's own entity), from the companies table. */
export type NavBrand = {
  code: string;
  name: string;
  alias?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
};

export type NavUser = {
  username: string;
  displayName: string;
  email?: string | null;
  role: string;
  roleName?: string | null;
  roleDescription?: string | null;
  /** PLATFORM, COMPANY, STATION or INVESTOR */
  accessScope?: string | null;
  platformAdmin?: boolean;
  stationId?: string | null;
  companyCode?: string | null;
  /** The company the account itself belongs to: where changes go when none is selected. */
  homeCompanyCode?: string | null;
};

export type NavigationPayload = {
  user: NavUser;
  /** Company in context; null for SYSADMIN on "all companies" and for investors. */
  company: NavBrand | null;
  /** The platform's own brand; used when no company is in context. */
  platform: NavBrand | null;
  portal: "STAFF" | "INVESTOR" | "CUSTOMER";
  groups: ApiNavGroup[];
  /** The role's effective permissions (super admin, type, scope, granted keys). */
  access?: import("@/lib/access").NavAccess;
};

/** What the sidebar header shows. */
export type SidebarBrand = {
  name: string;
  logoUrl: string;
};

/**
 * A node in the permissions tree shown on the Roles page.
 * `id` = route string for permission tracking.
 * `menuItemId` = DB primary key for POST /menus assignment calls.
 */
export type MenuNode = {
  idxno: number;
  menuItemId: number;
  /** Key of this entry's grants in a role's permission map: the catalogue id as text. */
  key: string;
  /** MENU (screen), API (API resource) or RIGHT (named right). */
  kind?: string;
  module?: string | null;
  permissionKey?: string | null;
  /** A heading that groups entries on the screen; not a catalogue entry (never saved). */
  synthetic?: boolean;
  route: string;
  label: string;
  icon: string;
  children?: Omit<MenuNode, "children">[];
};
