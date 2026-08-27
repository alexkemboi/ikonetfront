"use client";

import { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createLocation } from "@/actions/network";
import { RegionResponse, LocationResponse } from "@/lib/types/network";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface LocationFormProps {
 regions: RegionResponse[];
 onSuccess: (newLocation: LocationResponse) => void;
}

const LocationValidationSchema = Yup.object().shape({
 regionIdxno: Yup.number()
 .required("Region selection is required")
 .min(1, "Select a valid region"),
 name: Yup.string()
 .trim()
 .required("Location name is required")
 .max(150, "Max 150 characters"),
 latitude: Yup.number()
 .min(-90, "Min -90")
 .max(90, "Max 90")
 .nullable()
 .transform((v, o) => (o === "" ? null : v)),
 longitude: Yup.number()
 .min(-180, "Min -180")
 .max(180, "Max 180")
 .nullable()
 .transform((v, o) => (o === "" ? null : v)),
});

export function LocationForm({ regions, onSuccess }: LocationFormProps) {
 const [isSubmitting, setIsSubmitting] = useState(false);

 const hasRegions = regions.length > 0;

 return (
 <Formik
 initialValues={{ regionIdxno: "", name: "", latitude: "", longitude: "" }}
 validationSchema={LocationValidationSchema}
 onSubmit={async (values, { resetForm }) => {
 setIsSubmitting(true);
 try {
 const res = await createLocation({
 regionIdxno: Number(values.regionIdxno),
 name: values.name,
 latitude: values.latitude ? parseFloat(values.latitude) : undefined,
 longitude: values.longitude ? parseFloat(values.longitude) : undefined,
 });

 if (res.success && res.data) {
 toast.success(res.message || "Location created successfully");
 onSuccess(res.data);
 resetForm();
 } else {
 toast.error(res.message || "Failed to create location");
 }
 } catch {
 toast.error("Network error occurred while creating the location.");
 } finally {
 setIsSubmitting(false);
 }
 }}
 >
 {({ errors, touched }) => (
 <Form className="space-y-4 pt-4">
 <div className="space-y-2">
 <Label htmlFor="regionIdxno">Parent Region</Label>
 <Field
 as="select"
 id="regionIdxno"
 name="regionIdxno"
 disabled={!hasRegions}
 className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
 >
 <option value="">
 {hasRegions ? "Select Region..." : "No regions available — create one first"}
 </option>
 {regions.map((region) => (
 <option key={region.idxno} value={region.idxno}>
 {region.name} ({region.regionCode})
 </option>
 ))}
 </Field>
 <ErrorMessage name="regionIdxno" component="div" className="text-xs text-destructive" />
 {!hasRegions && (
 <p className="text-xs text-amber-500">
 You need to create a region before adding locations.
 </p>
 )}
 </div>

 <div className="space-y-2">
 <Label htmlFor="name">Location Name</Label>
 <Field as={Input} id="name" name="name" placeholder="e.g., Ruiru Town" />
 <ErrorMessage name="name" component="div" className="text-xs text-destructive" />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="latitude">Latitude</Label>
 <Field as={Input} id="latitude" name="latitude" type="number" step="any" placeholder="-1.149" />
 <ErrorMessage name="latitude" component="div" className="text-xs text-destructive" />
 </div>
 <div className="space-y-2">
 <Label htmlFor="longitude">Longitude</Label>
 <Field as={Input} id="longitude" name="longitude" type="number" step="any" placeholder="36.961" />
 <ErrorMessage name="longitude" component="div" className="text-xs text-destructive" />
 </div>
 </div>

 <Button type="submit" disabled={isSubmitting || !hasRegions} className="w-full">
 {isSubmitting ? "Creating..." : "Save Location"}
 </Button>
 </Form>
 )}
 </Formik>
 );
}