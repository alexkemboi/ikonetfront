"use client";

import { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { createRegion } from "@/actions/network";
import { RegionResponse } from "@/lib/types/network";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import * as Yup from "yup";

interface RegionFormProps {
  onSuccess: (newRegion: RegionResponse) => void;
}

const RegionValidationSchema = Yup.object().shape({
  regionCode: Yup.string()
    .trim()
    .required("Region code is required")
    .max(50, "Max 50 characters"),
  name: Yup.string()
    .trim()
    .required("Region name is required")
    .max(150, "Max 150 characters"),
  description: Yup.string()
    .max(255, "Max 255 characters")
    .nullable(),
});

export function RegionForm({ onSuccess }: RegionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Formik
      initialValues={{ regionCode: "", name: "", description: "" }}
      validationSchema={RegionValidationSchema}
      onSubmit={async (values, { resetForm }) => {
        setIsSubmitting(true);
        try {
          const res = await createRegion(values);
          if (res.success && res.data) {
            toast.success("Region created successfully");
            onSuccess(res.data);
            resetForm();
          } else {
            toast.error(res.message || "Failed to create region");
          }
        } catch {
          toast.error("An unexpected network error occurred.");
        } finally {
          setIsSubmitting(false);
        }
      }}
    >
      {({ errors, touched }) => (
        <Form className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="regionCode">Region Code</Label>
            <Field
              as={Input}
              id="regionCode"
              name="regionCode"
              placeholder="e.g., NAIROBI_CBD"
              aria-invalid={errors.regionCode && touched.regionCode ? "true" : undefined}
            />
            <ErrorMessage name="regionCode" component="div" className="text-xs text-destructive" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Region Name</Label>
            <Field
              as={Input}
              id="name"
              name="name"
              placeholder="e.g., Nairobi Central Business District"
              aria-invalid={errors.name && touched.name ? "true" : undefined}
            />
            <ErrorMessage name="name" component="div" className="text-xs text-destructive" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Field
              as={Input}
              id="description"
              name="description"
              placeholder="Optional geographic description..."
              aria-invalid={errors.description && touched.description ? "true" : undefined}
            />
            <ErrorMessage name="description" component="div" className="text-xs text-destructive" />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Creating..." : "Save Region"}
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
}