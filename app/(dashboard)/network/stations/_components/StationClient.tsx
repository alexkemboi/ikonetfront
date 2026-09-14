"use client";

import { useState } from "react";
import { RegionResponse, StationResponse } from "@/lib/types/network";
import { deleteStation } from "@/actions/network";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StationForm } from "./StationForm";
import { toast } from "sonner";
import { Database, Plus, Trash2 } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { usePermissions } from "@/providers/PermissionsProvider";
import { cn } from "@/lib/utils";

interface StationClientProps {
 regionsTree: RegionResponse[];
}

export function StationClient({ regionsTree }: StationClientProps) {
 const getFlatStations = (tree: RegionResponse[]): StationResponse[] =>
 tree.flatMap((region) =>
 (region.locations || []).flatMap((loc) =>
 (loc.stations || []).map((station) => ({
 ...station,
 locationName: loc.name,
 }))
 )
 );

 const [stations, setStations] = useState<StationResponse[]>(getFlatStations(regionsTree));
 const [isDialogOpen, setIsOpen] = useState(false);
 const perms = usePermissions("/network/stations");

 const handleDelete = async (id: number, locationIdxno: number) => {
 if (!confirm("Are you sure you want to delete this Station (POP)?")) return;

 try {
 const res = await deleteStation(id, locationIdxno);
 if (res.success) {
 setStations((prev) => prev.filter((station) => station.idxno !== id));
 toast.success("Station deleted successfully from local database");
 } else {
 toast.error(res.message || "Failed to delete station");
 }
 } catch {
 toast.error("A network validation error occurred.");
 }
 };

 const columns: ColumnDef<StationResponse>[] = [
 {
 accessorKey: "name",
 header: "Station Name",
 cell: ({ row }) => <span className="font-semibold text-primary">{row.original.name}</span>,
 },
 {
 accessorKey: "locationName",
 header: "Parent Location",
 },
{
  accessorKey: "powerType",
  header: "Power Profile",
  cell: ({ row }) => (
    <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] font-sans tabular-nums font-medium text-muted-foreground">
      {row.original.powerType}
    </span>
  ),
},
{
  accessorKey: "backhaulType",
  header: "Backhaul Medium",
  cell: ({ row }) => (
    <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] font-sans tabular-nums font-medium text-muted-foreground">
      {row.original.backhaulType}
    </span>
  ),
},
{
  accessorKey: "isActive",
  header: "Status",
  cell: ({ row }) => (
    <span className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
      row.original.isActive
        ? "bg-success/10 text-success border-success/20"
        : "bg-destructive/10 text-destructive border-destructive/20"
    )}>
      {row.original.isActive ? "Online" : "Offline"}
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
 onClick={() => handleDelete(row.original.idxno, row.original.locationIdxno)}
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
          <Button className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-black hover:bg-amber-400 transition shadow-lg shadow-amber-500/20">
            <Plus className="h-4 w-4" /> Onboard Station
          </Button>
          </DialogTrigger>
 <DialogContent className="sm:max-w-[425px]">
 <DialogHeader>
 <DialogTitle className="flex items-center gap-2 text-xl font-bold">
 <Database className="h-5 w-5 text-primary" /> Onboard Physical POP
 </DialogTitle>
 </DialogHeader>
 <StationForm
 regions={regionsTree}
 onSuccess={(newStation) => {
 setStations((prev) => [newStation, ...prev]);
 setIsOpen(false);
 }}
 />
 </DialogContent>
 </Dialog>
 )}
 </div>

 <DataTable columns={columns} data={stations} />
 </div>
 );
}