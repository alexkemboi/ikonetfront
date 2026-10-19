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
