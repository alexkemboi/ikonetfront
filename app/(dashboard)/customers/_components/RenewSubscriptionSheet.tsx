"use client";

import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "sonner";
import { renewCustomerSubscription } from "@/actions/customer";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { closeRenewSheet } from "@/store/slices/customerslice";
import { Customer } from "@/lib/types/customer";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RenewSubscriptionSheetProps {
  customers: Customer[];
}

const renewValidationSchema = Yup.object({
  duration: Yup.number()
    .required("Duration is required")
    .min(1, "Duration must be at least 1")
    .integer("Duration must be a whole number"),
  unit: Yup.string()
    .required("Unit is required")
    .oneOf(["days", "weeks", "months"], "Select a valid unit"),
});

export function RenewSubscriptionSheet({ customers }: RenewSubscriptionSheetProps) {
  const dispatch = useAppDispatch();
  const renewSheetCustomerId = useAppSelector(
    (state) => state.customer.renewSheetCustomerId
  );

  const activeCustomer = customers.find(
    (c) => c.userIdxno === renewSheetCustomerId
  );

  const formik = useFormik({
    initialValues: { duration: 30, unit: "days" },
    validationSchema: renewValidationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      if (!renewSheetCustomerId) return;
      try {
        const result = await renewCustomerSubscription(
          renewSheetCustomerId,
          values.duration,
          values.unit
        );
        if (result.success) {
          toast.success("Subscription renewed successfully!");
          dispatch(closeRenewSheet());
          resetForm();
        } else {
          toast.error(result.message || "Failed to renew subscription.");
        }
      } catch {
        toast.error("An unexpected error occurred.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  function handleSheetOpenChange(open: boolean) {
    if (!open) {
      dispatch(closeRenewSheet());
      formik.resetForm();
    }
  }

  return (
    <Sheet
      open={renewSheetCustomerId !== null}
      onOpenChange={handleSheetOpenChange}
    >
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader className="mb-6">
          <SheetTitle>Renew Subscription</SheetTitle>
          <SheetDescription>
            {activeCustomer
              ? `Renewing subscription for ${activeCustomer.fullName}`
              : "Renewing subscription"}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={formik.handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="duration">Duration</Label>
            <Input
              id="duration"
              type="number"
              min={1}
              {...formik.getFieldProps("duration")}
              className={
                formik.touched.duration && formik.errors.duration
                  ? "border-destructive"
                  : ""
              }
            />
            {formik.touched.duration && formik.errors.duration && (
              <p className="text-xs text-destructive">{formik.errors.duration}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit">Unit</Label>
            <Select
              value={formik.values.unit}
              onValueChange={(value) => formik.setFieldValue("unit", value)}
            >
              <SelectTrigger
                id="unit"
                className={
                  formik.touched.unit && formik.errors.unit
                    ? "border-destructive"
                    : ""
                }
              >
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="days">Days</SelectItem>
                <SelectItem value="weeks">Weeks</SelectItem>
                <SelectItem value="months">Months</SelectItem>
              </SelectContent>
            </Select>
            {formik.touched.unit && formik.errors.unit && (
              <p className="text-xs text-destructive">{formik.errors.unit}</p>
            )}
          </div>

          <SheetFooter className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSheetOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={formik.isSubmitting}>
              {formik.isSubmitting ? "Renewing..." : "Renew Subscription"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
