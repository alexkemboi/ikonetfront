import React from "react";
import { FormikProps } from "formik";
import * as Yup from "yup";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AddCustomerPayload } from "@/lib/types/customer";

interface AccountDetailsStepProps {
  formik: FormikProps<AddCustomerPayload>;
}

const AccountDetailsStep: React.FC<AccountDetailsStepProps> = ({ formik }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={formik.values.isActive}
          onCheckedChange={(checked) => formik.setFieldValue("isActive", checked)}
        />
        <Label htmlFor="isActive">Is Active</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="canLogin"
          checked={formik.values.canLogin}
          onCheckedChange={(checked) => formik.setFieldValue("canLogin", checked)}
        />
        <Label htmlFor="canLogin">Can Login</Label>
      </div>

      <div>
        <Label htmlFor="acno">Account Number (ACNO)</Label>
        <Input
          id="acno"
          type="text"
          {...formik.getFieldProps("acno")}
          className={formik.touched.acno && formik.errors.acno ? "border-red-500" : ""}
        />
        {formik.touched.acno && formik.errors.acno ? (
          <div className="text-red-500 text-sm">{formik.errors.acno}</div>
        ) : null}
      </div>

      <div>
        <Label htmlFor="packageName">Package Name</Label>
        <Input
          id="packageName"
          type="text"
          {...formik.getFieldProps("packageName")}
          className={formik.touched.packageName && formik.errors.packageName ? "border-red-500" : ""}
        />
        {formik.touched.packageName && formik.errors.packageName ? (
          <div className="text-red-500 text-sm">{formik.errors.packageName}</div>
        ) : null}
      </div>

      <div>
        <Label htmlFor="custtype">Customer Type</Label>
        <Input
          id="custtype"
          type="text"
          {...formik.getFieldProps("custtype")}
          className={formik.touched.custtype && formik.errors.custtype ? "border-red-500" : ""}
        />
        {formik.touched.custtype && formik.errors.custtype ? (
          <div className="text-red-500 text-sm">{formik.errors.custtype}</div>
        ) : null}
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isSubActive"
          checked={formik.values.isSubActive}
          onCheckedChange={(checked) => formik.setFieldValue("isSubActive", checked)}
        />
        <Label htmlFor="isSubActive">Is Subscription Active</Label>
      </div>
    </div>
  );
};

export default AccountDetailsStep;
