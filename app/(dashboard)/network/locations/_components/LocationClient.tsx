"use client";

import { useState } from "react";
import { RegionResponse, LocationResponse } from "@/lib/types/network";
import { deleteLocation } from "@/actions/network";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LocationForm } from "./LocationForm";
import { toast } from "sonner";
import { MapPin, Plus, Trash2 } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { usePermissions } from "@/providers/PermissionsProvider";

interface LocationClientProps {
 regionsTree: RegionResponse[];
}

export function LocationClient({ regionsTree }: LocationClientProps) {
 const flatten = (tree: RegionResponse[]): LocationResponse[] =>
 tree.flatMap((r) => (r.locations || []));

 const [locations, setLocations] = useState<LocationResponse[]>(flatten(regionsTree));
 const [isDialogOpen, setIsOpen] = useState(false);
 const perms = usePermissions("/network/locations");

 const handleDelete = async (id: number, regionIdxno: number) => {
 if (!confirm("Are you sure you want to delete this location?")) return;
 try {
 const res = await deleteLocation(id, regionIdxno);
 if (res.success) {
 setLocations((prev) => prev.filter((loc) => loc.idxno !== id));
 toast.success(res.message || "Location deleted successfully");
 } else {
 toast.error(res.message || "Failed to delete location");
 }
 } catch {
 toast.error("Network error occurred while deleting the location.");
 }
 };

 const columns: ColumnDef<LocationResponse>[] = [
 {
 accessorKey: "name",
 header: "Location Name",
 },
 {
 accessorKey: "regionName",
 header: "Region",
 cell: ({ row }) => <span className="font-semibold text-primary">{row.original.regionName}</span>,
 },
 {
 id: "coordinates",
 header: "Coordinates (Lat/Lon)",
 cell: ({ row }) =>
 row.original.latitude != null && row.original.longitude != null ? (
 <span className="font-mono text-xs">
 {row.original.latitude}, {row.original.longitude}
 </span>
 ) : (
 <span className="text-muted-foreground italic">No Coordinates</span>
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
 onClick={() => handleDelete(row.original.idxno, row.original.regionIdxno)}
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
 <Plus className="h-4 w-4" /> Add Location
 </Button>
 </DialogTrigger>
 <DialogContent className="sm:max-w-[425px]">
 <DialogHeader>
 <DialogTitle className="flex items-center gap-2 text-xl font-bold">
 <MapPin className="h-5 w-5 text-primary" /> Create New Location
 </DialogTitle>
 </DialogHeader>
 <LocationForm
 regions={regionsTree}
 onSuccess={(newLoc) => {
 setLocations((prev) => [newLoc, ...prev]);
 setIsOpen(false);
 }}
 />
 </DialogContent>
 </Dialog>
 )}
 </div>
 <DataTable columns={columns} data={locations} />
 </div>
 );
}