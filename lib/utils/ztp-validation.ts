import type { ZtpBootstrapInput } from "@/lib/types/provisioning";

// Same characters the backend accepts; dashes are needed for names like bedak-mombasa-town.
const IDENTITY_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9 ._-]*[A-Za-z0-9])?$/;
const INTERFACE_PATTERN = /^[A-Za-z0-9._-]{1,32}$/;
const IDENTITY_MAX_LENGTH = 64;

/** Returns the first problem with a ZTP bootstrap request, or null when it is valid. */
export function validateZtpBootstrapInput(input: ZtpBootstrapInput): string | null {
  if (!IDENTITY_PATTERN.test(input.identity)) {
    return "Identity may contain only letters, numbers, spaces, dots, dashes and underscores, and must start and end with a letter or number.";
  }
  if (input.identity.length > IDENTITY_MAX_LENGTH) {
    return `Identity must be at most ${IDENTITY_MAX_LENGTH} characters.`;
  }
  if (input.wanInterface !== undefined && !INTERFACE_PATTERN.test(input.wanInterface)) {
    return "Internet port must be a RouterOS interface name such as ether1 or sfp-sfpplus1.";
  }
  const downlinks = input.downlinkInterfaces ?? [];
  if (downlinks.length > 4) {
    return "Choose at most 4 ports to feed other routers.";
  }
  if (downlinks.some((port) => !INTERFACE_PATTERN.test(port))) {
    return "Each downstream port must be a RouterOS interface name such as ether7.";
  }
  if (input.wanInterface !== undefined && downlinks.includes(input.wanInterface)) {
    return `${input.wanInterface} is the internet port, so it cannot also feed another router.`;
  }
  if (input.stationIdxno !== undefined && !(Number.isInteger(input.stationIdxno) && input.stationIdxno > 0)) {
    return "Choose the station this router serves.";
  }
  if (!input.acknowledgeDestructiveReset) {
    return "Confirm that the script may replace this router's existing configuration.";
  }
  return null;
}
