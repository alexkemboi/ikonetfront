"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Customer } from "@/lib/types/customer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomerProfileHeader } from "./CustomerProfileHeader";
import { CustomerLifecycleBanner } from "./CustomerLifecycleBanner";
import { CustomerInfoGrid } from "./CustomerInfoGrid";
import { CustomerSubscriptionPanel } from "./CustomerSubscriptionPanel";
import { LiveSpeedGauges } from "./LiveSpeedGauges";
import { CustomerDeviceCheckCard } from "./CustomerDeviceCheckCard";
import { ActivityCalendarHeatmap } from "./ActivityCalendarHeatmap";
import { PeakHoursHeatmap } from "./PeakHoursHeatmap";
import { CustomerNotesTab } from "./CustomerNotesTab";
import { PaymentsTab } from "./PaymentsTab";
import { PackagesTab } from "./PackagesTab";
import { SmsTab } from "./SmsTab";
import { TicketsTab } from "./TicketsTab";
import { RenewSubscriptionSheet } from "../../_components/RenewSubscriptionSheet";
import { ChangePasswordSheet } from "../../_components/ChangePasswordSheet";

interface CustomerCockpitProps {
  customer: Customer;
}

export function CustomerCockpit({ customer }: CustomerCockpitProps) {
  const router = useRouter();
  const customerId = customer.userIdxno;

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

      <Tabs defaultValue="overview">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <CustomerProfileHeader customer={customer} />
          <CustomerLifecycleBanner customer={customer} />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <CustomerInfoGrid customer={customer} />
            <CustomerSubscriptionPanel customer={customer} />
          </div>
          <RenewSubscriptionSheet customers={[customer]} />
          <ChangePasswordSheet customers={[customer]} />
        </TabsContent>

        <TabsContent value="sessions" className="mt-6">
          <LiveSpeedGauges customerId={customerId} />
          <CustomerDeviceCheckCard customerId={customerId} />
        </TabsContent>

        <TabsContent value="reports" className="mt-6 space-y-6">
          <ActivityCalendarHeatmap customerId={customerId} />
          <PeakHoursHeatmap customerId={customerId} />
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <PaymentsTab customerId={customerId} />
        </TabsContent>

        <TabsContent value="packages" className="mt-6">
          <PackagesTab customerId={customerId} />
        </TabsContent>

        <TabsContent value="tickets" className="mt-6">
          <TicketsTab customerId={customerId} />
        </TabsContent>

        <TabsContent value="sms" className="mt-6">
          <SmsTab customerId={customerId} />
        </TabsContent>

        <TabsContent value="notes" className="mt-6">
          <CustomerNotesTab customerId={customerId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}