export interface RegionRequest {
  regionCode: string;
  name: string;
  description?: string;
}

export interface RegionResponse {
  idxno: number;
  regionCode: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  locations?: LocationResponse[] | null;
}

export interface LocationRequest {
  regionIdxno: number;
  name: string;
  latitude?: number;
  longitude?: number;
}

export interface LocationResponse {
  idxno: number;
  regionIdxno: number;
  regionName: string;
  name: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  createdAt: string;
  stations?: StationResponse[];
}

export interface StationRequest {
  locationIdxno: number;
  name: string;
  powerType?: string;
  backhaulType?: string;
}

export interface StationResponse {
  idxno: number;
  locationIdxno: number;
  locationName: string;
  name: string;
  powerType: string;
  backhaulType: string;
  isActive: boolean;
  createdAt: string;
}

export interface RouterConnectionRequest {
  ipAddress: string;
  port: number;
  username: string;
  password?: string;
}

export interface RouterValidationResponse {
  identity: string;
  model: string;
  architecture: string;
  routerosVersion: string;
  serialNumber: string;
  cpu: string;
  cpuCount: string;
  totalMemory: string;
  freeMemory: string;
}

export interface RouterOnboardRequest {
  ipAddress: string;
  port: number;
  username: string;
  password?: string;
  stationIdxno: number;
  routerRole: string;
  pppoeEnabled: boolean;
  hotspotEnabled: boolean;
  monitoringEnabled: boolean;
}

export interface RouterHealthSnapshot {
  idxno: number;
  routerId: number;
  cpuUsage: number;
  totalMemory: number;
  freeMemory: number;
  temperature?: number;
  activePppoeSessions: number;
  activeHotspotSessions: number;
  uptime: string;
  latencyMs: number;
  createdAt: string;
}

export interface RouterCapacityResponse {
  id: number;
  name: string;
  ipAddress: string;
  currentSessions: number;
  maxSessions: number;
  cpuUsage: number;
  loadFactor: number;
  healthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL';
}

export interface SubscriberProvisioningRequest {
  customerId: string;
  subscriptionId: string;
  stationIdxno: number;
  pppoeUsername: string;
  pppoePassword?: string;
}

export interface RouterResponse {
  id: number;
  name: string;
  ipAddress: string;
  model: string;
  status: boolean;
  stationIdxno?: number;
  stationName?: string;
  locationIdxno?: number;
  locationName?: string;
  regionIdxno?: number;
  regionName?: string;
  routerRole?: string;
  pppoeEnabled?: boolean;
  hotspotEnabled?: boolean;
  monitoringEnabled?: boolean;
  createdAt?: string;
}