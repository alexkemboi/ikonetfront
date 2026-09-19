"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, Wifi, WifiOff } from "lucide-react";
import { getLiveSpeed } from "@/actions/customer360";
import { LiveSpeedGauge } from "@/lib/types/customer360";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface LiveSpeedGaugesProps {
  customerId: number;
}

const POLL_MS = 4_000;
const ERROR_BACKOFF_MS = 15_000;
const DIAL_MAX_MBPS = 100;

function formatMbps(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatSampledAt(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function GaugeDial({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(value, DIAL_MAX_MBPS));
  const fraction = DIAL_MAX_MBPS > 0 ? clamped / DIAL_MAX_MBPS : 0;
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - fraction);

  return (
    <div className="relative h-40 w-40">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="var(--primary)"
          strokeOpacity="0.15"
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="var(--primary)"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-sans tabular-nums text-3xl font-semibold text-foreground">
          {formatMbps(value)}
        </span>
        <span className="text-[10px] font-sans uppercase tracking-wider text-muted-foreground">
          Mbps
        </span>
      </div>
    </div>
  );
}

export function LiveSpeedGauges({ customerId }: LiveSpeedGaugesProps) {
  const [gauge, setGauge] = useState<LiveSpeedGauge | null>(null);
  const error = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const run = async () => {
      if (cancelled) return;
      if (!document.hidden) {
        const res = await getLiveSpeed(customerId);
        if (cancelled) return;
        if (res?.success && res.data) {
          setGauge(res.data);
          error.current = false;
        } else {
          error.current = true;
        }
      }
      timer = setTimeout(run, error.current ? ERROR_BACKOFF_MS : POLL_MS);
    };

    run();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [customerId]);

  const online = Boolean(gauge?.online);
  const download = gauge?.downloadMbps ?? 0;
  const upload = gauge?.uploadMbps ?? 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-normal">
            <Activity className="h-4 w-4 text-primary" />
            Live speed
          </CardTitle>
          <div className="flex items-center gap-2">
            {online ? (
              <Badge className="bg-success text-foreground">
                <Wifi className="mr-1 h-3 w-3" /> ONLINE
              </Badge>
            ) : (
              <Badge variant="outline">
                <WifiOff className="mr-1 h-3 w-3" /> OFFLINE
              </Badge>
            )}
            <span className="text-xs font-sans tabular-nums text-muted-foreground">
              {formatSampledAt(gauge?.sampledAt) || "—"}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {gauge?.routerName && (
            <p className="mb-6 text-sm text-muted-foreground">
              Router{" "}
              <span className="font-medium text-foreground">
                {gauge.routerName}
              </span>
              {gauge.interfaceName ? (
                <>
                  {" · "}
                  <span className="font-sans tabular-nums">
                    {gauge.interfaceName}
                  </span>
                </>
              ) : null}
            </p>
          )}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div className="flex flex-col items-center gap-3">
              <GaugeDial value={download} />
              <span className="text-sm font-medium text-muted-foreground">
                Download
              </span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <GaugeDial value={upload} />
              <span className="text-sm font-medium text-muted-foreground">
                Upload
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}