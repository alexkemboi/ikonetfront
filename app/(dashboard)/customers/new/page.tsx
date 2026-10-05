import { getPermissionForRoute } from "@/lib/data/nav";
import { redirect } from "next/navigation";
import { getPackagesAction } from "@/actions/packages";
import MultiStepCustomerForm from "./_components/MultiStepCustomerForm";
import { Suspense } from "react";
import { CompanyRequired } from "@/components/tenant/CompanyRequired";

const NewCustomerPage = async () => {
  const pagePerms = await getPermissionForRoute("/customers");
  if (!pagePerms.canCreate) redirect("/dashboard");

 const packages = await getPackagesAction();
 // console.log("Fetched packages:", packages);
 return (
 <div className="container mx-auto py-10">
 {/* <h1 className="text-3xl font-normal mb-6">Create New Customer</h1> */}
 <Suspense fallback={<div>Loading packages...</div>}>
 <CompanyRequired>
 <MultiStepCustomerForm packages={packages.data ?? []} />
 </CompanyRequired>
 </Suspense>
 </div>
 );
};

export default NewCustomerPage;