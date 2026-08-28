"use client";

import { motion } from "framer-motion";
import { Customer } from "@/lib/types/customer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CustomerActionButtons } from "./CustomerActionButtons";

interface CustomerProfileHeaderProps {
 customer: Customer;
}

function buildCustomerInitials(firstname: string, lname: string): string {
 return `${firstname.charAt(0)}${lname.charAt(0)}`.toUpperCase();
}

function resolveSubscriptionBadge(isSubActive: boolean | null) {
 if (isSubActive === null || isSubActive === undefined) {
 return <Badge variant="outline">No Subscription</Badge>;
 }
 return isSubActive ? (
 <Badge className="bg-success text-foreground">Subscribed</Badge>
 ) : (
 <Badge className="bg-warning text-foreground">Unsubscribed</Badge>
 );
}

export function CustomerProfileHeader({ customer }: CustomerProfileHeaderProps) {
 const initials = buildCustomerInitials(customer.firstname, customer.lname);

 return (
 <motion.div
 initial={{ opacity: 0, y: -20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.4, ease: "easeOut" }}
 >
 <Card>
 <CardContent className="pt-6">
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
 <div className="flex items-center gap-4">
 <Avatar className="h-16 w-16 text-lg">
 <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
 {initials}
 </AvatarFallback>
 </Avatar>

 <div>
 <h1 className="text-2xl font-bold tracking-tight">
 {customer.fullName}
 </h1>
 <div className="flex flex-wrap items-center gap-2 mt-1">
 <span className="font-mono text-sm text-muted-foreground">
 @{customer.username}
 </span>
 {customer.acno && (
 <Badge variant="outline" className="font-mono text-xs">
 ACNO: {customer.acno}
 </Badge>
 )}
 {customer.custtype && (
 <Badge variant="secondary" className="uppercase text-xs">
 {customer.custtype}
 </Badge>
 )}
 </div>
 <div className="flex flex-wrap items-center gap-2 mt-2">
 <Badge
 className={customer.isActive ? "bg-primary text-foreground" : ""}
 variant={customer.isActive ? "default" : "destructive"}
 >
 {customer.isActive ? "Active" : "Inactive"}
 </Badge>
 <Badge
 variant={customer.canLogin ? "outline" : "secondary"}
 >
 {customer.canLogin ? "Login Enabled" : "Login Disabled"}
 </Badge>
 {resolveSubscriptionBadge(customer.isSubActive)}
 </div>
 </div>
 </div>

 <CustomerActionButtons
 customerId={customer.userIdxno}
 isActive={customer.isActive}
 subscriptionId={customer.subscriberIdxno?.toString()}
 />
 </div>
 </CardContent>
 </Card>
 </motion.div>
 );
}
