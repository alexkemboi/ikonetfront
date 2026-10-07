"use client";

import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { addCustomer } from "@/actions/customer";
import { AddCustomerPayload } from "@/lib/types/customer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BasicInfoStep from "./BasicInfoStep";
import AccountDetailsStep from "./AccountDetailsStep";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const STEP_LABELS = ["Basic Info", "Account"];

// Package and service period are not chosen here: service starts when a package
// is assigned from the PPPoE Clients list, and each payment renews it.
const validationSchema = Yup.object({
 username: Yup.string()
 .trim()
 .min(3, "Minimum 3 characters")
 .max(50, "Maximum 50 characters")
 .matches(/^[A-Za-z0-9._@-]+$/, "Letters, numbers and . _ @ - only (no spaces)")
 .required("Username is required"),
 password: Yup.string()
 .min(6, "Password must be at least 6 characters")
 .required("Password is required"),
 firstname: Yup.string().trim().required("First name is required"),
 lname: Yup.string().trim().required("Last name is required"),
 email: Yup.string().trim().email("Invalid email address").optional(),
 phoneNumber: Yup.string()
 .trim()
 .matches(/^\+?[0-9]{7,15}$/, "Digits only, e.g. 0712345678 or +254712345678")
 .required("Phone number is required"),
 isActive: Yup.boolean().required(),
 canLogin: Yup.boolean().required(),
 acno: Yup.string().trim().max(100, "Maximum 100 characters").required("House number is required"),
 networkDeviceId: Yup.number().moreThan(0, "Choose the router that serves this customer").required(),
});

const stepFieldGroups: Record<number, (keyof AddCustomerPayload)[]> = {
 0: ["username", "password", "firstname", "lname", "email", "phoneNumber"],
 1: ["isActive", "canLogin", "acno", "networkDeviceId"],
};

const slideVariants = {
 enter: (direction: "forward" | "backward") => ({
 x: direction === "forward" ? 48 : -48,
 opacity: 0,
 }),
 center: { x: 0, opacity: 1 },
 exit: (direction: "forward" | "backward") => ({
 x: direction === "forward" ? -48 : 48,
 opacity: 0,
 }),
};

export type ServingRouterOption = { id: number; name: string; location: string };

export default function MultiStepCustomerForm({ routers }: { routers: ServingRouterOption[] }) {
 const [currentStep, setCurrentStep] = useState(0);
 const [direction, setDirection] = useState<"forward" | "backward">("forward");

 const router = useRouter();

 const formik = useFormik<AddCustomerPayload>({
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
 networkDeviceId: 0,
 },
 validationSchema,
 onSubmit: async (values, { setSubmitting, resetForm }) => {
 try {
 const result = await addCustomer({
 ...values,
 username: values.username.trim(),
 firstname: values.firstname.trim(),
 lname: values.lname.trim(),
 phoneNumber: values.phoneNumber.trim(),
 acno: values.acno.trim(),
 // Email is optional and unique: leave it out rather than send an empty value.
 email: values.email?.trim() || undefined,
 });
 if (result.success) {
 toast.success("Customer created", {
 description: "Assign a package from PPPoE Clients to start their service.",
 });
 resetForm();
 setCurrentStep(0);
 router.push("/portal/pppoe");
 } else {
 toast.error(result.message || "Failed to create customer.");
 }
 } catch {
 toast.error("An unexpected error occurred.");
 } finally {
 setSubmitting(false);
 }
 },
 });

 async function handleNextStep() {
 const currentStepSchema = Yup.object(
 Object.fromEntries(
 Object.entries(validationSchema.fields).filter(([key]) =>
 stepFieldGroups[currentStep].includes(key as keyof AddCustomerPayload)
 )
 )
 );

 try {
 await currentStepSchema.validate(formik.values, { abortEarly: false });
 setDirection("forward");
 setCurrentStep((prev) => prev + 1);
 } catch (err: unknown) {
 if (err instanceof Yup.ValidationError) {
 err.inner.forEach((error) => {
 formik.setFieldError(error.path ?? "", error.message);
 formik.setFieldTouched(error.path ?? "", true, false);
 });
 }
 toast.error("Please fix the errors before continuing.");
 }
 }

 function handlePreviousStep() {
 setDirection("backward");
 setCurrentStep((prev) => prev - 1);
 }

 const steps = [
 <BasicInfoStep key="basic" formik={formik} />,
 <AccountDetailsStep key="account" formik={formik} routers={routers} />,
 ];

 return (
 <Card className="w-full max-w-6xl mx-auto">
 <CardHeader className="pb-6">
 <CardTitle className="text-xl font-bold">Create New Customer</CardTitle>

 {/* Stepper */}
 <div className="flex items-center mt-4">
 {STEP_LABELS.map((label, index) => {
 const isCompleted = index < currentStep;
 const isCurrent = index === currentStep;
 const isLast = index === STEP_LABELS.length - 1;

 return (
 <div key={label} className="flex items-center flex-1 min-w-0">
 <div className="flex flex-col items-center shrink-0">
 <div
 className={cn(
 "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-200",
 isCompleted &&
 "bg-success border-success text-foreground",
 isCurrent &&
 "bg-primary border-primary text-primary-foreground",
 !isCompleted &&
 !isCurrent &&
 "bg-muted border-border text-muted-foreground"
 )}
 >
 {isCompleted ? (
 <Check className="h-4 w-4" strokeWidth={2.5} />
 ) : (
 index + 1
 )}
 </div>
 <span
 className={cn(
 "text-xs mt-1 font-medium",
 isCurrent ? "text-primary" : "text-muted-foreground"
 )}
 >
 {label}
 </span>
 </div>
 {!isLast && (
 <div
 className={cn(
 "h-0.5 flex-1 mx-2 mb-4 transition-all duration-200",
 isCompleted ? "bg-success" : "bg-border"
 )}
 />
 )}
 </div>
 );
 })}
 </div>
 </CardHeader>

 <CardContent>
 <form onSubmit={formik.handleSubmit}>
 <div className="overflow-hidden min-h-75">
 <AnimatePresence mode="wait" custom={direction}>
 <motion.div
 key={currentStep}
 custom={direction}
 variants={slideVariants}
 initial="enter"
 animate="center"
 exit="exit"
 transition={{ duration: 0.25, ease: "easeInOut" }}
 >
 {steps[currentStep]}
 </motion.div>
 </AnimatePresence>
 </div>

 <div className="flex justify-between mt-8">
 <Button
 type="button"
 variant="outline"
 onClick={handlePreviousStep}
 disabled={currentStep === 0}
 >
 Previous
 </Button>

 <div className="flex gap-2">
 {currentStep < steps.length - 1 ? (
 <Button type="button" onClick={handleNextStep}>
 Next
 </Button>
 ) : null}

 {currentStep === steps.length - 1 ? (
 <Button type="submit" disabled={formik.isSubmitting}>
 {formik.isSubmitting ? "Submitting..." : "Submit"}
 </Button>
 ) : null}
 
 </div>
 </div>
 </form>
 </CardContent>
 </Card>
 );
}
 