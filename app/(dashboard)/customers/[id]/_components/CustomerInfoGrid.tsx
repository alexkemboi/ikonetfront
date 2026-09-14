"use client";

import { motion } from "framer-motion";
import { Customer } from "@/lib/types/customer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCustomerDate } from "@/lib/utils/customerFormatters";
import { cn } from "@/lib/utils";

interface CustomerInfoGridProps {
 customer: Customer;
}

function InfoField({
 label,
 value,
 mono = false,
}: {
 label: string;
 value: string;
 mono?: boolean;
}) {
 return (
 <div className="space-y-1">
 <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
 {label}
 </p>
 <p className={cn("text-sm font-semibold", mono && "font-sans tabular-nums")}>{value}</p>
 </div>
 );
}

export function CustomerInfoGrid({ customer }: CustomerInfoGridProps) {
 return (
 <motion.div
 initial={{ opacity: 0, x: -16 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
 >
 <Card className="h-full">
 <CardHeader>
 <CardTitle className="text-lg">Account Information</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
 <InfoField label="First Name" value={customer.firstname} />
 <InfoField label="Last Name" value={customer.lname} />
 <InfoField label="Phone" value={customer.phoneNumber} />
 <InfoField label="Email" value={customer.email} />
 <InfoField
 label="Username"
 value={customer.username}
 mono
 />
 <InfoField
 label="Account No"
 value={customer.acno ?? "N/A"}
 mono
 />
 <InfoField
 label="Customer Type"
 value={customer.custtype ?? "N/A"}
 />
 <InfoField label="Role" value={customer.role} />
 <InfoField
 label="Member Since"
 value={formatCustomerDate(customer.createdAt)}
 />
 <InfoField
 label="Login Enabled"
 value={customer.canLogin ? "Yes" : "No"}
 />
 </div>
 </CardContent>
 </Card>
 </motion.div>
 );
}
