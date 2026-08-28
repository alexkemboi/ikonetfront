"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { toggleCustomerActiveStatus, deleteCustomer } from "@/actions/customer";
import { provisionSubscriber } from "@/actions/network";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePermissions } from "@/providers/PermissionsProvider";
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
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/dialog";

interface CustomerActionButtonsProps {
 customerId: number;
 isActive: boolean;
 subscriptionId?: string | null;
}

export function CustomerActionButtons({
 customerId,
 isActive,
 subscriptionId,
}: CustomerActionButtonsProps) {
 const router = useRouter();
 const perms = usePermissions("/customers");
 const [isProvisionDialogOpen, setIsProvisionDialogOpen] = useState(false);
 const [pppoeUsername, setPppoeUsername] = useState("");
 const [pppoePassword, setPppoePassword] = useState("");
 const [stationIdxno, setStationIdxno] = useState("");
 const [isProvisioning, setIsProvisioning] = useState(false);

 async function handleProvisionPppoe() {
 if (!stationIdxno || !pppoeUsername) {
 toast.error("Station ID and PPPoE Username are required.");
 return;
 }
 setIsProvisioning(true);
 try {
 const result = await provisionSubscriber({
 customerId: customerId.toString(),
 subscriptionId: subscriptionId || "",
 stationIdxno: parseInt(stationIdxno, 10),
 pppoeUsername,
 pppoePassword: pppoePassword || undefined,
 });
 if (result.success) {
 toast.success("PPPoE subscriber provisioned successfully.");
 setIsProvisionDialogOpen(false);
 setPppoeUsername("");
 setPppoePassword("");
 setStationIdxno("");
 } else {
 toast.error(result.message || "Failed to provision subscriber.");
 }
 } catch {
 toast.error("An unexpected error occurred during provisioning.");
 } finally {
 setIsProvisioning(false);
 }
 }

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
 {perms.canEdit && (
 <Dialog open={isProvisionDialogOpen} onOpenChange={setIsProvisionDialogOpen}>
 <DialogTrigger asChild>
 <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-accent-foreground">
 Provision PPPoE
 </Button>
 </DialogTrigger>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Provision PPPoE Subscriber</DialogTitle>
 <DialogDescription>
 Enter the station and credentials to provision this customer as a PPPoE subscriber.
 {!subscriptionId && (
 <span className="block mt-1 text-amber-600 font-medium">
 Warning: This customer has no active subscription ID.
 </span>
 )}
 </DialogDescription>
 </DialogHeader>
 <div className="space-y-4 py-2">
 <div className="space-y-1.5">
 <label className="text-xs font-medium text-foreground">Station ID</label>
 <Input
 type="number"
 placeholder="e.g. 1"
 value={stationIdxno}
 onChange={(e) => setStationIdxno(e.target.value)}
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-medium text-foreground">PPPoE Username</label>
 <Input
 placeholder="e.g. john_pppoe"
 value={pppoeUsername}
 onChange={(e) => setPppoeUsername(e.target.value)}
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-medium text-foreground">PPPoE Password (optional)</label>
 <Input
 type="password"
 placeholder="Leave blank to auto-generate"
 value={pppoePassword}
 onChange={(e) => setPppoePassword(e.target.value)}
 />
 </div>
 </div>
 <DialogFooter>
 <Button variant="outline" onClick={() => setIsProvisionDialogOpen(false)}>
 Cancel
 </Button>
 <Button onClick={handleProvisionPppoe} disabled={isProvisioning}>
 {isProvisioning ? "Provisioning..." : "Provision"}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 )}

 {perms.canEdit && (
 <AlertDialog>
 <AlertDialogTrigger asChild>
 <Button
 variant="outline"
 className={
 isActive
 ? "border-warning text-warning hover:bg-warning hover:text-accent-foreground"
 : "border-success text-success hover:bg-success hover:text-accent-foreground"
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
 )}

 {perms.canDelete && (
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
 className="bg-destructive text-foreground hover:bg-destructive/90"
 onClick={handleDeleteCustomer}
 >
 Delete
 </AlertDialogAction>
 </AlertDialogFooter>
 </AlertDialogContent>
 </AlertDialog>
 )}
 </div>
 );
}
