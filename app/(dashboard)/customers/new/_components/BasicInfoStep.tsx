import { FormikProps } from "formik";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddCustomerPayload } from "@/lib/types/customer";

const BasicInfoStep = ({
  formik,
}: {
  formik: FormikProps<AddCustomerPayload>;
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="space-y-2">
        <Label htmlFor="firstname">First Name</Label>
        <Input
          id="firstname"
          type="text"
          placeholder="John"
          {...formik.getFieldProps("firstname")}
          className={
            formik.touched.firstname && formik.errors.firstname
              ? "border-destructive"
              : ""
          }
        />
        {formik.touched.firstname && formik.errors.firstname && (
          <p className="text-xs text-destructive">{formik.errors.firstname}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="lname">Last Name</Label>
        <Input
          id="lname"
          type="text"
          placeholder="Doe"
          {...formik.getFieldProps("lname")}
          className={
            formik.touched.lname && formik.errors.lname
              ? "border-destructive"
              : ""
          }
        />
        {formik.touched.lname && formik.errors.lname && (
          <p className="text-xs text-destructive">{formik.errors.lname}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          type="text"
          placeholder="johndoe"
          {...formik.getFieldProps("username")}
          className={
            formik.touched.username && formik.errors.username
              ? "border-destructive"
              : ""
          }
        />
        {formik.touched.username && formik.errors.username && (
          <p className="text-xs text-destructive">{formik.errors.username}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Min. 6 characters"
          {...formik.getFieldProps("password")}
          className={
            formik.touched.password && formik.errors.password
              ? "border-destructive"
              : ""
          }
        />
        {formik.touched.password && formik.errors.password && (
          <p className="text-xs text-destructive">{formik.errors.password}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="john@example.com"
          {...formik.getFieldProps("email")}
          className={
            formik.touched.email && formik.errors.email
              ? "border-destructive"
              : ""
          }
        />
        {formik.touched.email && formik.errors.email && (
          <p className="text-xs text-destructive">{formik.errors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phoneNumber">Phone Number</Label>
        <Input
          id="phoneNumber"
          type="text"
          placeholder="+254 700 000 000"
          {...formik.getFieldProps("phoneNumber")}
          className={
            formik.touched.phoneNumber && formik.errors.phoneNumber
              ? "border-destructive"
              : ""
          }
        />
        {formik.touched.phoneNumber && formik.errors.phoneNumber && (
          <p className="text-xs text-destructive">{formik.errors.phoneNumber}</p>
        )}
      </div>
    </div>
  );
};

export default BasicInfoStep;
