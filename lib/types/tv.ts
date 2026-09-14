/** UI contract: map your TV package API response to these fields on the server. */
export interface TvPackage {
  idxno: string | number; // API IDs may be numeric; form values are strings.
  packageName: string;
  price: number; // KES
  validity: string; // Customer-facing duration, e.g. "30 days".
  speedDownload: number;
  speedUpload: number;
  maxDevices: number;
  dataAllowance: string; // e.g. "Unlimited" or "50 GB".
}

export interface TvPackagesResult {
  packages: TvPackage[];
  error?: string;
}
