"use client";

import { useFormik } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addCustomer } from "@/actions/customer";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch"; // Import Switch component

const CustomerForm = () => {
  const validationSchema = Yup.object({
    username: Yup.string().required("Username is required"),
    password: Yup.string().min(6, "Password must be at least 6 characters"),
    firstname: Yup.string().required("First Name is required"),
    lname: Yup.string().required("Last Name is required"),
    email: Yup.string().email("Invalid email address").required("Email is required"),
    phoneNumber: Yup.string().required("Phone Number is required"),
    isActive: Yup.boolean().required("Active status is required"),
    canLogin: Yup.boolean().required("Login status is required"),
    acno: Yup.string(),
    packageName: Yup.string(),
    custtype: Yup.string(),
    isSubActive: Yup.boolean(),
    duration: Yup.number().min(0, "Duration cannot be negative"),
    unit: Yup.string(),
  });

  const formik = useFormik({
    initialValues: {
      username: "",
      password: "",
      firstname: "",
      lname: "",
      email: "",
      phoneNumber: "",
      isActive: true,
      canLogin: true,
      acno: "",
      packageName: "",
      custtype: "",
      isSubActive: true,
      duration: 0,
      unit: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        

        const result = await addCustomer(values);
        if (result.success) {
          toast.success("Customer created successfully!");
          resetForm();
        } else {
          toast.error(result.message || "Failed to create customer.");
        }
      } catch (error: any) {
        toast.error(error.message || "An unexpected error occurred.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Customer Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              {...formik.getFieldProps("username")}
              className={formik.touched.username && formik.errors.username ? "border-red-500" : ""}
            />
            {formik.touched.username && formik.errors.username ? (
              <div className="text-red-500 text-sm">{formik.errors.username}</div>
            ) : null}
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              {...formik.getFieldProps("password")}
              className={formik.touched.password && formik.errors.password ? "border-red-500" : ""}
            />
            {formik.touched.password && formik.errors.password ? (
              <div className="text-red-500 text-sm">{formik.errors.password}</div>
            ) : null}
          </div>

          <div>
            <Label htmlFor="firstname">First Name</Label>
            <Input
              id="firstname"
              type="text"
              {...formik.getFieldProps("firstname")}
              className={formik.touched.firstname && formik.errors.firstname ? "border-red-500" : ""}
            />
            {formik.touched.firstname && formik.errors.firstname ? (
              <div className="text-red-500 text-sm">{formik.errors.firstname}</div>
            ) : null}
          </div>

          <div>
            <Label htmlFor="lname">Last Name</Label>
            <Input
              id="lname"
              type="text"
              {...formik.getFieldProps("lname")}
              className={formik.touched.lname && formik.errors.lname ? "border-red-500" : ""}
            />
            {formik.touched.lname && formik.errors.lname ? (
              <div className="text-red-500 text-sm">{formik.errors.lname}</div>
            ) : null}
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...formik.getFieldProps("email")}
              className={formik.touched.email && formik.errors.email ? "border-red-500" : ""}
            />
            {formik.touched.email && formik.errors.email ? (
              <div className="text-red-500 text-sm">{formik.errors.email}</div>
            ) : null}
          </div>

          <div>
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              type="text"
              {...formik.getFieldProps("phoneNumber")}
              className={formik.touched.phoneNumber && formik.errors.phoneNumber ? "border-red-500" : ""}
            />
            {formik.touched.phoneNumber && formik.errors.phoneNumber ? (
              <div className="text-red-500 text-sm">{formik.errors.phoneNumber}</div>
            ) : null}
          </div>

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

          <Button type="submit" className="w-full" disabled={formik.isSubmitting}>
            {formik.isSubmitting ? "Creating..." : "Create Customer"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CustomerForm;
