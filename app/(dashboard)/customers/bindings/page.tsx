import CustomerIPMappingView from "./_components/CustomerIPMappingView";

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

const IP_MAPPINGS: IPMapping[] = [
  {
    id: "m1",
    customerId: "C001",
    customerName: "James Kamau",
    customerEmail: "james.kamau@email.com",
    custType: "pppoe",
    package: "10 Mbps Home",
    ipAddress: "192.168.10.5",
    macAddress: "AA:BB:CC:DD:EE:01",
    routerId: "r1",
    routerName: "RTR-WESTLANDS",
    routerLocation: "Westlands Hub",
    leaseStart: "2025-01-15",
    leaseExpiry: "2025-06-15",
    status: "active",
  },
  {
    id: "m2",
    customerId: "C002",
    customerName: "Grace Wanjiku",
    customerEmail: "grace.w@email.com",
    custType: "pppoe",
    package: "20 Mbps Business",
    ipAddress: "192.168.10.12",
    macAddress: "AA:BB:CC:DD:EE:02",
    routerId: "r1",
    routerName: "RTR-WESTLANDS",
    routerLocation: "Westlands Hub",
    leaseStart: "2025-02-01",
    leaseExpiry: "2025-07-01",
    status: "active",
  },
  {
    id: "m3",
    customerId: "C003",
    customerName: "Peter Mwangi",
    customerEmail: "peter.mwangi@email.com",
    custType: "hotspot",
    package: "Hourly Pass",
    ipAddress: "10.10.5.23",
    macAddress: "CC:DD:EE:FF:00:03",
    routerId: "r2",
    routerName: "RTR-EASTLEIGH",
    routerLocation: "Eastleigh Node",
    leaseStart: "2025-04-20",
    leaseExpiry: "2025-04-21",
    status: "expired",
  },
  {
    id: "m4",
    customerId: "C004",
    customerName: "Faith Otieno",
    customerEmail: "faith.o@email.com",
    custType: "pppoe",
    package: "50 Mbps Enterprise",
    ipAddress: "192.168.20.3",
    macAddress: "BB:CC:DD:EE:FF:04",
    routerId: "r3",
    routerName: "RTR-NGONG",
    routerLocation: "Ngong Road POP",
    leaseStart: "2025-03-10",
    leaseExpiry: "2025-09-10",
    status: "active",
  },
  {
    id: "m5",
    customerId: "C005",
    customerName: "Samuel Njoroge",
    customerEmail: "sam.njoroge@email.com",
    custType: "hotspot",
    package: "Daily Pass",
    ipAddress: "10.10.5.44",
    macAddress: "DD:EE:FF:00:11:05",
    routerId: "r2",
    routerName: "RTR-EASTLEIGH",
    routerLocation: "Eastleigh Node",
    leaseStart: "2025-05-01",
    leaseExpiry: "2025-05-02",
    status: "active",
  },
  {
    id: "m6",
    customerId: "C006",
    customerName: "Lucy Chebet",
    customerEmail: "lucy.c@email.com",
    custType: "pppoe",
    package: "10 Mbps Home",
    ipAddress: "192.168.10.31",
    macAddress: "EE:FF:00:11:22:06",
    routerId: "r1",
    routerName: "RTR-WESTLANDS",
    routerLocation: "Westlands Hub",
    leaseStart: "2024-11-01",
    leaseExpiry: "2025-02-01",
    status: "expired",
  },
  {
    id: "m7",
    customerId: "",
    customerName: "Reserved",
    customerEmail: "",
    custType: "pppoe",
    package: "—",
    ipAddress: "192.168.20.1",
    macAddress: "00:00:00:00:00:00",
    routerId: "r3",
    routerName: "RTR-NGONG",
    routerLocation: "Ngong Road POP",
    leaseStart: "—",
    leaseExpiry: "—",
    status: "reserved",
  },
  {
    id: "m8",
    customerId: "C008",
    customerName: "Brian Omondi",
    customerEmail: "brian.o@email.com",
    custType: "pppoe",
    package: "20 Mbps Business",
    ipAddress: "192.168.10.55",
    macAddress: "FF:00:11:22:33:08",
    routerId: "r1",
    routerName: "RTR-WESTLANDS",
    routerLocation: "Westlands Hub",
    leaseStart: "2025-04-01",
    leaseExpiry: "2025-10-01",
    status: "active",
  },
];

const IP_POOLS: IPPool[] = [
  { routerId: "r1", routerName: "RTR-WESTLANDS", location: "Westlands Hub",  subnet: "192.168.10.0/24", total: 254, used: 187, reserved: 10 },
  { routerId: "r2", routerName: "RTR-EASTLEIGH", location: "Eastleigh Node", subnet: "10.10.5.0/24",    total: 254, used: 62,  reserved: 5  },
  { routerId: "r3", routerName: "RTR-NGONG",     location: "Ngong Road POP", subnet: "192.168.20.0/24", total: 254, used: 43,  reserved: 8  },
];

const CUSTOMERS: CustomerOption[] = [
  { id: "C009", name: "Alice Muthoni",   email: "alice.m@email.com",   custType: "pppoe"    },
  { id: "C010", name: "David Kariuki",   email: "david.k@email.com",   custType: "pppoe"    },
  { id: "C011", name: "Esther Achieng",  email: "esther.a@email.com",  custType: "hotspot"  },
  { id: "C012", name: "Moses Kipchoge",  email: "moses.k@email.com",   custType: "pppoe"    },
  { id: "C013", name: "Naomi Waweru",    email: "naomi.w@email.com",   custType: "hotspot"  },
  { id: "C014", name: "Collins Odhiambo",email: "collins.o@email.com", custType: "pppoe"    },
];

const PACKAGES: PackageOption[] = [
  { id: "p1", label: "10 Mbps Home",       custType: "pppoe"   },
  { id: "p2", label: "20 Mbps Business",   custType: "pppoe"   },
  { id: "p3", label: "50 Mbps Enterprise", custType: "pppoe"   },
  { id: "p4", label: "Hourly Pass",        custType: "hotspot" },
  { id: "p5", label: "Daily Pass",         custType: "hotspot" },
  { id: "p6", label: "Weekly Pass",        custType: "hotspot" },
];

export default function CustomerIPMappingPage() {
  return (
    <div className="p-6 h-full">
      <CustomerIPMappingView
        mappings={IP_MAPPINGS}
        pools={IP_POOLS}
        customers={CUSTOMERS}
        packages={PACKAGES}
      />
    </div>
  );
}
