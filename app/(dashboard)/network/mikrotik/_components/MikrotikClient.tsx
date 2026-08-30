
"use client";

import React, { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
 // Table, // Removed as it's not used
 // TableBody, // Removed as it's not used
 // TableCell, // Removed as it's not used
 // TableHead, // Removed as it's not used
 // TableHeader, // Removed as it's not used
 // TableRow, // Removed as it's not used
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/providers/PermissionsProvider";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
 // Switch, // Removed as it's not used
} from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
 MikrotikDevice,
 AddMikrotikDevicePayload,
 MikrotikDeviceStatus,
 MikrotikInterface,
} from "@/lib/types/mikrotik";
import {
 addMikrotikDevice,
 getMikrotikDeviceStatus,
 getMikrotikDeviceInterfaces,
} from "@/actions/mikrotik";
import { toast } from "sonner"; // Using sonner for notifications
import { Loader2, ArrowUpDown } from "lucide-react"; // Assuming lucide-react for icons
import { DataTable } from "@/components/ui/data-table"; // Import the new DataTable

interface MikrotikClientProps {
 initialDevices: MikrotikDevice[];
}

const AddDeviceSchema = Yup.object().shape({
 name: Yup.string().required("Name is required"),
 ipAddress: Yup.string()
 .matches(
 /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/,
 "Invalid IP Address format"
 )
 .required("IP Address is required"),
 port: Yup.number()
 .min(1, "Port must be at least 1")
 .max(65535, "Port must be at most 65535")
 .required("Port is required"),
 deviceType: Yup.string().required("Device Type is required"),
 username: Yup.string(),
 password: Yup.string(),
 snmpCommunity: Yup.string(),
 snmpVersion: Yup.string(),
 site: Yup.string().required("Site is required"),
 region: Yup.string().required("Region is required"),
 location: Yup.string().required("Location is required"),
 maxSessions: Yup.number().min(0, "Max Sessions cannot be negative"),
 description: Yup.string(),
});

