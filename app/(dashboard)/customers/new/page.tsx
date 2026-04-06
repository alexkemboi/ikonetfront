import MultiStepCustomerForm from "./_components/MultiStepCustomerForm";

const NewCustomerPage = () => {
  return (
    <div className="container mx-auto py-10">
      {/* <h1 className="text-3xl font-bold mb-6">Create New Customer</h1> */}
      <MultiStepCustomerForm />
    </div>
  );
};

export default NewCustomerPage;