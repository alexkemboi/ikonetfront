import type { ZtpBootstrapInput } from "@/lib/types/provisioning";

const IDENTITY_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9 ]*[A-Za-z0-9])?$/;
const IDENTITY_MAX_LENGTH = 64;

/** Returns the first problem with a ZTP bootstrap request, or null when it is valid. */
export function validateZtpBootstrapInput(input: ZtpBootstrapInput): string | null {
  if (!IDENTITY_PATTERN.test(input.identity)) {
    return "Identity may contain only letters, numbers and spaces, and must start and end with a letter or number.";
  }
  if (input.identity.length > IDENTITY_MAX_LENGTH) {
    return `Identity must be at most ${IDENTITY_MAX_LENGTH} characters.`;
  }
  if (!input.acknowledgeDestructiveReset) {
    return "Confirm that the script may replace this router's existing configuration.";
  }
  return null;
}
