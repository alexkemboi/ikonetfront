import CustomerIPMappingView from "./_components/CustomerIPMappingView";
import { getIpPools, getIpMappings } from "@/actions/network";
import { getCustomers } from "@/actions/customer";
import { getPublicHotspotPackagesAction } from "@/actions/hotspot";
import type { IpMappingResponse, IpPool } from "@/lib/types/api";
import type { Customer } from "@/lib/types/customer";
import type { HotspotPackage } from "@/lib/types/hotspot";

export const metadata = { title: "Customer IP Mapping — Beesmart" };

export type CustomerOption = {
 id: string;
 name: string;
 email: string;
 custType: "pppoe" | "hotspot";
};

export type PackageOption = {
 id: string;
 label: string;
 custType: "pppoe" | "hotspot";
};

/** Mirrors the backend `IpMappingResponse` DTO (network/ip-mappings, radacct). */
export type IPMapping = {
  id: string;
  username: string;
  ipAddress: string;
  macAddress: string;
  serviceType: "PPPOE" | "HOTSPOT";
  stationName: string;
  status: "ONLINE" | "EXPIRED";
  lastSeen: string;
};

/** Mirrors the backend `IpPoolResponse` DTO (network/ip-pools). */
export type IPPool = {
  poolName: string;
  subnet: string;
  gateway: string;
  totalIps: number;
  usedIps: number;
  availableIps: number;
  utilizationPercentage: number;
  serviceType: string;
};

export default async function CustomerIPMappingPage() {
  const [mappings, pools, customersData, packagesData] = await Promise.all([
    getIpMappings().catch(() => []),
    getIpPools().catch(() => []),
    getCustomers(0, 100).catch(() => ({ data: { content: [] } })),
    getPublicHotspotPackagesAction().catch(() => ({ data: [] })),
  ]);

  const customers: CustomerOption[] = (customersData?.data?.content || []).map((c: Customer) => ({
    id: c.userIdxno?.toString() || "",
    name: c.fullName || "",
    email: c.email || "",
    custType: (c.custtype === "pppoe" ? "pppoe" : "hotspot") as "pppoe" | "hotspot",
  }));

  const packages: PackageOption[] = (packagesData?.data || []).map((p: HotspotPackage) => ({
    id: p.idxno?.toString() || "",
    label: p.packageName || "",
    custType: (p.packageCategory?.toLowerCase() === "pppoe" ? "pppoe" : "hotspot") as "pppoe" | "hotspot",
  }));

  const mappedMappings: IPMapping[] = (mappings as IpMappingResponse[]).map((m) => ({
    id: `${m.username ?? ""}|${m.ipAddress ?? ""}|${m.macAddress ?? ""}`,
    username: m.username || "—",
    ipAddress: m.ipAddress || "",
    macAddress: m.macAddress || "",
    serviceType: (String(m.serviceType ?? "").toUpperCase() === "PPPOE" ? "PPPOE" : "HOTSPOT") as "PPPOE" | "HOTSPOT",
    stationName: m.stationName || "—",
    status: m.status,
    lastSeen: m.lastSeen,
  }));

  const mappedPools: IPPool[] = (pools as IpPool[]).map((p) => ({
    poolName: p.poolName,
    subnet: p.subnet,
    gateway: p.gateway,
    totalIps: p.totalIps,
    usedIps: p.usedIps,
    availableIps: p.availableIps,
    utilizationPercentage: p.utilizationPercentage,
    serviceType: p.serviceType,
  }));

  return (
    <div className="p-6 h-full">
      <CustomerIPMappingView
        mappings={mappedMappings}
        pools={mappedPools}
        customers={customers}
        packages={packages}
      />
    </div>
  );
}