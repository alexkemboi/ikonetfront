/**
 * Navigation configuration types.
 *
 * Sidebar is a pure renderer — it accepts NavGroup[] as props.
 * This makes the sidebar reusable across admin, customer portal, or any
 * future layout by simply swapping the config passed to it.
 *
 * Icons are referenced by name (string) so the config remains serializable
 * across the server→client boundary. The Sidebar maps names to Lucide
 * components via its internal icon registry.
 */

export type NavItem = {
  href: string;
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
