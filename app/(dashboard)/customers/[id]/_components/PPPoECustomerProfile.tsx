"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Customer } from "@/lib/types/customer";
import { Button } from "@/components/ui/button";
import { CustomerProfileHeader } from "./CustomerProfileHeader";
import { CustomerLifecycleBanner } from "./CustomerLifecycleBanner";
import { CustomerInfoGrid } from "./CustomerInfoGrid";
import { CustomerSubscriptionPanel } from "./CustomerSubscriptionPanel";
import { PPPoEAccountsPanel } from "./PPPoEAccountsPanel";
import { RenewSubscriptionSheet } from "../../_components/RenewSubscriptionSheet";
import { ChangePasswordSheet } from "../../_components/ChangePasswordSheet";
import type { PppoeAccountResponse, PppoeSubscriptionResponse } from "@/lib/types/pppoe";

interface PPPoECustomerProfileProps {
 customer: Customer;
 /** Live PPPoE accounts for this customer (GET /pppoe/accounts/customer/{id}). */
 accounts?: PppoeAccountResponse[];
 /** Live PPPoE subscriptions (GET /pppoe/subscriptions/customer/{id}). */
 subscriptions?: PppoeSubscriptionResponse[];
}

export function PPPoECustomerProfile({
 customer,
 accounts = [],
 subscriptions = [],
}: PPPoECustomerProfileProps) {
 const router = useRouter();

 return (
 <div className="space-y-6">
 <Button
 variant="ghost"
 className="flex items-center gap-1 -ml-2 text-muted-foreground hover:text-foreground"
 onClick={() => router.back()}
 >
 <ChevronLeft className="h-4 w-4" />
 Back to Customers
 </Button>

 <CustomerProfileHeader customer={customer} />

 <CustomerLifecycleBanner customer={customer} />

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 <CustomerInfoGrid customer={customer} />
 <CustomerSubscriptionPanel customer={customer} />
 </div>

 <PPPoEAccountsPanel
 customerId={String(customer.userIdxno)}
 accounts={accounts}
 subscriptions={subscriptions}
 />

 <RenewSubscriptionSheet customers={[customer]} />
 <ChangePasswordSheet customers={[customer]} />
 </div>
 );
}