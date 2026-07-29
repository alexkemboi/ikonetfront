"use client";

import { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createStation } from "@/actions/network";
import { RegionResponse, StationResponse, LocationResponse } from "@/lib/types/network";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface StationFormProps {
  regions: RegionResponse[];
  onSuccess: (newStation: StationResponse) => void;
}

const StationValidationSchema = Yup.object().shape({
  regionIdxno: Yup.number()
    .required("Region selection is required")
    .min(1, "Select a valid region"),
  locationIdxno: Yup.number()
    .required("Location selection is required")
    .min(1, "Select a valid location"),
  name: Yup.string()
    .trim()
    .required("Station name is required")
    .max(150, "Max 150 characters"),
  powerType: Yup.string().required("Power type is required"),
  backhaulType: Yup.string().required("Backhaul type is required"),
});

export function StationForm({ regions, onSuccess }: StationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState<LocationResponse[]>([]);
  const [availableRegions, setAvailableRegions] = useState<RegionResponse[]>(() =>
    regions.filter((r) => (r.locations && r.locations.length > 0) || true)
  );

  const hasRegions = regions.length > 0;

  const handleRegionChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    setFieldValue: (field: string, value: unknown) => void
  ) => {
    const val = e.target.value;
    setFieldValue("regionIdxno", val);
    setFieldValue("locationIdxno", "");
    if (val) {
      const selectedRegion = regions.find((r) => r.idxno === Number(val));
      const locs = selectedRegion?.locations || [];
      setFilteredLocations(locs);
    } else {
      setFilteredLocations([]);
    }
  };

  return (
    <Formik
      initialValues={{
        regionIdxno: "",
        locationIdxno: "",
        name: "",
        powerType: "GRID",
        backhaulType: "FIBER",
      }}
      validationSchema={StationValidationSchema}
      onSubmit={async (values, { resetForm }) => {
        setIsSubmitting(true);
        try {
          const res = await createStation({
            locationIdxno: Number(values.locationIdxno),
            name: values.name,
            powerType: values.powerType,
            backhaulType: values.backhaulType,
          });

          if (res.success && res.data) {
            toast.success("Station onboarded successfully");
            onSuccess(res.data);
            resetForm();
          } else {
            toast.error(res.message || "Failed to onboard station");
          }
        } catch {
          toast.error("A network connectivity error occurred.");
        } finally {
          setIsSubmitting(false);
        }
      }}
    >
      {({ setFieldValue, values }) => (
        <Form className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="regionIdxno">Geographic Region</Label>
            <Field
              as="select"
              id="regionIdxno"
              name="regionIdxno"
              disabled={!hasRegions}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                handleRegionChange(e, setFieldValue)
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">
                {hasRegions ? "Select Region..." : "No regions available — create one first"}
              </option>
              {regions.map((region) => (
                <option key={region.idxno} value={region.idxno}>
                  {region.name} ({region.regionCode})
                  {region.locations ? ` — ${region.locations.length} location(s)` : ""}
                </option>
              ))}
            </Field>
            <ErrorMessage name="regionIdxno" component="div" className="text-xs text-destructive" />
            {!hasRegions && (
              <p className="text-xs text-amber-500">
                You need to create a region and locations before onboarding stations.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="locationIdxno">Parent Location / Exchange</Label>
            <Field
              as="select"
              id="locationIdxno"
              name="locationIdxno"
              disabled={!values.regionIdxno || filteredLocations.length === 0}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">
                {!values.regionIdxno
                  ? "Select a region first..."
                  : filteredLocations.length === 0
                    ? "No locations in this region — create one first"
                    : "Select Location..."}
              </option>
              {filteredLocations.map((loc) => (
                <option key={loc.idxno} value={loc.idxno}>
                  {loc.name}
                  {loc.stations ? ` (${loc.stations.length} POP(s))` : ""}
                </option>
              ))}
            </Field>
            <ErrorMessage name="locationIdxno" component="div" className="text-xs text-destructive" />
            {values.regionIdxno && filteredLocations.length === 0 && (
              <p className="text-xs text-amber-500">
                No locations found for this region. Create a location first.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Station / Cabinet Name</Label>
            <Field as={Input} id="name" name="name" placeholder="e.g. Cabinet POP 12B" />
            <ErrorMessage name="name" component="div" className="text-xs text-destructive" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="powerType">Power Profile</Label>
              <Field
                as="select"
                id="powerType"
                name="powerType"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="GRID">GRID (KPLC)</option>
                <option value="SOLAR">SOLAR BANK</option>
                <option value="HYBRID">HYBRID</option>
                <option value="GENERATOR">GENERATOR BACKUP</option>
              </Field>
            </div>

            <div className="space-y-2">
              <Label htmlFor="backhaulType">Backhaul Medium</Label>
              <Field
                as="select"
                id="backhaulType"
                name="backhaulType"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="FIBER">GPON / DARK FIBER</option>
                <option value="MICROWAVE">60GHZ MICROWAVE</option>
                <option value="GPON">METRO GPON</option>
                <option value="LTE">LTE BACKUP</option>
              </Field>
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting || !hasRegions} className="w-full">
            {isSubmitting ? "Onboarding..." : "Save POP Station"}
          </Button>
        </Form>
      )}
    </Formik>
  );
}