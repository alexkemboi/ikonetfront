"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Customer } from "@/lib/types/customer";
import { Button } from "@/components/ui/button"; // Assuming Button is needed for actions

interface CustomerViewProps {
 customer: Customer;
}

const CustomerView = ({ customer }: CustomerViewProps) => {
 return (
 <Card className="w-full">
 <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0 pb-4">
 <div className="flex items-center space-x-4">
 <CardTitle className="text-3xl font-bold">{customer.fullName}</CardTitle>
 <Badge variant={customer.isActive ? "default" : "destructive"}>
 {customer.isActive ? "Active" : "Inactive"}
 </Badge>
 <Badge variant={customer.canLogin ? "default" : "outline"}>
 {customer.canLogin ? "Can Login" : "Cannot Login"}
 </Badge>
 </div>
 <div className="text-sm text-muted-foreground">
 <p>Username: <span className="font-semibold text-foreground">{customer.username}</span></p>
 <p>Email: <span className="font-semibold text-foreground">{customer.email}</span></p>
 </div>
 </CardHeader>
 <CardContent>
 <Tabs defaultValue="general">
 <TabsList className="grid grid-cols-2"> {/* Added a third tab for actions */}
 <TabsTrigger value="general">General Information</TabsTrigger>
 <TabsTrigger value="subscription">Subscription Details</TabsTrigger>
 </TabsList>

 <TabsContent value="general" className="mt-6">
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {/* General Info */}
 <div className="space-y-1">
 <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
 <p className="text-base font-semibold">{customer.phoneNumber}</p>
 </div>
 <div className="space-y-1">
 <p className="text-sm font-medium text-muted-foreground">Role</p>
 <p className="text-base font-semibold">{customer.role}</p>
 </div>
 <div className="space-y-1">
 <p className="text-sm font-medium text-muted-foreground">Created At</p>
 <p className="text-base font-semibold">{new Date(customer.createdAt).toLocaleDateString()}</p>
 </div>
 {/* Add more general info fields here if needed */}
 </div>
 </TabsContent>

 <TabsContent value="subscription" className="mt-6">
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {/* Subscription Info */}
 <div className="space-y-1">
 <p className="text-sm font-medium text-muted-foreground">Subscriber ID</p>
 <p className="text-base font-semibold">{customer.subscriberIdxno || "N/A"}</p>
 </div>
 <div className="space-y-1">
 <p className="text-sm font-medium text-muted-foreground">Account Number</p>
 <p className="text-base font-semibold">{customer.acno || "N/A"}</p>
 </div>
 <div className="space-y-1">
 <p className="text-sm font-medium text-muted-foreground">Package Name</p>
 <p className="text-base font-semibold">{customer.packageName || "N/A"}</p>
 </div>
 <div className="space-y-1">
 <p className="text-sm font-medium text-muted-foreground">Customer Type</p>
 <p className="text-base font-semibold">{customer.custtype || "N/A"}</p>
 </div>
 <div className="space-y-1">
 <p className="text-sm font-medium text-muted-foreground">Subscription Active</p>
 <p className="text-base font-semibold">{customer.isSubActive ? "Yes" : "No"}</p>
 </div>
 <div className="space-y-1">
 <p className="text-sm font-medium text-muted-foreground">Expiry Date</p>
 <p className="text-base font-semibold">{customer.expiryDate ? new Date(customer.expiryDate).toLocaleDateString() : "N/A"}</p>
 </div>
 <div className="space-y-1">
 <p className="text-sm font-medium text-muted-foreground">Last Active Date</p>
 <p className="text-base font-semibold">{customer.lastActiveDate ? new Date(customer.lastActiveDate).toLocaleDateString() : "N/A"}</p>
 </div>
 </div>
 </TabsContent>
 </Tabs>
 </CardContent>
 </Card>
 );
};

export default CustomerView;
