"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { deleteCustomer, toggleCustomerActiveStatus } from "@/actions/customer";

interface BackButtonProps {
  customerId?: number;
  customerIsActive?: boolean;
}

export function BackButton({ customerId, customerIsActive }: BackButtonProps) {
  const router = useRouter();

  const handleDelete = async () => {
    if (customerId) {
      const result = await deleteCustomer(customerId);
      if (result.success) {
        toast.success("Customer deleted successfully!");
        router.push("/customers/all");
      } else {
        toast.error(result.message || "Failed to delete customer.");
      }
    }
  };

  const handleToggleActiveStatus = async () => {
    if (customerId) {
      const result = await toggleCustomerActiveStatus(customerId);
      if (result.success) {
        toast.success(`Customer ${customerIsActive ? "deactivated" : "activated"} successfully!`);
        router.refresh(); // Refresh the current page to show updated status
      } else {
        toast.error(result.message || "Failed to toggle customer status.");
      }
    }
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={() => router.back()} className="flex items-center gap-2">
        <ChevronLeft className="h-4 w-4" />
        Back to Customers
      </Button>

      {customerId && (
        <>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="bg-yellow-500 hover:bg-yellow-600 text-white">
                {customerIsActive ? "Deactivate" : "Activate"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will {customerIsActive ? "deactivate" : "activate"} the customer.
                  They will {customerIsActive ? "not be able to log in" : "be able to log in"}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleToggleActiveStatus}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  customer and remove their data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
