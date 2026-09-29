/** Public TV package option from the TV eligibility contract. */
export interface TvPackage {
  idxno: string | number;
  packageName: string;
  price: string;
  validity: string;
  speedLabel?: string | null;
  speedDownload: number;
  speedUpload: number;
  maxDevices: number;
  dataAllowance: string; // e.g. "Unlimited" or "50 GB".
  availableForDevice?: boolean;
  unavailableReason?: string | null;
}

export interface TvPackagesResult {
  packages: TvPackage[];
  error?: string;
}

export interface TvPackageOptionResponse {
  packageId: number;
  name: string;
  validityLabel: string;
  speedLabel: string | null;
  price: string;
  currency?: string;
  availableForDevice: boolean;
  unavailableReason?: string | null;
  notes: string | null;
}

export interface TvPortalSession {
  portalToken: string;
  portalTokenExpiresAt: string;
  companyCode: string;
  stationId: string | null;
  normalizedPhone: string;
  normalizedMac: string;
  routerIdentity: string | null;
}
