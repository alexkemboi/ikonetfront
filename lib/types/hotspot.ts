export interface HotspotPackage {
  idxno: number;
  packageName: string;
  price: number;
  packageCategory: string;
  validityType: string;
  validityValue: number;
  bandwidthType: string;
  activeStatus: boolean;
  speedDownload: number;
  speedUpload: number;
  enableBurst: boolean;
  rateLimit: string;
  burstLimit: string;
  burstThreshold: string;
  burstTime: string;
  dateCreated: string;
  createdBy: string;
  approvedBy: string | null;
  isApproved: boolean;
}

export interface HotspotPackagesResponse {
  status: number;
  success: boolean;
  message: string;
  data: HotspotPackage[];
  timestamp: string;
}

export interface InitiatePaymentRequest {
  packageId: number;
  phone: string;
  paymentMode: string;
  macAddress: string;
  clientMac: string;
  clientIp: string;
}

export interface InitiatePaymentResponse {
  status: number;
  success: boolean;
  message: string;
  data: any; // Adjust based on actual response data if available
  timestamp: string;
}

export interface ReconnectResponse {
  status: number;
  success: boolean;
  message: string;
  data: {
    hasActiveSession: boolean;
    message: string;
    session: any; // Adjust based on actual session data if available
  };
  timestamp: string;
}

export interface HotspotState {
  packages: HotspotPackage[];
  selectedPackage: HotspotPackage | null;
  paymentStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  paymentMessage: string | null;
  hasActiveSession: boolean;
  sessionMessage: string | null;
}
