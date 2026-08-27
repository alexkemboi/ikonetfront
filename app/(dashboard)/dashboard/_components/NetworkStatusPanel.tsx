"use client";

import { motion } from "framer-motion";
import { Router, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MikrotikDevice } from "@/lib/types/mikrotik";

interface NetworkStatusPanelProps {
  devices: MikrotikDevice[];
  online: number;
  offline: number;
  delay?: number;
}

export function NetworkStatusPanel({
  devices,
  online,
  offline,
  delay = 0,
}: NetworkStatusPanelProps) {
  const total = devices.length;
  const healthPercent = total > 0 ? Math.round((online / total) * 100) : 0;

  const healthColor =
    healthPercent === 100
      ? "bg-success"
      : healthPercent >= 60
      ? "bg-warning"
      : "bg-destructive";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
    >
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                <Router className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-base">Network Devices</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {total} registered device{total !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <Badge
              className={
                healthPercent === 100
                  ? "bg-success text-white"
                  : healthPercent >= 60
                  ? "bg-warning text-white"
                  : ""
              }
              variant={healthPercent < 60 ? "destructive" : "default"}
            >
              {healthPercent}% healthy
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Health bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{online} online</span>
              <span>{offline} offline</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                className={`h-full rounded-full ${healthColor}`}
                initial={{ width: 0 }}
                animate={{ width: `${healthPercent}%` }}
                transition={{ duration: 0.7, delay: delay + 0.2, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Device list */}
          {devices.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No devices registered
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {devices.map((device, i) => (
                <motion.div
                  key={device.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: delay + 0.1 * i, ease: "easeOut" }}
                  className="flex items-center justify-between rounded-lg border bg-card p-2.5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        device.online ? "bg-success" : "bg-muted-foreground"
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{device.name}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{device.location || device.site || "—"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 text-right ml-2">
                    <p className="font-mono text-xs text-muted-foreground">
                      {device.ipAddress}
                    </p>
                    {device.cpuLoad && (
                      <p className="text-xs text-muted-foreground">
                        CPU {device.cpuLoad}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
