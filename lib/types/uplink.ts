/** Router uplink: is the router's internet source working? Backend: /api/v1/network/uplink. */
export type UplinkStatus = "UP" | "DEGRADED" | "TUNNEL_FAULT" | "DOWN" | "UNKNOWN";

export type UplinkCheck = {
  routerId: number;
  routerName: string;
  companyId: string;
  checkedAt: string;
  checkKind: "AUTO" | "MANUAL";
  checkedBy: string | null;
  status: UplinkStatus;
  reason: string | null;
  tunnelIp: string | null;
  publicIp: string | null;
  provider: string | null;
  /** seconds since the last WireGuard handshake; null = never */
  handshakeAgeS: number | null;
  /** seconds since the router last sent RADIUS accounting; null = none in two days */
  radiusAgeS: number | null;
  radiusOnline: number | null;
  defaultRouteOk: boolean | null;
  wanRunning: boolean | null;
  pingLossPct: number | null;
  pingAvgMs: number | null;
  wanRxBps: number | null;
  wanTxBps: number | null;
  probeError: string | null;
  /** only on the overview */
  failedPurchases24h: number | null;
  unconfirmedPurchases24h: number | null;
};

/** One plain-language finding about a router's contact, with what to do. RED first. */
export type ContactFinding = { level: "RED" | "AMBER" | "INFO"; text: string };

/** The router's latest zero-touch setup command. Times are ISO instants. */
export type SetupCommand = {
  status: "PENDING" | "DELIVERED" | "COMPLETED" | "EXPIRED" | "REVOKED";
  issuedAt: string | null;
  fetchedAt: string | null;
  updatedAt: string | null;
  expiresAt: string | null;
};

/**
 * When the system last heard from one router, by each channel. Backend:
 * /api/v1/network/uplink/router/{id}/contact. Times are ISO instants; null = not in the last 14 days.
 */
export type RouterContact = {
  routerId: number;
  routerName: string;
  tunnelIp: string | null;
  latest: UplinkCheck | null;
  /** the oldest stored check: "since" times cannot reach further back */
  historyFrom: string | null;
  lastTunnelAt: string | null;
  lastSignInReportAt: string | null;
  lastLoginAt: string | null;
  /** null while in contact, or when contact was lost before historyFrom */
  contactLostAt: string | null;
  publicIp: string | null;
  provider: string | null;
  publicIpSince: string | null;
  previousPublicIp: string | null;
  previousProvider: string | null;
  previousPublicIpUntil: string | null;
  /** null when the server's tunnel list could not be read */
  serverHasTunnel: boolean | null;
  serverKeyMatches: boolean | null;
  linkedByZtp: boolean;
  recordHasKey: boolean | null;
  completedCommands: number;
  lastCommand: SetupCommand | null;
  findings: ContactFinding[];
};
