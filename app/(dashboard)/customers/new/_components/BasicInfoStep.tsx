import React from "react";
import { FormikProps } from "formik";
import * as Yup from "yup";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddCustomerPayload } from "@/lib/types/customer";

interface BasicInfoStepProps {
  formik: FormikProps<AddCustomerPayload>;
}

const BasicInfoStep = ({ formik }:{
  formik: FormikProps<AddCustomerPayload>;
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
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

      <div className="flex flex-col gap-2">
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

      <div className="flex flex-col gap-2">
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

      <div className="flex flex-col gap-2">
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

      <div className="flex flex-col gap-2">
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

      <div className="flex flex-col gap-2">
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
    </div>
  );
};

export default BasicInfoStep;
