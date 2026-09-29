export function formatBytes(value: string | number | null | undefined): string {
  if (value == null) return "-";
  let bytes: bigint;
  try {
    bytes = typeof value === "number" ? BigInt(Math.trunc(value)) : BigInt(value);
  } catch {
    return "-";
  }
  if (bytes < BigInt(0)) return "-";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  let divisor = BigInt(1);
  let unit = 0;
  while (bytes / divisor >= BigInt(1000) && unit < units.length - 1) {
    divisor *= BigInt(1000);
    unit += 1;
  }
  if (unit === 0) return `${bytes} B`;
  const whole = bytes / divisor;
  const tenth = ((bytes % divisor) * BigInt(10)) / divisor;
  return `${whole}.${tenth} ${units[unit]}`;
}