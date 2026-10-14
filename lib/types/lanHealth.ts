/**
 * Customer network watch — `GET /api/v1/network/lan-health`.
 * What the MikroTik sees on the wires and Wi-Fi between itself and its customers,
 * read every couple of minutes.
 */
export interface RouterLanHealth {
  routerId: number;
  routerName: string;
  companyId: string | null;
  /** UNKNOWN = the router could not be read lately; the figures are then old, not zero. */
  status: "OK" | "ATTENTION" | "UNKNOWN";
  /** Last successful check, UTC; null when the router was never read. */
  checkedAt: string | null;
  /** Why the latest check failed; null when it succeeded. */
  error: string | null;
  devicesOnHotspot: number | null;
  /** Devices holding an address the router did not give out. Should be 0. */
  devicesOnWrongAddress: number | null;
  /** Devices answering as a DHCP server besides the router. Must be 0. */
  unauthorisedDhcpServers: number | null;
  accessPointsSeen: number;
  accessPointsNotSeen: number;
  notSeenAfterMinutes: number;
  /**
   * Can the router sign customers in? Judged from the router's own RADIUS counters over the
   * last `signInWindowMinutes`. NOT_WORKING = requests went unanswered and none was answered.
   */
  signInStatus: "WORKING" | "NOT_WORKING" | "NO_ATTEMPTS" | "NOT_SET_UP" | "UNKNOWN";
  signInAnswered: number;
  signInUnanswered: number;
  /** What the router says is wrong with its RADIUS entry; null when nothing. */
  signInNote: string | null;
  signInWindowMinutes: number;
}

export interface LanAccessPoint {
  id: number;
  routerId: number;
  macAddress: string;
  vendor: string | null;
  /** Name or place given by a person. */
  label: string | null;
  watched: boolean;
  status: "SEEN" | "NOT_SEEN" | "IGNORED";
  actingAsDhcpServer: boolean;
  dhcpServerSeenAt: string | null;
  onInterface: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface LanHistoryPoint {
  at: string;
  devicesOnHotspot: number | null;
  devicesOnWrongAddress: number | null;
  unauthorisedDhcpServers: number | null;
}

export interface RouterLanDetail {
  /** null until the router has been checked once (or it has no hotspot). */
  health: RouterLanHealth | null;
  accessPoints: LanAccessPoint[];
  history: LanHistoryPoint[];
}
