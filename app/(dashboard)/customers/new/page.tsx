import { getPackagesAction } from "@/actions/packages";
import MultiStepCustomerForm from "./_components/MultiStepCustomerForm";
import { Suspense } from "react";

const NewCustomerPage = async () => {
 const packages = await getPackagesAction();
 // console.log("Fetched packages:", packages);
 return (
 <div className="container mx-auto py-10">
 {/* <h1 className="text-3xl font-bold mb-6">Create New Customer</h1> */}
 <Suspense fallback={<div>Loading packages...</div>}>
 <MultiStepCustomerForm packages={packages.data ?? []} />
 </Suspense>
 </div>
 );
};

export default NewCustomerPage;