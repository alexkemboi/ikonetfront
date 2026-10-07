import React from "react";
import { FormikProps } from "formik";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AddCustomerPayload } from "@/lib/types/customer";
import type { ServingRouterOption } from "./MultiStepCustomerForm";

interface AccountDetailsStepProps {
 formik: FormikProps<AddCustomerPayload>;
 routers: ServingRouterOption[];
}

const AccountDetailsStep: React.FC<AccountDetailsStepProps> = ({ formik, routers }) => {
 return (
 <div className="space-y-4">
 <div className="flex items-center space-x-2 space-y-2">
 <Switch
 id="isActive"
 checked={formik.values.isActive}
 onCheckedChange={(checked) => formik.setFieldValue("isActive", checked)}
 />
 <Label htmlFor="isActive">Account active</Label>
 </div>

 <div className="flex items-center space-x-2 space-y-2">
 <Switch
 id="canLogin"
 checked={formik.values.canLogin}
 onCheckedChange={(checked) => formik.setFieldValue("canLogin", checked)}
 />
 <Label htmlFor="canLogin">Can sign in to the customer portal</Label>
 </div>

 <div className="space-y-2">
 <Label htmlFor="acno">House Number</Label>
 <Input
 id="acno"
 type="text"
 placeholder="e.g. Westland 12"
 {...formik.getFieldProps("acno")}
 className={formik.touched.acno && formik.errors.acno ? "border-red-500" : ""}
 />
 {formik.touched.acno && formik.errors.acno ? (
 <div className="text-red-500 text-sm">{formik.errors.acno}</div>
 ) : null}
 </div>

 <div className="space-y-2">
 <Label htmlFor="networkDeviceId">Serving router</Label>
 <select
 id="networkDeviceId"
 value={formik.values.networkDeviceId || ""}
 onChange={(e) => formik.setFieldValue("networkDeviceId", Number(e.target.value) || 0)}
 onBlur={() => formik.setFieldTouched("networkDeviceId", true)}
 className={
 "flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring " +
 (formik.touched.networkDeviceId && formik.errors.networkDeviceId ? "border-destructive" : "border-input")
 }
 >
 <option value="">Select the MikroTik router…</option>
 {routers.map((r) => (
 <option key={r.id} value={r.id}>
 {r.name}{r.location ? ` · ${r.location}` : ""}
 </option>
 ))}
 </select>
 {formik.touched.networkDeviceId && formik.errors.networkDeviceId ? (
 <p className="text-xs text-destructive">{formik.errors.networkDeviceId}</p>
 ) : routers.length === 0 ? (
 <p className="text-xs text-destructive">This company has no active MikroTik router. Link one before adding PPPoE customers.</p>
 ) : (
 <p className="text-xs text-muted-foreground">The router this customer connects through. Payments reconnect them on it.</p>
 )}
 </div>
 </div>
 );
};

export default AccountDetailsStep;
