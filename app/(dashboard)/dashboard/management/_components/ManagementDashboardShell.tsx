"use client";

import { motion } from "framer-motion";
import {
 Users,
 TrendingUp,
 AlertTriangle,
 DollarSign,
 Wifi,
 Calendar,
} from "lucide-react";
import { Customer } from "@/lib/types/customer";
import { InternetPackage } from "@/actions/packages";
import { MetricCard } from "../../_components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCustomerDate, resolveExpiryDateColorClass } from "@/lib/utils/customerFormatters";

interface ManagementDashboardShellProps {
 totalCustomers: number;
 activeCustomers: number;
 pppoeCustomers: number;
 packages: InternetPackage[] | [];
 expiringCustomers: Customer[];
 greeting: string;
}

export function ManagementDashboardShell({
 totalCustomers,
 activeCustomers,
 pppoeCustomers,
 packages,
 expiringCustomers,
 greeting,
}: ManagementDashboardShellProps) {
 const activePackages = packages.filter((p) => p.activeStatus);

 return (
 <div className="space-y-6">
 {/* Header */}
 <motion.div
 initial={{ opacity: 0, y: -12 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.35 }}
 >
 <div className="flex items-center gap-2">
 <Badge className="bg-warning text-foreground text-xs">Management</Badge>
 </div>
 <h1 className="text-2xl font-normal tracking-normal mt-1">{greeting}</h1>
 <p className="text-sm text-muted-foreground">Business overview &amp; subscription health</p>
 </motion.div>

 {/* Stat cards */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 <MetricCard
 title="Total Customers"
 value={totalCustomers}
 subtitle={`${activeCustomers} active`}
 icon={Users}
 colorScheme="navy"
 delay={0.05}
 />
 <MetricCard
 title="PPPoE Subscribers"
 value={pppoeCustomers}
 subtitle="Active internet accounts"
 icon={Wifi}
 colorScheme="green"
 delay={0.1}
 />
 <MetricCard
 title="Active Packages"
 value={activePackages.length}
 subtitle="Catalog plans · not collected revenue"
 icon={DollarSign}
 colorScheme="orange"
 delay={0.15}
 />
 <MetricCard
 title="Expiring Soon"
 value={expiringCustomers.length}
 subtitle="Within 30 days"
 icon={AlertTriangle}
 colorScheme={expiringCustomers.length > 0 ? "red" : "green"}
 delay={0.2}
 />
 </div>

 {/* Two panels */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
 {/* Expiring subscriptions */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.4, delay: 0.25 }}
 >
 <Card className="h-full">
 <CardHeader className="pb-3">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
 <Calendar className="h-4 w-4 text-destructive" />
 </div>
 <CardTitle className="text-base">Expiring Subscriptions</CardTitle>
 </div>
 <Badge variant={expiringCustomers.length > 0 ? "destructive" : "secondary"}>
 {expiringCustomers.length} pending
 </Badge>
 </div>
 </CardHeader>
 <CardContent>
 {expiringCustomers.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
 <TrendingUp className="h-8 w-8 mb-2 text-success" />
 <p className="text-sm font-medium">All subscriptions are healthy</p>
 <p className="text-xs">No renewals needed in the next 30 days</p>
 </div>
 ) : (
 <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
 {expiringCustomers.map((customer, i) => (
 <motion.div
 key={customer.userIdxno}
 initial={{ opacity: 0, x: -8 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ duration: 0.3, delay: 0.05 * i }}
 className="flex items-center justify-between rounded-lg border bg-card p-2.5"
 >
 <div className="min-w-0">
 <p className="text-sm font-medium truncate">{customer.fullName}</p>
 <p className="text-xs text-muted-foreground font-sans tabular-nums">
 {customer.packageName ?? "No package"}
 </p>
 </div>
 <div className="shrink-0 ml-2 text-right">
 <p className={`text-xs font-semibold ${resolveExpiryDateColorClass(customer.expiryDate)}`}>
 {formatCustomerDate(customer.expiryDate)}
 </p>
 </div>
 </motion.div>
 ))}
 </div>
 )}
 </CardContent>
 </Card>
 </motion.div>

 {/* Package performance */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.4, delay: 0.3 }}
 >
 <Card className="h-full">
 <CardHeader className="pb-3">
 <div className="flex items-center gap-2">
 <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
 <TrendingUp className="h-4 w-4 text-success" />
 </div>
 <CardTitle className="text-base">Package Portfolio</CardTitle>
 </div>
 </CardHeader>
 <CardContent>
 {packages.length === 0 ? (
 <p className="text-sm text-muted-foreground text-center py-4">No packages configured</p>
 ) : (
 <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
 {packages.map((pkg, i) => (
 <motion.div
 key={pkg.idxno}
 initial={{ opacity: 0, x: 8 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ duration: 0.3, delay: 0.05 * i }}
 className="flex items-center justify-between rounded-lg border bg-card p-2.5"
 >
 <div className="min-w-0">
 <p className="text-sm font-medium truncate">{pkg.packageName}</p>
 <p className="text-xs text-muted-foreground">
 {pkg.speedDownload}/{pkg.speedUpload} Mbps · {pkg.packageCategory}
 </p>
 </div>
 <div className="shrink-0 ml-2 text-right space-y-1">
 <p className="text-sm font-bold text-success">
 KES {pkg.price}
 </p>
 <Badge
 variant={pkg.activeStatus ? "default" : "secondary"}
 className={pkg.activeStatus ? "bg-primary text-foreground text-xs" : "text-xs"}
 >
 {pkg.activeStatus ? "Active" : "Inactive"}
 </Badge>
 </div>
 </motion.div>
 ))}
 </div>
 )}
 </CardContent>
 </Card>
 </motion.div>
 </div>
 </div>
 );
}
