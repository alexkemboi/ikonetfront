import { FormikProps } from "formik";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { AddCustomerPayload } from "@/lib/types/customer";
import { Button } from "@/components/ui/button";

const SubscriptionDetailsStep = ({
 formik,
}: {
 formik: FormikProps<AddCustomerPayload>;
}) => {
 return (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
 <div className="space-y-2">
 <Label htmlFor="duration">Duration</Label>
 <Input
 id="duration"
 type="number"
 min={1}
 placeholder="e.g. 30"
 {...formik.getFieldProps("duration")}
 className={
 formik.touched.duration && formik.errors.duration
 ? "border-destructive"
 : ""
 }
 />
 {formik.touched.duration && formik.errors.duration && (
 <p className="text-xs text-destructive">{formik.errors.duration}</p>
 )}
 </div>

 <div className="space-y-2">
 <Label htmlFor="unit">Unit</Label>
 <Select
 value={formik.values.unit}
 onValueChange={(value) => formik.setFieldValue("unit", value)}
 >
 <SelectTrigger
 id="unit"
 className={
 formik.touched.unit && formik.errors.unit
 ? "border-destructive"
 : ""
 }
 >
 <SelectValue placeholder="Select unit" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="days">Days</SelectItem>
 <SelectItem value="weeks">Weeks</SelectItem>
 <SelectItem value="months">Months</SelectItem>
 </SelectContent>
 </Select>
 {formik.touched.unit && formik.errors.unit && (
 <p className="text-xs text-destructive">{formik.errors.unit}</p>
 )}
 </div>
 </div>
 );
};

export default SubscriptionDetailsStep;
