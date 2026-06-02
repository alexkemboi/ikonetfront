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
import SubscriptionDetailsStep from "./SubscriptionDetailsStep";
import { cn } from "@/lib/utils";
import { InternetPackage } from "@/actions/packages";
import { useRouter } from "next/navigation";

const STEP_LABELS = ["Basic Info", "Account", "Subscription"];

const validationSchema = Yup.object({
  username: Yup.string().required("Username is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .optional(),
  firstname: Yup.string().required("First name is required"),
  lname: Yup.string().required("Last name is required"),
  email: Yup.string().email("Invalid email address").required("Email is required"),
  phoneNumber: Yup.string().required("Phone number is required"),
  isActive: Yup.boolean().required(),
  canLogin: Yup.boolean().required(),
  acno: Yup.string(),
  packageName: Yup.string(),
  custtype: Yup.string(),
  isSubActive: Yup.boolean(),
  duration: Yup.number().min(0, "Duration cannot be negative"),
  unit: Yup.string(),
});

const stepFieldGroups: Record<number, (keyof AddCustomerPayload)[]> = {
  0: ["username", "password", "firstname", "lname", "email", "phoneNumber"],
  1: ["isActive", "canLogin", "acno", "packageName", "custtype", "isSubActive"],
  2: ["duration", "unit"],
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

export default function MultiStepCustomerForm({ packages }: { packages: InternetPackage[] }) {
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
      packageName: "",
      custtype: "pppoe",
      isSubActive: true,
      duration: 30,
      unit: "days",
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        const result = await addCustomer(values);
        if (result.success) {
          toast.success("Customer created successfully!");
          resetForm();
          setCurrentStep(0);
          router.push("/customers/all");
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
    <AccountDetailsStep key="account" formik={formik} packages={packages} />,
    <SubscriptionDetailsStep key="subscription" formik={formik} />,
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
                        "bg-success border-success text-white",
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

            {currentStep < steps.length - 1 ? (
              <Button type="button" onClick={handleNextStep}>
                Next
              </Button>
            ) : (
              <Button type="submit" disabled={formik.isSubmitting}>
                {formik.isSubmitting ? "Creating..." : "Create Customer"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
