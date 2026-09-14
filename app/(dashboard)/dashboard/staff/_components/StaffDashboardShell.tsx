"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
 UserPlus,
 RefreshCw,
 Clock,
 Users,
 Wifi,
 AlertCircle,
 CheckCircle2,
} from "lucide-react";
import { Customer } from "@/lib/types/customer";
import { MetricCard } from "../../_components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
 formatCustomerDate,
 resolveExpiryDateColorClass,
} from "@/lib/utils/customerFormatters";

interface StaffDashboardShellProps {
 totalCustomers: number;
 activeCustomers: number;
 urgentRenewals: Customer[]; // expiring within 7 days
 recentCustomers: Customer[]; // latest signups
 greeting: string;
}

export function StaffDashboardShell({
 totalCustomers,
 activeCustomers,
 urgentRenewals,
 recentCustomers,
 greeting,
}: StaffDashboardShellProps) {
 const router = useRouter();

 return (
 <div className="space-y-6">
 {/* Header */}
 <motion.div
 initial={{ opacity: 0, y: -12 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.35 }}
 >
 <div className="flex items-center gap-2">
 <Badge className="bg-success text-foreground text-xs">Staff</Badge>
 </div>
 <h1 className="text-2xl font-normal tracking-normal mt-1">{greeting}</h1>
 <p className="text-sm text-muted-foreground">Your daily work overview</p>
 </motion.div>

 {/* Stat cards */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <MetricCard
 title="Total Customers"
 value={totalCustomers}
 subtitle={`${activeCustomers} active`}
 icon={Users}
 colorScheme="navy"
 delay={0.05}
 />
 <MetricCard
 title="Urgent Renewals"
 value={urgentRenewals.length}
 subtitle="Expiring within 7 days"
 icon={Clock}
 colorScheme={urgentRenewals.length > 0 ? "red" : "green"}
 delay={0.1}
 />
 <MetricCard
 title="Recent Signups"
 value={recentCustomers.length}
 subtitle="Latest registered customers"
 icon={Wifi}
 colorScheme="purple"
 delay={0.15}
 />
 </div>

 {/* Two panels */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

 {/* Urgent renewals */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.4, delay: 0.2 }}
 >
 <Card className="h-full">
 <CardHeader className="pb-3">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
 <AlertCircle className="h-4 w-4 text-destructive" />
 </div>
 <CardTitle className="text-base">Urgent Renewals</CardTitle>
 </div>
 <Button
 size="sm"
 variant="outline"
 onClick={() => router.push("/customers/pppoe")}
 >
 View all
 </Button>
 </div>
 </CardHeader>
 <CardContent>
 {urgentRenewals.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
 <CheckCircle2 className="h-8 w-8 mb-2 text-success" />
 <p className="text-sm font-medium">No urgent renewals</p>
 <p className="text-xs">All subscriptions are current</p>
 </div>
 ) : (
 <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
 {urgentRenewals.map((customer, i) => (
 <motion.div
 key={customer.userIdxno}
 initial={{ opacity: 0, x: -8 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ duration: 0.25, delay: 0.04 * i }}
 className="flex items-center justify-between rounded-lg border bg-card p-2.5 cursor-pointer hover:bg-muted/50 transition-colors"
 onClick={() => router.push(`/customers/${customer.userIdxno}`)}
 >
 <div className="min-w-0">
 <p className="text-sm font-medium truncate">{customer.fullName}</p>
 <p className="text-xs text-muted-foreground font-sans tabular-nums">
 @{customer.username}
 </p>
 </div>
 <p className={`text-xs font-semibold shrink-0 ml-2 ${resolveExpiryDateColorClass(customer.expiryDate)}`}>
 {formatCustomerDate(customer.expiryDate)}
 </p>
 </motion.div>
 ))}
 </div>
 )}
 </CardContent>
 </Card>
 </motion.div>

 {/* Recent customers */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.4, delay: 0.25 }}
 >
 <Card className="h-full">
 <CardHeader className="pb-3">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
 <Users className="h-4 w-4 text-primary" />
 </div>
 <CardTitle className="text-base">Recent Customers</CardTitle>
 </div>
 <Button
 size="sm"
 variant="outline"
 onClick={() => router.push("/customers/all")}
 >
 View all
 </Button>
 </div>
 </CardHeader>
 <CardContent>
 {recentCustomers.length === 0 ? (
 <p className="text-sm text-muted-foreground text-center py-4">
 No customers yet
 </p>
 ) : (
 <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
 {recentCustomers.map((customer, i) => (
 <motion.div
 key={customer.userIdxno}
 initial={{ opacity: 0, x: 8 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ duration: 0.25, delay: 0.04 * i }}
 className="flex items-center justify-between rounded-lg border bg-card p-2.5 cursor-pointer hover:bg-muted/50 transition-colors"
 onClick={() => router.push(`/customers/${customer.userIdxno}`)}
 >
 <div className="min-w-0">
 <p className="text-sm font-medium truncate">{customer.fullName}</p>
 <p className="text-xs text-muted-foreground">
 {customer.custtype?.toUpperCase() ?? "N/A"} · {customer.packageName ?? "No package"}
 </p>
 </div>
 <Badge
 variant={customer.isActive ? "default" : "destructive"}
 className={customer.isActive ? "bg-primary text-foreground text-xs shrink-0 ml-2" : "text-xs shrink-0 ml-2"}
 >
 {customer.isActive ? "Active" : "Inactive"}
 </Badge>
 </motion.div>
 ))}
 </div>
 )}
 </CardContent>
 </Card>
 </motion.div>
 </div>

 {/* Quick actions */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.4, delay: 0.3 }}
 >
 <Card>
 <CardHeader className="pb-3">
 <CardTitle className="text-base">Quick Actions</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="flex flex-wrap gap-3">
 <Button onClick={() => router.push("/customers/new")}>
 <UserPlus className="h-4 w-4 mr-2" />
 Add Customer
 </Button>
 <Button variant="outline" onClick={() => router.push("/customers/pppoe")}>
 <RefreshCw className="h-4 w-4 mr-2" />
 Manage PPPoE
 </Button>
 <Button variant="outline" onClick={() => router.push("/customers/all")}>
 <Users className="h-4 w-4 mr-2" />
 All Customers
 </Button>
 </div>
 </CardContent>
 </Card>
 </motion.div>
 </div>
 );
}
