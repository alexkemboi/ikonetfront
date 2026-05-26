"use client";

import { motion } from "framer-motion";
import { Wifi, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InternetPackage } from "@/actions/packages";

interface PackageMetricsPanelProps {
  packages: InternetPackage[];
  active: number;
  inactive: number;
  delay?: number;
}

export function PackageMetricsPanel({
  packages,
  active,
  inactive,
  delay = 0,
}: PackageMetricsPanelProps) {
  const total = packages.length;

  // Group by category
  const byCategory = packages.reduce<Record<string, number>>((acc, pkg) => {
    const cat = pkg.packageCategory || "Uncategorized";
    acc[cat] = (acc[cat] ?? 0) + 1;
    return acc;
  }, {});

  const categoryEntries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

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
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100">
                <Wifi className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-base">Internet Packages</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {total} package{total !== 1 ? "s" : ""} configured
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Active / Inactive split */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 rounded-lg border bg-card p-3">
              <CheckCircle className="h-5 w-5 text-success shrink-0" />
              <div>
                <p className="text-xl font-bold">{active}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-card p-3">
              <XCircle className="h-5 w-5 text-destructive shrink-0" />
              <div>
                <p className="text-xl font-bold">{inactive}</p>
                <p className="text-xs text-muted-foreground">Inactive</p>
              </div>
            </div>
          </div>

          {/* Category breakdown */}
          {categoryEntries.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                By Category
              </p>
              {categoryEntries.map(([cat, count], i) => (
                <motion.div
                  key={cat}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: delay + 0.08 * i }}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-muted-foreground truncate">{cat}</span>
                  <Badge variant="secondary" className="ml-2 shrink-0">
                    {count}
                  </Badge>
                </motion.div>
              ))}
            </div>
          )}

          {packages.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              No packages configured
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
