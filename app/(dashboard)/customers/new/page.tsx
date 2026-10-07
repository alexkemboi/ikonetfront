import { getPermissionForRoute } from "@/lib/data/nav";
import { redirect } from "next/navigation";
import MultiStepCustomerForm from "./_components/MultiStepCustomerForm";
import { getMikrotikDevices } from "@/actions/mikrotik";
import { CompanyRequired } from "@/components/tenant/CompanyRequired";

const NewCustomerPage = async () => {
  const pagePerms = await getPermissionForRoute("/customers");
  if (!pagePerms.canCreate) redirect("/dashboard");

  // A PPPoE customer is served by one active MikroTik router of the company.
  const devices = await getMikrotikDevices();
  const routers = (devices.data ?? [])
    .filter((d) => d.active && d.deviceType?.toUpperCase() === "MIKROTIK")
    .map((d) => ({ id: d.id, name: d.name, location: d.location }));

 return (
 <div className="container mx-auto py-10">
 <CompanyRequired>
 <MultiStepCustomerForm routers={routers} />
 </CompanyRequired>
 </div>
 );
};

export default NewCustomerPage;
