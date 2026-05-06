"use client";

import { motion } from "framer-motion";
import { RefreshCw, KeyRound } from "lucide-react";
import { Customer } from "@/lib/types/customer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  formatCustomerDate,
  resolveExpiryDateColorClass,
} from "@/lib/utils/customerFormatters";
import { useAppDispatch } from "@/store/hooks";
import { openRenewSheet, openPasswordSheet } from "@/store/slices/customerslice";
import { cn } from "@/lib/utils";

interface CustomerSubscriptionPanelProps {
  customer: Customer;
}

function SubscriptionField({
  label,
  value,
  valueClassName,
  mono = false,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className={cn("text-sm font-semibold", mono && "font-mono", valueClassName)}>
        {value}
      </p>
    </div>
  );
}

export function CustomerSubscriptionPanel({
  customer,
}: CustomerSubscriptionPanelProps) {
  const dispatch = useAppDispatch();
  const isPPPoE = customer.custtype === "pppoe";

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
    >
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Subscription</CardTitle>
          {customer.isSubActive !== null && (
            <Badge
              className={customer.isSubActive ? "bg-[var(--success)] text-white" : ""}
              variant={customer.isSubActive ? "default" : "destructive"}
            >
              {customer.isSubActive ? "Active" : "Inactive"}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <SubscriptionField
              label="Package"
              value={customer.packageName ?? "N/A"}
            />
            <SubscriptionField
              label="Subscriber ID"
              value={customer.subscriberIdxno?.toString() ?? "N/A"}
              mono
            />
            <SubscriptionField
              label="Start Date"
              value={formatCustomerDate(customer.startDate)}
            />
            <SubscriptionField
              label="Expiry Date"
              value={formatCustomerDate(customer.expiryDate)}
              valueClassName={resolveExpiryDateColorClass(customer.expiryDate)}
            />
            <SubscriptionField
              label="Last Active"
              value={formatCustomerDate(customer.lastActiveDate)}
            />
          </div>

          {isPPPoE && (
            <>
              <Separator />
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  className="flex-1"
                  onClick={() => dispatch(openRenewSheet(customer.userIdxno))}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Renew Subscription
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => dispatch(openPasswordSheet(customer.userIdxno))}
                >
                  <KeyRound className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
