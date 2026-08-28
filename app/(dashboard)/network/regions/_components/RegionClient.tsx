"use client";

import { useState } from "react";
import { RegionResponse } from "@/lib/types/network";
import { deleteRegion } from "@/actions/network";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RegionForm } from "./RegionForm";
import { toast } from "sonner";
import { Globe, Plus, Trash2 } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { usePermissions } from "@/providers/PermissionsProvider";

interface RegionClientProps {
 initialRegions: RegionResponse[];
}

export function RegionClient({ initialRegions }: RegionClientProps) {
 const [regions, setRegions] = useState<RegionResponse[]>(initialRegions);
 const [isDialogOpen, setIsOpen] = useState(false);
 const perms = usePermissions("/network/regions");

 const handleDelete = async (id: number) => {
 if (!confirm("Are you sure you want to delete this region?")) return;

 try {
 const res = await deleteRegion(id);
 if (res.success) {
 setRegions((prev) => prev.filter((r) => r.idxno !== id));
 toast.success(res.message || "Region deleted successfully");
 } else {
 toast.error(res.message || "Failed to delete region");
 }
 } catch {
 toast.error("A network error occurred while deleting the region.");
 }
 };

 const columns: ColumnDef<RegionResponse>[] = [
 {
 accessorKey: "regionCode",
 header: "Region Code",
 cell: ({ row }) => <span className="font-mono font-semibold">{row.original.regionCode}</span>,
 },
 {
 accessorKey: "name",
 header: "Region Name",
 },
 {
 accessorKey: "description",
 header: "Description",
 cell: ({ row }) => row.original.description || <span className="text-muted-foreground italic">No description</span>,
 },
 {
 accessorKey: "isActive",
 header: "Status",
 cell: ({ row }) => (
 <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
 row.original.isActive
 ? "bg-green-500/10 text-green-400 ring-green-500/20"
 : "bg-red-500/10 text-red-400 ring-red-500/20"
 }`}>
 {row.original.isActive ? "Active" : "Inactive"}
 </span>
 ),
 },
 {
 id: "actions",
 header: "Actions",
 cell: ({ row }) => (
 perms.canDelete ? (
 <Button
 variant="destructive"
 size="icon"
 onClick={() => handleDelete(row.original.idxno)}
 >
 <Trash2 className="h-4 w-4" />
 </Button>
 ) : null
 ),
 },
 ];

 return (
 <div className="space-y-4">
 <div className="flex justify-end">
 {perms.canCreate && (
 <Dialog open={isDialogOpen} onOpenChange={setIsOpen}>
 <DialogTrigger asChild>
 <Button className="flex items-center gap-2">
 <Plus className="h-4 w-4" /> Add Region
 </Button>
 </DialogTrigger>
 <DialogContent className="sm:max-w-[425px]">
 <DialogHeader>
 <DialogTitle className="flex items-center gap-2 text-xl font-bold">
 <Globe className="h-5 w-5 text-primary" /> Create New Region
 </DialogTitle>
 </DialogHeader>
 <RegionForm
 onSuccess={(newRegion) => {
 setRegions((prev) => [newRegion, ...prev]);
 setIsOpen(false);
 }}
 />
 </DialogContent>
 </Dialog>
 )}
 </div>

 <DataTable columns={columns} data={regions} />
 </div>
 );
}