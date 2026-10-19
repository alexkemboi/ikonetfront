"use client";

import { useState } from "react";
import { toast } from "sonner";
import { changePppoeUsername } from "@/actions/customer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/dialog";

// What FreeRADIUS matches without escaping; the backend applies the same rule.
const PPPOE_USERNAME = /^[A-Za-z0-9 @._:/-]{1,64}$/;

interface ChangePppoeUsernameDialogProps {
 customerId: number;
 username: string;
}

export function ChangePppoeUsernameDialog({ customerId, username }: ChangePppoeUsernameDialogProps) {
 const [open, setOpen] = useState(false);
 const [value, setValue] = useState(username);
 const [saving, setSaving] = useState(false);

 const trimmed = value.trim();
 const error = !trimmed
 ? "Username is required"
 : !PPPOE_USERNAME.test(trimmed)
 ? "Letters, numbers, spaces and @ . _ - : / only (up to 64 characters)"
 : null;
 const unchanged = trimmed === username;

 async function handleSave() {
 if (error || unchanged) return;
 setSaving(true);
 try {
 const result = await changePppoeUsername(customerId, trimmed);
 if (result.success) {
 toast.success(`PPPoE username changed to "${trimmed}". The customer's router must dial this name.`);
 setOpen(false);
 } else {
 toast.error(result.message || "Failed to change the PPPoE username.");
 }
 } catch {
 toast.error("An unexpected error occurred.");
 } finally {
 setSaving(false);
 }
 }

 return (
 <Dialog
 open={open}
 onOpenChange={(next) => {
 setOpen(next);
 if (next) setValue(username);
 }}
 >
 <DialogTrigger asChild>
 <Button variant="outline">Change username</Button>
 </DialogTrigger>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Change PPPoE username</DialogTitle>
 <DialogDescription>
 Enter the name exactly as the customer&apos;s router dials it; spaces are allowed. The
 password, package and expiry stay the same. From now on the router must dial this name.
 </DialogDescription>
 </DialogHeader>
 <div className="space-y-2">
 <Label htmlFor="pppoeUsername">PPPoE username</Label>
 <Input
 id="pppoeUsername"
 value={value}
 onChange={(e) => setValue(e.target.value)}
 className={error ? "border-destructive" : ""}
 autoComplete="off"
 />
 {error ? (
 <p className="text-xs text-destructive">{error}</p>
 ) : (
 <p className="text-xs text-muted-foreground">Current: {username}</p>
 )}
 </div>
 <DialogFooter>
 <Button variant="outline" onClick={() => setOpen(false)}>
 Cancel
 </Button>
 <Button onClick={handleSave} disabled={saving || !!error || unchanged}>
 {saving ? "Saving..." : "Change username"}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 );
}
