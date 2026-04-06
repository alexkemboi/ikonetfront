"use client";

import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { addCustomer } from "@/actions/customer";
import BasicInfoStep from "./BasicInfoStep";
import AccountDetailsStep from "./AccountDetailsStep";
import SubscriptionDetailsStep from "./SubscriptionDetailsStep";
import { Progress } from "@/components/ui/progress"; // Assuming a progress component exists
import { AddCustomerPayload } from "@/lib/types/customer";

const validationSchema = Yup.object({
  username: Yup.string().required("Username is required"),
  password: Yup.string().min(6, "Password must be at least 6 characters").optional(),
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

const MultiStepCustomerForm = () => {
  const [currentStep, setCurrentStep] = useState(0);

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
    } as AddCustomerPayload,
    validationSchema: validationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        const result = await addCustomer(values);
        if (result.success) {
          toast.success("Customer created successfully!");
          resetForm();
          setCurrentStep(0); // Reset to first step after successful submission
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

  const steps = [
    <BasicInfoStep key="basic" formik={formik} />,
    <AccountDetailsStep key="account" formik={formik} />,
    <SubscriptionDetailsStep key="subscription" formik={formik} />,
  ];

  const stepFields = [
    ["username", "password", "firstname", "lname", "email", "phoneNumber"],
    ["isActive", "canLogin", "acno", "packageName", "custtype", "isSubActive"],
    ["duration", "unit"],
  ];

  const handleNext = async () => {
    const currentStepSchema = Yup.object(
      Object.fromEntries(
        Object.entries(validationSchema.fields).filter(([key]) =>
          stepFields[currentStep].includes(key)
        )
      )
    );

    try {
      await currentStepSchema.validate(formik.values, { abortEarly: false });
      if (currentStep < steps.length - 1) {
        setCurrentStep((prev) => prev + 1);
      }
    } catch (validationErrors: any) {
      validationErrors.inner.forEach((error: any) => {
        formik.setFieldError(error.path, error.message);
        formik.setFieldTouched(error.path, true, false);
      });
      toast.error("Please correct the errors in the current step.");
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <Card className="w-full max-w-6xl mx-auto"> {/* Increased max-w-md to max-w-3xl */}
      <CardHeader>
        <CardTitle>Create New Customer - Step {currentStep + 1} of {steps.length}</CardTitle>
        <Progress value={progress} className="w-full mt-4" />
      </CardHeader>
      <CardContent>
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          {steps[currentStep]}

          <div className="flex justify-between mt-6">
            {currentStep > 0 && (
              <Button type="button" variant="outline" onClick={handlePrevious}>
                Previous
              </Button>
            )}
            {currentStep < steps.length - 1 && (
              <Button type="button" onClick={handleNext}>
                Next
              </Button>
            )}
            {currentStep === steps.length - 1 && (
              <Button type="submit" disabled={formik.isSubmitting}>
                {formik.isSubmitting ? "Submitting..." : "Create Customer"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default MultiStepCustomerForm;
