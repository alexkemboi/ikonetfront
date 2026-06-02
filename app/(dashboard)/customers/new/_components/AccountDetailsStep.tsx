import React from "react";
import { FormikProps } from "formik";
import * as Yup from "yup";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AddCustomerPayload } from "@/lib/types/customer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InternetPackage } from "@/actions/packages";

interface AccountDetailsStepProps {
  formik: FormikProps<AddCustomerPayload>;
  packages: InternetPackage[];
}

const AccountDetailsStep: React.FC<AccountDetailsStepProps> = ({ formik, packages }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 space-y-2">
        <Switch
          id="isActive"
          checked={formik.values.isActive}
          onCheckedChange={(checked) => formik.setFieldValue("isActive", checked)}
        />
        <Label htmlFor="isActive">Is Active</Label>
      </div>

      <div className="flex items-center space-x-2 space-y-2">
        <Switch
          id="canLogin"
          checked={formik.values.canLogin}
          onCheckedChange={(checked) => formik.setFieldValue("canLogin", checked)}
        />
        <Label htmlFor="canLogin">Can Login</Label>
      </div>

      <div className="space-y-2">
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

      <div className="space-y-2">
        <Label htmlFor="packageName">Package Name</Label>
        <Select
          value={formik.values.packageName}
          onValueChange={(value) => formik.setFieldValue("packageName", value)}
        >
          <SelectTrigger
            id="packageName"
            className={
              formik.touched.packageName && formik.errors.packageName
                ? "border-destructive"
                : ""
            }
          >
            <SelectValue placeholder="Select package" />
          </SelectTrigger>
          <SelectContent className="max-h-60 overflow-auto">
            {packages?.map((pkg) => {
              return <SelectItem key={pkg.idxno} value={pkg.packageName}>{pkg.packageName}</SelectItem>
            })}
          </SelectContent>
        </Select>
        {formik.touched.packageName && formik.errors.packageName && (
          <p className="text-xs text-destructive">{formik.errors.packageName}</p>
        )}
        {formik.touched.packageName && formik.errors.packageName ? (
          <div className="text-red-500 text-sm">{formik.errors.packageName}</div>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="custtype">Customer Type</Label>
        <Input
          id="custtype"
          type="text"
          disabled
          {...formik.getFieldProps("custtype")}
          className={formik.touched.custtype && formik.errors.custtype ? "border-red-500" : "text-gray-900"}
        />
        {formik.touched.custtype && formik.errors.custtype ? (
          <div className="text-red-500 text-sm">{formik.errors.custtype}</div>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="isSubActive">Is Subscription Active</Label>
        <Switch
          id="isSubActive"
          checked={formik.values.isSubActive}
          onCheckedChange={(checked) => formik.setFieldValue("isSubActive", checked)}
        />
      </div>
    </div>
  );
};

export default AccountDetailsStep;
