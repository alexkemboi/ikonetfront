import CustomerIPMappingView from "./_components/CustomerIPMappingView";
import { getIpPools, getIpMappings } from "@/actions/network";
import { getCustomers } from "@/actions/customer";
import { getHotspotPackages } from "@/actions/hotspot";

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

export type IPMapping = {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  custType: "pppoe" | "hotspot";
  package: string;
  ipAddress: string;
  macAddress: string;
  routerId: string;
  routerName: string;
  routerLocation: string;
  leaseStart: string;
  leaseExpiry: string;
  status: "active" | "expired" | "reserved";
};

export type IPPool = {
  routerId: string;
  routerName: string;
  location: string;
  subnet: string;
  total: number;
  used: number;
  reserved: number;
};

export default async function CustomerIPMappingPage() {
  const [mappings, pools, customersData, packagesData] = await Promise.all([
    getIpMappings().catch(() => []),
    getIpPools().catch(() => []),
    getCustomers(0, 100).catch(() => ({ data: { content: [] } })),
    getHotspotPackages().catch(() => ({ data: [] })),
  ]);

  const customers: CustomerOption[] = (customersData?.data?.content || []).map((c: any) => ({
    id: c.userIdxno?.toString() || "",
    name: c.fullName || "",
    email: c.email || "",
    custType: (c.custtype === "pppoe" ? "pppoe" : "hotspot") as "pppoe" | "hotspot",
  }));

  const packages: PackageOption[] = (packagesData?.data || []).map((p: any) => ({
    id: p.idxno?.toString() || p.id?.toString() || "",
    label: p.name || "",
    custType: (p.type === "pppoe" ? "pppoe" : "hotspot") as "pppoe" | "hotspot",
  }));

  return (
    <div className="p-6 h-full">
      <CustomerIPMappingView
        mappings={mappings as IPMapping[]}
        pools={pools as IPPool[]}
        customers={customers}
        packages={packages}
      />
    </div>
  );
}