"use client";

import { motion } from "framer-motion";
import {
 Wifi,
 Calendar,
 CreditCard,
 User,
 CheckCircle2,
 XCircle,
 Clock,
} from "lucide-react";
import { Customer } from "@/lib/types/customer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
 formatCustomerDate,
 resolveExpiryDateColorClass,
 resolveExpiryStatusVariant,
} from "@/lib/utils/customerFormatters";

interface CustomerDashboardShellProps {
 customer: Customer;
}

function AccountStatusIcon({ isActive }: { isActive: boolean }) {
 return isActive ? (
 <CheckCircle2 className="h-5 w-5 text-success" />
 ) : (
 <XCircle className="h-5 w-5 text-destructive" />
 );
}

export function CustomerDashboardShell({ customer }: CustomerDashboardShellProps) {
 const expiryVariant = resolveExpiryStatusVariant(customer.expiryDate);

 const expiryBadgeStyle =
 expiryVariant === "complete"
 ? "bg-success text-foreground"
 : expiryVariant === "warning"
 ? "bg-warning text-foreground"
 : expiryVariant === "danger"
 ? ""
 : "bg-muted text-muted-foreground";

 return (
 <div className="space-y-6 max-w-3xl mx-auto">
 {/* Welcome header */}
 <motion.div
 initial={{ opacity: 0, y: -12 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.35 }}
 className="flex items-center justify-between"
 >
 <div>
 <Badge className="bg-primary text-foreground text-xs mb-1">My Account</Badge>
 <h1 className="text-2xl font-bold tracking-tight">
 Welcome, {customer.firstname}
 </h1>
 <p className="text-sm text-muted-foreground">
 Account No:{" "}
 <span className="font-mono font-semibold text-foreground">
 {customer.acno ?? "N/A"}
 </span>
 </p>
 </div>
 <div className="flex items-center gap-2">
 <AccountStatusIcon isActive={customer.isActive} />
 <span className="text-sm font-medium">
 {customer.isActive ? "Account Active" : "Account Inactive"}
 </span>
 </div>
 </motion.div>

 {/* Subscription status card */}
 <motion.div
 initial={{ opacity: 0, scale: 0.97 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ duration: 0.4, delay: 0.1 }}
 >
 <Card className="border-2">
 <CardHeader className="pb-2">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Wifi className="h-5 w-5 text-primary" />
 <CardTitle className="text-lg">My Subscription</CardTitle>
 </div>
 {customer.isSubActive !== null && (
 <Badge
 variant={customer.isSubActive ? "default" : "destructive"}
 className={customer.isSubActive ? "bg-success text-foreground" : ""}
 >
 {customer.isSubActive ? "Active" : "Inactive"}
 </Badge>
 )}
 </div>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-1">
 <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
 Package
 </p>
 <p className="text-base font-bold">
 {customer.packageName ?? "Not assigned"}
 </p>
 </div>
 <div className="space-y-1">
 <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
 Type
 </p>
 <p className="text-base font-bold uppercase">
 {customer.custtype ?? "N/A"}
 </p>
 </div>
 </div>

 <Separator />

 {/* Expiry section */}
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Clock className="h-4 w-4 text-muted-foreground" />
 <div>
 <p className="text-xs text-muted-foreground">Subscription Expiry</p>
 <p className={`text-base font-bold ${resolveExpiryDateColorClass(customer.expiryDate)}`}>
 {formatCustomerDate(customer.expiryDate)}
 </p>
 </div>
 </div>
 <Badge
 className={expiryBadgeStyle}
 variant={expiryVariant === "danger" ? "destructive" : "default"}
 >
 {expiryVariant === "complete" && "Current"}
 {expiryVariant === "warning" && "Expiring Soon"}
 {expiryVariant === "danger" && "Expired"}
 {expiryVariant === "pending" && "Not Set"}
 </Badge>
 </div>

 <div className="flex items-center gap-2 text-sm text-muted-foreground">
 <Calendar className="h-4 w-4" />
 <span>Last active: {formatCustomerDate(customer.lastActiveDate)}</span>
 </div>
 </CardContent>
 </Card>
 </motion.div>

 {/* Account details */}
 <motion.div
 initial={{ opacity: 0, y: 16 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.4, delay: 0.2 }}
 >
 <Card>
 <CardHeader className="pb-3">
 <div className="flex items-center gap-2">
 <User className="h-5 w-5 text-muted-foreground" />
 <CardTitle className="text-base">Account Details</CardTitle>
 </div>
 </CardHeader>
 <CardContent>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 {[
 { label: "Full Name", value: customer.fullName },
 { label: "Username", value: customer.username, mono: true },
 { label: "Email", value: customer.email },
 { label: "Phone", value: customer.phoneNumber },
 { label: "Account No", value: customer.acno ?? "N/A", mono: true },
 { label: "Member Since", value: formatCustomerDate(customer.createdAt) },
 ].map(({ label, value, mono }) => (
 <div key={label} className="space-y-0.5">
 <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
 {label}
 </p>
 <p className={`text-sm font-semibold ${mono ? "font-mono" : ""}`}>
 {value}
 </p>
 </div>
 ))}
 </div>
 </CardContent>
 </Card>
 </motion.div>

 {/* Contact support prompt */}
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 transition={{ duration: 0.4, delay: 0.3 }}
 className="flex items-center gap-3 rounded-xl border bg-card px-5 py-3"
 >
 <CreditCard className="h-5 w-5 text-muted-foreground shrink-0" />
 <p className="text-sm text-muted-foreground">
 Need to renew or change your plan? Contact your ISP support team.
 </p>
 </motion.div>
 </div>
 );
}
