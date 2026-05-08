import RouterDevicesView from "./_components/RouterDevicesView";

export const metadata = { title: "Router Devices — Beesmart" };

export type RouterDevice = {
  id: string;
  name: string;
  model: string;
  ipAddress: string;
  location: string;
  site: string;
  region: string;
  status: "online" | "offline" | "warning";
  cpuLoad: number;
  memoryUsedPct: number;
  connectedClients: number;
  maxClients: number;
  uptime: string;
  version: string;
  lastSeen: string;
  interfaces: number;
  activeTunnels: number;
};

const ROUTER_DEVICES: RouterDevice[] = [
  {
    id: "r1",
    name: "RTR-WESTLANDS",
    model: "MikroTik CCR1036",
    ipAddress: "192.168.1.1",
    location: "Westlands Hub",
    site: "Westlands",
    region: "Nairobi West",
    status: "online",
    cpuLoad: 32,
    memoryUsedPct: 48,
    connectedClients: 187,
    maxClients: 300,
    uptime: "47d 14h 22m",
    version: "7.14.2",
    lastSeen: "Just now",
    interfaces: 12,
    activeTunnels: 187,
  },
  {
    id: "r2",
    name: "RTR-EASTLEIGH",
    model: "MikroTik RB4011",
    ipAddress: "10.0.1.1",
    location: "Eastleigh Node",
    site: "Eastleigh",
    region: "Nairobi East",
    status: "online",
    cpuLoad: 21,
    memoryUsedPct: 35,
    connectedClients: 62,
    maxClients: 150,
    uptime: "12d 8h 5m",
    version: "7.13.5",
    lastSeen: "Just now",
    interfaces: 8,
    activeTunnels: 62,
  },
  {
    id: "r3",
    name: "RTR-NGONG",
    model: "MikroTik CCR2004",
    ipAddress: "172.16.0.1",
    location: "Ngong Road POP",
    site: "Ngong Road",
    region: "Nairobi South",
    status: "warning",
    cpuLoad: 78,
    memoryUsedPct: 82,
    connectedClients: 43,
    maxClients: 200,
    uptime: "3d 2h 44m",
    version: "7.14.2",
    lastSeen: "2 min ago",
    interfaces: 10,
    activeTunnels: 43,
  },
  {
    id: "r4",
    name: "RTR-KASARANI",
    model: "MikroTik hEX S",
    ipAddress: "192.168.50.1",
    location: "Kasarani Branch",
    site: "Kasarani",
    region: "Nairobi North",
    status: "offline",
    cpuLoad: 0,
    memoryUsedPct: 0,
    connectedClients: 0,
    maxClients: 100,
    uptime: "—",
    version: "7.11.0",
    lastSeen: "3 days ago",
    interfaces: 6,
    activeTunnels: 0,
  },
  {
    id: "r5",
    name: "RTR-KIAMBU",
    model: "MikroTik CCR1009",
    ipAddress: "10.20.0.1",
    location: "Kiambu Road Node",
    site: "Kiambu",
    region: "Central",
    status: "online",
    cpuLoad: 44,
    memoryUsedPct: 61,
    connectedClients: 95,
    maxClients: 200,
    uptime: "28d 19h 33m",
    version: "7.13.5",
    lastSeen: "Just now",
    interfaces: 9,
    activeTunnels: 95,
  },
  {
    id: "r6",
    name: "RTR-THIKA",
    model: "MikroTik RB750Gr3",
    ipAddress: "192.168.100.1",
    location: "Thika Town Hub",
    site: "Thika",
    region: "Central",
    status: "online",
    cpuLoad: 15,
    memoryUsedPct: 28,
    connectedClients: 38,
    maxClients: 80,
    uptime: "65d 4h 10m",
    version: "7.12.1",
    lastSeen: "Just now",
    interfaces: 5,
    activeTunnels: 38,
  },
];

export default function RouterDevicesPage() {
  return (
    <div className="p-6 h-full">
      <RouterDevicesView devices={ROUTER_DEVICES} />
    </div>
  );
}
