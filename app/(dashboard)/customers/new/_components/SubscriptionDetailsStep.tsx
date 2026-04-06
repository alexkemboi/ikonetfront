import React from "react";
import { FormikProps } from "formik";
import * as Yup from "yup";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddCustomerPayload } from "@/lib/types/customer";

interface SubscriptionDetailsStepProps {
  formik: FormikProps<AddCustomerPayload>;
}

const SubscriptionDetailsStep: React.FC<SubscriptionDetailsStepProps> = ({ formik }) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="duration">Duration</Label>
        <Input
          id="duration"
          type="number"
          {...formik.getFieldProps("duration")}
          className={formik.touched.duration && formik.errors.duration ? "border-red-500" : ""}
        />
        {formik.touched.duration && formik.errors.duration ? (
          <div className="text-red-500 text-sm">{formik.errors.duration}</div>
        ) : null}
      </div>

      <div>
        <Label htmlFor="unit">Unit</Label>
        <Input
          id="unit"
          type="text"
          {...formik.getFieldProps("unit")}
          className={formik.touched.unit && formik.errors.unit ? "border-red-500" : ""}
        />
        {formik.touched.unit && formik.errors.unit ? (
          <div className="text-red-500 text-sm">{formik.errors.unit}</div>
        ) : null}
      </div>
    </div>
  );
};

export default SubscriptionDetailsStep;
