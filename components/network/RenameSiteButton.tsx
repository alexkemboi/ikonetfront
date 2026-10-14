"use client";

import { useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { renameSite } from "@/actions/network";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const NOUN = { regions: "region", locations: "location", stations: "station" } as const;

/** Pencil button and dialog that renames a region, location or station. */
export function RenameSiteButton({
  kind,
  id,
  name,
  extra = {},
  onRenamed,
}: {
  kind: keyof typeof NOUN;
  id: number;
  name: string;
  /** Other fields the update keeps as they are (a location's pin, a station's power and backhaul). */
  extra?: Record<string, unknown>;
  onRenamed: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(name);
  const [busy, setBusy] = useState(false);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const next = value.trim();
    if (!next || next === name) {
      setOpen(false);
      return;
    }
    setBusy(true);
    try {
      const res = await renameSite(kind, id, { ...extra, name: next });
      if (!res.success) {
        toast.error(`Could not rename the ${NOUN[kind]}`, { description: res.message });
        return;
      }
      toast.success(`Renamed to ${next}`);
      onRenamed(next);
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="icon" aria-label={`Rename ${name}`} onClick={() => { setValue(name); setOpen(true); }}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={save} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Rename {NOUN[kind]}</DialogTitle>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label htmlFor={`rename-${kind}-${id}`}>Name</Label>
              <Input id={`rename-${kind}-${id}`} value={value} maxLength={150} onChange={(e) => setValue(e.target.value)} disabled={busy} autoFocus />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
              <Button type="submit" disabled={busy || !value.trim()}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
