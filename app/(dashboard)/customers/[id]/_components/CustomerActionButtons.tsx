"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { toggleCustomerActiveStatus, deleteCustomer } from "@/actions/customer";
import { Button } from "@/components/ui/button";
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

interface CustomerActionButtonsProps {
  customerId: number;
  isActive: boolean;
}

export function CustomerActionButtons({
  customerId,
  isActive,
}: CustomerActionButtonsProps) {
  const router = useRouter();

  async function handleToggleActiveStatus() {
    try {
      const result = await toggleCustomerActiveStatus(customerId);
      if (result.success) {
        toast.success(`Customer ${isActive ? "deactivated" : "activated"} successfully.`);
        // revalidatePath in the server action triggers a fresh server render
      } else {
        toast.error(result.message || "Failed to update status.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    }
  }

  async function handleDeleteCustomer() {
    try {
      const result = await deleteCustomer(customerId);
      if (result.success) {
        toast.success("Customer deleted successfully.");
        router.push("/customers/all");
      } else {
        toast.error(result.message || "Failed to delete customer.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    }
  }

  return (
    <div className="flex gap-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            className={
              isActive
                ? "border-[var(--warning)] text-[var(--warning)] hover:bg-warning hover:text-white"
                : "border-[var(--success)] text-success hover:bg-success hover:text-white"
            }
          >
            {isActive ? "Deactivate" : "Activate"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              {isActive
                ? "This will deactivate the customer. They will lose access to services immediately."
                : "This will activate the customer and restore their access to services."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleActiveStatus}>
              {isActive ? "Deactivate" : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">Delete Customer</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The customer and all associated
              data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDeleteCustomer}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