export function MikrotikClient({ initialDevices }: MikrotikClientProps) {
 const [devices, setDevices] = useState<MikrotikDevice[]>(initialDevices);
 const [isAddDeviceDialogOpen, setIsAddDeviceDialogOpen] = useState(false);
 const perms = usePermissions("/network/mikrotik");
 const [loadingStatus, setLoadingStatus] = useState<Record<number, boolean>>(
 {}
 );
 const [loadingInterfaces, setLoadingInterfaces] = useState<
 Record<number, boolean>
 >({});
 const [selectedDeviceStatus, setSelectedDeviceStatus] =
 useState<MikrotikDeviceStatus | null>(null);
 const [selectedDeviceInterfaces, setSelectedDeviceInterfaces] = useState<
 MikrotikInterface[]
 >([]);
 const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
 const [isInterfacesDialogOpen, setIsInterfacesDialogOpen] = useState(false);

 const formik = useFormik<AddMikrotikDevicePayload>({
 initialValues: {
 name: "",
 ipAddress: "",
 port: 8728, // Default MikroTik API port
 deviceType: "MIKROTIK", // Assuming default
 username: "",
 password: "",
 snmpCommunity: "",
 snmpVersion: "",
 site: "",
 region: "",
 location: "",
 maxSessions: 0,
 description: "",
 },
 validationSchema: AddDeviceSchema,
 onSubmit: async (values, { setSubmitting, resetForm }) => {
 try {
 const result = await addMikrotikDevice(values);
 if (result.success && result.data) {
 toast.success(result.message);
 setDevices((prev) => [...prev, result.data!]);
 resetForm();
 setIsAddDeviceDialogOpen(false);
 } else {
 toast.error(result.message);
 }
 } catch (error: unknown) {
 toast.error(`Failed to add device: ${(error instanceof Error ? error.message : String(error))}`);
 } finally {
 setSubmitting(false);
 }
 },
 });

 const handleViewStatus = async (deviceId: number) => {
 setLoadingStatus((prev) => ({ ...prev, [deviceId]: true }));
 try {
 const result = await getMikrotikDeviceStatus(deviceId);
 console.log("Fetched device status:", result); // Debugging log
 if (result.success && result.data) {
 setSelectedDeviceStatus(result.data);
 setIsStatusDialogOpen(true);
 } else {
 toast.error(result.message);
 }
 } catch (error: unknown) {
 toast.error(`Failed to fetch status: ${(error instanceof Error ? error.message : String(error))}`);
 } finally {
 setLoadingStatus((prev) => ({ ...prev, [deviceId]: false }));
 }
 };

  const handleViewInterfaces = async (deviceId: number) => {
    setLoadingInterfaces((prev) => ({ ...prev, [deviceId]: true }));
    try {
      const result = await getMikrotikDeviceInterfaces(deviceId);
      console.log("Fetched device interfaces:", result); // Debugging log
      if (result.success) {
        setSelectedDeviceInterfaces(result.data ?? []);
        setIsInterfacesDialogOpen(true);
      }
    } catch (error: unknown) {
      toast.error(`Failed to fetch interfaces: ${(error instanceof Error ? error.message : String(error))}`);
    } finally {
      setLoadingInterfaces((prev) => ({ ...prev, [deviceId]: false }));
    }
  };

 const columns: ColumnDef<MikrotikDevice>[] = [
 {
 accessorKey: "name",
 header: ({ column }) => {
 return (
 <Button
 variant="ghost"
 onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
 >
 Name
 <ArrowUpDown className="ml-2 h-4 w-4" />
 </Button>
 );
 },
 cell: ({ row }) => <div className="lowercase">{row.getValue("name")}</div>,
 },
 {
 accessorKey: "ipAddress",
 header: ({ column }) => {
 return (
 <Button
 variant="ghost"
 onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
 >
 IP Address
 <ArrowUpDown className="ml-2 h-4 w-4" />
 </Button>
 );
 },
 },
 {
 accessorKey: "port",
 header: ({ column }) => {
 return (
 <Button
 variant="ghost"
 onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
 >
 Port
 <ArrowUpDown className="ml-2 h-4 w-4" />
 </Button>
 );
 },
 },
 {
 accessorKey: "location",
 header: ({ column }) => {
 return (
 <Button
 variant="ghost"
 onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
 >
 Location
 <ArrowUpDown className="ml-2 h-4 w-4" />
 </Button>
 );
 },
 },
 {
 accessorKey: "online",
 header: "Status",
 cell: ({ row }) => {
 const online = row.getValue("online");
 return (
 <Badge variant={online ? "default" : "destructive"}>
 {online ? "Online" : "Offline"}
 </Badge>
 );
 },
 },
 {
 accessorKey: "cpuLoad",
 header: "CPU Load",
 cell: ({ row }) => <div>{row.getValue("cpuLoad") || "N/A"}</div>,
 },
 {
 accessorKey: "uptime",
 header: "Uptime",
 cell: ({ row }) => <div>{row.getValue("uptime") || "N/A"}</div>,
 },
 {
 id: "actions",
 enableHiding: false,
 cell: ({ row }) => {
 const device = row.original;
 return (
 <div className="flex gap-2">
 <Button
 variant="outline"
 size="sm"
 onClick={() => handleViewStatus(device.id)}
 disabled={loadingStatus[device.id]}
 >
 {loadingStatus[device.id] && (
 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
 )}
 Status
 </Button>
 <Button
 variant="outline"
 size="sm"
 onClick={() => handleViewInterfaces(device.id)}
 disabled={loadingInterfaces[device.id]}
 >
 {loadingInterfaces[device.id] && (
 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
 )}
 Interfaces
 </Button>
 </div>
 );
 },
 },
 ];

 return (
 <Card>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-2xl font-bold">MikroTik Devices</CardTitle>
 <Dialog
 open={isAddDeviceDialogOpen}
 onOpenChange={setIsAddDeviceDialogOpen}
 >
 {perms.canCreate && (
 <DialogTrigger asChild>
 <Button>Add New Device</Button>
 </DialogTrigger>
 )}
 <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
 <DialogHeader>
 <DialogTitle>Add New MikroTik Device</DialogTitle>
 <DialogDescription>
 Fill in the details to add a new MikroTik device.
 </DialogDescription>
 </DialogHeader>
 <form onSubmit={formik.handleSubmit} className="grid gap-4 py-4">
 <div className="grid grid-cols-4 items-center gap-4">
 <Label htmlFor="name" className="text-right">
 Name
 </Label>
 <Input
 id="name"
 name="name"
 value={formik.values.name}
 onChange={formik.handleChange}
 onBlur={formik.handleBlur}
 className="col-span-3"
 />
 {formik.touched.name && formik.errors.name && (
 <div className="col-span-4 text-right text-red-500 text-sm">
 {formik.errors.name}
 </div>
 )}
 </div>
 <div className="grid grid-cols-4 items-center gap-4">
 <Label htmlFor="ipAddress" className="text-right">
 IP Address
 </Label>
 <Input
 id="ipAddress"
 name="ipAddress"
 value={formik.values.ipAddress}
 onChange={formik.handleChange}
 onBlur={formik.handleBlur}
 className="col-span-3"
 />
 {formik.touched.ipAddress && formik.errors.ipAddress && (
 <div className="col-span-4 text-right text-red-500 text-sm">
 {formik.errors.ipAddress}
 </div>
 )}
 </div>
 <div className="grid grid-cols-4 items-center gap-4">
 <Label htmlFor="port" className="text-right">
 Port
 </Label>
 <Input
 id="port"
 name="port"
 type="number"
 value={formik.values.port}
 onChange={formik.handleChange}
 onBlur={formik.handleBlur}
 className="col-span-3"
 />
 {formik.touched.port && formik.errors.port && (
 <div className="col-span-4 text-right text-red-500 text-sm">
 {formik.errors.port}
 </div>
 )}
 </div>
 <div className="grid grid-cols-4 items-center gap-4">
 <Label htmlFor="deviceType" className="text-right">
 Device Type
 </Label>
 <Input
 id="deviceType"
 name="deviceType"
 value={formik.values.deviceType}
 onChange={formik.handleChange}
 onBlur={formik.handleBlur}
 className="col-span-3"
 />
 {formik.touched.deviceType && formik.errors.deviceType && (
 <div className="col-span-4 text-right text-red-500 text-sm">
 {formik.errors.deviceType}
 </div>
 )}
 </div>
 <div className="grid grid-cols-4 items-center gap-4">
 <Label htmlFor="username" className="text-right">
 Username
 </Label>
 <Input
 id="username"
 name="username"
 value={formik.values.username}
 onChange={formik.handleChange}
 onBlur={formik.handleBlur}
 className="col-span-3"
 />
 </div>
 <div className="grid grid-cols-4 items-center gap-4">
 <Label htmlFor="password" className="text-right">
 Password
 </Label>
 <Input
 id="password"
 name="password"
 type="password"
 value={formik.values.password}
 onChange={formik.handleChange}
 onBlur={formik.handleBlur}
 className="col-span-3"
 />
 </div>
 <div className="grid grid-cols-4 items-center gap-4">
 <Label htmlFor="snmpCommunity" className="text-right">
 SNMP Community
 </Label>
 <Input
 id="snmpCommunity"
 name="snmpCommunity"
 value={formik.values.snmpCommunity}
 onChange={formik.handleChange}
 onBlur={formik.handleBlur}
 className="col-span-3"
 />
 </div>
 <div className="grid grid-cols-4 items-center gap-4">
 <Label htmlFor="snmpVersion" className="text-right">
 SNMP Version
 </Label>
 <Input
 id="snmpVersion"
 name="snmpVersion"
 value={formik.values.snmpVersion}
 onChange={formik.handleChange}
 onBlur={formik.handleBlur}
 className="col-span-3"
 />
 </div>
 <div className="grid grid-cols-4 items-center gap-4">
 <Label htmlFor="site" className="text-right">
 Site
 </Label>
 <Input
 id="site"
 name="site"
 value={formik.values.site}
 onChange={formik.handleChange}
 onBlur={formik.handleBlur}
 className="col-span-3"
 />
 {formik.touched.site && formik.errors.site && (
 <div className="col-span-4 text-right text-red-500 text-sm">
 {formik.errors.site}
 </div>
 )}
 </div>
 <div className="grid grid-cols-4 items-center gap-4">
 <Label htmlFor="region" className="text-right">
 Region
 </Label>
 <Input
 id="region"
 name="region"
 value={formik.values.region}
 onChange={formik.handleChange}
 onBlur={formik.handleBlur}
 className="col-span-3"
 />
 {formik.touched.region && formik.errors.region && (
 <div className="col-span-4 text-right text-red-500 text-sm">
 {formik.errors.region}
 </div>
 )}
 </div>
 <div className="grid grid-cols-4 items-center gap-4">
 <Label htmlFor="location" className="text-right">
 Location
 </Label>
 <Input
 id="location"
 name="location"
 value={formik.values.location}
 onChange={formik.handleChange}
 onBlur={formik.handleBlur}
 className="col-span-3"
 />
 {formik.touched.location && formik.errors.location && (
 <div className="col-span-4 text-right text-red-500 text-sm">
 {formik.errors.location}
 </div>
 )}
 </div>
 <div className="grid grid-cols-4 items-center gap-4">
 <Label htmlFor="maxSessions" className="text-right">
 Max Sessions
 </Label>
 <Input
 id="maxSessions"
 name="maxSessions"
 type="number"
 value={formik.values.maxSessions}
 onChange={formik.handleChange}
 onBlur={formik.handleBlur}
 className="col-span-3"
 />
 {formik.touched.maxSessions && formik.errors.maxSessions && (
 <div className="col-span-4 text-right text-red-500 text-sm">
 {formik.errors.maxSessions}
 </div>
 )}
 </div>
 <div className="grid grid-cols-4 items-center gap-4">
 <Label htmlFor="description" className="text-right">
 Description
 </Label>
 <Input
 id="description"
 name="description"
 value={formik.values.description}
 onChange={formik.handleChange}
 onBlur={formik.handleBlur}
 className="col-span-3"
 />
 </div>
 <Button type="submit" disabled={formik.isSubmitting}>
 {formik.isSubmitting && (
 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
 )}
 Add Device
 </Button>
 </form>
 </DialogContent>
 </Dialog>
 </CardHeader>
 <CardContent>
 <DataTable columns={columns} data={devices} filterColumnId="name" />

 {/* Device Status Dialog */}
 <Dialog
 open={isStatusDialogOpen}
 onOpenChange={setIsStatusDialogOpen}
 >
 <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
 <DialogHeader>
 <DialogTitle>Device Status: {selectedDeviceStatus?.name}</DialogTitle>
 <DialogDescription>
 Detailed status information for the selected MikroTik device.
 </DialogDescription>
 </DialogHeader>
 {selectedDeviceStatus ? (
 <div className="grid gap-4 py-4">
 <div className="grid grid-cols-2 gap-4">
 <div>
 <p className="text-sm font-medium">Identity:</p>
 <p>{selectedDeviceStatus.identity}</p>
 </div>
 <div>
 <p className="text-sm font-medium">Version:</p>
 <p>{selectedDeviceStatus.version}</p>
 </div>
 <div>
 <p className="text-sm font-medium">Uptime:</p>
 <p>{selectedDeviceStatus.uptime}</p>
 </div>
 <div>
 <p className="text-sm font-medium">CPU Load:</p>
 <p>{selectedDeviceStatus.cpuLoad}</p>
 </div>
 <div>
 <p className="text-sm font-medium">Free Memory:</p>
 <p>{selectedDeviceStatus.freeMemory}</p>
 </div>
 <div>
 <p className="text-sm font-medium">Total Memory:</p>
 <p>{selectedDeviceStatus.totalMemory}</p>
 </div>
 <div>
 <p className="text-sm font-medium">Online:</p>
 <Badge variant={selectedDeviceStatus.online ? "default" : "destructive"}
 className={selectedDeviceStatus.online ? "bg-green-600 text-foreground" : "bg-red-600 text-foreground"}>
 
 {selectedDeviceStatus.online ? "Yes" : "No"}
 </Badge>
 </div>
 </div>
 <Separator className="my-4" />
 <h3 className="text-lg font-semibold">Neighbors</h3>
 {selectedDeviceStatus?.neighbors?.length > 0 ? (
 <ScrollArea className="h-[200px] w-full rounded-md border p-4">
 {selectedDeviceStatus?.neighbors.map((neighbor, index) => (
 <div key={index} className="mb-4 last:mb-0">
 <p><strong>Identity:</strong> {neighbor.identity}</p>
 <p><strong>Address:</strong> {neighbor.address}</p>
 <p><strong>Interface:</strong> {neighbor.interface}</p>
 <p><strong>Platform:</strong> {neighbor.platform}</p>
 <p><strong>Uptime:</strong> {neighbor.uptime}</p>
 <Separator className="my-2" />
 </div>
 ))}
 </ScrollArea>
 ) : (
 <p>No neighbors found.</p>
 )}
 </div>
 ) : (
 <p>No status data available.</p>
 )}
 </DialogContent>
 </Dialog>

 {/* Device Interfaces Dialog */}
 <Dialog
 open={isInterfacesDialogOpen}
 onOpenChange={setIsInterfacesDialogOpen}
 >
 <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
 <DialogHeader>
 <DialogTitle>Device Interfaces</DialogTitle>
 <DialogDescription>
 List of network interfaces for the selected MikroTik device.
 </DialogDescription>
 </DialogHeader>
 {selectedDeviceInterfaces?.length > 0 ? (
 <ScrollArea className="h-[500px] w-full rounded-md border p-4">
 {selectedDeviceInterfaces?.map((iface, index) => (
 <div key={iface[".id"] || `${iface.name}-${iface["mac-address"]}-${index}`} className="mb-4 last:mb-0">
 <h4 className="font-semibold">{iface.name} ({iface.type})</h4>
 <p><strong>MAC Address:</strong> {iface["mac-address"]}</p>
 <p><strong>MTU:</strong> {iface.mtu} (Actual: {iface["actual-mtu"]})</p>
 <p><strong>Running:</strong> <Badge variant={iface.running === "true" ? "default" : "destructive"}>{iface.running === "true" ? "Yes" : "No"}</Badge></p>
 <p><strong>Disabled:</strong> <Badge variant={iface.disabled === "false" ? "default" : "destructive"}>{iface.disabled === "true" ? "Yes" : "No"}</Badge></p>
 <p><strong>RX Bytes:</strong> {iface["rx-byte"]} (Packets: {iface["rx-packet"]})</p>
 <p><strong>TX Bytes:</strong> {iface["tx-byte"]} (Packets: {iface["tx-packet"]})</p>
 {iface["last-link-up-time"] && <p><strong>Last Link Up:</strong> {iface["last-link-up-time"]}</p>}
 {iface["last-link-down-time"] && <p><strong>Last Link Down:</strong> {iface["last-link-down-time"]}</p>}
 {iface.comment && <p><strong>Comment:</strong> {iface.comment}</p>}
 <Separator className="my-2" />
 </div>
 ))}
 </ScrollArea>
 ) : (
 <p>No interface data available.</p>
 )}
 </DialogContent>
 </Dialog>
 </CardContent>
 </Card>
 );
}
